import SharedBreadcrumb from '@travel-suite/frontend-shared/components/shared/layout/Breadcrumb';

export default function Breadcrumb({ paths = [], dark = false, includeSchema = true, className = '' }) {
  if (!paths.length) return null;

  return (
    <div className={`shared-ui${className ? ` ${className}` : ''}`}>
      <SharedBreadcrumb paths={paths} dark={dark} includeSchema={includeSchema} />
    </div>
  );
}
