export default function Container({ size = 'wide', as: Tag = 'div', className = '', children }) {
  const cls = ['container', size === 'wide' ? '' : `container--${size}`, className]
    .filter(Boolean)
    .join(' ');
  return <Tag className={cls}>{children}</Tag>;
}
