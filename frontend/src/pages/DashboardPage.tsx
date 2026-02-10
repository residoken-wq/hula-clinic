import { useEffect, useState } from 'react';
import { Row, Col, Spin, Tag } from 'antd';
import {
    TeamOutlined, CalendarOutlined, MedicineBoxOutlined,
    DollarOutlined, FileTextOutlined, AlertOutlined,
} from '@ant-design/icons';
import { fetchData } from '../utils/api';

interface DashStats {
    patients: { total: number; active: number; newToday: number };
    appointments: { total: number; completed: number; waiting: number; booked: number };
    pharmacy: { totalMedicines: number; expiringCount: number; lowStockCount: number };
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const [patients, appointments, pharmacy] = await Promise.all([
                fetchData('/patients/stats').catch(() => ({ total: 0, active: 0, newToday: 0 })),
                fetchData('/appointments/today').catch(() => ({ total: 0, completed: 0, waiting: 0, booked: 0 })),
                fetchData('/pharmacy/stats').catch(() => ({ totalMedicines: 0, expiringCount: 0, lowStockCount: 0 })),
            ]);
            setStats({ patients, appointments, pharmacy });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', paddingTop: 100 }}><Spin size="large" /></div>;

    const statCards = [
        {
            icon: <TeamOutlined />,
            bg: 'linear-gradient(135deg, #0891b2, #06b6d4)',
            label: 'Bệnh nhân',
            value: stats?.patients?.total || 0,
            extra: `+${stats?.patients?.newToday || 0} hôm nay`,
        },
        {
            icon: <CalendarOutlined />,
            bg: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            label: 'Lịch hẹn hôm nay',
            value: stats?.appointments?.total || 0,
            extra: `${stats?.appointments?.completed || 0} đã khám`,
        },
        {
            icon: <MedicineBoxOutlined />,
            bg: 'linear-gradient(135deg, #10b981, #34d399)',
            label: 'Chờ khám',
            value: stats?.appointments?.waiting || 0,
            extra: `${stats?.appointments?.booked || 0} chưa đến`,
        },
        {
            icon: <FileTextOutlined />,
            bg: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
            label: 'Thuốc trong kho',
            value: stats?.pharmacy?.totalMedicines || 0,
            extra: stats?.pharmacy?.expiringCount ? `${stats.pharmacy.expiringCount} sắp hết hạn` : 'Ổn định',
        },
    ];

    return (
        <div>
            <div className="page-header">
                <h1>🏥 Bảng điều khiển</h1>
                <Tag color="cyan">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Tag>
            </div>

            <div className="stats-grid">
                {statCards.map((card, i) => (
                    <div className="stat-card" key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div className="stat-value">{card.value}</div>
                                <div className="stat-label">{card.label}</div>
                                <div style={{ color: '#22d3ee', fontSize: 12, marginTop: 4 }}>{card.extra}</div>
                            </div>
                            <div className="stat-icon" style={{ background: card.bg, color: 'white' }}>
                                {card.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Alerts section */}
            {(stats?.pharmacy?.expiringCount > 0 || stats?.pharmacy?.lowStockCount > 0) && (
                <div className="stat-card" style={{ marginBottom: 16, borderColor: '#f59e0b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <AlertOutlined style={{ color: '#f59e0b', fontSize: 18 }} />
                        <span style={{ fontWeight: 600, color: '#f59e0b' }}>Cảnh báo Kho thuốc</span>
                    </div>
                    {stats?.pharmacy?.expiringCount > 0 && (
                        <p style={{ color: '#94a3b8', margin: '4px 0' }}>⚠️ {stats.pharmacy.expiringCount} thuốc sắp hết hạn trong 30 ngày</p>
                    )}
                    {stats?.pharmacy?.lowStockCount > 0 && (
                        <p style={{ color: '#94a3b8', margin: '4px 0' }}>🔴 {stats.pharmacy.lowStockCount} thuốc dưới mức tồn kho tối thiểu</p>
                    )}
                </div>
            )}

            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <div className="stat-card">
                        <h3 style={{ marginBottom: 16, color: '#e2e8f0' }}>📋 Hướng dẫn nhanh</h3>
                        <div style={{ color: '#94a3b8', lineHeight: 2 }}>
                            <p>1. <strong>Bệnh nhân</strong> → Đăng ký / tìm kiếm bệnh nhân</p>
                            <p>2. <strong>Lịch hẹn</strong> → Đặt lịch khám cho bệnh nhân</p>
                            <p>3. <strong>Bệnh án</strong> → Tạo bệnh án, kê đơn thuốc</p>
                            <p>4. <strong>Kho thuốc</strong> → Nhập thuốc, phát thuốc theo đơn</p>
                            <p>5. <strong>Thanh toán</strong> → Tạo hóa đơn, thu tiền</p>
                            <p>6. <strong>Tài chính</strong> → Theo dõi thu chi</p>
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    );
}
