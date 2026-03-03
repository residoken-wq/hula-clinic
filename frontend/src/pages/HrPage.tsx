import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, message, Tabs, DatePicker, Card, InputNumber, Popconfirm, Statistic, Row, Col } from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined,
    TeamOutlined, ClockCircleOutlined, CalendarOutlined, DollarOutlined, LaptopOutlined,
    SearchOutlined, ThunderboltOutlined, LoginOutlined, LogoutOutlined,
} from '@ant-design/icons';
import api, { fetchData } from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TabPane } = Tabs;

const fmtMoney = (v: number) => new Intl.NumberFormat('vi-VN').format(v || 0);

// ==================== MAIN PAGE ====================
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

// ==================== TAB 1: EMPLOYEES ====================
function EmployeesTab({ onUpdate }: { onUpdate: () => void }) {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [filterDept, setFilterDept] = useState<string>();
    const [filterStatus, setFilterStatus] = useState<string>();
    const [form] = Form.useForm();

    useEffect(() => { load(); }, [filterDept, filterStatus]);

    const load = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (filterDept) params.department = filterDept;
            if (filterStatus) params.status = filterStatus;
            const res = await fetchData('/hr/employees', params);
            setEmployees(Array.isArray(res) ? res : []);
        } catch { message.error('Lỗi tải danh sách'); }
        finally { setLoading(false); }
    };

    const openModal = (emp?: any) => {
        setEditing(emp || null);
        if (emp) {
            form.setFieldsValue({
                ...emp,
                date_of_birth: emp.date_of_birth ? dayjs(emp.date_of_birth) : null,
                join_date: emp.join_date ? dayjs(emp.join_date) : null,
            });
        } else {
            form.resetFields();
        }
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            if (values.date_of_birth) values.date_of_birth = values.date_of_birth.format('YYYY-MM-DD');
            if (values.join_date) values.join_date = values.join_date.format('YYYY-MM-DD');

            if (editing) {
                await api.put(`/hr/employees/${editing.id}`, values);
                message.success('Cập nhật thành công');
            } else {
                await api.post('/hr/employees', values);
                message.success('Tạo nhân viên thành công');
            }
            setModalOpen(false);
            form.resetFields();
            load();
            onUpdate();
        } catch (err: any) {
            if (err.response) message.error(err.response.data.message || 'Lỗi');
        }
    };

    const handleDelete = async (id: number) => {
        await api.delete(`/hr/employees/${id}`);
        message.success('Đã xóa');
        load();
        onUpdate();
    };

    const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

    const columns = [
        { title: 'Mã NV', dataIndex: 'employee_code', width: 100, render: (v: string) => <strong style={{ color: '#22d3ee' }}>{v}</strong> },
        { title: 'Họ tên', dataIndex: 'full_name', width: 160 },
        { title: 'Chức vụ', dataIndex: 'position', width: 120 },
        { title: 'Phòng ban', dataIndex: 'department', width: 120 },
        { title: 'SĐT', dataIndex: 'phone', width: 120 },
        {
            title: 'Lương CB', dataIndex: 'base_salary', width: 120, align: 'right' as const,
            render: (v: number) => <span style={{ color: '#10b981' }}>{fmtMoney(v)}</span>
        },
        {
            title: 'Trạng thái', dataIndex: 'status', width: 100,
            render: (v: string) => {
                const color = v === 'ACTIVE' ? 'green' : v === 'RESIGNED' ? 'red' : 'orange';
                const label = v === 'ACTIVE' ? 'Đang làm' : v === 'RESIGNED' ? 'Nghỉ việc' : 'Tạm nghỉ';
                return <Tag color={color}>{label}</Tag>;
            }
        },
        {
            title: '', width: 100, render: (_: any, r: any) => (
                <Space size="small">
                    <Button size="small" icon={<EditOutlined />} onClick={() => openModal(r)} />
                    <Popconfirm title="Xóa nhân viên này?" onConfirm={() => handleDelete(r.id)}
                        okText="Xóa" cancelText="Hủy">
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Space>
                    <Select allowClear placeholder="Phòng ban" style={{ width: 160 }}
                        value={filterDept} onChange={setFilterDept}>
                        {departments.map(d => <Option key={d} value={d}>{d}</Option>)}
                    </Select>
                    <Select allowClear placeholder="Trạng thái" style={{ width: 140 }}
                        value={filterStatus} onChange={setFilterStatus}>
                        <Option value="ACTIVE">Đang làm</Option>
                        <Option value="INACTIVE">Tạm nghỉ</Option>
                        <Option value="RESIGNED">Nghỉ việc</Option>
                    </Select>
                </Space>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Thêm nhân viên</Button>
            </div>

            <Table columns={columns} dataSource={employees} loading={loading}
                rowKey="id" pagination={{ pageSize: 20 }} size="middle" />

            <Modal title={editing ? '✏️ Sửa nhân viên' : '➕ Thêm nhân viên mới'}
                open={modalOpen} onCancel={() => { setModalOpen(false); form.resetFields(); }}
                onOk={handleSave} width={700} okText={editing ? 'Cập nhật' : 'Tạo'} cancelText="Hủy">
                <Form form={form} layout="vertical">
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="full_name" label="Họ tên" rules={[{ required: true }]}><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="employee_code" label="Mã NV"><Input placeholder="Tự tạo nếu để trống" /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="position" label="Chức vụ"><Input placeholder="Bác sĩ, Y tá..." /></Form.Item></Col>
                        <Col span={8}><Form.Item name="department" label="Phòng ban"><Input placeholder="Khoa Nội..." /></Form.Item></Col>
                        <Col span={8}>
                            <Form.Item name="gender" label="Giới tính">
                                <Select allowClear><Option value="Nam">Nam</Option><Option value="Nữ">Nữ</Option></Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="phone" label="SĐT"><Input /></Form.Item></Col>
                        <Col span={8}><Form.Item name="email" label="Email"><Input /></Form.Item></Col>
                        <Col span={8}><Form.Item name="date_of_birth" label="Ngày sinh"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="base_salary" label="Lương cơ bản"><InputNumber style={{ width: '100%' }} min={0} formatter={v => fmtMoney(Number(v))} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="join_date" label="Ngày vào"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                        <Col span={8}>
                            <Form.Item name="status" label="Trạng thái" initialValue="ACTIVE">
                                <Select><Option value="ACTIVE">Đang làm</Option><Option value="INACTIVE">Tạm nghỉ</Option><Option value="RESIGNED">Nghỉ việc</Option></Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="id_number" label="CCCD/CMND"><Input /></Form.Item></Col>
                        <Col span={8}><Form.Item name="tax_code" label="Mã số thuế"><Input /></Form.Item></Col>
                        <Col span={8}><Form.Item name="insurance_number" label="Số BHXH"><Input /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="bank_account" label="Số TK ngân hàng"><Input /></Form.Item></Col>
                        <Col span={8}><Form.Item name="bank_name" label="Ngân hàng"><Input placeholder="Vietcombank..." /></Form.Item></Col>
                        <Col span={8}><Form.Item name="address" label="Địa chỉ"><Input /></Form.Item></Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
}

// ==================== TAB 2: ATTENDANCE ====================
function AttendanceTab() {
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

// ==================== TAB 3: LEAVE ====================
function LeaveTab() {
    const [data, setData] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => { load(); loadEmployees(); }, []);

    const load = async () => {
        setLoading(true);
        try { setData(await fetchData('/hr/leaves')); } catch { } finally { setLoading(false); }
    };

    const loadEmployees = async () => {
        try { setEmployees(await fetchData('/hr/employees', { status: 'ACTIVE' })); } catch { }
    };

    const handleCreate = async () => {
        try {
            const values = await form.validateFields();
            values.start_date = values.start_date.format('YYYY-MM-DD');
            values.end_date = values.end_date.format('YYYY-MM-DD');
            const start = dayjs(values.start_date);
            const end = dayjs(values.end_date);
            values.days = end.diff(start, 'day') + 1;
            await api.post('/hr/leaves', values);
            message.success('Tạo đơn nghỉ phép thành công');
            setModalOpen(false);
            form.resetFields();
            load();
        } catch (err: any) {
            if (err.response) message.error(err.response.data.message || 'Lỗi');
        }
    };

    const handleApprove = async (id: number) => {
        await api.post(`/hr/leaves/${id}/approve`);
        message.success('Đã duyệt'); load();
    };

    const handleReject = async (id: number) => {
        await api.post(`/hr/leaves/${id}/reject`);
        message.success('Đã từ chối'); load();
    };

    const columns = [
        { title: 'Nhân viên', width: 160, render: (_: any, r: any) => r.employee?.full_name || `NV #${r.employee_id}` },
        {
            title: 'Loại', dataIndex: 'leave_type', width: 110,
            render: (v: string) => {
                const m: any = { ANNUAL: 'Phép năm', SICK: 'Ốm đau', PERSONAL: 'Việc riêng', MATERNITY: 'Thai sản' };
                return <Tag color="blue">{m[v] || v}</Tag>;
            }
        },
        { title: 'Từ ngày', dataIndex: 'start_date', width: 110, render: (v: string) => dayjs(v).format('DD/MM/YYYY') },
        { title: 'Đến ngày', dataIndex: 'end_date', width: 110, render: (v: string) => dayjs(v).format('DD/MM/YYYY') },
        { title: 'Số ngày', dataIndex: 'days', width: 80, align: 'center' as const },
        { title: 'Lý do', dataIndex: 'reason', width: 200 },
        {
            title: 'Trạng thái', dataIndex: 'status', width: 100,
            render: (v: string) => {
                const c = v === 'APPROVED' ? 'green' : v === 'REJECTED' ? 'red' : 'orange';
                const l = v === 'APPROVED' ? 'Đã duyệt' : v === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt';
                return <Tag color={c}>{l}</Tag>;
            }
        },
        {
            title: '', width: 140, render: (_: any, r: any) => r.status === 'PENDING' ? (
                <Space size="small">
                    <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleApprove(r.id)}>Duyệt</Button>
                    <Button size="small" danger icon={<CloseOutlined />} onClick={() => handleReject(r.id)}>Từ chối</Button>
                </Space>
            ) : null
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>Tạo đơn nghỉ phép</Button>
            </div>
            <Table columns={columns} dataSource={data} loading={loading}
                rowKey="id" pagination={{ pageSize: 20 }} size="middle" />

            <Modal title="➕ Tạo đơn nghỉ phép" open={modalOpen}
                onCancel={() => { setModalOpen(false); form.resetFields(); }}
                onOk={handleCreate} okText="Tạo" cancelText="Hủy">
                <Form form={form} layout="vertical">
                    <Form.Item name="employee_id" label="Nhân viên" rules={[{ required: true }]}>
                        <Select showSearch optionFilterProp="children" placeholder="Chọn nhân viên">
                            {employees.map(e => <Option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="leave_type" label="Loại nghỉ" rules={[{ required: true }]}>
                        <Select>
                            <Option value="ANNUAL">Phép năm</Option>
                            <Option value="SICK">Ốm đau</Option>
                            <Option value="PERSONAL">Việc riêng</Option>
                            <Option value="MATERNITY">Thai sản</Option>
                        </Select>
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="start_date" label="Từ ngày" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                        <Col span={12}><Form.Item name="end_date" label="Đến ngày" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                    </Row>
                    <Form.Item name="reason" label="Lý do"><Input.TextArea rows={3} /></Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

// ==================== TAB 4: PAYROLL ====================
function PayrollTab({ onUpdate }: { onUpdate: () => void }) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [employees, setEmployees] = useState<any[]>([]);
    const [form] = Form.useForm();

    useEffect(() => { load(); loadEmployees(); }, [month]);

    const load = async () => {
        setLoading(true);
        try { setData(await fetchData('/hr/payrolls', { month })); } catch { } finally { setLoading(false); }
    };

    const loadEmployees = async () => {
        try { setEmployees(await fetchData('/hr/employees', { status: 'ACTIVE' })); } catch { }
    };

    const handleGenerate = async () => {
        try {
            const result = await api.post('/hr/payrolls/generate', { month });
            message.success(`Đã tạo ${result.data.created} bảng lương, bỏ qua ${result.data.skipped} (đã tồn tại)`);
            load();
            onUpdate();
        } catch (err: any) {
            message.error(err.response?.data?.message || 'Lỗi tạo bảng lương');
        }
    };

    const openModal = (item?: any) => {
        setEditing(item || null);
        if (item) {
            form.setFieldsValue(item);
        } else {
            form.resetFields();
            form.setFieldsValue({ month, status: 'DRAFT' });
        }
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            if (editing) {
                await api.put(`/hr/payrolls/${editing.id}`, values);
                message.success('Cập nhật thành công');
            } else {
                await api.post('/hr/payrolls', values);
                message.success('Tạo thành công');
            }
            setModalOpen(false);
            load();
            onUpdate();
        } catch (err: any) {
            if (err.response) message.error(err.response.data.message || 'Lỗi');
        }
    };

    const handleDelete = async (id: number) => {
        await api.delete(`/hr/payrolls/${id}`);
        message.success('Đã xóa'); load(); onUpdate();
    };

    const totalNet = data.reduce((s, p) => s + Number(p.net_salary || 0), 0);

    const columns = [
        { title: 'Nhân viên', width: 160, render: (_: any, r: any) => r.employee?.full_name || `NV #${r.employee_id}` },
        { title: 'Lương CB', dataIndex: 'base_salary', width: 110, align: 'right' as const, render: (v: number) => fmtMoney(v) },
        { title: 'Phụ cấp', dataIndex: 'allowance', width: 100, align: 'right' as const, render: (v: number) => fmtMoney(v) },
        { title: 'OT', dataIndex: 'overtime_pay', width: 100, align: 'right' as const, render: (v: number) => fmtMoney(v) },
        { title: 'Thưởng', dataIndex: 'bonus', width: 100, align: 'right' as const, render: (v: number) => fmtMoney(v) },
        { title: 'Khấu trừ', dataIndex: 'deduction', width: 100, align: 'right' as const, render: (v: number) => <span style={{ color: '#ef4444' }}>{fmtMoney(v)}</span> },
        { title: 'Bảo hiểm', dataIndex: 'insurance', width: 100, align: 'right' as const, render: (v: number) => <span style={{ color: '#ef4444' }}>{fmtMoney(v)}</span> },
        { title: 'Thuế', dataIndex: 'tax', width: 90, align: 'right' as const, render: (v: number) => <span style={{ color: '#ef4444' }}>{fmtMoney(v)}</span> },
        { title: 'Thực nhận', dataIndex: 'net_salary', width: 120, align: 'right' as const, render: (v: number) => <strong style={{ color: '#10b981' }}>{fmtMoney(v)}</strong> },
        { title: 'Ngày công', dataIndex: 'work_days', width: 80, align: 'center' as const },
        {
            title: 'TT', dataIndex: 'status', width: 90,
            render: (v: string) => {
                const c = v === 'PAID' ? 'green' : v === 'CONFIRMED' ? 'blue' : 'orange';
                return <Tag color={c}>{v}</Tag>;
            }
        },
        {
            title: '', width: 80, render: (_: any, r: any) => (
                <Space size="small">
                    <Button size="small" icon={<EditOutlined />} onClick={() => openModal(r)} />
                    <Popconfirm title="Xóa?" onConfirm={() => handleDelete(r.id)} okText="Xóa" cancelText="Hủy">
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Space>
                    <span style={{ color: '#94a3b8' }}>Tháng:</span>
                    <DatePicker picker="month" value={dayjs(month)} onChange={v => v && setMonth(v.format('YYYY-MM'))} format="MM/YYYY" />
                    <span style={{ color: '#64748b' }}>|</span>
                    <span style={{ color: '#94a3b8' }}>Tổng thực nhận:</span>
                    <strong style={{ color: '#10b981', fontSize: 16 }}>{fmtMoney(totalNet)} ₫</strong>
                    <span style={{ color: '#64748b' }}>({data.length} phiếu)</span>
                </Space>
                <Space>
                    <Popconfirm title={`Tạo bảng lương tháng ${month} cho tất cả NV?`} onConfirm={handleGenerate}
                        okText="Tạo" cancelText="Hủy">
                        <Button type="primary" icon={<ThunderboltOutlined />}>Tạo bảng lương tháng</Button>
                    </Popconfirm>
                    <Button icon={<PlusOutlined />} onClick={() => openModal()}>Thêm thủ công</Button>
                </Space>
            </div>

            <Table columns={columns} dataSource={data} loading={loading}
                rowKey="id" pagination={false} size="middle" scroll={{ x: 1300 }} />

            <Modal title={editing ? '✏️ Sửa phiếu lương' : '➕ Thêm phiếu lương'}
                open={modalOpen} onCancel={() => { setModalOpen(false); form.resetFields(); }}
                onOk={handleSave} width={650} okText={editing ? 'Cập nhật' : 'Tạo'} cancelText="Hủy">
                <Form form={form} layout="vertical">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="employee_id" label="Nhân viên" rules={[{ required: true }]}>
                                <Select showSearch optionFilterProp="children" placeholder="Chọn NV" disabled={!!editing}>
                                    {employees.map(e => <Option key={e.id} value={e.id}>{e.full_name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={6}><Form.Item name="month" label="Tháng"><Input /></Form.Item></Col>
                        <Col span={6}>
                            <Form.Item name="status" label="Trạng thái">
                                <Select><Option value="DRAFT">Nháp</Option><Option value="CONFIRMED">Xác nhận</Option><Option value="PAID">Đã trả</Option></Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="base_salary" label="Lương CB"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="allowance" label="Phụ cấp"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="overtime_pay" label="OT"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="bonus" label="Thưởng"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="deduction" label="Khấu trừ"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="insurance" label="Bảo hiểm"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="tax" label="Thuế TNCN"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="work_days" label="Ngày công"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="overtime_hours" label="Giờ OT"><InputNumber style={{ width: '100%' }} min={0} step={0.5} /></Form.Item></Col>
                    </Row>
                    <Form.Item name="note" label="Ghi chú"><Input.TextArea rows={2} /></Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

// ==================== TAB 5: ASSETS ====================
function AssetsTab() {
    const [data, setData] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [filterCat, setFilterCat] = useState<string>();
    const [form] = Form.useForm();

    useEffect(() => { load(); loadEmployees(); }, [filterCat]);

    const load = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (filterCat) params.category = filterCat;
            setData(await fetchData('/hr/assets', params));
        } catch { } finally { setLoading(false); }
    };

    const loadEmployees = async () => {
        try { setEmployees(await fetchData('/hr/employees')); } catch { }
    };

    const openModal = (item?: any) => {
        setEditing(item || null);
        if (item) {
            form.setFieldsValue({
                ...item,
                assigned_date: item.assigned_date ? dayjs(item.assigned_date) : null,
                return_date: item.return_date ? dayjs(item.return_date) : null,
            });
        } else {
            form.resetFields();
        }
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            if (values.assigned_date) values.assigned_date = values.assigned_date.format('YYYY-MM-DD');
            if (values.return_date) values.return_date = values.return_date.format('YYYY-MM-DD');

            if (editing) {
                await api.put(`/hr/assets/${editing.id}`, values);
                message.success('Cập nhật thành công');
            } else {
                await api.post('/hr/assets', values);
                message.success('Thêm tài sản thành công');
            }
            setModalOpen(false);
            form.resetFields();
            load();
        } catch (err: any) {
            if (err.response) message.error(err.response.data.message || 'Lỗi');
        }
    };

    const handleDelete = async (id: number) => {
        await api.delete(`/hr/assets/${id}`);
        message.success('Đã xóa'); load();
    };

    const catLabels: any = { LAPTOP: '💻 Laptop', PHONE: '📱 Điện thoại', UNIFORM: '👔 Đồng phục', KEY: '🔑 Chìa khóa', BADGE: '🪪 Thẻ', TOOL: '🔧 Dụng cụ', OTHER: '📦 Khác' };
    const statusLabels: any = { ASSIGNED: { c: 'green', l: 'Đang sử dụng' }, RETURNED: { c: 'blue', l: 'Đã trả' }, LOST: { c: 'red', l: 'Mất' }, DAMAGED: { c: 'orange', l: 'Hỏng' } };

    const columns = [
        { title: 'Mã TS', dataIndex: 'asset_code', width: 100, render: (v: string) => <strong style={{ color: '#22d3ee' }}>{v}</strong> },
        { title: 'Tên tài sản', dataIndex: 'asset_name', width: 160 },
        { title: 'Loại', dataIndex: 'category', width: 120, render: (v: string) => catLabels[v] || v },
        { title: 'Nhân viên', width: 150, render: (_: any, r: any) => r.employee?.full_name || `NV #${r.employee_id}` },
        { title: 'Ngày cấp', dataIndex: 'assigned_date', width: 110, render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
        { title: 'Ngày trả', dataIndex: 'return_date', width: 110, render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
        {
            title: 'Tình trạng', dataIndex: 'condition', width: 90,
            render: (v: string) => v || '—'
        },
        {
            title: 'Trạng thái', dataIndex: 'status', width: 120,
            render: (v: string) => <Tag color={statusLabels[v]?.c || 'default'}>{statusLabels[v]?.l || v}</Tag>
        },
        {
            title: '', width: 80, render: (_: any, r: any) => (
                <Space size="small">
                    <Button size="small" icon={<EditOutlined />} onClick={() => openModal(r)} />
                    <Popconfirm title="Xóa?" onConfirm={() => handleDelete(r.id)} okText="Xóa" cancelText="Hủy">
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Select allowClear placeholder="Lọc theo loại" style={{ width: 180 }}
                    value={filterCat} onChange={setFilterCat}>
                    {Object.entries(catLabels).map(([k, v]) => <Option key={k} value={k}>{v as string}</Option>)}
                </Select>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Thêm tài sản</Button>
            </div>

            <Table columns={columns} dataSource={data} loading={loading}
                rowKey="id" pagination={{ pageSize: 20 }} size="middle" />

            <Modal title={editing ? '✏️ Sửa tài sản' : '➕ Thêm tài sản mới'}
                open={modalOpen} onCancel={() => { setModalOpen(false); form.resetFields(); }}
                onOk={handleSave} width={600} okText={editing ? 'Cập nhật' : 'Thêm'} cancelText="Hủy">
                <Form form={form} layout="vertical">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="employee_id" label="Nhân viên" rules={[{ required: true }]}>
                                <Select showSearch optionFilterProp="children" placeholder="Chọn NV">
                                    {employees.map(e => <Option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}><Form.Item name="asset_name" label="Tên tài sản" rules={[{ required: true }]}><Input placeholder="MacBook Pro 14..." /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="category" label="Loại" initialValue="OTHER">
                                <Select>
                                    {Object.entries(catLabels).map(([k, v]) => <Option key={k} value={k}>{v as string}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}><Form.Item name="asset_code" label="Mã TS"><Input placeholder="Tự tạo nếu để trống" /></Form.Item></Col>
                        <Col span={8}>
                            <Form.Item name="condition" label="Tình trạng">
                                <Select allowClear>
                                    <Option value="NEW">Mới</Option><Option value="GOOD">Tốt</Option>
                                    <Option value="FAIR">Trung bình</Option><Option value="POOR">Kém</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="assigned_date" label="Ngày cấp"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                        <Col span={8}><Form.Item name="return_date" label="Ngày trả"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                        <Col span={8}>
                            <Form.Item name="status" label="Trạng thái" initialValue="ASSIGNED">
                                <Select>
                                    <Option value="ASSIGNED">Đang sử dụng</Option><Option value="RETURNED">Đã trả</Option>
                                    <Option value="LOST">Mất</Option><Option value="DAMAGED">Hỏng</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="note" label="Ghi chú"><Input.TextArea rows={2} /></Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
