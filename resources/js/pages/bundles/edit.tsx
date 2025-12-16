import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface Product {
    id: number;
    name: string;
    sku: string | null;
    price: number;
    stock_quantity: number;
}

interface BundleItem {
    id: number;
    product_id: number;
    quantity: number;
    product: {
        id: number;
        name: string;
        sku: string | null;
        price: number;
    };
}

interface Bundle {
    id: number;
    name: string;
    description: string | null;
    bundle_price: number;
    product_id: number;
    product: {
        id: number;
        name: string;
        sku: string | null;
    };
    items: BundleItem[];
}

interface BundlesEditProps {
    bundle: Bundle;
    products: Product[];
}

interface BundleItemForm {
    product_id: number;
    quantity: number;
}

export default function BundlesEdit({ bundle, products }: BundlesEditProps) {
    const { t } = useTranslation();
    const [selectedItems, setSelectedItems] = useState<BundleItemForm[]>(
        bundle.items.map(item => ({ product_id: item.product_id, quantity: item.quantity }))
    );
    const [selectedProductId, setSelectedProductId] = useState<string>('');

    const { data, setData, put, processing, errors } = useForm({
        name: bundle.name,
        description: bundle.description || '',
        bundle_price: bundle.bundle_price,
        items: [] as BundleItemForm[],
    });

    useEffect(() => {
        setData('items', selectedItems);
    }, [selectedItems]);

    const addItem = () => {
        if (!selectedProductId) return;
        const product = products.find(p => p.id === parseInt(selectedProductId));
        if (!product) return;

        const existingIndex = selectedItems.findIndex(item => item.product_id === product.id);
        if (existingIndex >= 0) {
            const updated = [...selectedItems];
            updated[existingIndex].quantity += 1;
            setSelectedItems(updated);
        } else {
            setSelectedItems([...selectedItems, { product_id: product.id, quantity: 1 }]);
        }
        setSelectedProductId('');
    };

    const removeItem = (productId: number) => {
        setSelectedItems(selectedItems.filter(item => item.product_id !== productId));
    };

    const updateQuantity = (productId: number, quantity: number) => {
        setSelectedItems(selectedItems.map(item =>
            item.product_id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
        ));
    };

    const calculateTotalPrice = () => {
        return selectedItems.reduce((total, item) => {
            const product = products.find(p => p.id === item.product_id);
            return total + (product ? product.price * item.quantity : 0);
        }, 0);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedItems.length === 0) {
            alert(t('bundles.add_items_first'));
            return;
        }
        setData('items', selectedItems);
        put(`/bundles/${bundle.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                router.visit('/bundles');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('bundles.title'), href: '/bundles' },
            { title: t('bundles.edit'), href: `/bundles/${bundle.id}/edit` },
        ]}>
            <Head title={t('bundles.edit')} />
            <div className="flex h-full flex-1 flex-col gap-2 overflow-x-auto rounded-lg p-3">
                <div className="flex items-center gap-2">
                    <Link href="/bundles">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">{t('bundles.edit')}</h1>
                        <p className="text-muted-foreground">{bundle.name}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-2">
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('bundles.bundle_details')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <Label htmlFor="name">{t('bundles.name')} *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive mt-1">{errors.name}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="description">{t('bundles.description')}</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive mt-1">{errors.description}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="bundle_price">{t('bundles.bundle_price')} *</Label>
                                <Input
                                    id="bundle_price"
                                    type="number"
                                    step="0.01"
                                    value={data.bundle_price}
                                    onChange={(e) => setData('bundle_price', parseFloat(e.target.value) || 0)}
                                    required
                                    min="0"
                                />
                                {errors.bundle_price && (
                                    <p className="text-sm text-destructive mt-1">{errors.bundle_price}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('bundles.bundle_items')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex gap-2">
                                <Select
                                    value={selectedProductId}
                                    onValueChange={setSelectedProductId}
                                >
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder={t('bundles.select_product')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {products.map((product) => (
                                            <SelectItem key={product.id} value={product.id.toString()}>
                                                {product.name} {product.sku && `(${product.sku})`} - {formatCurrency(product.price)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button type="button" onClick={addItem}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    {t('common.add')}
                                </Button>
                            </div>

                            {selectedItems.length > 0 && (
                                <div className="space-y-2 pt-2 border-t">
                                    {selectedItems.map((item) => {
                                        const product = products.find(p => p.id === item.product_id);
                                        if (!product) return null;
                                        return (
                                            <div key={item.product_id} className="flex items-center justify-between p-2 border rounded">
                                                <div className="flex-1">
                                                    <div className="font-medium">{product.name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {formatCurrency(product.price)} x {item.quantity} = {formatCurrency(product.price * item.quantity)}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value) || 1)}
                                                        className="w-20"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeItem(item.product_id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div className="pt-2 border-t">
                                        <div className="flex justify-between font-medium">
                                            <span>{t('bundles.total_individual_price')}:</span>
                                            <span>{formatCurrency(calculateTotalPrice())}</span>
                                        </div>
                                        <div className="flex justify-between text-green-600">
                                            <span>{t('bundles.savings')}:</span>
                                            <span>{formatCurrency(calculateTotalPrice() - data.bundle_price)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {errors.items && (
                                <p className="text-sm text-destructive">{errors.items}</p>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex gap-2">
                        <Button type="submit" disabled={processing || selectedItems.length === 0}>
                            {processing ? t('common.loading') : t('common.update')}
                        </Button>
                        <Link href="/bundles">
                            <Button type="button" variant="outline">
                                {t('common.cancel')}
                            </Button>
                        </Link>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
