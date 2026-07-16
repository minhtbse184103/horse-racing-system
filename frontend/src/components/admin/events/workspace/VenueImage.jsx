import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import ImagePreviewDialog from '../ImagePreviewDialog';

export default function VenueImage({ tournament, className = '' }) {
  const [previewOpen, setPreviewOpen] = useState(false);

  function openPreview(event) {
    event.preventDefault();
    event.stopPropagation();
    setPreviewOpen(true);
  }

  function handlePreviewKeyDown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    openPreview(event);
  }

  if (tournament.venueImageSrc) {
    return (
      <>
        <img
          src={tournament.venueImageSrc}
          alt={`Địa điểm ${tournament.venue}`}
          className={`cursor-zoom-in object-cover ${className}`}
          onClick={openPreview}
          onKeyDown={handlePreviewKeyDown}
          role="button"
          tabIndex={0}
        />
        <ImagePreviewDialog
          src={previewOpen ? tournament.venueImageSrc : ''}
          alt={`Địa điểm ${tournament.venue}`}
          title={tournament.venue || tournament.name}
          onClose={() => setPreviewOpen(false)}
        />
      </>
    );
  }

  return (
    <div className={`grid place-items-center bg-cream-200 text-brown-500 ${className}`} aria-label="Chưa có hình địa điểm">
      <ImageIcon size={22} />
    </div>
  );
}
