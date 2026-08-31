# Architecture

One rule generates the whole tree:

> **A feature owns one domain end to end. A layer directory owns something no
> feature could own alone.**

Two tests decide where any file goes:

1. *Would two features ever own this together?* → it is shared
   (`components/ui`, `hooks/`, `src/server/`).
2. *Could it be swapped for another vendor without changing a business rule?*
   → it is infrastructure (`src/lib`). If it knows our models or our rules, it
   is a feature.

The second test is what keeps `lib/` nearly empty here. `lib/utils.ts` (the
`cn` class merger) passes it. A hypothetical `lib/org-invite-mailer.ts` would
not — it would know our roles and our wording, so it belongs to
`features/organizations`.

## The tree

```
src/
├── app/          ROUTING ONLY — page, layout, loading, error, not-found
│   └── api/      route handlers (tRPC transport, Clerk webhook)
├── features/     THE DOMAIN — vertical slices, each complete
│   └── <name>/
│       ├── server/   router, services, db access        ("server-only")
│       ├── client/   "use client" components and hooks
│       ├── model/    zod schemas, types, constants — isomorphic
│       └── index.ts  re-exports model/ ONLY
├── server/       FRAMEWORK — trpc, root, db, auth, provider
├── components/   SHARED UI — ui (shadcn), common (ours), data-table, layout (the shell)
├── config/       nav-items.ts — the sidebar, as data
├── hooks/        generic hooks only
├── lib/          REPLACEABLE ADAPTERS
├── store/        client providers (nice-modal)
└── utils/ generated/
```

Two features ship in the template: `identity` (who the caller is) and
`organizations` (the container the rest of the domain hangs off).
`organizations` is the worked example — it exercises every layer, and a third
feature should look like it.

## The three entry points

A feature exposes three doors, each single-environment. This is a
**compile-time correctness rule**, not a style preference — Next.js splits the
module graph into server and client, and a barrel that mixes them drags Prisma
and `node:crypto` into the browser.

| Entry | May import | Must never import |
|---|---|---|
| `<feature>/server` | other features' `server/`, `@/server/*`, `node:*`, Prisma | any `client/`, React |
| `<feature>/client` | other features' `client/`, `model/`, `@/utils/trpc`, `components/*` | any `server/`, Prisma, `node:*` |
| `<feature>` (root) | `model/` only | anything environment-specific |

Enforced, not just documented: every file under `features/*/server/` starts
with `import "server-only"`, so a client component importing one **fails the
build** instead of shipping the database client to the browser. (The same guard
is what makes standalone scripts awkward — see
[local-development.md](local-development.md).)

A feature with nothing genuinely shared has no `model/` and no root barrel. That
is deliberate: an empty barrel asserts a sharing that does not exist.

**Client components live in `client/components/` behind a `client/index.ts`.**
Both features do this, so a page imports `@/features/organizations/client` and
never a file path inside it — which is what lets a component be renamed or
split without touching the routes that render it.

### What goes in `model/`

Anything both sides need to agree on. In practice that is three things:

- **Zod input schemas.** `createOrganizationSchema` is validated by the router
  *and* drives the create form's resolver. Written twice they drift — the form
  enforces the slug format while the router accepts any non-empty string, and
  a caller reaching tRPC directly creates a slug the UI would never produce.
- **Enums.** SQLite has no enum type, so `UserRole` and `OrgRole` are string
  columns and the values live in `model/`. One definition the server validates
  against and the client renders from.
- **Permission predicates.** `canManageMembers(role)` is called by the router
  to decide and by the UI to hide a button. Same rule, one function.

## `app/` holds routing and nothing else

A file under `app/` is one of five Next.js primitives: `page`, `layout`,
`loading`, `error`, `not-found`. A `page.tsx` reads params, fetches what
routing needs, and renders feature components. If it has state, effects or
queries, it is a feature component with the wrong filename.

That is why the organization pages are three-line files that render
`OrganizationOverview`, `OrganizationMembersPanel` and
`OrganizationSettingsPanel` from
`features/organizations/client/components/organization-panels.tsx`. The panels
hold the queries; the routes hold the params.

There are no `_components/` directories. Feature UI lives in the feature.

## Access control

Access is checked **at the resource**, never by path matching.

- `src/middleware.ts` runs `clerkMiddleware()` and nothing else. It hydrates
  the session so `auth()` works; it decides nothing. Clerk deprecated
  `createRouteMatcher` for the reason worth repeating: a matcher's idea of the
  URL space drifts from Next.js's, and the gap is a reachable protected
  resource.
- `app/dashboard/layout.tsx` redirects an anonymous visitor. Every page beneath
  it inherits that guard by being beneath it.
- `protectedProcedure` and `adminProcedure` in `src/server/trpc.ts` guard the
  API. A procedure picks its guard explicitly; there is no ambient default.

Inside a feature, the guards compose. `@/server/auth` exports `requireUser`,
`requireOrgMember`, `requireOrgManager` and `requireOrgOwner` so a procedure
**states what it needs** instead of re-querying the same two rows with slightly
different error strings:

```ts
const { user, role } = await requireOrgManager(ctx, input.organizationId);
```

A non-member gets `FORBIDDEN` rather than `NOT_FOUND` on purpose: the two are
indistinguishable to someone probing ids, and FORBIDDEN is the honest answer to
the case that actually matters — you are signed in, and this is not yours.

The UI hides controls using the `model/` predicates. That is a courtesy, never
the enforcement. The server re-checks every one.

## Identity is mirrored, not owned

Clerk owns the credential. `UserAccount` mirrors just enough of the user —
`uid` is the Clerk subject — for our own tables to join against.

The Clerk webhook is the **only** writer of that row, through `syncClerkUser`
in `features/identity/server/service.ts`. Nothing else creates users, so there
is one place to look when a row is wrong and one function to reuse from a
backfill or a test.

Until the webhook fires there is no row, and `user.getCurrent` answers
`NOT_FOUND` — which the dashboard card explains rather than showing a blank.
`session.created` is the safety net for anyone who signed up while the endpoint
was unreachable.
