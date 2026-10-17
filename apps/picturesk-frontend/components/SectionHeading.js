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
