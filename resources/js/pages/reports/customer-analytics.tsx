import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, router, Link } from '@inertiajs/react';
import { Users, Calendar, DollarSign, ShoppingCart, Star } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface Customer {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    total_orders: number;
    total_spent: number;
    average_order_value: number;
    lifetime_value: number;
    loyalty_points: number;
    loyalty_tier: string;
    last_order_date: string | null;
}

interface CustomerAnalyticsProps {
    date_from: string;
    date_to: string;
    customers: Customer[];
}

export default function CustomerAnalyticsReport({
    date_from,
    date_to,
    customers,
}: CustomerAnalyticsProps) {
    const { t } = useTranslation();
    const [dateFrom, setDateFrom] = useState(date_from);
    const [dateTo, setDateTo] = useState(date_to);

    const handleFilter = () => {
        router.get('/reports/customer-analytics', {
            date_from: dateFrom,
            date_to: dateTo,
        });
    };

    const getTierBadge = (tier: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            bronze: 'secondary',
            silver: 'default',
            gold: 'default',
            platinum: 'default',
        };
        const tierTranslations: Record<string, string> = {
            bronze: t('loyalty.bronze'),
            silver: t('loyalty.silver'),
            gold: t('loyalty.gold'),
            platinum: t('loyalty.platinum'),
        };
        return <Badge variant={variants[tier] || 'secondary'}>{tierTranslations[tier] || tier}</Badge>;
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.reports'), href: '/reports' },
            { title: t('reports.customer_analytics'), href: '/reports/customer-analytics' },
        ]}>
            <Head title={t('reports.customer_analytics')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('reports.customer_analytics')}</h1>
                        <p className="text-muted-foreground">{t('reports.customer_lifetime_value')}</p>
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
                            <Button onClick={handleFilter}>{t('common.filter')}</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Customers List */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('reports.customer_performance')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {customers.length === 0 ? (
                            <div className="text-center py-6">
                                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold">{t('reports.no_customer_data_found')}</h3>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {customers.map((customer) => (
                                    <Card key={customer.id} className="hover:bg-accent/50 transition-colors">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                                                        <Users className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold">{customer.name}</h3>
                                                            {getTierBadge(customer.loyalty_tier)}
                                                        </div>
                                                        {customer.email && (
                                                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                                                        )}
                                                        {customer.phone && (
                                                            <p className="text-sm text-muted-foreground">{customer.phone}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-4 gap-4 text-right">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">{t('orders.title')}</p>
                                                        <p className="font-semibold">{customer.total_orders}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">{t('reports.period_sales')}</p>
                                                        <p className="font-semibold">{formatCurrency(customer.total_spent)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">{t('reports.lifetime_value')}</p>
                                                        <p className="font-semibold text-lg text-primary">{formatCurrency(customer.lifetime_value)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">{t('customers.loyalty_points')}</p>
                                                        <p className="font-semibold">{customer.loyalty_points}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Summary */}
                {customers.length > 0 && (
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('reports.summary')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('reports.total_customers')}</p>
                                    <p className="text-2xl font-bold">{customers.length}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('reports.total_orders')}</p>
                                    <p className="text-2xl font-bold">{customers.reduce((sum, c) => sum + c.total_orders, 0)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('reports.period_sales')}</p>
                                    <p className="text-2xl font-bold text-primary">
                                        {formatCurrency(customers.reduce((sum, c) => sum + c.total_spent, 0))}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('reports.total_lifetime_value')}</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {formatCurrency(customers.reduce((sum, c) => sum + c.lifetime_value, 0))}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
