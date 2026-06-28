import { Info } from 'lucide-react';

export function Alert({ children }) {
  return (
    <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
      <Info className="mt-0.5 h-4 w-4 flex-none" />
      <div>{children}</div>
    </div>
  );
}
