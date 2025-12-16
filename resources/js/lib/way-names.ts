import { type BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';

/**
 * Define way names and their related items for each route
 */
export interface WayRelatedItem {
    title: string;
    href: string;
    description?: string;
}

export interface WayDefinition {
    name: string;
    description?: string;
    relatedItems: WayRelatedItem[];
}

/**
 * Get way definitions for routes
 */
export function getWayDefinitions(t: (key: string) => string): Record<string, WayDefinition> {
    return {
        'dashboard': {
            name: t('nav.dashboard'),
            description: t('dashboard.title'),
            relatedItems: [
                { title: t('nav.dashboard'), href: dashboard(), description: t('dashboard.title') },
                { title: t('nav.pos'), href: '/pos', description: t('pos.title') },
                { title: t('nav.orders'), href: '/orders', description: t('orders.title') },
                { title: t('nav.reports'), href: '/reports/daily', description: t('reports.title') },
            ],
        },
        'products': {
            name: t('nav.products'),
            description: t('products.title'),
            relatedItems: [
                { title: t('nav.products'), href: '/products', description: t('products.title') },
                { title: t('nav.categories'), href: '/categories', description: t('categories.title') },
                { title: t('nav.inventory'), href: '/inventory', description: t('inventory.title') },
                { title: t('nav.discounts'), href: '/discounts', description: t('discounts.title') },
            ],
        },
        'orders': {
            name: t('nav.orders'),
            description: t('orders.title'),
            relatedItems: [
                { title: t('nav.orders'), href: '/orders', description: t('orders.title') },
                { title: t('nav.pos'), href: '/pos', description: t('pos.title') },
                { title: t('nav.customers'), href: '/customers', description: t('customers.title') },
                { title: t('nav.reports'), href: '/reports/daily', description: t('reports.title') },
            ],
        },
        'customers': {
            name: t('nav.customers'),
            description: t('customers.title'),
            relatedItems: [
                { title: t('nav.customers'), href: '/customers', description: t('customers.title') },
                { title: t('nav.orders'), href: '/orders', description: t('orders.title') },
                { title: t('nav.pos'), href: '/pos', description: t('pos.title') },
            ],
        },
        'inventory': {
            name: t('nav.inventory'),
            description: t('inventory.title'),
            relatedItems: [
                { title: t('nav.inventory'), href: '/inventory', description: t('inventory.title') },
                { title: t('nav.products'), href: '/products', description: t('products.title') },
                { title: t('nav.purchase_orders'), href: '/purchase-orders', description: t('purchase_orders.title') },
            ],
        },
        'reports': {
            name: t('nav.reports'),
            description: t('reports.title'),
            relatedItems: [
                { title: t('reports.daily'), href: '/reports/daily', description: t('reports.daily') },
                { title: t('reports.monthly'), href: '/reports/monthly', description: t('reports.monthly') },
                { title: t('reports.yearly'), href: '/reports/yearly', description: t('reports.yearly') },
                { title: t('reports.product_performance'), href: '/reports/product-performance', description: t('reports.product_performance') },
                { title: t('reports.cash_register'), href: '/reports/cash-register', description: t('reports.cash_register') },
            ],
        },
        'purchase-orders': {
            name: t('nav.purchase_orders'),
            description: t('purchase_orders.title'),
            relatedItems: [
                { title: t('nav.purchase_orders'), href: '/purchase-orders', description: t('purchase_orders.title') },
                { title: t('nav.suppliers'), href: '/suppliers', description: t('suppliers.title') },
                { title: t('nav.inventory'), href: '/inventory', description: t('inventory.title') },
                { title: t('nav.expenses'), href: '/expenses', description: t('expenses.title') },
            ],
        },
        'suppliers': {
            name: t('nav.suppliers'),
            description: t('suppliers.title'),
            relatedItems: [
                { title: t('nav.suppliers'), href: '/suppliers', description: t('suppliers.title') },
                { title: t('nav.purchase_orders'), href: '/purchase-orders', description: t('purchase_orders.title') },
            ],
        },
        'expenses': {
            name: t('nav.expenses'),
            description: t('expenses.title'),
            relatedItems: [
                { title: t('nav.expenses'), href: '/expenses', description: t('expenses.title') },
                { title: t('nav.purchase_orders'), href: '/purchase-orders', description: t('purchase_orders.title') },
                { title: t('nav.reports'), href: '/reports/daily', description: t('reports.title') },
            ],
        },
        'tax-rates': {
            name: t('nav.tax_rates'),
            description: t('tax_rates.title'),
            relatedItems: [
                { title: t('nav.tax_rates'), href: '/tax-rates', description: t('tax_rates.title') },
                { title: t('nav.settings'), href: '/settings/pos', description: t('settings.title') },
            ],
        },
        'settings': {
            name: t('nav.settings'),
            description: t('settings.title'),
            relatedItems: [
                { title: t('settings.profile.title'), href: '/settings/profile', description: t('settings.profile.description') },
                { title: t('settings.password.title'), href: '/settings/password', description: t('settings.password.description') },
                { title: t('settings.appearance.title'), href: '/settings/appearance', description: t('settings.appearance.description') },
                { title: t('settings.two_factor.title'), href: '/settings/two-factor', description: t('settings.two_factor.description') },
                { title: t('settings.pos_settings'), href: '/settings/pos', description: t('settings.pos_settings') },
            ],
        },
        'categories': {
            name: t('nav.categories'),
            description: t('categories.title'),
            relatedItems: [
                { title: t('nav.categories'), href: '/categories', description: t('categories.title') },
                { title: t('nav.products'), href: '/products', description: t('products.title') },
            ],
        },
        'discounts': {
            name: t('nav.discounts'),
            description: t('discounts.title'),
            relatedItems: [
                { title: t('nav.discounts'), href: '/discounts', description: t('discounts.title') },
                { title: t('nav.products'), href: '/products', description: t('products.title') },
                { title: t('nav.orders'), href: '/orders', description: t('orders.title') },
            ],
        },
        'shifts': {
            name: t('nav.shifts'),
            description: t('shifts.title'),
            relatedItems: [
                { title: t('nav.shifts'), href: '/shifts', description: t('shifts.title') },
                { title: t('nav.orders'), href: '/orders', description: t('orders.title') },
                { title: t('nav.reports'), href: '/reports/daily', description: t('reports.title') },
            ],
        },
        'roles': {
            name: t('nav.roles'),
            description: t('roles.title'),
            relatedItems: [
                { title: t('nav.roles'), href: '/roles', description: t('roles.title') },
                { title: t('nav.settings'), href: '/settings/profile', description: t('settings.title') },
            ],
        },
        'backup': {
            name: t('nav.backup'),
            description: t('backup.title'),
            relatedItems: [
                { title: t('nav.backup'), href: '/backup', description: t('backup.title') },
                { title: t('nav.settings'), href: '/settings/profile', description: t('settings.title') },
            ],
        },
    };
}

/**
 * Get way definition for a specific route
 */
export function getWayDefinition(route: string, t: (key: string) => string): WayDefinition | null {
    const definitions = getWayDefinitions(t);
    
    // Normalize route
    const normalizedRoute = route.replace(/^\//, '').split('/')[0];
    
    // Check exact match
    if (definitions[normalizedRoute]) {
        return definitions[normalizedRoute];
    }
    
    // Check for partial matches (e.g., purchase-orders -> purchase-orders)
    for (const [key, value] of Object.entries(definitions)) {
        if (normalizedRoute.includes(key) || key.includes(normalizedRoute)) {
            return value;
        }
    }
    
    return null;
}

/**
 * Get related items for a breadcrumb item
 */
export function getRelatedItemsForBreadcrumb(
    breadcrumb: BreadcrumbItem,
    t: (key: string) => string,
    currentWayId?: number | null
): WayRelatedItem[] {
    const href = breadcrumb.href;
    const wayDef = getWayDefinition(href, t);
    
    if (wayDef) {
        // If current way is selected, add way_id to related items URLs
        const relatedItems = wayDef.relatedItems.map(item => {
            if (currentWayId) {
                const url = new URL(item.href, window.location.origin);
                url.searchParams.set('way', currentWayId.toString());
                return {
                    ...item,
                    href: url.pathname + url.search,
                };
            }
            return item;
        });
        
        return relatedItems;
    }
    
    return [];
}
