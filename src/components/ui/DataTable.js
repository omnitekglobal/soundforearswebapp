export default function DataTable({
  columns,
  data,
  emptyMessage = "No records found.",
}) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
        <thead className="bg-slate-50/80">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="px-3 py-2 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || JSON.stringify(row)}
              className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/40"}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-3 py-2 align-top text-slate-700"
                >
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

