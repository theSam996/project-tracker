import { z } from "zod";
import { ProjectMemberRole } from "@prisma/client";

export const AddMemberSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .trim()
    .toLowerCase(),
  role: z.enum([ProjectMemberRole.MEMBER, ProjectMemberRole.VIEWER]),
});

export type AddMemberInput = z.infer<typeof AddMemberSchema>;

export const UpdateMemberRoleSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  role: z.enum([ProjectMemberRole.MEMBER, ProjectMemberRole.VIEWER]),
});

export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleSchema>;
