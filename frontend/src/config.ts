// Detect environment: in Docker (nginx) use relative, dev use proxy
const isProduction = window.location.port === '80' || window.location.port === '' || window.location.port === '3002';
export const API_URL = isProduction ? '/api' : '/api';
