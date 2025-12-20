import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2, Edit } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface VariantOption {
    id: number;
    name: string;
    value: string;
    display_order: number;
}

interface ProductVariant {
    id: number;
    name: string | null;
    sku: string | null;
    price: number | null;
    cost: number | null;
    stock_quantity: number;
    barcode: string | null;
    image: string | null;
    is_active: boolean;
    options: VariantOption[];
}

interface Product {
    id: number;
    name: string;
    sku: string | null;
    price: number;
}

interface ProductVariantsProps {
    product: Product;
    variants: ProductVariant[];
    optionGroups: Record<string, VariantOption[]>;
}

export default function ProductVariants({ product, variants, optionGroups }: ProductVariantsProps) {
    const { t, currentLanguage } = useTranslation();
    const [showOptionDialog, setShowOptionDialog] = useState(false);
    const [showVariantDialog, setShowVariantDialog] = useState(false);
    const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
    const [selectedOptionIds, setSelectedOptionIds] = useState<number[]>([]);

    const { data: optionData, setData: setOptionData, post: postOption, processing: optionProcessing, errors: optionErrors, reset: resetOption } = useForm({
        name: '',
        value: '',
        display_order: 0,
    });

    const { data: variantData, setData: setVariantData, post: postVariant, put: putVariant, processing: variantProcessing, errors: variantErrors, reset: resetVariant } = useForm({
        name: '',
        sku: '',
        price: null as number | null,
        cost: null as number | null,
        stock_quantity: 0,
        barcode: '',
        image: '',
        is_active: true,
        option_ids: [] as number[],
    });

    const handleAddOption = (e: React.FormEvent) => {
        e.preventDefault();
        postOption(`/products/${product.id}/variants/options`, {
            preserveScroll: true,
            onSuccess: () => {
                setShowOptionDialog(false);
                resetOption();
            },
        });
    };

    const openVariantDialog = (variant?: ProductVariant) => {
        if (variant) {
            setEditingVariant(variant);
            setVariantData({
                name: variant.name || '',
                sku: variant.sku || '',
                price: variant.price,
                cost: variant.cost,
                stock_quantity: variant.stock_quantity,
                barcode: variant.barcode || '',
                image: variant.image || '',
                is_active: variant.is_active,
                option_ids: variant.options.map(o => o.id),
            });
            setSelectedOptionIds(variant.options.map(o => o.id));
        } else {
            setEditingVariant(null);
            resetVariant();
            setSelectedOptionIds([]);
        }
        setShowVariantDialog(true);
    };

    const handleVariantSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setVariantData('option_ids', selectedOptionIds);
        if (editingVariant) {
            putVariant(`/variants/${editingVariant.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setShowVariantDialog(false);
                    resetVariant();
                },
            });
        } else {
            postVariant(`/products/${product.id}/variants`, {
                preserveScroll: true,
                onSuccess: () => {
                    setShowVariantDialog(false);
                    resetVariant();
                },
            });
        }
    };

    const handleDeleteVariant = (variantId: number) => {
        if (confirm(t('variants.delete_confirm'))) {
            router.delete(`/variants/${variantId}`, {
                preserveScroll: true,
            });
        }
    };

    const handleDeleteOption = (optionId: number) => {
        if (confirm(t('variants.delete_option_confirm'))) {
            router.delete(`/variant-options/${optionId}`, {
                preserveScroll: true,
            });
        }
    };

    const toggleOption = (optionId: number) => {
        if (selectedOptionIds.includes(optionId)) {
            setSelectedOptionIds(selectedOptionIds.filter(id => id !== optionId));
        } else {
            setSelectedOptionIds([...selectedOptionIds, optionId]);
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.products'), href: '/products' },
            { title: product.name, href: `/products/${product.id}/variants` },
        ]}>
            <Head title={`${t('variants.title')} - ${product.name}`} />
            <div className="flex h-full flex-1 flex-col gap-2 overflow-x-auto rounded-lg p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href="/products">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold">{product.name}</h1>
                            <p className="text-muted-foreground">{t('variants.title')}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => setShowOptionDialog(true)} variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            {t('variants.add_option')}
                        </Button>
                        <Button onClick={() => openVariantDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('variants.add_variant')}
                        </Button>
                    </div>
                </div>

                {/* Variant Options */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('variants.options')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {Object.keys(optionGroups).length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                {t('variants.no_options')}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(optionGroups).map(([groupName, options]) => (
                                    <div key={groupName} className="border rounded p-2">
                                        <div className="font-medium mb-2">{groupName}</div>
                                        <div className="flex flex-wrap gap-2">
                                            {options.map((option) => (
                                                <Badge key={option.id} variant="outline" className="flex items-center gap-2">
                                                    {option.value}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-4 w-4"
                                                        onClick={() => handleDeleteOption(option.id)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Variants */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('variants.variants')} ({variants.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {variants.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                {t('variants.no_variants')}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2 font-medium">{t('variants.name')}</th>
                                            <th className="text-left p-2 font-medium">{t('products.sku')}</th>
                                            <th className="text-left p-2 font-medium">{t('products.price')}</th>
                                            <th className="text-left p-2 font-medium">{t('inventory.stock_quantity')}</th>
                                            <th className="text-left p-2 font-medium">{t('variants.options')}</th>
                                            <th className="text-left p-2 font-medium">{t('common.status')}</th>
                                            <th className="text-left p-2 font-medium">{t('common.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {variants.map((variant) => (
                                            <tr key={variant.id} className="border-b hover:bg-muted/50">
                                                <td className="p-2">{variant.name || variant.options.map(o => o.value).join(' - ')}</td>
                                                <td className="p-2">{variant.sku || '-'}</td>
                                                <td className="p-2">{variant.price ? formatCurrency(variant.price) : formatCurrency(product.price)}</td>
                                                <td className="p-2">{variant.stock_quantity}</td>
                                                <td className="p-2">
                                                    <div className="flex flex-wrap gap-1">
                                                        {variant.options.map((option) => (
                                                            <Badge key={option.id} variant="secondary" className="text-xs">
                                                                {option.value}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-2">
                                                    {variant.is_active ? (
                                                        <Badge variant="default">{t('common.active')}</Badge>
                                                    ) : (
                                                        <Badge variant="secondary">{t('common.inactive')}</Badge>
                                                    )}
                                                </td>
                                                <td className="p-2">
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openVariantDialog(variant)}
                                                            title={t('common.edit')}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDeleteVariant(variant.id)}
                                                            title={t('common.delete')}
                                                            className="text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Add Option Dialog */}
                <Dialog open={showOptionDialog} onOpenChange={setShowOptionDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('variants.add_option')}</DialogTitle>
                            <DialogDescription>
                                {t('variants.add_option_description')}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddOption}>
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="option_name">{t('variants.option_name')} *</Label>
                                    <Input
                                        id="option_name"
                                        value={optionData.name}
                                        onChange={(e) => setOptionData('name', e.target.value)}
                                        placeholder={t('variants.option_name_placeholder')}
                                        required
                                    />
                                    {optionErrors.name && (
                                        <p className="text-sm text-destructive mt-1">{optionErrors.name}</p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="option_value">{t('variants.option_value')} *</Label>
                                    <Input
                                        id="option_value"
                                        value={optionData.value}
                                        onChange={(e) => setOptionData('value', e.target.value)}
                                        placeholder={t('variants.option_value_placeholder')}
                                        required
                                    />
                                    {optionErrors.value && (
                                        <p className="text-sm text-destructive mt-1">{optionErrors.value}</p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="option_display_order">{t('variants.display_order')}</Label>
                                    <Input
                                        id="option_display_order"
                                        type="number"
                                        value={optionData.display_order}
                                        onChange={(e) => setOptionData('display_order', parseInt(e.target.value) || 0)}
                                        min="0"
                                    />
                                    {optionErrors.display_order && (
                                        <p className="text-sm text-destructive mt-1">{optionErrors.display_order}</p>
                                    )}
                                </div>
                            </div>
                            <DialogFooter className="mt-4">
                                <Button type="button" variant="outline" onClick={() => setShowOptionDialog(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" disabled={optionProcessing}>
                                    {optionProcessing ? t('common.loading') : t('common.save')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Add/Edit Variant Dialog */}
                <Dialog open={showVariantDialog} onOpenChange={setShowVariantDialog}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingVariant ? t('variants.edit_variant') : t('variants.add_variant')}
                            </DialogTitle>
                            <DialogDescription>
                                {editingVariant ? t('variants.edit_variant_description') : t('variants.add_variant_description')}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleVariantSubmit}>
                            <div className="space-y-3">
                                <div className="grid gap-2 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="variant_name">{t('variants.name')}</Label>
                                        <Input
                                            id="variant_name"
                                            value={variantData.name}
                                            onChange={(e) => setVariantData('name', e.target.value)}
                                        />
                                        {variantErrors.name && (
                                            <p className="text-sm text-destructive mt-1">{variantErrors.name}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="variant_sku">{t('products.sku')}</Label>
                                        <Input
                                            id="variant_sku"
                                            value={variantData.sku}
                                            onChange={(e) => setVariantData('sku', e.target.value)}
                                        />
                                        {variantErrors.sku && (
                                            <p className="text-sm text-destructive mt-1">{variantErrors.sku}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-2 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="variant_price">{t('products.price')}</Label>
                                        <Input
                                            id="variant_price"
                                            type="number"
                                            step="0.01"
                                            value={variantData.price || ''}
                                            onChange={(e) => setVariantData('price', e.target.value ? parseFloat(e.target.value) : null)}
                                            min="0"
                                        />
                                        {variantErrors.price && (
                                            <p className="text-sm text-destructive mt-1">{variantErrors.price}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="variant_cost">{t('products.cost')}</Label>
                                        <Input
                                            id="variant_cost"
                                            type="number"
                                            step="0.01"
                                            value={variantData.cost || ''}
                                            onChange={(e) => setVariantData('cost', e.target.value ? parseFloat(e.target.value) : null)}
                                            min="0"
                                        />
                                        {variantErrors.cost && (
                                            <p className="text-sm text-destructive mt-1">{variantErrors.cost}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-2 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="variant_stock">{t('inventory.stock_quantity')} *</Label>
                                        <Input
                                            id="variant_stock"
                                            type="number"
                                            value={variantData.stock_quantity}
                                            onChange={(e) => setVariantData('stock_quantity', parseInt(e.target.value) || 0)}
                                            min="0"
                                            required
                                        />
                                        {variantErrors.stock_quantity && (
                                            <p className="text-sm text-destructive mt-1">{variantErrors.stock_quantity}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="variant_barcode">{t('products.barcode')}</Label>
                                        <Input
                                            id="variant_barcode"
                                            value={variantData.barcode}
                                            onChange={(e) => setVariantData('barcode', e.target.value)}
                                        />
                                        {variantErrors.barcode && (
                                            <p className="text-sm text-destructive mt-1">{variantErrors.barcode}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <Label>{t('variants.select_options')} *</Label>
                                    <div className="border rounded p-3 mt-2 space-y-2 max-h-48 overflow-y-auto">
                                        {Object.entries(optionGroups).map(([groupName, options]) => (
                                            <div key={groupName} className="space-y-1">
                                                <div className="font-medium text-sm">{groupName}</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {options.map((option) => (
                                                        <div key={option.id} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`option-${option.id}`}
                                                                checked={selectedOptionIds.includes(option.id)}
                                                                onCheckedChange={() => toggleOption(option.id)}
                                                            />
                                                            <Label htmlFor={`option-${option.id}`} className="cursor-pointer text-sm">
                                                                {option.value}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {variantErrors.option_ids && (
                                        <p className="text-sm text-destructive mt-1">{variantErrors.option_ids}</p>
                                    )}
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="variant_active"
                                        checked={variantData.is_active}
                                        onCheckedChange={(checked) => setVariantData('is_active', checked === true)}
                                    />
                                    <Label htmlFor="variant_active" className="cursor-pointer">
                                        {t('common.active')}
                                    </Label>
                                </div>
                            </div>
                            <DialogFooter className="mt-4">
                                <Button type="button" variant="outline" onClick={() => setShowVariantDialog(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" disabled={variantProcessing || selectedOptionIds.length === 0}>
                                    {variantProcessing ? t('common.loading') : (editingVariant ? t('common.update') : t('common.save'))}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
