import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatePillProps {
  state: string;
  className?: string;
}

export function StatePill({ state, className }: StatePillProps) {
  const getStateStyles = () => {
    const normalized = state.toUpperCase();
    
    switch (normalized) {
      case "CRISIS":
        return "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400 border-red-300";
      case "WEAK":
      case "DANGER":
        return "bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400 border-orange-300";
      case "NEUTRAL":
      case "STRUGGLING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400 border-yellow-300";
      case "GROWTH":
      case "BALANCED":
      case "ASCENSION":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-300";
      case "AFFLUENCE":
      case "ULTRA":
        return "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-400 border-gray-300";
    }
  };

  return (
    <Badge variant="outline" className={cn("font-semibold px-3 py-1", getStateStyles(), className)}>
      {state}
    </Badge>
  );
}
