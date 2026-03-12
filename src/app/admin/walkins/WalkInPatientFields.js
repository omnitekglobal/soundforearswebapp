"use client";

import { useMemo, useState } from "react";

export default function WalkInPatientFields({ patients, walkInToEdit, inputClass }) {
  const defaultName = walkInToEdit?.name ?? "";
  const defaultPhone = walkInToEdit?.phone ?? "";
  const [query, setQuery] = useState("");

  const filteredPatients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) =>
      (p.patientName || "").toLowerCase().includes(q)
    );
  }, [patients, query]);

  function handleChange(e) {
    const selectedName = e.target.value;
    const form = e.target.form;
    if (!form) return;
    const selected = patients.find((p) => p.patientName === selectedName);
    const phoneInput = form.elements.namedItem("phone");
    if (phoneInput && selected) {
      phoneInput.value = selected.phone || "";
    }
  }

  return (
    <>
      <div className="space-y-1">
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Patient *
        </label>
        <input
          type="text"
          placeholder="Search patient"
          className={inputClass}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          name="name"
          className={inputClass}
          defaultValue={defaultName}
          required
          onChange={handleChange}
        >
          <option value="">Select patient</option>
          {filteredPatients.map((p) => (
            <option key={p.id} value={p.patientName}>
              {p.patientName}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Phone
        </label>
        <input
          name="phone"
          className={inputClass}
          defaultValue={defaultPhone}
        />
      </div>
    </>
  );
}


