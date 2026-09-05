import CountUp from '../common/CountUp.jsx';
import Icon from '../common/Icon.jsx';

export default function StatCard({ label, value, prefix = '', suffix = '', decimals = 0, delta, icon, tint = 'brass' }) {
  const up = delta >= 0;
  return (
    <div className={`stat-card stat-card--${tint}`}>
      <div className="stat-card__top">
        <span className="stat-card__label">{label}</span>
        {icon && <span className="stat-card__icon"><Icon name={icon} size={18} /></span>}
      </div>
      <div className="stat-card__value">
        <CountUp value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </div>
      {delta !== undefined && (
        <div className={`stat-card__delta ${up ? 'is-up' : 'is-down'}`}>
          <Icon name="trendingUp" size={14} style={up ? undefined : { transform: 'scaleY(-1)' }} />
          {up ? '+' : ''}{delta}% <span>vs. last period</span>
        </div>
      )}
    </div>
  );
}
