# CLI vs IDE Extension vs MCP Server

## 1. CLI Tool

### Description

A command-line interface that allows developers to interact with the Heizen dashboard and worklog system directly from
the terminal.

Typical commands:

- `hz tasks`
- `hz start <task-id>`
- `hz done <task-id>`
- `hz log`
- `hz context <task-id>`

It acts as a thin client over your dashboard APIs.

---

### What problem it solves

- Eliminates the need to open the dashboard UI for routine actions
- Reduces manual friction in:
  - updating task status
  - submitting work logs
  - fetching task context

- Provides a fast way to pull structured context into the local environment
- Enables scripting and automation (important for power users)

**But importantly:** It does **not** solve deep IDE-level integration or automatic state inference.

---

### Feasibility

**Very high**

- Minimal dependencies
- No IDE-specific APIs
- Can directly use existing backend APIs
- Fast iteration cycle
- Easy to test and distribute

**Engineering complexity:** Low **Time to first usable version:** Very fast (days, not weeks)

---

### AI Suggestion

Start here.

The CLI forces you to:

- define the exact actions developers need
- standardize task/worklog operations
- validate real usage patterns

If the CLI is not used heavily, your IDE extension will also fail.

---

## 2. IDE Extension

### Description

An extension inside the IDE (e.g., VS Code) that integrates the Heizen dashboard directly into the developer’s coding
environment.

Capabilities may include:

- Viewing current task and acceptance criteria
- Fetching sprint/task context inline
- Triggering task updates without leaving IDE
- Detecting code changes, commits, or file edits
- Suggesting task completion or logging actions

---

### What problem it solves

- Eliminates context switching between IDE and dashboard
- Brings task context directly into the coding workflow
- Reduces cognitive overhead of remembering requirements
- Enables **passive signals**:
  - file edits
  - commits
  - branch changes

This is the first layer that can move toward:

> **observability-driven workflow instead of manual updates**

---

### Feasibility

**Medium**

Challenges:

- IDE-specific APIs (VS Code vs JetBrains vs others)
- State synchronization between extension and backend
- Handling edge cases in developer workflows
- Maintaining performance and UX quality

**Engineering complexity:** Medium **Time to usable version:** Moderate (weeks)

---

### AI Suggestion

Build this **after CLI validation**.

Do not start here unless:

- you are confident about workflows
- you know exactly what needs to appear in the IDE

The extension should not invent new workflows — it should **compress existing ones into the coding environment**.

---

## 3. MCP Server

### Description

A Model Context Protocol (MCP) server that exposes Heizen’s dashboard and worklog capabilities as structured tools for
AI agents like Claude Code or Cursor.

Examples of exposed capabilities:

- `get_tasks`
- `get_task_context`
- `update_task_status`
- `create_worklog`
- `get_project_context`

Acts as a **standardized interface layer** between:

- Heizen backend
- AI execution agents

---

### What problem it solves

- Enables AI agents to directly interact with the dashboard
- Removes the need for manual context injection into AI prompts
- Allows:
  - AI-driven task execution
  - automatic updates
  - intelligent planning with real data

This is what enables your core vision:

> AI becomes the execution layer with access to both code and project context

---

### Feasibility

**Medium–High (but depends on clarity of APIs)**

Requirements:

- Well-defined backend APIs
- Clear permissioning model
- Stable tool contracts
- Thoughtful schema design

Less UI complexity, but more **system design responsibility**

**Engineering complexity:** Medium **Time to usable version:** Moderate

---

### AI Suggestion

This is the **most strategically important piece**, but should not be the first thing you build blindly.

Two valid approaches:

**Option A (recommended):**

- CLI → validate workflows
- Then design MCP based on real usage patterns

**Option B (if you're confident):**

- Build MCP first as the core layer
- Use CLI and IDE as thin clients over it

Key principle:

> MCP should expose _correct abstractions_, not raw APIs.

---

# Final Recommendation (No BS)

### Build order

1. **CLI (validation layer)**
2. **MCP server (capability layer)**
3. **IDE extension (experience layer)**

---

### Why this order works

- CLI → proves what actions matter
- MCP → standardizes those actions for AI agents
- IDE → optimizes developer experience around proven flows
