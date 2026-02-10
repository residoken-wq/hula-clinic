import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import api from '../utils/api';

export default function LoginPage({ onLogin }: { onLogin: (data: any) => void }) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values: any) => {
        setLoading(true);
        try {
            const res = await api.post('/auth/login', values);
            localStorage.setItem('token', res.data.access_token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            onLogin(res.data.user);
            message.success('Đăng nhập thành công!');
        } catch (err: any) {
            message.error(err.response?.data?.message || 'Sai tên đăng nhập hoặc mật khẩu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <MedicineBoxOutlined style={{ fontSize: 48, color: '#0891b2' }} />
                </div>
                <h1>Hula Clinic</h1>
                <p className="subtitle">Hệ thống Quản lý Phòng Khám</p>
                <Form onFinish={handleSubmit} size="large" layout="vertical">
                    <Form.Item name="username" rules={[{ required: true, message: 'Nhập tên đăng nhập' }]}>
                        <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" autoFocus />
                    </Form.Item>
                    <Form.Item name="password" rules={[{ required: true, message: 'Nhập mật khẩu' }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 48, fontSize: 16 }}>
                            Đăng nhập
                        </Button>
                    </Form.Item>
                </Form>
                <div style={{ textAlign: 'center', color: '#64748b', fontSize: 12, marginTop: 16 }}>
                    Mặc định: admin / admin123
                </div>
            </div>
        </div>
    );
}
