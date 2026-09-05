import { Link } from 'react-router-dom';

export default function Logo({ to = '/', small = false, sub = true }) {
  return (
    <Link to={to} className={`logo ${small ? 'logo--sm' : ''}`} aria-label="LuxuryStay Hospitality — home">
      <span className="logo__mark">L</span>
      <span className="logo__text">
        <span className="logo__name">LuxuryStay</span>
        {sub && <span className="logo__sub">Hospitality</span>}
      </span>
    </Link>
  );
}
