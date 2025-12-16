import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { Fragment, useState } from 'react';
import { Home, ChevronDown, ExternalLink } from 'lucide-react';
import { getRelatedItemsForBreadcrumb, getWayDefinition } from '@/lib/way-names';
import { useTranslation } from '@/hooks/use-translation';

export function Breadcrumbs({
    breadcrumbs,
}: {
    breadcrumbs: BreadcrumbItemType[];
}) {
    const { t } = useTranslation();
    const page = usePage();
    const sharedData = page.props as any;
    const currentWayId = sharedData?.currentWay?.id || null;
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const handleItemClick = (href: string) => {
        router.visit(href);
        setOpenDropdown(null);
    };

    return (
        <>
            {breadcrumbs.length > 0 && (
                <Breadcrumb>
                    <BreadcrumbList className="flex items-center gap-1">
                        {breadcrumbs.map((item, index) => {
                            const isLast = index === breadcrumbs.length - 1;
                            const isFirst = index === 0;
                            const relatedItems = !isLast ? getRelatedItemsForBreadcrumb(item, t, currentWayId) : [];
                            const wayDef = !isLast ? getWayDefinition(item.href, t) : null;
                            const hasRelatedItems = relatedItems.length > 0;
                            const dropdownId = `breadcrumb-${index}`;
                            const isOpen = openDropdown === dropdownId;

                            return (
                                <Fragment key={index}>
                                    <BreadcrumbItem className="flex items-center">
                                        {isLast ? (
                                            <BreadcrumbPage className="flex items-center gap-1">
                                                {isFirst && <Home className="h-3.5 w-3.5" />}
                                                <span>{item.title}</span>
                                            </BreadcrumbPage>
                                        ) : hasRelatedItems ? (
                                            <>
                                                <BreadcrumbLink asChild>
                                                    <Link href={item.href} className="flex items-center gap-1 hover:text-primary transition-colors">
                                                        {isFirst && <Home className="h-3.5 w-3.5" />}
                                                        <span className="font-medium">{item.title}</span>
                                                    </Link>
                                                </BreadcrumbLink>
                                                <DropdownMenu open={isOpen} onOpenChange={(open) => setOpenDropdown(open ? dropdownId : null)}>
                                                    <DropdownMenuTrigger asChild>
                                                        <button 
                                                            className="flex items-center hover:text-primary transition-colors focus:outline-none rounded-sm px-0.5 ml-0.5"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                            }}
                                                        >
                                                            <ChevronDown className="h-3 w-3 opacity-50" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className="w-72">
                                                        {wayDef?.description && (
                                                            <>
                                                                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                                                                    {wayDef.description}
                                                                </DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                            </>
                                                        )}
                                                        <DropdownMenuLabel className="text-sm font-semibold">
                                                            {t('breadcrumbs.related_items')}
                                                        </DropdownMenuLabel>
                                                        {relatedItems.map((relatedItem, idx) => (
                                                            <DropdownMenuItem
                                                                key={idx}
                                                                onClick={() => handleItemClick(relatedItem.href)}
                                                                className="cursor-pointer"
                                                            >
                                                                <div className="flex flex-col gap-0.5 w-full">
                                                                    <div className="flex items-center gap-2 justify-between">
                                                                        <span className="text-sm font-medium">{relatedItem.title}</span>
                                                                        <ExternalLink className="h-3 w-3 opacity-50 flex-shrink-0" />
                                                                    </div>
                                                                    {relatedItem.description && (
                                                                        <span className="text-xs text-muted-foreground line-clamp-1">
                                                                            {relatedItem.description}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </>
                                        ) : (
                                            <BreadcrumbLink asChild>
                                                <Link href={item.href} className="flex items-center gap-1 hover:text-primary transition-colors">
                                                    {isFirst && <Home className="h-3.5 w-3.5" />}
                                                    <span>{item.title}</span>
                                                </Link>
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                    {!isLast && <BreadcrumbSeparator />}
                                </Fragment>
                            );
                        })}
                    </BreadcrumbList>
                </Breadcrumb>
            )}
        </>
    );
}
