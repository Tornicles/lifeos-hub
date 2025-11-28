import { cn } from "@/lib/utils";

interface TrendBarProps {
  values: number[];
  className?: string;
}

export function TrendBar({ values, className }: TrendBarProps) {
  const maxValue = Math.max(...values, 1);
  
  return (
    <div className={cn("flex items-end justify-between gap-1 h-16", className)}>
      {values.map((value, index) => {
        const height = (value / maxValue) * 100;
        const color = value >= 70 ? "bg-green-500" : value >= 50 ? "bg-yellow-500" : "bg-red-500";
        
        return (
          <div key={index} className="flex-1 flex flex-col justify-end">
            <div
              className={cn("w-full rounded-t transition-all", color)}
              style={{ height: `${height}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}
