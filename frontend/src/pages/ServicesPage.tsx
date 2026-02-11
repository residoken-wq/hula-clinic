import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, message, Row, Col, InputNumber, Switch } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api, { fetchData } from '../utils/api';

const { Option } = Select;

export default function ServicesPage() {
    const [data, setData] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [catModalOpen, setCatModalOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState<number | undefined>();
    const [form] = Form.useForm();
    const [catForm] = Form.useForm();

    useEffect(() => { load(); loadCategories(); }, [search, filterCat]);

    const load = async () => {
        setLoading(true);
        try {
            const params: any = { search, status: 'ACTIVE' };
            if (filterCat) params.category_id = filterCat;
            const res = await fetchData('/services', params);
            setData(Array.isArray(res) ? res : []);
        } catch { message.error('Lỗi'); }
        finally { setLoading(false); }
    };

    const loadCategories = async () => {
        try {
            const res = await fetchData('/services/categories');
            setCategories(Array.isArray(res) ? res : []);
        } catch { }
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            if (editing) {
                await api.put(`/services/${editing.id}`, values);
                message.success('Cập nhật thành công');
            } else {
                await api.post('/services', values);
                message.success('Thêm dịch vụ thành công');
            }
            setModalOpen(false);
            load();
        } catch (err: any) {
            if (err.response) message.error(err.response.data.message || 'Lỗi');
        }
    };

    const handleSaveCat = async () => {
        try {
            const values = await catForm.validateFields();
            await api.post('/services/categories', values);
            message.success('Thêm danh mục thành công');
            setCatModalOpen(false);
            loadCategories();
        } catch { message.error('Lỗi'); }
    };

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: 'Xác nhận', content: 'Dịch vụ sẽ chuyển sang Không hoạt động',
            onOk: async () => { await api.delete(`/services/${id}`); load(); message.success('Đã xóa'); },
        });
    };

    const openEdit = (r: any) => { setEditing(r); form.setFieldsValue(r); setModalOpen(true); };

    const columns = [
        { title: 'Mã DV', dataIndex: 'code', width: 120, render: (v: string) => <Tag color="blue">{v}</Tag> },
        { title: 'Tên dịch vụ', dataIndex: 'name', width: 220, render: (v: string) => <strong>{v}</strong> },
        { title: 'Danh mục', width: 140, render: (_: any, r: any) => r.category?.name || '-' },
        {
            title: 'Giá', dataIndex: 'price', width: 140,
            render: (v: number) => <strong style={{ color: '#22d3ee' }}>{v?.toLocaleString('vi-VN')}đ</strong>
        },
        {
            title: 'BHYT', dataIndex: 'insurance_covered', width: 90,
            render: (v: boolean) => v ? <Tag color="green">Có</Tag> : <Tag>Không</Tag>
        },
        { title: 'Thời gian', dataIndex: 'duration_minutes', width: 100, render: (v: number) => `${v} phút` },
        {
            title: '', width: 120, render: (_: any, r: any) => (
                <Space size="small">
                    <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.id)} />
                </Space>
            )
        },
    ];

    return (
        <div>
            <div className="page-header">
                <h1>🔬 Dịch vụ</h1>
                <Space>
                    <Select placeholder="Danh mục" allowClear onChange={v => setFilterCat(v)} style={{ width: 160 }}>
                        {categories.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                    </Select>
                    <Input prefix={<SearchOutlined />} placeholder="Tìm dịch vụ..." value={search}
                        onChange={e => setSearch(e.target.value)} allowClear style={{ width: 220 }} />
                    <Button onClick={() => { catForm.resetFields(); setCatModalOpen(true); }}>+ Danh mục</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                        setEditing(null); form.resetFields(); setModalOpen(true);
                    }}>Thêm dịch vụ</Button>
                </Space>
            </div>

            <Table columns={columns} dataSource={data} loading={loading} rowKey="id"
                pagination={{ pageSize: 20 }} size="middle" />

            {/* Service Modal */}
            <Modal title={editing ? 'Sửa dịch vụ' : 'Thêm dịch vụ mới'} open={modalOpen}
                onCancel={() => setModalOpen(false)} onOk={handleSave} width={600} okText="Lưu" cancelText="Hủy">
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Row gutter={16}>
                        <Col span={16}><Form.Item name="name" label="Tên dịch vụ" rules={[{ required: true }]}><Input /></Form.Item></Col>
                        <Col span={8}><Form.Item name="category_id" label="Danh mục">
                            <Select allowClear placeholder="Chọn">{categories.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}</Select>
                        </Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="price" label="Giá (VNĐ)" rules={[{ required: true }]}>
                            <InputNumber style={{ width: '100%' }} min={0} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                        </Form.Item></Col>
                        <Col span={8}><Form.Item name="duration_minutes" label="Thời gian (phút)" initialValue={30}>
                            <InputNumber style={{ width: '100%' }} min={5} step={5} />
                        </Form.Item></Col>
                        <Col span={8}>
                            <Form.Item name="insurance_covered" label="BHYT" valuePropName="checked">
                                <Switch checkedChildren="Có" unCheckedChildren="Không" />
                            </Form.Item>
                            {form.getFieldValue('insurance_covered') && (
                                <Form.Item name="insurance_rate" label="Tỷ lệ BH (%)">
                                    <InputNumber style={{ width: '100%' }} min={0} max={100} />
                                </Form.Item>
                            )}
                        </Col>
                    </Row>
                    <Form.Item name="description" label="Mô tả"><Input.TextArea rows={2} /></Form.Item>
                </Form>
            </Modal>

            {/* Category Modal */}
            <Modal title="Thêm danh mục" open={catModalOpen} onCancel={() => setCatModalOpen(false)}
                onOk={handleSaveCat} okText="Lưu" cancelText="Hủy" width={400}>
                <Form form={catForm} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item name="code" label="Mã" rules={[{ required: true }]}><Input placeholder="XN, CDHA..." /></Form.Item>
                    <Form.Item name="name" label="Tên danh mục" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="sort_order" label="Thứ tự"><InputNumber style={{ width: '100%' }} /></Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
