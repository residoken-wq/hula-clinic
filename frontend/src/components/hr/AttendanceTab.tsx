import { useState, useEffect } from 'react';
import { Table, Select, Tag, Space, message, DatePicker } from 'antd';
import api, { fetchData } from '../../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;

export default function AttendanceTab() {
    const [data, setData] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [month, setMonth] = useState(dayjs().format('YYYY-MM'));

    useEffect(() => { load(); loadEmployees(); }, [month]);

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetchData('/hr/attendance/monthly', { month });
            setData(Array.isArray(res) ? res : []);
        } catch { } finally { setLoading(false); }
    };

    const loadEmployees = async () => {
        try {
            const res = await fetchData('/hr/employees', { status: 'ACTIVE' });
            setEmployees(Array.isArray(res) ? res : []);
        } catch { }
    };

    const handleCheckIn = async (employeeId: number) => {
        try {
            await api.post('/hr/attendance/check-in', { employee_id: employeeId });
            message.success('Check-in thành công');
            load();
        } catch { message.error('Lỗi check-in'); }
    };

    const handleCheckOut = async (employeeId: number) => {
        try {
            await api.post('/hr/attendance/check-out', { employee_id: employeeId });
            message.success('Check-out thành công');
            load();
        } catch { message.error('Lỗi check-out'); }
    };

    const columns = [
        { title: 'Ngày', dataIndex: 'date', width: 110, render: (v: string) => dayjs(v).format('DD/MM/YYYY') },
        { title: 'Nhân viên', width: 160, render: (_: any, r: any) => r.employee?.full_name || `NV #${r.employee_id}` },
        { title: 'Check-in', dataIndex: 'check_in', width: 100, render: (v: string) => v ? <Tag color="green">{v?.slice(0, 5)}</Tag> : '—' },
        { title: 'Check-out', dataIndex: 'check_out', width: 100, render: (v: string) => v ? <Tag color="blue">{v?.slice(0, 5)}</Tag> : '—' },
        { title: 'Giờ làm', dataIndex: 'work_hours', width: 80, render: (v: number) => v ? `${v.toFixed(1)}h` : '—' },
        {
            title: 'Trạng thái', dataIndex: 'status', width: 100,
            render: (v: string) => {
                const m: any = { PRESENT: { c: 'green', l: 'Có mặt' }, ABSENT: { c: 'red', l: 'Vắng' }, LATE: { c: 'orange', l: 'Muộn' }, HALF_DAY: { c: 'cyan', l: 'Nửa ngày' } };
                return <Tag color={m[v]?.c || 'default'}>{m[v]?.l || v}</Tag>;
            }
        },
        { title: 'Ghi chú', dataIndex: 'note', width: 150 },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Space>
                    <span style={{ color: '#94a3b8' }}>Tháng:</span>
                    <DatePicker picker="month" value={dayjs(month)} onChange={v => v && setMonth(v.format('YYYY-MM'))} format="MM/YYYY" />
                </Space>
                <Space>
                    <Select placeholder="Chọn NV để check-in" style={{ width: 200 }}
                        showSearch optionFilterProp="children"
                        onSelect={(v: number) => handleCheckIn(v)}>
                        {employees.map(e => <Option key={e.id} value={e.id}>{e.full_name}</Option>)}
                    </Select>
                    <Select placeholder="Chọn NV để check-out" style={{ width: 200 }}
                        showSearch optionFilterProp="children"
                        onSelect={(v: number) => handleCheckOut(v)}>
                        {employees.map(e => <Option key={e.id} value={e.id}>{e.full_name}</Option>)}
                    </Select>
                </Space>
            </div>
            <Table columns={columns} dataSource={data} loading={loading}
                rowKey="id" pagination={{ pageSize: 31 }} size="middle" />
        </div>
    );
}
