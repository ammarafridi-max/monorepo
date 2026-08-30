export default function Container({ size = 'wide', as: Tag = 'div', className = '', children }) {
  const cls = ['container', size === 'narrow' ? 'container--narrow' : '', className].filter(Boolean).join(' ');
  return <Tag className={cls}>{children}</Tag>;
}
