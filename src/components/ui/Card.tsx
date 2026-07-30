"use client";

import * as React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  padded?: boolean;
};

/**
 * Standard panel — white surface, soft border, generous rounding. Used
 * across dashboard, library, clients, and AI Assist to keep the visual
 * language consistent with the partner portal's emerald palette.
 */
export function Card({ className = "", padded = true, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={
        "bg-white border border-slate-200 rounded-2xl shadow-sm " +
        (padded ? "p-6 " : "") +
        className
      }
    />
  );
}

export function SectionTitle({
  title,
  description,
  right,
}: {
  title: string;
  description?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {description ? (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        ) : null}
      </div>
      {right ? <div className="flex-shrink-0">{right}</div> : null}
    </div>
  );
}

export function Pill({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "emerald" | "amber" | "rose" | "blue";
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    blue: "bg-blue-50 text-blue-700",
  };
  return (
    <span
      className={
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium " +
        tones[tone]
      }
    >
      {children}
    </span>
  );
}