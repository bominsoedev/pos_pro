import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2, ShoppingBag, Search } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface Supplier {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    sku: string | null;
    price: number;
    category: { name: string } | null;
}

interface PurchaseOrderCreateProps {
    suppliers: Supplier[];
    products: Product[];
}

interface PurchaseOrderItem {
    product_id: number;
    product_name: string;
    product_sku: string | null;
    quantity: number;
    unit_cost: number;
    discount: number;
    subtotal: number;
    total: number;
}

export default function PurchaseOrderCreate({ suppliers, products }: PurchaseOrderCreateProps) {
    const { t, currentLanguage } = useTranslation();
    const [items, setItems] = useState<PurchaseOrderItem[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);

    const { data, setData, post, processing, errors } = useForm({
        supplier_id: null as number | null,
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: '',
        tax_amount: 0,
        discount_amount: 0,
        notes: '',
        terms: '',
        items: [] as any[],
    });

    const filteredProductsList = productSearch
        ? products.filter(p =>
            p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
            p.sku?.toLowerCase().includes(productSearch.toLowerCase())
        )
        : [];

    const addItem = (product: Product) => {
        const existingItem = items.find(item => item.product_id === product.id);
        if (existingItem) {
            setItems(items.map(item =>
                item.product_id === product.id
                    ? {
                        ...item,
                        quantity: item.quantity + 1,
                        subtotal: item.unit_cost * (item.quantity + 1),
                        total: (item.unit_cost * (item.quantity + 1)) - item.discount,
                    }
                    : item
            ));
        } else {
            setItems([
                ...items,
                {
                    product_id: product.id,
                    product_name: product.name,
                    product_sku: product.sku,
                    quantity: 1,
                    unit_cost: product.price,
                    discount: 0,
                    subtotal: product.price,
                    total: product.price,
                },
            ]);
        }
        setProductSearch('');
    };

    const updateItem = (index: number, field: keyof PurchaseOrderItem, value: number) => {
        const updatedItems = [...items];
        const item = updatedItems[index];
        
        if (field === 'quantity') {
            item.quantity = Math.max(1, value);
            item.subtotal = item.unit_cost * item.quantity;
            item.total = item.subtotal - item.discount;
        } else if (field === 'unit_cost') {
            item.unit_cost = Math.max(0, value);
            item.subtotal = item.unit_cost * item.quantity;
            item.total = item.subtotal - item.discount;
        } else if (field === 'discount') {
            item.discount = Math.max(0, Math.min(value, item.subtotal));
            item.total = item.subtotal - item.discount;
        }
        
        updatedItems[index] = item;
        setItems(updatedItems);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const calculateTotals = () => {
        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const tax = data.tax_amount || 0;
        const discount = data.discount_amount || 0;
        const total = subtotal + tax - discount;
        return { subtotal, tax, discount, total };
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) {
            alert(t('purchase_orders.add_items_first'));
            return;
        }

        const { subtotal } = calculateTotals();
        setData('items', items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            discount: item.discount,
        })));

        post('/purchase-orders', {
            onSuccess: () => {
                // Redirect handled by controller
            },
        });
    };

    const { subtotal, tax, discount, total } = calculateTotals();

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.purchase_orders'), href: '/purchase-orders' },
            { title: t('purchase_orders.add_po'), href: '/purchase-orders/create' },
        ]}>
            <Head title={t('purchase_orders.add_po')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/purchase-orders">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{t('purchase_orders.add_po')}</h1>
                        <p className="text-muted-foreground">{t('purchase_orders.add_po')}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 md:grid-cols-3">
                        {/* Main Form */}
                        <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70 md:col-span-2">
                            <CardHeader>
                                <CardTitle>{t('purchase_orders.title')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>{t('purchase_orders.supplier')} *</Label>
                                        <Select
                                            value={data.supplier_id?.toString() || ''}
                                            onValueChange={(value) => setData('supplier_id', parseInt(value))}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('purchase_orders.supplier')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {suppliers.map((supplier) => (
                                                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                                        {supplier.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.supplier_id && <p className="text-sm text-destructive">{errors.supplier_id}</p>}
                                    </div>
                                    <div>
                                        <Label>{t('purchase_orders.order_date')} *</Label>
                                        <Input
                                            type="date"
                                            value={data.order_date}
                                            onChange={(e) => setData('order_date', e.target.value)}
                                            required
                                        />
                                        {errors.order_date && <p className="text-sm text-destructive">{errors.order_date}</p>}
                                    </div>
                                </div>
                                <div>
                                    <Label>{t('purchase_orders.expected_delivery')}</Label>
                                    <Input
                                        type="date"
                                        value={data.expected_delivery_date}
                                        onChange={(e) => setData('expected_delivery_date', e.target.value)}
                                        min={data.order_date}
                                    />
                                </div>

                                {/* Add Products */}
                                <div>
                                    <Label>{t('products.title')}</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder={t('products.search_products')}
                                            className="pl-10"
                                            value={productSearch}
                                            onChange={(e) => setProductSearch(e.target.value)}
                                        />
                                    </div>
                                    {productSearch && filteredProductsList.length > 0 && (
                                        <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
                                            {filteredProductsList.map((product) => (
                                                <button
                                                    key={product.id}
                                                    type="button"
                                                    onClick={() => addItem(product)}
                                                    className="w-full text-left p-2 hover:bg-muted flex items-center justify-between"
                                                >
                                                    <div>
                                                        <p className="font-medium">{product.name}</p>
                                                        {product.sku && (
                                                            <p className="text-sm text-muted-foreground">{product.sku}</p>
                                                        )}
                                                    </div>
                                                    <Badge>{formatCurrency(product.price, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</Badge>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Items List */}
                                {items.length > 0 && (
                                    <div className="mt-4">
                                        <h3 className="font-semibold mb-2">{t('products.items')}</h3>
                                        <div className="space-y-2">
                                            {items.map((item, index) => (
                                                <div key={index} className="border rounded-lg p-3">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <p className="font-medium">{item.product_name}</p>
                                                            {item.product_sku && (
                                                                <p className="text-sm text-muted-foreground">{item.product_sku}</p>
                                                            )}
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeItem(index)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                    <div className="grid grid-cols-4 gap-2">
                                                        <div>
                                                            <Label className="text-xs">{t('products.quantity')}</Label>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-xs">{t('products.price')}</Label>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={item.unit_cost}
                                                                onChange={(e) => updateItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-xs">{t('pos.discount')}</Label>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={item.discount}
                                                                onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-xs">{t('pos.total')}</Label>
                                                            <Input
                                                                value={formatCurrency(item.total, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                                                disabled
                                                                className="font-semibold"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>{t('pos.tax')}</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.tax_amount}
                                            onChange={(e) => setData('tax_amount', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div>
                                        <Label>{t('pos.discount')}</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.discount_amount}
                                            onChange={(e) => setData('discount_amount', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>{t('orders.notes')}</Label>
                                    <Textarea
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={3}
                                    />
                                </div>

                                <div>
                                    <Label>{t('purchase_orders.terms')}</Label>
                                    <Textarea
                                        value={data.terms}
                                        onChange={(e) => setData('terms', e.target.value)}
                                        rows={3}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Summary */}
                        <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                            <CardHeader>
                                <CardTitle>{t('pos.total')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('pos.subtotal')}</span>
                                    <span>{formatCurrency(subtotal, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('pos.tax')}</span>
                                    <span>{formatCurrency(tax, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('pos.discount')}</span>
                                    <span className="text-destructive">-{formatCurrency(discount, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                </div>
                                <div className="border-t pt-2 mt-2">
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>{t('pos.total')}</span>
                                        <span>{formatCurrency(total, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/purchase-orders">{t('common.cancel')}</Link>
                        </Button>
                        <Button type="submit" disabled={processing || items.length === 0}>
                            {t('common.create')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

