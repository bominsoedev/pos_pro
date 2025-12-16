import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2, Search } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface Customer {
    id: number;
    name: string;
}

interface Way {
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

interface QuotationItem {
    id?: number;
    product_id: number;
    product_name: string;
    product_sku: string | null;
    quantity: number;
    price: number;
    discount: number;
    subtotal: number;
    total: number;
    product?: { id: number; name: string; sku: string | null; price: number } | null;
}

interface Quotation {
    id: number;
    quotation_number: string;
    customer_id: number | null;
    way_id: number | null;
    valid_until: string | null;
    status: string;
    notes: string | null;
    terms: string | null;
    items: QuotationItem[];
}

interface QuotationEditProps {
    quotation: Quotation;
    customers: Customer[];
    ways: Way[];
    defaultTaxRate: number;
    products: Product[];
}

export default function QuotationEdit({ quotation, customers, ways, defaultTaxRate, products: initialProducts }: QuotationEditProps) {
    const { t } = useTranslation();
    const [items, setItems] = useState<QuotationItem[]>(quotation.items.map(item => ({
        ...item,
        product_id: item.product_id,
        product_name: item.product_name,
        product_sku: item.product_sku,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0,
        subtotal: item.subtotal,
        total: item.total,
    })));
    const [productSearch, setProductSearch] = useState('');
    const [showProductSearch, setShowProductSearch] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        customer_id: quotation.customer_id,
        way_id: quotation.way_id,
        valid_until: quotation.valid_until || '',
        tax_rate: defaultTaxRate,
        discount_amount: 0,
        notes: quotation.notes || '',
        terms: quotation.terms || '',
        items: [] as any[],
    });

    const filteredProducts = productSearch
        ? initialProducts.filter(p =>
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
                        subtotal: item.price * (item.quantity + 1),
                        total: (item.price * (item.quantity + 1)) - item.discount,
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
                    price: product.price,
                    discount: 0,
                    subtotal: product.price,
                    total: product.price,
                },
            ]);
        }
        setProductSearch('');
        setShowProductSearch(false);
    };

    const updateItem = (index: number, field: keyof QuotationItem, value: number) => {
        const updatedItems = [...items];
        const item = updatedItems[index];
        
        if (field === 'quantity') {
            item.quantity = Math.max(1, value);
            item.subtotal = item.price * item.quantity;
            item.total = item.subtotal - item.discount;
        } else if (field === 'price') {
            item.price = Math.max(0, value);
            item.subtotal = item.price * item.quantity;
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
        const taxRate = data.tax_rate || 0;
        const tax = subtotal * (taxRate / 100);
        const discount = data.discount_amount || 0;
        const total = subtotal + tax - discount;
        return { subtotal, tax, discount, total };
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) {
            alert('Please add items first');
            return;
        }

        setData('items', items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount,
        })));

        put(`/quotations/${quotation.id}`, {
            onSuccess: () => {
                // Redirect handled by controller
            },
        });
    };

    const { subtotal, tax, discount, total } = calculateTotals();

    return (
        <AppLayout breadcrumbs={[
            { title: t('quotations.title'), href: '/quotations' },
            { title: quotation.quotation_number, href: `/quotations/${quotation.id}` },
            { title: t('quotations.edit_quotation'), href: `/quotations/${quotation.id}/edit` },
        ]}>
            <Head title={t('quotations.edit_quotation')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/quotations/${quotation.id}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{t('quotations.edit_quotation')}</h1>
                        <p className="text-muted-foreground">{quotation.quotation_number}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 md:grid-cols-3">
                        {/* Main Form */}
                        <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70 md:col-span-2">
                            <CardHeader>
                                <CardTitle>{quotation.quotation_number}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>{t('quotations.customer')}</Label>
                                        <Select
                                            value={data.customer_id?.toString() || ''}
                                            onValueChange={(value) => setData('customer_id', value ? parseInt(value) : null)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('quotations.customer')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">{t('notifications.walk_in_customer')}</SelectItem>
                                                {customers.map((customer) => (
                                                    <SelectItem key={customer.id} value={customer.id.toString()}>
                                                        {customer.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.customer_id && <p className="text-sm text-destructive">{errors.customer_id}</p>}
                                    </div>
                                    <div>
                                        <Label>{t('quotations.valid_until')}</Label>
                                        <Input
                                            type="date"
                                            value={data.valid_until}
                                            onChange={(e) => setData('valid_until', e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                        {errors.valid_until && <p className="text-sm text-destructive">{errors.valid_until}</p>}
                                    </div>
                                </div>

                                {ways.length > 0 && (
                                    <div>
                                        <Label>{t('ways.title')}</Label>
                                        <Select
                                            value={data.way_id?.toString() || ''}
                                            onValueChange={(value) => setData('way_id', value ? parseInt(value) : null)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('ways.title')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">{t('common.all')}</SelectItem>
                                                {ways.map((way) => (
                                                    <SelectItem key={way.id} value={way.id.toString()}>
                                                        {way.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Add Products */}
                                <div>
                                    <Label>{t('products.title')}</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder={t('common.search')}
                                            className="pl-10"
                                            value={productSearch}
                                            onChange={(e) => {
                                                setProductSearch(e.target.value);
                                                setShowProductSearch(true);
                                            }}
                                            onFocus={() => {
                                                if (productSearch) {
                                                    setShowProductSearch(true);
                                                }
                                            }}
                                        />
                                    </div>
                                    {showProductSearch && productSearch && filteredProducts.length > 0 && (
                                        <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
                                            {filteredProducts.map((product) => (
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
                                                    <Badge>{formatCurrency(product.price)}</Badge>
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
                                                                value={item.price}
                                                                onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
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
                                                                value={formatCurrency(item.total)}
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
                                        <Label>{t('tax_rates.rate')} (%)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            value={data.tax_rate}
                                            onChange={(e) => setData('tax_rate', parseFloat(e.target.value) || 0)}
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
                                    <Label>Terms</Label>
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
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('pos.tax')}</span>
                                    <span>{formatCurrency(tax)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('pos.discount')}</span>
                                    <span className="text-destructive">-{formatCurrency(discount)}</span>
                                </div>
                                <div className="border-t pt-2 mt-2">
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>{t('pos.total')}</span>
                                        <span>{formatCurrency(total)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <Button type="button" variant="outline" asChild>
                            <Link href={`/quotations/${quotation.id}`}>{t('common.cancel')}</Link>
                        </Button>
                        <Button type="submit" disabled={processing || items.length === 0}>
                            {t('common.update')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
