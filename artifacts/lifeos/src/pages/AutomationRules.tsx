import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from "@tanstack/react-query";
import { useListAutomationRules, useCreateAutomationRule, useUpdateAutomationRule, useDeleteAutomationRule, useListAutomationExecutions, useEvaluateAutomation, getListAutomationRulesQueryKey } from "@workspace/api-client-react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Settings,
  AlertCircle,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const CONDITION_TYPES = [
  { value: 'ULTRA_SCORE_THRESHOLD', label: 'ULTRA Score Threshold' },
  { value: 'HUB_SCORE_THRESHOLD', label: 'Hub Score Threshold' },
  { value: 'TREND_DROP', label: 'Trend Declining' },
  { value: 'TREND_RISE', label: 'Trend Rising' },
  { value: 'IS_WEAKEST', label: 'Is Weakest Hub' },
  { value: 'IS_STRONGEST', label: 'Is Strongest Hub' },
  { value: 'STREAK_BROKEN', label: 'Habit Streak Broken' },
  { value: 'CONSISTENCY_LOW', label: 'Low Consistency' },
  { value: 'STATE_CHANGE', label: 'State Changed' },
  { value: 'MISSING_LOGS', label: 'Missing Logs' },
  { value: 'CALENDAR_OVERLOAD', label: 'Calendar Overloaded' },
];

const ACTION_TYPES = [
  { value: 'CREATE_TASK', label: 'Create Task' },
  { value: 'CREATE_CALENDAR_BLOCK', label: 'Create Calendar Block' },
  { value: 'SEND_ALERT', label: 'Send Alert' },
  { value: 'RECOMMEND_HABIT', label: 'Recommend Habit' },
  { value: 'SET_PRIORITY', label: 'Set Priority' },
  { value: 'CHANGE_MODE', label: 'Change System Mode' },
  { value: 'GENERATE_INSIGHT', label: 'Generate AI Insight' },
  { value: 'TRIGGER_RECOVERY', label: 'Trigger Recovery Mode' },
];

export default function AutomationRules() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  // Fetch automation rules
  const { data: rules, isLoading } = useListAutomationRules();

  // Fetch execution logs
  const { data: executions } = useListAutomationExecutions();

  // Toggle rule activation
  const updateRuleMutation = useUpdateAutomationRule();
  
  const handleToggleRule = async (id: number, isActive: boolean | undefined) => {
    try {
      await updateRuleMutation.mutateAsync({
        id,
        data: { isActive: !isActive }
      });
      queryClient.invalidateQueries({ queryKey: getListAutomationRulesQueryKey() });
      toast.success('Rule updated');
    } catch (error) {
      toast.error('Failed to update rule');
    }
  };

  // Delete rule
  const deleteRuleMutation = useDeleteAutomationRule();
  
  const handleDeleteRule = async (id: number) => {
    try {
      await deleteRuleMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListAutomationRulesQueryKey() });
      toast.success('Rule deleted');
    } catch (error) {
      toast.error('Failed to delete rule');
    }
  };

  // Test rule (approximated)
  const evaluateMutation = useEvaluateAutomation();
  
  const testRule = async (ruleId: number) => {
    try {
      const data = await evaluateMutation.mutateAsync();
      toast.success('System evaluation triggered', {
        description: `Evaluated ${data.rulesEvaluated} rules.`
      });
    } catch (error) {
      toast.error('Rule test failed');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-ultra bg-clip-text text-transparent">
            Automation Rules Engine
          </h1>
          <p className="text-muted-foreground text-lg">
            Configure intelligent triggers and automated actions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" onClick={() => setEditingRule(null)}>
              <Plus className="h-5 w-5 mr-2" />
              New Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? 'Edit Automation Rule' : 'Create Automation Rule'}
              </DialogTitle>
              <DialogDescription>
                Define conditions and actions for intelligent automation
              </DialogDescription>
            </DialogHeader>
            <RuleForm 
              rule={editingRule} 
              onClose={() => {
                setIsDialogOpen(false);
                setEditingRule(null);
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Rules */}
      <Card className="border-2 border-primary/30 shadow-lg">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Active Automation Rules
          </CardTitle>
          <CardDescription>
            Rules currently monitoring your system
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">Loading rules...</div>
          ) : rules && rules.length > 0 ? (
            <div className="space-y-4">
              {rules.map((rule) => (
                <Card key={rule.id} className={!rule.isActive ? 'opacity-50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{rule.name}</h3>
                          <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {rule.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">
                            {rule.conditionType.replace(/_/g, ' ')}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            → {rule.actionTarget}
                          </Badge>
                          {rule.actionValue && (
                            <Badge variant="outline" className="text-xs">
                              {rule.actionValue}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={() => handleToggleRule(rule.id, rule.isActive)}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => testRule(rule.id)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingRule(rule);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No automation rules configured yet. Create your first rule to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Execution History */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Executions
          </CardTitle>
          <CardDescription>
            History of automation rule firings
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {executions && executions.length > 0 ? (
            <div className="space-y-2">
              {executions.map((execution) => (
                <div 
                  key={execution.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {execution.executionResult === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-warning" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {execution.triggerType?.replace(/_/g, ' ') || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {execution.executionDate ? new Date(execution.executionDate).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {execution.executionResult}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No executions yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RuleForm({ rule, onClose }: { rule: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    conditionType: rule?.conditionType || '',
    conditionValue: rule?.conditionValue !== undefined && rule?.conditionValue !== null ? Number(rule.conditionValue) : 0,
    actionTarget: rule?.actionTarget || '',
    actionValue: rule?.actionValue || '',
    isActive: rule?.isActive ?? true,
  });

  const createRuleMutation = useCreateAutomationRule();
  const updateRuleMutation = useUpdateAutomationRule();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (rule) {
        await updateRuleMutation.mutateAsync({
          id: rule.id,
          data: formData
        });
      } else {
        await createRuleMutation.mutateAsync({
          data: formData
        });
      }
      queryClient.invalidateQueries({ queryKey: getListAutomationRulesQueryKey() });
      toast.success(rule ? 'Rule updated' : 'Rule created');
      onClose();
    } catch (error) {
      toast.error('Failed to save rule');
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Rule Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Low Health Score Alert"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="What does this rule do?"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="conditionType">Condition Type</Label>
          <Select
            value={formData.conditionType}
            onValueChange={(value) => setFormData({ ...formData, conditionType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              {CONDITION_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="conditionValue">Threshold Value</Label>
          <Input
            id="conditionValue"
            type="number"
            value={formData.conditionValue}
            onChange={(e) => setFormData({ ...formData, conditionValue: parseFloat(e.target.value) || 0 })}
            placeholder="e.g., 40"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="actionTarget">Action Target</Label>
          <Select
            value={formData.actionTarget}
            onValueChange={(value) => setFormData({ ...formData, actionTarget: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select action" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="actionValue">Action Value</Label>
          <Input
            id="actionValue"
            value={formData.actionValue}
            onChange={(e) => setFormData({ ...formData, actionValue: e.target.value })}
            placeholder="e.g., WeakestHub"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label htmlFor="isActive">Activate rule immediately</Label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={createRuleMutation.isPending || updateRuleMutation.isPending}>
          {createRuleMutation.isPending || updateRuleMutation.isPending ? 'Saving...' : rule ? 'Update Rule' : 'Create Rule'}
        </Button>
      </div>
    </form>
  );
}
