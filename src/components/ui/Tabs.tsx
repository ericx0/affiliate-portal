"use client";

import * as React from "react";

type Tab = { id: string; label: React.ReactNode; badge?: React.ReactNode };

/**
 * Minimal tabs (controlled). Rendered as a horizontal pill bar; the
 * parent decides which panel to show via the `active` prop. Keeps the
 * Library page's three sub-libraries (assets / scripts / cases) snappy
 * without bringing in a headless lib.
 */
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="bg-slate-100 rounded-xl p-1 inline-flex flex-wrap gap-1">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors " +
              (isActive
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900")
            }
          >
            {tab.label}
            {tab.badge ? (
              <span className="text-[10px] font-semibold bg-slate-200 text-slate-700 px-1.5 rounded">
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}