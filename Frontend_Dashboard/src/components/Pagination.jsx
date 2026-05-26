import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button.jsx';

export function Pagination({ page = 1, total = 1, onPrevious, onNext }) {
  const canPrevious = page > 1;
  const canNext = page < total;

  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm text-slate-500">
      <span>
        Page {page} of {total}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          className="h-11 w-11 p-0 disabled:cursor-not-allowed disabled:opacity-45"
          aria-label="Previous page"
          disabled={!canPrevious}
          onClick={onPrevious}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="secondary"
          className="h-11 w-11 p-0 disabled:cursor-not-allowed disabled:opacity-45"
          aria-label="Next page"
          disabled={!canNext}
          onClick={onNext}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
