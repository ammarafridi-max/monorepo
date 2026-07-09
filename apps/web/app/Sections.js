// Renders a data-driven list of content sections (see data/legal.js). Each section
// is a real <h2> with paragraphs, an optional bullet list, and an optional single
// cross-link line. Real headings keep the pages readable and citable (GEO).
export default function Sections({ sections }) {
  return sections.map((s) => (
    <section className="prose__block" key={s.h}>
      <h2 className="prose__h2">{s.h}</h2>
      {s.body?.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      {s.list && (
        <ul>
          {s.list.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
      {s.link && (
        <p className="prose__link">
          <a href={s.link.href}>{s.link.text}</a>
        </p>
      )}
    </section>
  ));
}
