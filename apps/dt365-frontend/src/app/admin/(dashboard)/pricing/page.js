"use client";

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@travel-suite/frontend-shared/components/v1/layout/Breadcrumb";
import PageLoader from "@travel-suite/frontend-shared/components/v1/ui/PageLoader";
import PageHeading from "@travel-suite/frontend-shared/components/v1/layout/PageHeading";
import PrimaryButton from "@travel-suite/frontend-shared/components/v1/PrimaryButton";
import Input from "@travel-suite/frontend-shared/components/v1/form-elements/Input";
import Label from "@travel-suite/frontend-shared/components/v1/form-elements/Label";
import { useAdminAuth } from "@travel-suite/frontend-shared/contexts/AdminAuthContext";
import { useAdminDummyTicketPricing } from "@travel-suite/frontend-shared/hooks/pricing/useAdminDummyTicketPricing";
import { useUpdateDummyTicketPricing } from "@travel-suite/frontend-shared/hooks/pricing/useUpdateDummyTicketPricing";
import { normalizePricingOptions } from "@travel-suite/frontend-shared/utils/dummyTicketPricing";

export default function Page() {
  const router = useRouter();
  const { adminUser: user, isLoadingAdminAuth: loading } = useAdminAuth();
  const isAdmin = user?.role === "admin";
  const { pricing, isLoadingPricing, isErrorPricing, pricingError } =
    useAdminDummyTicketPricing();
  const { updatePricing, isUpdatingPricing } = useUpdateDummyTicketPricing();
  const defaultOptions = useMemo(
    () => normalizePricingOptions(pricing),
    [pricing],
  );
  const [formOptions, setFormOptions] = useState([]);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/admin");
    }
  }, [isAdmin, loading, router]);

  useEffect(() => {
    if (defaultOptions.length > 0) {
      setFormOptions(defaultOptions);
    }
  }, [defaultOptions]);

  function handlePriceChange(validity, value) {
    setFormOptions((current) =>
      current.map((option) =>
        option.value === validity
          ? {
              ...option,
              price: value,
            }
          : option,
      ),
    );
  }

  function handleSubmit(e) {
    e.preventDefault();

    const options = formOptions.map((option, index) => ({
      validity: option.value,
      price: Number(option.price),
      isActive: true,
      sortOrder: index,
    }));

    updatePricing({
      currency: pricing?.currency || "AED",
      options,
    });
  }

  if (loading || !isAdmin || isLoadingPricing) return <PageLoader />;

  if (isErrorPricing) {
    return (
      <p className="mt-6 rounded-lg bg-white p-6 text-sm text-gray-700 shadow">
        {pricingError?.message || "Could not load pricing"}
      </p>
    );
  }

  return (
    <>
      <Breadcrumb
        paths={[
          { label: "Dashboard", href: "/admin" },
          { label: "Pricing", href: "/admin/pricing" },
        ]}
      />
      <PageHeading>Dummy Ticket Pricing</PageHeading>

      <form
        className="mt-6 max-w-2xl rounded-xl bg-white p-6 shadow"
        onSubmit={handleSubmit}
      >
        <div className="space-y-5">
          {formOptions.map((option) => (
            <div
              key={option.value}
              className="grid grid-cols-2 items-center gap-4"
            >
              <div>
                <Label>{option.label}</Label>
              </div>
              <div>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={option.price}
                  onChange={(e) =>
                    handlePriceChange(option.value, e.target.value)
                  }
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <PrimaryButton
            type="submit"
            size="small"
            disabled={isUpdatingPricing}
          >
            {isUpdatingPricing ? "Saving..." : "Save Pricing"}
          </PrimaryButton>
        </div>
      </form>
    </>
  );
}
