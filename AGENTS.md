<!-- CODEGRAPH_START -->
## CodeGraph

This project has a CodeGraph index (`.codegraph/`) and MCP tools for structural code questions.

### Project-specific instructions

If `codegraph-instructions.md` exists at the project root, **read it first** on any code-intelligence task and follow it for the rest of the session. It overrides defaults for this repo.

### Prefer CodeGraph before Grep/Read

For "how does X work", "what calls Y", call paths, blast radius, or surveying an area, use:

- MCP: `codegraph_explore` (primary), then `codegraph_node` / `codegraph_search` if needed
- CLI: `codegraph explore`, `codegraph query`, `codegraph node`, `codegraph callers`, `codegraph callees`, `codegraph impact`

Treat returned source as already read. Do not rebuild the same graph with grep.

### Skills

Project skill: `.agents/skills/codegraph-cli/` — load it for CodeGraph CLI workflows.

### Hooks

Project hooks live under `.codex/hooks.json` and enforce CodeGraph-first policy when the index exists.
<!-- CODEGRAPH_END -->
