import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { 
    Package, 
    Download,
    TrendingUp,
    Calendar
} from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import { formatCurrency } from '@/lib/currency';
import Pagination from '@/components/pagination';
import { Link } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';

interface Product {
    id: number;
    name: string;
    sku: string | null;
    price: number;
    total_sold: number;
    total_revenue: number;
    order_count: number;
}

interface ProductPerformanceProps {
    products: {
        data: Product[];
        links: any;
    };
    filters: {
        date_from?: string;
        date_to?: string;
        search?: string;
    };
}

export default function ProductPerformance({ products, filters }: ProductPerformanceProps) {
    const { t } = useTranslation();
    const handleDateChange = () => {
        const dateFrom = (document.getElementById('date_from') as HTMLInputElement)?.value;
        const dateTo = (document.getElementById('date_to') as HTMLInputElement)?.value;
        
        router.get('/reports/product-performance', {
            date_from: dateFrom,
            date_to: dateTo,
        }, {
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
            { title: t('reports.product_performance'), href: '/reports/product-performance' },
        ]}>
            <Head title={t('reports.product_performance')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold">{t('reports.product_performance')}</h1>
                        <p className="text-muted-foreground">{t('reports.product_performance_description')}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            onClick={() => {
                                const params = new URLSearchParams();
                                if (filters.search) params.append('search', filters.search);
                                if (filters.date_from) params.append('date_from', filters.date_from);
                                if (filters.date_to) params.append('date_to', filters.date_to);
                                window.location.href = `/export/product-performance?${params.toString()}`;
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
                </div>

                {/* Filters */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70 print:hidden">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <Input
                                placeholder={t('products.search_products')}
                                defaultValue={filters.search}
                                onChange={(e) => {
                                    router.get('/reports/product-performance', {
                                        search: e.target.value,
                                        date_from: filters.date_from,
                                        date_to: filters.date_to,
                                    }, {
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                }}
                            />
                            <Input
                                id="date_from"
                                type="date"
                                placeholder={t('orders.from_date')}
                                defaultValue={filters.date_from}
                                onChange={handleDateChange}
                            />
                            <Input
                                id="date_to"
                                type="date"
                                placeholder={t('orders.to_date')}
                                defaultValue={filters.date_to}
                                onChange={handleDateChange}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Products Table */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('reports.product_performance')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">{t('inventory.product')}</th>
                                        <th className="text-left p-2">{t('products.sku')}</th>
                                        <th className="text-right p-2">{t('products.price')}</th>
                                        <th className="text-right p-2">{t('reports.quantity_sold')}</th>
                                        <th className="text-right p-2">{t('reports.total_revenue')}</th>
                                        <th className="text-right p-2">{t('reports.orders')}</th>
                                        <th className="text-right p-2">{t('reports.avg_per_order')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.data.map((product) => {
                                        const avgPerOrder = product.order_count > 0 
                                            ? product.total_revenue / product.order_count 
                                            : 0;
                                        return (
                                            <tr key={product.id} className="border-b hover:bg-muted/50">
                                                <td className="p-2 font-medium">{product.name}</td>
                                                <td className="p-2 text-sm text-muted-foreground">{product.sku || '-'}</td>
                                                <td className="p-2 text-right">{formatCurrency(product.price)}</td>
                                                <td className="p-2 text-right font-semibold">{product.total_sold}</td>
                                                <td className="p-2 text-right font-bold">{formatCurrency(product.total_revenue)}</td>
                                                <td className="p-2 text-right">{product.order_count}</td>
                                                <td className="p-2 text-right">{formatCurrency(avgPerOrder)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {products.data.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    {t('reports.no_product_data')}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination */}
                <Pagination links={products.links} />
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

