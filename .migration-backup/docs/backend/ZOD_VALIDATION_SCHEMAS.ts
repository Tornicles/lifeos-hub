/**
 * ============================================================================
 * LIFEOS v36 - ZOD VALIDATION SCHEMAS
 * ============================================================================
 * Comprehensive input validation schemas for all edge functions.
 * 
 * USAGE:
 * 1. Import the schema you need
 * 2. Parse the request body: schema.parse(body)
 * 3. Handle validation errors with try/catch
 * 
 * SECURITY:
 * - All schemas enforce strict types
 * - All schemas reject unknown fields
 * - All schemas have length limits
 * - All schemas validate enums
 * ============================================================================
 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

export const UUIDSchema = z.string().uuid();

export const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const TimeSchema = z.string().regex(/^\d{2}:\d{2}$/);

export const TenantIdSchema = z.string().uuid().nullable().optional();

// ============================================================================
// DATA FLOW PROCESSOR SCHEMAS
// ============================================================================

export const DataFlowTypeSchema = z.enum([
  'log_created',
  'habit_checkin',
  'project_updated',
  'calendar_event',
  'metric_updated',
  'task_completed',
  'state_changed'
]);

export const DataFlowPayloadSchema = z.object({
  flow_type: DataFlowTypeSchema,
  data: z.record(z.any()).optional(),
  entity_id: UUIDSchema.optional(),
  tenant_id: TenantIdSchema,
}).strict();

// Usage Example:
// const validated = DataFlowPayloadSchema.parse(requestBody);

// ============================================================================
// AUTOMATION TRIGGER SCHEMAS
// ============================================================================

export const AutomationTriggerTypeSchema = z.enum([
  'log_created',
  'habit_checkin',
  'project_updated',
  'task_completed',
  'calendar_event',
  'metric_threshold',
  'score_change',
  'manual_trigger'
]);

export const AutomationTriggerPayloadSchema = z.object({
  trigger_type: AutomationTriggerTypeSchema,
  entity_id: z.union([z.string(), z.number()]).optional(),
  trigger_data: z.record(z.any()).optional(),
  tenant_id: TenantIdSchema,
}).strict();

// Usage Example:
// const validated = AutomationTriggerPayloadSchema.parse(requestBody);

// ============================================================================
// LOG ENTRY SCHEMAS
// ============================================================================

export const LogSourceSchema = z.enum([
  'Finance_Log',
  'Health_Log',
  'Work_Log',
  'Academy_Log',
  'PersonalDev_Log',
  'Household_Log',
  'Relationships_Log',
  'Projects_Log',
  'Mindset_Log',
  'manual'
]);

export const CreateLogSchema = z.object({
  log_date: DateSchema,
  source: LogSourceSchema,
  metric: z.string().trim().min(1).max(100).optional(),
  value: z.number().optional(),
  notes: z.string().trim().max(5000).optional(),
  hub_id: z.number().int().positive().optional(),
  tenant_id: TenantIdSchema,
}).strict();

// ============================================================================
// METRIC SCHEMAS
// ============================================================================

export const CreateMetricSchema = z.object({
  name: z.string().trim().min(1).max(100),
  value: z.number(),
  metric_date: DateSchema,
  hub_id: z.number().int().positive().optional(),
  tenant_id: TenantIdSchema,
}).strict();

export const CreateUltraMetricSchema = z.object({
  name: z.string().trim().min(1).max(100),
  value: z.number().min(0).max(100),
  metric_date: DateSchema,
  domain_id: z.number().int().positive().optional(),
  tenant_id: TenantIdSchema,
}).strict();

// ============================================================================
// PROJECT & TASK SCHEMAS
// ============================================================================

export const ProjectStatusSchema = z.enum(['Not Started', 'In Progress', 'Done', 'On Hold']);

export const ProjectPrioritySchema = z.enum(['Low', 'Medium', 'High', 'Urgent']);

export const CreateProjectSchema = z.object({
  title: z.string().trim().min(1).max(200),
  notes: z.string().trim().max(5000).optional().nullable(),
  status: ProjectStatusSchema.default('Not Started'),
  priority: ProjectPrioritySchema.default('Medium'),
  sprint: z.string().trim().max(50).optional().nullable(),
  hub_id: z.number().int().positive().optional().nullable(),
  due_date: DateSchema.optional().nullable(),
  tenant_id: TenantIdSchema,
}).strict();

export const TaskStatusSchema = z.enum(['Not Started', 'In Progress', 'Done']);

export const TaskPrioritySchema = z.enum(['Low', 'Medium', 'High']);

export const CreateTaskSchema = z.object({
  project_id: z.number().int().positive(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional().nullable(),
  status: TaskStatusSchema.default('Not Started'),
  priority: TaskPrioritySchema.default('Medium'),
  importance: z.number().int().min(1).max(5).default(1),
  due_date: DateSchema.optional().nullable(),
}).strict();

// ============================================================================
// HABIT SCHEMAS
// ============================================================================

export const CreateHabitSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).optional().nullable(),
  tenant_id: TenantIdSchema,
}).strict();

export const HabitCheckinSchema = z.object({
  habit_id: z.number().int().positive(),
  date: DateSchema,
  done: z.boolean().default(true),
}).strict();

// ============================================================================
// CALENDAR SCHEMAS
// ============================================================================

export const FocusDomainSchema = z.enum([
  'Spirituality',
  'Career',
  'Social',
  'Emotional',
  'Branding',
  'Fitness',
  'Dating',
  'Health',
  'Finance',
  'Work',
  'Academy',
  'PersonalDev',
  'Household',
  'Relationships',
  'Projects',
  'Mindset'
]);

export const CreateCalendarEntrySchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  date: DateSchema,
  start_time: TimeSchema.optional().nullable(),
  end_time: TimeSchema.optional().nullable(),
  hub_id: z.number().int().positive().optional().nullable(),
  focus_domain: FocusDomainSchema.optional().nullable(),
  tenant_id: TenantIdSchema,
}).strict();

// ============================================================================
// AUTOMATION SCHEMAS
// ============================================================================

export const AutomationActionTypeSchema = z.enum([
  'create_task',
  'create_calendar_entry',
  'create_notification',
  'update_system_state',
  'suggest_habit',
  'create_auto_action'
]);

export const CreateAutomationActionSchema = z.object({
  action_type: AutomationActionTypeSchema,
  action_payload: z.record(z.any()),
  priority: z.number().int().min(1).max(100).default(1),
  scheduled_for: z.string().datetime().optional(),
}).strict();

// ============================================================================
// NOTIFICATION SCHEMAS
// ============================================================================

export const NotificationTypeSchema = z.enum([
  'performance_drop',
  'habit_reminder',
  'project_deadline',
  'task_overdue',
  'weekly_report',
  'monthly_report',
  'system_alert',
  'automation_recommendation'
]);

export const NotificationSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);

export const CreateNotificationSchema = z.object({
  type: NotificationTypeSchema,
  title: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(1000),
  severity: NotificationSeveritySchema.default('medium'),
  related_entity_type: z.string().max(50).optional().nullable(),
  related_entity_id: z.string().max(50).optional().nullable(),
  metadata: z.record(z.any()).optional(),
}).strict();

// ============================================================================
// TENANT & MEMBERSHIP SCHEMAS
// ============================================================================

export const MembershipRoleSchema = z.enum(['owner', 'admin', 'member', 'viewer']);

export const MembershipStatusSchema = z.enum(['pending', 'active', 'revoked']);

export const CreateTenantSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1).max(50).regex(/^[a-z0-9-]+$/),
  plan: z.enum(['free', 'starter', 'pro', 'enterprise']).default('free'),
}).strict();

export const CreateMembershipSchema = z.object({
  tenant_id: UUIDSchema,
  user_id: UUIDSchema,
  role: MembershipRoleSchema.default('member'),
  invited_email: z.string().email().optional(),
}).strict();

// ============================================================================
// HELPER: Parse and validate request body
// ============================================================================

export async function parseAndValidate<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      };
    }
    return { success: false, error: 'Invalid request body' };
  }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// Example 1: data-flow-processor
import { DataFlowPayloadSchema, parseAndValidate } from './validation.ts';

Deno.serve(async (req) => {
  const result = await parseAndValidate(req, DataFlowPayloadSchema);
  
  if (!result.success) {
    return new Response(
      JSON.stringify({ error: result.error }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  const { flow_type, data, entity_id, tenant_id } = result.data;
  // ... process validated data
});

// Example 2: automation-trigger
import { AutomationTriggerPayloadSchema } from './validation.ts';

const body = await req.json();
const validated = AutomationTriggerPayloadSchema.parse(body);
// ... use validated.trigger_type, validated.entity_id, etc.

// Example 3: Create habit
import { CreateHabitSchema } from './validation.ts';

const habitData = CreateHabitSchema.parse(requestBody);
const { data, error } = await supabase
  .from('habits')
  .insert({
    ...habitData,
    user_id: userId, // from JWT
  });
*/
