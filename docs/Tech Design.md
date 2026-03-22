## Tech Stack

- TS with Bun/Node
- **CLI:** Commander, Prompts
- **Formatting:** Chalk, Ora, Listr2, cli-table3
- **Storage:** Lowdb; **Process:** Execa
- Axios, Zod

### Suggested Additions

- [**keytar**] — Secure credential storage (OS credential store) for worklog cookie and dashboard token. No plain text
  in `db.json` or `.env`.

## MVP Scope

1. User authentication
2. Fetch active sprint and assigned tasks
3. Show task details and acceptance criteria
4. Fetch related meeting summaries / docs **[TODO]**
5. Update task status from CLI
6. Create simple work logs from terminal

## Authentication Approach

### Current Flow: Worklog

- **Entry:** `hz work login` — interactive prompt for email/password.
- **Auth:** POST to `https://worklog.opengig.work/login.data`; server returns `Set-Cookie`. Cookie string is extracted
  and used for subsequent requests.
- **Storage:** Cookie and user data stored in `~/.hz/db.json` as `worklogAuth.cookie` and `worklogAuth.userData` (plain
  text in JSON).
- **Usage:** Cookie sent on all worklog requests (`/dashboard/user.data`, `/action/get-worklogs`,
  `POST /dashboard/user.data?index`).
- **Refresh:** `hz work refresh` refetches user data; on 401, prompts `hz work login` again.

### Current Flow: Dashboard

- **Entry:** User sets `HEIZEN_DASHBOARD_TOKEN` or `DASHBOARD_TOKEN` in `.env` (or environment).
- **Auth:** No interactive login; token is assumed valid Bearer JWT.
- **Storage:** Token read from env vars; no persistence in config files.
- **Usage:** `Authorization: Bearer <token>` on all dashboard API requests.

### Suggested Changes: No Plain Text / .env Storage

Store all credentials via **keytar** (OS credential store: Keychain, Credential Manager, libsecret). Do not store tokens
or cookies in plain text config files or `.env`.

**Worklog:** Store cookie in keytar after login; keep only non-sensitive `userData` in db.json. Remove plain-text cookie
from db.

**Dashboard:** Replace env-based token with keytar-backed storage. No `.env` or config files for tokens.

---

### Dashboard Login: Suggestions

1. **OAuth login (browser-based)** — Like GitHub CLI (`gh auth login`) or Firebase CLI. User completes auth in browser;
   CLI receives token. Best DX for developers.

2. **API key / token login** — Like Vercel CLI or Supabase CLI. User runs `hz auth login`, pastes token when prompted;
   token stored in keytar. Suitable for users who generate tokens from the dashboard.

## API Requirements

### Worklog (`https://worklog.opengig.work`)

| Method | Path                         | Purpose                                        |
| ------ | ---------------------------- | ---------------------------------------------- |
| POST   | `/login.data`                | Login with email/password; returns Set-Cookie  |
| GET    | `/dashboard/user.data`       | Fetch user data and projects (requires Cookie) |
| POST   | `/action/get-worklogs`       | Fetch worklogs by startDate, endDate, userId   |
| POST   | `/dashboard/user.data?index` | Add worklog entry                              |

### Dashboard (`https://api.studio.heizen.work`)

| Method | Path                                 | Purpose                                       |
| ------ | ------------------------------------ | --------------------------------------------- |
| GET    | `/projects?active={boolean}`         | List projects (with sprints)                  |
| GET    | `/tasks/sprint-board/:sprintId`      | Fetch sprint board tasks and stories          |
| GET    | `/tasks/user-stories/story/:storyId` | Get story details (acceptance criteria, etc.) |
| PUT    | `/tasks/user-stories/story/:storyId` | Update story (e.g. status)                    |

### Additional APIs Needed (for MVP #4: meeting summaries / docs)

| Method | Path | Purpose                                   |
| ------ | ---- | ----------------------------------------- |
| GET    |      | List meeting summaries for project/sprint |
| GET    |      | Fetch meeting summary and transcription   |
| GET    |      | List wikis/docs linked to project         |
| GET    |      | Fetch doc content                         |

## Non-Functional Requirements

1. Secure local authentication
2. Minimal setup for developers
3. Clear text and JSON output support
