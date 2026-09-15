const UPLOAD = '/image/upload/';

// Cloudinary serves the original bytes unless the URL carries a transform, so a
// 2 MB cover or a 700 KB vehicle PNG ships as-is. Inserting f_auto,q_auto and a
// width cap after /upload/ lets Cloudinary pick the format and compress on the
// fly. URLs that already carry a transform, or are not Cloudinary, pass through.
export function cloudinaryUrl(url, { width } = {}) {
  if (typeof url !== 'string' || !url.includes('res.cloudinary.com') || !url.includes(UPLOAD)) return url;
  const [prefix, rest] = url.split(UPLOAD);
  if (!rest || !/^v\d+\//.test(rest)) return url;
  const transform = ['f_auto', 'q_auto', width ? `w_${Math.round(width)}` : null].filter(Boolean).join(',');
  return `${prefix}${UPLOAD}${transform}/${rest}`;
}
