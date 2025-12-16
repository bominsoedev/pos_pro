import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/use-translation';
import { Keyboard } from 'lucide-react';
import { formatShortcut } from '@/hooks/use-keyboard-shortcut';
import { dashboard } from '@/routes';
import { getPlatformShortcut } from '@/lib/platform';

interface KeyboardShortcutsHelpProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    shortcuts?: Array<{
        key: string;
        ctrl?: boolean;
        shift?: boolean;
        alt?: boolean;
        meta?: boolean;
        description: string;
    }>;
}

export default function KeyboardShortcutsHelp({ open, onOpenChange, shortcuts }: KeyboardShortcutsHelpProps) {
    const { t } = useTranslation();

    const navigationShortcuts = [
        { key: '1', ctrl: true, description: t('shortcuts.nav_dashboard'), displayShortcut: getPlatformShortcut('Ctrl+1') },
        { key: '2', ctrl: true, description: t('shortcuts.nav_pos'), displayShortcut: getPlatformShortcut('Ctrl+2') },
        { key: '3', ctrl: true, description: t('shortcuts.nav_products'), displayShortcut: getPlatformShortcut('Ctrl+3') },
        { key: '4', ctrl: true, description: t('shortcuts.nav_categories'), displayShortcut: getPlatformShortcut('Ctrl+4') },
        { key: '5', ctrl: true, description: t('shortcuts.nav_customers'), displayShortcut: getPlatformShortcut('Ctrl+5') },
        { key: '6', ctrl: true, description: t('shortcuts.nav_orders'), displayShortcut: getPlatformShortcut('Ctrl+6') },
        { key: '7', ctrl: true, description: t('shortcuts.nav_inventory'), displayShortcut: getPlatformShortcut('Ctrl+7') },
        { key: '8', ctrl: true, description: t('shortcuts.nav_discounts'), displayShortcut: getPlatformShortcut('Ctrl+8') },
        { key: '9', ctrl: true, description: t('shortcuts.nav_reports'), displayShortcut: getPlatformShortcut('Ctrl+9') },
        { key: '0', ctrl: true, description: t('shortcuts.nav_shifts'), displayShortcut: getPlatformShortcut('Ctrl+0') },
        { key: 'r', ctrl: true, shift: true, description: t('shortcuts.nav_roles'), displayShortcut: getPlatformShortcut('Ctrl+Shift+R') },
        { key: 'u', ctrl: true, shift: true, description: t('shortcuts.nav_backup'), displayShortcut: getPlatformShortcut('Ctrl+Shift+U') },
        { key: 's', ctrl: true, shift: true, description: t('shortcuts.nav_suppliers'), displayShortcut: getPlatformShortcut('Ctrl+Shift+S') },
        { key: 'p', ctrl: true, shift: true, description: t('shortcuts.nav_purchase_orders'), displayShortcut: getPlatformShortcut('Ctrl+Shift+P') },
        { key: 'e', ctrl: true, shift: true, description: t('shortcuts.nav_expenses'), displayShortcut: getPlatformShortcut('Ctrl+Shift+E') },
        { key: 't', ctrl: true, shift: true, description: t('shortcuts.nav_tax_rates'), displayShortcut: getPlatformShortcut('Ctrl+Shift+T') },
    ];

    const defaultShortcuts = shortcuts || [
        { key: 'k', ctrl: true, description: t('shortcuts.global_search') },
        { key: 's', ctrl: true, description: t('shortcuts.save') },
        { key: 'p', ctrl: true, description: t('shortcuts.print') },
        { key: 'n', ctrl: true, description: t('shortcuts.new') },
        { key: 'Escape', description: t('shortcuts.close') },
        { key: 'b', ctrl: true, description: t('shortcuts.toggle_sidebar') },
        { key: '/', description: t('shortcuts.focus_search') },
        { key: '?', shift: true, description: t('shortcuts.show_help') },
    ];

    const displayShortcuts = defaultShortcuts;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Keyboard className="h-5 w-5" />
                        {t('shortcuts.title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('shortcuts.description')}
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-2">
                    <div>
                        <h3 className="font-semibold mb-2">{t('shortcuts.global_shortcuts')}</h3>
                        <div className="space-y-2">
                            {displayShortcuts.map((shortcut, index) => (
                                <div key={index} className="flex items-center justify-between py-2 border-b">
                                    <span className="text-sm text-muted-foreground">
                                        {shortcut.description}
                                    </span>
                                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
                                        {formatShortcut(shortcut)}
                                    </kbd>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">{t('shortcuts.navigation_shortcuts')}</h3>
                        <div className="space-y-2">
                            {navigationShortcuts.map((shortcut, index) => (
                                <div key={index} className="flex items-center justify-between py-2 border-b">
                                    <span className="text-sm text-muted-foreground">
                                        {shortcut.description}
                                    </span>
                                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
                                        {shortcut.displayShortcut || formatShortcut(shortcut)}
                                    </kbd>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
