import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, Tag, Space, message, Row, Col, AutoComplete, TimePicker } from 'antd';
import { PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, LoginOutlined } from '@ant-design/icons';
import api, { fetchData } from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;

export default function AppointmentsPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [patients, setPatients] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [patientSearch, setPatientSearch] = useState('');
    const [form] = Form.useForm();
    const [stats, setStats] = useState<any>({});

    useEffect(() => { load(); loadDoctors(); loadStats(); }, [selectedDate]);

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetchData('/appointments', { date: selectedDate.format('YYYY-MM-DD') });
            setData(Array.isArray(res) ? res : []);
        } catch { message.error('Lỗi tải dữ liệu'); }
        finally { setLoading(false); }
    };

    const loadDoctors = async () => {
        try {
            const res = await fetchData('/hr/employees', { position: 'Bác sĩ' });
            setDoctors(Array.isArray(res) ? res : res.data || []);
        } catch { }
    };

    const loadStats = async () => {
        try { setStats(await fetchData('/appointments/today')); } catch { }
    };

    const searchPatients = async (value: string) => {
        setPatientSearch(value);
        if (value.length < 2) return;
        try {
            const res = await fetchData('/patients', { search: value });
            setPatients(res.data || []);
        } catch { }
    };

    const handleCreate = async () => {
        try {
            const values = await form.validateFields();
            values.appointment_date = values.appointment_date.format('YYYY-MM-DD');
            values.start_time = values.start_time?.format('HH:mm') || null;
            values.end_time = values.end_time?.format('HH:mm') || null;
            await api.post('/appointments', values);
            message.success('Đặt lịch thành công');
            setModalOpen(false);
            form.resetFields();
            load();
            loadStats();
        } catch (err: any) {
            if (err.response) message.error(err.response.data.message || 'Lỗi');
        }
    };

    const updateStatus = async (id: number, status: string) => {
        try {
            await api.patch(`/appointments/${id}/status`, { status });
            message.success('Cập nhật thành công');
            load();
            loadStats();
        } catch { message.error('Lỗi'); }
    };

    const statusColors: Record<string, string> = {
        BOOKED: 'blue', CHECKED_IN: 'orange', IN_PROGRESS: 'processing',
        COMPLETED: 'green', CANCELLED: 'red', NO_SHOW: 'default',
    };
    const statusLabels: Record<string, string> = {
        BOOKED: 'Đã đặt', CHECKED_IN: 'Đã đến', IN_PROGRESS: 'Đang khám',
        COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy', NO_SHOW: 'Vắng',
    };

    const columns = [
        {
            title: 'Giờ', dataIndex: 'start_time', width: 80,
            render: (v: string) => <strong style={{ color: '#22d3ee' }}>{v || '-'}</strong>
        },
        {
            title: 'Bệnh nhân', width: 180, render: (_: any, r: any) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{r.patient?.full_name || '-'}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{r.patient?.patient_code}</div>
                </div>
            )
        },
        { title: 'Bác sĩ', width: 150, render: (_: any, r: any) => r.doctor?.full_name || '-' },
        { title: 'Lý do', dataIndex: 'reason', width: 200, ellipsis: true },
        {
            title: 'Trạng thái', dataIndex: 'status', width: 120,
            render: (v: string) => <Tag color={statusColors[v]}>{statusLabels[v] || v}</Tag>
        },
        {
            title: '', width: 180, render: (_: any, r: any) => (
                <Space size="small">
                    {r.status === 'BOOKED' && (
                        <>
                            <Button size="small" type="primary" icon={<LoginOutlined />} onClick={() => updateStatus(r.id, 'CHECKED_IN')}>Check-in</Button>
                            <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => updateStatus(r.id, 'CANCELLED')}>Hủy</Button>
                        </>
                    )}
                    {r.status === 'CHECKED_IN' && (
                        <Button size="small" type="primary" icon={<CheckCircleOutlined />}
                            onClick={() => updateStatus(r.id, 'COMPLETED')}>Hoàn thành</Button>
                    )}
                </Space>
            )
        },
    ];

    const statCards = [
        { label: 'Tổng hẹn', value: stats.total || 0, color: '#0891b2' },
        { label: 'Đã đến', value: stats.waiting || 0, color: '#f59e0b' },
        { label: 'Hoàn thành', value: stats.completed || 0, color: '#10b981' },
        { label: 'Chưa đến', value: stats.booked || 0, color: '#6366f1' },
    ];

    return (
        <div>
            <div className="page-header">
                <h1>📅 Lịch hẹn</h1>
                <Space>
                    <DatePicker value={selectedDate} onChange={v => v && setSelectedDate(v)} format="DD/MM/YYYY" />
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); form.setFieldsValue({ appointment_date: selectedDate }); setModalOpen(true); }}>
                        Đặt lịch
                    </Button>
                </Space>
            </div>

            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 16 }}>
                {statCards.map((s, i) => (
                    <div className="stat-card" key={i} style={{ padding: 16 }}>
                        <div className="stat-value" style={{ fontSize: 24 }}>{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            <Table columns={columns} dataSource={data} loading={loading} rowKey="id"
                pagination={false} size="middle" />

            <Modal title="Đặt lịch hẹn" open={modalOpen} onCancel={() => setModalOpen(false)}
                onOk={handleCreate} width={600} okText="Đặt lịch" cancelText="Hủy">
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item name="patient_id" label="Bệnh nhân" rules={[{ required: true, message: 'Chọn bệnh nhân' }]}>
                        <Select showSearch filterOption={false} onSearch={searchPatients}
                            placeholder="Tìm tên / mã BN..." notFoundContent="Nhập tên bệnh nhân...">
                            {patients.map(p => (
                                <Option key={p.id} value={p.id}>{p.patient_code} - {p.full_name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="appointment_date" label="Ngày hẹn" rules={[{ required: true }]}>
                                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="start_time" label="Giờ bắt đầu">
                                <TimePicker format="HH:mm" style={{ width: '100%' }} minuteStep={15} />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="end_time" label="Giờ kết thúc">
                                <TimePicker format="HH:mm" style={{ width: '100%' }} minuteStep={15} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="doctor_id" label="Bác sĩ">
                        <Select allowClear placeholder="Chọn bác sĩ">
                            {doctors.map(d => <Option key={d.id} value={d.id}>{d.full_name} - {d.position}</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="reason" label="Lý do khám">
                        <Input.TextArea rows={2} placeholder="Triệu chứng / lý do..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
