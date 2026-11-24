/**
 * Phoca Search Presets
 * Quick presets for the "files to include" and "files to exclude" fields
 * of the VS Code Search view.
 *
 * Copyright (C) 2026 Jan Pavelka - Phoca
 * https://github.com/PhocaCz/PhocaCodeSearchPresets
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2 only,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * SPDX-License-Identifier: GPL-2.0-only
 */
const vscode = require('vscode');

const CONFIG_SECTION = 'searchPresets';

/**
 * Differences between the two filters. Everything else is shared.
 */
const KINDS = {
  include: {
    setting: 'include',
    argKey: 'filesToInclude',
    noun: 'Files to Include',
    sign: '+',
    example: '**/*.php, src/**/*.js',
    useDescription: 'Apply as "files to include"'
  },
  exclude: {
    setting: 'exclude',
    argKey: 'filesToExclude',
    noun: 'Files to Exclude',
    sign: '\u2212', // minus sign
    example: '**/node_modules/**, **/vendor/**',
    useDescription: 'Apply as "files to exclude"'
  }
};

const BUTTONS = {
  edit: { iconPath: new vscode.ThemeIcon('edit'), tooltip: 'Edit preset' },
  remove: { iconPath: new vscode.ThemeIcon('trash'), tooltip: 'Delete preset' },
  save: { iconPath: new vscode.ThemeIcon('save'), tooltip: 'Save as preset' }
};

/* ------------------------------------------------------------------ */
/* Settings helpers                                                    */
/* ------------------------------------------------------------------ */

function getConfig() {
  return vscode.workspace.getConfiguration(CONFIG_SECTION);
}

/**
 * Reads and normalizes presets of the given kind from settings.
 * @param {'include'|'exclude'} kind
 * @returns {{label: string, pattern: string}[]}
 */
function readPresets(kind) {
  const raw = getConfig().get(KINDS[kind].setting, []);
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((item) => item && typeof item.pattern === 'string' && item.pattern.trim().length > 0)
    .map((item) => {
      const pattern = item.pattern.trim();
      const label = typeof item.label === 'string' && item.label.trim() ? item.label.trim() : pattern;
      return { label, pattern };
    });
}

/**
 * Writes presets back to the settings level that currently owns them:
 * workspace settings if the workspace overrides them, user settings otherwise.
 */
async function writePresets(kind, presets) {
  const config = getConfig();
  const info = config.inspect(KINDS[kind].setting);
  const target =
    info && info.workspaceValue !== undefined
      ? vscode.ConfigurationTarget.Workspace
      : vscode.ConfigurationTarget.Global;

  await config.update(KINDS[kind].setting, presets, target);
}

/* ------------------------------------------------------------------ */
/* Search view integration                                             */
/* ------------------------------------------------------------------ */

/**
 * Sets a filter field in the Search view. Fields that are not passed
 * (e.g. the other filter or the search term) are left untouched.
 * @param {Record<string, string>} fields
 */
async function applyToSearch(fields) {
  const triggerSearch = getConfig().get('triggerSearch', true);
  await vscode.commands.executeCommand('workbench.action.findInFiles', {
    ...fields,
    triggerSearch
  });
}

/* ------------------------------------------------------------------ */
/* Input prompts                                                       */
/* ------------------------------------------------------------------ */

async function promptPattern(kind, initial) {
  const meta = KINDS[kind];
  const value = await vscode.window.showInputBox({
    title: `${meta.sign} ${meta.noun}: Pattern`,
    prompt: 'Glob pattern. Separate several patterns with a comma.',
    placeHolder: meta.example,
    value: initial || '',
    ignoreFocusOut: true,
    validateInput: (v) => (v && v.trim().length > 0 ? null : 'Pattern cannot be empty.')
  });
  return value === undefined ? undefined : value.trim();
}

async function promptLabel(kind, pattern, initial) {
  const meta = KINDS[kind];
  const value = await vscode.window.showInputBox({
    title: `${meta.sign} ${meta.noun}: Label (optional)`,
    prompt: 'Short name shown in the list. Leave empty to use the pattern itself.',
    placeHolder: 'e.g. PHP files only',
    value: initial && initial !== pattern ? initial : '',
    ignoreFocusOut: true
  });
  if (value === undefined) {
    return undefined;
  }
  return value.trim() || pattern;
}

/* ------------------------------------------------------------------ */
/* Preset actions                                                      */
/* ------------------------------------------------------------------ */

/**
 * Saves a pattern as a preset (no duplicates by pattern) and returns it.
 */
async function savePreset(kind, pattern, label) {
  const presets = readPresets(kind);
  const existing = presets.find((p) => p.pattern === pattern);
  if (existing) {
    existing.label = label;
  } else {
    presets.push({ label, pattern });
  }
  await writePresets(kind, presets);
}

async function addPresetFlow(kind, initialPattern) {
  const pattern = await promptPattern(kind, initialPattern);
  if (!pattern) {
    return undefined;
  }
  const label = await promptLabel(kind, pattern);
  if (label === undefined) {
    return undefined;
  }
  await savePreset(kind, pattern, label);
  return pattern;
}

async function editPresetFlow(kind, index) {
  const presets = readPresets(kind);
  const current = presets[index];
  if (!current) {
    return;
  }

  const pattern = await promptPattern(kind, current.pattern);
  if (!pattern) {
    return;
  }
  const label = await promptLabel(kind, pattern, current.label);
  if (label === undefined) {
    return;
  }

  presets[index] = { label, pattern };
  await writePresets(kind, presets);
}

