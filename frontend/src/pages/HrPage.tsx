import { useState, useEffect } from 'react';
import { Tabs, Card } from 'antd';
import {
    TeamOutlined, ClockCircleOutlined, CalendarOutlined, DollarOutlined, LaptopOutlined,
    CheckOutlined, CloseOutlined,
} from '@ant-design/icons';
import { fetchData } from '../utils/api';
import { fmtMoney } from '../components/hr/utils';
import EmployeesTab from '../components/hr/EmployeesTab';
import AttendanceTab from '../components/hr/AttendanceTab';
import LeaveTab from '../components/hr/LeaveTab';
import PayrollTab from '../components/hr/PayrollTab';
import AssetsTab from '../components/hr/AssetsTab';

const { TabPane } = Tabs;

export default function HrPage() {
    const [stats, setStats] = useState<any>({});

    useEffect(() => { loadStats(); }, []);

    const loadStats = async () => {
        try { setStats(await fetchData('/hr/stats')); } catch { }
    };

    const statCards = [
        { label: 'Tổng nhân viên', value: stats.total || 0, color: '#0891b2', icon: <TeamOutlined /> },
        { label: 'Đang làm', value: stats.active || 0, color: '#10b981', icon: <CheckOutlined /> },
        { label: 'Nghỉ việc', value: stats.resigned || 0, color: '#ef4444', icon: <CloseOutlined /> },
        { label: 'Tổng lương tháng', value: fmtMoney(stats.monthlyPayroll), color: '#f59e0b', icon: <DollarOutlined />, suffix: '₫' },
    ];

    return (
        <div>
            <div className="page-header"><h1>👔 Quản lý nhân sự</h1></div>

            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 16 }}>
                {statCards.map((s, i) => (
                    <div className="stat-card" key={i} style={{ padding: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 20, color: s.color }}>{s.icon}</span>
                            <div>
                                <div className="stat-value" style={{ fontSize: 22, color: s.color }}>{s.value}{s.suffix || ''}</div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Card style={{ background: '#1e293b', border: '1px solid #334155' }}>
                <Tabs defaultActiveKey="employees" type="card">
                    <TabPane tab={<span><TeamOutlined /> Nhân viên</span>} key="employees">
                        <EmployeesTab onUpdate={loadStats} />
                    </TabPane>
                    <TabPane tab={<span><ClockCircleOutlined /> Chấm công</span>} key="attendance">
                        <AttendanceTab />
                    </TabPane>
                    <TabPane tab={<span><CalendarOutlined /> Nghỉ phép</span>} key="leave">
                        <LeaveTab />
                    </TabPane>
                    <TabPane tab={<span><DollarOutlined /> Bảng lương</span>} key="payroll">
                        <PayrollTab onUpdate={loadStats} />
                    </TabPane>
                    <TabPane tab={<span><LaptopOutlined /> Tài sản</span>} key="assets">
                        <AssetsTab />
                    </TabPane>
                </Tabs>
            </Card>
        </div>
    );
}
