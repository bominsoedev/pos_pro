import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Plus, Search, Edit, Trash2, Package, Upload, X, Download, Barcode, Printer } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/lib/currency';
import Pagination from '@/components/pagination';
import { useTranslation } from '@/hooks/use-translation';
import { useDebounce } from '@/hooks/use-debounce';

interface Product {
    id: number;
    name: string;
    sku: string | null;
    description: string | null;
    category_id: number | null;
    price: number | string;
    cost: number | string | null;
    stock_quantity: number | string;
    low_stock_threshold: number | string;
    barcode: string | null;
    image: string | null;
    is_active: boolean;
    track_inventory: boolean;
    category: { id: number; name: string } | null;
}

interface ProductsPageProps {
    products: {
        data: Product[];
        links: any;
    };
    categories: Array<{ id: number; name: string }>;
    filters: {
        search?: string;
        category_id?: number;
        low_stock?: boolean;
        price_min?: number;
        price_max?: number;
        in_stock_only?: boolean;
    };
}

export default function ProductsIndex({ products, categories, filters }: ProductsPageProps) {
    const { t } = useTranslation();
    const [showDialog, setShowDialog] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [searchInput, setSearchInput] = useState(filters.search || '');
    const debouncedSearch = useDebounce(searchInput, 500);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        sku: '',
        description: '',
        category_id: null as number | null,
        price: 0,
        cost: null as number | null,
        stock_quantity: 0,
        low_stock_threshold: 10,
        barcode: '',
        image: '',
        is_active: true,
        track_inventory: true,
    });

    const openDialog = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setData({
                name: product.name,
                sku: product.sku || '',
                description: product.description || '',
                category_id: product.category_id,
                price: Number(product.price) || 0,
                cost: product.cost ? Number(product.cost) : null,
                stock_quantity: Number(product.stock_quantity) || 0,
                low_stock_threshold: Number(product.low_stock_threshold) || 10,
                barcode: product.barcode || '',
                image: product.image || '',
                is_active: product.is_active,
                track_inventory: product.track_inventory,
            });
            setImagePreview(product.image || null);
        } else {
            setEditingProduct(null);
            reset();
            setImagePreview(null);
        }
        setShowDialog(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('/images/upload', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': (usePage().props as any).csrf_token || '',
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Image upload failed');
            }

            const result = await response.json();
            setData('image', result.url);
            setImagePreview(result.url);
        } catch (error) {
            console.error('Upload error:', error);
            alert(t('common_errors.upload_image_failed'));
        } finally {
            setUploading(false);
        }
    };

    // Debounced search effect
    useEffect(() => {
        if (debouncedSearch !== filters.search) {
            router.get('/products', {
                search: debouncedSearch || undefined,
                category_id: filters.category_id,
                low_stock: filters.low_stock,
            }, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    }, [debouncedSearch, filters.category_id, filters.low_stock]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProduct) {
            put(`/products/${editingProduct.id}`, {
                onSuccess: () => {
                    setShowDialog(false);
                    reset();
                    setImagePreview(null);
                },
            });
        } else {
            post('/products', {
                onSuccess: () => {
                    setShowDialog(false);
                    reset();
                    setImagePreview(null);
                },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: t('nav.products'), href: '/products' }]}>
            <Head title={t('products.title')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('products.title')}</h1>
                        <p className="text-muted-foreground">{t('products.title')}</p>
                    </div>
                    <div className="flex gap-2">
                        {selectedProducts.length > 0 && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        router.post('/products/barcode/bulk-generate', {
                                            product_ids: selectedProducts,
                                        }, {
                                            onSuccess: () => setSelectedProducts([]),
                                            preserveScroll: true,
                                        });
                                    }}
                                >
                                    <Barcode className="mr-2 h-4 w-4" />
                                    {t('products.generate_barcodes')} ({selectedProducts.length})
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        if (confirm(`${t('products.bulk_delete')} ${selectedProducts.length} ${t('products.products')}`)) {
                                            router.post('/products/bulk-delete', {
                                                ids: selectedProducts,
                                            }, {
                                                onSuccess: () => {
                                                    setSelectedProducts([]);
                                                },
                                            });
                                        }
                                    }}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t('products.delete_selected')} ({selectedProducts.length})
                                </Button>
                            </>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => {
                                const params = new URLSearchParams();
                                if (filters.category_id) params.append('category_id', filters.category_id.toString());
                                if (filters.low_stock) params.append('low_stock', '1');
                                window.location.href = `/export/products?${params.toString()}`;
                            }}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            {t('products.export_csv')}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = '.xlsx,.xls,.csv';
                                input.onchange = async (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (!file) return;
                                    
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    
                                    try {
                                        const response = await fetch('/products/import', {
                                            method: 'POST',
                                            headers: {
                                                'X-CSRF-TOKEN': (usePage().props as any).csrf_token || '',
                                            },
                                            body: formData,
                                        });
                                        
                                        if (response.ok) {
                                            router.reload();
                                        } else {
                                            alert('Import failed');
                                        }
                                    } catch (error) {
                                        console.error('Import error:', error);
                                        alert('Import failed');
                                    }
                                };
                                input.click();
                            }}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            {t('common.import')}
                        </Button>
                        <Button onClick={() => openDialog()} className="backdrop-blur-sm bg-primary/90">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                        </Button>
                    </div>
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
                                    value={searchInput}
                                    onChange={(e) => {
                                        setSearchInput(e.target.value);
                                    }}
                                />
                            </div>
                            <Select
                                value={filters.category_id?.toString() || 'all'}
                                onValueChange={(value) => {
                                    router.get('/products', {
                                        search: filters.search,
                                        category_id: value === 'all' ? null : parseInt(value),
                                        low_stock: filters.low_stock,
                                    }, {
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                }}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder={t('products.all_categories')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('products.all_categories')}</SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id.toString()}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Products Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {products.data.map((product) => (
                        <Card 
                            key={product.id} 
                            className={`backdrop-blur-sm bg-background/80 border-sidebar-border/70 ${selectedProducts.includes(product.id) ? 'ring-2 ring-primary' : ''}`}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2 flex-1">
                                        <input
                                            type="checkbox"
                                            checked={selectedProducts.includes(product.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedProducts([...selectedProducts, product.id]);
                                                } else {
                                                    setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                                                }
                                            }}
                                            className="rounded border-gray-300"
                                        />
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">{product.name}</CardTitle>
                                            {product.sku && (
                                                <p className="text-sm text-muted-foreground">{t('products.sku_label')}: {product.sku}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        {!product.barcode && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                title={t('products.generate_barcode')}
                                                onClick={() => {
                                                    router.post(`/products/${product.id}/barcode/generate`, {}, {
                                                        preserveScroll: true,
                                                    });
                                                }}
                                            >
                                                <Barcode className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {product.barcode && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                title={t('products.print_barcode')}
                                                onClick={() => {
                                                    window.open(`/products/${product.id}/barcode/label?quantity=1`, '_blank');
                                                }}
                                            >
                                                <Printer className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => openDialog(product)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => {
                                                if (confirm(t('products.delete_confirm'))) {
                                                    router.delete(`/products/${product.id}`);
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">{t('products.price_label')}:</span>
                                        <span className="font-bold">{formatPrice(product.price)}</span>
                                    </div>
                                    {product.track_inventory && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">{t('products.stock_label')}:</span>
                                            <Badge variant={(Number(product.stock_quantity) || 0) <= (Number(product.low_stock_threshold) || 0) ? 'destructive' : 'secondary'}>
                                                {product.stock_quantity}
                                            </Badge>
                                        </div>
                                    )}
                                    {product.category && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">{t('products.category_label')}:</span>
                                            <span className="text-sm">{product.category.name}</span>
                                        </div>
                                    )}
                                    {!product.is_active && (
                                        <Badge variant="outline">{t('products.inactive')}</Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Dialog */}
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogContent className="backdrop-blur-sm bg-background/95 max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingProduct ? t('products.edit_product') : t('products.add_product')}</DialogTitle>
                            <DialogDescription>
                                {editingProduct ? t('products.update_product_info') : t('products.create_new_product')}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>{t('products.name')} *</Label>
                                    <Input
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                </div>
                                <div>
                                    <Label>{t('products.sku')}</Label>
                                    <Input
                                        value={data.sku}
                                        onChange={(e) => setData('sku', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>{t('products.description')}</Label>
                                <textarea
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>{t('products.category')}</Label>
                                    <Select
                                        value={data.category_id?.toString() || 'none'}
                                        onValueChange={(value) => setData('category_id', value === 'none' ? null : parseInt(value))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('products.select_category')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">{t('products.none')}</SelectItem>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id.toString()}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>{t('products.barcode')}</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={data.barcode}
                                            onChange={(e) => setData('barcode', e.target.value)}
                                            className="flex-1"
                                        />
                                        {editingProduct && !editingProduct.barcode && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    router.post(`/products/${editingProduct.id}/barcode/generate`, {}, {
                                                        preserveScroll: true,
                                                        onSuccess: () => {
                                                            setShowDialog(false);
                                                        },
                                                    });
                                                }}
                                            >
                                                <Barcode className="h-4 w-4 mr-2" />
                                                {t('products.generate')}
                                            </Button>
                                        )}
                                        {editingProduct && editingProduct.barcode && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    window.open(`/products/${editingProduct.id}/barcode/label?quantity=1`, '_blank');
                                                }}
                                            >
                                                <Printer className="h-4 w-4 mr-2" />
                                                {t('products.print')}
                                            </Button>
                                        )}
                                    </div>
                                    {editingProduct && editingProduct.barcode && (
                                        <div className="mt-2">
                                            <img
                                                src={`/products/${editingProduct.id}/barcode?format=png`}
                                                alt="Barcode"
                                                className="h-16"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label>{t('products.price')} *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={data.price}
                                        onChange={(e) => setData('price', parseFloat(e.target.value))}
                                        required
                                    />
                                    {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
                                </div>
                                <div>
                                    <Label>{t('products.cost')}</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={data.cost || ''}
                                        onChange={(e) => setData('cost', e.target.value ? parseFloat(e.target.value) : null)}
                                    />
                                </div>
                                <div>
                                    <Label>{t('products.stock_quantity')}</Label>
                                    <Input
                                        type="number"
                                        value={data.stock_quantity}
                                        onChange={(e) => setData('stock_quantity', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>{t('products.low_stock_threshold')}</Label>
                                    <Input
                                        type="number"
                                        value={data.low_stock_threshold}
                                        onChange={(e) => setData('low_stock_threshold', parseInt(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <Label>{t('products.image')}</Label>
                                    <div className="space-y-2">
                                        {imagePreview && (
                                            <div className="relative w-32 h-32 border rounded-md overflow-hidden">
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-1 right-1 h-6 w-6"
                                                    onClick={() => {
                                                        setImagePreview(null);
                                                        setData('image', '');
                                                    }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                disabled={uploading}
                                                className="hidden"
                                                id="image-upload"
                                            />
                                            <Label
                                                htmlFor="image-upload"
                                                className="cursor-pointer"
                                            >
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    disabled={uploading}
                                                    asChild
                                                >
                                                    <span>
                                                        <Upload className="h-4 w-4 mr-2" />
                                                        {uploading ? t('products.uploading') : t('products.upload_image')}
                                                    </span>
                                                </Button>
                                            </Label>
                                            <span className="text-xs text-muted-foreground">
                                                {t('products.or_enter_url')}
                                            </span>
                                        </div>
                                        <Input
                                            placeholder={t('products.or_enter_image_url')}
                                            value={data.image}
                                            onChange={(e) => {
                                                setData('image', e.target.value);
                                                setImagePreview(e.target.value || null);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <Label>{t('products.is_active')}</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={data.track_inventory}
                                        onChange={(e) => setData('track_inventory', e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <Label>{t('products.track_inventory')}</Label>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {editingProduct ? t('common.update') : t('common.create')}
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

