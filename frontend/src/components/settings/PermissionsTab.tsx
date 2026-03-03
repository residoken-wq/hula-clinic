import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Input, Space, message, Checkbox, Popconfirm, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api, { fetchData } from '../../utils/api';

const ALL_MODULES = [
    { code: 'PATIENTS', label: 'Bệnh nhân' },
    { code: 'APPOINTMENTS', label: 'Lịch hẹn' },
    { code: 'EMR', label: 'Bệnh án' },
    { code: 'PHARMACY', label: 'Kho thuốc' },
    { code: 'SERVICES', label: 'Dịch vụ' },
    { code: 'BILLING', label: 'Thanh toán' },
    { code: 'DOCTORS', label: 'Bác sĩ' },
    { code: 'ROOMS', label: 'Phòng khám' },
    { code: 'FINANCE', label: 'Tài chính' },
    { code: 'HR', label: 'Nhân sự' },
    { code: 'TASKS', label: 'Công việc' },
    { code: 'USERS', label: 'Tài khoản' },
    { code: 'SETTINGS', label: 'Cài đặt' },
];

const thStyle: React.CSSProperties = { padding: '10px 6px', color: '#94a3b8', fontWeight: 600, borderBottom: '2px solid #334155', fontSize: 12 };
const subThStyle: React.CSSProperties = { padding: '4px 2px', color: '#64748b', fontWeight: 500, borderBottom: '1px solid #334155', fontSize: 11, textAlign: 'center', minWidth: 36 };
const tdStyle: React.CSSProperties = { padding: '8px 6px', color: '#e2e8f0', borderBottom: '1px solid #1e293b' };

