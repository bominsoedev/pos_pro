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
    Database
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
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
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
                <NavFooter items={footerNavItems} className="mt-auto" />
                <div className="px-2 py-2 border-t border-sidebar-border/70">
                    <LanguageSwitcher variant="sidebar" />
                </div>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