async function removePresetFlow(kind, index) {
  const presets = readPresets(kind);
  const current = presets[index];
  if (!current) {
    return;
  }

  const answer = await vscode.window.showWarningMessage(
    `Delete preset "${current.label}"?`,
    { modal: true, detail: current.pattern },
    'Delete'
  );
  if (answer !== 'Delete') {
    return;
  }

  presets.splice(index, 1);
  await writePresets(kind, presets);
}

/* ------------------------------------------------------------------ */
/* Quick pick                                                          */
/* ------------------------------------------------------------------ */

function buildItems(kind, typedValue) {
  const meta = KINDS[kind];
  const presets = readPresets(kind);
  const typed = (typedValue || '').trim();
  const items = [];

  if (presets.length > 0) {
    items.push({ label: 'Saved presets', kind: vscode.QuickPickItemKind.Separator });
    presets.forEach((preset, index) => {
      items.push({
        label: preset.label,
        description: preset.label === preset.pattern ? undefined : preset.pattern,
        buttons: [BUTTONS.edit, BUTTONS.remove],
        action: 'use',
        pattern: preset.pattern,
        index
      });
    });
  }

  // Ad-hoc pattern typed straight into the picker. Listed after presets so that
  // pressing Enter on a partial preset name still picks the preset.
  if (typed) {
    items.push({ label: 'Typed pattern', kind: vscode.QuickPickItemKind.Separator });
    items.push({
      label: `$(search) Use "${typed}"`,
      description: meta.useDescription,
      alwaysShow: true,
      buttons: [BUTTONS.save],
      action: 'adhoc',
      pattern: typed
    });
  }

  items.push({ label: 'Actions', kind: vscode.QuickPickItemKind.Separator });
  items.push({
    label: '$(add) Add new preset...',
    description: typed ? `Start with "${typed}"` : undefined,
    action: 'add',
    pattern: typed
  });
  items.push({
    label: `$(clear-all) Clear "${meta.noun.toLowerCase()}"`,
    description: 'Empty the field',
    action: 'clear'
  });
  items.push({
    label: '$(settings-gear) Edit in settings.json',
    action: 'settings'
  });

  return items;
}

/**
 * Opens the preset picker for one filter kind.
 * @param {'include'|'exclude'} kind
 */
function showPicker(kind) {
  const meta = KINDS[kind];
  const qp = vscode.window.createQuickPick();

  qp.title = `Search Presets \u2013 ${meta.sign} ${meta.noun}`;
  qp.placeholder = 'Pick a preset or type a glob pattern...';
  qp.matchOnDescription = true;
  qp.items = buildItems(kind, '');

  qp.onDidChangeValue((value) => {
    qp.items = buildItems(kind, value);
  });

  qp.onDidAccept(() => {
    const item = qp.selectedItems[0] || qp.activeItems[0];
    if (!item) {
      return;
    }
    qp.hide();
    void runItem(kind, item).catch(reportError);
  });

  qp.onDidTriggerItemButton((event) => {
    const item = event.item;
    qp.hide();
    void runItemButton(kind, event.button, item).catch(reportError);
  });

  qp.onDidHide(() => qp.dispose());
  qp.show();
}

async function runItem(kind, item) {
  const meta = KINDS[kind];

  switch (item.action) {
    case 'use':
    case 'adhoc':
      await applyToSearch({ [meta.argKey]: item.pattern });
      break;

    case 'add': {
      const pattern = await addPresetFlow(kind, item.pattern);
      if (pattern) {
        await applyToSearch({ [meta.argKey]: pattern });
      }
      break;
    }

    case 'clear':
      await applyToSearch({ [meta.argKey]: '' });
      break;

    case 'settings':
      await vscode.commands.executeCommand(
        'workbench.action.openSettingsJson',
        { revealSetting: { key: `${CONFIG_SECTION}.${meta.setting}` } }
      );
      break;
  }
}

async function runItemButton(kind, button, item) {
  const meta = KINDS[kind];

  const is = (b) => button === b || (button && button.tooltip === b.tooltip);

  if (is(BUTTONS.edit)) {
    await editPresetFlow(kind, item.index);
    showPicker(kind); // back to the list so several presets can be managed in a row
  } else if (is(BUTTONS.remove)) {
    await removePresetFlow(kind, item.index);
    showPicker(kind);
  } else if (is(BUTTONS.save)) {
    const label = await promptLabel(kind, item.pattern);
    if (label === undefined) {
      showPicker(kind);
      return;
    }
    await savePreset(kind, item.pattern, label);
    await applyToSearch({ [meta.argKey]: item.pattern });
  }
}

function reportError(error) {
  vscode.window.showErrorMessage(`Phoca Search Presets: ${error && error.message ? error.message : error}`);
}

/* ------------------------------------------------------------------ */
/* Activation                                                          */
/* ------------------------------------------------------------------ */

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('searchPresets.pickInclude', () => showPicker('include')),
    vscode.commands.registerCommand('searchPresets.pickExclude', () => showPicker('exclude')),
    vscode.commands.registerCommand('searchPresets.clearFilters', () =>
      applyToSearch({ filesToInclude: '', filesToExclude: '' }).catch(reportError)
    )
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
