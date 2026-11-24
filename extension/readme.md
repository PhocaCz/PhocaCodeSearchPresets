# Phoca Search Presets

Two buttons in the Search view title bar give you one-click access to saved glob patterns for the **files to include** and **files to exclude** fields.

| Button | Field | Typical use |
| --- | --- | --- |
| Funnel with a green **+** | files to include | `**/*.php`, `src/**/*.{js,ts}` |
| Funnel with a red **−** | files to exclude | `**/node_modules/**, **/vendor/**` |

Both filters are independent. Picking an include preset leaves the exclude field and the search term untouched, and the other way round, so you can combine them freely.

## Features

- Separate preset lists for include and exclude
- Type any pattern directly into the picker and apply it without saving
- Save a typed pattern as a preset with one click
- Edit and delete presets right in the picker (pencil and trash buttons)
- Clear a single filter, or both at once (`Search Presets: Clear Files to Include and Exclude`)
- Runs the search straight away, can be turned off in settings

## Usage

1. Open the Search view (`Ctrl+Shift+F` / `Cmd+Shift+F`).
2. Click the **+** funnel (include) or the **−** funnel (exclude) in the view title bar.
3. Pick a preset, or type a pattern and press Enter.

The commands are also available from the Command Palette under **Search Presets**.

## Settings

No presets are shipped. Both lists start empty and you build your own.

```json
{
  "searchPresets.include": [
    { "label": "PHP files", "pattern": "**/*.php" }
  ],
  "searchPresets.exclude": [
    { "label": "Dependencies", "pattern": "**/node_modules/**, **/vendor/**" }
  ],
  "searchPresets.triggerSearch": true
}
```

| Setting | Default | Description |
| --- | --- | --- |
| `searchPresets.include` | empty | Presets for **files to include**. Each item has `label` (optional) and `pattern`. |
| `searchPresets.exclude` | empty | Presets for **files to exclude**. Same format. |
| `searchPresets.triggerSearch` | `true` | Start the search right after a preset is applied. |

Several patterns in one preset are separated by a comma, exactly as in the Search view. Note that the *files to exclude* field takes plain globs, without a leading `!`.

New presets are saved to your user settings, or to the workspace settings if the workspace already overrides the list.

## Compatibility

Requires VS Code 1.80 or newer. The extension uses only the standard extension API, so it should also work in VS Code-based editors such as VSCodium.

## Links

- Source and issues: <https://github.com/PhocaCz/PhocaCodeSearchPresets>
- Phoca: <https://www.phoca.cz>

## License

Copyright (C) 2026 Jan Pavelka - Phoca

Licensed under the GNU General Public License version 2 only (GPL-2.0-only). See [LICENSE.txt](https://github.com/PhocaCz/PhocaCodeSearchPresets/blob/HEAD/LICENSE.txt).

Source: <https://github.com/PhocaCz/PhocaCodeSearchPresets>
