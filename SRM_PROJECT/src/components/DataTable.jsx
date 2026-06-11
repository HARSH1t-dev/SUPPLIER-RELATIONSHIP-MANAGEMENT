import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function DataTable({ columns, data, empty = 'No records found', pageSize = 8 }) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / pageSize) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * pageSize;
  const paginatedData = data.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-transparent">
      <div className="flex-1 overflow-x-auto min-h-0 custom-scrollbar">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {paginatedData.length ? (
              paginatedData.map((row, index) => (
                <tr key={row.id || row.sku || row.receipt || row.supplier || (startIndex + index)} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 border-b last:border-0 border-slate-100 dark:border-slate-800/80 transition-colors">
                  {columns.map((column) => {
                    const isNowrap = column.nowrap !== false;
                    return (
                      <td 
                        key={column.key} 
                        className={`${
                          isNowrap 
                            ? 'whitespace-nowrap' 
                            : 'whitespace-normal min-w-[150px] max-w-[280px] break-words'
                        } px-5 py-2.5 text-slate-750 dark:text-slate-300 text-xs font-medium`}
                      >
                        {column.render ? column.render(row, startIndex + index) : row[column.key]}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-5 py-8 text-center text-slate-500 dark:text-slate-400" colSpan={columns.length}>
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {data.length > pageSize && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs shrink-0 select-none">
          <div className="text-slate-500 dark:text-slate-400 font-medium">
            Showing <span className="font-bold text-slate-850 dark:text-slate-200">{startIndex + 1}</span> to <span className="font-bold text-slate-850 dark:text-slate-200">{Math.min(startIndex + pageSize, data.length)}</span> of <span className="font-bold text-slate-850 dark:text-slate-200">{data.length}</span> entries
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(activePage - 1)}
              disabled={activePage === 1}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/85 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              aria-label="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`inline-flex items-center justify-center h-8 w-8 rounded-lg font-bold text-xs transition cursor-pointer ${
                    activePage === page
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/85 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => handlePageChange(activePage + 1)}
              disabled={activePage === totalPages}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/85 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              aria-label="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
