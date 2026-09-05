import { useId } from 'react';
import { motion } from 'framer-motion';

export const SERIES = ['#c3a15b', '#6e9b7a', '#7c93a6', '#9c86a6', '#b4614f', '#c9a86a'];

/* ----------------------------- Area chart ----------------------------- */
export function AreaChart({ data, color = '#c3a15b', height = 220, labels }) {
  const uid = useId().replace(/:/g, '');
  const W = 100, H = 44;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const step = W / (data.length - 1);
  const pts = data.map((v, i) => [i * step, H - ((v - min) / range) * (H - 6) - 3]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ');
  const area = `${line} L ${W} ${H} L 0 ${H} Z`;

  return (
    <div className="chart chart--area" style={{ height }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height="100%">
        <defs>
          <linearGradient id={`fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
        ))}
        <motion.path
          d={area}
          fill={`url(#fill-${uid})`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />
        <motion.path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      {labels && (
        <div className="chart__xlabels">
          {labels.map((l, i) => <span key={i}>{l}</span>)}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Bars --------------------------------- */
export function Bars({ data, color = '#c3a15b', height = 220, format = (v) => v }) {
  const max = Math.max(...data.map((d) => d.value)) || 1;
  return (
    <div className="chart chart--bars" style={{ height }}>
      {data.map((d, i) => (
        <div className="chart-bar" key={d.label}>
          <div className="chart-bar__track">
            <motion.div
              className="chart-bar__fill"
              style={{ background: color }}
              initial={{ height: 0 }}
              whileInView={{ height: `${(d.value / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="chart-bar__val">{format(d.value)}</span>
            </motion.div>
          </div>
          <span className="chart-bar__label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------- Donut -------------------------------- */
export function Donut({ data, size = 176, thickness = 14, centerLabel, centerValue }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let acc = 0;
  const R = 15.9155; // circumference ≈ 100
  return (
    <div className="chart-donut" style={{ width: size, height: size }}>
      <svg viewBox="0 0 42 42">
        <circle cx="21" cy="21" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness / 6} />
        {data.map((d, i) => {
          const pct = (d.value / total) * 100;
          const offset = 25 - acc; // start at top
          acc += pct;
          return (
            <motion.circle
              key={d.label}
              cx="21" cy="21" r={R} fill="none"
              stroke={SERIES[i % SERIES.length]}
              strokeWidth={thickness / 6}
              strokeDashoffset={offset}
              strokeLinecap="round"
              initial={{ strokeDasharray: '0 100' }}
              whileInView={{ strokeDasharray: `${pct} ${100 - pct}` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            />
          );
        })}
      </svg>
      {(centerValue || centerLabel) && (
        <div className="chart-donut__center">
          {centerValue && <span className="chart-donut__value">{centerValue}</span>}
          {centerLabel && <span className="chart-donut__label">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}

export function ChartLegend({ items }) {
  return (
    <ul className="chart-legend">
      {items.map((it, i) => (
        <li key={it.label}>
          <span className="chart-legend__dot" style={{ background: it.color || SERIES[i % SERIES.length] }} />
          <span className="chart-legend__label">{it.label}</span>
          <span className="chart-legend__val">{it.value}{it.suffix || ''}</span>
        </li>
      ))}
    </ul>
  );
}

/* ----------------------------- Sparkline ------------------------------ */
export function Spark({ data, color = '#c3a15b', width = 90, height = 30 }) {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const line = data.map((v, i) => `${i ? 'L' : 'M'}${(i * step).toFixed(1)} ${(height - ((v - min) / range) * height).toFixed(1)}`).join(' ');
  return (
    <svg width={width} height={height} className="spark">
      <motion.path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
    </svg>
  );
}
