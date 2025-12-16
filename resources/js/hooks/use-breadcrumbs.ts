import { usePage } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';
import { type BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';

/**
 * Hook to automatically generate breadcrumbs from current route
 */
export function useBreadcrumbs(customBreadcrumbs?: BreadcrumbItem[]): BreadcrumbItem[] {
    const { t } = useTranslation();
    const page = usePage();
    const url = page.url;
    const sharedData = page.props as any;
    const currentWay = sharedData?.currentWay;

    // If custom breadcrumbs are provided, use them
    if (customBreadcrumbs && customBreadcrumbs.length > 0) {
        return customBreadcrumbs;
    }

    // Auto-generate breadcrumbs from URL
    const breadcrumbs: BreadcrumbItem[] = [];
    
    // Add dashboard first
    breadcrumbs.push({ title: t('nav.dashboard'), href: dashboard() });
    
    // Add current way name if selected (after dashboard)
    if (currentWay) {
        breadcrumbs.push({
            title: currentWay.name,
            href: `?way=${currentWay.id}`,
        });
    }

    // Remove leading slash and split path
    const pathParts = url.replace(/^\//, '').split('/').filter(Boolean);
    
    // Skip if already on dashboard
    if (pathParts.length === 0 || pathParts[0] === 'dashboard') {
        return [{ title: t('nav.dashboard'), href: dashboard() }];
    }

    // Route mapping for translation keys
    const routeMap: Record<string, string> = {
        'pos': 'nav.pos',
        'products': 'nav.products',
        'categories': 'nav.categories',
        'customers': 'nav.customers',
        'orders': 'nav.orders',
        'inventory': 'nav.inventory',
        'discounts': 'nav.discounts',
        'reports': 'nav.reports',
        'shifts': 'nav.shifts',
        'roles': 'nav.roles',
        'backup': 'nav.backup',
        'suppliers': 'nav.suppliers',
        'purchase-orders': 'nav.purchase_orders',
        'expenses': 'nav.expenses',
        'tax-rates': 'nav.tax_rates',
        'settings': 'nav.settings',
        'search': 'search.title',
        'refunds': 'nav.refunds',
    };

    // Build breadcrumbs from path
    let currentPath = '';
    pathParts.forEach((part, index) => {
        const isLast = index === pathParts.length - 1;
        const prevPart = index > 0 ? pathParts[index - 1] : null;
        const nextPart = index < pathParts.length - 1 ? pathParts[index + 1] : null;
        
        // Get translation key
        const translationKey = routeMap[part] || part;
        let title = t(translationKey);
        
        // If translation doesn't exist, format the part
        if (title === translationKey) {
            title = part
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }

        // Handle special nested routes
        if (part === 'daily' || part === 'monthly' || part === 'yearly') {
            title = t(`reports.${part}`);
            currentPath = `/reports/${part}`;
        } else if (part === 'product-performance') {
            title = t('reports.product_performance');
            currentPath = '/reports/product-performance';
        } else if (part === 'cash-register') {
            title = t('reports.cash_register');
            currentPath = '/reports/cash-register';
        } else if (part === 'profile' || part === 'password' || part === 'appearance' || part === 'two-factor' || part === 'pos') {
            title = t(`settings.${part}`);
            currentPath = `/settings/${part}`;
        } else if (part === 'create' && prevPart) {
            const parent = prevPart;
            if (parent === 'purchase-orders') {
                title = t('purchase_orders.create');
            } else if (parent === 'expenses') {
                title = t('expenses.add_expense');
            } else {
                title = t('common.create');
            }
            currentPath = `/${prevPart}/${part}`;
        } else if (part === 'history' && prevPart && !isNaN(Number(prevPart))) {
            // Product inventory history: /inventory/{id}/history
            const productId = prevPart;
            title = t('inventory.history');
            currentPath = `/inventory/${productId}/history`;
        } else if (part === 'receipt' && prevPart && !isNaN(Number(prevPart))) {
            // Order receipt: /orders/{id}/receipt
            const orderId = prevPart;
            title = t('receipt.title');
            currentPath = `/orders/${orderId}/receipt`;
        } else if (!isNaN(Number(part)) && prevPart) {
            // This is likely an ID
            const parent = prevPart;
            const parentKey = routeMap[parent] || parent;
            let parentTitle = t(parentKey);
            if (parentTitle === parentKey) {
                parentTitle = parent.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            }
            
            // Check if next part is a special route (history, receipt, etc.)
            if (nextPart === 'history' || nextPart === 'receipt') {
                // Skip adding ID breadcrumb, it will be handled by the next part
                currentPath += `/${part}`;
                return;
            }
            
            title = `${parentTitle} #${part}`;
            currentPath += `/${part}`;
        } else {
            currentPath += `/${part}`;
        }

        breadcrumbs.push({
            title,
            href: currentPath,
        });
    });

    return breadcrumbs;
}
