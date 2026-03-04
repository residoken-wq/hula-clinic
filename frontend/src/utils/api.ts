import axios from 'axios';
import { API_URL } from '../config';
import { encryptPayload, decryptPayload } from './crypto';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
    async (config) => {
        const token = localStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;

        // --- Transport Encryption: encrypt request body ---
        if (config.data && ['post', 'put', 'patch'].includes(config.method || '')) {
            try {
                const plaintext = JSON.stringify(config.data);
                const encrypted = await encryptPayload(plaintext);
                config.data = { _encrypted: encrypted };
                config.headers['X-Encrypted'] = '1';
            } catch (err) {
                console.warn('Encryption failed, sending plaintext:', err);
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    async (response) => {
        // --- Transport Decryption: decrypt encrypted response ---
        if (response.headers['x-encrypted'] === '1' && response.data?._encrypted) {
            try {
                const plaintext = await decryptPayload(response.data._encrypted);
                response.data = JSON.parse(plaintext);
            } catch (err) {
                console.warn('Decryption failed, using raw data:', err);
            }
        }
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

// Helper
export async function fetchData(url: string, params?: any) {
    const res = await api.get(url, { params });
    return res.data;
}
