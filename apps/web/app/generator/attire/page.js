import { ATTIRE } from '@headliner/shared/catalog';
import SelectStep from '../SelectStep';

export default function AttirePage() {
  return (
    <SelectStep
      stepNo="Step 2"
      stepKey="attire"
      title="Pick your attire."
      lede="Choose what you want to wear. Mix a few for variety across your set."
      items={ATTIRE}
      showDesc={false}
      back="/generator/looks"
      next="/generator/details"
    />
  );
}
