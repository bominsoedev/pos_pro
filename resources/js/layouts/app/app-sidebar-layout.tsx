import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import Toast from '@/components/toast';
import KeyboardShortcutsHelp from '@/components/keyboard-shortcuts-help';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren, useState } from 'react';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
import { router } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';
import { dashboard } from '@/routes';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    const { t } = useTranslation();
    const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

    // Navigation shortcuts mapping
    const navigationShortcuts = [
        { key: '1', href: dashboard(), description: t('shortcuts.nav_dashboard') },
        { key: '2', href: '/pos', description: t('shortcuts.nav_pos') },
        { key: '3', href: '/products', description: t('shortcuts.nav_products') },
        { key: '4', href: '/categories', description: t('shortcuts.nav_categories') },
        { key: '5', href: '/customers', description: t('shortcuts.nav_customers') },
        { key: '6', href: '/orders', description: t('shortcuts.nav_orders') },
        { key: '7', href: '/inventory', description: t('shortcuts.nav_inventory') },
        { key: '8', href: '/discounts', description: t('shortcuts.nav_discounts') },
        { key: '9', href: '/reports/daily', description: t('shortcuts.nav_reports') },
        { key: '0', href: '/shifts', description: t('shortcuts.nav_shifts') },
    ];

    const additionalNavShortcuts = [
        { key: 'r', ctrl: true, shift: true, href: '/roles', description: t('shortcuts.nav_roles') },
        { key: 'u', ctrl: true, shift: true, href: '/backup', description: t('shortcuts.nav_backup') }, // Changed from 'b' to 'u' to avoid conflict with sidebar toggle
        { key: 's', ctrl: true, shift: true, href: '/suppliers', description: t('shortcuts.nav_suppliers') },
        { key: 'p', ctrl: true, shift: true, href: '/purchase-orders', description: t('shortcuts.nav_purchase_orders') },
        { key: 'e', ctrl: true, shift: true, href: '/expenses', description: t('shortcuts.nav_expenses') },
        { key: 't', ctrl: true, shift: true, href: '/tax-rates', description: t('shortcuts.nav_tax_rates') },
    ];

    // Global keyboard shortcuts
    useKeyboardShortcut([
        {
            key: '?',
            shift: true,
            callback: () => setShowShortcutsHelp(true),
            description: t('shortcuts.show_help'),
        },
        {
            key: 'k',
            ctrl: true,
            callback: () => {
                // Focus search - try to find search input on current page
                const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i], input[placeholder*="ရှာ" i]') as HTMLInputElement;
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            },
            description: t('shortcuts.global_search'),
        },
        {
            key: 'Escape',
            callback: () => {
                // Close any open dialogs/modals
                const dialogs = document.querySelectorAll('[role="dialog"]');
                if (dialogs.length > 0) {
                    const lastDialog = dialogs[dialogs.length - 1] as HTMLElement;
                    const closeButton = lastDialog.querySelector('button[aria-label*="close" i], button[aria-label*="ပိတ်" i]');
                    if (closeButton) {
                        (closeButton as HTMLButtonElement).click();
                    }
                }
            },
            description: t('shortcuts.close'),
        },
        // Navigation shortcuts (Ctrl + Number)
        ...navigationShortcuts.map(nav => ({
            key: nav.key,
            ctrl: true,
            callback: () => {
                router.visit(nav.href);
            },
            description: nav.description,
        })),
        // Additional navigation shortcuts (Ctrl + Shift + Letter)
        ...additionalNavShortcuts.map(nav => ({
            key: nav.key,
            ctrl: nav.ctrl,
            shift: nav.shift,
            callback: () => {
                router.visit(nav.href);
            },
            description: nav.description,
        })),
    ]);

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
            <Toast />
            <KeyboardShortcutsHelp 
                open={showShortcutsHelp} 
                onOpenChange={setShowShortcutsHelp}
            />
        </AppShell>
    );
}
