import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, router, Link } from '@inertiajs/react';
import { Plus, Search, Eye, Trash2, ShoppingBag, Calendar, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';
import { useDebounce } from '@/hooks/use-debounce';
import Pagination from '@/components/pagination';

interface PurchaseOrder {
    id: number;
    po_number: string;
    supplier: { id: number; name: string };
    user: { id: number; name: string };
    order_date: string;
    expected_delivery_date: string | null;
    status: string;
    total: number;
    created_at: string;
}

interface PurchaseOrdersPageProps {
    purchaseOrders: {
        data: PurchaseOrder[];
        links: any;
    };
    suppliers: Array<{ id: number; name: string }>;
    filters: {
        search?: string;
        status?: string;
        supplier_id?: number;
        date_from?: string;
        date_to?: string;
    };
}

export default function PurchaseOrdersIndex({ purchaseOrders, suppliers, filters }: PurchaseOrdersPageProps) {
    const { t, currentLanguage } = useTranslation();
    const [searchInput, setSearchInput] = useState(filters.search || '');
    const debouncedSearch = useDebounce(searchInput, 500);

    // Debounced search effect
    useEffect(() => {
        if (debouncedSearch !== filters.search) {
            router.get('/purchase-orders', {
                search: debouncedSearch || undefined,
                status: filters.status,
                supplier_id: filters.supplier_id,
                date_from: filters.date_from,
                date_to: filters.date_to,
            }, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    }, [debouncedSearch, filters.status, filters.supplier_id, filters.date_from, filters.date_to]);

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
            draft: { label: t('purchase_orders.draft'), variant: 'outline' },
            pending: { label: t('purchase_orders.pending'), variant: 'secondary' },
            approved: { label: t('purchase_orders.approved'), variant: 'default' },
            received: { label: t('purchase_orders.received'), variant: 'default' },
            cancelled: { label: t('purchase_orders.cancelled'), variant: 'destructive' },
        };
        const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const };
        return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
    };

    return (
        <AppLayout breadcrumbs={[{ title: t('nav.purchase_orders'), href: '/purchase-orders' }]}>
            <Head title={t('purchase_orders.title')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('purchase_orders.title')}</h1>
                        <p className="text-muted-foreground">{t('purchase_orders.title')}</p>
                    </div>
                    <Button asChild className="backdrop-blur-sm bg-primary/90">
                        <Link href="/purchase-orders/create">
                            <Plus className="mr-2 h-4 w-4" />
                            {t('purchase_orders.add_po')}
                        </Link>
                    </Button>
                </div>

                {/* Filters */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={t('common.search')}
                                    className="pl-10"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                />
                            </div>
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(value) => {
                                    router.get('/purchase-orders', {
                                        ...filters,
                                        status: value === 'all' ? undefined : value,
                                    }, {
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('purchase_orders.status')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('common.all')}</SelectItem>
                                    <SelectItem value="draft">{t('purchase_orders.draft')}</SelectItem>
                                    <SelectItem value="pending">{t('purchase_orders.pending')}</SelectItem>
                                    <SelectItem value="approved">{t('purchase_orders.approved')}</SelectItem>
                                    <SelectItem value="received">{t('purchase_orders.received')}</SelectItem>
                                    <SelectItem value="cancelled">{t('purchase_orders.cancelled')}</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.supplier_id?.toString() || 'all'}
                                onValueChange={(value) => {
                                    router.get('/purchase-orders', {
                                        ...filters,
                                        supplier_id: value === 'all' ? undefined : parseInt(value),
                                    }, {
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('purchase_orders.supplier')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('common.all')}</SelectItem>
                                    {suppliers.map((supplier) => (
                                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                            {supplier.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex gap-2">
                                <Input
                                    type="date"
                                    value={filters.date_from || ''}
                                    onChange={(e) => {
                                        router.get('/purchase-orders', {
                                            ...filters,
                                            date_from: e.target.value || undefined,
                                        }, {
                                            preserveState: true,
                                            preserveScroll: true,
                                        });
                                    }}
                                    placeholder={t('common.from')}
                                />
                                <Input
                                    type="date"
                                    value={filters.date_to || ''}
                                    onChange={(e) => {
                                        router.get('/purchase-orders', {
                                            ...filters,
                                            date_to: e.target.value || undefined,
                                        }, {
                                            preserveState: true,
                                            preserveScroll: true,
                                        });
                                    }}
                                    placeholder={t('common.to')}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Purchase Orders List */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {purchaseOrders.data.map((po) => (
                                <div
                                    key={po.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                                            <h3 className="font-semibold">{po.po_number}</h3>
                                            {getStatusBadge(po.status)}
                                        </div>
                                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Truck className="h-4 w-4" />
                                                {po.supplier.name}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                {new Date(po.order_date).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                                {po.expected_delivery_date && (
                                                    <> - {new Date(po.expected_delivery_date).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}</>
                                                )}
                                            </div>
                                            <div className="font-semibold text-primary">
                                                {formatCurrency(po.total, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/purchase-orders/${po.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        {po.status !== 'received' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    if (confirm(t('common.delete') + '?')) {
                                                        router.delete(`/purchase-orders/${po.id}`);
                                                    }
                                                }}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {purchaseOrders.data.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    {t('purchase_orders.no_orders')}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Pagination links={purchaseOrders.links} />
            </div>
        </AppLayout>
    );
}

