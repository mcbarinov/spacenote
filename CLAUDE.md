# Claude AI Assistant Guidelines

## Local Instructions

**IMPORTANT**: Always read README.md first to understand the project context and structure.

**IMPORTANT**: Always read and follow local instructions from `.claude/local-rules.md` if this file exists.

## Project Status

**PROTOTYPE MODE** - This project is in active prototype development. Breaking changes are acceptable and expected. Do not maintain backward compatibility when making improvements.

## Critical Guidelines

1. **Always communicate in English** - By default, always respond in English. However, if the user explicitly requests communication in another language, honor that request. **All code, comments, and documentation must be in English regardless of the communication language.**

2. **Minimal documentation** - Only add comments/documentation when it simplifies understanding and isn't obvious from the code itself. Keep it strictly relevant and concise.

3. **Concise documentation** - Write documentation briefly and to the point. Every sentence must add value. Avoid verbose sections like "Benefits", "Trade-offs", "Rationale" unless absolutely necessary. Look at existing code and docs for examples of brevity.

4. **Critical thinking** - Always critically evaluate user ideas. Users can make mistakes. Think first about whether the user's idea is good before implementing.

5. **Linter rules enforcement** - Never disable linter rules with inline comments (e.g., `// eslint-disable`, `# noqa`, `# type: ignore`) without explicit permission. Always try to fix the code according to the linter's suggestions first. If you believe the linter is incorrect in a specific case, ask for permission to disable the rule and provide a clear comment explaining why the exception is necessary.

6. **Run linters after changes** - Always run the appropriate linter checks after modifying code to ensure code quality standards are met. For backend changes, run `just backend-lint`. For other parts of the project, use the corresponding lint commands from the justfile.

## Agent Development

Development servers have separate ports for human and agent use:

| App    | Human Port | Agent Port | Human Command      | Agent Command          |
|--------|------------|------------|--------------------|------------------------|
| web    | 3000       | 3001       | just web-dev       | just agent-web-dev     |
| admin  | 3200       | 3201       | just admin-dev     | just agent-admin-dev   |
| api    | 3100       | 3101       | just backend-dev   | just agent-backend-dev |

**Rules for agents:**
- Never start/stop/restart servers on human ports (3000, 3100, 3200)
- Always use `agent-*` commands when you need to run dev servers
- Human servers are managed by the user and should remain untouched
