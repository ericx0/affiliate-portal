"use client";

import { useState } from "react";

export default function TaxSettingsPage() {
  const [formType, setFormType] = useState<"W9" | "W8BEN" | "">("");
  const [fullName, setFullName] = useState("");
  const [tin, setTin] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder: not a functional upload — UI shell only (V2)
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFileName(f.name);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Tax Information</h1>
      <p className="text-sm text-slate-600 mb-6">
        Required for issuing affiliate commission payouts. US persons submit Form W-9; non-US persons
        submit Form W-8BEN.
      </p>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border max-w-xl space-y-4">
        <div>
          <label className="block text-xs text-slate-500 mb-2">Tax form type</label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 px-4 py-2 border rounded-xl cursor-pointer has-[:checked]:bg-brand-50 has-[:checked]:border-brand-500">
              <input
                type="radio"
                name="form"
                value="W9"
                checked={formType === "W9"}
                onChange={() => setFormType("W9")}
              />
              <span className="text-sm">W-9 (US person)</span>
            </label>
            <label className="flex items-center gap-2 px-4 py-2 border rounded-xl cursor-pointer has-[:checked]:bg-brand-50 has-[:checked]:border-brand-500">
              <input
                type="radio"
                name="form"
                value="W8BEN"
                checked={formType === "W8BEN"}
                onChange={() => setFormType("W8BEN")}
              />
              <span className="text-sm">W-8BEN (non-US)</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">Full legal name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="As shown on tax form"
            className="w-full p-3 border rounded-xl"
            required
          />
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">
            {formType === "W8BEN" ? "Foreign TIN" : "SSN / EIN"}
          </label>
          <input
            value={tin}
            onChange={(e) => setTin(e.target.value)}
            placeholder={formType === "W8BEN" ? "e.g. 123-45-6789" : "e.g. 123-45-6789"}
            className="w-full p-3 border rounded-xl"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">Upload signed form</label>
          <div className="flex items-center gap-3">
            <label className="px-4 py-2 bg-slate-100 rounded-xl text-sm cursor-pointer hover:bg-slate-200">
              Choose file...
              <input type="file" accept="application/pdf,image/*" onChange={handleFile} className="hidden" />
            </label>
            <span className="text-xs text-slate-500">{fileName ?? "No file selected"}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            PDF or image, max 10MB. Upload is not active in this build (V2).
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={!formType}
            className="px-4 py-2 bg-brand-500 text-white rounded-xl font-semibold disabled:opacity-50"
          >
            Submit Tax Information
          </button>
          {submitted && <span className="text-green-600 text-sm">Saved (placeholder).</span>}
        </div>
      </form>
    </div>
  );
}