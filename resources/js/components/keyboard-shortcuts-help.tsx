import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/use-translation';
import { Keyboard } from 'lucide-react';
import { formatShortcut } from '@/hooks/use-keyboard-shortcut';
import { dashboard } from '@/routes';

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
        { key: '1', ctrl: true, description: t('shortcuts.nav_dashboard') },
        { key: '2', ctrl: true, description: t('shortcuts.nav_pos') },
        { key: '3', ctrl: true, description: t('shortcuts.nav_products') },
        { key: '4', ctrl: true, description: t('shortcuts.nav_categories') },
        { key: '5', ctrl: true, description: t('shortcuts.nav_customers') },
        { key: '6', ctrl: true, description: t('shortcuts.nav_orders') },
        { key: '7', ctrl: true, description: t('shortcuts.nav_inventory') },
        { key: '8', ctrl: true, description: t('shortcuts.nav_discounts') },
        { key: '9', ctrl: true, description: t('shortcuts.nav_reports') },
        { key: '0', ctrl: true, description: t('shortcuts.nav_shifts') },
        { key: 'r', ctrl: true, shift: true, description: t('shortcuts.nav_roles') },
        { key: 'u', ctrl: true, shift: true, description: t('shortcuts.nav_backup') },
        { key: 's', ctrl: true, shift: true, description: t('shortcuts.nav_suppliers') },
        { key: 'p', ctrl: true, shift: true, description: t('shortcuts.nav_purchase_orders') },
        { key: 'e', ctrl: true, shift: true, description: t('shortcuts.nav_expenses') },
        { key: 't', ctrl: true, shift: true, description: t('shortcuts.nav_tax_rates') },
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
                <div className="mt-4 space-y-4">
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
                                        {formatShortcut(shortcut)}
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
