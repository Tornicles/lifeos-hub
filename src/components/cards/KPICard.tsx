import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export function KPICard({ title, value, subtitle, icon: Icon, trend, variant = 'default' }: KPICardProps) {
  const variantStyles = {
    default: 'border-border',
    primary: 'border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5',
    success: 'border-green-200 bg-green-50/50',
    warning: 'border-yellow-200 bg-yellow-50/50',
    danger: 'border-red-200 bg-red-50/50',
  };

  const valueColors = {
    default: 'text-foreground',
    primary: 'bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
  };

  return (
    <Card className={`${variantStyles[variant]} transition-shadow hover:shadow-md`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className={`text-4xl font-bold ${valueColors[variant]}`}>
            {value}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <Badge 
              variant={trend.value >= 0 ? 'default' : 'destructive'}
              className="gap-1 text-xs"
            >
              {trend.value >= 0 ? '+' : ''}{trend.value.toFixed(1)} {trend.label}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
