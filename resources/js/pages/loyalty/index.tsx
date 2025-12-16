import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Search, Eye, Star } from 'lucide-react';
import Pagination from '@/components/pagination';
import { useTranslation } from '@/hooks/use-translation';
import { useState, useRef } from 'react';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';

interface Customer {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    loyalty_points: number;
    loyalty_tier: string;
    total_spent: number;
    total_orders: number;
}

interface LoyaltyPageProps {
    customers: {
        data: Customer[];
        links: any;
    };
    filters: {
        search?: string;
        tier?: string;
    };
}

export default function LoyaltyIndex({ customers, filters }: LoyaltyPageProps) {
    const { t } = useTranslation();
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Keyboard shortcuts
    useKeyboardShortcut([
        {
            key: '/',
            callback: () => {
                searchInputRef.current?.focus();
                searchInputRef.current?.select();
            },
            description: t('shortcuts.focus_search'),
        },
    ]);

    const getTierBadge = (tier: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            bronze: 'secondary',
            silver: 'default',
            gold: 'outline',
            platinum: 'default',
        };
        return variants[tier] || 'secondary';
    };

    const getTierLabel = (tier: string) => {
        return t(`loyalty.tier_${tier}`) || tier;
    };

    const handleFilter = (key: string, value: string) => {
        router.get('/loyalty', {
            ...filters,
            [key]: value || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: t('loyalty.title'), href: '/loyalty' }]}>
            <Head title={t('loyalty.title')} />
            <div className="flex h-full flex-1 flex-col gap-2 overflow-x-auto rounded-lg p-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">{t('loyalty.title')}</h1>
                        <p className="text-muted-foreground">{t('loyalty.description')}</p>
                    </div>
                </div>

                {/* Filters */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="pt-3">
                        <div className="grid gap-2 md:grid-cols-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    ref={searchInputRef}
                                    placeholder={t('common.search')}
                                    value={filters.search || ''}
                                    onChange={(e) => handleFilter('search', e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <Select
                                value={filters.tier || 'all'}
                                onValueChange={(value) => handleFilter('tier', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('loyalty.tier')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('common.all')}</SelectItem>
                                    <SelectItem value="bronze">{t('loyalty.tier_bronze')}</SelectItem>
                                    <SelectItem value="silver">{t('loyalty.tier_silver')}</SelectItem>
                                    <SelectItem value="gold">{t('loyalty.tier_gold')}</SelectItem>
                                    <SelectItem value="platinum">{t('loyalty.tier_platinum')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Customers Table */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('loyalty.customers')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {customers.data.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                {t('common.no_data')}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2 font-medium">{t('customers.name')}</th>
                                            <th className="text-left p-2 font-medium">{t('customers.email')}</th>
                                            <th className="text-left p-2 font-medium">{t('customers.phone')}</th>
                                            <th className="text-left p-2 font-medium">{t('loyalty.points')}</th>
                                            <th className="text-left p-2 font-medium">{t('loyalty.tier')}</th>
                                            <th className="text-left p-2 font-medium">{t('customers.total_spent')}</th>
                                            <th className="text-left p-2 font-medium">{t('customers.total_orders')}</th>
                                            <th className="text-left p-2 font-medium">{t('common.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customers.data.map((customer) => (
                                            <tr key={customer.id} className="border-b hover:bg-muted/50">
                                                <td className="p-2">{customer.name}</td>
                                                <td className="p-2">{customer.email || '-'}</td>
                                                <td className="p-2">{customer.phone || '-'}</td>
                                                <td className="p-2">
                                                    <Badge variant="outline">
                                                        <Star className="mr-1 h-3 w-3" />
                                                        {customer.loyalty_points}
                                                    </Badge>
                                                </td>
                                                <td className="p-2">
                                                    <Badge variant={getTierBadge(customer.loyalty_tier)}>
                                                        {getTierLabel(customer.loyalty_tier)}
                                                    </Badge>
                                                </td>
                                                <td className="p-2">{customer.total_spent.toFixed(2)}</td>
                                                <td className="p-2">{customer.total_orders}</td>
                                                <td className="p-2">
                                                    <Link href={`/loyalty/${customer.id}`}>
                                                        <Button variant="ghost" size="icon" title={t('common.view')}>
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <Pagination links={customers.links} />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
