import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, Tag, Space, message, Tabs, Row, Col, InputNumber } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import api, { fetchData } from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;

export default function PatientsPage() {
    const [data, setData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [detail, setDetail] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [form] = Form.useForm();

    useEffect(() => { load(); }, [search]);

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetchData('/patients', { search, limit: 100 });
            setData(res.data || []);
            setTotal(res.total || 0);
        } catch { message.error('Lỗi tải dữ liệu'); }
        finally { setLoading(false); }
    };

    const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
    const openEdit = (record: any) => {
        setEditing(record);
        form.setFieldsValue({
            ...record,
            date_of_birth: record.date_of_birth ? dayjs(record.date_of_birth) : null,
            insurance_expiry: record.insurance_expiry ? dayjs(record.insurance_expiry) : null,
        });
        setModalOpen(true);
    };
    const openDetail = (record: any) => { setDetail(record); setDetailOpen(true); };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            if (values.date_of_birth) values.date_of_birth = values.date_of_birth.format('YYYY-MM-DD');
            if (values.insurance_expiry) values.insurance_expiry = values.insurance_expiry.format('YYYY-MM-DD');

            if (editing) {
                await api.put(`/patients/${editing.id}`, values);
                message.success('Cập nhật thành công');
            } else {
                await api.post('/patients', values);
                message.success('Thêm bệnh nhân thành công');
            }
            setModalOpen(false);
            load();
        } catch (err: any) {
            if (err.response) message.error(err.response.data.message || 'Lỗi');
        }
    };

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bệnh nhân sẽ được chuyển sang trạng thái Không hoạt động',
            okText: 'Xóa', cancelText: 'Hủy',
            onOk: async () => {
                await api.delete(`/patients/${id}`);
                message.success('Đã xóa');
                load();
            },
        });
    };

    const columns = [
        { title: 'Mã BN', dataIndex: 'patient_code', width: 120, render: (v: string) => <Tag color="cyan">{v}</Tag> },
        {
            title: 'Họ tên', dataIndex: 'full_name', width: 180, render: (v: string, r: any) => (
                <a onClick={() => openDetail(r)} style={{ color: '#22d3ee' }}>{v}</a>
            )
        },
        { title: 'SĐT', dataIndex: 'phone', width: 130 },
        {
            title: 'Giới tính', dataIndex: 'gender', width: 90, render: (v: string) => (
                <Tag color={v === 'NAM' ? 'blue' : v === 'NU' ? 'pink' : 'default'}>{v}</Tag>
            )
        },
        {
            title: 'Ngày sinh', dataIndex: 'date_of_birth', width: 120,
            render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '-'
        },
        {
            title: 'BHYT', dataIndex: 'insurance_number', width: 140,
            render: (v: string) => v ? <Tag color="green">Có BHYT</Tag> : <Tag>Không</Tag>
        },
        {
            title: 'Trạng thái', dataIndex: 'status', width: 110,
            render: (v: string) => <Tag color={v === 'ACTIVE' ? 'green' : 'red'}>{v === 'ACTIVE' ? 'Hoạt động' : 'Ngừng'}</Tag>
        },
        {
            title: '', width: 120, render: (_: any, r: any) => (
                <Space size="small">
                    <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)} />
                    <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.id)} />
                </Space>
            )
        },
    ];

    return (
        <div>
            <div className="page-header">
                <h1>👤 Bệnh nhân</h1>
                <Space>
                    <Input placeholder="Tìm tên / mã BN..." prefix={<SearchOutlined />}
                        value={search} onChange={e => setSearch(e.target.value)} allowClear style={{ width: 260 }} />
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Thêm mới</Button>
                </Space>
            </div>
            <div style={{ color: '#64748b', marginBottom: 12 }}>Tổng: {total} bệnh nhân</div>

            <Table columns={columns} dataSource={data} loading={loading} rowKey="id"
                pagination={{ pageSize: 20, showSizeChanger: false }} scroll={{ x: 1000 }}
                size="middle" />

            {/* Create/Edit Modal */}
            <Modal title={editing ? 'Sửa bệnh nhân' : 'Thêm bệnh nhân mới'} open={modalOpen}
                onCancel={() => setModalOpen(false)} onOk={handleSave} width={700} okText="Lưu" cancelText="Hủy">
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Tabs items={[
                        {
                            key: '1', label: 'Thông tin cơ bản', children: (
                                <>
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item name="full_name" label="Họ tên" rules={[{ required: true }]}>
                                                <Input placeholder="Nguyễn Văn A" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item name="gender" label="Giới tính" initialValue="NAM">
                                                <Select>
                                                    <Option value="NAM">Nam</Option>
                                                    <Option value="NU">Nữ</Option>
                                                    <Option value="KHAC">Khác</Option>
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item name="date_of_birth" label="Ngày sinh">
                                                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} placeholder="Chọn ngày" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item name="phone" label="SĐT">
                                                <Input placeholder="0901234567" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item name="email" label="Email">
                                                <Input placeholder="email@example.com" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item name="id_number" label="CMND/CCCD">
                                                <Input placeholder="Số CCCD" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Form.Item name="address" label="Địa chỉ">
                                        <Input placeholder="Địa chỉ" />
                                    </Form.Item>
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item name="blood_type" label="Nhóm máu">
                                                <Select allowClear placeholder="Chọn">
                                                    {['A', 'B', 'O', 'AB'].map(bt => <Option key={bt} value={bt}>{bt}</Option>)}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Form.Item name="allergies" label="Dị ứng">
                                        <Input.TextArea rows={2} placeholder="Ghi chú dị ứng..." />
                                    </Form.Item>
                                    <Form.Item name="medical_history" label="Tiền sử bệnh">
                                        <Input.TextArea rows={2} placeholder="Tiền sử..." />
                                    </Form.Item>
                                </>
                            )
                        },
                        {
                            key: '2', label: 'Bảo hiểm y tế', children: (
                                <>
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item name="insurance_number" label="Số thẻ BHYT">
                                                <Input placeholder="Mã BHYT" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item name="insurance_provider" label="Nơi cấp">
                                                <Input placeholder="BHXH TP.HCM" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Form.Item name="insurance_expiry" label="Hạn thẻ">
                                        <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                                    </Form.Item>
                                </>
                            )
                        },
                        {
                            key: '3', label: 'Liên hệ khẩn cấp', children: (
                                <>
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item name="emergency_contact_name" label="Họ tên">
                                                <Input />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item name="emergency_contact_phone" label="SĐT">
                                                <Input />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Form.Item name="emergency_contact_relation" label="Quan hệ">
                                        <Input placeholder="Vợ / Chồng / Con..." />
                                    </Form.Item>
                                </>
                            )
                        },
                    ]} />
                    <Form.Item name="note" label="Ghi chú">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Detail Modal */}
            <Modal title="Chi tiết bệnh nhân" open={detailOpen} onCancel={() => setDetailOpen(false)}
                footer={null} width={600}>
                {detail && (
                    <div style={{ lineHeight: 2.2 }}>
                        <p><strong>Mã BN:</strong> <Tag color="cyan">{detail.patient_code}</Tag></p>
                        <p><strong>Họ tên:</strong> {detail.full_name}</p>
                        <p><strong>Giới tính:</strong> {detail.gender}</p>
                        <p><strong>Ngày sinh:</strong> {detail.date_of_birth ? dayjs(detail.date_of_birth).format('DD/MM/YYYY') : '-'}</p>
                        <p><strong>SĐT:</strong> {detail.phone || '-'}</p>
                        <p><strong>Email:</strong> {detail.email || '-'}</p>
                        <p><strong>CCCD:</strong> {detail.id_number || '-'}</p>
                        <p><strong>Địa chỉ:</strong> {detail.address || '-'}</p>
                        <p><strong>Nhóm máu:</strong> {detail.blood_type || '-'}</p>
                        <p><strong>Dị ứng:</strong> {detail.allergies || 'Không'}</p>
                        <p><strong>Tiền sử:</strong> {detail.medical_history || 'Không'}</p>
                        <p><strong>BHYT:</strong> {detail.insurance_number || 'Không có'}</p>
                        <p><strong>LH khẩn cấp:</strong> {detail.emergency_contact_name} - {detail.emergency_contact_phone}</p>
                    </div>
                )}
            </Modal>
        </div>
    );
}
