import { PageHeader } from '../components/Layout';
import UserManagement from '../components/UserManagement';

const UserManagementPage = () => {
    return (
        <>
            <PageHeader title="Gestión de Usuarios" />
            <UserManagement />
        </>
    );
};

export default UserManagementPage; 