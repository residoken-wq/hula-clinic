import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, message, DatePicker, Popconfirm, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api, { fetchData } from '../../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;

const catLabels: any = { LAPTOP: '💻 Laptop', PHONE: '📱 Điện thoại', UNIFORM: '👔 Đồng phục', KEY: '🔑 Chìa khóa', BADGE: '🪪 Thẻ', TOOL: '🔧 Dụng cụ', OTHER: '📦 Khác' };
const statusLabels: any = { ASSIGNED: { c: 'green', l: 'Đang sử dụng' }, RETURNED: { c: 'blue', l: 'Đã trả' }, LOST: { c: 'red', l: 'Mất' }, DAMAGED: { c: 'orange', l: 'Hỏng' } };

export default function AssetsTab() {
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

    const columns = [
        { title: 'Mã TS', dataIndex: 'asset_code', width: 100, render: (v: string) => <strong style={{ color: '#22d3ee' }}>{v}</strong> },
        { title: 'Tên tài sản', dataIndex: 'asset_name', width: 160 },
        { title: 'Loại', dataIndex: 'category', width: 120, render: (v: string) => catLabels[v] || v },
        { title: 'Nhân viên', width: 150, render: (_: any, r: any) => r.employee?.full_name || `NV #${r.employee_id}` },
        { title: 'Ngày cấp', dataIndex: 'assigned_date', width: 110, render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
        { title: 'Ngày trả', dataIndex: 'return_date', width: 110, render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
        { title: 'Tình trạng', dataIndex: 'condition', width: 90, render: (v: string) => v || '—' },
        { title: 'Trạng thái', dataIndex: 'status', width: 120, render: (v: string) => <Tag color={statusLabels[v]?.c || 'default'}>{statusLabels[v]?.l || v}</Tag> },
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