export default function PermissionsTab() {
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [groupModalOpen, setGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<any>(null);
    const [saving, setSaving] = useState<number | null>(null);
    const [form] = Form.useForm();

    useEffect(() => { loadGroups(); }, []);

    const loadGroups = async () => {
        setLoading(true);
        try { setGroups(await fetchData('/users/groups/all')); } catch { }
        finally { setLoading(false); }
    };

    const openGroupModal = (group?: any) => {
        setEditingGroup(group || null);
        form.setFieldsValue(group || { name: '', description: '' });
        setGroupModalOpen(true);
    };

    const handleSaveGroup = async () => {
        try {
            const values = await form.validateFields();
            if (editingGroup) {
                await api.put(`/users/groups/${editingGroup.id}`, values);
                message.success('Cập nhật nhóm thành công');
            } else {
                await api.post('/users/groups', values);
                message.success('Tạo nhóm thành công');
            }
            setGroupModalOpen(false);
            loadGroups();
        } catch (err: any) {
            if (err.response) message.error(err.response.data.message || 'Lỗi');
        }
    };

    const handleDeleteGroup = async (id: number) => {
        await api.delete(`/users/groups/${id}`);
        message.success('Đã xóa nhóm');
        loadGroups();
    };

    const togglePermission = async (group: any, moduleCode: string, field: string) => {
        setSaving(group.id);
        const perms = group.permissions || [];
        const existing = perms.find((p: any) => p.module_code === moduleCode);

        let updated: any[];
        if (existing) {
            updated = perms.map((p: any) =>
                p.module_code === moduleCode ? { ...p, [field]: !p[field] } : p
            );
        } else {
            updated = [...perms, { module_code: moduleCode, can_view: false, can_edit: false, can_delete: false, [field]: true }];
        }

        try {
            await api.put(`/users/groups/${group.id}/permissions`, {
                permissions: updated.map(({ module_code, can_view, can_edit, can_delete }: any) => ({ module_code, can_view, can_edit, can_delete }))
            });
            loadGroups();
        } catch { message.error('Lỗi cập nhật quyền'); }
        finally { setSaving(null); }
    };

    const getPermValue = (group: any, moduleCode: string, field: string) => {
        const perm = (group.permissions || []).find((p: any) => p.module_code === moduleCode);
        return perm ? perm[field] : false;
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ color: '#e2e8f0', margin: 0 }}>Ma trận phân quyền</h3>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openGroupModal()}>Thêm nhóm quyền</Button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                        <tr style={{ background: '#0f172a' }}>
                            <th style={{ ...thStyle, width: 180, textAlign: 'left', position: 'sticky', left: 0, background: '#0f172a', zIndex: 1 }}>Nhóm quyền</th>
                            {ALL_MODULES.map(m => (
                                <th key={m.code} colSpan={3} style={{ ...thStyle, textAlign: 'center', borderLeft: '2px solid #334155' }}>
                                    {m.label}
                                </th>
                            ))}
                            <th style={thStyle}></th>
                        </tr>
                        <tr style={{ background: '#0f172a' }}>
                            <th style={{ ...thStyle, position: 'sticky', left: 0, background: '#0f172a', zIndex: 1 }}></th>
                            {ALL_MODULES.map(m => (
                                <React.Fragment key={m.code}>
                                    <th style={{ ...subThStyle, borderLeft: '2px solid #334155' }}>Xem</th>
                                    <th style={subThStyle}>Sửa</th>
                                    <th style={subThStyle}>Xóa</th>
                                </React.Fragment>
                            ))}
                            <th style={subThStyle}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {groups.map(g => (
                            <tr key={g.id} style={{ borderBottom: '1px solid #1e293b' }}>
                                <td style={{ ...tdStyle, fontWeight: 600, color: '#22d3ee', position: 'sticky', left: 0, background: '#1e293b', zIndex: 1 }}>
                                    <Tooltip title={g.description}>{g.name}</Tooltip>
                                </td>
                                {ALL_MODULES.map(m => (
                                    <React.Fragment key={m.code}>
                                        <td style={{ ...tdStyle, textAlign: 'center', borderLeft: '2px solid #334155' }}>
                                            <Checkbox checked={getPermValue(g, m.code, 'can_view')} onChange={() => togglePermission(g, m.code, 'can_view')} disabled={saving === g.id} />
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                                            <Checkbox checked={getPermValue(g, m.code, 'can_edit')} onChange={() => togglePermission(g, m.code, 'can_edit')} disabled={saving === g.id} />
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                                            <Checkbox checked={getPermValue(g, m.code, 'can_delete')} onChange={() => togglePermission(g, m.code, 'can_delete')} disabled={saving === g.id} />
                                        </td>
                                    </React.Fragment>
                                ))}
                                <td style={{ ...tdStyle, textAlign: 'center' }}>
                                    <Space size="small">
                                        <Button size="small" icon={<EditOutlined />} onClick={() => openGroupModal(g)} />
                                        <Popconfirm title="Xóa nhóm này?" onConfirm={() => handleDeleteGroup(g.id)} okText="Xóa" cancelText="Hủy">
                                            <Button size="small" danger icon={<DeleteOutlined />} />
                                        </Popconfirm>
                                    </Space>
                                </td>
                            </tr>
                        ))}
                        {groups.length === 0 && (
                            <tr><td colSpan={ALL_MODULES.length * 3 + 2} style={{ ...tdStyle, textAlign: 'center', color: '#64748b', padding: 32 }}>
                                Chưa có nhóm quyền nào. Nhấn "Thêm nhóm quyền" để tạo.
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal title={editingGroup ? '✏️ Sửa nhóm quyền' : '➕ Thêm nhóm quyền'} open={groupModalOpen}
                onCancel={() => setGroupModalOpen(false)} onOk={handleSaveGroup}
                okText={editingGroup ? 'Cập nhật' : 'Tạo'} cancelText="Hủy">
                <Form form={form} layout="vertical">
                    <Form.Item name="name" label="Tên nhóm" rules={[{ required: true }]}>
                        <Input placeholder="Admin, Bác sĩ, Lễ tân..." />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả">
                        <Input.TextArea rows={2} placeholder="Mô tả nhóm quyền" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
