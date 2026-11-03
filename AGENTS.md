# AGENTS.md

## What this repo is

`web-mecanico` is a **Next.js 16 app** (App Router, TypeScript, Turbopack) for a mechanic shop, at MVP scaffold stage.

- `src/app/` — UI and routes (App Router), `lang="es-MX"`
- `src/workshop/` — the pure domain module: types, ports (`Store`, `Clock`), errors, operations. Framework-free, tested with Vitest.
- `src/store/` — the in-memory adapter of the `Store` port (Redis comes later)
- `.agents/specs/` — specs and tickets (project convention, see below)
- `docs/brand/` — brand tokens; `src/app/layout.tsx` imports `docs/brand/tokens.css` directly
- `skills-lock.json` — pins every installed skill to `mattpocock/skills` by SHA-256 `computedHash`

Local-only and git-ignored: `.agents/skills/`, `lessons/`, `reference/`, `assets/`, `examples/workshop-tdd/`, `MISSION.md`, `NOTES.md`, `RESOURCES.md`. They exist on disk but are not published.

`examples/workshop-tdd/` is a dependency-free Node 24 + `node:test` sandbox. The root `tsconfig.json` excludes `examples`, and `vitest.config.mts` only includes `src/**/*.test.ts`, so the two test worlds do not collide.

There is no ESLint config or CI yet. Do not assume commands — verify before running anything.

## Commands

```bash
npm install        # once
npm run dev        # local dev server
npm run build      # production build, type-checks the app
npm test           # Vitest over src/**/*.test.ts
cd examples/workshop-tdd && npm test   # sandbox tests (node:test, local only)
```


## Skills

- A skill is the whole folder `.agents/skills/<name>/`: `SKILL.md` plus its `agents/` and reference `.md` files. Read the linked reference file when a skill points at one.
- **Never edit `.agents/skills/**` or `skills-lock.json` by hand.** The lock hashes describe upstream files; local edits are lost on the next install/update and make drift undetectable. Skill fixes belong upstream in `mattpocock/skills`.
- 16 of the 27 skills declare `disable-model-invocation: true` — including `ask-matt`, `to-spec`, `to-tickets`, `implement`, `implement-spec`, `triage`, `wayfinder`, and `setup-matt-pocock-skills`. Treat those as user-invoked entrypoints, not helpers to auto-run mid-task. Check frontmatter before relying on a skill.
- `ask-matt` is the router over all of them; consult it rather than guessing which flow applies.
- Local skill source lives in `skills/brand-design/` (not installed, not in `skills-lock.json`). New skills are authored there, never inside `.agents/skills/`.

## Specs and tickets

Project convention (overrides the skills' `.scratch/` default): specs live in `.agents/specs/<feature-slug>/spec.md`, and tickets for a feature go in `.agents/specs/<feature-slug>/issues/NN-<slug>.md`. Each spec carries a `Status:` line near the top. The first one is `.agents/specs/taller-don-ramiro-mvp/spec.md`.

## Setup has not been run

`setup-matt-pocock-skills` has never been executed: there is no `docs/agents/` (issue tracker, triage labels, domain layout), no `GLOSSARY.md`, and no `docs/adr/`. The engineering flows (`grill-with-docs`, `to-spec`, `to-tickets`, `triage`, `wayfinder`) expect those files. Run the setup skill before creating them ad hoc.

The repo has a local git repository (`main`) and a public remote at `https://github.com/samir1604/web-mecanico`. The setup skill's GitHub/GitLab tracker option needs the `gh` CLI authenticated (`gh` lives at `%LOCALAPPDATA%\gh-cli\bin\gh.exe`, not always on PATH); until it is used, the local-markdown tracker works and stores issues under `.scratch/<feature>/issues/`.
