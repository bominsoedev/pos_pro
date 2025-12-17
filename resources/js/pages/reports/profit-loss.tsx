import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Head, router, Link } from '@inertiajs/react';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface ProfitLossReportProps {
    date_from: string;
    date_to: string;
    revenue: number;
    cost_of_goods_sold: number;
    gross_profit: number;
    expenses: number;
    net_profit: number;
    gross_margin: number;
    net_margin: number;
    total_orders: number;
}

export default function ProfitLossReport({
    date_from,
    date_to,
    revenue,
    cost_of_goods_sold,
    gross_profit,
    expenses,
    net_profit,
    gross_margin,
    net_margin,
    total_orders,
}: ProfitLossReportProps) {
    const { t } = useTranslation();
    const [dateFrom, setDateFrom] = useState(date_from);
    const [dateTo, setDateTo] = useState(date_to);

    const handleFilter = () => {
        router.get('/reports/profit-loss', {
            date_from: dateFrom,
            date_to: dateTo,
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.reports'), href: '/reports' },
            { title: 'Profit & Loss', href: '/reports/profit-loss' },
        ]}>
            <Head title="Profit & Loss Report" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Profit & Loss Report</h1>
                        <p className="text-muted-foreground">Financial performance overview</p>
                    </div>
                </div>

                {/* Report Navigation */}
                <div className="flex gap-2 print:hidden flex-wrap mb-4">
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

                {/* Date Filters */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                            </div>
                            <span>{t('common.to')}</span>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                            <Button onClick={handleFilter}>Filter</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(revenue)}</div>
                            <p className="text-xs text-muted-foreground">{total_orders} orders</p>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">COGS</CardTitle>
                            <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{formatCurrency(cost_of_goods_sold)}</div>
                            <p className="text-xs text-muted-foreground">Cost of goods sold</p>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{formatCurrency(gross_profit)}</div>
                            <p className="text-xs text-muted-foreground">{gross_margin.toFixed(2)}% margin</p>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(net_profit)}
                            </div>
                            <p className="text-xs text-muted-foreground">{net_margin.toFixed(2)}% margin</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Breakdown */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>Financial Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="font-medium">Revenue</span>
                                <span className="font-semibold">{formatCurrency(revenue)}</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-muted-foreground">Cost of Goods Sold</span>
                                <span className="text-red-600">-{formatCurrency(cost_of_goods_sold)}</span>
                            </div>
                            <div className="flex justify-between items-center border-b-2 pb-2 font-semibold">
                                <span>Gross Profit</span>
                                <span className="text-blue-600">{formatCurrency(gross_profit)} ({gross_margin.toFixed(2)}%)</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-muted-foreground">Expenses</span>
                                <span className="text-red-600">-{formatCurrency(expenses)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 font-bold text-lg">
                                <span>Net Profit</span>
                                <span className={net_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {formatCurrency(net_profit)} ({net_margin.toFixed(2)}%)
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
