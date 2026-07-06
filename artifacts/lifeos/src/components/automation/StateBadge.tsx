import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Zap, 
  TrendingUp, 
  Activity, 
  Target, 
  MinusCircle, 
  AlertTriangle, 
  AlertOctagon, 
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { AutomationResult } from "@/hooks/useAutomationEngine";

interface StateBadgeProps {
  automation: AutomationResult;
  size?: 'sm' | 'md' | 'lg';
  showReasons?: boolean;
}

export function StateBadge({ automation, size = 'md', showReasons = false }: StateBadgeProps) {
  const getIcon = () => {
    switch (automation.stateIcon) {
      case 'check-circle': return CheckCircle2;
      case 'zap': return Zap;
      case 'trending-up': return TrendingUp;
      case 'activity': return Activity;
      case 'target': return Target;
      case 'minus-circle': return MinusCircle;
      case 'alert-triangle': return AlertTriangle;
      case 'alert-octagon': return AlertOctagon;
      case 'refresh-cw': return RefreshCw;
      case 'alert-circle': return AlertCircle;
      default: return Activity;
    }
  };

  const Icon = getIcon();
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const getLevelBg = () => {
    switch (automation.stateLevel) {
      case 'GREEN': return 'bg-success/10 text-success border-success/30';
      case 'YELLOW': return 'bg-warning/10 text-warning border-warning/30';
      case 'ORANGE': return 'bg-orange-500/10 text-orange-600 border-orange-500/30';
      case 'RED': return 'bg-ultra-danger/10 text-ultra-danger border-ultra-danger/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-2">
      <Badge 
        variant="outline" 
        className={`${sizeClasses[size]} ${getLevelBg()} font-semibold flex items-center gap-2 w-fit`}
      >
        <Icon className={iconSizes[size]} />
        {automation.state.replace(/_/g, ' ')}
      </Badge>
      
      {showReasons && automation.stateReasons.length > 0 && (
        <div className="space-y-1">
          {automation.stateReasons.map((reason: string, idx: number) => (
            <p key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
              <span className="text-primary mt-0.5">•</span>
              <span>{reason}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
