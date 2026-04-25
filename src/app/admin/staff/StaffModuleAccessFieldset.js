"use client";

import { useRef } from "react";

const moduleFieldClass = "h-4 w-4 rounded border-slate-300 text-sky-600";

const defaultSelectAll = "Select all";
const defaultClear = "Clear all";

/**
 * Renders a titled block of checkboxes. Use two instances for “staff portal” vs “admin” modules.
 */
export default function StaffModuleAccessFieldset({
  options,
  defaultValues,
  sectionTitle = "Module access",
  sectionBlurb,
  /** Attribute used to find checkboxes in this group for Select all / Clear (unique per group). */
  checkboxDataAttr = "data-staff-page",
  selectAllLabel = defaultSelectAll,
  clearLabel = defaultClear,
}) {
  const listRef = useRef(null);

  const setAll = (checked) => {
    const root = listRef.current;
    if (!root) return;
    const sel = `input[type='checkbox'][${checkboxDataAttr}]`;
    root.querySelectorAll(sel).forEach((el) => {
      el.checked = checked;
    });
  };

  return (
    <div className="sm:col-span-2 lg:col-span-4 space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{sectionTitle}</p>
          {sectionBlurb ? (
            <p className="text-xs text-slate-500">{sectionBlurb}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:pt-0.5">
          <button
            type="button"
            onClick={() => setAll(true)}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            {selectAllLabel}
          </button>
          <button
            type="button"
            onClick={() => setAll(false)}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            {clearLabel}
          </button>
        </div>
      </div>
      <ul ref={listRef} className="mt-2 grid gap-2 sm:grid-cols-2">
        {options.map((mod) => (
          <li
            key={mod.name}
            className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3"
          >
            <input
              {...{ [checkboxDataAttr]: "" }}
              type="checkbox"
              name={mod.name}
              id={mod.name}
              defaultChecked={defaultValues[mod.name] ?? false}
              className={`${moduleFieldClass} mt-0.5 shrink-0`}
            />
            <label htmlFor={mod.name} className="min-w-0 cursor-pointer">
              <span className="text-sm font-medium text-slate-800">
                {mod.label}
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {mod.blurb}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
