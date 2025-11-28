import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function ScoreRing({ 
  score, 
  size = 'md', 
  showLabel = true,
  label = 'Score',
  className 
}: ScoreRingProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl'
  };

  const getScoreColor = () => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-warning';
    return 'text-ultra-danger';
  };

  const getStrokeColor = () => {
    if (score >= 80) return 'stroke-success';
    if (score >= 60) return 'stroke-primary';
    if (score >= 40) return 'stroke-warning';
    return 'stroke-ultra-danger';
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-muted opacity-20"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn("transition-all duration-500", getStrokeColor())}
          />
        </svg>
        
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold font-mono", textSizes[size], getScoreColor())}>
            {Math.round(score)}
          </span>
        </div>
      </div>
      
      {showLabel && (
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      )}
    </div>
  );
}
