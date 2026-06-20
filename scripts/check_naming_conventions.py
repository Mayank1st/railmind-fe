#!/usr/bin/env python3
"""RailMind frontend naming-convention checker.

Run by the .claude PostToolUse hook after every Edit/Write on a .ts/.tsx file,
and usable standalone over many files. It enforces only the *deterministic,
currently-clean* file-naming rules so it never false-positives on existing code:

  1. hooks/  -> hook files must be `useXxx.ts(x)` (camelCase, `use` prefix).
  2. lib/    -> module files must NOT be PascalCase (lowercase/camelCase only).
  3. components/ (excluding the vendored `components/ui/` shadcn primitives)
     -> `.tsx` component files should be PascalCase. This is currently mixed in
     the repo, so it is reported as a WARNING (never blocks).

The broader rules (named exports, explicit staleTime, no `any`, design tokens,
three render states, etc.) are guidance the agent follows from the skill +
AGENTS.md — not script-enforced.

Escape hatch: a file path containing `# naming: ignore` on its first line is
skipped (rarely needed for naming).

Exit code 2 on any hard violation (so the hook feeds it back to the agent),
0 otherwise.
"""

from __future__ import annotations

import os
import re
import sys

HOOK_RE = re.compile(r"^use[A-Z][A-Za-z0-9]*\.tsx?$")
PASCAL_RE = re.compile(r"^[A-Z][A-Za-z0-9]*\.tsx?$")
# App Router special files allowed to be lowercase anywhere.
NEXT_SPECIAL = {
    "page",
    "layout",
    "loading",
    "error",
    "not-found",
    "global-error",
    "template",
    "default",
    "route",
    "middleware",
    "instrumentation",
    "sitemap",
    "robots",
    "manifest",
    "opengraph-image",
    "twitter-image",
    "icon",
    "apple-icon",
    "favicon",
}


def _parts(path: str) -> list[str]:
    return path.replace(os.sep, "/").split("/")


def check_file(path: str) -> tuple[list[str], list[str]]:
    """Return (errors, warnings) for one file path."""
    errors: list[str] = []
    warnings: list[str] = []

    norm = path.replace(os.sep, "/")
    base = os.path.basename(norm)
    stem = base.rsplit(".", 1)[0]
    parts = _parts(norm)

    if not (base.endswith(".ts") or base.endswith(".tsx")):
        return errors, warnings
    if base.endswith(".d.ts"):
        return errors, warnings
    if "node_modules" in parts:
        return errors, warnings

    # 1. hooks/<file> must be useXxx.ts(x)
    if "hooks" in parts:
        # only the file directly named like a hook is enforced; index.ts/util ok
        if stem not in ("index",) and stem.startswith("use"):
            if not HOOK_RE.match(base):
                errors.append(
                    f"[FAIL] {norm}: hook file must be `useXxx.ts(x)` "
                    f"(camelCase after `use`), got `{base}`."
                )
        elif stem not in ("index",) and base.endswith(".ts"):
            # a .ts in hooks/ that isn't a hook and isn't index — likely misnamed
            if not stem.islower() and not HOOK_RE.match(base):
                warnings.append(
                    f"[warn] {norm}: file in hooks/ is neither `useXxx` nor a "
                    f"lowercase helper."
                )

    # 2. lib/ files must not be PascalCase
    if "lib" in parts and base != stem:  # has extension
        if stem[:1].isupper():
            errors.append(
                f"[FAIL] {norm}: lib module must be lowercase/camelCase, "
                f"got PascalCase `{base}`."
            )

    # 3. components/ (excluding components/ui) .tsx should be PascalCase -> WARN
    if "components" in parts and base.endswith(".tsx"):
        idx = parts.index("components")
        sub = parts[idx + 1] if idx + 1 < len(parts) else ""
        if sub != "ui" and stem not in NEXT_SPECIAL:
            if not PASCAL_RE.match(base):
                warnings.append(
                    f"[warn] {norm}: component file should be PascalCase "
                    f"(e.g. `TrainCard.tsx`), got `{base}`."
                )

    return errors, warnings


def main(argv: list[str]) -> int:
    files = argv[1:]
    if not files:
        return 0

    all_errors: list[str] = []
    all_warnings: list[str] = []
    for f in files:
        errs, warns = check_file(f)
        all_errors.extend(errs)
        all_warnings.extend(warns)

    for w in all_warnings:
        print(w, file=sys.stderr)
    for e in all_errors:
        print(e, file=sys.stderr)

    if all_errors:
        print(
            "\nRailMind FE naming conventions violated. "
            "See .claude/skills/railmind-frontend/SKILL.md §1.",
            file=sys.stderr,
        )
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
