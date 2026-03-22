# Problem Statement

Heizen currently has a centralized internal dashboard that stores project context across sprint boards, backlog, bug
tracking, resources, meetings, wikis, work logs, and AI-assisted sprint planning through Helix. This creates a good
source of truth for project management and knowledge capture.

However, the execution context is fragmented. The dashboard contains planning context, but the IDE contains coding
context. As a result, engineering work still requires repeated manual transfer of information between systems. This
breaks the flow between planning, implementation, and reporting.

The core problem is not that the company lacks tools. The problem is that the tools are not connected tightly enough to
support an end-to-end engineering workflow. Planning happens in one place, coding in another, and updates in another.
That separation creates avoidable manual work, slower execution, inconsistent estimates, and reduced accuracy in task
tracking.

# What is working well now

The current setup already has strong foundations:

- A single internal dashboard for projects, sprints, bugs, meetings, resources, and work logs.
- Meeting transcription, speaker identification, and summarization already exist.
- Helix can use internal context such as meeting summaries, wikis, and project data to support sprint planning.
- Sprint tasks have structured metadata like status, priority, and estimate.
- Work logs create visibility into who did what, and how much time was spent.

This means Heizen already has the raw data and workflow building blocks needed for a more intelligent system.

# Pain points in the current flow

The current workflow still depends heavily on manual coordination:

- The dashboard context is not available inside the IDE, so developers must copy or restate task details before coding.
  AI agents like Cursor or Claude Code do not automatically know the project’s current sprint context, task history, or
  meeting decisions.
- Helix can plan based on meetings and docs, but it does not have direct code awareness, so planning quality is limited
  when existing codebase state matters. Sprint planning is therefore only partially informed: it knows the business
  intent, but not the actual code reality.
- After work is done, the developer still has to manually mark tasks complete, update estimates, and submit work logs.
  This creates repetitive admin work that does not add engineering value.

# Ideal flow

The dashboard exposes structured project context (tasks, acceptance criteria, meetings, docs, sprint state) to the agent
(Claude Code/Cursor).

- The agent combines this with real-time codebase context from the IDE. Sprint planning becomes code-aware, allowing
  tasks to be generated or refined based on actual implementation state.
- Tasks and subtasks are more accurate because they reflect both product intent and code reality.
- During execution, the agent can directly reference task context without requiring the developer to restate it.
- As work progresses, the agent can infer task state from code changes (commits, diffs, file edits).
- Upon completion, the agent can automatically update task status, adjust estimates, and generate or submit work logs.
- The dashboard remains the system of record, while the IDE becomes the system of execution.
- Planning, execution, and reporting form a continuous, synchronized loop instead of disconnected steps.

# Why this increases productivity

This would increase productivity in a very direct way:

- Less context switching between dashboard, chat, IDE, and work log.
- Less repetition of the same task details across tools.
- Better sprint planning because AI can reason over both documentation, meeting summaries and actual code.
- Less admin overhead after coding.
- More reliable work logs and task status updates.
- More time spent on actual engineering instead of project bookkeeping.

The real productivity gain is not just “AI does more.” It is that the workflow becomes continuous, context-aware, and
self-updating.
