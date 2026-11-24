# Change Log

All notable changes to "Phoca Search Presets" are documented in this file.

## [1.0.0] - 2026-11-24

- Renamed from "Search Include Presets" to "Phoca Search Presets" (`phoca.search-presets`).
- New second button for **files to exclude** next to the include button, with dedicated funnel icons (green plus / red minus).
- No built-in presets, both lists start empty.
- Separate settings `searchPresets.include` and `searchPresets.exclude`, replacing `searchIncludePresets.patterns`.
- Picker redesign: grouped lists, type-ahead for ad-hoc patterns, save, edit and delete buttons on items, clear action.
- New command `Search Presets: Clear Files to Include and Exclude`.
- New setting `searchPresets.triggerSearch`.
- Presets are written to workspace settings when the workspace overrides them.
- Lazy activation instead of `onStartupFinished`.

### Migrating from Search Include Presets

Uninstall the old extension and copy the entries from `searchIncludePresets.patterns` to `searchPresets.include`. Entries that started with `!` belong in `searchPresets.exclude`, without the `!`.
