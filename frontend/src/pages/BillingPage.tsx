import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, message, Row, Col, InputNumber, Divider, Statistic } from 'antd';
import { PlusOutlined, SearchOutlined, DollarOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import api, { fetchData } from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;

export default function BillingPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [payModalOpen, setPayModalOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [detail, setDetail] = useState<any>(null);
    const [payingInvoice, setPayingInvoice] = useState<any>(null);
    const [patients, setPatients] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [medicines, setMedicines] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [revenue, setRevenue] = useState<any>({});
    const [form] = Form.useForm();
    const [payForm] = Form.useForm();

    useEffect(() => { load(); loadServices(); loadMedicines(); loadRevenue(); }, []);

    const load = async () => {
        setLoading(true);
        try { setData(await fetchData('/billing')); }
        catch { message.error('Lỗi'); }
        finally { setLoading(false); }
    };

    const loadServices = async () => {
        try { setServices(await fetchData('/services', { status: 'ACTIVE' })); } catch { }
    };
    const loadMedicines = async () => {
        try { setMedicines(await fetchData('/pharmacy/medicines')); } catch { }
    };
    const loadRevenue = async () => {
        try { setRevenue(await fetchData(`/billing/revenue?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`)); } catch { }
    };

    const searchPatients = async (value: string) => {
        if (value.length < 2) return;
        try { const res = await fetchData('/patients', { search: value }); setPatients(res.data || []); } catch { }
    };

    const addItem = (type: 'SERVICE' | 'MEDICINE') => {
        setItems([...items, { item_type: type, item_id: null, item_name: '', quantity: 1, unit_price: 0, amount: 0, insurance_covered: false, insurance_amount: 0 }]);
    };

    const updateItem = (index: number, field: string, value: any) => {
        const rows = [...items];
        rows[index][field] = value;

        if (field === 'item_id') {
            const list = rows[index].item_type === 'SERVICE' ? services : medicines;
            const found = list.find((x: any) => x.id === value);
            if (found) {
                rows[index].item_name = found.name;
                rows[index].unit_price = found.price || found.sell_price || 0;
                rows[index].insurance_covered = found.insurance_covered || false;
            }
        }
        rows[index].amount = (rows[index].unit_price || 0) * (rows[index].quantity || 1);
        setItems(rows);
    };

    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    const totalAmount = items.reduce((s, i) => s + (i.amount || 0), 0);

    const handleCreate = async () => {
        try {
            const values = await form.validateFields();
            const payload = { ...values, items, discount_amount: values.discount_amount || 0 };
            await api.post('/billing', payload);
            message.success('Tạo hóa đơn thành công');
            setModalOpen(false);
            setItems([]);
            form.resetFields();
            load();
            loadRevenue();
        } catch (err: any) {
            if (err.response) message.error(err.response.data.message || 'Lỗi');
        }
    };

    const openPay = (invoice: any) => {
        setPayingInvoice(invoice);
        payForm.setFieldsValue({ amount: Number(invoice.patient_amount) - Number(invoice.paid_amount), method: 'CASH' });
        setPayModalOpen(true);
    };

    const handlePay = async () => {
        try {
            const values = await payForm.validateFields();
            await api.post(`/billing/${payingInvoice.id}/pay`, values);
            message.success('Thanh toán thành công!');
            setPayModalOpen(false);
            load();
            loadRevenue();
        } catch (err: any) {
            if (err.response) message.error(err.response.data.message || 'Lỗi');
        }
    };

    const openDetail = async (id: number) => {
        try { setDetail(await fetchData(`/billing/${id}`)); setDetailOpen(true); }
        catch { message.error('Lỗi'); }
    };

    const statusColors: Record<string, string> = {
        DRAFT: 'default', CONFIRMED: 'blue', PAID: 'green', CANCELLED: 'red',
    };
    const paymentLabels: Record<string, string> = {
        UNPAID: 'Chưa TT', PARTIAL: 'TT một phần', PAID: 'Đã TT',
    };

    const columns = [
        { title: 'Mã HĐ', dataIndex: 'invoice_code', width: 130, render: (v: string) => <Tag color="blue">{v}</Tag> },
        {
            title: 'Bệnh nhân', width: 170, render: (_: any, r: any) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{r.patient?.full_name || '-'}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{r.patient?.patient_code}</div>
                </div>
            )
        },
        {
            title: 'Tổng', dataIndex: 'total_amount', width: 130,
            render: (v: number) => <strong>{Number(v).toLocaleString('vi-VN')}đ</strong>
        },
        {
            title: 'BN phải trả', dataIndex: 'patient_amount', width: 130,
            render: (v: number) => <span style={{ color: '#f59e0b' }}>{Number(v).toLocaleString('vi-VN')}đ</span>
        },
        {
            title: 'Đã trả', dataIndex: 'paid_amount', width: 130,
            render: (v: number) => <span style={{ color: '#10b981' }}>{Number(v).toLocaleString('vi-VN')}đ</span>
        },
        {
            title: 'TT', dataIndex: 'payment_status', width: 100,
            render: (v: string) => <Tag color={v === 'PAID' ? 'green' : v === 'PARTIAL' ? 'orange' : 'red'}>{paymentLabels[v] || v}</Tag>
        },
        {
            title: 'Trạng thái', dataIndex: 'status', width: 100,
            render: (v: string) => <Tag color={statusColors[v]}>{v}</Tag>
        },
        {
            title: '', width: 160, render: (_: any, r: any) => (
                <Space size="small">
                    <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(r.id)} />
                    {r.payment_status !== 'PAID' && r.status !== 'CANCELLED' && (
                        <Button size="small" type="primary" icon={<DollarOutlined />} onClick={() => openPay(r)}>Thu tiền</Button>
                    )}
                </Space>
            )
        },
    ];

    return (
        <div>
            <div className="page-header">
                <h1>💰 Thanh toán</h1>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                    form.resetFields(); setItems([]); setModalOpen(true);
                }}>Tạo hóa đơn</Button>
            </div>

            {/* Revenue stats */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 16 }}>
                <div className="stat-card" style={{ padding: 16 }}>
                    <div className="stat-label">Doanh thu tháng này</div>
                    <div className="stat-value" style={{ fontSize: 24 }}>{Number(revenue.totalRevenue || 0).toLocaleString('vi-VN')}đ</div>
                </div>
                <div className="stat-card" style={{ padding: 16 }}>
                    <div className="stat-label">Số hóa đơn</div>
                    <div className="stat-value" style={{ fontSize: 24 }}>{revenue.totalInvoices || 0}</div>
                </div>
            </div>

            <Table columns={columns} dataSource={data} loading={loading} rowKey="id"
                pagination={{ pageSize: 20 }} size="middle" />

            {/* Create Invoice Modal */}
            <Modal title="Tạo hóa đơn" open={modalOpen} onCancel={() => setModalOpen(false)}
                onOk={handleCreate} width={800} okText="Tạo" cancelText="Hủy">
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item name="patient_id" label="Bệnh nhân" rules={[{ required: true }]}>
                        <Select showSearch filterOption={false} onSearch={searchPatients} placeholder="Tìm bệnh nhân...">
                            {patients.map(p => <Option key={p.id} value={p.id}>{p.patient_code} - {p.full_name}</Option>)}
                        </Select>
                    </Form.Item>

                    <Divider orientation="left" style={{ color: '#94a3b8' }}>Hạng mục</Divider>
                    {items.map((item, i) => (
                        <Row gutter={8} key={i} style={{ marginBottom: 8 }}>
                            <Col span={3}>
                                <Tag color={item.item_type === 'SERVICE' ? 'blue' : 'green'}>{item.item_type === 'SERVICE' ? 'DV' : 'Thuốc'}</Tag>
                            </Col>
                            <Col span={7}>
                                <Select value={item.item_id} onChange={v => updateItem(i, 'item_id', v)} placeholder="Chọn..."
                                    showSearch filterOption={(input, opt: any) => opt?.children?.toLowerCase().includes(input.toLowerCase())}>
                                    {(item.item_type === 'SERVICE' ? services : medicines).map((x: any) =>
                                        <Option key={x.id} value={x.id}>{x.name}</Option>
                                    )}
                                </Select>
                            </Col>
                            <Col span={3}><InputNumber value={item.quantity} onChange={v => updateItem(i, 'quantity', v)} min={1} style={{ width: '100%' }} placeholder="SL" /></Col>
                            <Col span={4}><InputNumber value={item.unit_price} onChange={v => updateItem(i, 'unit_price', v)} style={{ width: '100%' }} placeholder="Đơn giá" /></Col>
                            <Col span={4}><strong style={{ lineHeight: '32px', color: '#22d3ee' }}>{(item.amount || 0).toLocaleString('vi-VN')}đ</strong></Col>
                            <Col span={2}><Button danger size="small" onClick={() => removeItem(i)}>Xóa</Button></Col>
                        </Row>
                    ))}
                    <Space style={{ marginBottom: 16 }}>
                        <Button type="dashed" onClick={() => addItem('SERVICE')} icon={<PlusOutlined />}>Dịch vụ</Button>
                        <Button type="dashed" onClick={() => addItem('MEDICINE')} icon={<PlusOutlined />}>Thuốc</Button>
                    </Space>

                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="discount_amount" label="Giảm giá (VNĐ)"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                        <Col span={16} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <div style={{ fontSize: 18 }}>
                                <strong>Tổng: </strong>
                                <span style={{ color: '#22d3ee', fontWeight: 700, fontSize: 22 }}>{totalAmount.toLocaleString('vi-VN')}đ</span>
                            </div>
                        </Col>
                    </Row>

                    <Form.Item name="note" label="Ghi chú"><Input.TextArea rows={2} /></Form.Item>
                </Form>
            </Modal>

            {/* Pay Modal */}
            <Modal title={`Thanh toán HĐ: ${payingInvoice?.invoice_code || ''}`} open={payModalOpen}
                onCancel={() => setPayModalOpen(false)} onOk={handlePay} okText="Xác nhận" cancelText="Hủy" width={400}>
                <Form form={payForm} layout="vertical" style={{ marginTop: 16 }}>
                    <div style={{ marginBottom: 16, padding: 12, background: '#0f172a', borderRadius: 8 }}>
                        <p><strong>BN phải trả:</strong> <span style={{ color: '#f59e0b' }}>{Number(payingInvoice?.patient_amount || 0).toLocaleString('vi-VN')}đ</span></p>
                        <p><strong>Đã trả:</strong> <span style={{ color: '#10b981' }}>{Number(payingInvoice?.paid_amount || 0).toLocaleString('vi-VN')}đ</span></p>
                        <p><strong>Còn lại:</strong> <span style={{ color: '#ef4444', fontWeight: 700 }}>
                            {(Number(payingInvoice?.patient_amount || 0) - Number(payingInvoice?.paid_amount || 0)).toLocaleString('vi-VN')}đ
                        </span></p>
                    </div>
                    <Form.Item name="amount" label="Số tiền thu" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} min={0} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                    </Form.Item>
                    <Form.Item name="method" label="Phương thức" rules={[{ required: true }]}>
                        <Select>
                            <Option value="CASH">Tiền mặt</Option>
                            <Option value="CARD">Thẻ</Option>
                            <Option value="TRANSFER">Chuyển khoản</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Detail Modal */}
            <Modal title={`Hóa đơn ${detail?.invoice_code || ''}`} open={detailOpen}
                onCancel={() => setDetailOpen(false)} footer={null} width={650}>
                {detail && (
                    <div style={{ lineHeight: 2.2 }}>
                        <p><strong>Bệnh nhân:</strong> {detail.patient?.full_name} ({detail.patient?.patient_code})</p>
                        <p><strong>Ngày:</strong> {dayjs(detail.invoice_date || detail.created_at).format('DD/MM/YYYY')}</p>
                        <Divider style={{ margin: '8px 0' }} />
                        <Table dataSource={detail.items} rowKey="id" pagination={false} size="small" columns={[
                            { title: 'Loại', dataIndex: 'item_type', width: 70, render: (v: string) => <Tag>{v === 'SERVICE' ? 'DV' : 'Thuốc'}</Tag> },
                            { title: 'Tên', dataIndex: 'item_name' },
                            { title: 'SL', dataIndex: 'quantity', width: 60 },
                            { title: 'Đơn giá', dataIndex: 'unit_price', width: 120, render: (v: number) => Number(v).toLocaleString('vi-VN') },
                            { title: 'Thành tiền', dataIndex: 'amount', width: 120, render: (v: number) => <strong>{Number(v).toLocaleString('vi-VN')}đ</strong> },
                        ]} />
                        <div style={{ textAlign: 'right', marginTop: 12 }}>
                            <p><strong>Tổng:</strong> {Number(detail.total_amount).toLocaleString('vi-VN')}đ</p>
                            {Number(detail.discount_amount) > 0 && <p><strong>Giảm giá:</strong> -{Number(detail.discount_amount).toLocaleString('vi-VN')}đ</p>}
                            {Number(detail.insurance_amount) > 0 && <p><strong>BHYT:</strong> -{Number(detail.insurance_amount).toLocaleString('vi-VN')}đ</p>}
                            <p style={{ fontSize: 16, color: '#22d3ee' }}><strong>BN phải trả:</strong> {Number(detail.patient_amount).toLocaleString('vi-VN')}đ</p>
                            <p style={{ color: '#10b981' }}><strong>Đã trả:</strong> {Number(detail.paid_amount).toLocaleString('vi-VN')}đ</p>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
