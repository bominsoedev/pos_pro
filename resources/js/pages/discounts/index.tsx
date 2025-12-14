import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Search, Edit, Trash2, Percent, Tag } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { formatPrice, formatCurrency } from '@/lib/currency';
import Pagination from '@/components/pagination';
import { useTranslation } from '@/hooks/use-translation';

interface Discount {
    id: number;
    code: string;
    name: string;
    description: string | null;
    type: 'percentage' | 'fixed';
    value: number;
    minimum_amount: number | null;
    max_uses: number | null;
    used_count: number;
    valid_from: string | null;
    valid_until: string | null;
    is_active: boolean;
}

interface DiscountsPageProps {
    discounts: {
        data: Discount[];
        links: any;
    };
    filters: {
        search?: string;
        active_only?: boolean;
    };
}

export default function DiscountsIndex({ discounts, filters }: DiscountsPageProps) {
    const { t } = useTranslation();
    const [showDialog, setShowDialog] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        code: '',
        name: '',
        description: '',
        type: 'percentage' as 'percentage' | 'fixed',
        value: 0,
        minimum_amount: null as number | null,
        max_uses: null as number | null,
        valid_from: '',
        valid_until: '',
        is_active: true,
    });

    const openDialog = (discount?: Discount) => {
        if (discount) {
            setEditingDiscount(discount);
            setData({
                code: discount.code,
                name: discount.name,
                description: discount.description || '',
                type: discount.type,
                value: discount.value,
                minimum_amount: discount.minimum_amount,
                max_uses: discount.max_uses,
                valid_from: discount.valid_from || '',
                valid_until: discount.valid_until || '',
                is_active: discount.is_active,
            });
        } else {
            setEditingDiscount(null);
            reset();
        }
        setShowDialog(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingDiscount) {
            put(`/discounts/${editingDiscount.id}`, {
                onSuccess: () => {
                    setShowDialog(false);
                    reset();
                },
            });
        } else {
            post('/discounts', {
                onSuccess: () => {
                    setShowDialog(false);
                    reset();
                },
            });
        }
    };

    const isDiscountValid = (discount: Discount): boolean => {
        const now = new Date();
        if (!discount.is_active) return false;
        if (discount.valid_from && new Date(discount.valid_from) > now) return false;
        if (discount.valid_until && new Date(discount.valid_until) < now) return false;
        if (discount.max_uses && discount.used_count >= discount.max_uses) return false;
        return true;
    };

    return (
        <AppLayout breadcrumbs={[{ title: t('nav.discounts'), href: '/discounts' }]}>
            <Head title={t('discounts.title')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('discounts.title')}</h1>
                        <p className="text-muted-foreground">{t('discounts.title')}</p>
                    </div>
                    <Button onClick={() => openDialog()} className="backdrop-blur-sm bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('discounts.add_discount')}
                    </Button>
                </div>

                {/* Filters */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="pt-6">
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={t('discounts.search_discounts')}
                                    className="pl-10"
                                    defaultValue={filters.search}
                                    onChange={(e) => {
                                        router.get('/discounts', {
                                            search: e.target.value,
                                            active_only: filters.active_only,
                                        }, {
                                            preserveState: true,
                                            preserveScroll: true,
                                        });
                                    }}
                                />
                            </div>
                            <Button
                                variant={filters.active_only ? 'default' : 'outline'}
                                onClick={() => {
                                    router.get('/discounts', {
                                        search: filters.search,
                                        active_only: !filters.active_only,
                                    }, {
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                }}
                            >
                                {t('discounts.active_only')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Discounts Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {discounts.data.map((discount) => (
                        <Card key={discount.id} className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Tag className="h-4 w-4 text-muted-foreground" />
                                            <CardTitle className="text-lg">{discount.code}</CardTitle>
                                        </div>
                                        <p className="text-sm font-medium">{discount.name}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => openDialog(discount)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => {
                                                if (confirm(t('discounts.delete_confirm'))) {
                                                    router.delete(`/discounts/${discount.id}`);
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
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">{t('pos.discount')}:</span>
                                        <span className="font-bold text-lg">
                                            {discount.type === 'percentage' 
                                                ? `${discount.value}%` 
                                                : formatPrice(discount.value)}
                                        </span>
                                    </div>
                                    {discount.minimum_amount && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">{t('discounts.min_amount')}:</span>
                                            <span className="text-sm">{formatPrice(discount.minimum_amount)}</span>
                                        </div>
                                    )}
                                    {discount.max_uses && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">{t('discounts.usage')}:</span>
                                            <span className="text-sm">
                                                {discount.used_count} / {discount.max_uses}
                                            </span>
                                        </div>
                                    )}
                                    {discount.valid_from || discount.valid_until ? (
                                        <div className="text-xs text-muted-foreground">
                                            {discount.valid_from && (
                                                <div>{t('discounts.from')}: {new Date(discount.valid_from).toLocaleDateString()}</div>
                                            )}
                                            {discount.valid_until && (
                                                <div>{t('discounts.until')}: {new Date(discount.valid_until).toLocaleDateString()}</div>
                                            )}
                                        </div>
                                    ) : null}
                                    <div className="flex items-center justify-between pt-2 border-t">
                                        <Badge variant={isDiscountValid(discount) ? 'default' : 'secondary'}>
                                            {isDiscountValid(discount) ? t('common.active') : t('common.inactive')}
                                        </Badge>
                                        {!discount.is_active && (
                                            <Badge variant="outline">{t('discounts.disabled')}</Badge>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Dialog */}
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogContent className="backdrop-blur-sm bg-background/95 max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingDiscount ? t('discounts.edit_discount') : t('discounts.add_discount')}</DialogTitle>
                            <DialogDescription>
                                {editingDiscount ? t('discounts.update_info') : t('discounts.create_new')}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>{t('discounts.code')} *</Label>
                                    <Input
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                        required
                                        placeholder="SAVE10"
                                    />
                                    {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
                                </div>
                                <div>
                                    <Label>{t('discounts.type')} *</Label>
                                    <Select
                                        value={data.type}
                                        onValueChange={(value: 'percentage' | 'fixed') => setData('type', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">{t('discounts.percentage')}</SelectItem>
                                            <SelectItem value="fixed">{t('discounts.fixed_amount')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <Label>{t('discounts.name')} *</Label>
                                <Input
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>
                            <div>
                                <Label>{t('discounts.description')}</Label>
                                <textarea
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={2}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>{t('discounts.value')} *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.value}
                                        onChange={(e) => setData('value', parseFloat(e.target.value) || 0)}
                                        required
                                        placeholder={data.type === 'percentage' ? '10' : '1000'}
                                    />
                                    {errors.value && <p className="text-sm text-destructive">{errors.value}</p>}
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {data.type === 'percentage' ? t('discounts.percentage_hint') : t('discounts.fixed_hint')}
                                    </p>
                                </div>
                                <div>
                                    <Label>{t('discounts.min_amount')}</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.minimum_amount || ''}
                                        onChange={(e) => setData('minimum_amount', e.target.value ? parseFloat(e.target.value) : null)}
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>{t('discounts.max_uses')}</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={data.max_uses || ''}
                                        onChange={(e) => setData('max_uses', e.target.value ? parseInt(e.target.value) : null)}
                                        placeholder="Unlimited"
                                    />
                                </div>
                                <div>
                                    <Label>{t('discounts.valid_from')}</Label>
                                    <Input
                                        type="date"
                                        value={data.valid_from}
                                        onChange={(e) => setData('valid_from', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>{t('discounts.valid_until')}</Label>
                                <Input
                                    type="date"
                                    value={data.valid_until}
                                    onChange={(e) => setData('valid_until', e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="rounded border-gray-300"
                                />
                                <Label>{t('common.active')}</Label>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {editingDiscount ? t('common.update') : t('common.create')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

