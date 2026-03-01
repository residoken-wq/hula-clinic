import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, message, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api, { fetchData } from '../utils/api';

const { Option } = Select;

const typeLabels: Record<string, string> = {
    KHAM: 'Phòng khám', THU_THUAT: 'Thủ thuật', XET_NGHIEM: 'Xét nghiệm',
    TIEM: 'Tiêm chủng', OTHER: 'Khác',
};
const typeColors: Record<string, string> = {
    KHAM: 'cyan', THU_THUAT: 'orange', XET_NGHIEM: 'purple',
    TIEM: 'green', OTHER: 'default',
};
const statusLabels: Record<string, string> = { ACTIVE: 'Hoạt động', INACTIVE: 'Ngưng', MAINTENANCE: 'Bảo trì' };
const statusColors: Record<string, string> = { ACTIVE: 'green', INACTIVE: 'red', MAINTENANCE: 'orange' };

export default function RoomsPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form] = Form.useForm();

    useEffect(() => { load(); }, []);

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetchData('/rooms');
            setData(Array.isArray(res) ? res : []);
        } catch { message.error('Lỗi tải dữ liệu'); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            if (editing) {
                await api.put(`/rooms/${editing.id}`, values);
                message.success('Cập nhật thành công');
            } else {
                await api.post('/rooms', values);
                message.success('Tạo phòng thành công');
            }
            setModalOpen(false);
            form.resetFields();
            setEditing(null);
            load();
        } catch (err: any) {
            if (err.response) message.error(err.response.data.message || 'Lỗi');
        }
    };

    const handleEdit = (record: any) => {
        setEditing(record);
        form.setFieldsValue(record);
        setModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        Modal.confirm({
            title: 'Xác nhận xóa phòng?',
            okText: 'Xóa', cancelText: 'Hủy', okButtonProps: { danger: true },
            onOk: async () => {
                await api.delete(`/rooms/${id}`);
                message.success('Đã xóa');
                load();
            },
        });
    };

    const columns = [
        { title: 'Mã phòng', dataIndex: 'room_code', width: 100, render: (v: string) => <strong style={{ color: '#22d3ee' }}>{v}</strong> },
        { title: 'Tên phòng', dataIndex: 'name', width: 180 },
        { title: 'Tầng', dataIndex: 'floor', width: 80 },
        {
            title: 'Loại phòng', dataIndex: 'type', width: 120,
            render: (v: string) => <Tag color={typeColors[v] || 'default'}>{typeLabels[v] || v}</Tag>
        },
        { title: 'Sức chứa', dataIndex: 'capacity', width: 90, align: 'center' as const },
        {
            title: 'Trạng thái', dataIndex: 'status', width: 110,
            render: (v: string) => <Tag color={statusColors[v] || 'default'}>{statusLabels[v] || v}</Tag>
        },
        { title: 'Thiết bị', dataIndex: 'equipment', ellipsis: true },
        {
            title: '', width: 120, render: (_: any, r: any) => (
                <Space size="small">
                    <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)} />
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.id)} />
                </Space>
            )
        },
    ];

    const stats = [
        { label: 'Tổng phòng', value: data.length, color: '#0891b2' },
        { label: 'Hoạt động', value: data.filter(r => r.status === 'ACTIVE').length, color: '#10b981' },
        { label: 'Bảo trì', value: data.filter(r => r.status === 'MAINTENANCE').length, color: '#f59e0b' },
        { label: 'Ngưng', value: data.filter(r => r.status === 'INACTIVE').length, color: '#ef4444' },
    ];

    return (
        <div>
            <div className="page-header">
                <h1>🏠 Phòng khám</h1>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>
                    Thêm phòng
                </Button>
            </div>

            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 16 }}>
                {stats.map((s, i) => (
                    <div className="stat-card" key={i} style={{ padding: 16 }}>
                        <div className="stat-value" style={{ fontSize: 24 }}>{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            <Table columns={columns} dataSource={data} loading={loading} rowKey="id"
                pagination={false} size="middle" />

            <Modal title={editing ? 'Sửa phòng' : 'Thêm phòng mới'} open={modalOpen}
                onCancel={() => { setModalOpen(false); setEditing(null); }}
                onOk={handleSave} width={500} okText="Lưu" cancelText="Hủy">
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}
                    initialValues={{ type: 'KHAM', status: 'ACTIVE', capacity: 1 }}>
                    <Form.Item name="name" label="Tên phòng" rules={[{ required: true, message: 'Nhập tên phòng' }]}>
                        <Input placeholder="VD: Phòng khám 01" />
                    </Form.Item>
                    <Space style={{ width: '100%' }} size={16}>
                        <Form.Item name="floor" label="Tầng">
                            <Input placeholder="VD: Tầng 1" style={{ width: 150 }} />
                        </Form.Item>
                        <Form.Item name="type" label="Loại phòng">
                            <Select style={{ width: 180 }}>
                                {Object.entries(typeLabels).map(([k, v]) => <Option key={k} value={k}>{v}</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item name="capacity" label="Sức chứa">
                            <InputNumber min={1} max={20} style={{ width: 100 }} />
                        </Form.Item>
                    </Space>
                    <Form.Item name="equipment" label="Thiết bị / ghi chú">
                        <Input.TextArea rows={2} placeholder="Mô tả thiết bị trong phòng..." />
                    </Form.Item>
                    <Form.Item name="status" label="Trạng thái">
                        <Select>
                            {Object.entries(statusLabels).map(([k, v]) => <Option key={k} value={k}>{v}</Option>)}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
