'use client';

// A grid of selectable option cards, each with a preview image (or a placeholder
// until a real image URL is added to the catalog). The choices are the visual
// interest; cobalt marks the selected state.
export function OptionGrid({ items, selected, onToggle, showDesc, full }) {
  return (
    <div className="cards">
      {items.map((it) => {
        const on = selected.includes(it.id);
        const off = full && !on;
        return (
          <button
            type="button"
            key={it.id}
            className={`option-card${on ? ' option-card--on' : ''}${off ? ' option-card--off' : ''}`}
            onClick={() => onToggle(it.id)}
            aria-pressed={on}
            aria-disabled={off || undefined}
          >
            <span className="option-card__media">
              {it.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.image} alt="" loading="lazy" />
              ) : it.swatch ? (
                <span
                  className="option-card__swatch"
                  style={{ background: it.swatch }}
                  aria-hidden="true"
                />
              ) : (
                <span className="option-card__ph">Preview</span>
              )}
            </span>
            <span className="option-card__body">
              <span className="option-card__label">{it.label}</span>
              {showDesc && it.description ? (
                <span className="option-card__desc">{it.description}</span>
              ) : null}
              {it.note ? <span className="option-card__note">{it.note}</span> : null}
            </span>
            <span className="option-card__check" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

// A row of single-select chips: text-only pills (demographics have no preview
// image). Picking one clears the rest; an optional group can be un-picked by
// tapping the selected chip again. Cobalt marks the selected state.
export function ChoiceRow({ items, value, onSelect, allowClear }) {
  return (
    <div className="chips">
      {items.map((it) => {
        const on = value === it.id;
        return (
          <button
            type="button"
            key={it.id}
            className={`chip${on ? ' chip--on' : ''}`}
            onClick={() => onSelect(on && allowClear ? '' : it.id)}
            aria-pressed={on}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

// Only offer options that have a preview (an image or a swatch). The catalog entry
// stays so paid orders that already carry the id keep their prompt.
export const withPreview = (items) => items.filter((it) => it.image || it.swatch);
