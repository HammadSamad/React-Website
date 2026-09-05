import Icon from './Icon.jsx';

export default function Stars({ value = 5, size = 15, className = '' }) {
  return (
    <span className={`stars ${className}`} aria-label={`${value} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon
          key={i}
          name="star"
          size={size}
          style={{ color: i < Math.round(value) ? 'var(--brass)' : 'var(--forest-2)' }}
        />
      ))}
    </span>
  );
}
