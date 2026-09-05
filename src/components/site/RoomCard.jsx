import { Link } from 'react-router-dom';
import SmartImage from '../common/SmartImage.jsx';
import Icon from '../common/Icon.jsx';
import { money } from '../../data/hotel.js';

export default function RoomCard({ room, index }) {
  return (
    <article className="room-card img-zoom">
      <Link to={`/rooms/${room.id}`} className="room-card__link">
        <div className="room-card__media">
          <SmartImage src={room.hero(900, 70)} alt={`${room.name} ${room.tier}`} ratio="4 / 5" label={room.name} />
          <span className="room-card__idx index-num">{room.index}</span>
          <span className="room-card__price">{money(room.price)}<small>/ night</small></span>
        </div>
        <div className="room-card__body">
          <div className="room-card__head">
            <div>
              <span className="room-card__tier">{room.tier}</span>
              <h3 className="room-card__name">{room.name}</h3>
            </div>
            <span className="room-card__arrow"><Icon name="arrowUpRight" size={20} /></span>
          </div>
          <p className="room-card__desc">{room.short}</p>
          <ul className="room-card__meta">
            <li><Icon name="ruler" size={15} /> {room.size} m²</li>
            <li><Icon name="users" size={15} /> {room.maxGuests} guests</li>
            <li><Icon name="bed" size={15} /> {room.bed}</li>
          </ul>
        </div>
      </Link>
    </article>
  );
}
