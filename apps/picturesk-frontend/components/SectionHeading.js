// The heading block every marketing section opens with: eyebrow, heading, and an
// optional lede. One component so the vertical rhythm between a section's title
// and its content is set in exactly one place (.sechead), not re-invented per
// section. `align="center"` is for the closing CTA, which is the only centred one.
export default function SectionHeading({
  eyebrow,
  title,
  lede,
  align = 'left',
  as: Tag = 'h2',
  className = '',
}) {
  const cls = ['sechead', align === 'center' ? 'sechead--center' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={cls}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <Tag className="h2">{title}</Tag>
      {lede && <p className="section__lede">{lede}</p>}
    </header>
  );
}
