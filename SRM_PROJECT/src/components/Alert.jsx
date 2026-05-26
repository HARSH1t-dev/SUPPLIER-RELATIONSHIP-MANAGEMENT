import { Info } from 'lucide-react';

export function Alert({ children }) {
  return (
    <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-400">
      <Info className="mt-0.5 h-4 w-4 flex-none dark:text-blue-400" />
      <div>{children}</div>
    </div>
  );
}
