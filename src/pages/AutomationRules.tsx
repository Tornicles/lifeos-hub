import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

const OPERATORS = [
  { value: 'LESS_THAN', label: '<' },
  { value: 'LESS_EQUAL', label: '≤' },
  { value: 'GREATER_THAN', label: '>' },
  { value: 'GREATER_EQUAL', label: '≥' },
  { value: 'EQUALS', label: '=' },
  { value: 'NOT_EQUALS', label: '≠' },
];

export default function AutomationRules() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  // Fetch automation rules
  const { data: rules, isLoading } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch execution logs
  const { data: executions } = useQuery({
    queryKey: ['automation-executions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('automation_executions')
        .select('*')
        .eq('user_id', user.id)
        .order('execution_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  // Toggle rule activation
  const toggleRule = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const { error } = await supabase
        .from('automation_rules')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast.success('Rule updated');
    },
  });

  // Delete rule
  const deleteRule = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('automation_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast.success('Rule deleted');
    },
  });

  // Test rule
  const testRule = async (ruleId: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('evaluate-automation', {
        body: { test_rule_id: ruleId }
      });

      if (error) throw error;
      
      toast.success('Rule test completed', {
        description: `Result: ${data.test_result ? 'Triggered' : 'Not Triggered'}`
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
                <Card key={rule.id} className={!rule.is_active ? 'opacity-50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{rule.name}</h3>
                          <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                            {rule.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {rule.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">
                            {rule.condition_type.replace(/_/g, ' ')}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            → {rule.action_target}
                          </Badge>
                          {rule.action_value && (
                            <Badge variant="outline" className="text-xs">
                              {rule.action_value}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={() => toggleRule.mutate({ 
                            id: rule.id, 
                            isActive: rule.is_active 
                          })}
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
                          onClick={() => deleteRule.mutate(rule.id)}
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
                    {execution.execution_result === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-warning" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {execution.trigger_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(execution.execution_date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {execution.execution_result}
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
    condition_type: rule?.condition_type || '',
    condition_value: rule?.condition_value || '',
    action_target: rule?.action_target || '',
    action_value: rule?.action_value || '',
    is_active: rule?.is_active ?? true,
  });

  const saveRule = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (rule) {
        const { error } = await supabase
          .from('automation_rules')
          .update(data)
          .eq('id', rule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('automation_rules')
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast.success(rule ? 'Rule updated' : 'Rule created');
      onClose();
    },
    onError: (error) => {
      toast.error('Failed to save rule');
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveRule.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          <Label htmlFor="condition_type">Condition Type</Label>
          <Select
            value={formData.condition_type}
            onValueChange={(value) => setFormData({ ...formData, condition_type: value })}
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
          <Label htmlFor="condition_value">Threshold Value</Label>
          <Input
            id="condition_value"
            type="number"
            value={formData.condition_value}
            onChange={(e) => setFormData({ ...formData, condition_value: e.target.value })}
            placeholder="e.g., 40"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="action_target">Action Target</Label>
          <Select
            value={formData.action_target}
            onValueChange={(value) => setFormData({ ...formData, action_target: value })}
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
          <Label htmlFor="action_value">Action Value</Label>
          <Input
            id="action_value"
            value={formData.action_value}
            onChange={(e) => setFormData({ ...formData, action_value: e.target.value })}
            placeholder="e.g., WeakestHub"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="is_active">Activate rule immediately</Label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saveRule.isPending}>
          {saveRule.isPending ? 'Saving...' : rule ? 'Update Rule' : 'Create Rule'}
        </Button>
      </div>
    </form>
  );
}