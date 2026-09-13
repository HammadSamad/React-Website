import { Link } from 'react-router-dom';
import Icon from '../common/Icon.jsx';

const STATUS_LABEL = {
  available: 'Available',
  occupied: 'Occupied',
  reserved: 'Reserved',
  maintenance: 'In maintenance',
  cleaning: 'Being cleaned',
};

export default function RoomCard({ room, bookHref }) {
  const heroImage = room.images?.[0]?.url;
  const statusLabel = STATUS_LABEL[room.roomStatus] || room.roomStatus || '—';
  const amens = room.amenities || [];
  const visibleAmens = amens.slice(0, 5);
  const moreAmens = amens.length - visibleAmens.length;

  return (
    <article className="room-card">
      <Link to={`/rooms/${room._id || room.id}`} className="room-card__link">
        <div className="room-card__media">
          {heroImage ? (
            <div className="smart-img img-zoom" data-loaded="true">
              <img src={heroImage} alt={`${room.roomType} ${room.roomNumber}`} />
            </div>
          ) : (
            <div className="room-card__media--fallback">
              <Icon name="bed" size={42} />
              <span>{room.roomType}</span>
            </div>
          )}
          <span className="room-card__idx index-num">{room.roomNumber}</span>
          <span className={`room-card__status room-card__status--${room.roomStatus || 'unknown'}`}>
            {statusLabel}
          </span>
          <span className="room-card__price">${room.roomPrice}<small>/ night</small></span>
        </div>
        <div className="room-card__body">
          <div className="room-card__head">
            <div>
              <span className="room-card__tier">Floor {room.floor}</span>
              <h3 className="room-card__name">{room.roomType}</h3>
            </div>
            <span className="room-card__arrow"><Icon name="arrowUpRight" size={20} /></span>
          </div>
          {room.description && <p className="room-card__desc">{room.description}</p>}
          {amens.length > 0 && (
            <ul className="room-card__amens">
              {visibleAmens.map((a) => (
                <li key={a}><Icon name="check" size={12} /> {a}</li>
              ))}
              {moreAmens > 0 && <li className="room-card__amens-more">+{moreAmens} more</li>}
            </ul>
          )}
          <ul className="room-card__meta">
            <li><Icon name="users" size={15} /> Up to {room.maxGuests} guests</li>
            <li><Icon name="building" size={15} /> Floor {room.floor}</li>
          </ul>
        </div>
      </Link>
      {bookHref && (
        <Link to={bookHref} className="room-card__quick"><Icon name="calendar" size={13} /> Reserve</Link>
      )}
    </article>
  );
}