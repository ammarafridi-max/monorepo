import { LOOKS } from '@headliner/shared/catalog';
import SelectStep from '../SelectStep';

// Server component: reads the shared catalog (single source of truth) and hands
// the plain data to the client selection step. The options a customer sees here
// are exactly the ones the worker generates from.
export default function LooksPage() {
  return (
    <SelectStep
      stepNo="Step 1"
      stepKey="looks"
      title="Pick your looks."
      lede="Choose one or more scenes. We spread your headshots across the ones you pick."
      items={LOOKS}
      back="/"
      next="/generator/attire"
    />
  );
}
