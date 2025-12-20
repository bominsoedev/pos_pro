import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { 
    DollarSign, 
    ShoppingCart, 
    Package, 
    Download,
    TrendingUp,
    BarChart3
} from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import { formatCurrency } from '@/lib/currency';
import { Link } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';

interface MonthlyStat {
    month: number;
    month_name: string;
    sales: number;
    orders: number;
}

interface YearlyReportProps {
    year: number;
    stats: {
        total_sales: number;
        total_orders: number;
        total_items: number;
        average_order_value: number;
    };
    monthlyStats: MonthlyStat[];
}

export default function YearlyReport({ year, stats, monthlyStats }: YearlyReportProps) {
    const { t, currentLanguage } = useTranslation();
    const handleYearChange = (newYear: number) => {
        router.get('/reports/yearly', { year: newYear }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.reports'), href: '/reports/daily' },
            { title: t('reports.yearly'), href: '/reports/yearly' },
        ]}>
            <Head title={t('reports.yearly')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold">{t('reports.yearly')}</h1>
                        <p className="text-muted-foreground">{year}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select
                            value={year.toString()}
                            onValueChange={(value) => handleYearChange(parseInt(value))}
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
                        <Button 
                            onClick={() => {
                                window.location.href = `/export/yearly-report?year=${year}`;
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
                            <CardTitle className="text-sm font-medium">{t('reports.total_orders')}</CardTitle>
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_orders}</div>
                            <p className="text-xs text-muted-foreground">
                                {t('reports.completed_orders')}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Monthly Breakdown */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('reports.monthly_breakdown')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">{t('reports.month')}</th>
                                        <th className="text-right p-2">{t('reports.sales')}</th>
                                        <th className="text-right p-2">{t('reports.orders')}</th>
                                        <th className="text-right p-2">{t('reports.avg_per_order')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthlyStats.map((month) => {
                                        const avgOrder = month.orders > 0 ? month.sales / month.orders : 0;
                                        return (
                                            <tr key={month.month} className="border-b hover:bg-muted/50">
                                                <td className="p-2 font-medium">{month.month_name}</td>
                                                <td className="p-2 text-right font-bold">{formatCurrency(month.sales, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</td>
                                                <td className="p-2 text-right">{month.orders}</td>
                                                <td className="p-2 text-right">{formatCurrency(avgOrder, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 font-bold">
                                        <td className="p-2">{t('pos.total')}</td>
                                        <td className="p-2 text-right">{formatCurrency(stats.total_sales, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</td>
                                        <td className="p-2 text-right">{stats.total_orders}</td>
                                        <td className="p-2 text-right">{formatCurrency(stats.average_order_value, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</td>
                                    </tr>
                                </tfoot>
                            </table>
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

