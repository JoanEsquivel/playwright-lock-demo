# Cursor standards kit

This repo holds a copy of the Playwright / Cursor agent standards from [`feat/standards-kit`](https://github.com/JoanEsquivel/playwright-for-ui-interview-baseline/tree/feat/standards-kit) in **`cursor-standards/`**.

Nothing was installed. There is no `node_modules`, no lockfile, and no Playwright app checkout. Use the kit as-is (rules, skills, `AGENTS.md`, Cursor/Claude/Copilot agent files) when starting a new project.

## Layout

| Path | What it is |
|---|---|
| `cursor-standards/.cursor/rules/` | Cursor rules (`.mdc`) |
| `cursor-standards/.claude/` | Skills, rules, agent, settings, memory |
| `cursor-standards/AGENTS.md` | Agent contract |
| `cursor-standards/CLAUDE.md` | Claude Code pointer |
| `cursor-standards/.github/` | Copilot agent/instructions + CI templates |
| `cursor-standards/docs/` | Agent guide, decisions, kit design notes |
| `cursor-standards/scripts/` | `sync-agent-config.mjs` and lint hook |

To use these with Cursor in another repo, copy the contents of `cursor-standards/` to that project root (especially `.cursor/`, `.claude/`, and `AGENTS.md`).
