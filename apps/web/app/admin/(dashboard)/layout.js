import { AdminAuthProvider } from '../AdminAuthContext';
import AdminShell from '../AdminShell';

// The guarded admin area. The provider is scoped HERE (not over the login page),
// so entering this group hydrates the session fresh from the cookie.
export default function DashboardLayout({ children }) {
  return (
    <AdminAuthProvider>
      <AdminShell>{children}</AdminShell>
    </AdminAuthProvider>
  );
}
