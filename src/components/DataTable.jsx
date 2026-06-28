export function DataTable({ columns, data, empty = 'No records found' }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {data.length ? (
            data.map((row, index) => (
              <tr key={row.id || row.sku || row.receipt || row.supplier || index} className="hover:bg-slate-50/70">
                {columns.map((column) => (
                  <td key={column.key} className="whitespace-nowrap px-5 py-4 text-slate-700">
                    {column.render ? column.render(row, index) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-5 py-8 text-center text-slate-500" colSpan={columns.length}>
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
