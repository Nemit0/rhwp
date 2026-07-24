--- Firefox Add-ons / AMO — Reviewer notes (v0.2.3) ---

# What the extension does

rhwp opens HWP/HWPX documents directly in Firefox. The parser, renderer, editor, and save/export paths run locally in WebAssembly. The extension does not upload documents, does not call analytics services, and does not collect personal data.

# Build artifacts

- Extension package: `rhwp-firefox-0.2.3.zip`
- Source package for AMO review: `rhwp-source-0.2.3-amo.zip`

AMO source uploads are limited to 200 MB. Do not upload a full-repository
archive because large fixtures in `samples/` and `pdf-large/` exceed that
limit. The review source package is a filtered Git archive containing only the
Firefox extension, rhwp-studio viewer source, Rust/WASM source, shared extension
code, fonts, and build scripts needed to reproduce the submitted extension:

```bash
git archive --format=zip --prefix=rhwp-source/ --output=rhwp-firefox/rhwp-source-0.2.3-amo.zip HEAD Cargo.toml rust-toolchain.toml rustfmt.toml Dockerfile docker-compose.yml .env.docker.example LICENSE README.md README_EN.md CHANGELOG.md CHANGELOG_EN.md THIRD_PARTY_LICENSES.md src rhwp-studio rhwp-firefox rhwp-shared web/fonts scripts npm/README.md npm/editor
```

The generated `rhwp-source-0.2.3-amo.zip` is approximately 31 MB and excludes
top-level `samples/`, `pdf-large/`, `output/`, `target/`, `node_modules/`, and
extension `dist/` output.

# Permissions justification

- activeTab: open the viewer tab from a user action.
- downloads: open HWP/HWPX downloads in the viewer.
- contextMenus: add "Open with rhwp".
- clipboardWrite: copy selected document text.
- storage: store user preferences only.
- host_permissions <all_urls>: HWP/HWPX links may appear on any domain. Detection is performed locally and is not used for tracking.

# Security notes

The extension uses bundled WebAssembly generated from Rust. No remote JavaScript is loaded. The CSP contains `wasm-unsafe-eval` only for WebAssembly execution.

`browser_specific_settings.gecko.data_collection_permissions.required` is set to `["none"]`.

# v0.2.3 highlights

Core library updated to v0.7.13. The bundled viewer includes improved HWPX rendering and HWP save compatibility: master pages, headers/footers, paragraph numbering, memo controls, TOC fields, cell margins/background image fill modes, and multiple Hancom corruption-case fixes. No new permissions and no data collection.

# Privacy policy

https://github.com/edwardkim/rhwp/blob/main/rhwp-firefox/PRIVACY.md

# Source code

https://github.com/edwardkim/rhwp
