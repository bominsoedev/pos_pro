/**
 * Platform detection utilities
 */

/**
 * Detect if the current platform is macOS
 */
export function isMac(): boolean {
    if (typeof window === 'undefined') return false;
    return /Mac|iPhone|iPad|iPod/.test(navigator.platform) || 
           /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
}

/**
 * Get the platform-specific modifier key name
 * Returns "Cmd" for Mac, "Ctrl" for Windows/Linux
 */
export function getModifierKey(): string {
    return isMac() ? 'Cmd' : 'Ctrl';
}

/**
 * Format a keyboard shortcut for display
 * Replaces Ctrl with Cmd on Mac
 */
export function formatShortcutKey(shortcut: string): string {
    if (isMac()) {
        return shortcut.replace(/Ctrl/g, 'Cmd').replace(/Ctrl\+/g, 'Cmd+');
    }
    return shortcut;
}

/**
 * Get the platform-specific key combination
 * For shortcuts that use Ctrl, returns Cmd on Mac
 */
export function getPlatformShortcut(baseShortcut: string): string {
    if (isMac()) {
        // Replace Ctrl with Cmd, but keep Ctrl+Shift as Ctrl+Shift (some apps do this)
        // For most cases, we want Ctrl -> Cmd
        return baseShortcut.replace(/\bCtrl\b/g, 'Cmd');
    }
    return baseShortcut;
}

