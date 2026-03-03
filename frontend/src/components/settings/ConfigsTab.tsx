import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api, { fetchData } from '../../utils/api';

export default function ConfigsTab() {
    const [configs, setConfigs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form] = Form.useForm();

    useEffect(() => { load(); }, []);

    const load = async () => {
        setLoading(true);
        try { setConfigs(await fetchData('/system/configs')); } catch { } finally { setLoading(false); }
    };

    const openModal = (item?: any) => {
        setEditing(item || null);
        form.setFieldsValue(item || { key: '', value: '', description: '' });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            await api.post('/system/configs', values);
            message.success(editing ? 'Cập nhật thành công' : 'Thêm thành công');
            setModalOpen(false);
            load();
        } catch (err: any) {
            if (err.response) message.error(err.response.data.message || 'Lỗi');
        }
    };

    const handleDelete = async (id: number) => {
        await api.delete(`/system/configs/${id}`);
        message.success('Đã xóa'); load();
    };

    const columns = [
        { title: 'Key', dataIndex: 'key', width: 200, render: (v: string) => <strong style={{ color: '#22d3ee', fontFamily: 'monospace' }}>{v}</strong> },
        { title: 'Value', dataIndex: 'value', width: 300, render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span> },
        { title: 'Mô tả', dataIndex: 'description', width: 250 },
        {
            title: '', width: 80, render: (_: any, r: any) => (
                <Space size="small">
                    <Button size="small" icon={<EditOutlined />} onClick={() => openModal(r)} />
                    <Popconfirm title="Xóa config?" onConfirm={() => handleDelete(r.id)} okText="Xóa" cancelText="Hủy">
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        },
    ];

    return (
        <div>
            <div style={{ textAlign: 'right', marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Thêm cấu hình</Button>
            </div>
            <Table columns={columns} dataSource={configs} loading={loading}
                rowKey="id" pagination={false} size="middle" />

            <Modal title={editing ? '✏️ Sửa cấu hình' : '➕ Thêm cấu hình'} open={modalOpen}
                onCancel={() => setModalOpen(false)} onOk={handleSave}
                okText="Lưu" cancelText="Hủy">
                <Form form={form} layout="vertical">
                    <Form.Item name="key" label="Key" rules={[{ required: true }]}>
                        <Input placeholder="clinic_name" disabled={!!editing} style={{ fontFamily: 'monospace' }} />
                    </Form.Item>
                    <Form.Item name="value" label="Value" rules={[{ required: true }]}>
                        <Input.TextArea rows={3} style={{ fontFamily: 'monospace' }} />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả">
                        <Input placeholder="Mô tả cấu hình" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
