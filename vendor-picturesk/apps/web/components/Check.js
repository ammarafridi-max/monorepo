// Minimal check mark used in the "what you get" and pricing lists. An inline SVG
// (not an emoji, per BRAND) in cobalt, the single accent. Decorative, so hidden
// from assistive tech; the list text carries the meaning.
export default function Check() {
  return (
    <svg className="check" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M13.5 4.5 6.5 11.5 3 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
