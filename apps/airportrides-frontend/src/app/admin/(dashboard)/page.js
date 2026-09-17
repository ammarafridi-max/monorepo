"use client";

import AdminTransferDashboardPage from "@travel-suite/frontend-shared/pages/admin/AdminTransferDashboardPage";
import { useGetBookings } from "@travel-suite/frontend-shared/hooks/bookings/useGetBookings";

const toRow = (b) => {
  const id = b._id || b.id;
  return {
    id,
    ref: `AR-${String(id).slice(-6).toUpperCase()}`,
    customer: `${b.passenger?.firstName || ""} ${b.passenger?.lastName || ""}`.trim(),
    email: b.passenger?.email,
    route: `${b.trip?.pickup?.label} → ${b.trip?.dropoff?.label}`,
    createdAt: b.createdAt,
    status: b.status,
    statusGroup: b.status === "pending_payment" ? "pending" : b.status,
    amount: `${b.vehicle?.price?.currency || ""} ${b.vehicle?.price?.amount ?? ""}`.trim(),
  };
};

export default function Page() {
  return <AdminTransferDashboardPage useBookings={useGetBookings} toRow={toRow} />;
}
