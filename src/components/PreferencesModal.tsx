import React, { useEffect, useState } from 'react';
import { Keyboard, PanelLeft, RotateCcw, X } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import {
  DEFAULT_SHORTCUTS,
  SHORTCUT_ACTION_ORDER,
  SIDEBAR_TOGGLE_PRESETS,
  areBindingsEqual,
  captureKeyBinding,
  findConflictingAction,
  formatKeyBinding,
  hasCustomShortcuts,
  type KeyBinding,
  type ShortcutActionId,
  type ShortcutMap,
} from '../utils/shortcuts';
import {
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
} from '../utils/storage';

interface PreferencesModalProps {
  open: boolean;
  onClose: () => void;
  desktopSidebarOpen: boolean;
  onToggleDesktopSidebar: () => void;
  sidebarWidth: number;
  onChangeSidebarWidth: (width: number) => void;
  onResetSidebarWidth: () => void;
  shortcuts: ShortcutMap;
  onUpdateShortcut: (action: ShortcutActionId, binding: KeyBinding) => void;
  onResetShortcut: (action: ShortcutActionId) => void;
  onResetAll: () => void;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  open,
  onClose,
  desktopSidebarOpen,
  onToggleDesktopSidebar,
  sidebarWidth,
  onChangeSidebarWidth,
  onResetSidebarWidth,
  shortcuts,
  onUpdateShortcut,
  onResetShortcut,
  onResetAll,
}) => {
  const { t } = useI18n();
  const [recordingAction, setRecordingAction] =
    useState<ShortcutActionId | null>(null);
  const [conflictMsg, setConflictMsg] = useState<{
    action: ShortcutActionId;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!open) {
      setRecordingAction(null);
      setConflictMsg(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (recordingAction) {
        e.preventDefault();
        e.stopPropagation();

        if (e.key === 'Escape') {
          setRecordingAction(null);
          setConflictMsg(null);
          return;
        }

        const captured = captureKeyBinding(e);
        if (!captured) return;

        const conflict = findConflictingAction(
          shortcuts,
          recordingAction,
          captured
        );
        if (conflict) {
          setConflictMsg({
            action: recordingAction,
            message: t.preferences.conflictError(
              t.preferences.actions[conflict].label
            ),
          });
          return;
        }

        onUpdateShortcut(recordingAction, captured);
        setRecordingAction(null);
        setConflictMsg(null);
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [open, recordingAction, shortcuts, onUpdateShortcut, onClose, t.preferences]);

  if (!open) return null;

  const isSidebarWidthModified = sidebarWidth !== SIDEBAR_DEFAULT_WIDTH;
  const hasAnyCustomization =
    isSidebarWidthModified || hasCustomShortcuts(shortcuts);

  const applySidebarPreset = (preset: KeyBinding) => {
    const conflict = findConflictingAction(shortcuts, 'toggleSidebar', preset);
    if (conflict) {
      setConflictMsg({
        action: 'toggleSidebar',
        message: t.preferences.conflictError(
          t.preferences.actions[conflict].label
        ),
      });
      return;
    }
    onUpdateShortcut('toggleSidebar', preset);
    setRecordingAction(null);
    setConflictMsg(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 px-3 pt-[calc(1.5rem+var(--pwa-top-inset))] pb-[calc(1rem+var(--safe-bottom))] backdrop-blur-[1px] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="preferences-modal-title"
        className="flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[var(--slack-border)] bg-[var(--slack-main-bg)] text-[var(--slack-text)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--slack-border)] bg-[var(--slack-surface-bg)] px-4 py-3">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-[var(--slack-accent)]" />
            <h2
              id="preferences-modal-title"
              className="text-sm font-bold tracking-tight"
            >
              {t.preferences.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.preferences.close}
            className="rounded-md p-1 text-[var(--slack-text-muted)] transition hover:bg-[var(--slack-badge-bg)] hover:text-[var(--slack-text)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="slack-scroll flex-1 space-y-5 overflow-y-auto px-4 py-4">
          {/* Sidebar Section */}
          <section className="space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-[var(--slack-text-muted)] uppercase">
              <PanelLeft className="h-3.5 w-3.5" />
              <span>{t.preferences.sidebarSection}</span>
            </div>

            <div className="space-y-3 rounded-lg border border-[var(--slack-border)] bg-[var(--slack-surface-bg)] p-3">
              {/* Visibility toggle */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-[var(--slack-text)]">
                  {t.preferences.sidebarVisible}
                </span>
                <div className="flex items-center gap-2">
                  <kbd className="rounded bg-[var(--slack-badge-bg)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--slack-text-muted)]">
                    {formatKeyBinding(shortcuts.toggleSidebar)}
                  </kbd>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={desktopSidebarOpen}
                    aria-label={t.preferences.sidebarVisible}
                    onClick={onToggleDesktopSidebar}
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                      desktopSidebarOpen
                        ? 'bg-[var(--slack-accent)]'
                        : 'bg-[var(--slack-border)]'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform ${
                        desktopSidebarOpen ? 'translate-x-4.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Sidebar width slider */}
              <div className="space-y-1.5 border-t border-[var(--slack-border)] pt-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="sidebar-width-slider"
                    className="text-xs font-medium text-[var(--slack-text)]"
                  >
                    {t.preferences.sidebarWidth}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono-code text-xs tabular-nums text-[var(--slack-text-muted)]">
                      {sidebarWidth}px
                    </span>
                    {isSidebarWidthModified && (
                      <button
                        type="button"
                        onClick={onResetSidebarWidth}
                        title={t.preferences.reset}
                        aria-label={t.preferences.reset}
                        className="rounded p-0.5 text-[var(--slack-text-muted)] transition hover:bg-[var(--slack-badge-bg)] hover:text-[var(--slack-text)]"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                <input
                  id="sidebar-width-slider"
                  type="range"
                  min={SIDEBAR_MIN_WIDTH}
                  max={SIDEBAR_MAX_WIDTH}
                  step={4}
                  value={sidebarWidth}
                  onChange={(e) => onChangeSidebarWidth(Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer accent-[var(--slack-accent)]"
                />
                <p className="text-[11px] leading-relaxed text-[var(--slack-text-muted)]">
                  {t.preferences.sidebarResizeHint}
                </p>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts Section */}
          <section className="space-y-2.5">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-[var(--slack-text-muted)] uppercase">
                <Keyboard className="h-3.5 w-3.5" />
                <span>{t.preferences.shortcutsSection}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-[var(--slack-text-muted)]">
                {t.preferences.shortcutsHint}
              </p>
            </div>

            <div className="divide-y divide-[var(--slack-border)] rounded-lg border border-[var(--slack-border)] bg-[var(--slack-surface-bg)]">
              {SHORTCUT_ACTION_ORDER.map((action) => {
                const binding = shortcuts[action];
                const isModified = !areBindingsEqual(
                  binding,
                  DEFAULT_SHORTCUTS[action]
                );
                const isRecording = recordingAction === action;
                const actionConflict =
                  conflictMsg?.action === action ? conflictMsg.message : null;
                const meta = t.preferences.actions[action];

                return (
                  <div key={action} className="px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[var(--slack-text)]">
                          {meta.label}
                        </div>
                        <div className="text-[11px] text-[var(--slack-text-muted)]">
                          {meta.description}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setConflictMsg(null);
                            setRecordingAction(isRecording ? null : action);
                          }}
                          title={t.preferences.clickToRebind}
                          className={`inline-flex min-w-18 items-center justify-center rounded-md border px-2 py-1 text-xs font-semibold transition ${
                            isRecording
                              ? 'border-[var(--slack-accent)] bg-[var(--slack-accent)]/12 text-[var(--slack-link)] ring-2 ring-[var(--slack-accent)]/25'
                              : 'border-[var(--slack-border)] bg-[var(--slack-main-bg)] text-[var(--slack-text)] hover:border-[var(--slack-accent)]/60'
                          }`}
                        >
                          {isRecording ? (
                            <span className="animate-pulse">
                              {t.preferences.pressKeys}
                            </span>
                          ) : (
                            <kbd className="font-sans">
                              {formatKeyBinding(binding)}
                            </kbd>
                          )}
                        </button>

                        {isModified && (
                          <button
                            type="button"
                            onClick={() => {
                              onResetShortcut(action);
                              if (recordingAction === action) {
                                setRecordingAction(null);
                              }
                              if (conflictMsg?.action === action) {
                                setConflictMsg(null);
                              }
                            }}
                            title={t.preferences.reset}
                            aria-label={`${t.preferences.reset}: ${meta.label}`}
                            className="rounded-md p-1 text-[var(--slack-text-muted)] transition hover:bg-[var(--slack-badge-bg)] hover:text-[var(--slack-text)]"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick preset pills for Toggle Sidebar */}
                    {action === 'toggleSidebar' && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-[var(--slack-text-muted)]">
                          {t.preferences.presetsLabel}:
                        </span>
                        {SIDEBAR_TOGGLE_PRESETS.map((preset) => {
                          const label = formatKeyBinding(preset);
                          const isActive = areBindingsEqual(binding, preset);
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() => applySidebarPreset(preset)}
                              className={`rounded border px-1.5 py-0.5 text-[11px] font-medium transition ${
                                isActive
                                  ? 'border-[var(--slack-accent)] bg-[var(--slack-accent)]/12 text-[var(--slack-link)]'
                                  : 'border-[var(--slack-border)] bg-[var(--slack-main-bg)] text-[var(--slack-text-muted)] hover:border-[var(--slack-accent)]/50 hover:text-[var(--slack-text)]'
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {actionConflict && (
                      <p className="mt-1.5 text-[11px] font-medium text-rose-500">
                        {actionConflict}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-[var(--slack-border)] bg-[var(--slack-surface-bg)] px-4 py-2.5 text-[11px] text-[var(--slack-text-muted)]">
          <span>{t.preferences.escHint}</span>
          <button
            type="button"
            disabled={!hasAnyCustomization}
            onClick={() => {
              onResetAll();
              setRecordingAction(null);
              setConflictMsg(null);
            }}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--slack-border)] bg-[var(--slack-main-bg)] px-2.5 py-1 text-xs font-medium text-[var(--slack-text)] transition hover:bg-[var(--slack-badge-bg)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <RotateCcw className="h-3 w-3" />
            <span>{t.preferences.resetAll}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
