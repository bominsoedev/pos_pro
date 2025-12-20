import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, router, Link } from '@inertiajs/react';
import { 
    DollarSign, 
    ShoppingCart, 
    Package, 
    Calendar,
    Download,
    TrendingUp,
    BarChart3
} from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface DailyStat {
    date: string;
    sales: number;
    orders: number;
}

interface TopProduct {
    id: number;
    name: string;
    total_sold: number;
    total_revenue: number;
}

interface MonthlyReportProps {
    year: number;
    month: number;
    stats: {
        total_sales: number;
        total_orders: number;
        total_items: number;
        average_order_value: number;
        cash_sales: number;
        card_sales: number;
    };
    dailyStats: DailyStat[];
    topProducts: TopProduct[];
}

export default function MonthlyReport({ year, month, stats, dailyStats, topProducts }: MonthlyReportProps) {
    const { t, currentLanguage } = useTranslation();
    const monthName = new Date(year, month - 1).toLocaleString(currentLanguage === 'my' ? 'my-MM' : 'en-US', { month: 'long' });

    const handleDateChange = (newYear: number, newMonth: number) => {
        router.get('/reports/monthly', { year: newYear, month: newMonth }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.reports'), href: '/reports/daily' },
            { title: t('reports.monthly'), href: '/reports/monthly' },
        ]}>
            <Head title={t('reports.monthly')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold">{t('reports.monthly')}</h1>
                        <p className="text-muted-foreground">{monthName} {year}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select
                            value={year.toString()}
                            onValueChange={(value) => handleDateChange(parseInt(value), month)}
                        >
                            <SelectTrigger className="w-[120px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map((y) => (
                                    <SelectItem key={y} value={y.toString()}>
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={month.toString()}
                            onValueChange={(value) => handleDateChange(year, parseInt(value))}
                        >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map((m) => (
                                    <SelectItem key={m} value={m.toString()}>
                                        {new Date(year, m - 1).toLocaleString(currentLanguage === 'my' ? 'my-MM' : 'en-US', { month: 'long' })}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button 
                            onClick={() => {
                                window.location.href = `/export/monthly-report?year=${year}&month=${month}`;
                            }}
                            variant="outline"
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

                {/* Report Navigation */}
                <div className="flex gap-2 print:hidden flex-wrap">
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
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/reports/profit-loss">{t('reports.profit_loss')}</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/reports/sales-by-employee">{t('reports.sales_by_employee')}</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/reports/customer-analytics">{t('reports.customer_analytics')}</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/reports/inventory-valuation">{t('reports.inventory_valuation')}</Link>
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
                            <div className="text-2xl font-bold">{formatCurrency(stats.total_sales, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</div>
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
                            <CardTitle className="text-sm font-medium">{t('reports.average_order')}</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.average_order_value, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</div>
                            <p className="text-xs text-muted-foreground">
                                {t('reports.per_order')}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('reports.cash_sales')}</CardTitle>
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.cash_sales, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</div>
                            <p className="text-xs text-muted-foreground">
                                {((stats.cash_sales / stats.total_sales) * 100 || 0).toFixed(1)}% {t('reports.of_total')}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Daily Breakdown */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('reports.daily_breakdown')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {dailyStats.map((day) => (
                                    <div key={day.date} className="flex items-center justify-between border-b pb-2">
                                        <div>
                                            <p className="font-medium">
                                                {new Date(day.date).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US', { 
                                                    month: 'short', 
                                                    day: 'numeric' 
                                                })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{formatCurrency(day.sales, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</p>
                                            <p className="text-xs text-muted-foreground">{day.orders} {t('reports.orders')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

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
                                                <p className="font-medium">{formatCurrency(product.total_revenue, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</p>
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

