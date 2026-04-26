import Breadcrumb from '../../components/v1/layout/Breadcrumb';
import AccountForm from '../../components/v1/admin/AccountForm';

export default function AdminAccountPage() {
  return (
    <>
      <Breadcrumb
        paths={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'My Account', href: '/admin/account' },
        ]}
      />
      <AccountForm />
    </>
  );
}
