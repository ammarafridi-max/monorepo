'use client';

import { useRouter } from 'next/navigation';
import PricingRuleForm from '../../components/admin/v1/PricingRuleForm';
import { useCreatePricingRule } from '../../hooks/pricing-rules/useCreatePricingRule';

export default function AdminNewPricingRulePage() {
  const router = useRouter();
  const { createPricingRule, isCreatingPricingRule } = useCreatePricingRule();

  function handleSubmit(pricingRuleData) {
    createPricingRule(pricingRuleData, {
      onSuccess: () => router.push('/admin/pricing-rules'),
    });
  }

  return (
    <PricingRuleForm onSubmit={handleSubmit} isPending={isCreatingPricingRule} />
  );
}
