import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, message, DatePicker, InputNumber, Popconfirm, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api, { fetchData } from '../../utils/api';
import dayjs from 'dayjs';
import { fmtMoney } from './utils';

const { Option } = Select;

export default function EmployeesTab({ onUpdate }: { onUpdate: () => void }) {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [filterDept, setFilterDept] = useState<string>();
    const [filterStatus, setFilterStatus] = useState<string>();
    const [form] = Form.useForm();

    useEffect(() => { load(); }, [filterDept, filterStatus]);

    const load = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (filterDept) params.department = filterDept;
            if (filterStatus) params.status = filterStatus;
            const res = await fetchData('/hr/employees', params);
            setEmployees(Array.isArray(res) ? res : []);
        } catch { message.error('Lỗi tải danh sách'); }
        finally { setLoading(false); }
    };

    const openModal = (emp?: any) => {
        setEditing(emp || null);
        if (emp) {
            form.setFieldsValue({
                ...emp,
                date_of_birth: emp.date_of_birth ? dayjs(emp.date_of_birth) : null,
                join_date: emp.join_date ? dayjs(emp.join_date) : null,
            });
        } else {
            form.resetFields();
        }
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            if (values.date_of_birth) values.date_of_birth = values.date_of_birth.format('YYYY-MM-DD');
            if (values.join_date) values.join_date = values.join_date.format('YYYY-MM-DD');

            if (editing) {
                await api.put(`/hr/employees/${editing.id}`, values);
                message.success('Cập nhật thành công');
            } else {
                await api.post('/hr/employees', values);
                message.success('Tạo nhân viên thành công');
            }
            setModalOpen(false);
            form.resetFields();
            load();
            onUpdate();
        } catch (err: any) {
            if (err.response) message.error(err.response.data.message || 'Lỗi');
        }
    };

    const handleDelete = async (id: number) => {
        await api.delete(`/hr/employees/${id}`);
        message.success('Đã xóa');
        load();
        onUpdate();
    };

    const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

    const columns = [
        { title: 'Mã NV', dataIndex: 'employee_code', width: 100, render: (v: string) => <strong style={{ color: '#22d3ee' }}>{v}</strong> },
        { title: 'Họ tên', dataIndex: 'full_name', width: 160 },
        { title: 'Chức vụ', dataIndex: 'position', width: 120 },
        { title: 'Phòng ban', dataIndex: 'department', width: 120 },
        { title: 'SĐT', dataIndex: 'phone', width: 120 },
        {
            title: 'Lương CB', dataIndex: 'base_salary', width: 120, align: 'right' as const,
            render: (v: number) => <span style={{ color: '#10b981' }}>{fmtMoney(v)}</span>
        },
        {
            title: 'Trạng thái', dataIndex: 'status', width: 100,
            render: (v: string) => {
                const color = v === 'ACTIVE' ? 'green' : v === 'RESIGNED' ? 'red' : 'orange';
                const label = v === 'ACTIVE' ? 'Đang làm' : v === 'RESIGNED' ? 'Nghỉ việc' : 'Tạm nghỉ';
                return <Tag color={color}>{label}</Tag>;
            }
        },
        {
            title: '', width: 100, render: (_: any, r: any) => (
                <Space size="small">
                    <Button size="small" icon={<EditOutlined />} onClick={() => openModal(r)} />
                    <Popconfirm title="Xóa nhân viên này?" onConfirm={() => handleDelete(r.id)}
                        okText="Xóa" cancelText="Hủy">
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
                    <Select allowClear placeholder="Phòng ban" style={{ width: 160 }}
                        value={filterDept} onChange={setFilterDept}>
                        {departments.map(d => <Option key={d} value={d}>{d}</Option>)}
                    </Select>
                    <Select allowClear placeholder="Trạng thái" style={{ width: 140 }}
                        value={filterStatus} onChange={setFilterStatus}>
                        <Option value="ACTIVE">Đang làm</Option>
                        <Option value="INACTIVE">Tạm nghỉ</Option>
                        <Option value="RESIGNED">Nghỉ việc</Option>
                    </Select>
                </Space>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Thêm nhân viên</Button>
            </div>

            <Table columns={columns} dataSource={employees} loading={loading}
                rowKey="id" pagination={{ pageSize: 20 }} size="middle" />

            <Modal title={editing ? '✏️ Sửa nhân viên' : '➕ Thêm nhân viên mới'}
                open={modalOpen} onCancel={() => { setModalOpen(false); form.resetFields(); }}
                onOk={handleSave} width={700} okText={editing ? 'Cập nhật' : 'Tạo'} cancelText="Hủy">
                <Form form={form} layout="vertical">
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="full_name" label="Họ tên" rules={[{ required: true }]}><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="employee_code" label="Mã NV"><Input placeholder="Tự tạo nếu để trống" /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="position" label="Chức vụ"><Input placeholder="Bác sĩ, Y tá..." /></Form.Item></Col>
                        <Col span={8}><Form.Item name="department" label="Phòng ban"><Input placeholder="Khoa Nội..." /></Form.Item></Col>
                        <Col span={8}>
                            <Form.Item name="gender" label="Giới tính">
                                <Select allowClear><Option value="Nam">Nam</Option><Option value="Nữ">Nữ</Option></Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="phone" label="SĐT"><Input /></Form.Item></Col>
                        <Col span={8}><Form.Item name="email" label="Email"><Input /></Form.Item></Col>
                        <Col span={8}><Form.Item name="date_of_birth" label="Ngày sinh"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="base_salary" label="Lương cơ bản"><InputNumber style={{ width: '100%' }} min={0} formatter={v => fmtMoney(Number(v))} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="join_date" label="Ngày vào"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                        <Col span={8}>
                            <Form.Item name="status" label="Trạng thái" initialValue="ACTIVE">
                                <Select><Option value="ACTIVE">Đang làm</Option><Option value="INACTIVE">Tạm nghỉ</Option><Option value="RESIGNED">Nghỉ việc</Option></Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="id_number" label="CCCD/CMND"><Input /></Form.Item></Col>
                        <Col span={8}><Form.Item name="tax_code" label="Mã số thuế"><Input /></Form.Item></Col>
                        <Col span={8}><Form.Item name="insurance_number" label="Số BHXH"><Input /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="bank_account" label="Số TK ngân hàng"><Input /></Form.Item></Col>
                        <Col span={8}><Form.Item name="bank_name" label="Ngân hàng"><Input placeholder="Vietcombank..." /></Form.Item></Col>
                        <Col span={8}><Form.Item name="address" label="Địa chỉ"><Input /></Form.Item></Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
}
