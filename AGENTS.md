<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# RailMind frontend conventions

When writing or editing any frontend code (`.ts` / `.tsx`) in this repo, always follow the
conventions in `.claude/skills/railmind-frontend` (folder/file naming, components, TanStack
Query hooks, the API layer, types, design tokens, and Zustand state). Write compliant code
from the start. A `PostToolUse` hook (`scripts/check_naming_conventions.py`) hard-blocks
file-naming violations as a deterministic backstop.
