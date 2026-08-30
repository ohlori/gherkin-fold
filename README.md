# Gherkin Fold

<p align="center">
  <img src="https://raw.githubusercontent.com/ohlori/gherkin-fold/main/images/logo.png" alt="Gherkin Fold logo" width="128">
</p>

View all scenarios at a glance. Gherkin Fold adds scenario folding controls to
`.feature` files while keeping the feature structure visible.

## Install

1. Open **Extensions** in Cursor (`Cmd+Shift+X` on macOS or `Ctrl+Shift+X` on
   Windows and Linux).
2. Search for **Gherkin Fold**.
3. Select the extension published by **ohlori**.
4. Select **Install**, then open a `.feature` file.

## Optional automatic folding

Automatic folding is off by default. To enable it, open Cursor Settings, search
for `gherkinFold.collapseOnOpen`, and turn it on.

When enabled, Gherkin Fold collapses every foldable:

- `Scenario`
- `Scenario Outline`
- `Scenario Template`

`Feature`, `Rule`, and `Background` sections remain open, giving you an overview
of the file without all the scenario steps taking up the screen.

Automatic folding happens only once during the lifetime of an open document, so
anything you expand stays expanded while you edit or switch tabs. Closing and
reopening the file starts a new document session.

## Expand or collapse all scenarios

Use the buttons in the editor title bar to change every scenario at once:

- **Gherkin Fold: Collapse All Scenarios**
- **Gherkin Fold: Expand All Scenarios**

The same actions are available from the Command Palette (`Cmd+Shift+P` on macOS
or `Ctrl+Shift+P` on Windows and Linux). These commands affect scenarios only;
they do not change `Feature`, `Rule`, or `Background` folds.

### If the toolbar buttons are hidden

The buttons appear only while a `.feature` file is active. If they are still
hidden:

1. Open the `...` menu in the editor title bar.
2. Select **Configure Icon Visibility**.
3. Enable **Collapse All Scenarios** and **Expand All Scenarios**.

If you manage Cursor's pinned title actions directly in `settings.json`, add
both command IDs to your existing `cursor.general.pinnedTitleActions` array:

```json
"cursor.general.pinnedTitleActions": [
  "gherkinFold.foldScenarios",
  "gherkinFold.expandScenarios"
]
```

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `gherkinFold.collapseOnOpen` | `false` | When enabled, collapses scenarios the first time an open `.feature` document becomes active. |

The toolbar buttons and Command Palette actions remain available whether this
setting is enabled or disabled.

## Supported Gherkin

Gherkin Fold currently recognizes the English `Scenario`, `Scenario Outline`,
and `Scenario Template` keywords. Other Gherkin dialects are left unchanged.

## Troubleshooting

- **A scenario does not collapse:** It must contain enough content for Cursor to
  create a folding range.
- **The file did not collapse again after switching tabs:** This is intentional.
  Automatic folding runs once per open document so your manual changes are
  preserved. Use **Collapse All Scenarios** when you want to fold everything
  again.
- **Nothing collapses automatically:** Confirm that
  `gherkinFold.collapseOnOpen` is enabled and that the active file ends in
  `.feature`.

Found a problem? [Open an issue](https://github.com/ohlori/gherkin-fold/issues).

## License

[MIT](LICENSE)
