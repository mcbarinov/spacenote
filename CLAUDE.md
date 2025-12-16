# Claude AI Assistant Guidelines

## Local Instructions

**IMPORTANT**: Always read README.md first to understand the project context and structure.

**IMPORTANT**: Always read and follow AI rules from `ai/rules/` directory.

## Project Status

**PROTOTYPE MODE** - This project is in active prototype development. Breaking changes are acceptable and expected. Do not maintain backward compatibility when making improvements.

## Critical Guidelines

1. **Always communicate in English** - By default, always respond in English. However, if the user explicitly requests communication in another language, honor that request. **All code, comments, and documentation must be in English regardless of the communication language.**

2. **Minimal documentation** - Only add comments/documentation when it simplifies understanding and isn't obvious from the code itself. Keep it strictly relevant and concise.

3. **Concise documentation** - Write documentation briefly and to the point. Every sentence must add value. Avoid verbose sections like "Benefits", "Trade-offs", "Rationale" unless absolutely necessary. Look at existing code and docs for examples of brevity.

4. **Critical thinking** - Always critically evaluate user ideas. Users can make mistakes. Think first about whether the user's idea is good before implementing.

5. **Linter rules enforcement** - Never disable linter rules with inline comments (e.g., `// eslint-disable`, `# noqa`, `# type: ignore`) without explicit permission. Always try to fix the code according to the linter's suggestions first. If you believe the linter is incorrect in a specific case, ask for permission to disable the rule and provide a clear comment explaining why the exception is necessary.

6. **Run linters after changes** - Always run the appropriate linter checks after modifying code. See `ai/rules/project.md` for commands.
