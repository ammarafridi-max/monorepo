import Check from './Check';

const LINES = [
  'Look-like-you guarantee. Tell us within 3 days and we refund in full.',
  'Automatic refund if a run fails. You never chase us for it.',
  'One payment. No subscription, no credits that expire.',
];

export default function Guarantee() {
  return (
    <div className="guarantee">
      <ul className="guarantee__list">
        {LINES.map((line) => (
          <li className="guarantee__item" key={line}>
            <Check />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
