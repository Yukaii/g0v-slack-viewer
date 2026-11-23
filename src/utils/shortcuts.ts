import { isMacPlatform } from './platform';

export type ShortcutActionId =
  | 'toggleSidebar'
  | 'quickSwitcher'
  | 'openDirectory'
  | 'searchMessages'
  | 'toggleChannelInfo';

export const SHORTCUT_ACTION_ORDER: readonly ShortcutActionId[] = [
  'toggleSidebar',
  'quickSwitcher',
  'openDirectory',
  'searchMessages',
  'toggleChannelInfo',
];

export interface KeyBinding {
  /** Cmd (⌘) on macOS, Ctrl on Windows/Linux */
  mod: boolean;
  /** Explicit Control (⌃) on macOS when distinct from Cmd */
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  /** Normalized key identifier (e.g. '\\', 'b', 'k', 'f', '.', 'space', 'f1') */
  key: string;
}

export type ShortcutMap = Record<ShortcutActionId, KeyBinding>;

export const DEFAULT_SHORTCUTS: ShortcutMap = {
  toggleSidebar: { mod: true, ctrl: false, shift: false, alt: false, key: '\\' },
  quickSwitcher: { mod: true, ctrl: false, shift: false, alt: false, key: 'k' },
  openDirectory: { mod: true, ctrl: false, shift: true, alt: false, key: 'k' },
  searchMessages: { mod: true, ctrl: false, shift: true, alt: false, key: 'f' },
  toggleChannelInfo: { mod: true, ctrl: false, shift: false, alt: false, key: '.' },
};

export const SIDEBAR_TOGGLE_PRESETS: readonly KeyBinding[] = [
  { mod: true, ctrl: false, shift: false, alt: false, key: '\\' },
  { mod: true, ctrl: false, shift: false, alt: false, key: 'b' },
  { mod: true, ctrl: false, shift: true, alt: false, key: 'd' },
];

const IGNORED_KEYS = new Set([
  'Meta',
  'Control',
  'Shift',
  'Alt',
  'AltGraph',
  'CapsLock',
  'NumLock',
  'ScrollLock',
  'OS',
  'Fn',
  'FnLock',
  'Dead',
  'Process',
  'Unidentified',
]);

const CODE_TO_KEY: Record<string, string> = {
  Backslash: '\\',
  BracketLeft: '[',
  BracketRight: ']',
  Slash: '/',
  Period: '.',
  Comma: ',',
  Semicolon: ';',
  Quote: "'",
  Backquote: '`',
  Minus: '-',
  Equal: '=',
  Space: 'space',
  IntlBackslash: '\\',
};

const DISPLAY_KEY_LABELS: Record<string, string> = {
  '\\': '\\',
  space: 'Space',
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  enter: '↵',
  backspace: '⌫',
  delete: 'Del',
  home: 'Home',
  end: 'End',
  pageup: 'PgUp',
  pagedown: 'PgDn',
};

/**
 * Normalize a KeyboardEvent's non-modifier key so shortcuts behave reliably
 * across Shift/Alt punctuation changes (e.g. Shift+\ -> |, macOS Option chars)
 * while still respecting letter layouts like Dvorak/Colemak/AZERTY.
 */
export function normalizeKeyboardEventKey(e: KeyboardEvent): string | null {
  if (IGNORED_KEYS.has(e.key)) return null;

  // On macOS Option+letter or Option+punctuation produces dead/symbol characters;
  // fall back to physical e.code so combos like Option+B or Option+\ work reliably.
  if (e.altKey) {
    const mapped = mapCodeToKey(e.code);
    if (mapped) return mapped;
  }

  // Shifted punctuation (e.g. Shift+\ -> '|', Shift+. -> '>') should map back
  // to the base punctuation key via e.code when available.
  if (e.shiftKey && e.code in CODE_TO_KEY) {
    return CODE_TO_KEY[e.code];
  }

  if (e.key === ' ') return 'space';

  if (e.key.length === 1) {
    return e.key.toLowerCase();
  }

  const lower = e.key.toLowerCase();
  if (
    /^f([1-9]|1[0-2])$/.test(lower) ||
    lower in DISPLAY_KEY_LABELS ||
    lower === 'escape' ||
    lower === 'tab'
  ) {
    return lower;
  }

  const fallback = mapCodeToKey(e.code);
  if (fallback) return fallback;

  return lower || null;
}

