"use client";

import { useState } from "react";

const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

export default function PatientSearchInput({ patientList }) {
    const [query, setQuery] = useState("");
    const [patientId, setPatientId] = useState("");

    function handleChange(e) {
        const val = e.target.value;
        setQuery(val);
        // Resolve ID when user types or picks from datalist
        const exact = patientList.find(
            (p) => p.patientName.toLowerCase() === val.toLowerCase()
        );
        setPatientId(exact ? exact.id : "");
    }

    function handleClear() {
        setQuery("");
        setPatientId("");
    }

    return (
        <div className="relative">
            <label className="mb-1 block text-xs font-medium text-slate-500">
                Patient
            </label>
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Type to search patient…"
                    autoComplete="off"
                    list="patientDatalist"
                />
                {query && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-base leading-none"
                        tabIndex={-1}
                    >
                        ×
                    </button>
                )}
            </div>
            <datalist id="patientDatalist">
                {patientList.map((p) => (
                    <option key={p.id} value={p.patientName} />
                ))}
            </datalist>
            {/* Hidden field carries the resolved ID to the server action */}
            <input type="hidden" name="patientId" value={patientId} />
            {patientId && (
                <p className="mt-1 text-xs text-sky-600">✓ Patient selected</p>
            )}
        </div>
    );
}