import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm, Link } from '@inertiajs/react';
import { Plus, Search, Package, AlertTriangle, History, TrendingUp, TrendingDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/lib/currency';
import Pagination from '@/components/pagination';
import { useTranslation } from '@/hooks/use-translation';

interface Product {
    id: number;
    name: string;
    sku: string | null;
    stock_quantity: number;
    low_stock_threshold: number;
    price: number;
    category: { name: string } | null;
}

interface InventoryPageProps {
    products: {
        data: Product[];
        links: any;
    };
    lowStockCount: number;
    filters: {
        search?: string;
        low_stock?: boolean;
    };
}

export default function InventoryIndex({ products, lowStockCount, filters }: InventoryPageProps) {
    const { t } = useTranslation();
    const [showAdjustDialog, setShowAdjustDialog] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        quantity_change: 0,
        type: 'adjustment' as 'purchase' | 'adjustment' | 'return',
        notes: '',
    });

    const openAdjustDialog = (product: Product) => {
        setSelectedProduct(product);
        reset();
        setShowAdjustDialog(true);
    };

    const handleAdjust = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) return;

        post(`/inventory/${selectedProduct.id}/adjust`, {
            onSuccess: () => {
                setShowAdjustDialog(false);
                setSelectedProduct(null);
                reset();
            },
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: t('nav.inventory'), href: '/inventory' }]}>
            <Head title={t('inventory.title')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('inventory.title')}</h1>
                        <p className="text-muted-foreground">{t('inventory.title')}</p>
                    </div>
                    {lowStockCount > 0 && (
                        <Badge variant="destructive" className="text-sm">
                            <AlertTriangle className="mr-1 h-4 w-4" />
                            {lowStockCount} {t('inventory.low_stock')}
                        </Badge>
                    )}
                </div>

                {/* Filters */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="pt-6">
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={t('products.search_products')}
                                    className="pl-10"
                                    defaultValue={filters.search}
                                    onChange={(e) => {
                                        router.get('/inventory', {
                                            search: e.target.value,
                                            low_stock: filters.low_stock,
                                        }, {
                                            preserveState: true,
                                            preserveScroll: true,
                                        });
                                    }}
                                />
                            </div>
                            <Button
                                variant={filters.low_stock ? 'default' : 'outline'}
                                onClick={() => {
                                    router.get('/inventory', {
                                        search: filters.search,
                                        low_stock: !filters.low_stock,
                                    }, {
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                }}
                            >
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                {t('products.low_stock_filter')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Products Table */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="pt-6">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">Product</th>
                                        <th className="text-left p-2">SKU</th>
                                        <th className="text-left p-2">Category</th>
                                        <th className="text-right p-2">Current Stock</th>
                                        <th className="text-right p-2">Low Stock Threshold</th>
                                        <th className="text-right p-2">Status</th>
                                        <th className="text-right p-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.data.map((product) => {
                                        const isLowStock = product.stock_quantity <= product.low_stock_threshold;
                                        return (
                                            <tr key={product.id} className="border-b hover:bg-muted/50">
                                                <td className="p-2 font-medium">{product.name}</td>
                                                <td className="p-2 text-sm text-muted-foreground">{product.sku || '-'}</td>
                                                <td className="p-2 text-sm">{product.category?.name || '-'}</td>
                                                <td className="p-2 text-right font-bold">{product.stock_quantity}</td>
                                                <td className="p-2 text-right text-sm text-muted-foreground">
                                                    {product.low_stock_threshold}
                                                </td>
                                                <td className="p-2 text-right">
                                                    <Badge variant={isLowStock ? 'destructive' : 'secondary'}>
                                                        {isLowStock ? t('products.low_stock_filter') : t('inventory.in_stock')}
                                                    </Badge>
                                                </td>
                                                <td className="p-2 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => openAdjustDialog(product)}
                                                        >
                                                            <Plus className="h-3 w-3 mr-1" />
                                                            {t('inventory.adjust_stock')}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            asChild
                                                        >
                                                            <Link href={`/inventory/${product.id}/history`}>
                                                                <History className="h-3 w-3 mr-1" />
                                                                {t('inventory.history')}
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {products.data.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    {t('common.no_data')}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Adjust Stock Dialog */}
                <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
                    <DialogContent className="backdrop-blur-sm bg-background/95">
                        <DialogHeader>
                            <DialogTitle>{t('inventory.adjust_stock')} - {selectedProduct?.name}</DialogTitle>
                            <DialogDescription>
                                {t('inventory.current_stock')}: {selectedProduct?.stock_quantity} {t('inventory.units')}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAdjust} className="space-y-4">
                            <div>
                                <Label>{t('inventory.adjustment_type')}</Label>
                                <Select
                                    value={data.type}
                                    onValueChange={(value: 'purchase' | 'adjustment' | 'return') => setData('type', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="purchase">{t('inventory.purchase')} ({t('inventory.add')})</SelectItem>
                                        <SelectItem value="adjustment">{t('inventory.adjustment')} ({t('inventory.add')}/{t('inventory.subtract')})</SelectItem>
                                        <SelectItem value="return">{t('inventory.return')} ({t('inventory.add')})</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>
                                    {t('inventory.quantity_change')}
                                    {data.type === 'adjustment' && ` (${t('inventory.positive_add_negative_remove')})`}
                                    {(data.type === 'purchase' || data.type === 'return') && ` (${t('inventory.must_be_positive')})`}
                                </Label>
                                <Input
                                    type="number"
                                    value={data.quantity_change}
                                    onChange={(e) => setData('quantity_change', parseInt(e.target.value) || 0)}
                                    required
                                />
                                {errors.quantity_change && (
                                    <p className="text-sm text-destructive">{errors.quantity_change}</p>
                                )}
                                {selectedProduct && data.quantity_change !== 0 && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {t('inventory.new_stock_will_be')}: {selectedProduct.stock_quantity + data.quantity_change} {t('inventory.units')}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label>{t('orders.notes')}</Label>
                                <textarea
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                    placeholder={t('inventory.optional_notes')}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowAdjustDialog(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {data.quantity_change > 0 ? (
                                        <TrendingUp className="mr-2 h-4 w-4" />
                                    ) : (
                                        <TrendingDown className="mr-2 h-4 w-4" />
                                    )}
                                    {t('inventory.apply_adjustment')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Pagination */}
                <Pagination links={products.links} />
            </div>
        </AppLayout>
    );
}

