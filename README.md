# Cursor standards kit

This repo holds a copy of the Playwright / Cursor agent standards from [`feat/standards-kit`](https://github.com/JoanEsquivel/playwright-for-ui-interview-baseline/tree/feat/standards-kit) in **`cursor-standards/`**.

`@playwright/cli` (and `@playwright/test`) are installed at the repo root so you can run `pnpm exec playwright-cli`. The SauceDemo Playwright app was not copied.

```bash
corepack enable
corepack pnpm install
corepack pnpm exec playwright install chromium --with-deps
pnpm exec playwright-cli open https://example.com
```

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
