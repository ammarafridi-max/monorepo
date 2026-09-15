import Container from '../components/Container';
import SectionHeading from '../components/SectionHeading';

// A comparison table: the one structure on a "vs" page that both a reader and an
// AI answer engine can lift whole. Plain semantic <table>, first column is the
// row header, so it reads correctly with a screen reader and extracts cleanly.
export default function Comparison({ eyebrow, title, lede, columns = [], rows = [] }) {
  return (
    <section id="comparison" className="section comparison">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} lede={lede} />
        <div className="comparison__scroll">
          <table className="comparison__table">
            <thead>
              <tr>
                {columns.map((c, i) => (
                  <th scope="col" key={i}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, ...cells]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  {cells.map((cell, i) => (
                    <td key={i}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </section>
  );
}
