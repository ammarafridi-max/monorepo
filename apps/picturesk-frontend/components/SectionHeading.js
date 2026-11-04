export default function SectionHeading({
  eyebrow,
  title,
  lede,
  align = 'left',
  as: Tag = 'h2',
  className = '',
}) {
  const split = align !== 'center' && Boolean(lede);
  const cls = ['sechead', align === 'center' ? 'sechead--center' : '', split ? 'sechead--split' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={cls}>
      <div className="sechead__main">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <Tag className="h2">{title}</Tag>
      </div>
      {lede && <p className="section__lede">{lede}</p>}
    </header>
  );
}
