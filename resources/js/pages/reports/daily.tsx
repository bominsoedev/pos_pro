import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, router, Link } from '@inertiajs/react';
import { 
    DollarSign, 
    ShoppingCart, 
    Package, 
    Calendar,
    Download,
    TrendingUp,
    CreditCard,
    Banknote
} from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface Order {
    id: number;
    order_number: string;
    total: number;
    created_at: string;
    user: { name: string } | null;
    items: Array<{ quantity: number }>;
}

interface TopProduct {
    id: number;
    name: string;
    total_sold: number;
    total_revenue: number;
}

interface DailyReportProps {
    date: string;
    stats: {
        total_sales: number;
        total_orders: number;
        total_items: number;
        cash_sales: number;
        card_sales: number;
        other_sales: number;
    };
    orders: Order[];
    topProducts: TopProduct[];
}

export default function DailyReport({ date, stats, orders, topProducts }: DailyReportProps) {
    const { t } = useTranslation();

    const handleDateChange = (newDate: string) => {
        router.get('/reports/daily', { date: newDate }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.reports'), href: '/reports/daily' },
            { title: t('reports.daily'), href: '/reports/daily' },
        ]}>
            <Head title={t('reports.daily')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold">{t('reports.daily')}</h1>
                        <p className="text-muted-foreground">{t('reports.daily')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => handleDateChange(e.target.value)}
                            className="w-auto"
                        />
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    window.location.href = `/export/daily-report?date=${date}`;
                                }}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                {t('products.export_csv')}
                            </Button>
                            <Button onClick={handlePrint} variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                {t('common.print')}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Report Navigation */}
                <div className="flex gap-2 print:hidden">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/reports/daily">{t('reports.daily')}</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/reports/monthly">{t('reports.monthly')}</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/reports/yearly">{t('reports.yearly')}</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/reports/product-performance">{t('reports.product_performance')}</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/reports/cash-register">{t('reports.cash_register')}</Link>
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-2">
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('reports.total_sales')}</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.total_sales)}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.total_orders} {t('reports.orders')}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('reports.total_items')}</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_items}</div>
                            <p className="text-xs text-muted-foreground">
                                {t('reports.items_sold')}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('reports.cash_sales')}</CardTitle>
                            <Banknote className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.cash_sales)}</div>
                            <p className="text-xs text-muted-foreground">
                                {((stats.cash_sales / stats.total_sales) * 100 || 0).toFixed(1)}% {t('reports.of_total')}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('reports.card_sales')}</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.card_sales)}</div>
                            <p className="text-xs text-muted-foreground">
                                {((stats.card_sales / stats.total_sales) * 100 || 0).toFixed(1)}% {t('reports.of_total')}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Top Products */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('dashboard.top_products')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {topProducts.length > 0 ? (
                                    topProducts.map((product) => (
                                        <div key={product.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                                            <div>
                                                <p className="font-medium">{product.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {product.total_sold} {t('reports.sold')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{formatCurrency(product.total_revenue)}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">{t('common.no_data')}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Orders */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('dashboard.recent_orders')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {orders.length > 0 ? (
                                    orders.slice(0, 10).map((order) => (
                                        <div key={order.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                                            <div>
                                                <Link href={`/orders/${order.id}`} className="font-medium hover:underline">
                                                    {order.order_number}
                                                </Link>
                                                <p className="text-sm text-muted-foreground">
                                                    {order.user?.name || t('reports.unknown')} • {order.items.reduce((sum, item) => sum + item.quantity, 0)} {t('orders.items')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{formatCurrency(order.total)}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(order.created_at).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">{t('common.no_data')}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Payment Methods Breakdown */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('reports.payment_methods_breakdown')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Banknote className="h-4 w-4 text-muted-foreground" />
                                    <span>{t('pos.payment_method_cash')}</span>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">{formatCurrency(stats.cash_sales)}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {((stats.cash_sales / stats.total_sales) * 100 || 0).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                    <span>{t('pos.payment_method_card')}</span>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">{formatCurrency(stats.card_sales)}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {((stats.card_sales / stats.total_sales) * 100 || 0).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                            {stats.other_sales > 0 && (
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                        <span>{t('reports.other_methods')}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{formatCurrency(stats.other_sales)}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {((stats.other_sales / stats.total_sales) * 100 || 0).toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <style>{`
                @media print {
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </AppLayout>
    );
}

