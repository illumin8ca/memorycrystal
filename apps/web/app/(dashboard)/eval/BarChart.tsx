"use client";

type DataPoint = {
  label: string;
  value: number;
};

type BarChartProps = {
  data: DataPoint[];
  height?: number;
};

const ACCENT = "#0066ff";
const TEXT = "#f0f0f0";
const GRID = "#2a2a2a";

function formatLabel(label: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
    return label.slice(5).replace("-", "/");
  }

  return label.length > 5 ? `${label.slice(0, 5)}…` : label;
}

export default function BarChart({ data, height = 180 }: BarChartProps) {
  if (!data.length) {
    return <div className="text-sm" style={{ color: "#888888" }}>No data.</div>;
  }

  const maxValue = Math.max(...data.map((d) => d.value), 0);
  const safeMax = maxValue > 0 ? maxValue : 1;

  const width = Math.max(data.length * 42, 360);
  const padding = {
    top: 24,
    right: 16,
    bottom: 28,
    left: 28,
  };

  const chartHeight = Math.max(height, 120);
  const chartInnerHeight = chartHeight - padding.top - padding.bottom;
  const chartInnerWidth = width - padding.left - padding.right;
  const band = chartInnerWidth / data.length;
  const barWidth = Math.max(10, band * 0.6);

  return (
    <div className="overflow-x-auto">
      <svg
        width={width}
        height={chartHeight}
        viewBox={`0 0 ${width} ${chartHeight}`}
        className="w-full block"
        style={{ backgroundColor: "transparent" }}
      >
        <line
          x1={padding.left}
          y1={chartHeight - padding.bottom}
          x2={width - padding.right}
          y2={chartHeight - padding.bottom}
          stroke={GRID}
          strokeWidth={1}
        />

        {data.map((item, index) => {
          const value = Math.max(0, Math.round(item.value));
          const barHeight = (value / safeMax) * chartInnerHeight;
          const x = padding.left + index * band + (band - barWidth) / 2;
          const y = padding.top + (chartInnerHeight - barHeight);
          const label = formatLabel(item.label);

          return (
            <g key={`${item.label}-${index}`}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={ACCENT}
              />

              {value > 0 ? (
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fontSize={10}
                  fill={TEXT}
                  fontFamily="var(--font-mono), monospace"
                >
                  {value}
                </text>
              ) : null}

              <text
                x={x + barWidth / 2}
                y={chartHeight - 10}
                textAnchor="middle"
                fontSize={10}
                fill={TEXT}
                fontFamily="var(--font-mono), monospace"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
