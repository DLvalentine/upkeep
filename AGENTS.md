# Upkeep Development Instructions

## Project
Upkeep is an AI-enabled Magic: The Gathering deck-building
platform. Dex is its friendly AI deck-building assistant.

## Current Objective
Build a polished, reliable product demo. Prioritize
working functionality over speculative architecture.

## Development Rules
- Inspect existing code before making changes.
- Follow established component and service patterns.
- Avoid unnecessary dependencies.
- Reuse existing utilities and shared components.
- Preserve existing styling and CSS variables.
- Handle loading, empty, and error states.
- Do not introduce unrelated refactoring.
- Verify first: never just start making changes without developer consent and approval.
- Do not verify locally with linting or testing for each change. That will be done before commit.

## Working Agreement
- Explain the root cause before fixing non-trivial bugs.
- For larger features, propose an implementation plan first.
- Implement complete features, not placeholders.
- Run relevant tests and builds after changes.
- Review your own changes for regressions.
- Summarize modified files and remaining issues.

## Constraints
- Do not expose API keys or secrets.
- Do not modify environment files.
- Do not overwrite user data.
- Ask before introducing new dependencies.
- Keep changes focused on the demo.
- Do NOT ever use git or deployment commands
