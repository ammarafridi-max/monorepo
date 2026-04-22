'use client';

import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaWhatsapp,
} from 'react-icons/fa6';

export default function ShareButtons({ title, url }) {
  const shareText = `${title} - ${url}`;

  async function handleShare(channel) {
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(shareText);

    const shareLinks = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedText}`,
      instagram: 'https://www.instagram.com/',
      tiktok: 'https://www.tiktok.com/',
    };

    if (
      (channel === 'instagram' || channel === 'tiktok') &&
      navigator?.clipboard?.writeText
    ) {
      try {
        await navigator.clipboard.writeText(shareText);
      } catch (error) {
        void error;
      }
    }

    window.open(shareLinks[channel], '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ShareButton label="Facebook" onClick={() => handleShare('facebook')}>
        <FaFacebookF />
      </ShareButton>
      <ShareButton label="Instagram" onClick={() => handleShare('instagram')}>
        <FaInstagram />
      </ShareButton>
      <ShareButton label="TikTok" onClick={() => handleShare('tiktok')}>
        <FaTiktok />
      </ShareButton>
      <ShareButton label="LinkedIn" onClick={() => handleShare('linkedin')}>
        <FaLinkedinIn />
      </ShareButton>
      <ShareButton label="WhatsApp" onClick={() => handleShare('whatsapp')}>
        <FaWhatsapp />
      </ShareButton>
    </div>
  );
}

function ShareButton({ children, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-700 transition-colors hover:bg-gray-100"
    >
      {children}
    </button>
  );
}
