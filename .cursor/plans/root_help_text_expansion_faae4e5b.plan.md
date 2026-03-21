---
name: Root Help Text Expansion
overview: Expand the root help (hz --help) to list all commands and options divided into Worklog and Dashboard sections, plus a comprehensive examples section.
todos: []
isProject: false
---

# Root Help Text Expansion

## Goal

Update [src/index.ts](src/index.ts) so `hz --help` shows:

1. A complete command reference divided into **Worklog** and **Dashboard** sections
2. All commands with their options and arguments
3. Short descriptions for each
4. An examples section

---

## 1. Worklog Commands (beforeAll section)

Replace/enhance `rootHelpBefore` to include. Use chalk per section 5.

```
  WORKLOG (worklog.opengig.work — time tracking)
  ─────────────────────────────────────────────

  hz work [days]                    List worklogs (0=today, -5=5 days ago)
        -p, --pending               List locally pending works only

  hz work login                     Interactive login (email/password)

  hz work refresh                   Refetch user data from API

  hz work projects [filter]         List worklog projects
        -a, --all                   Show all projects (not just recent)
        [filter]                    Case-insensitive filter

  hz work active [name]             Show or set active project for this directory
        [name]                      Project name (exact or partial match)
        (no arg)                    Show linked project

  hz work start <name>              Start work (requires active project)
        <name>                      Work name

  hz work done <hash>               Mark work done by hash prefix, sync to API
        <hash>                      Hash prefix (e.g. abc)

  Aliases: hz wa => hz work active, hz wp => hz work projects
```

---

## 2. Dashboard Commands (beforeAll section)

```
  DASHBOARD (api.studio.heizen.work — projects & sprints)
  ───────────────────────────────────────────────────────

  hz projects                       List dashboard projects (table)
        -v, --verbose               Para-wise output with sprint counts

  hz projects open [name]           Link project to this directory
        [name]                      Project name (resolve by title/uniqueName)
        (no arg)                    Show linked project and working sprint

  hz sprints                        List sprints of linked project (name, status, dates)

  hz sprints set                    Set working sprint (interactive prompt)

  hz tasks [taskIndex] [storyIndex] [status]
                                    List tasks, view stories, or update story status
        -d, --details               Show all tasks with all stories (table)
        -v, --view                  Interactive mode (prompt for task/story)
        [taskIndex]                 1-based task index
        [storyIndex]                1-based story index
        [status]                    done | review | todo | inprogress
```

---

## 3. Auth Note (keep)

```
  Auth: hz work login for worklog. Set HEIZEN_DASHBOARD_TOKEN for dashboard.
```

---

## 4. Examples Section (afterAll)

Expand `rootHelpAfter` to cover both systems:

```
  EXAMPLES

  Worklog:
    hz work login                   Sign in
    hz work                         List today's worklogs
    hz work 5                       List worklogs from 5 days ago
    hz work -p                      List pending (not yet synced) works
    hz work projects --all          List all worklog projects
    hz work active "My Project"    Set active project
    hz wa "My Project"             Same (alias)
    hz wp                           List work projects (alias)
    hz work start "Fix bug"         Start work
    hz work done abc                Mark work with hash abc as done

  Dashboard:
    hz projects                     List dashboard projects
    hz projects -v                  Verbose (para-wise with sprint counts)
    hz projects open "Acme"         Link project to this directory
    hz projects open               Show linked project and sprint
    hz sprints                      List sprints
    hz sprints set                  Set working sprint (interactive)
    hz tasks                        List tasks in sprint
    hz tasks -d                     List tasks with all stories
    hz tasks -v                     Interactive: pick task, pick story
    hz tasks 2                      Show task 2 and its stories
    hz tasks 2 4                    Show story 4 of task 2
    hz tasks 2 4 done               Mark story as Done
```

---

## 5. Chalk Color Usage

Use a variety of colors for visual hierarchy and scanability:


| Element                                        | Chalk                        | Purpose                        |
| ---------------------------------------------- | ---------------------------- | ------------------------------ |
| Main title (Heizen CLI)                        | `chalk.bold.cyan`            | Eye-catching header            |
| WORKLOG section header                         | `chalk.bold.green`           | Worklog = green (time, go)     |
| DASHBOARD section header                       | `chalk.bold.blue`            | Dashboard = blue (projects)    |
| EXAMPLES section header                        | `chalk.bold.yellow`          | Examples = yellow (highlight)  |
| Subsection labels (Worklog:, Dashboard:)       | `chalk.green` / `chalk.blue` | Match their section            |
| Worklog command invocations (hz work ...)      | `chalk.green`                | Green family                   |
| Dashboard command invocations (hz projects...) | `chalk.cyan`                 | Blue/cyan family               |
| Options/flags (-v, --verbose)                  | `chalk.yellow`               | Accent, distinct from commands |
| Descriptions, body text                        | `chalk.dim`                  | Muted                          |
| Argument placeholders ([name], hash)           | `chalk.gray`                 | Secondary                      |
| System URLs (worklog.opengig.work, etc.)       | `chalk.gray`                 | Muted metadata                 |
| Separators (────)                              | `chalk.dim`                  | Muted                          |
| Aliases (wa, wp)                               | `chalk.magenta`              | Shortcuts stand out            |
| Auth note                                      | `chalk.dim`                  | Muted                          |


Pattern examples:

- `chalk.dim('  ') + chalk.green('hz work login') + chalk.dim('   Sign in')`
- `chalk.dim('  ') + chalk.cyan('hz projects') + chalk.dim('   List projects')`
- `chalk.dim('        ') + chalk.yellow('-v, --verbose') + chalk.dim('   Para-wise output')`

---

## 6. Implementation

In [src/index.ts](src/index.ts):

1. Expand `rootHelpBefore` to include Worklog and Dashboard command listings
2. Expand `rootHelpAfter` with Examples (Worklog + Dashboard)
3. Apply chalk per section 5: green for worklog, cyan for dashboard, yellow for options, magenta for aliases, dim for descriptions
4. Keep 2-space indent, align for scanability

---

## 7. Formatting Notes

- Use 2-space indent for readability
- Align command names and option blocks for scanability
- Commander still shows "Commands:" section below — the beforeAll is additional context

