# Development workflow (Batch 2 / Document 12)

## Branch model

| Branch | Use | Protection |
| --- | --- | --- |
| `main` | Production-ready source | No direct pushes; required CI checks + review |
| `develop` | Optional shared integration | Only if parallel work justifies it |
| `feature/*` | Scoped product work | Short-lived; linked issue |
| `fix/*` | Non-urgent defect correction | Test coverage required |
| `hotfix/*` | Urgent production repair | Expedited review; post-incident follow-up |
| `content/*` | Content schema/import changes | Editorial + technical review |
| `wave-*` | Implementation-wave work | Do not merge to `main` until the wave’s final prompt |

Wave 1 uses `wave-1-foundation` until the final Wave 1 prompt merges to `main`.

## Commit message convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(optional-scope): <summary>

[optional body]
```

Allowed types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `build`, `perf`, `style`, `revert`.

Examples:

- `ci: add GitHub Actions workflow for Doc 12 gates`
- `feat(academy): import lessons 91-100`
- `fix(rls): deny blocked users on public profiles`

CI enforces this via commitlint on pull requests.

## CI gates (required on `main`)

- Lint and typecheck
- Install and build
- Security scan (gitleaks)
- Migration check and RLS tests (ephemeral local Supabase on the runner)
- Unit and integration tests (runs when a suite exists; otherwise reports an explicit SKIPPED notice)
- Content validation (same honest-skip rule until tooling lands)
- Preview deployment (runs only when Vercel secrets are configured)

## Environment separation

- CI migrations/RLS use `supabase start` on GitHub-hosted runners (`127.0.0.1`).
- Staging and production Supabase credentials must never be wired into CI.
- Secrets never enter the repository.

## Pull requests

Use the repository PR template. Every PR must state wave/prompt, self-verification results, and confirm no silent placeholders.
