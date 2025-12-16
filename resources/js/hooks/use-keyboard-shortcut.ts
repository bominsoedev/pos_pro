import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
    callback: (e: KeyboardEvent) => void;
    description?: string;
    preventDefault?: boolean;
    stopPropagation?: boolean;
}

/**
 * Custom hook for handling keyboard shortcuts
 * @param shortcuts - Array of keyboard shortcut configurations
 * @param enabled - Whether shortcuts are enabled (default: true)
 * @param target - Target element to attach listeners to (default: window)
 */
export function useKeyboardShortcut(
    shortcuts: KeyboardShortcut[],
    enabled: boolean = true,
    target: Window | HTMLElement = typeof window !== 'undefined' ? window : undefined as any
) {
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!enabled) return;

        // Don't trigger shortcuts when user is typing in input fields
        const target = e.target as HTMLElement;
        if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable ||
            (target.closest('[contenteditable="true"]') !== null)
        ) {
            // Allow Escape and some special keys even in inputs
            if (e.key !== 'Escape' && !e.ctrlKey && !e.metaKey) {
                return;
            }
        }

        for (const shortcut of shortcuts) {
            // Match key or code, handle number keys specially
            let keyMatch = false;
            if (shortcut.key.length === 1 && /[0-9]/.test(shortcut.key)) {
                // For number keys, match both "1" and "Digit1"
                keyMatch = e.key === shortcut.key || e.code === `Digit${shortcut.key}` || e.code === shortcut.key;
            } else {
                keyMatch = e.key === shortcut.key || e.code === shortcut.key;
            }
            if (!keyMatch) continue;

            // Check modifiers
            let ctrlMatch = true;
            let shiftMatch = true;
            let altMatch = true;
            let metaMatch = true;

            // If ctrl is specified, check if ctrl or cmd is pressed (for cross-platform)
            if (shortcut.ctrl !== undefined) {
                if (shortcut.ctrl) {
                    ctrlMatch = e.ctrlKey || e.metaKey; // Accept Ctrl or Cmd
                } else {
                    ctrlMatch = !e.ctrlKey && !e.metaKey; // Neither should be pressed
                }
            }

            // If meta is specified, check meta key
            if (shortcut.meta !== undefined) {
                metaMatch = e.metaKey === shortcut.meta;
            }

            // Check shift
            if (shortcut.shift !== undefined) {
                shiftMatch = e.shiftKey === shortcut.shift;
            }

            // Check alt
            if (shortcut.alt !== undefined) {
                altMatch = e.altKey === shortcut.alt;
            }

            if (ctrlMatch && shiftMatch && altMatch && metaMatch) {
                if (shortcut.preventDefault !== false) {
                    e.preventDefault();
                }
                if (shortcut.stopPropagation) {
                    e.stopPropagation();
                }
                shortcut.callback(e);
                break;
            }
        }
    }, [shortcuts, enabled]);

    useEffect(() => {
        if (!target || !enabled) return;

        target.addEventListener('keydown', handleKeyDown);
        return () => {
            target.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown, target, enabled]);
}

/**
 * Helper function to format shortcut display text
 */
export function formatShortcut(shortcut: Omit<KeyboardShortcut, 'callback'>): string {
    const parts: string[] = [];
    
    // Detect platform
    const isMac = typeof window !== 'undefined' && (/Mac|iPhone|iPad|iPod/.test(navigator.platform) || /Mac|iPhone|iPad|iPod/.test(navigator.userAgent));
    
    // For Ctrl, use Cmd on Mac, Ctrl on Windows/Linux
    if (shortcut.ctrl) {
        parts.push(isMac ? 'Cmd' : 'Ctrl');
    }
    if (shortcut.meta) {
        parts.push('Cmd');
    }
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.shift) parts.push('Shift');
    
    // Format key name
    let keyName = shortcut.key;
    if (keyName.startsWith('Key')) keyName = keyName.replace('Key', '');
    if (keyName.startsWith('Digit')) keyName = keyName.replace('Digit', '');
    if (keyName === ' ') keyName = 'Space';
    if (keyName === 'Enter') keyName = 'Enter';
    if (keyName === 'Escape') keyName = 'Esc';
    if (keyName === 'ArrowUp') keyName = '↑';
    if (keyName === 'ArrowDown') keyName = '↓';
    if (keyName === 'ArrowLeft') keyName = '←';
    if (keyName === 'ArrowRight') keyName = '→';
    
    parts.push(keyName);
    return parts.join(' + ');
}
