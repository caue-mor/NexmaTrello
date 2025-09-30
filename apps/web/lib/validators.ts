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
  clientId: z.string().optional(),
});

export const cardUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  dueAt: z.string().optional(),
  columnId: z.string().optional(),
  completedAt: z.string().optional(),
  clientId: z.string().optional(),
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
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export const inviteAcceptSchema = z.object({
  token: z.string(),
});

// Client schemas
export const clientCreateSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  status: z.enum(["NORMAL", "NEUTRO", "URGENTE", "EMERGENCIA"]).default("NORMAL"),
  lead: z.number().int().min(0).default(0),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  document: z.string().optional(),
  sector: z.string().optional(),
  region: z.string().optional(),
  notes: z.string().optional(),
});

export const clientUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  status: z.enum(["NORMAL", "NEUTRO", "URGENTE", "EMERGENCIA"]).optional(),
  lead: z.number().int().min(0).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  document: z.string().optional(),
  sector: z.string().optional(),
  region: z.string().optional(),
  notes: z.string().optional(),
});

// Label schemas
export const labelCreateSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor inválida (use formato hex #RRGGBB)"),
});

export const labelUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  order: z.number().int().min(0).optional(),
});

// Attachment schemas
export const attachmentCreateSchema = z.object({
  fileName: z.string().min(1, "Nome do arquivo obrigatório"),
  fileUrl: z.string().url("URL inválida").optional(),
  fileBase64: z.string().optional(),
  mimeType: z.string().min(1, "Tipo MIME obrigatório"),
}).refine(
  (data) => data.fileUrl || data.fileBase64,
  { message: "Forneça fileUrl ou fileBase64" }
);

// Checklist Template schemas
export const checklistTemplateCreateSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  description: z.string().optional(),
  items: z.array(z.string().min(1)).min(1, "Pelo menos um item é obrigatório"),
});

export const checklistTemplateUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  items: z.array(z.string().min(1)).min(1).optional(),
});

// Card Reorder schema
export const cardReorderSchema = z.object({
  order: z.number().int().min(0),
  columnId: z.string().optional(), // If changing column
});

// Search schema
export const searchSchema = z.object({
  query: z.string().min(1, "Busca vazia"),
  boardId: z.string().optional(),
  filters: z.object({
    clients: z.array(z.string()).optional(),
    assignees: z.array(z.string()).optional(),
    urgencies: z.array(z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])).optional(),
    labels: z.array(z.string()).optional(),
    dueDateFrom: z.string().optional(),
    dueDateTo: z.string().optional(),
    overdue: z.boolean().optional(),
  }).optional(),
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
export type ClientCreateInput = z.infer<typeof clientCreateSchema>;
export type ClientUpdateInput = z.infer<typeof clientUpdateSchema>;
export type LabelCreateInput = z.infer<typeof labelCreateSchema>;
export type LabelUpdateInput = z.infer<typeof labelUpdateSchema>;
export type AttachmentCreateInput = z.infer<typeof attachmentCreateSchema>;
export type ChecklistTemplateCreateInput = z.infer<typeof checklistTemplateCreateSchema>;
export type ChecklistTemplateUpdateInput = z.infer<typeof checklistTemplateUpdateSchema>;
export type CardReorderInput = z.infer<typeof cardReorderSchema>;
export type SearchInput = z.infer<typeof searchSchema>;