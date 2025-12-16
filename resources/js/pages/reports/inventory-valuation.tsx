import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
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
            { title: 'Inventory Valuation', href: '/reports/inventory-valuation' },
        ]}>
            <Head title="Inventory Valuation" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Inventory Valuation</h1>
                        <p className="text-muted-foreground">Current inventory value and stock levels</p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">{formatCurrency(total_value)}</div>
                            <p className="text-xs text-muted-foreground">All inventory</p>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{total_items}</div>
                            <p className="text-xs text-muted-foreground">Products tracked</p>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{low_stock_items}</div>
                            <p className="text-xs text-muted-foreground">Need attention</p>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Low Stock Value</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{formatCurrency(low_stock_value)}</div>
                            <p className="text-xs text-muted-foreground">At risk value</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Products List */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>Inventory by Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {products.length === 0 ? (
                            <div className="text-center py-6">
                                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold">No inventory data found</h3>
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
                                                            <Badge variant="destructive">Low Stock</Badge>
                                                        )}
                                                    </div>
                                                    <div className="mt-2 text-sm text-muted-foreground">
                                                        {product.sku && <p>SKU: {product.sku}</p>}
                                                        {product.category && <p>Category: {product.category}</p>}
                                                        <p>Stock: {product.stock_quantity} units</p>
                                                        <p>Cost: {formatCurrency(product.cost)} per unit</p>
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
