import { z } from "zod";

/**
 * Organization input schemas, shared by the tRPC router and the forms.
 *
 * They live in `model/` because both halves need the *same* rules. Written
 * twice they drift — the form enforces the slug format while the router
 * accepts any non-empty string, and a caller reaching tRPC directly creates a
 * slug the UI would never have produced. One declaration, both sides.
 *
 * The messages are user-facing: react-hook-form renders them under the field,
 * and tRPC returns them in `zodError.fieldErrors`.
 */

/**
 * A member's role *within one organization* — not to be confused with
 * `UserRole`, which is install-wide. SQLite has no enum type, so the column
 * is a string and this is the definition both sides validate against.
 *
 * OWNER is the one who can delete the organization or hand it over; ADMIN can
 * manage members; MEMBER can only look.
 */
export const OrgRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
} as const;

export type OrgRole = (typeof OrgRole)[keyof typeof OrgRole];

export const ORG_ROLE_VALUES = Object.values(OrgRole);

export const orgRoleSchema = z.enum(ORG_ROLE_VALUES);

/** Roles that can be *assigned*. Ownership moves through `transferOwnership`. */
export const assignableOrgRoleSchema = z.enum([OrgRole.ADMIN, OrgRole.MEMBER]);

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
};

/** What each role is allowed to do. The server enforces it; the UI reads it. */
export function canManageMembers(role: OrgRole): boolean {
  return role === OrgRole.OWNER || role === OrgRole.ADMIN;
}

export function canEditOrganization(role: OrgRole): boolean {
  return role === OrgRole.OWNER || role === OrgRole.ADMIN;
}

export function canDeleteOrganization(role: OrgRole): boolean {
  return role === OrgRole.OWNER;
}

/** Lowercase letters, digits and hyphens — it appears in URLs. */
export const organizationSlugSchema = z
  .string()
  .min(2, "Slug must be at least 2 characters")
  .max(48, "Slug must be at most 48 characters")
  .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens");

export const createOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required").max(64),
  slug: organizationSlugSchema,
  description: z.string().max(280).optional(),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const updateOrganizationSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required").max(64).optional(),
  slug: organizationSlugSchema.optional(),
  description: z.string().max(280).optional(),
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

export const addMemberSchema = z.object({
  organizationId: z.number(),
  email: z.email("Enter a valid email address"),
  role: assignableOrgRoleSchema.default(OrgRole.MEMBER),
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;

/**
 * Derive a URL-safe slug from a display name. Used to prefill the create
 * form — the field stays editable, and the schema above has the final say.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/**
 * Input for the paginated list behind the organizations table.
 *
 * The shape mirrors what `useDataTable` holds in URL state — a page, a page
 * size, one sort, and a filter per column — because the table is
 * `manualPagination`/`manualSorting`/`manualFiltering`: every one of those is
 * the server's job, and this is the contract between them.
 */
export const ORGANIZATION_SORT_FIELDS = ["name", "slug", "createdAt"] as const;

export const listOrganizationsSchema = z.object({
  filter: z
    .object({
      name: z.string().optional(),
      slug: z.string().optional(),
      /** The caller's own role in the organization, not the org's. */
      role: z.array(orgRoleSchema).optional(),
    })
    .optional(),
  orderBy: z
    .object({
      field: z.enum(ORGANIZATION_SORT_FIELDS),
      direction: z.enum(["asc", "desc"]),
    })
    .optional(),
  pagination: z.object({
    skip: z.number().min(0).default(0),
    take: z.number().min(1).max(100).default(10),
  }),
});

export type ListOrganizationsInput = z.infer<typeof listOrganizationsSchema>;
