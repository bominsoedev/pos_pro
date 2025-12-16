import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Search, Edit, Trash2, DollarSign, Star } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useDebounce } from '@/hooks/use-debounce';
import { Checkbox } from '@/components/ui/checkbox';

interface Currency {
    id: number;
    code: string;
    name: string;
    symbol: string;
    decimal_places: number;
    exchange_rate: number;
    is_default: boolean;
    is_active: boolean;
    sort_order: number;
}

interface CurrenciesPageProps {
    currencies: Currency[];
    filters: {
        search?: string;
        active_only?: boolean;
    };
}

export default function CurrenciesIndex({ currencies, filters }: CurrenciesPageProps) {
    const { t } = useTranslation();
    const [showDialog, setShowDialog] = useState(false);
    const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
    const [searchInput, setSearchInput] = useState(filters.search || '');
    const debouncedSearch = useDebounce(searchInput, 500);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        code: '',
        name: '',
        symbol: '',
        decimal_places: 2,
        exchange_rate: 1,
        is_default: false,
        is_active: true,
        sort_order: 0,
    });

    const openDialog = (currency?: Currency) => {
        if (currency) {
            setEditingCurrency(currency);
            setData({
                code: currency.code,
                name: currency.name,
                symbol: currency.symbol,
                decimal_places: currency.decimal_places,
                exchange_rate: currency.exchange_rate,
                is_default: currency.is_default,
                is_active: currency.is_active,
                sort_order: currency.sort_order,
            });
        } else {
            setEditingCurrency(null);
            reset();
        }
        setShowDialog(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCurrency) {
            put(`/currencies/${editingCurrency.id}`, {
                onSuccess: () => {
                    setShowDialog(false);
                    reset();
                },
            });
        } else {
            post('/currencies', {
                onSuccess: () => {
                    setShowDialog(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = (currency: Currency) => {
        if (confirm(t('common.confirm') + ' - ' + t('currencies.cannot_delete_default'))) {
            destroy(`/currencies/${currency.id}`, {
                preserveScroll: true,
            });
        }
    };

    const handleSetDefault = (currency: Currency) => {
        router.post(`/currencies/${currency.id}/set-default`, {}, {
            preserveScroll: true,
        });
    };

    const filteredCurrencies = currencies.filter(currency => {
        if (debouncedSearch) {
            const search = debouncedSearch.toLowerCase();
            return currency.code.toLowerCase().includes(search) ||
                currency.name.toLowerCase().includes(search);
        }
        return true;
    });

    return (
        <AppLayout breadcrumbs={[{ title: t('currencies.title'), href: '/currencies' }]}>
            <Head title={t('currencies.title')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('currencies.title')}</h1>
                        <p className="text-muted-foreground">{t('currencies.title')}</p>
                    </div>
                    <Button onClick={() => openDialog()} className="backdrop-blur-sm bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('currencies.add_currency')}
                    </Button>
                </div>

                {/* Filters */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="pt-6">
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={t('common.search')}
                                    className="pl-10"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Currencies List */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('currencies.title')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredCurrencies.length === 0 ? (
                            <div className="text-center py-6">
                                <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold">{t('currencies.no_currencies')}</h3>
                                <Button onClick={() => openDialog()} className="mt-4">
                                    {t('currencies.add_currency')}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredCurrencies.map((currency) => (
                                    <Card key={currency.id} className="hover:bg-accent/50 transition-colors">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 flex-1">
                                                    {currency.is_default && (
                                                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                                    )}
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold">{currency.code}</h3>
                                                            <Badge variant={currency.is_active ? 'default' : 'secondary'}>
                                                                {currency.is_active ? t('common.active') : t('common.inactive')}
                                                            </Badge>
                                                            {currency.is_default && (
                                                                <Badge variant="outline">{t('currencies.is_default')}</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">{currency.name}</p>
                                                        <div className="flex items-center gap-4 mt-1 text-sm">
                                                            <span>{t('currencies.symbol')}: {currency.symbol}</span>
                                                            <span>{t('currencies.exchange_rate')}: {currency.exchange_rate}</span>
                                                            <span>{t('currencies.decimal_places')}: {currency.decimal_places}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {!currency.is_default && currency.is_active && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleSetDefault(currency)}
                                                        >
                                                            {t('currencies.set_default')}
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openDialog(currency)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    {!currency.is_default && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(currency)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Create/Edit Dialog */}
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                {editingCurrency ? t('currencies.edit_currency') : t('currencies.add_currency')}
                            </DialogTitle>
                            <DialogDescription>
                                {editingCurrency ? t('currencies.edit_currency') : t('currencies.add_currency')}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>{t('currencies.code')} *</Label>
                                        <Input
                                            value={data.code}
                                            onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                            maxLength={3}
                                            required
                                        />
                                        {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
                                    </div>
                                    <div>
                                        <Label>{t('currencies.name')} *</Label>
                                        <Input
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                        />
                                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>{t('currencies.symbol')} *</Label>
                                        <Input
                                            value={data.symbol}
                                            onChange={(e) => setData('symbol', e.target.value)}
                                            required
                                        />
                                        {errors.symbol && <p className="text-sm text-destructive">{errors.symbol}</p>}
                                    </div>
                                    <div>
                                        <Label>{t('currencies.decimal_places')} *</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="4"
                                            value={data.decimal_places}
                                            onChange={(e) => setData('decimal_places', parseInt(e.target.value) || 0)}
                                            required
                                        />
                                        {errors.decimal_places && <p className="text-sm text-destructive">{errors.decimal_places}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>{t('currencies.exchange_rate')} *</Label>
                                        <Input
                                            type="number"
                                            step="0.0001"
                                            min="0"
                                            value={data.exchange_rate}
                                            onChange={(e) => setData('exchange_rate', parseFloat(e.target.value) || 0)}
                                            required
                                        />
                                        {errors.exchange_rate && <p className="text-sm text-destructive">{errors.exchange_rate}</p>}
                                    </div>
                                    <div>
                                        <Label>{t('ways.sort_order')}</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={data.sort_order}
                                            onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                                        />
                                        {errors.sort_order && <p className="text-sm text-destructive">{errors.sort_order}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="is_default"
                                            checked={data.is_default}
                                            onCheckedChange={(checked) => setData('is_default', checked as boolean)}
                                        />
                                        <Label htmlFor="is_default" className="cursor-pointer">
                                            {t('currencies.is_default')}
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="is_active"
                                            checked={data.is_active}
                                            onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                                        />
                                        <Label htmlFor="is_active" className="cursor-pointer">
                                            {t('currencies.is_active')}
                                        </Label>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {editingCurrency ? t('common.update') : t('common.create')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
