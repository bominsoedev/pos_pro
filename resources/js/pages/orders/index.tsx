import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Search, Eye, Calendar, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import Pagination from '@/components/pagination';
import { useTranslation } from '@/hooks/use-translation';

interface Order {
    id: number;
    order_number: string;
    status: string;
    payment_status: string;
    total: number;
    created_at: string;
    customer: { name: string } | null;
    user: { name: string } | null;
}

interface OrdersPageProps {
    orders: {
        data: Order[];
        links: any;
    };
    filters: {
        search?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
    };
}

export default function OrdersIndex({ orders, filters }: OrdersPageProps) {
    const { t, currentLanguage } = useTranslation();

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            completed: 'default',
            pending: 'secondary',
            cancelled: 'destructive',
            refunded: 'outline',
        };
        return variants[status] || 'secondary';
    };

    return (
        <AppLayout breadcrumbs={[{ title: t('nav.orders'), href: '/orders' }]}>
            <Head title={t('orders.title')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('orders.title')}</h1>
                        <p className="text-muted-foreground">{t('orders.title')}</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => {
                            const params = new URLSearchParams();
                            if (filters.date_from) params.append('date_from', filters.date_from);
                            if (filters.date_to) params.append('date_to', filters.date_to);
                            if (filters.status) params.append('status', filters.status);
                            window.location.href = `/export/orders?${params.toString()}`;
                        }}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        {t('products.export_csv')}
                    </Button>
                </div>

                {/* Filters */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={t('orders.title') + '...'}
                                    className="pl-10"
                                    defaultValue={filters.search}
                                    onChange={(e) => {
                                        router.get('/orders', {
                                            search: e.target.value,
                                            status: filters.status,
                                            date_from: filters.date_from,
                                            date_to: filters.date_to,
                                        }, {
                                            preserveState: true,
                                            preserveScroll: true,
                                        });
                                    }}
                                />
                            </div>
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(value) => {
                                    router.get('/orders', {
                                        search: filters.search,
                                        status: value === 'all' ? null : value,
                                        date_from: filters.date_from,
                                        date_to: filters.date_to,
                                    }, {
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('orders.all_status')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('orders.all_status')}</SelectItem>
                                    <SelectItem value="pending">{t('orders.pending')}</SelectItem>
                                    <SelectItem value="completed">{t('orders.completed')}</SelectItem>
                                    <SelectItem value="cancelled">{t('orders.cancelled')}</SelectItem>
                                    <SelectItem value="refunded">{t('orders.refunded')}</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                type="date"
                                placeholder={t('orders.from_date')}
                                defaultValue={filters.date_from}
                                onChange={(e) => {
                                    router.get('/orders', {
                                        search: filters.search,
                                        status: filters.status,
                                        date_from: e.target.value,
                                        date_to: filters.date_to,
                                    }, {
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                }}
                            />
                            <Input
                                type="date"
                                placeholder={t('orders.to_date')}
                                defaultValue={filters.date_to}
                                onChange={(e) => {
                                    router.get('/orders', {
                                        search: filters.search,
                                        status: filters.status,
                                        date_from: filters.date_from,
                                        date_to: e.target.value,
                                    }, {
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Orders Table */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="pt-6">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">{t('orders.order_number')}</th>
                                        <th className="text-left p-2">{t('orders.customer')}</th>
                                        <th className="text-left p-2">{t('orders.cashier')}</th>
                                        <th className="text-left p-2">{t('orders.status')}</th>
                                        <th className="text-left p-2">{t('orders.payment')}</th>
                                        <th className="text-right p-2">{t('orders.total')}</th>
                                        <th className="text-left p-2">{t('orders.date')}</th>
                                        <th className="text-right p-2">{t('inventory.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.data.map((order) => (
                                        <tr key={order.id} className="border-b hover:bg-muted/50">
                                            <td className="p-2 font-medium">{order.order_number}</td>
                                            <td className="p-2">{order.customer?.name || t('pos.walk_in')}</td>
                                            <td className="p-2">{order.user?.name || '-'}</td>
                                            <td className="p-2">
                                                <Badge variant={getStatusBadge(order.status)}>
                                                    {t(`orders.${order.status}`)}
                                                </Badge>
                                            </td>
                                            <td className="p-2">
                                                <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                                                    {t(`orders.${order.payment_status}`)}
                                                </Badge>
                                            </td>
                                            <td className="p-2 text-right font-bold">{formatCurrency(order.total, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</td>
                                            <td className="p-2 text-sm text-muted-foreground">
                                                {new Date(order.created_at).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                            </td>
                                            <td className="p-2 text-right">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    asChild
                                                >
                                                    <Link href={`/orders/${order.id}`}>
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        {t('orders.view')}
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {orders.data.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    {t('common.no_data')}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination */}
                <Pagination links={orders.links} />
            </div>
        </AppLayout>
    );
}

