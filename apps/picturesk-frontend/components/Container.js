// The one page gutter. Centres content and owns the horizontal padding, so every
// section and page shares the same edges. Vertical rhythm belongs to the section
// or page class around it (.section, .page, .content), never here.
//
// wide (default) 1040px, medium 960px, narrow 720px.
export default function Container({ size = 'wide', as: Tag = 'div', className = '', children }) {
  const cls = ['container', size === 'wide' ? '' : `container--${size}`, className]
    .filter(Boolean)
    .join(' ');
  return <Tag className={cls}>{children}</Tag>;
}
