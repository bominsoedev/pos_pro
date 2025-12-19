import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Package, AlertTriangle, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface Product {
    id: number;
    name: string;
    sku: string | null;
    category: string | null;
    stock_quantity: number;
    cost: number;
    total_value: number;
    is_low_stock: boolean;
}

interface InventoryValuationProps {
    products: Product[];
    total_value: number;
    low_stock_value: number;
    total_items: number;
    low_stock_items: number;
}

export default function InventoryValuationReport({
    products,
    total_value,
    low_stock_value,
    total_items,
    low_stock_items,
}: InventoryValuationProps) {
    const { t } = useTranslation();

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.reports'), href: '/reports' },
            { title: t('reports.inventory_valuation'), href: '/reports/inventory-valuation' },
        ]}>
            <Head title={t('reports.inventory_valuation')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('reports.inventory_valuation')}</h1>
                        <p className="text-muted-foreground">{t('reports.current_inventory_value')}</p>
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

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('reports.total_value')}</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">{formatCurrency(total_value)}</div>
                            <p className="text-xs text-muted-foreground">{t('reports.all_inventory')}</p>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('reports.total_items')}</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{total_items}</div>
                            <p className="text-xs text-muted-foreground">{t('reports.products_tracked')}</p>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('reports.low_stock_items')}</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{low_stock_items}</div>
                            <p className="text-xs text-muted-foreground">{t('reports.need_attention')}</p>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('reports.low_stock_value')}</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{formatCurrency(low_stock_value)}</div>
                            <p className="text-xs text-muted-foreground">{t('reports.at_risk_value')}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Products List */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('reports.inventory_by_value')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {products.length === 0 ? (
                            <div className="text-center py-6">
                                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold">{t('reports.no_inventory_data_found')}</h3>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {products.map((product) => (
                                    <Card key={product.id} className="hover:bg-accent/50 transition-colors">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold">{product.name}</h3>
                                                        {product.is_low_stock && (
                                                            <Badge variant="destructive">{t('reports.low_stock')}</Badge>
                                                        )}
                                                    </div>
                                                    <div className="mt-2 text-sm text-muted-foreground">
                                                        {product.sku && <p>{t('products.sku_label')}: {product.sku}</p>}
                                                        {product.category && <p>{t('reports.category')}: {product.category}</p>}
                                                        <p>{t('reports.stock')}: {product.stock_quantity} {t('reports.units')}</p>
                                                        <p>{t('reports.cost')}: {formatCurrency(product.cost)} {t('reports.per_unit')}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-primary">{formatCurrency(product.total_value)}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
