import { useState } from 'react';
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
import { useTranslation } from '@/hooks/use-translation';

interface Way {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    sku: string | null;
    stock_quantity: number;
    category: { name: string } | null;
}

interface StockTransferCreateProps {
    ways: Way[];
    products: Product[];
}

interface TransferItem {
    product_id: number;
    product_name: string;
    product_sku: string | null;
    quantity_requested: number;
    notes: string;
}

export default function StockTransferCreate({ ways, products: initialProducts }: StockTransferCreateProps) {
    const { t } = useTranslation();
    const [items, setItems] = useState<TransferItem[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [showProductSearch, setShowProductSearch] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        from_way_id: null as number | null,
        to_way_id: null as number | null,
        transfer_date: new Date().toISOString().split('T')[0],
        expected_date: '',
        notes: '',
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
                        quantity_requested: item.quantity_requested + 1,
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
                    quantity_requested: 1,
                    notes: '',
                },
            ]);
        }
        setProductSearch('');
        setShowProductSearch(false);
    };

    const updateItem = (index: number, field: keyof TransferItem, value: number | string) => {
        const updatedItems = [...items];
        const item = updatedItems[index];
        
        if (field === 'quantity_requested') {
            item.quantity_requested = Math.max(1, value as number);
        } else {
            (item as any)[field] = value;
        }
        
        updatedItems[index] = item;
        setItems(updatedItems);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) {
            alert('Please add items first');
            return;
        }

        if (!data.from_way_id || !data.to_way_id) {
            alert('Please select from and to locations');
            return;
        }

        if (data.from_way_id === data.to_way_id) {
            alert('From and to locations must be different');
            return;
        }

        setData('items', items.map(item => ({
            product_id: item.product_id,
            quantity_requested: item.quantity_requested,
            notes: item.notes || null,
        })));

        post('/stock-transfers', {
            onSuccess: () => {
                // Redirect handled by controller
            },
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('stock_transfers.title'), href: '/stock-transfers' },
            { title: t('stock_transfers.add_transfer'), href: '/stock-transfers/create' },
        ]}>
            <Head title={t('stock_transfers.add_transfer')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/stock-transfers">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{t('stock_transfers.add_transfer')}</h1>
                        <p className="text-muted-foreground">{t('stock_transfers.title')}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 md:grid-cols-3">
                        {/* Main Form */}
                        <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70 md:col-span-2">
                            <CardHeader>
                                <CardTitle>{t('stock_transfers.title')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>{t('stock_transfers.from_location')} *</Label>
                                        <Select
                                            value={data.from_way_id?.toString() || ''}
                                            onValueChange={(value) => setData('from_way_id', parseInt(value))}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('stock_transfers.from_location')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ways.map((way) => (
                                                    <SelectItem key={way.id} value={way.id.toString()}>
                                                        {way.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.from_way_id && <p className="text-sm text-destructive">{errors.from_way_id}</p>}
                                    </div>
                                    <div>
                                        <Label>{t('stock_transfers.to_location')} *</Label>
                                        <Select
                                            value={data.to_way_id?.toString() || ''}
                                            onValueChange={(value) => setData('to_way_id', parseInt(value))}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('stock_transfers.to_location')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ways.map((way) => (
                                                    <SelectItem key={way.id} value={way.id.toString()}>
                                                        {way.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.to_way_id && <p className="text-sm text-destructive">{errors.to_way_id}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>{t('stock_transfers.transfer_date')} *</Label>
                                        <Input
                                            type="date"
                                            value={data.transfer_date}
                                            onChange={(e) => setData('transfer_date', e.target.value)}
                                            required
                                        />
                                        {errors.transfer_date && <p className="text-sm text-destructive">{errors.transfer_date}</p>}
                                    </div>
                                    <div>
                                        <Label>{t('stock_transfers.expected_date')}</Label>
                                        <Input
                                            type="date"
                                            value={data.expected_date}
                                            onChange={(e) => setData('expected_date', e.target.value)}
                                            min={data.transfer_date}
                                        />
                                    </div>
                                </div>

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
                                                    <Badge>Stock: {product.stock_quantity}</Badge>
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
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <Label className="text-xs">{t('products.quantity')}</Label>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity_requested}
                                                                onChange={(e) => updateItem(index, 'quantity_requested', parseInt(e.target.value) || 1)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-xs">{t('orders.notes')}</Label>
                                                            <Input
                                                                value={item.notes}
                                                                onChange={(e) => updateItem(index, 'notes', e.target.value)}
                                                                placeholder={t('common.optional')}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <Label>{t('orders.notes')}</Label>
                                    <Textarea
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={3}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Summary */}
                        <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                            <CardHeader>
                                <CardTitle>{t('common.summary')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('products.items')}</span>
                                    <span>{items.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('products.total_quantity')}</span>
                                    <span>{items.reduce((sum, item) => sum + item.quantity_requested, 0)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/stock-transfers">{t('common.cancel')}</Link>
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
