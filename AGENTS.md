# AGENTS.md

## What this repo is

`web-mecanico` has **no application code yet**. The root contains agent infrastructure and a learning workspace:

- `.agents/skills/` — 27 agent skills (**local only, git-ignored**)
- `skills-lock.json` — pins every installed skill to `mattpocock/skills` by SHA-256 `computedHash`
- `.agents/specs/` — specs and tickets (project convention, see below)
- `docs/brand/` — brand tokens and guidelines
- `lessons/`, `reference/`, `assets/` — the teaching workspace (**local only, git-ignored**)
- `examples/workshop-tdd/` — dependency-free sandbox for the domain's first tests (**local only, git-ignored**)

`MISSION.md`, `NOTES.md` and `RESOURCES.md` are also local-only and ignored. They still exist on disk; they just do not get published.

There is no root `package.json`, build, lint, or CI. The only package manifest is inside `examples/workshop-tdd/` (Node 24 + `node:test`, zero dependencies). Do not assume commands or a stack — verify before running anything. When the app is scaffolded, record its real commands here.

## Commands

```bash
cd examples/workshop-tdd && npm test   # domain tests of the teaching sandbox
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

The repo now has a local git repository (`main`), but no remote yet. The setup skill's GitHub/GitLab tracker option needs a configured remote; until then, the local-markdown tracker works and stores issues under `.scratch/<feature>/issues/`.
