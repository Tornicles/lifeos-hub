interface ProgressCircleProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  className?: string;
}

export function ProgressCircle({ 
  value, 
  size = 120, 
  strokeWidth = 8,
  showValue = true,
  className = ""
}: ProgressCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 80) return "hsl(var(--ultra-affluent))";
    if (score >= 60) return "hsl(var(--ultra-stable))";
    if (score >= 40) return "hsl(var(--warning))";
    return "hsl(var(--ultra-danger))";
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(value)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color: getColor(value) }}>
            {value.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground mt-1">ULTRA</span>
        </div>
      )}
    </div>
  );
}
