import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
const norm = (o) => (typeof o === 'object' && o !== null ? o : { value: o, label: String(o) });

export default function Select({
  value,
  onChange,
  options = [],
  label = '',
  icon = null,
  variant = 'field',
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const rootRef = useRef(null);
  const items = options.map(norm);
  const sel = items.find((o) => o.value === value) || items[0];

  useEffect(() => {
    if (open) setHi(Math.max(0, items.findIndex((o) => o.value === sel?.value)));
  }, [open, items, sel]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        rootRef.current?.querySelector('[data-sel-trigger]')?.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHi((h) => Math.min(h + 1, items.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHi((h) => Math.max(h - 1, 0));
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const o = items[hi];
        if (o) choose(o.value);
      } else if (e.key === 'Tab') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  });

  const choose = (v) => {
    onChange(v);
    setOpen(false);
  };

  const cls = [
    'ssel',
    variant === 'toolbar' ? 'ssel--toolbar' : '',
    variant === 'bare' ? 'ssel--bare' : '',
    variant === 'dark' ? 'ssel--dark' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cls} ref={rootRef}>
      <button
        type="button"
        data-sel-trigger
        className="ssel-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label || sel?.label}
        onClick={() => setOpen((o) => !o)}
      >
        {icon && <Icon name={icon} size={16} className="ssel-trigger__icon" />}
        <span className="ssel-trigger__value">{sel?.label}</span>
        <Icon name="chevronDown" size={16} className={`ssel-trigger__chevron ${open ? 'is-open' : ''}`} />
      </button>
      {open && (
        <ul className="ssel-menu" role="listbox" aria-label={label}>
          {items.map((o, i) => (
            <li key={String(o.value)} role="option" aria-selected={o.value === sel?.value}>
              <button
                type="button"
                className={`ssel-opt ${i === hi ? 'is-hi' : ''} ${o.value === sel?.value ? 'is-sel' : ''}`}
                onMouseEnter={() => setHi(i)}
                onClick={() => choose(o.value)}
              >
                <span>{o.label}</span>
                {o.value === sel?.value && <Icon name="check" size={14} className="ssel-opt__check" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}