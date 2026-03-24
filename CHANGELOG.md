# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0](https://github.com/opengig/heizen-cli-new/compare/1.0.0...v1.1.0) - 2026-03-25

### Changed

- **HTTP and validation (lazy at the edges):**
  - Dashboard and worklog HTTP responses no longer use Zod; shapes are described with TypeScript interfaces where fields
    are optional (`?`) to match an unreliable backend.
  - Controllers only perform light checks (for example `Array.isArray` for list endpoints, non-null object checks for
    single resources) and return `[]` or `{}` when the envelope is wrong instead of throwing. That keeps controllers
    thin and tolerant, avoids false “invalid response” failures when the backend omits or reshapes fields, and matches
    what each command actually needs from the payload.
  - Outgoing `**addWorklog`** request bodies use a small
    `**assertAddWorklogRequest**`(required fields + positive`**hoursWorked\*\*`) instead of `Zod.parse`.
  - CLI modules use shared helpers in `**src/modules/common/format.ts**`: `**missing()**` renders literal `<missing>`
    for absent values; `**displayDateTimeEnGB**` / `**displayDateOnlyEnGB**` normalize date display (invalid or missing
    ISO strings show `<missing>`); `**requireForAction**` / `**requireStringForAction**` produce errors like
    `*{action} couldn't be done since {field} is missing`\* before calls that need IDs or `uniqueName`. Validation stays
    decentralized in commands so each flow checks only the fields it needs, with clear errors where the user’s intent is
    known.
  - **Local DB** (`src/schemas/db.ts`) **still uses Zod**; that layer was intentionally out of scope for this change.
- **Workspace state:** Removed `getLinkedDashboardProjectId` in favor of direct use of `linkedDashboardProjectId` on
  workspace state. `WorkspaceStateSchema` now allows `linkedWorklogProject` name to be optional and nullable.
- **Parsing and time:** Added `parseOneBasedIndex` and `parseTimeMsOrZero` for consistent one-based index parsing and
  millisecond time handling. Updated meetings, projects, task, and wiki flows to use them, with clearer validation and
  error messages for bad indices.

### Merged

- [#5](https://github.com/opengig/heizen-cli-new/pull/5) — lazy validation and related fixes
- [#6](https://github.com/opengig/heizen-cli-new/pull/6) — follow-up improvements
