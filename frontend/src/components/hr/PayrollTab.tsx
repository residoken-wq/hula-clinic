import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, message, DatePicker, InputNumber, Popconfirm, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons';
import api, { fetchData } from '../../utils/api';
import dayjs from 'dayjs';
import { fmtMoney } from './utils';

const { Option } = Select;

export default function PayrollTab({ onUpdate }: { onUpdate: () => void }) {
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
            form.setFieldsValues({ month, status: 'DRAFT' });
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
