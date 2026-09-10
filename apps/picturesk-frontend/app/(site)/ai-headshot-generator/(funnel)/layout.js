import Stepper from '../../../../components/Stepper';
import Container from '../../../../components/Container';

export const metadata = { title: 'Create your headshots. Picturesk.ai', robots: { index: false, follow: false } };

// Shared layout for the multi-step funnel: a persistent stepper above every step.
export default function GeneratorLayout({ children }) {
  return (
    <main className="page generator">
      <Container size="narrow">
        <Stepper />
        {children}
      </Container>
    </main>
  );
}
