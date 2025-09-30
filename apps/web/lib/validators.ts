import { z } from "zod";

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email("E-mail inválido"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  csrf: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  csrf: z.string().optional(),
});

// Board schemas
export const boardCreateSchema = z.object({
  title: z.string().min(2, "Título deve ter pelo menos 2 caracteres"),
});

export const boardUpdateSchema = z.object({
  title: z.string().min(2, "Título deve ter pelo menos 2 caracteres").optional(),
  isOrgWide: z.boolean().optional(),
});

// Column schemas
export const columnCreateSchema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  order: z.number().int().min(0),
});

export const columnUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  order: z.number().int().min(0).optional(),
});

// Card schemas
export const cardCreateSchema = z.object({
  columnId: z.string(),
  title: z.string().min(1, "Título obrigatório"),
  description: z.string().optional(),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  dueAt: z.string().optional(),
});

export const cardUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  dueAt: z.string().optional(),
  columnId: z.string().optional(),
  completedAt: z.string().optional(),
});

// Checklist schemas
export const checklistCreateSchema = z.object({
  title: z.string().min(1, "Título obrigatório"),
});

export const checklistItemCreateSchema = z.object({
  content: z.string().min(1, "Conteúdo obrigatório"),
});

export const checklistItemToggleSchema = z.object({
  done: z.boolean(),
});

// Invite schemas
export const inviteSendSchema = z.object({
  boardId: z.string(),
  email: z.string().email("E-mail inválido"),
});

export const inviteAcceptSchema = z.object({
  token: z.string(),
});

// Types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type BoardCreateInput = z.infer<typeof boardCreateSchema>;
export type BoardUpdateInput = z.infer<typeof boardUpdateSchema>;
export type ColumnCreateInput = z.infer<typeof columnCreateSchema>;
export type ColumnUpdateInput = z.infer<typeof columnUpdateSchema>;
export type CardCreateInput = z.infer<typeof cardCreateSchema>;
export type CardUpdateInput = z.infer<typeof cardUpdateSchema>;
export type ChecklistCreateInput = z.infer<typeof checklistCreateSchema>;
export type ChecklistItemCreateInput = z.infer<typeof checklistItemCreateSchema>;
export type InviteSendInput = z.infer<typeof inviteSendSchema>;
export type InviteAcceptInput = z.infer<typeof inviteAcceptSchema>;