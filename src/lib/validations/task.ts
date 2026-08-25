import { z } from "zod";
import { TaskStatus, TaskPriority } from "@prisma/client";

export const TaskStatusEnum = z.nativeEnum(TaskStatus);
export const TaskPriorityEnum = z.nativeEnum(TaskPriority);

export const CreateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Task title is required")
    .max(150, "Task title cannot exceed 150 characters"),
  description: z
    .string()
    .max(2000, "Description cannot exceed 2000 characters")
    .optional()
    .nullable()
    .transform((val) => (val?.trim() ? val.trim() : null)),
  status: TaskStatusEnum.default(TaskStatus.TODO),
  priority: TaskPriorityEnum.default(TaskPriority.MEDIUM),
  assigneeId: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val?.trim() ? val.trim() : null)),
  dueDate: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
});

export type CreateTaskInput = z.input<typeof CreateTaskSchema>;
export type CreateTaskParsed = z.output<typeof CreateTaskSchema>;

export const UpdateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Task title is required")
    .max(150, "Task title cannot exceed 150 characters"),
  description: z
    .string()
    .max(2000, "Description cannot exceed 2000 characters")
    .optional()
    .nullable()
    .transform((val) => (val?.trim() ? val.trim() : null)),
  status: TaskStatusEnum,
  priority: TaskPriorityEnum,
  assigneeId: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val?.trim() ? val.trim() : null)),
  dueDate: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
});

export type UpdateTaskInput = z.input<typeof UpdateTaskSchema>;
export type UpdateTaskParsed = z.output<typeof UpdateTaskSchema>;

export const MoveTaskSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  status: TaskStatusEnum,
  order: z.number().int().min(0, "Order must be a positive integer"),
});

export type MoveTaskInput = z.infer<typeof MoveTaskSchema>;
