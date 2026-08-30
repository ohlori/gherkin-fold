# Gherkin Fold

<p align="center">
  <img src="images/logo.png" alt="Gherkin Fold logo" width="128">
</p>

Gherkin Fold keeps large `.feature` files easy to scan by collapsing every
`Scenario`, `Scenario Outline`, and `Scenario Template` by default. `Feature`,
`Rule`, and `Background` sections stay open so the file structure remains
visible.

Automatic folding runs once per open document. After that, scenarios you
expand stay expanded while you edit or switch tabs. Closing and reopening the
file starts a new document session and reapplies the default.

## Features

- Collapses all foldable scenarios when a `.feature` file first becomes active.
- Preserves manual expand/collapse changes for the rest of that document session.
- Adds **Collapse All Scenarios** and **Expand All Scenarios** toolbar buttons.
- Provides the same actions through the Command Palette.
- Leaves `Feature`, `Rule`, and `Background` folds unchanged.

## Installation

To install a packaged build in VS Code or Cursor:

1. Run **Extensions: Install from VSIX...** from the Command Palette.
2. Select `gherkin-fold-<version>.vsix`.
3. Reload the editor if prompted, then open a `.feature` file.

To create the VSIX yourself, see [Build a VSIX](#build-a-vsix).

## Usage

Open a `.feature` file and its scenarios collapse automatically. Use either of
these commands whenever you want to change all scenario folds explicitly:

- **Gherkin Fold: Collapse All Scenarios**
- **Gherkin Fold: Expand All Scenarios**

Both commands appear in the editor title bar while a `.feature` file is active.
Cursor pins them by default when `cursor.general.pinnedTitleActions` has not
already been customized.

If the buttons are hidden, open the editor title `...` menu, select
**Configure Icon Visibility**, and enable **Collapse All Scenarios** and
**Expand All Scenarios**. If you manage pinned title actions in `settings.json`,
append these command IDs to your existing array:

```json
"cursor.general.pinnedTitleActions": [
  "gherkinFold.foldScenarios",
  "gherkinFold.expandScenarios"
]
```

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `gherkinFold.collapseOnOpen` | `true` | Automatically collapses scenarios once when a `.feature` document is opened. |

The setting can be configured globally, per workspace, or specifically for the
Gherkin language.

## Supported Gherkin

The current release recognizes the English `Scenario`, `Scenario Outline`, and
`Scenario Template` keywords. Other Gherkin dialects are left unchanged.

## Development

```sh
npm ci
npm run compile
npm test
```

Press `F5` in VS Code or Cursor to launch an Extension Development Host, then
open a `.feature` file to exercise the extension. Run `npm run watch` while
developing to compile TypeScript after each change.

## Build a VSIX

```sh
npm ci
npm test
npm run package
```

The package script compiles the extension and creates
`gherkin-fold-<version>.vsix` in the project root.

## License

[MIT](LICENSE)
