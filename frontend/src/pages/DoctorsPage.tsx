import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, Tag, Space, message, TimePicker, Card, Tabs, Badge } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ScheduleOutlined, UserOutlined } from '@ant-design/icons';
import api, { fetchData } from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;

const dayLabels = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const dayColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function DoctorsPage() {
    const [doctors, setDoctors] = useState<any[]>([]);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
    const [doctorSchedules, setDoctorSchedules] = useState<any[]>([]);
    const [editingSchedule, setEditingSchedule] = useState<any>(null);
    const [form] = Form.useForm();

    useEffect(() => { loadDoctors(); loadRooms(); loadAllSchedules(); }, []);

    const loadDoctors = async () => {
        setLoading(true);
        try {
            const res = await fetchData('/doctors');
            setDoctors(Array.isArray(res) ? res : []);
        } catch { message.error('Lỗi tải danh sách bác sĩ'); }
        finally { setLoading(false); }
    };

    const loadRooms = async () => {
        try {
            const res = await fetchData('/rooms');
            setRooms(Array.isArray(res) ? res : []);
        } catch { }
    };

    const loadAllSchedules = async () => {
        try {
            const res = await fetchData('/doctors/schedules/all');
            setSchedules(Array.isArray(res) ? res : []);
        } catch { }
    };

    const loadDoctorSchedules = async (doctorId: number) => {
        try {
            const res = await fetchData(`/doctors/${doctorId}/schedules`);
            setDoctorSchedules(Array.isArray(res) ? res : []);
        } catch { }
    };

    const openScheduleModal = (doctor: any) => {
        setSelectedDoctor(doctor);
        loadDoctorSchedules(doctor.id);
        setScheduleModalOpen(true);
    };

    const handleSaveSchedule = async () => {
        try {
            const values = await form.validateFields();
            values.employee_id = selectedDoctor.id;
            values.start_time = values.start_time?.format('HH:mm');
            values.end_time = values.end_time?.format('HH:mm');

            if (editingSchedule) {
                await api.put(`/doctors/schedules/${editingSchedule.id}`, values);
                message.success('Cập nhật lịch thành công');
            } else {
                await api.post('/doctors/schedules', values);
                message.success('Thêm lịch thành công');
            }
            form.resetFields();
            setEditingSchedule(null);
            loadDoctorSchedules(selectedDoctor.id);
            loadAllSchedules();
        } catch (err: any) {
            if (err.response) message.error(err.response.data.message || 'Lỗi');
        }
    };

    const handleDeleteSchedule = async (id: number) => {
        await api.delete(`/doctors/schedules/${id}`);
        message.success('Đã xóa');
        loadDoctorSchedules(selectedDoctor.id);
        loadAllSchedules();
    };

    // --- Doctor List Columns ---
    const doctorColumns = [
        {
            title: 'Mã NV', dataIndex: 'employee_code', width: 100,
            render: (v: string) => <strong style={{ color: '#22d3ee' }}>{v}</strong>
        },
        { title: 'Họ tên', dataIndex: 'full_name', width: 180 },
        { title: 'Chức vụ', dataIndex: 'position', width: 120 },
        { title: 'Khoa', dataIndex: 'department', width: 120 },
        {
            title: 'Lịch làm việc', width: 280, render: (_: any, doctor: any) => {
                const docSchedules = schedules.filter(s => s.employee_id === doctor.id);
                if (docSchedules.length === 0) return <span style={{ color: '#64748b' }}>Chưa có lịch</span>;
                return (
                    <Space size={4} wrap>
                        {docSchedules.map((s: any) => (
                            <Tag key={s.id} color={dayColors[s.day_of_week]} style={{ fontSize: 11 }}>
                                {dayLabels[s.day_of_week]?.slice(0, 4)} {s.start_time?.slice(0, 5)}-{s.end_time?.slice(0, 5)}
                            </Tag>
                        ))}
                    </Space>
                );
            }
        },
        {
            title: 'Trạng thái', dataIndex: 'status', width: 100,
            render: (v: string) => <Tag color={v === 'ACTIVE' ? 'green' : 'red'}>{v === 'ACTIVE' ? 'Đang làm' : v}</Tag>
        },
        {
            title: '', width: 120, render: (_: any, r: any) => (
                <Button size="small" type="primary" icon={<ScheduleOutlined />} onClick={() => openScheduleModal(r)}>
                    Lịch
                </Button>
            )
        },
    ];

    // --- Schedule Columns (inside modal) ---
    const scheduleColumns = [
        {
            title: 'Thứ', dataIndex: 'day_of_week', width: 100,
            render: (v: number) => <Tag color={dayColors[v]}>{dayLabels[v]}</Tag>
        },
        {
            title: 'Giờ bắt đầu', dataIndex: 'start_time', width: 100,
            render: (v: string) => <strong>{v?.slice(0, 5)}</strong>
        },
        {
            title: 'Giờ kết thúc', dataIndex: 'end_time', width: 100,
            render: (v: string) => <strong>{v?.slice(0, 5)}</strong>
        },
        {
            title: 'Phòng', width: 140, render: (_: any, r: any) =>
                r.room ? <Tag color="cyan">{r.room.name}</Tag> : <span style={{ color: '#64748b' }}>—</span>
        },
        {
            title: 'Trạng thái', dataIndex: 'is_active', width: 100,
            render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Bật' : 'Tắt'}</Tag>
        },
        {
            title: '', width: 100, render: (_: any, r: any) => (
                <Space size="small">
                    <Button size="small" icon={<EditOutlined />} onClick={() => {
                        setEditingSchedule(r);
                        form.setFieldsValue({
                            ...r,
                            start_time: r.start_time ? dayjs(r.start_time, 'HH:mm:ss') : null,
                            end_time: r.end_time ? dayjs(r.end_time, 'HH:mm:ss') : null,
                        });
                    }} />
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteSchedule(r.id)} />
                </Space>
            )
        },
    ];

    const stats = [
        { label: 'Tổng bác sĩ', value: doctors.length, color: '#0891b2' },
        { label: 'Có lịch', value: new Set(schedules.map(s => s.employee_id)).size, color: '#10b981' },
        { label: 'Chưa có lịch', value: doctors.filter(d => !schedules.some(s => s.employee_id === d.id)).length, color: '#f59e0b' },
    ];

    return (
        <div>
            <div className="page-header">
                <h1>👨‍⚕️ Quản lý bác sĩ</h1>
            </div>

            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 16 }}>
                {stats.map((s, i) => (
                    <div className="stat-card" key={i} style={{ padding: 16 }}>
                        <div className="stat-value" style={{ fontSize: 24 }}>{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            <Table columns={doctorColumns} dataSource={doctors} loading={loading}
                rowKey="id" pagination={false} size="middle" />

            {/* Schedule Modal */}
            <Modal
                title={`📅 Lịch làm việc — ${selectedDoctor?.full_name || ''}`}
                open={scheduleModalOpen}
                onCancel={() => { setScheduleModalOpen(false); setEditingSchedule(null); form.resetFields(); }}
                footer={null}
                width={700}
            >
                <Table columns={scheduleColumns} dataSource={doctorSchedules}
                    rowKey="id" pagination={false} size="small" style={{ marginBottom: 16 }} />

                <Card size="small" title={editingSchedule ? '✏️ Sửa lịch' : '➕ Thêm lịch mới'}
                    style={{ background: '#1e293b', border: '1px solid #334155' }}>
                    <Form form={form} layout="inline" onFinish={handleSaveSchedule}
                        initialValues={{ is_active: true }}>
                        <Form.Item name="day_of_week" label="Thứ" rules={[{ required: true, message: 'Chọn' }]}>
                            <Select style={{ width: 120 }} placeholder="Chọn thứ">
                                {dayLabels.map((d, i) => <Option key={i} value={i}>{d}</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item name="start_time" label="Từ" rules={[{ required: true, message: 'Chọn' }]}>
                            <TimePicker format="HH:mm" minuteStep={15} style={{ width: 100 }} />
                        </Form.Item>
                        <Form.Item name="end_time" label="Đến" rules={[{ required: true, message: 'Chọn' }]}>
                            <TimePicker format="HH:mm" minuteStep={15} style={{ width: 100 }} />
                        </Form.Item>
                        <Form.Item name="room_id" label="Phòng">
                            <Select allowClear placeholder="Phòng" style={{ width: 140 }}>
                                {rooms.filter(r => r.status === 'ACTIVE').map(r => (
                                    <Option key={r.id} value={r.id}>{r.name}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item>
                            <Space>
                                <Button type="primary" htmlType="submit">
                                    {editingSchedule ? 'Cập nhật' : 'Thêm'}
                                </Button>
                                {editingSchedule && (
                                    <Button onClick={() => { setEditingSchedule(null); form.resetFields(); }}>Hủy</Button>
                                )}
                            </Space>
                        </Form.Item>
                    </Form>
                </Card>
            </Modal>
        </div>
    );
}
