import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.pages <= 1) return null;

  const { page, pages, total, per_page } = pagination;
  const from = (page - 1) * per_page + 1;
  const to = Math.min(page * per_page, total);

  const getPages = () => {
    const arr = [];
    const delta = 2;
    for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) arr.push(i);
    if (arr[0] > 1) { arr.unshift('...'); arr.unshift(1); }
    if (arr[arr.length - 1] < pages) { arr.push('...'); arr.push(pages); }
    return arr;
  };

  return (
    <div className="flex items-center justify-between px-1 mt-4">
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium text-gray-700">{from}–{to}</span> of{' '}
        <span className="font-medium text-gray-700">{total}</span> records
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="pagination-btn">
          <ChevronLeft size={14} />
        </button>
        {getPages().map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>
          ) : (
            <button key={p} onClick={() => onPageChange(p)}
              className={`pagination-btn ${page === p ? 'active' : ''}`}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onPageChange(page + 1)} disabled={page === pages} className="pagination-btn">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
