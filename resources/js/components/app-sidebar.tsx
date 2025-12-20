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
    Star,
    Calculator
} from 'lucide-react';
import AppLogo from './app-logo';
import { LanguageSwitcher } from './language-switcher';
import { usePage } from '@inertiajs/react';

const getMainNavItems = (t: (key: string) => string, features: Record<string, boolean> = {}): NavItem[] => {
    const items: NavItem[] = [
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
    ...(features.bundles !== false ? [{
        title: t('nav.bundles'),
        href: '/bundles',
        icon: Layers,
    }] : []),
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
    ...(features.loyalty !== false ? [{
        title: t('nav.loyalty'),
        href: '/loyalty',
        icon: Star,
    }] : []),
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
    ...(features.roles !== false ? [{
        title: t('nav.roles'),
        href: '/roles',
        icon: Shield,
    }] : []),
    ...(features.backup !== false ? [{
        title: t('nav.backup'),
        href: '/backup',
        icon: Database,
    }] : []),
    ...(features.suppliers !== false ? [{
        title: t('nav.suppliers'),
        href: '/suppliers',
        icon: Truck,
    }] : []),
    ...(features.purchase_orders !== false ? [{
        title: t('nav.purchase_orders'),
        href: '/purchase-orders',
        icon: ShoppingBag,
    }] : []),
    ...(features.expenses !== false ? [{
        title: t('nav.expenses'),
        href: '/expenses',
        icon: ReceiptText,
    }] : []),
    ...(features.tax_rates !== false ? [{
        title: t('nav.tax_rates'),
        href: '/tax-rates',
        icon: PercentCircle,
    }] : []),
    ...(features.ways !== false ? [{
        title: t('nav.ways'),
        href: '/ways',
        icon: MapPin,
    }] : []),
    ...(features.quotations !== false ? [{
        title: t('nav.quotations'),
        href: '/quotations',
        icon: FileText,
    }] : []),
    ...(features.stock_transfers !== false ? [{
        title: t('nav.stock_transfers'),
        href: '/stock-transfers',
        icon: ArrowLeftRight,
    }] : []),
    ...(features.gift_cards !== false ? [{
        title: t('nav.gift_cards'),
        href: '/gift-cards',
        icon: Gift,
    }] : []),
    ...(features.currencies !== false ? [{
        title: t('nav.currencies'),
        href: '/currencies',
        icon: DollarSign,
    }] : []),
    ...(features.activity_logs !== false ? [{
        title: t('nav.activity_logs'),
        href: '/activity-logs',
        icon: History,
    }] : []),
    ...(features.accounting !== false ? [{
        title: t('nav.accounting'),
        href: '/accounting/dashboard',
        icon: Calculator,
    }] : []),
    ];
    
    return items;
};

 

export function AppSidebar() {
    const { t, currentLanguage } = useTranslation();
    const page = usePage();
    const features = (page.props as any)?.features || {};
    const mainNavItems = useMemo(() => getMainNavItems(t, features), [t, currentLanguage, features]);

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
