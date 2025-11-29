import { z } from "zod";

/**
 * Input Validation & Sanitization Library
 * 
 * Provides comprehensive validation schemas and sanitization utilities
 * to prevent injection attacks, data corruption, and security vulnerabilities.
 */

// ============= SANITIZATION UTILITIES =============

/**
 * Sanitize text input by removing dangerous characters and HTML
 */
export const sanitizeText = (input: string): string => {
  if (!input) return "";
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
    .replace(/<[^>]+>/g, "") // Remove HTML tags
    .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
    .slice(0, 10000); // Max length
};

/**
 * Sanitize numeric input
 */
export const sanitizeNumber = (input: unknown): number | null => {
  const num = Number(input);
  if (isNaN(num) || !isFinite(num)) return null;
  return num;
};

/**
 * Sanitize email addresses
 */
export const sanitizeEmail = (input: string): string => {
  if (!input) return "";
  return input.trim().toLowerCase().slice(0, 255);
};

/**
 * Prevent SQL injection patterns (defense in depth)
 */
export const detectSQLInjection = (input: string): boolean => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(--|;|\/\*|\*\/|xp_|sp_)/gi,
    /('|"|`)\s*(OR|AND|UNION)/gi,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

/**
 * Prevent XSS patterns
 */
export const detectXSS = (input: string): boolean => {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick=
    /<iframe/gi,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
};

// ============= VALIDATION SCHEMAS =============

/**
 * Common field validations
 */
export const commonSchemas = {
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters")
    .transform(sanitizeEmail),
  
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password must be less than 128 characters"),
  
  fullName: z.string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .transform(sanitizeText),
  
  textField: z.string()
    .trim()
    .max(500, "Text must be less than 500 characters")
    .transform(sanitizeText),
  
  longTextField: z.string()
    .trim()
    .max(5000, "Text must be less than 5000 characters")
    .transform(sanitizeText),
  
  notes: z.string()
    .trim()
    .max(10000, "Notes must be less than 10000 characters")
    .transform(sanitizeText)
    .optional(),
  
  score: z.number()
    .min(0, "Score must be at least 0")
    .max(100, "Score must be at most 100")
    .finite("Score must be a valid number"),
  
  percentage: z.number()
    .min(0, "Percentage must be at least 0")
    .max(100, "Percentage must be at most 100")
    .finite("Percentage must be a valid number"),
  
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine((date) => {
      const d = new Date(date);
      return d instanceof Date && !isNaN(d.getTime());
    }, "Invalid date"),
  
  uuid: z.string()
    .uuid("Invalid UUID format"),
  
  priority: z.enum(["Low", "Medium", "High", "Emergency"]),
  
  status: z.enum(["Not Started", "In Progress", "Completed", "On Hold", "Cancelled"]),
};

/**
 * Authentication schemas
 */
export const authSchemas = {
  signUp: z.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    fullName: commonSchemas.fullName,
  }),
  
  signIn: z.object({
    email: commonSchemas.email,
    password: z.string().min(1, "Password is required"),
  }),
  
  resetPassword: z.object({
    email: commonSchemas.email,
  }),
  
  updatePassword: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: commonSchemas.password,
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),
};

/**
 * Profile schemas
 */
export const profileSchemas = {
  update: z.object({
    full_name: commonSchemas.fullName,
    role: z.string().max(50).optional(),
  }),
};

/**
 * Log entry schemas
 */
export const logSchemas = {
  create: z.object({
    hub_id: z.number().int().positive().optional().nullable(),
    log_date: commonSchemas.date,
    source: z.string().min(1, "Source is required").max(100).transform(sanitizeText),
    metric: z.string().max(100).transform(sanitizeText).optional().nullable(),
    value: z.number().finite().optional().nullable(),
    notes: commonSchemas.notes.optional().nullable(),
  }),
  
  update: z.object({
    hub_id: z.number().int().positive().optional().nullable(),
    log_date: commonSchemas.date.optional(),
    source: z.string().max(100).transform(sanitizeText).optional(),
    metric: z.string().max(100).transform(sanitizeText).optional().nullable(),
    value: z.number().finite().optional().nullable(),
    notes: commonSchemas.notes.optional().nullable(),
  }),
};

/**
 * Metric schemas
 */
export const metricSchemas = {
  create: z.object({
    hub_id: z.number().int().positive().optional().nullable(),
    metric_date: commonSchemas.date,
    name: z.string().min(1, "Name is required").max(100).transform(sanitizeText),
    value: z.number().finite("Value must be a valid number"),
  }),
  
  update: z.object({
    value: z.number().finite("Value must be a valid number"),
  }),
};

/**
 * Ultra metric schemas
 */
export const ultraMetricSchemas = {
  create: z.object({
    domain_id: z.number().int().positive().optional().nullable(),
    metric_date: commonSchemas.date,
    name: z.string().min(1, "Name is required").max(100).transform(sanitizeText),
    value: commonSchemas.score,
  }),
  
  update: z.object({
    value: commonSchemas.score,
  }),
};

/**
 * Project schemas
 */
