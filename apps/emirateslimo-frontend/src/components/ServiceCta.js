import PrimarySection from './PrimarySection';
import Container from './Container';
import PrimaryLink from './PrimaryLink';

export default function ServiceCta({ title, text, primary, secondary }) {
  return (
    <PrimarySection className="relative overflow-hidden bg-primary-900 py-20 lg:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-accent-500/5 blur-3xl" />
      </div>

      <Container className="relative flex flex-col items-center text-center gap-5">
        <div className="flex items-center gap-3">
          <span className="h-px w-6 bg-accent-500" />
          <p className="text-[10.5px] tracking-[0.25em] font-light uppercase text-accent-500">Ready to Ride?</p>
          <span className="h-px w-6 bg-accent-500" />
        </div>

        <h2 className="text-[28px] lg:text-[42px] font-light text-white max-w-2xl leading-[1.2] tracking-tight">
          {title}
        </h2>

        {text && (
          <p className="text-white/50 text-[15px] lg:text-[16px] font-light max-w-xl leading-[1.85]">{text}</p>
        )}

        <div className="mt-3 flex flex-col sm:flex-row items-center justify-center gap-4">
          {primary && <PrimaryLink to={primary.href || primary.to} size="large">{primary.label}</PrimaryLink>}
          {secondary && (
            <a
              href={secondary.href || secondary.to}
              className="text-white/50 hover:text-white text-[14px] font-light tracking-wide underline-offset-4 hover:underline transition-colors duration-300"
            >
              {secondary.label}
            </a>
          )}
        </div>
      </Container>
    </PrimarySection>
  );
}
