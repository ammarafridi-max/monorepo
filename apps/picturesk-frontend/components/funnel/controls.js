'use client';

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

export const withPreview = (items) => items.filter((it) => it.image || it.swatch);
