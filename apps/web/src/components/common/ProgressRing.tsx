import React from 'react';

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  suffix?: string;
}

const getColor = (value: number): string => {
  if (value >= 80) return 'var(--color-positive)';
  if (value >= 50) return 'var(--color-warning)';
  return 'var(--color-negative)';
};

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size = 80,
  strokeWidth = 6,
  label,
  suffix = '%',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  const color = getColor(value);

  return (
    <div className="text-center">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: `stroke-dashoffset 500ms cubic-bezier(0.34, 1.56, 0.64, 1), stroke 300ms ease`,
          }}
        />
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            transform: 'rotate(90deg)',
            transformOrigin: 'center',
            fontSize: size * 0.22,
            fontWeight: 600,
            fill: 'hsl(var(--foreground))',
          }}
        >
          {Math.round(value)}{suffix}
        </text>
      </svg>
      {label && (
        <span className="text-xs text-muted-foreground block mt-1">
          {label}
        </span>
      )}
    </div>
  );
};
