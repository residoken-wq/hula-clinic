import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, Tag, Space, message, Row, Col, Divider, InputNumber } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, FileTextOutlined } from '@ant-design/icons';
import api, { fetchData } from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

export default function MedicalRecordsPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [detail, setDetail] = useState<any>(null);
    const [patients, setPatients] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [medicines, setMedicines] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [prescriptionRows, setPrescriptionRows] = useState<any[]>([]);
    const [form] = Form.useForm();

    useEffect(() => { load(); loadDoctors(); loadMedicines(); }, [search]);

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetchData('/medical-records', { search });
            setData(Array.isArray(res) ? res : []);
        } catch { message.error('Lỗi tải dữ liệu'); }
        finally { setLoading(false); }
    };

    const loadDoctors = async () => {
        try {
            const res = await fetchData('/hr/employees');
            setDoctors(Array.isArray(res) ? res : res.data || []);
        } catch { }
    };

    const loadMedicines = async () => {
        try {
            const res = await fetchData('/pharmacy/medicines');
            setMedicines(Array.isArray(res) ? res : []);
        } catch { }
    };

    const searchPatients = async (value: string) => {
        if (value.length < 2) return;
        try {
            const res = await fetchData('/patients', { search: value });
            setPatients(res.data || []);
        } catch { }
    };

    const addPrescriptionRow = () => {
        setPrescriptionRows([...prescriptionRows, { medicine_id: null, medicine_name: '', dosage: '', frequency: '', duration: '', quantity: 1, note: '' }]);
    };

    const updatePrescriptionRow = (index: number, field: string, value: any) => {
        const rows = [...prescriptionRows];
        rows[index][field] = value;
        if (field === 'medicine_id') {
            const med = medicines.find(m => m.id === value);
            if (med) rows[index].medicine_name = med.name;
        }
        setPrescriptionRows(rows);
    };

    const removePrescriptionRow = (index: number) => {
        setPrescriptionRows(prescriptionRows.filter((_, i) => i !== index));
    };

    const handleCreate = async () => {
        try {
            const values = await form.validateFields();
            values.exam_date = values.exam_date?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD');

            // Build vital_signs
            values.vital_signs = JSON.stringify({
                blood_pressure: values.blood_pressure,
                heart_rate: values.heart_rate,
                temperature: values.temperature,
                weight: values.weight,
                height: values.height,
            });

            const payload = { ...values, prescriptions: prescriptionRows.filter(r => r.medicine_name) };
            await api.post('/medical-records', payload);
            message.success('Tạo bệnh án thành công');
            setModalOpen(false);
            form.resetFields();
            setPrescriptionRows([]);
            load();
        } catch (err: any) {
            if (err.response) message.error(err.response.data.message || 'Lỗi');
        }
    };

    const openDetail = async (id: number) => {
        try {
            const res = await fetchData(`/medical-records/${id}`);
            setDetail(res);
            setDetailOpen(true);
        } catch { message.error('Lỗi'); }
    };

    const columns = [
        { title: 'Mã BA', dataIndex: 'record_code', width: 130, render: (v: string) => <Tag color="purple">{v}</Tag> },
        {
            title: 'Bệnh nhân', width: 170, render: (_: any, r: any) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{r.patient?.full_name || '-'}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{r.patient?.patient_code}</div>
                </div>
            )
        },
        {
            title: 'Ngày khám', dataIndex: 'exam_date', width: 110,
            render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '-'
        },
        { title: 'Chẩn đoán', dataIndex: 'diagnosis', width: 200, ellipsis: true },
        { title: 'Bác sĩ', width: 140, render: (_: any, r: any) => r.doctor?.full_name || '-' },
        {
            title: 'Trạng thái', dataIndex: 'status', width: 110, render: (v: string) => (
                <Tag color={v === 'COMPLETED' ? 'green' : v === 'IN_PROGRESS' ? 'blue' : 'default'}>
                    {v === 'COMPLETED' ? 'Hoàn thành' : v === 'IN_PROGRESS' ? 'Đang khám' : v}
                </Tag>
            )
        },
        {
            title: '', width: 80, render: (_: any, r: any) => (
                <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(r.id)}>Xem</Button>
            )
        },
    ];

    const vitalSigns = detail?.vital_signs ? (typeof detail.vital_signs === 'string' ? JSON.parse(detail.vital_signs) : detail.vital_signs) : {};

    return (
        <div>
            <div className="page-header">
                <h1>📋 Bệnh án</h1>
                <Space>
                    <Input placeholder="Tìm mã BA / bệnh nhân..." prefix={<SearchOutlined />}
                        value={search} onChange={e => setSearch(e.target.value)} allowClear style={{ width: 260 }} />
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                        form.resetFields();
                        form.setFieldsValue({ exam_date: dayjs() });
                        setPrescriptionRows([]);
                        setModalOpen(true);
                    }}>Tạo bệnh án</Button>
                </Space>
            </div>

            <Table columns={columns} dataSource={data} loading={loading} rowKey="id"
                pagination={{ pageSize: 20 }} size="middle" />

            {/* Create Modal */}
            <Modal title="Tạo bệnh án mới" open={modalOpen} onCancel={() => setModalOpen(false)}
                onOk={handleCreate} width={800} okText="Lưu" cancelText="Hủy">
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="patient_id" label="Bệnh nhân" rules={[{ required: true }]}>
                                <Select showSearch filterOption={false} onSearch={searchPatients} placeholder="Tìm bệnh nhân...">
                                    {patients.map(p => <Option key={p.id} value={p.id}>{p.patient_code} - {p.full_name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="exam_date" label="Ngày khám">
                                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="doctor_id" label="Bác sĩ">
                                <Select allowClear placeholder="Chọn">
                                    {doctors.map(d => <Option key={d.id} value={d.id}>{d.full_name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation="left" style={{ color: '#94a3b8' }}>Sinh hiệu</Divider>
                    <Row gutter={12}>
                        <Col span={5}><Form.Item name="blood_pressure" label="Huyết áp"><Input placeholder="120/80" /></Form.Item></Col>
                        <Col span={5}><Form.Item name="heart_rate" label="Nhịp tim"><InputNumber placeholder="72" style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={5}><Form.Item name="temperature" label="Nhiệt độ"><InputNumber placeholder="37" step={0.1} style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={5}><Form.Item name="weight" label="Cân nặng (kg)"><InputNumber placeholder="60" style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={4}><Form.Item name="height" label="Chiều cao (cm)"><InputNumber placeholder="165" style={{ width: '100%' }} /></Form.Item></Col>
                    </Row>

                    <Form.Item name="symptoms" label="Triệu chứng"><TextArea rows={2} placeholder="Mô tả triệu chứng..." /></Form.Item>
                    <Form.Item name="diagnosis" label="Chẩn đoán" rules={[{ required: true }]}><TextArea rows={2} placeholder="Chẩn đoán..." /></Form.Item>
                    <Form.Item name="treatment_plan" label="Kế hoạch điều trị"><TextArea rows={2} placeholder="Phương pháp điều trị..." /></Form.Item>

                    <Divider orientation="left" style={{ color: '#94a3b8' }}>Đơn thuốc</Divider>
                    {prescriptionRows.map((row, i) => (
                        <Row gutter={8} key={i} style={{ marginBottom: 8 }}>
                            <Col span={6}>
                                <Select value={row.medicine_id} onChange={v => updatePrescriptionRow(i, 'medicine_id', v)}
                                    placeholder="Thuốc" showSearch filterOption={(input, opt: any) => opt?.children?.toLowerCase().includes(input.toLowerCase())}>
                                    {medicines.map(m => <Option key={m.id} value={m.id}>{m.name}</Option>)}
                                </Select>
                            </Col>
                            <Col span={4}><Input value={row.dosage} onChange={e => updatePrescriptionRow(i, 'dosage', e.target.value)} placeholder="Liều" /></Col>
                            <Col span={4}><Input value={row.frequency} onChange={e => updatePrescriptionRow(i, 'frequency', e.target.value)} placeholder="Tần suất" /></Col>
                            <Col span={3}><Input value={row.duration} onChange={e => updatePrescriptionRow(i, 'duration', e.target.value)} placeholder="Ngày" /></Col>
                            <Col span={3}><InputNumber value={row.quantity} onChange={v => updatePrescriptionRow(i, 'quantity', v)} min={1} style={{ width: '100%' }} /></Col>
                            <Col span={2}><Button danger size="small" onClick={() => removePrescriptionRow(i)}>Xóa</Button></Col>
                        </Row>
                    ))}
                    <Button type="dashed" onClick={addPrescriptionRow} icon={<PlusOutlined />} block>Thêm thuốc</Button>

                    <Form.Item name="note" label="Ghi chú" style={{ marginTop: 16 }}><TextArea rows={2} /></Form.Item>
                </Form>
            </Modal>

            {/* Detail Modal */}
            <Modal title={`Bệnh án ${detail?.record_code || ''}`} open={detailOpen}
                onCancel={() => setDetailOpen(false)} footer={null} width={700}>
                {detail && (
                    <div style={{ lineHeight: 2.2 }}>
                        <Row gutter={16}>
                            <Col span={12}><p><strong>Bệnh nhân:</strong> {detail.patient?.full_name}</p></Col>
                            <Col span={12}><p><strong>Ngày khám:</strong> {dayjs(detail.exam_date).format('DD/MM/YYYY')}</p></Col>
                        </Row>
                        <p><strong>Bác sĩ:</strong> {detail.doctor?.full_name || '-'}</p>

                        {Object.keys(vitalSigns).length > 0 && (
                            <>
                                <Divider orientation="left" style={{ color: '#94a3b8' }}>Sinh hiệu</Divider>
                                <Row gutter={16}>
                                    <Col span={5}><p>🫀 <strong>HA:</strong> {vitalSigns.blood_pressure || '-'}</p></Col>
                                    <Col span={5}><p>💓 <strong>Nhịp:</strong> {vitalSigns.heart_rate || '-'}</p></Col>
                                    <Col span={5}><p>🌡️ <strong>Nhiệt:</strong> {vitalSigns.temperature || '-'}°C</p></Col>
                                    <Col span={5}><p>⚖️ <strong>Cân:</strong> {vitalSigns.weight || '-'}kg</p></Col>
                                    <Col span={4}><p>📏 <strong>Cao:</strong> {vitalSigns.height || '-'}cm</p></Col>
                                </Row>
                            </>
                        )}

                        <p><strong>Triệu chứng:</strong> {detail.symptoms || '-'}</p>
                        <p><strong>Chẩn đoán:</strong> {detail.diagnosis}</p>
                        <p><strong>Điều trị:</strong> {detail.treatment_plan || '-'}</p>

                        {detail.prescriptions?.length > 0 && (
                            <>
                                <Divider orientation="left" style={{ color: '#94a3b8' }}>Đơn thuốc</Divider>
                                <Table dataSource={detail.prescriptions} rowKey="id" pagination={false} size="small"
                                    columns={[
                                        { title: 'Thuốc', dataIndex: 'medicine_name' },
                                        { title: 'Liều', dataIndex: 'dosage' },
                                        { title: 'Tần suất', dataIndex: 'frequency' },
                                        { title: 'Số ngày', dataIndex: 'duration' },
                                        { title: 'SL', dataIndex: 'quantity' },
                                    ]} />
                            </>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
