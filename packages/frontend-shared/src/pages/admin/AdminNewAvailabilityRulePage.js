'use client';

import AvailabilityRuleForm from '../../components/admin/AvailabilityRuleForm';
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
