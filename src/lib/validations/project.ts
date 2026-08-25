import { z } from "zod";
import { ProjectStatus } from "@prisma/client";

export const ProjectStatusEnum = z.nativeEnum(ProjectStatus);

export const CreateProjectSchema = z
  .object({
    name: z
      .string()
      .min(2, "Project name must be at least 2 characters")
      .max(100, "Project name cannot exceed 100 characters")
      .trim(),
    key: z
      .string()
      .min(2, "Project key must be at least 2 characters")
      .max(10, "Project key cannot exceed 10 characters")
      .regex(
        /^[A-Za-z0-9_-]+$/,
        "Project key can only contain alphanumeric characters, underscores, and hyphens"
      )
      .transform((val) => val.trim().toUpperCase()),
    description: z
      .string()
      .max(1000, "Description cannot exceed 1000 characters")
      .optional()
      .nullable()
      .transform((val) => (val?.trim() ? val.trim() : null)),
    status: ProjectStatusEnum.default(ProjectStatus.PLANNING),
    startDate: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val ? new Date(val) : null)),
    targetDate: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val ? new Date(val) : null)),
  })
  .refine(
    (data) => {
      if (data.startDate && data.targetDate) {
        return data.startDate.getTime() <= data.targetDate.getTime();
      }
      return true;
    },
    {
      message: "Start date cannot be after target date",
      path: ["targetDate"],
    }
  );

export type CreateProjectInput = z.input<typeof CreateProjectSchema>;
export type CreateProjectParsed = z.output<typeof CreateProjectSchema>;

export const UpdateProjectSchema = z
  .object({
    name: z
      .string()
      .min(2, "Project name must be at least 2 characters")
      .max(100, "Project name cannot exceed 100 characters")
      .trim(),
    key: z
      .string()
      .min(2, "Project key must be at least 2 characters")
      .max(10, "Project key cannot exceed 10 characters")
      .regex(
        /^[A-Za-z0-9_-]+$/,
        "Project key can only contain alphanumeric characters, underscores, and hyphens"
      )
      .transform((val) => val.trim().toUpperCase()),
    description: z
      .string()
      .max(1000, "Description cannot exceed 1000 characters")
      .optional()
      .nullable()
      .transform((val) => (val?.trim() ? val.trim() : null)),
    status: ProjectStatusEnum,
    startDate: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val ? new Date(val) : null)),
    targetDate: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val ? new Date(val) : null)),
  })
  .refine(
    (data) => {
      if (data.startDate && data.targetDate) {
        return data.startDate.getTime() <= data.targetDate.getTime();
      }
      return true;
    },
    {
      message: "Start date cannot be after target date",
      path: ["targetDate"],
    }
  );

export type UpdateProjectInput = z.input<typeof UpdateProjectSchema>;
export type UpdateProjectParsed = z.output<typeof UpdateProjectSchema>;
