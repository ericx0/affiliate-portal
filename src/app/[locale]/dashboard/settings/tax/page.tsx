"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";

interface TaxFormRecord {
  id: string;
  form_type: "W9" | "W8BEN";
  signer_name: string;
  status: "submitted" | "valid" | "rejected";
  submitted_at: string;
}

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
}

export default function TaxSettingsPage() {
  const [formType, setFormType] = useState<"W9" | "W8BEN" | "">("");
  const [fullName, setFullName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [existing, setExisting] = useState<TaxFormRecord | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(true);

  // Load current tax form status on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch<{ data: TaxFormRecord | null }>("/api/affiliate/me/tax-form");
        if (!cancelled) setExisting(res.data ?? null);
      } catch {
        // Not critical - just don't show existing status.
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) {
      setFile(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError("File must be a PDF or image (PNG/JPEG/WEBP).");
      setFile(null);
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setError("File exceeds 10MB limit.");
      setFile(null);
      return;
    }
    setFile(f);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formType) {
      setError("Select a tax form type.");
      return;
    }
    if (!fullName.trim()) {
      setError("Full legal name is required.");
      return;
    }
    if (!file) {
      setError("Upload your signed tax form.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Resolve the caller's auth_uid (storage path + backend path check).
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) {
        throw new Error("Not authenticated. Please sign in again.");
      }
      const authUid = userData.user.id;
      const filePath = `${authUid}/${Date.now()}-${sanitizeFileName(file.name)}`;

      // 2. Upload the signed PDF to the private tax-forms bucket (RLS-scoped
      //    to this user's folder).
      const { error: uploadErr } = await supabase.storage
        .from("tax-forms")
        .upload(filePath, file, { upsert: false, contentType: file.type });
      if (uploadErr) {
        throw new Error(`Upload failed: ${uploadErr.message}`);
      }

      // 3. Record metadata in affiliate.tax_forms (upsert replaces prior form).
      const res = await apiFetch<{ data: TaxFormRecord }>("/api/affiliate/me/tax-form", {
        method: "POST",
        body: {
          form_type: formType,
          signer_name: fullName.trim(),
          file_path: filePath,
        },
      });
      setExisting(res.data);
      setFile(null);
      setSuccess("Tax form submitted. You are now eligible for payouts.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Tax Information</h1>
      <p className="text-sm text-slate-600 mb-6">
        Required for issuing affiliate commission payouts. US persons submit Form W-9; non-US persons
        submit Form W-8BEN. Download the form from the IRS, fill it (including your TIN), sign it, and
        upload the signed PDF below.
      </p>

      {existing && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-6 max-w-xl">
          <p className="text-sm font-semibold text-brand-700">
            Current form: {existing.form_type === "W9" ? "W-9 (US)" : "W-8BEN (non-US)"}
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Signed by {existing.signer_name} · submitted{" "}
            {new Date(existing.submitted_at).toLocaleDateString()} · status:{" "}
            <span className="font-medium">{existing.status}</span>
          </p>
          {existing.status === "rejected" && (
            <p className="text-xs text-red-600 mt-1">
              Your previous submission was rejected. Please re-submit a corrected form.
            </p>
          )}
          <p className="text-xs text-slate-500 mt-1">Re-submitting replaces the current form.</p>
        </div>
      )}

      {loadingExisting && (
        <p className="text-sm text-slate-400 mb-4">Loading current status…</p>
      )}

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
          <label className="block text-xs text-slate-500 mb-1">Upload signed form</label>
          <div className="flex items-center gap-3">
            <label className="px-4 py-2 bg-slate-100 rounded-xl text-sm cursor-pointer hover:bg-slate-200">
              Choose file…
              <input type="file" accept="application/pdf,image/*" onChange={handleFile} className="hidden" />
            </label>
            <span className="text-xs text-slate-500">{file?.name ?? "No file selected"}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            PDF or image, max 10MB. Your TIN goes in the form itself - do not type it here.
          </p>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !formType}
            className="px-4 py-2 bg-brand-500 text-white rounded-xl font-semibold disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Tax Information"}
          </button>
        </div>
      </form>
    </div>
  );
}
