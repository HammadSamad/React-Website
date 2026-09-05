import { Link } from 'react-router-dom';
import Logo from '../common/Logo.jsx';
import Icon from '../common/Icon.jsx';
import { hotelInfo } from '../../data/hotel.js';

const cols = [
  {
    title: 'Stay',
    links: [
      { to: '/rooms', label: 'Suites & Rooms' },
      { to: '/booking', label: 'Reserve' },
      { to: '/experiences', label: 'Experiences' },
      { to: '/gallery', label: 'Gallery' },
    ],
  },
  {
    title: 'Hotel',
    links: [
      { to: '/about', label: 'Our Story' },
      { to: '/contact', label: 'Contact' },
      { to: '/reviews', label: 'Reviews' },
      { to: '/login', label: 'Staff Portal' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="footer grain">
      <div className="container container--wide">
        <div className="footer__top">
          <div className="footer__brand">
            <Logo />
            <p className="footer__tag">
              Since {hotelInfo.established}, {hotelInfo.full} has treated hospitality as a
              craft — {hotelInfo.properties} houses, one enduring standard.
            </p>
            <div className="footer__social">
              {['Instagram', 'Journal', 'LinkedIn'].map((s) => (
                <a key={s} href="#" className="link-underline" onClick={(e) => e.preventDefault()}>
                  {s}
                </a>
              ))}
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.title} className="footer__col">
              <h4 className="footer__col-title">{c.title}</h4>
              <ul>
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="link-underline">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="footer__col">
            <h4 className="footer__col-title">Visit</h4>
            <ul className="footer__contact">
              <li><Icon name="mapPin" size={16} /> <span>{hotelInfo.address}, {hotelInfo.city}</span></li>
              <li><Icon name="phone" size={16} /> <span>{hotelInfo.phone}</span></li>
              <li><Icon name="mail" size={16} /> <span>{hotelInfo.email}</span></li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <span>© {hotelInfo.established}–2026 {hotelInfo.full}. All rights reserved.</span>
          <span className="footer__coords">{hotelInfo.coords}</span>
          <div className="footer__legal">
            <a href="#" onClick={(e) => e.preventDefault()} className="link-underline">Privacy</a>
            <a href="#" onClick={(e) => e.preventDefault()} className="link-underline">Terms</a>
            <a href="#" onClick={(e) => e.preventDefault()} className="link-underline">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
