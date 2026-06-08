'use client';
import { useEffect, useRef, useState } from 'react';
import { useOutsideClick } from '../hooks/general/useOutsideClick';
import { FaXmark } from 'react-icons/fa6';

export default function VehicleGallery({ vehicle, images, setShowGallery }) {
  const [imageIndex, setImageIndex] = useState(0);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndex((prevIndex) => (prevIndex >= images.length - 1 ? 0 : prevIndex + 1));
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length]);

  useOutsideClick(wrapperRef, () => setShowGallery(false));

  return (
    <div className="fixed top-0 left-0 z-50 h-full w-full bg-black/80 flex items-center justify-center">
      <button type="button" className="absolute top-5 right-5 text-white text-3xl cursor-pointer">
        <FaXmark />
      </button>
      <div className="flex flex-col gap-4" ref={wrapperRef}>
        {!images.length ? (
          <p className="text-center text-white text-2xl">No images to display</p>
        ) : (
          <>
            <p className="text-center text-white text-2xl">{vehicle}</p>
            <div className="w-150 aspect-video rounded-xl overflow-hidden bg-white">
              <img src={images[imageIndex]} className="w-full h-full object-cover" alt={vehicle || 'Emirates Limo luxury vehicle'} />
            </div>
            <div className="w-150 grid grid-cols-4 gap-5">
              {images &&
                images?.map((img, i) => (
                  <div key={i} className="aspect-video rounded-md overflow-hidden bg-white">
                    <img src={img} className="w-full h-full object-cover" alt={vehicle ? `${vehicle} - image ${i + 1}` : 'Emirates Limo luxury vehicle'} />
                  </div>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
