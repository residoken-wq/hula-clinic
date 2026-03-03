import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, message, Popconfirm, Switch, InputNumber, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons';
import api, { fetchData } from '../../utils/api';

const { Option } = Select;

const MODULE_CATEGORY_TYPES: Record<string, { label: string; types: { code: string; label: string }[] }> = {
    HR: { label: 'Nhân sự', types: [{ code: 'DEPARTMENT', label: 'Phòng ban' }, { code: 'POSITION', label: 'Chức vụ' }, { code: 'LEAVE_TYPE', label: 'Loại nghỉ phép' }] },
    PHARMACY: { label: 'Kho thuốc', types: [{ code: 'MEDICINE_CATEGORY', label: 'Nhóm thuốc' }] },
    ROOMS: { label: 'Phòng khám', types: [{ code: 'ROOM_TYPE', label: 'Loại phòng' }] },
    BILLING: { label: 'Thanh toán', types: [{ code: 'PAYMENT_METHOD', label: 'PT thanh toán' }] },
    ASSETS: { label: 'Tài sản', types: [{ code: 'ASSET_CATEGORY', label: 'Loại tài sản' }] },
    APPOINTMENTS: { label: 'Lịch hẹn', types: [{ code: 'APPOINTMENT_STATUS', label: 'Trạng thái lịch hẹn' }] },
    PATIENTS: { label: 'Bệnh nhân', types: [{ code: 'PATIENT_SOURCE', label: 'Nguồn bệnh nhân' }] },
};

export default function CategoriesTab() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedModule, setSelectedModule] = useState('HR');
    const [selectedType, setSelectedType] = useState('DEPARTMENT');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form] = Form.useForm();

    useEffect(() => { load(); }, [selectedModule, selectedType]);

    useEffect(() => {
        const types = MODULE_CATEGORY_TYPES[selectedModule]?.types;
        if (types?.length) setSelectedType(types[0].code);
    }, [selectedModule]);

    const load = async () => {
        setLoading(true);
        try {
            setCategories(await fetchData('/system/categories', { module: selectedModule, category_type: selectedType }));
        } catch { } finally { setLoading(false); }
    };

    const openModal = (item?: any) => {
        setEditing(item || null);
        form.setFieldsValue(item || { module: selectedModule, category_type: selectedType, code: '', name: '', sort_order: 0, is_active: true });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            values.module = selectedModule;
            values.category_type = selectedType;
            if (editing) {
                await api.put(`/system/categories/${editing.id}`, values);
                message.success('Cập nhật thành công');
            } else {
                await api.post('/system/categories', values);
                message.success('Thêm thành công');
            }
            setModalOpen(false);
            load();
        } catch (err: any) {
            if (err.response) message.error(err.response.data.message || 'Lỗi');
        }
    };

    const handleDelete = async (id: number) => {
        await api.delete(`/system/categories/${id}`);
        message.success('Đã xóa'); load();
    };

    const handleSeed = async () => {
        try {
            const result = await api.post('/system/categories/seed');
            message.success(`Tạo ${result.data.created} danh mục mặc định (tổng ${result.data.total})`);
            load();
        } catch { message.error('Lỗi'); }
    };

    const handleToggleActive = async (item: any) => {
        await api.put(`/system/categories/${item.id}`, { ...item, is_active: !item.is_active });
        load();
    };

    const currentTypes = MODULE_CATEGORY_TYPES[selectedModule]?.types || [];

    const columns = [
        { title: 'Mã', dataIndex: 'code', width: 120, render: (v: string) => <strong style={{ color: '#22d3ee' }}>{v}</strong> },
        { title: 'Tên', dataIndex: 'name', width: 200 },
        { title: 'Thứ tự', dataIndex: 'sort_order', width: 80, align: 'center' as const },
        { title: 'Trạng thái', dataIndex: 'is_active', width: 100, render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Hiện' : 'Ẩn'}</Tag> },
        {
            title: '', width: 120, render: (_: any, r: any) => (
                <Space size="small">
                    <Button size="small" icon={<EditOutlined />} onClick={() => openModal(r)} />
                    <Switch size="small" checked={r.is_active} onChange={() => handleToggleActive(r)} />
                    <Popconfirm title="Xóa danh mục?" onConfirm={() => handleDelete(r.id)} okText="Xóa" cancelText="Hủy">
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
                    <span style={{ color: '#94a3b8' }}>Module:</span>
                    <Select value={selectedModule} onChange={setSelectedModule} style={{ width: 150 }}>
                        {Object.entries(MODULE_CATEGORY_TYPES).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
                    </Select>
                    <span style={{ color: '#94a3b8' }}>Loại:</span>
                    <Select value={selectedType} onChange={setSelectedType} style={{ width: 180 }}>
                        {currentTypes.map(t => <Option key={t.code} value={t.code}>{t.label}</Option>)}
                    </Select>
                </Space>
                <Space>
                    <Popconfirm title="Tạo danh mục mặc định cho tất cả module?" onConfirm={handleSeed} okText="Tạo" cancelText="Hủy">
                        <Button icon={<ThunderboltOutlined />}>Seed mặc định</Button>
                    </Popconfirm>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Thêm danh mục</Button>
                </Space>
            </div>

            <Table columns={columns} dataSource={categories} loading={loading}
                rowKey="id" pagination={false} size="middle" />

            <Modal title={editing ? '✏️ Sửa danh mục' : '➕ Thêm danh mục'} open={modalOpen}
                onCancel={() => setModalOpen(false)} onOk={handleSave}
                okText={editing ? 'Cập nhật' : 'Thêm'} cancelText="Hủy">
                <Form form={form} layout="vertical">
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="code" label="Mã (code)" rules={[{ required: true }]}><Input placeholder="VD: KHOA_NOI" /></Form.Item></Col>
                        <Col span={12}><Form.Item name="name" label="Tên hiển thị" rules={[{ required: true }]}><Input placeholder="VD: Khoa Nội" /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="sort_order" label="Thứ tự" initialValue={0}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="is_active" label="Kích hoạt" valuePropName="checked" initialValue={true}><Switch /></Form.Item></Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
}
