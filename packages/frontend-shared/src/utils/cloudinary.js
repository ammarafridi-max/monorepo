const UPLOAD = '/image/upload/';

export function cloudinaryUrl(url, { width } = {}) {
  if (typeof url !== 'string' || !url.includes('res.cloudinary.com') || !url.includes(UPLOAD)) return url;
  const [prefix, rest] = url.split(UPLOAD);
  if (!rest || !/^v\d+\//.test(rest)) return url;
  const transform = ['f_auto', 'q_auto', width ? `w_${Math.round(width)}` : null].filter(Boolean).join(',');
  return `${prefix}${UPLOAD}${transform}/${rest}`;
}
