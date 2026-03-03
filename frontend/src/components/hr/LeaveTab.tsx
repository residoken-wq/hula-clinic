import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, message, DatePicker, Popconfirm, Row, Col } from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import api, { fetchData } from '../../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;

export default function LeaveTab() {
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
