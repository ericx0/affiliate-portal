"use client";

import * as React from "react";

/**
 * Inline SVG sparkline. Avoids pulling in a chart lib (constraint: no new
 * deps). Renders a smooth area + line for an array of non-negative numbers;
 * if every value is zero we still draw the axis so empty periods don't
 * look like a broken widget.
 */
export function Sparkline({
  data,
  width = 280,
  height = 64,
  stroke = "#10B981",
  fill = "rgba(16, 185, 129, 0.12)",
}: {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
}) {
  const max = Math.max(1, ...data);
  const stepX = data.length > 1 ? width / (data.length - 1) : width;

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - (v / max) * (height - 4) - 2;
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    points.length > 0
      ? `M0,${height} L${points
          .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
          .join(" L")} L${width},${height} Z`
      : "";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      role="img"
      aria-label="trend"
    >
      {areaPath ? <path d={areaPath} fill={fill} /> : null}
      {linePath ? <path d={linePath} stroke={stroke} strokeWidth={2} fill="none" /> : null}
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2} fill={stroke} />
      ))}
    </svg>
  );
}

/**
 * Compact multi-series stacked area used by the funnel chart on the
 * dashboard. Series is an array of {label, values}; series are stacked
 * in the order given (no normalization).
 */
export function StackedArea({
  series,
  width = 640,
  height = 160,
}: {
  series: { label: string; values: number[]; color: string }[];
  width?: number;
  height?: number;
}) {
  const length = Math.max(0, ...series.map((s) => s.values.length));
  if (length === 0) {
    return <div className="text-xs text-slate-400">No data</div>;
  }
  const stepX = length > 1 ? width / (length - 1) : width;

  // Build cumulative baselines so each layer stacks on the previous.
  const totals: number[] = Array.from({ length }, (_, i) =>
    series.reduce((acc, s) => acc + (s.values[i] ?? 0), 0),
  );
  const maxTotal = Math.max(1, ...totals);

  let lower = Array(length).fill(0);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
      {series.map((s) => {
        const upper = lower.map((v, i) => v + (s.values[i] ?? 0));
        const top = upper
          .map(
            (v, i) =>
              `${(i * stepX).toFixed(1)},${(height - (v / maxTotal) * (height - 8) - 4).toFixed(1)}`,
          )
          .join(" L");
        const bottom = lower
          .map(
            (v, i) =>
              `${(i * stepX).toFixed(1)},${(height - (v / maxTotal) * (height - 8) - 4).toFixed(1)}`,
          )
          .reverse()
          .join(" L");
        const path = `M${bottom.split(" L")[0]} L${bottom} L${top} Z`;
        lower = upper;
        return <path key={s.label} d={path} fill={s.color} opacity={0.75} />;
      })}
      <line
        x1={0}
        x2={width}
        y1={height - 0.5}
        y2={height - 0.5}
        stroke="#E2E8F0"
      />
    </svg>
  );
}