import { Tabs, Card } from 'antd';
import {
    UserOutlined, AppstoreOutlined, SettingOutlined,
    FileTextOutlined, LockOutlined,
} from '@ant-design/icons';
import PermissionsTab from '../components/settings/PermissionsTab';
import UsersTab from '../components/settings/UsersTab';
import CategoriesTab from '../components/settings/CategoriesTab';
import ConfigsTab from '../components/settings/ConfigsTab';
import LogsTab from '../components/settings/LogsTab';

const { TabPane } = Tabs;

export default function SettingsPage({ defaultTab }: { defaultTab?: string }) {
    return (
        <div>
            <div className="page-header"><h1>⚙️ Cài đặt hệ thống</h1></div>
            <Card style={{ background: '#1e293b', border: '1px solid #334155' }}>
                <Tabs defaultActiveKey={defaultTab || 'permissions'} type="card">
                    <TabPane tab={<span><LockOutlined /> Phân quyền</span>} key="permissions">
                        <PermissionsTab />
                    </TabPane>
                    <TabPane tab={<span><UserOutlined /> Tài khoản</span>} key="users">
                        <UsersTab />
                    </TabPane>
                    <TabPane tab={<span><AppstoreOutlined /> Danh mục</span>} key="categories">
                        <CategoriesTab />
                    </TabPane>
                    <TabPane tab={<span><SettingOutlined /> Cấu hình</span>} key="configs">
                        <ConfigsTab />
                    </TabPane>
                    <TabPane tab={<span><FileTextOutlined /> Nhật ký</span>} key="logs">
                        <LogsTab />
                    </TabPane>
                </Tabs>
            </Card>
        </div>
    );
}
