# Distro Sync Replay Prompt

Use the following prompt to recreate the fork-owned distro sync model and the protected customizations.

## Solution Context In Simple Words

Before replaying the work, keep these plain-language facts in mind:

- This fork is not just mirroring upstream. It is a distro that keeps a small set of fork-owned behaviors and publishes its own release channel.
- The app's auto-updater must download metadata and artifacts from the fork's own public release infrastructure, not from the upstream repository.
- The updater must trust the fork's own Tauri signing key. Reusing upstream URLs with a different key, or reusing upstream key material, breaks the ownership model.
- Apple Developer signing is optional for this personal distro. Tauri updater signing is not optional.

The protected code customizations are small but important:

- In src-tauri/src/proxy/copilot_optimizer.rs, some real Copilot classifier requests were incorrectly treated as cheap warmup traffic.
- The bug signal was simple: if a request carries explicit stop controls like stop or stop_sequences, it is a real control request and must not be downgraded to the warmup model path.
- The clean fix is at classification time: when explicit stop controls are present, return not warmup.
- This prevents downstream model substitution to gpt-5-mini and avoids the observed upstream HTTP 400 failure for unsupported stop.
- In src-tauri/src/proxy/forwarder.rs, the fork also keeps richer diagnostics for upstream HTTP 400 failures.
- The purpose is operational visibility: when Copilot or another upstream rejects a request, the logs should include enough request/model context to understand why the rejection happened.
- This is a distro customization because it improves diagnosability without changing the upstream product goal.

The release-channel changes are also straightforward in plain words:

- tauri.conf.json must point updater endpoints to the fork-owned release metadata location.
- The updater public key embedded there must be the public half of the fork-generated signing key.
- misc.rs should open the fork's own Releases page when the user asks to check or download updates manually.

The workflow changes exist to enforce ownership and repeatability:

- scripts/check-release-channel.sh is a guardrail that fails CI if updater URLs or other release-channel surfaces drift back to upstream-owned assets.
- ci.yml should run that guardrail on every change.
- release.yml should always require the Tauri signing key, but only run Apple signing and notarization when the Apple secrets are actually present.
- .github/workflows/sync-upstream.yml should automate upstream merges into a PR while highlighting any touched fork-owned paths for review.

In short: this replay is not just "set some URLs". It is "preserve two fork behaviors, own the updater trust chain, and automate upstream sync without losing distro control".

## Copy-Paste Prompt

Work in an isolated git worktree for the CC Switch fork. Re-implement the fork-owned distro sync and release model for a personal public GitHub repository.

Goal:
- Maintain an upstream-first distro fork of farion1231/cc-switch.
- Publish updater artifacts from the fork's own public GitHub Releases.
- Preserve the current fork-only customizations for Copilot warmup handling and richer diagnostics.
- Keep Apple Developer signing optional for personal use.
- Keep Tauri updater signing mandatory with a fork-owned key.

Assumptions:
- The canonical distro repo is a real personal public GitHub repository, not an enterprise internal/private repo.
- Standard GitHub-hosted runners are available in that public repo.
- The updater must trust only fork-owned release endpoints and the fork-owned updater public key.
- The upstream source repo remains farion1231/cc-switch.

Required implementation:
1. Create or use an isolated worktree and do not modify unrelated dirty work.
2. Treat the existing proxy customizations as protected distro patches:
   - preserve the Copilot warmup stop-controls fix in copilot_optimizer.rs
   - preserve the richer HTTP 400 diagnostics in forwarder.rs
   - keep the explanatory guide docs/guides/copilot-warmup-stop-misclassification-fix-en.md
3. Generate a fork-owned Tauri updater keypair.
   - replace the updater public key in tauri.conf.json
   - keep the private key out of git and prepare it for GitHub Actions secrets
4. Repoint all updater and manual-update surfaces to the fork's public release channel.
   - update tauri.conf.json updater endpoints
   - update misc.rs so manual update opens the fork release page
5. Protect fork-owned surfaces.
   - update .github/CODEOWNERS for the fork owner
   - include workflow/config/proxy protection paths
6. Add a release-channel ownership guard.
   - add scripts/check-release-channel.sh
   - wire it into ci.yml
7. Patch release.yml so:
   - Tauri signing is always required
   - the signing key is prepared from secrets into a temp file path
   - Apple signing/notarization steps run only when all Apple secrets are present
   - macOS releases can still publish unsigned updater-compatible artifacts when Apple secrets are absent
8. Add .github/workflows/sync-upstream.yml so the fork can:
   - fetch and merge upstream into an automation branch
   - run the release-channel ownership check
   - report protected-path touches
   - create or update a PR
   - guard on the final fork repo identity, not the old repo name
9. Keep the changes in separated commits where practical:
   - protected distro customization commit
   - updater/release-channel retargeting commit
   - workflow/signing automation commit
10. Do not add speculative refactors or unrelated cleanup.

Final repo-specific values to set before editing:
- TARGET_REPO_OWNER=JuntaoWu
- TARGET_REPO_NAME=cc-switch
- TARGET_RELEASES_URL=https://github.com/JuntaoWu/cc-switch/releases
- TARGET_LATEST_JSON_URL=https://github.com/JuntaoWu/cc-switch/releases/latest/download/latest.json

Minimum verification required:
- cargo check
- targeted Rust tests covering warmup classification with stop or stop_sequences
- bash scripts/check-release-channel.sh
- prettier check for edited workflow YAML files

Deliverables:
- code changes applied in the isolated worktree
- concise summary of what changed
- exact secrets required for the public repo
- verification results with PASS/FAIL/NOT_RUN
- any remaining manual steps for release bootstrap

Important constraints:
- Do not point updater traffic at upstream-owned assets.
- Do not skip Tauri updater signing.
- Do not require Apple Developer signing for personal use.
- Do not use self-hosted-only assumptions in workflows unless the public repo actually needs them.

## Required Secrets For The Public Repo

- TAURI_SIGNING_PRIVATE_KEY
- TAURI_SIGNING_PRIVATE_KEY_PASSWORD if the key is password protected
- APPLE_CERTIFICATE only if macOS signing is desired
- APPLE_CERTIFICATE_PASSWORD only if macOS signing is desired
- APPLE_ID only if notarization is desired
- APPLE_PASSWORD only if notarization is desired
- APPLE_TEAM_ID only if notarization is desired
- KEYCHAIN_PASSWORD only if macOS signing is desired
