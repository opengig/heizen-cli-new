# heizen-cli

CLI for Heizen worklog and dashboard workflows.

## Install

### Global install (recommended for users)

```bash
npm i -g heizen-cli
```

Then run:

```bash
hz help
```

### Local development

```bash
bun install
bun run build
bun run dev -- help
```

## Authentication

`heizen-cli` has two auth flows:

- Dashboard auth (`api.studio.heizen.work`) via `hz login`
- Worklog auth (`worklog.opengig.work`) via `hz work login`

### Dashboard login

```bash
hz login
```

This opens your browser and completes OAuth callback on `http://127.0.0.1:7000/oauth2callback`.

### Worklog login

```bash
hz work login
```

This prompts for worklog email/password and stores the session.

## Command Reference

## Root

```bash
hz help
```

### Main commands

- `hz login` - Sign in to dashboard using browser OAuth callback
- `hz projects` - List dashboard projects
- `hz projects open [name]` - Link project to current directory
- `hz sprints` - List sprints for linked project
- `hz sprints set` - Set active working sprint
- `hz tasks [taskIndex] [storyIndex] [status]` - List/view/update stories
- `hz meetings [meetingIndex]` - List meetings, view details/summary/transcript
- `hz resources` - List project resources
- `hz wiki [docIndex]` - List/view wiki documents
- `hz work [days]` - Worklog commands
- `hz reset` - Clear local db, pending works, and auth tokens

## Worklog commands

```bash
hz work --help
```

- `hz work [days]` - List worklogs (`0` today, `-5` means 5 days ago)
  - `-p, --pending` - List locally pending works
- `hz work login` - Interactive login
- `hz work refresh` - Refetch user data
- `hz work projects [filter]`
  - `-a, --all` - Show all projects
- `hz work active [name]` - Show/set active project for this directory
- `hz work start <name>` - Start a worklog entry
- `hz work done <hash>` - Mark work done by hash prefix and sync

### Worklog aliases

- `hz wa` => `hz work active`
- `hz wp` => `hz work projects`

## Dashboard commands

### Projects

```bash
hz projects --help
hz projects open --help
```

- `hz projects`
  - `-v, --verbose` - Paragraph-style output
- `hz projects open [name]` - Link project in current directory

### Sprints

```bash
hz sprints --help
hz sprints set --help
```

- `hz sprints` - List linked project sprints
- `hz sprints set` - Interactively choose active sprint

### Tasks

```bash
hz tasks --help
```

- `hz tasks [taskIndex] [storyIndex] [status]`
  - `-d, --details` - Show all tasks with stories
  - `-v, --view` - Interactive mode
  - `status` accepted values: `done`, `review`, `todo`, `inprogress`

### Meetings

```bash
hz meetings --help
```

- `hz meetings [meetingIndex]`
  - `-s, --summary` - Show summary
  - `-t, --transcript` - Show transcript

### Resources

```bash
hz resources --help
```

- `hz resources`
  - `-d, --details` - Show full details

### Wiki

```bash
hz wiki --help
```

- `hz wiki [docIndex]`
  - `-d, --details` - Show details only

## Reset command

```bash
hz reset
```

Resets local CLI state after confirmation:

- Local db
- Pending local work entries
- Stored auth tokens/session

After reset, login again:

```bash
hz login
hz work login
```

## Common usage examples

```bash
# Login flows
hz login
hz work login

# Worklog
hz work
hz work 5
hz work -p
hz work projects --all
hz work active "My Project"
hz work start "Fix bug in auth flow"
hz work done abc

# Dashboard
hz projects
hz projects open "Acme"
hz sprints
hz sprints set
hz tasks
hz tasks -d
hz tasks 2
hz tasks 2 4
hz tasks 2 4 done
hz meetings
hz meetings 4 -s
hz resources
hz wiki
hz wiki 3
```

## Build and publish (maintainers)

```bash
bun run build
npm pack --dry-run
npm publish
```

If npm enforces 2FA:

```bash
npm publish --otp <code>
```
