import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { resolveUrl } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { formatShortcutKey } from '@/lib/platform';
import { useTranslation } from '@/hooks/use-translation';

export function NavMain({ items = [] }: { items: (NavItem & { shortcut?: string })[] }) {
    const { t } = useTranslation();
    const page = usePage();
    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>{t('common.platform')}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={page.url.startsWith(
                                resolveUrl(item.href),
                            )}
                            tooltip={{ children: item.title }}
                        >
                            <Link href={item.href} prefetch className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                {item.icon && <item.icon />}
                                    <span className="truncate">{item.title}</span>
                                </div>
                                {item.shortcut && (
                                    <kbd className="ml-auto px-1.5 py-0.5 text-xs font-semibold text-sidebar-foreground/50 bg-sidebar-accent/50 border border-sidebar-border rounded shrink-0 group-data-[collapsible=icon]:hidden">
                                        {formatShortcutKey(item.shortcut)}
                                    </kbd>
                                )}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
