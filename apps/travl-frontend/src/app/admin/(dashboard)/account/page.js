import Breadcrumb from "@travel-suite/frontend-shared/components/v1/layout/Breadcrumb";
import { buildMetadata } from "@/lib/publicMetadata";
import AccountForm from "@travel-suite/frontend-shared/components/v1/admin/forms/AccountForm";

export const metadata = buildMetadata({
  title: "My Account - Admin",
  description: "Manage your admin account details.",
});

export default function Page() {
  return (
    <>
      <Breadcrumb
        paths={[
          { label: "Dashboard", href: "/admin" },
          { label: "My Account", href: "/admin/account" },
        ]}
      />
      <AccountForm />
    </>
  );
}
