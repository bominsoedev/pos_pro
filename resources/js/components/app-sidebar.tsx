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
import { useMemo } from 'react';
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
    PercentCircle,
    MapPin,
    FileText,
    ArrowLeftRight,
    Gift,
    DollarSign,
    History,
    Layers,
    Star
} from 'lucide-react';
import AppLogo from './app-logo';
import { LanguageSwitcher } from './language-switcher';

const getMainNavItems = (t: (key: string) => string): NavItem[] => [
    {
        title: t('nav.dashboard'),
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: t('nav.pos'),
        href: '/pos',
        icon: ShoppingCart,
    },
    {
        title: t('nav.products'),
        href: '/products',
        icon: Package,
    },
    {
        title: t('nav.bundles'),
        href: '/bundles',
        icon: Layers,
    },
    {
        title: t('nav.categories'),
        href: '/categories',
        icon: FolderTree,
    },
    {
        title: t('nav.customers'),
        href: '/customers',
        icon: Users,
    },
    {
        title: t('nav.loyalty'),
        href: '/loyalty',
        icon: Star,
    },
    {
        title: t('nav.orders'),
        href: '/orders',
        icon: Receipt,
    },
    {
        title: t('nav.inventory'),
        href: '/inventory',
        icon: Warehouse,
    },
    {
        title: t('nav.discounts'),
        href: '/discounts',
        icon: Percent,
    },
    {
        title: t('nav.reports'),
        href: '/reports/daily',
        icon: BarChart3,
    },
    {
        title: t('nav.shifts'),
        href: '/shifts',
        icon: Clock,
    },
    {
        title: t('nav.roles'),
        href: '/roles',
        icon: Shield,
    },
    {
        title: t('nav.backup'),
        href: '/backup',
        icon: Database,
    },
    {
        title: t('nav.suppliers'),
        href: '/suppliers',
        icon: Truck,
    },
    {
        title: t('nav.purchase_orders'),
        href: '/purchase-orders',
        icon: ShoppingBag,
    },
    {
        title: t('nav.expenses'),
        href: '/expenses',
        icon: ReceiptText,
    },
    {
        title: t('nav.tax_rates'),
        href: '/tax-rates',
        icon: PercentCircle,
    },
    {
        title: t('nav.ways'),
        href: '/ways',
        icon: MapPin,
    },
    {
        title: t('nav.quotations'),
        href: '/quotations',
        icon: FileText,
    },
    {
        title: t('nav.stock_transfers'),
        href: '/stock-transfers',
        icon: ArrowLeftRight,
    },
    {
        title: t('nav.gift_cards'),
        href: '/gift-cards',
        icon: Gift,
    },
    {
        title: t('nav.currencies'),
        href: '/currencies',
        icon: DollarSign,
    },
    {
        title: t('nav.activity_logs'),
        href: '/activity-logs',
        icon: History,
    },
];

 

export function AppSidebar() {
    const { t, currentLanguage } = useTranslation();
    const mainNavItems = useMemo(() => getMainNavItems(t), [t, currentLanguage]);

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
                <div className="px-2">
                    <NavUser />
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
