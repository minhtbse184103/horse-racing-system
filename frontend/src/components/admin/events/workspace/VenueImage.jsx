import { Image as ImageIcon } from 'lucide-react';

export default function VenueImage({ tournament, className = '' }) {
  if (tournament.venueImageSrc) {
    return (
      <img
        src={tournament.venueImageSrc}
        alt={`${tournament.venue} venue`}
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`grid place-items-center bg-cream-200 text-brown-500 ${className}`} aria-label="No venue image available">
      <ImageIcon size={22} />
    </div>
  );
}
