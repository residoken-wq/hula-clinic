import { useState, useEffect } from 'react';
import { Table, Button, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { fetchData } from '../../utils/api';
import dayjs from 'dayjs';

export default function LogsTab() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => { load(); }, []);

    const load = async () => {
        setLoading(true);
        try { setLogs(await fetchData('/system/logs', { limit: 200 })); } catch { } finally { setLoading(false); }
    };

    const columns = [
        { title: 'Thời gian', dataIndex: 'created_at', width: 150, render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm:ss') },
        { title: 'User', dataIndex: 'username', width: 120, render: (v: string) => <Tag>{v || '—'}</Tag> },
        {
            title: 'Method', dataIndex: 'method', width: 80,
            render: (v: string) => {
                const c: any = { GET: 'blue', POST: 'green', PUT: 'orange', DELETE: 'red' };
                return <Tag color={c[v] || 'default'}>{v}</Tag>;
            }
        },
        { title: 'Endpoint', dataIndex: 'endpoint', width: 300, render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span> },
        { title: 'Status', dataIndex: 'status_code', width: 80, render: (v: number) => <Tag color={v < 400 ? 'green' : 'red'}>{v}</Tag> },
        { title: 'IP', dataIndex: 'ip_address', width: 120 },
    ];

    return (
        <div>
            <div style={{ textAlign: 'right', marginBottom: 16 }}>
                <Button icon={<ReloadOutlined />} onClick={load}>Làm mới</Button>
            </div>
            <Table columns={columns} dataSource={logs} loading={loading}
                rowKey="id" pagination={{ pageSize: 50 }} size="small" />
        </div>
    );
}
