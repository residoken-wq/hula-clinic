import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, Tag, Space, message, Tabs, Row, Col, InputNumber, Badge } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, WarningOutlined, AlertOutlined } from '@ant-design/icons';
import api, { fetchData } from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;

export default function PharmacyPage() {
    const [tab, setTab] = useState('medicines');
    const [medicines, setMedicines] = useState<any[]>([]);
    const [stocks, setStocks] = useState<any[]>([]);
    const [alerts, setAlerts] = useState<any>({ expiring: [], lowStock: [] });
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [stockModalOpen, setStockModalOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form] = Form.useForm();
    const [stockForm] = Form.useForm();

    useEffect(() => { loadMedicines(); loadAlerts(); }, [search]);

    const loadMedicines = async () => {
        setLoading(true);
        try {
            const res = await fetchData('/pharmacy/medicines', { search });
            setMedicines(Array.isArray(res) ? res : []);
        } catch { message.error('Lỗi'); }
        finally { setLoading(false); }
    };

    const loadAlerts = async () => {
        try {
            const [expiring, lowStock] = await Promise.all([
                fetchData('/pharmacy/alerts/expiring').catch(() => []),
                fetchData('/pharmacy/alerts/low-stock').catch(() => []),
            ]);
            setAlerts({ expiring, lowStock });
        } catch { }
    };

    const handleSaveMedicine = async () => {
        try {
            const values = await form.validateFields();
            if (editing) {
                await api.put(`/pharmacy/medicines/${editing.id}`, values);
                message.success('Cập nhật thành công');
            } else {
                await api.post('/pharmacy/medicines', values);
                message.success('Thêm thuốc thành công');
            }
            setModalOpen(false);
            loadMedicines();
        } catch (err: any) {
            if (err.response) message.error(err.response.data.message || 'Lỗi');
        }
    };

    const handleImportStock = async () => {
        try {
            const values = await stockForm.validateFields();
            if (values.expiry_date) values.expiry_date = values.expiry_date.format('YYYY-MM-DD');
            await api.post('/pharmacy/stock/import', values);
            message.success('Nhập kho thành công');
            setStockModalOpen(false);
            loadMedicines();
            loadAlerts();
        } catch (err: any) {
            if (err.response) message.error(err.response.data.message || 'Lỗi');
        }
    };

    const openEdit = (record: any) => {
        setEditing(record);
        form.setFieldsValue(record);
        setModalOpen(true);
    };

    const medColumns = [
        { title: 'Mã thuốc', dataIndex: 'code', width: 120, render: (v: string) => <Tag color="green">{v}</Tag> },
        { title: 'Tên thuốc', dataIndex: 'name', width: 200, render: (v: string) => <strong>{v}</strong> },
        { title: 'Đơn vị', dataIndex: 'unit', width: 80 },
        { title: 'Nhóm', dataIndex: 'category', width: 130 },
        { title: 'Giá nhập', dataIndex: 'cost_price', width: 120, render: (v: number) => v?.toLocaleString('vi-VN') + 'đ' },
        { title: 'Giá bán', dataIndex: 'sell_price', width: 120, render: (v: number) => <strong style={{ color: '#22d3ee' }}>{v?.toLocaleString('vi-VN')}đ</strong> },
        {
            title: 'Tồn kho', dataIndex: 'current_stock', width: 100, render: (v: number, r: any) => (
                <span style={{ color: v <= (r.min_stock || 10) ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                    {v || 0}
                </span>
            )
        },
        {
            title: '', width: 120, render: (_: any, r: any) => (
                <Space size="small">
                    <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
                    <Button size="small" type="primary" onClick={() => {
                        stockForm.resetFields();
                        stockForm.setFieldsValue({ medicine_id: r.id });
                        setStockModalOpen(true);
                    }}>Nhập kho</Button>
                </Space>
            )
        },
    ];

    const alertCount = (alerts.expiring?.length || 0) + (alerts.lowStock?.length || 0);

    return (
        <div>
            <div className="page-header">
                <h1>💊 Kho thuốc</h1>
                <Space>
                    <Input prefix={<SearchOutlined />} placeholder="Tìm thuốc..." value={search}
                        onChange={e => setSearch(e.target.value)} allowClear style={{ width: 240 }} />
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                        setEditing(null); form.resetFields(); setModalOpen(true);
                    }}>Thêm thuốc</Button>
                </Space>
            </div>

            {/* Alert banner */}
            {alertCount > 0 && (
                <div className="stat-card" style={{ marginBottom: 16, borderColor: '#f59e0b', padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <AlertOutlined style={{ color: '#f59e0b' }} />
                        <strong style={{ color: '#f59e0b' }}>Cảnh báo ({alertCount})</strong>
                    </div>
                    {alerts.expiring?.map((a: any, i: number) => (
                        <p key={`e${i}`} style={{ color: '#94a3b8', margin: '2px 0', fontSize: 13 }}>
                            ⚠️ <strong>{a.medicine?.name || a.name}</strong> — hết hạn {dayjs(a.expiry_date).format('DD/MM/YYYY')} (còn {a.remaining_quantity} {a.medicine?.unit})
                        </p>
                    ))}
                    {alerts.lowStock?.map((a: any, i: number) => (
                        <p key={`l${i}`} style={{ color: '#94a3b8', margin: '2px 0', fontSize: 13 }}>
                            🔴 <strong>{a.name}</strong> — tồn kho thấp ({a.current_stock}/{a.min_stock})
                        </p>
                    ))}
                </div>
            )}

            <Table columns={medColumns} dataSource={medicines} loading={loading} rowKey="id"
                pagination={{ pageSize: 20 }} size="middle" />

            {/* Medicine CRUD Modal */}
            <Modal title={editing ? 'Sửa thuốc' : 'Thêm thuốc mới'} open={modalOpen}
                onCancel={() => setModalOpen(false)} onOk={handleSaveMedicine} width={600} okText="Lưu" cancelText="Hủy">
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="name" label="Tên thuốc" rules={[{ required: true }]}><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="generic_name" label="Hoạt chất"><Input /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="unit" label="Đơn vị" initialValue="Viên">
                            <Select><Option value="Viên">Viên</Option><Option value="Ống">Ống</Option><Option value="Gói">Gói</Option><Option value="Chai">Chai</Option><Option value="Hộp">Hộp</Option><Option value="Tuýp">Tuýp</Option></Select>
                        </Form.Item></Col>
                        <Col span={8}><Form.Item name="category" label="Nhóm"><Input placeholder="Kháng sinh..." /></Form.Item></Col>
                        <Col span={8}><Form.Item name="dosage_form" label="Dạng bào chế"><Input placeholder="Viên nén..." /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="cost_price" label="Giá nhập"><InputNumber style={{ width: '100%' }} min={0} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="sell_price" label="Giá bán"><InputNumber style={{ width: '100%' }} min={0} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="min_stock" label="Tồn tối thiểu"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                    </Row>
                    <Form.Item name="manufacturer" label="Nhà sản xuất"><Input /></Form.Item>
                    <Form.Item name="description" label="Mô tả"><Input.TextArea rows={2} /></Form.Item>
                </Form>
            </Modal>

            {/* Import Stock Modal */}
            <Modal title="Nhập kho thuốc" open={stockModalOpen} onCancel={() => setStockModalOpen(false)}
                onOk={handleImportStock} width={500} okText="Nhập kho" cancelText="Hủy">
                <Form form={stockForm} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item name="medicine_id" label="Thuốc" rules={[{ required: true }]}>
                        <Select placeholder="Chọn thuốc" showSearch filterOption={(input, opt: any) => opt?.children?.toLowerCase().includes(input.toLowerCase())}>
                            {medicines.map(m => <Option key={m.id} value={m.id}>{m.code} - {m.name}</Option>)}
                        </Select>
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="quantity" label="Số lượng" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={1} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="batch_number" label="Số lô"><Input placeholder="LOT-001" /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="expiry_date" label="Hạn sử dụng"><DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="cost_price" label="Giá nhập"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                    </Row>
                    <Form.Item name="supplier" label="Nhà cung cấp"><Input /></Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