function mapCodeToKey(code: string): string | null {
  if (code in CODE_TO_KEY) return CODE_TO_KEY[code];
  if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase();
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  if (/^F([1-9]|1[0-2])$/.test(code)) return code.toLowerCase();
  return null;
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export function captureKeyBinding(
  e: KeyboardEvent,
  mac: boolean = isMacPlatform()
): KeyBinding | null {
  const key = normalizeKeyboardEventKey(e);
  if (!key || key === 'escape' || key === 'tab') return null;

  return {
    mod: mac ? e.metaKey : e.ctrlKey,
    ctrl: mac ? e.ctrlKey : false,
    shift: e.shiftKey,
    alt: e.altKey,
    key,
  };
}

export function matchesKeyBinding(
  e: KeyboardEvent,
  binding: KeyBinding,
  mac: boolean = isMacPlatform()
): boolean {
  const hasPrimaryModifier = binding.mod || binding.ctrl || binding.alt;
  if (!hasPrimaryModifier && isEditableTarget(e.target)) {
    return false;
  }

  const eventMod = mac ? e.metaKey : e.ctrlKey;
  const eventCtrl = mac ? e.ctrlKey : false;
  const eventExtraMeta = mac ? false : e.metaKey;

  if (eventMod !== binding.mod) return false;
  if (eventCtrl !== binding.ctrl) return false;
  if (eventExtraMeta) return false;
  if (e.shiftKey !== binding.shift) return false;
  if (e.altKey !== binding.alt) return false;

  const key = normalizeKeyboardEventKey(e);
  return key === binding.key;
}

export function areBindingsEqual(a: KeyBinding, b: KeyBinding): boolean {
  return (
    a.mod === b.mod &&
    Boolean(a.ctrl) === Boolean(b.ctrl) &&
    a.shift === b.shift &&
    a.alt === b.alt &&
    a.key === b.key
  );
}

export function findConflictingAction(
  shortcuts: ShortcutMap,
  targetAction: ShortcutActionId,
  candidate: KeyBinding
): ShortcutActionId | null {
  for (const action of SHORTCUT_ACTION_ORDER) {
    if (action === targetAction) continue;
    if (areBindingsEqual(shortcuts[action], candidate)) {
      return action;
    }
  }
  return null;
}

export function formatKeyBinding(
  binding: KeyBinding,
  mac: boolean = isMacPlatform()
): string {
  const keyLabel = formatKeyDisplay(binding.key);

  if (mac) {
    let prefix = '';
    if (binding.ctrl) prefix += '⌃';
    if (binding.alt) prefix += '⌥';
    if (binding.shift) prefix += '⇧';
    if (binding.mod) prefix += '⌘';
    return `${prefix}${keyLabel}`;
  }

  const parts: string[] = [];
  if (binding.mod || binding.ctrl) parts.push('Ctrl');
  if (binding.alt) parts.push('Alt');
  if (binding.shift) parts.push('Shift');
  parts.push(keyLabel);
  return parts.join('+');
}

function formatKeyDisplay(key: string): string {
  if (key in DISPLAY_KEY_LABELS) return DISPLAY_KEY_LABELS[key];
  if (/^f([1-9]|1[0-2])$/.test(key)) return key.toUpperCase();
  if (key.length === 1) return key.toUpperCase();
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function isValidKeyBinding(raw: unknown): raw is KeyBinding {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
  const obj = raw as Record<string, unknown>;
  return (
    typeof obj.mod === 'boolean' &&
    (obj.ctrl === undefined || typeof obj.ctrl === 'boolean') &&
    typeof obj.shift === 'boolean' &&
    typeof obj.alt === 'boolean' &&
    typeof obj.key === 'string' &&
    obj.key.length > 0 &&
    obj.key.length <= 20
  );
}

export function hasCustomShortcuts(shortcuts: ShortcutMap): boolean {
  return SHORTCUT_ACTION_ORDER.some(
    (action) => !areBindingsEqual(shortcuts[action], DEFAULT_SHORTCUTS[action])
  );
}
