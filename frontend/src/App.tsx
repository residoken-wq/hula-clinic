import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, theme, ConfigProvider, Button, Dropdown, Avatar, Badge, Space } from 'antd';
import {
    DashboardOutlined, TeamOutlined, CalendarOutlined,
    FileTextOutlined, MedicineBoxOutlined, AppstoreOutlined,
    DollarOutlined, UserOutlined, SettingOutlined,
    LogoutOutlined, BellOutlined, SolutionOutlined,
    ExperimentOutlined, IdcardOutlined, CheckSquareOutlined,
} from '@ant-design/icons';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

const { Sider, Header, Content } = Layout;

function AppLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [user, setUser] = useState<any>(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const menuItems = [
        { key: '/', icon: <DashboardOutlined />, label: 'Bảng điều khiển' },
        { type: 'divider' as const },
        {
            key: 'clinic-group', label: 'PHÒNG KHÁM', type: 'group' as const, children: [
                { key: '/patients', icon: <TeamOutlined />, label: 'Bệnh nhân' },
                { key: '/appointments', icon: <CalendarOutlined />, label: 'Lịch hẹn' },
                { key: '/medical-records', icon: <FileTextOutlined />, label: 'Bệnh án' },
                { key: '/pharmacy', icon: <MedicineBoxOutlined />, label: 'Kho thuốc' },
                { key: '/services', icon: <ExperimentOutlined />, label: 'Dịch vụ' },
                { key: '/billing', icon: <DollarOutlined />, label: 'Thanh toán' },
            ]
        },
        {
            key: 'mgmt-group', label: 'QUẢN LÝ', type: 'group' as const, children: [
                { key: '/finance', icon: <DollarOutlined />, label: 'Tài chính' },
                { key: '/hr', icon: <IdcardOutlined />, label: 'Nhân sự' },
                { key: '/tasks', icon: <CheckSquareOutlined />, label: 'Công việc' },
            ]
        },
        {
            key: 'sys-group', label: 'HỆ THỐNG', type: 'group' as const, children: [
                { key: '/users', icon: <UserOutlined />, label: 'Tài khoản' },
                { key: '/settings', icon: <SettingOutlined />, label: 'Cài đặt' },
            ]
        },
    ];

    const userMenu = {
        items: [
            { key: 'profile', label: user?.full_name || user?.username, disabled: true },
            { type: 'divider' as const },
            { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: handleLogout },
        ],
    };

    return (
        <Layout className="app-layout" style={{ minHeight: '100vh' }}>
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                width={240}
                theme="dark"
                style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100, overflow: 'auto' }}
            >
                <div className="sidebar-logo">
                    {!collapsed ? (
                        <>
                            <h2>🏥 Hula Clinic</h2>
                            <span>Quản lý phòng khám</span>
                        </>
                    ) : (
                        <h2>🏥</h2>
                    )}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={({ key }) => navigate(key)}
                />
            </Sider>

            <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
                <Header className="app-header" style={{
                    background: '#1e293b',
                    borderBottom: '1px solid #334155',
                    padding: '0 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 16,
                    height: 56,
                }}>
                    <Badge count={0} size="small">
                        <BellOutlined style={{ fontSize: 18, color: '#94a3b8', cursor: 'pointer' }} />
                    </Badge>
                    <Dropdown menu={userMenu} trigger={['click']}>
                        <Space style={{ cursor: 'pointer' }}>
                            <Avatar style={{ background: '#0891b2' }} icon={<UserOutlined />} />
                            {!collapsed && <span style={{ color: '#e2e8f0', fontSize: 14 }}>{user?.full_name || 'Admin'}</span>}
                        </Space>
                    </Dropdown>
                </Header>

                <Content style={{ padding: 24, minHeight: 'calc(100vh - 56px)', background: '#0f172a' }}>
                    <Routes>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/patients" element={<PlaceholderPage title="Bệnh nhân" icon="👤" />} />
                        <Route path="/appointments" element={<PlaceholderPage title="Lịch hẹn" icon="📅" />} />
                        <Route path="/medical-records" element={<PlaceholderPage title="Bệnh án" icon="📋" />} />
                        <Route path="/pharmacy" element={<PlaceholderPage title="Kho thuốc" icon="💊" />} />
                        <Route path="/services" element={<PlaceholderPage title="Dịch vụ" icon="🔬" />} />
                        <Route path="/billing" element={<PlaceholderPage title="Thanh toán" icon="💰" />} />
                        <Route path="/finance" element={<PlaceholderPage title="Tài chính" icon="📊" />} />
                        <Route path="/hr" element={<PlaceholderPage title="Nhân sự" icon="👔" />} />
                        <Route path="/tasks" element={<PlaceholderPage title="Công việc" icon="✅" />} />
                        <Route path="/users" element={<PlaceholderPage title="Tài khoản" icon="🔐" />} />
                        <Route path="/settings" element={<PlaceholderPage title="Cài đặt" icon="⚙️" />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </Content>
            </Layout>
        </Layout>
    );
}

function PlaceholderPage({ title, icon }: { title: string; icon: string }) {
    return (
        <div>
            <div className="page-header">
                <h1>{icon} {title}</h1>
            </div>
            <div className="stat-card" style={{ textAlign: 'center', padding: 60 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
                <h2 style={{ color: '#e2e8f0', marginBottom: 8 }}>Module {title}</h2>
                <p style={{ color: '#94a3b8' }}>Trang này sẽ được phát triển trong Phase 2</p>
            </div>
        </div>
    );
}

export default function App() {
    const [isAuthed, setIsAuthed] = useState(!!localStorage.getItem('token'));

    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                    colorPrimary: '#0891b2',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                    borderRadius: 8,
                    colorBgContainer: '#1e293b',
                    colorBgElevated: '#1e293b',
                    colorBorder: '#334155',
                    colorText: '#f1f5f9',
                    colorTextSecondary: '#94a3b8',
                },
            }}
        >
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={
                        isAuthed ? <Navigate to="/" /> :
                            <LoginPage onLogin={() => setIsAuthed(true)} />
                    } />
                    <Route path="/*" element={
                        isAuthed ? <AppLayout /> : <Navigate to="/login" />
                    } />
                </Routes>
            </BrowserRouter>
        </ConfigProvider>
    );
}
