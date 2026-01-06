# Development Workflow

## Issue-Driven Development

1. **Create issue** — `/issue` to brainstorm and document the task
2. **Refine issue** — `/issue #123` to continue discussion, capture decisions
3. **One issue = one branch = one PR**
4. **Git worktree** for parallel work on multiple issues
5. **Multiple AI agents** can work on same issue/branch/worktree simultaneously
6. **Parallel issues** — use separate worktrees for each

## Branch & Worktree Structure

```
spacenote/                    # main worktree (main branch)
spacenote-feat-avatars/       # worktree for issue #42
spacenote-fix-login/          # worktree for issue #51
```

## Branch Naming

Format: `{type}/{short-name}`

Examples:
- `feat/user-avatars`
- `fix/login-redirect`
- `refactor/note-service`

## Commands

| Phase | Command |
|-------|---------|
| Create issue | `/issue` |
| Refine issue | `/issue #123` |
| Log decision | `/issue-comment #123` |
| Start work | "work on issue #123" |
| Review | `/review-pr` |
