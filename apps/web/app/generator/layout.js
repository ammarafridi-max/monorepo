import Stepper from './Stepper';

export const metadata = { title: 'Create your headshots. Headliner' };

// Shared layout for the multi-step funnel: a persistent stepper above every step.
export default function GeneratorLayout({ children }) {
  return (
    <main className="wrap generator">
      <Stepper />
      {children}
    </main>
  );
}
