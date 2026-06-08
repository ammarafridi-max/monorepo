'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import PricingRuleForm from '../../components/admin/v1/PricingRuleForm';
import { useGetPricingRule } from '../../hooks/pricing-rules/useGetPricingRule';
import { useUpdatePricingRule } from '../../hooks/pricing-rules/useUpdatePricingRule';

export default function AdminEditPricingRulePage() {
  const { id } = useParams();
  const router = useRouter();

  const { pricingRule, isLoadingPricingRule, isErrorPricingRule } =
    useGetPricingRule(id);
  const { updatePricingRule, isUpdatingPricingRule } = useUpdatePricingRule();

  function handleSubmit(pricingRuleData) {
    updatePricingRule(
      { id, pricingRuleData },
      { onSuccess: () => router.push('/admin/pricing-rules') },
    );
  }

  if (isLoadingPricingRule) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm font-medium">Loading pricing rule…</p>
        </div>
      </div>
    );
  }

  if (isErrorPricingRule || !pricingRule) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-xs">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertCircle size={24} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-700">
              Pricing rule not found
            </p>
            <p className="text-xs text-gray-400 mt-1">
              This rule may have been deleted or the ID is incorrect.
            </p>
          </div>
          <Link
            href="/admin/pricing-rules"
            className="flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:underline"
          >
            <ArrowLeft size={13} /> Back to pricing rules
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PricingRuleForm
      initialData={pricingRule}
      onSubmit={handleSubmit}
      isPending={isUpdatingPricingRule}
    />
  );
}
