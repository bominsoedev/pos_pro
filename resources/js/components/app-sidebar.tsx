import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';
import { 
    BookOpen, 
    Folder, 
    LayoutGrid, 
    ShoppingCart, 
    Package, 
    FolderTree, 
    Users, 
    Receipt,
    BarChart3,
    Warehouse,
    AlertTriangle,
    Percent,
    Shield,
    Clock,
    Database,
    Truck,
    ShoppingBag,
    ReceiptText,
    PercentCircle
} from 'lucide-react';
import AppLogo from './app-logo';
import { LanguageSwitcher } from './language-switcher';

const getMainNavItems = (t: (key: string) => string): (NavItem & { shortcut?: string })[] => [
    {
        title: t('nav.dashboard'),
        href: dashboard(),
        icon: LayoutGrid,
        shortcut: 'Ctrl+1',
    },
    {
        title: t('nav.pos'),
        href: '/pos',
        icon: ShoppingCart,
        shortcut: 'Ctrl+2',
    },
    {
        title: t('nav.products'),
        href: '/products',
        icon: Package,
        shortcut: 'Ctrl+3',
    },
    {
        title: t('nav.categories'),
        href: '/categories',
        icon: FolderTree,
        shortcut: 'Ctrl+4',
    },
    {
        title: t('nav.customers'),
        href: '/customers',
        icon: Users,
        shortcut: 'Ctrl+5',
    },
    {
        title: t('nav.orders'),
        href: '/orders',
        icon: Receipt,
        shortcut: 'Ctrl+6',
    },
    {
        title: t('nav.inventory'),
        href: '/inventory',
        icon: Warehouse,
        shortcut: 'Ctrl+7',
    },
    {
        title: t('nav.discounts'),
        href: '/discounts',
        icon: Percent,
        shortcut: 'Ctrl+8',
    },
    {
        title: t('nav.reports'),
        href: '/reports/daily',
        icon: BarChart3,
        shortcut: 'Ctrl+9',
    },
    {
        title: t('nav.shifts'),
        href: '/shifts',
        icon: Clock,
        shortcut: 'Ctrl+0',
    },
    {
        title: t('nav.roles'),
        href: '/roles',
        icon: Shield,
        shortcut: 'Ctrl+Shift+R',
    },
    {
        title: t('nav.backup'),
        href: '/backup',
        icon: Database,
        shortcut: 'Ctrl+Shift+U',
    },
    {
        title: t('nav.suppliers'),
        href: '/suppliers',
        icon: Truck,
        shortcut: 'Ctrl+Shift+S',
    },
    {
        title: t('nav.purchase_orders'),
        href: '/purchase-orders',
        icon: ShoppingBag,
        shortcut: 'Ctrl+Shift+P',
    },
    {
        title: t('nav.expenses'),
        href: '/expenses',
        icon: ReceiptText,
        shortcut: 'Ctrl+Shift+E',
    },
    {
        title: t('nav.tax_rates'),
        href: '/tax-rates',
        icon: PercentCircle,
        shortcut: 'Ctrl+Shift+T',
    },
];

 

export function AppSidebar() {
    const { t } = useTranslation();
    const mainNavItems = getMainNavItems(t);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter> 
                <div className="px-2 py-2 border-t border-sidebar-border/70">
                    <LanguageSwitcher variant="sidebar" />
                </div>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
