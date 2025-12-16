import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Search, Eye, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import Pagination from '@/components/pagination';
import { useTranslation } from '@/hooks/use-translation';
import { useState, useRef } from 'react';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';

interface Refund {
    id: number;
    refund_number: string;
    type: string;
    status: string;
    amount: number;
    created_at: string;
    order: {
        id: number;
        order_number: string;
    } | null;
    user: {
        name: string;
    } | null;
}

interface RefundsPageProps {
    refunds: {
        data: Refund[];
        links: any;
    };
    filters: {
        search?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
    };
}

export default function RefundsIndex({ refunds, filters }: RefundsPageProps) {
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

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            completed: 'default',
            pending: 'secondary',
            cancelled: 'destructive',
        };
        return variants[status] || 'secondary';
    };

    const getTypeLabel = (type: string) => {
        return type === 'full' ? t('refunds.full') : t('refunds.partial');
    };

    const handleFilter = (key: string, value: string) => {
        router.get('/refunds', {
            ...filters,
            [key]: value || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: t('refunds.title'), href: '/refunds' }]}>
            <Head title={t('refunds.title')} />
            <div className="flex h-full flex-1 flex-col gap-2 overflow-x-auto rounded-lg p-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">{t('refunds.title')}</h1>
                        <p className="text-muted-foreground">{t('refunds.title')}</p>
                    </div>
                </div>

                {/* Filters */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="pt-3">
                        <div className="grid gap-2 md:grid-cols-4">
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
                                value={filters.status || 'all'}
                                onValueChange={(value) => handleFilter('status', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('refunds.status')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('common.all')}</SelectItem>
                                    <SelectItem value="completed">{t('refunds.completed')}</SelectItem>
                                    <SelectItem value="pending">{t('refunds.pending')}</SelectItem>
                                    <SelectItem value="cancelled">{t('refunds.cancelled')}</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                type="date"
                                value={filters.date_from || ''}
                                onChange={(e) => handleFilter('date_from', e.target.value)}
                                placeholder={t('common.from')}
                            />
                            <Input
                                type="date"
                                value={filters.date_to || ''}
                                onChange={(e) => handleFilter('date_to', e.target.value)}
                                placeholder={t('common.to')}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Refunds Table */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('refunds.title')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {refunds.data.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                {t('common.no_data')}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2 font-medium">{t('refunds.refund_number')}</th>
                                            <th className="text-left p-2 font-medium">{t('refunds.order_number')}</th>
                                            <th className="text-left p-2 font-medium">{t('refunds.type')}</th>
                                            <th className="text-left p-2 font-medium">{t('refunds.amount')}</th>
                                            <th className="text-left p-2 font-medium">{t('refunds.status')}</th>
                                            <th className="text-left p-2 font-medium">{t('refunds.created_at')}</th>
                                            <th className="text-left p-2 font-medium">{t('common.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {refunds.data.map((refund) => (
                                            <tr key={refund.id} className="border-b hover:bg-muted/50">
                                                <td className="p-2">{refund.refund_number}</td>
                                                <td className="p-2">
                                                    {refund.order ? (
                                                        <Link href={`/orders/${refund.order.id}`} className="text-primary hover:underline">
                                                            {refund.order.order_number}
                                                        </Link>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="p-2">{getTypeLabel(refund.type)}</td>
                                                <td className="p-2">{formatCurrency(refund.amount)}</td>
                                                <td className="p-2">
                                                    <Badge variant={getStatusBadge(refund.status)}>
                                                        {t(`refunds.${refund.status}`)}
                                                    </Badge>
                                                </td>
                                                <td className="p-2">{new Date(refund.created_at).toLocaleDateString()}</td>
                                                <td className="p-2">
                                                    <Link href={`/refunds/${refund.id}`}>
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
                        <Pagination links={refunds.links} />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
