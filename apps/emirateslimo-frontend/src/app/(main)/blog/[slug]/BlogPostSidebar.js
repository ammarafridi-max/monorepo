'use client';
import { format } from 'date-fns';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTiktok, FaWhatsapp } from 'react-icons/fa6';

export default function BlogPostSidebar({ recentPosts = [], shareUrl, shareTitle }) {
  async function handleShare(channel) {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(`${shareTitle} - ${shareUrl}`);
    const shareLinks = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedText}`,
      instagram: 'https://www.instagram.com/',
      tiktok: 'https://www.tiktok.com/',
    };
    if ((channel === 'instagram' || channel === 'tiktok') && navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(`${shareTitle} - ${shareUrl}`);
      } catch {
        // ignore
      }
    }
    window.open(shareLinks[channel], '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="sticky top-24 self-start h-fit">
      <h2 className="font-normal mb-5">Recently Published Posts:</h2>
      {recentPosts.length === 0 ? (
        <p className="text-sm text-gray-400 font-light">No recent posts.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {recentPosts.map((post) => (
            <a
              key={post._id}
              href={`/blog/${post.slug}`}
              className="grid grid-cols-[2fr_8fr] items-center overflow-hidden gap-3 cursor-pointer"
            >
              <img
                className="w-full bg-gray-100 aspect-square rounded-md border-0 object-cover object-center"
                src={post.coverImageUrl}
                alt={post.title}
              />
              <div>
                <h3 className="font-light text-sm leading-5">{post.title}</h3>
                {(post.publishedAt || post.createdAt) && (
                  <p className="font-extralight text-[12px] text-gray-600 mt-1">
                    {format(new Date(post.publishedAt || post.createdAt), 'dd MMM yyyy')}
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}

      <div className="mt-10 rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm font-medium text-gray-900 mb-3">Share this post</p>
        <div className="flex items-center gap-2 flex-wrap">
          <ShareButton label="Facebook" onClick={() => handleShare('facebook')}><FaFacebookF /></ShareButton>
          <ShareButton label="Instagram" onClick={() => handleShare('instagram')}><FaInstagram /></ShareButton>
          <ShareButton label="TikTok" onClick={() => handleShare('tiktok')}><FaTiktok /></ShareButton>
          <ShareButton label="LinkedIn" onClick={() => handleShare('linkedin')}><FaLinkedinIn /></ShareButton>
          <ShareButton label="WhatsApp" onClick={() => handleShare('whatsapp')}><FaWhatsapp /></ShareButton>
        </div>
      </div>
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
