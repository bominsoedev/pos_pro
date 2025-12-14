import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { 
    DollarSign, 
    ShoppingCart, 
    Users, 
    Package, 
    TrendingUp,
    AlertTriangle,
    ArrowRight,
    BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface DashboardProps {
    stats: {
        today: { sales: number; orders: number; customers: number };
        this_month: { sales: number; orders: number; customers: number };
        last_month: { sales: number; orders: number; customers: number };
        low_stock: number;
        total_products: number;
        total_customers: number;
    };
    recentOrders: any[];
    topProducts: any[];
    lowStockProducts: Array<{
        id: number;
        name: string;
        stock_quantity: number;
        low_stock_threshold: number;
        category: { name: string } | null;
    }>;
    salesChartData: Array<{
        date: string;
        sales: number;
        orders: number;
    }>;
    monthlyTrend: Array<{
        month: string;
        sales: number;
        orders: number;
    }>;
}

export default function Dashboard({ stats, recentOrders, topProducts, lowStockProducts, salesChartData, monthlyTrend }: DashboardProps) {
    const { t } = useTranslation();

    const salesGrowth = stats.last_month.sales > 0
        ? ((stats.this_month.sales - stats.last_month.sales) / stats.last_month.sales) * 100
        : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('dashboard.today_sales')}</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.today.sales)}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.today.orders} {t('reports.total_orders')}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('dashboard.this_month')}</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.this_month.sales)}</div>
                            <p className="text-xs text-muted-foreground">
                                {salesGrowth >= 0 ? '+' : ''}{salesGrowth.toFixed(1)}% from last month
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('dashboard.total_products')}</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_products}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.low_stock} {t('dashboard.low_stock')}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('dashboard.total_customers')}</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_customers}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.this_month.customers} new this month
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-4">
                    <Button asChild size="lg" className="backdrop-blur-sm bg-primary/90">
                        <Link href="/pos">
                            <ShoppingCart className="mr-2 h-5 w-5" />
                            {t('dashboard.new_sale')}
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                        <Link href="/reports/daily">
                            <BarChart3 className="mr-2 h-5 w-5" />
                            {t('dashboard.view_reports')}
                        </Link>
                    </Button>
                </div>

                {/* Sales Charts */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>Sales Trend (Last 7 Days)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={salesChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip 
                                        formatter={(value: number) => formatCurrency(value)}
                                    />
                                    <Legend />
                                    <Line 
                                        type="monotone" 
                                        dataKey="sales" 
                                        stroke="#8884d8" 
                                        name="Sales"
                                        strokeWidth={2}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="orders" 
                                        stroke="#82ca9d" 
                                        name="Orders"
                                        strokeWidth={2}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>Monthly Sales Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={monthlyTrend}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip 
                                        formatter={(value: number) => formatCurrency(value)}
                                    />
                                    <Legend />
                                    <Bar dataKey="sales" fill="#8884d8" name="Sales" />
                                    <Bar dataKey="orders" fill="#82ca9d" name="Orders" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Orders & Top Products */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('dashboard.recent_orders')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentOrders.length > 0 ? (
                                    recentOrders.map((order) => (
                                        <div key={order.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                                            <div>
                                                <p className="font-medium">{order.order_number}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {order.customer?.name || 'Walk-in Customer'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{formatCurrency(order.total)}</p>
                                                <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                                                    {order.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">No recent orders</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

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
                                                    {product.total_sold} sold
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{formatCurrency(product.price)}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">No sales data</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Low Stock Alert */}
                {stats.low_stock > 0 && (
                    <Card className="backdrop-blur-sm bg-destructive/10 border-destructive/50">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-destructive" />
                                    <CardTitle className="text-destructive">
                                        {t('dashboard.low_stock_alert')} ({stats.low_stock} {t('products.title')})
                                    </CardTitle>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/inventory?low_stock=1">
                                        View All
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {lowStockProducts.map((product) => (
                                    <div key={product.id} className="flex items-center justify-between p-2 rounded border border-destructive/20 bg-background/50">
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{product.name}</p>
                                            {product.category && (
                                                <p className="text-xs text-muted-foreground">{product.category.name}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-destructive">
                                                {product.stock_quantity} / {product.low_stock_threshold}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Stock / Threshold</p>
                                        </div>
                                    </div>
                                ))}
                                {stats.low_stock > lowStockProducts.length && (
                                    <p className="text-xs text-muted-foreground text-center pt-2">
                                        +{stats.low_stock - lowStockProducts.length} more products with low stock
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
