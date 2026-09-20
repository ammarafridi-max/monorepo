// The counterpart to Check: a small x for what a plan does not include. Decorative;
// the list text carries the meaning.
export default function Cross() {
  return (
    <svg className="cross" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M4.5 4.5l7 7M11.5 4.5l-7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
