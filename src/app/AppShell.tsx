import { Link, useLocation } from 'react-router';
import { useLocale } from '@/shared/i18n/useLocale';

type Section = 'wholesale' | 'retail' | 'load' | 'products';

export function AppShellNav() {
  const { t } = useLocale();
  const { pathname } = useLocation();
  const current = sectionOf(pathname);
  return (
    <nav className="app-nav" aria-label={t('home')}>
      <SectionLink to="/" section="wholesale" current={current} label={t('wholesaleSection')} />
      <SectionLink to="/retail-sales" section="retail" current={current} label={t('retailSection')} />
      <SectionLink to="/load-sheets" section="load" current={current} label={t('loadSheet')} />
      <SectionLink to="/products" section="products" current={current} label={t('products')} />
    </nav>
  );
}

function SectionLink({
  to,
  section,
  current,
  label,
}: {
  to: string;
  section: Section;
  current: Section;
  label: string;
}) {
  return (
    <Link to={to} data-section={section} aria-current={current === section ? 'page' : undefined}>
      <SectionIcon section={section} />
      {label}
    </Link>
  );
}

function sectionOf(pathname: string): Section {
  if (pathname.startsWith('/retail-sales')) return 'retail';
  if (pathname.startsWith('/load-sheets')) return 'load';
  if (pathname.startsWith('/products')) return 'products';
  return 'wholesale';
}

function SectionIcon({ section }: { section: 'wholesale' | 'retail' | 'load' | 'products' }) {
  if (section === 'wholesale') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h16v12H4zM8 7V5h8v2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  if (section === 'retail') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 8h12l-1 11H7L6 8zm3-3h6l1 3H8l1-3z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  if (section === 'load') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 15h13v3H3zm13-6h5l-2 6h-3V9zM6 18a2 2 0 1 0 0 0zm10 0a2 2 0 1 0 0 0z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
