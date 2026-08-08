# Fork Customization Registry

This registry tracks the fork-owned customizations that must be preserved during upstream sync and release replay work.

## Branching and release policy
- Preferred release branch: release/fork
- Rationale: the fork should keep a dedicated long-lived branch for release work instead of relying on ad-hoc date-based branches.
- Sync workflow expectation: upstream sync PRs should target release/fork, not main.
- Release readiness checklist:
  - confirm the updater points at the fork-owned release endpoints
  - confirm the Tauri signing secret is configured
  - confirm the release guard script passes
  - confirm protected fork-owned paths are reviewed before merging

## Protected paths for upstream sync review
- src-tauri/src/proxy/copilot_optimizer.rs
- src-tauri/src/proxy/forwarder.rs
- src-tauri/tauri.conf.json
- src-tauri/src/commands/misc.rs
- .github/workflows/release.yml
- .github/workflows/sync-upstream.yml
- scripts/check-release-channel.sh
- .github/CODEOWNERS
- docs/prompts/customization-registry.md
- docs/prompts/distro-sync-replay-prompt.md

## 1. Copilot optimizer misclassification fix
- Scope: Preserve the Claude Code auto-mode classifier compatibility fix in the proxy warmup classifier.
- Primary files:
  - src-tauri/src/proxy/copilot_optimizer.rs
  - src-tauri/src/proxy/forwarder.rs
- Reason: Claude Code auto-mode classifier requests must not be misclassified as warmup traffic and downgraded to the warmup model path.
- Related issue: Claude Code Auto Mode Classifier Compatibility Issue #1678
- Status: protected fork customization

## 2. Fork-owned updater and release channel
- Scope: Preserve the fork-owned updater trust chain and release channel wiring.
- Primary files:
  - src-tauri/tauri.conf.json
  - src-tauri/src/commands/misc.rs
  - .github/workflows/release.yml
  - scripts/check-release-channel.sh
- Reason: the distro must publish and update from the fork's own public release infrastructure and must not silently fall back to upstream-owned assets.
- Status: protected fork release model

## 3. Sync automation and ownership guardrails
- Scope: Preserve the automated upstream sync workflow and the release-channel ownership checks.
- Primary files:
  - .github/workflows/sync-upstream.yml
  - .github/CODEOWNERS
- Reason: upstream syncs should remain reviewable and should not bypass the fork's owned release channel protections.
- Status: protected fork maintenance workflow
