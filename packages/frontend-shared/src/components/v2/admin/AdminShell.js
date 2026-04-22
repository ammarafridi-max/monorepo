"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAdminAuth } from "../../../contexts/AdminAuthContext.js";

const ROLE_DEFAULT_PATH = {
  admin: "/admin",
  agent: "/admin/insurance-applications",
  "blog-manager": "/admin/blog",
};

const ROLE_ROUTE_RULES = [
  { prefix: "/admin", roles: ["admin", "agent"] },
  { prefix: "/admin/users", roles: ["admin"] },
  { prefix: "/admin/affiliates", roles: ["admin", "agent"] },
  { prefix: "/admin/insurance-applications", roles: ["admin", "agent"] },
  { prefix: "/admin/currencies", roles: ["admin", "agent"] },
  { prefix: "/admin/blog-tags", roles: ["admin", "blog-manager"] },
  { prefix: "/admin/blog", roles: ["admin", "blog-manager"] },
  { prefix: "/admin/account", roles: ["admin", "agent", "blog-manager"] },
];

function getAllowedRoles(pathname) {
  return (
    ROLE_ROUTE_RULES.find((rule) => pathname.startsWith(rule.prefix))
      ?.roles || ["admin", "agent", "blog-manager"]
  );
}

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { adminUser, isLoadingAdminAuth } = useAdminAuth();

  useEffect(() => {
    if (isLoadingAdminAuth) return;

    if (!adminUser) {
      const next = encodeURIComponent(pathname || "/admin");
      router.replace(`/admin/login?next=${next}`);
      return;
    }

    const allowedRoles = getAllowedRoles(pathname || "/admin");
    if (!allowedRoles.includes(adminUser.role)) {
      router.replace(ROLE_DEFAULT_PATH[adminUser.role] || "/admin");
    }
  }, [adminUser, isLoadingAdminAuth, pathname, router]);

  if (isLoadingAdminAuth || !adminUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm font-medium">Loading admin workspace...</p>
        </div>
      </div>
    );
  }

  const allowedRoles = getAllowedRoles(pathname || "/admin");
  if (!allowedRoles.includes(adminUser.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm font-medium">
            Redirecting to your workspace...
          </p>
        </div>
      </div>
    );
  }

  return children;
}
