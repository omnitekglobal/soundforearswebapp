import Link from "next/link";
import { getTableState } from "@/lib/tableQuery";

function buildQueryString(searchParams, overrides = {}) {
  const { page, limit, sort, dir, filters } = getTableState(searchParams);
  const params = new URLSearchParams();
  if (overrides.page !== undefined) params.set("page", String(overrides.page));
  else if (page > 1) params.set("page", String(page));
  if (overrides.limit !== undefined) params.set("limit", String(overrides.limit));
  else if (limit !== 25) params.set("limit", String(limit));
  if (overrides.sort !== undefined) params.set("sort", overrides.sort);
  else if (sort) params.set("sort", sort);
  if (overrides.dir !== undefined) params.set("dir", overrides.dir);
  else if (sort && dir) params.set("dir", dir);
  Object.entries(overrides.filters ?? filters).forEach(([k, v]) => {
    if (v) params.set(`filter_${k}`, v);
  });
  const s = params.toString();
  return s ? `?${s}` : "";
}

export default function DataTable({
  columns,
  data,
  emptyMessage = "No records found.",
  basePath = "",
  searchParams,
  totalCount = 0,
  filterableColumns = [],
  sortableColumns = [],
  defaultSort = null,
  defaultDir = "desc",
}) {
  const { page, limit, sort, dir, filters } = getTableState(searchParams);
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const from = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalCount);
  const hasFilters = filterableColumns.length > 0;
  const hasSort = sortableColumns.length > 0;

  return (
    <div className="space-y-3">
      {hasFilters && (
        <form
          method="get"
          action={basePath}
          className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-2 sm:p-3"
        >
          {filterableColumns.map((col) => (
            <div key={col.key} className="min-w-0 flex-1 basis-24">
              <label className="mb-0.5 block text-xs font-medium text-slate-500">
                {col.header}
              </label>
              <input
                type="text"
                name={`filter_${col.key}`}
                defaultValue={filters[col.key] ?? ""}
                placeholder={`Filter ${col.header}`}
                className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
              />
            </div>
          ))}
          <input type="hidden" name="page" value="1" />
          <button
            type="submit"
            className="rounded bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
          >
            Filter
          </button>
          {Object.keys(filters).length > 0 && (
            <Link
              href={basePath}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Clear
            </Link>
          )}
        </form>
      )}

      {(!data || data.length === 0) && totalCount === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-5 text-center text-sm text-slate-500 sm:px-4 sm:py-6">
          {emptyMessage}
        </div>
      ) : (
        <>
          <div className="-mx-2 overflow-x-auto rounded-xl border border-slate-200 bg-white sm:mx-0">
            <table className="min-w-[40rem] divide-y divide-slate-200 text-xs sm:text-sm">
              <thead className="bg-slate-50/80">
                <tr>
                  {columns.map((column) => {
                    const isSortable = hasSort && sortableColumns.includes(column.key);
                    const nextDir = sort === column.key && dir === "asc" ? "desc" : "asc";
                    const thContent = isSortable ? (
                      <Link
                        href={`${basePath}${buildQueryString(searchParams, {
                          sort: column.key,
                          dir: nextDir,
                          page: 1,
                        })}`}
                        className="flex items-center gap-1 font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
                      >
                        {column.header}
                        {sort === column.key && (
                          <span className="text-sky-600">{dir === "asc" ? "↑" : "↓"}</span>
                        )}
                      </Link>
                    ) : (
                      column.header
                    );
                    return (
                      <th
                        key={column.key}
                        scope="col"
                        className="whitespace-nowrap px-2 py-2.5 text-left text-[0.7rem] sm:px-3 sm:text-xs"
                      >
                        {thContent}
                      </th>
                    );
                  })}
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
                        className="px-2 py-2.5 align-top text-slate-700 break-words sm:px-3"
                      >
                        {column.render ? column.render(row) : row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(totalCount > limit || page > 1) && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <span className="text-slate-600">
                Showing <strong>{from}</strong>–<strong>{to}</strong> of <strong>{totalCount}</strong>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Page {page} of {totalPages}</span>
                {page > 1 && (
                  <Link
                    href={`${basePath}${buildQueryString(searchParams, { page: page - 1 })}`}
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Previous
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`${basePath}${buildQueryString(searchParams, { page: page + 1 })}`}
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
