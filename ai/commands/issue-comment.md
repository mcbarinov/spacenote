# /issue-comment

Add a comment to a GitHub issue documenting a decision or learning.

## Usage

```
/issue-comment #123      # To specific issue
/issue-comment           # Ask for issue number
```

## Description

Logs important decisions, learnings, or changes to an issue as a comment. Agent formulates the comment based on recent conversation context.

Comments will be read and considered when:
- Working on the issue (`work on #123`)
- Refining the issue (`/issue #123`)

Use cases:
- Requirements changed — document why
- Tried approach X, didn't work — document why
- Made architectural decision — document rationale

## Actions

1. Determine issue number (from argument or ask)
2. Analyze recent conversation to understand what to log
3. Formulate concise comment
4. Show to user for approval
5. After approval — `gh issue comment #123 --body "..."`

## Flow

```
User: "log the decision about avatar storage"

Agent:
  Adding to #123:

  > Decided to store avatars in S3 instead of Mongo.
  > Reason: files up to 5MB, inefficient in database.

  Add?

User: "yes"

Agent: [gh issue comment 123 --body "..."]
  Done. Comment added to #123.
```

## Comment Format

Keep it brief:

```
Decided to store avatars in S3 instead of Mongo. Reason: files up to 5MB, inefficient in database.
```

No excessive structure. Just the decision and reasoning.
