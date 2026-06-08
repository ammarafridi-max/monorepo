'use client';

import AvailabilityRuleForm from '../../components/admin/v1/AvailabilityRuleForm';
import { useCreateAvailabilityRule } from '../../hooks/availability-rules/useCreateAvailabilityRule';

export default function AdminNewAvailabilityRulePage() {
  const { createAvailabilityRule, isCreatingAvailabilityRule } =
    useCreateAvailabilityRule();

  function handleSubmit(data) {
    createAvailabilityRule(data);
  }

  return (
    <AvailabilityRuleForm
      onSubmit={handleSubmit}
      isPending={isCreatingAvailabilityRule}
    />
  );
}
