import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, message, Popconfirm, Switch, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined } from '@ant-design/icons';
import api, { fetchData } from '../../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;

export default function UsersTab() {
    const [users, setUsers] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [pwModalOpen, setPwModalOpen] = useState(false);
    const [pwUserId, setPwUserId] = useState<number | null>(null);
    const [form] = Form.useForm();
    const [pwForm] = Form.useForm();

    useEffect(() => { load(); loadGroups(); }, []);

    const load = async () => {
        setLoading(true);
        try { setUsers(await fetchData('/users')); } catch { } finally { setLoading(false); }
    };

    const loadGroups = async () => {
        try { setGroups(await fetchData('/users/groups/all')); } catch { }
    };

    const openModal = (user?: any) => {
        setEditing(user || null);
        if (user) {
            form.setFieldsValue({ ...user, password: undefined });
        } else {
            form.resetFields();
        }
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            if (!editing && !values.password) { message.error('Vui lòng nhập mật khẩu'); return; }
            if (editing && !values.password) delete values.password;

            if (editing) {
                await api.put(`/users/${editing.id}`, values);
                message.success('Cập nhật thành công');
            } else {
                await api.post('/users', values);
                message.success('Tạo tài khoản thành công');
            }
            setModalOpen(false);
            form.resetFields();
            load();
        } catch (err: any) {
            if (err.response) message.error(err.response.data.message || 'Lỗi');
        }
    };

    const handleDelete = async (id: number) => {
        await api.delete(`/users/${id}`);
        message.success('Đã xóa');
        load();
    };

    const handleChangePw = async () => {
        try {
            const values = await pwForm.validateFields();
            await api.post(`/users/${pwUserId}/change-password`, { password: values.password });
            message.success('Đổi mật khẩu thành công');
            setPwModalOpen(false);
            pwForm.resetFields();
        } catch (err: any) {
            if (err.response) message.error(err.response.data.message || 'Lỗi');
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', width: 60 },
        { title: 'Username', dataIndex: 'username', width: 120, render: (v: string) => <strong style={{ color: '#22d3ee' }}>{v}</strong> },
        { title: 'Họ tên', dataIndex: 'full_name', width: 160 },
        { title: 'Email', dataIndex: 'email', width: 160 },
        { title: 'SĐT', dataIndex: 'phone', width: 120 },
        { title: 'Nhóm quyền', width: 130, render: (_: any, r: any) => r.group ? <Tag color="blue">{r.group.name}</Tag> : <Tag>Chưa gán</Tag> },
        { title: 'Trạng thái', dataIndex: 'is_active', width: 100, render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Hoạt động' : 'Khóa'}</Tag> },
        { title: 'Hoạt động cuối', dataIndex: 'last_activity_at', width: 140, render: (v: string) => v ? dayjs(v).format('DD/MM HH:mm') : '—' },
        {
            title: '', width: 140, render: (_: any, r: any) => (
                <Space size="small">
                    <Button size="small" icon={<EditOutlined />} onClick={() => openModal(r)} />
                    <Button size="small" icon={<LockOutlined />} onClick={() => { setPwUserId(r.id); setPwModalOpen(true); }} />
                    <Popconfirm title="Xóa tài khoản?" onConfirm={() => handleDelete(r.id)} okText="Xóa" cancelText="Hủy">
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        },
    ];

    return (
        <div>
            <div style={{ textAlign: 'right', marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Thêm tài khoản</Button>
            </div>

            <Table columns={columns} dataSource={users} loading={loading}
                rowKey="id" pagination={{ pageSize: 20 }} size="middle" />

            <Modal title={editing ? '✏️ Sửa tài khoản' : '➕ Thêm tài khoản'}
                open={modalOpen} onCancel={() => { setModalOpen(false); form.resetFields(); }}
                onOk={handleSave} okText={editing ? 'Cập nhật' : 'Tạo'} cancelText="Hủy" width={500}>
                <Form form={form} layout="vertical">
                    <Form.Item name="username" label="Username" rules={[{ required: true }]}>
                        <Input disabled={!!editing} />
                    </Form.Item>
                    {!editing && <Form.Item name="password" label="Mật khẩu" rules={[{ required: true }]}>
                        <Input.Password />
                    </Form.Item>}
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="full_name" label="Họ tên"><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="email" label="Email"><Input /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="phone" label="SĐT"><Input /></Form.Item></Col>
                        <Col span={12}>
                            <Form.Item name="group_id" label="Nhóm quyền">
                                <Select allowClear placeholder="Chọn nhóm">
                                    {groups.map(g => <Option key={g.id} value={g.id}>{g.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="is_active" label="Trạng thái" valuePropName="checked" initialValue={true}>
                        <Switch checkedChildren="Hoạt động" unCheckedChildren="Khóa" />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal title="🔑 Đổi mật khẩu" open={pwModalOpen}
                onCancel={() => { setPwModalOpen(false); pwForm.resetFields(); }}
                onOk={handleChangePw} okText="Đổi" cancelText="Hủy">
                <Form form={pwForm} layout="vertical">
                    <Form.Item name="password" label="Mật khẩu mới" rules={[{ required: true, min: 6 }]}>
                        <Input.Password />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