export const projectSchemas = {
  create: z.object({
    hub_id: z.number().int().positive().optional().nullable(),
    title: z.string().min(1, "Title is required").max(200).transform(sanitizeText),
    status: commonSchemas.status.optional(),
    priority: commonSchemas.priority.optional(),
    due_date: commonSchemas.date.optional().nullable(),
    sprint: z.string().max(50).transform(sanitizeText).optional().nullable(),
    notes: commonSchemas.notes.optional().nullable(),
  }),
  
  update: z.object({
    hub_id: z.number().int().positive().optional().nullable(),
    title: z.string().min(1, "Title is required").max(200).transform(sanitizeText).optional(),
    status: commonSchemas.status.optional(),
    priority: commonSchemas.priority.optional(),
    due_date: commonSchemas.date.optional().nullable(),
    sprint: z.string().max(50).transform(sanitizeText).optional().nullable(),
    notes: commonSchemas.notes.optional().nullable(),
  }),
};

/**
 * Task schemas
 */
export const taskSchemas = {
  create: z.object({
    project_id: z.number().int().positive("Project ID is required"),
    title: z.string().min(1, "Title is required").max(200).transform(sanitizeText),
    description: commonSchemas.notes.optional().nullable(),
    status: commonSchemas.status.optional(),
    priority: commonSchemas.priority.optional(),
    importance: z.number().int().min(1).max(10).optional(),
    due_date: commonSchemas.date.optional().nullable(),
  }),
  
  update: z.object({
    title: z.string().min(1, "Title is required").max(200).transform(sanitizeText).optional(),
    description: commonSchemas.notes.optional().nullable(),
    status: commonSchemas.status.optional(),
    priority: commonSchemas.priority.optional(),
    importance: z.number().int().min(1).max(10).optional(),
    due_date: commonSchemas.date.optional().nullable(),
  }),
};

/**
 * Habit schemas
 */
export const habitSchemas = {
  create: z.object({
    name: z.string().min(1, "Name is required").max(100).transform(sanitizeText),
    description: commonSchemas.notes.optional().nullable(),
    streak: z.number().int().min(0).optional(),
    last_checkin: commonSchemas.date.optional().nullable(),
  }),
  
  update: z.object({
    name: z.string().min(1, "Name is required").max(100).transform(sanitizeText).optional(),
    description: commonSchemas.notes.optional().nullable(),
    streak: z.number().int().min(0).optional(),
    last_checkin: commonSchemas.date.optional().nullable(),
  }),
  
  checkin: z.object({
    habit_id: z.number().int().positive("Habit ID is required"),
    date: commonSchemas.date,
    done: z.boolean().optional(),
  }),
};

/**
 * Calendar entry schemas
 */
export const calendarSchemas = {
  create: z.object({
    hub_id: z.number().int().positive().optional().nullable(),
    date: commonSchemas.date,
    title: z.string().min(1, "Title is required").max(200).transform(sanitizeText),
    description: commonSchemas.notes.optional().nullable(),
    start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)").optional().nullable(),
    end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)").optional().nullable(),
    focus_domain: z.string().max(100).transform(sanitizeText).optional().nullable(),
  }),
  
  update: z.object({
    hub_id: z.number().int().positive().optional().nullable(),
    date: commonSchemas.date.optional(),
    title: z.string().min(1, "Title is required").max(200).transform(sanitizeText).optional(),
    description: commonSchemas.notes.optional().nullable(),
    start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)").optional().nullable(),
    end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)").optional().nullable(),
    focus_domain: z.string().max(100).transform(sanitizeText).optional().nullable(),
  }),
};

/**
 * Automation rule schemas
 */
export const automationSchemas = {
  createRule: z.object({
    name: z.string().min(1, "Name is required").max(200).transform(sanitizeText),
    description: commonSchemas.notes.optional().nullable(),
    condition_type: z.string().min(1).max(50),
    metric_source: z.enum(["ULTRA_SCORE", "HUB_SCORE", "DOMAIN_SCORE", "LOG_ENTRY", "MANUAL_INPUT"]),
    metric_name: z.string().max(100).optional().nullable(),
    comparison: z.enum(["<", "<=", "==", ">", ">="]),
    condition_value: z.number().finite().optional().nullable(),
    action_type: z.enum([
      "SET_STATE",
      "SET_PRIORITY",
      "GENERATE_TASK",
      "GENERATE_RECOMMENDATION",
      "FOCUS_DOMAIN",
      "ALERT_USER"
    ]),
    action_target: z.string().max(100),
    action_value: z.string().max(500).transform(sanitizeText).optional().nullable(),
    is_active: z.boolean().optional(),
  }),
};

/**
 * Security settings schemas
 */
export const securitySchemas = {
  updateSettings: z.object({
    mfa_enabled: z.boolean().optional(),
    session_timeout_minutes: z.number().int().min(15).max(1440).optional(),
    trusted_ips: z.array(z.string().ip()).max(10).optional(),
  }),
};

/**
 * Validation helper function
 */
export const validateInput = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (errors: z.ZodError): string => {
  return errors.errors
    .map(err => `${err.path.join('.')}: ${err.message}`)
    .join(', ');
};
