import { useLocale } from '@/shared/i18n/useLocale';

const sizes = [10, 20, 30, 40, 50];

export function Pager({
  page,
  pageSize,
  total,
  onPage,
  onPageSize
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize: (pageSize: number) => void;
}) {
  const { t } = useLocale();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="product-admin-pager">
      <button className="btn btn-secondary" type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        {t('previousPage')}
      </button>
      <span>
        {page} / {pages}
      </span>
      <button className="btn btn-secondary" type="button" disabled={page * pageSize >= total} onClick={() => onPage(page + 1)}>
        {t('nextPage')}
      </button>
      <label className="product-admin-size">
        <select aria-label={t('pageSize')} value={pageSize} onChange={event => onPageSize(Number(event.target.value))}>
          {sizes.map(size => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
