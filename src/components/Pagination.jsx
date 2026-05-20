import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button.jsx';

export function Pagination({ page = 1, total = 4 }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm text-slate-500">
      <span>
        Page {page} of {total}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="secondary" className="h-9 w-9 p-0" aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="secondary" className="h-9 w-9 p-0" aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
