import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Edit, Trash2, PercentCircle, Star } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-translation';

interface TaxRate {
    id: number;
    name: string;
    code: string;
    rate: number;
    description: string | null;
    is_default: boolean;
    is_active: boolean;
}

interface TaxRatesPageProps {
    taxRates: TaxRate[];
}

export default function TaxRatesIndex({ taxRates }: TaxRatesPageProps) {
    const { t } = useTranslation();
    const [showDialog, setShowDialog] = useState(false);
    const [editingTaxRate, setEditingTaxRate] = useState<TaxRate | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        code: '',
        rate: 0,
        description: '',
        is_default: false,
        is_active: true,
    });

    const openDialog = (taxRate?: TaxRate) => {
        if (taxRate) {
            setEditingTaxRate(taxRate);
            setData({
                name: taxRate.name,
                code: taxRate.code,
                rate: taxRate.rate,
                description: taxRate.description || '',
                is_default: taxRate.is_default,
                is_active: taxRate.is_active,
            });
        } else {
            setEditingTaxRate(null);
            reset();
        }
        setShowDialog(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTaxRate) {
            put(`/tax-rates/${editingTaxRate.id}`, {
                onSuccess: () => {
                    setShowDialog(false);
                    reset();
                },
            });
        } else {
            post('/tax-rates', {
                onSuccess: () => {
                    setShowDialog(false);
                    reset();
                },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: t('nav.tax_rates'), href: '/tax-rates' }]}>
            <Head title={t('tax_rates.title')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('tax_rates.title')}</h1>
                        <p className="text-muted-foreground">{t('tax_rates.title')}</p>
                    </div>
                    <Button onClick={() => openDialog()} className="backdrop-blur-sm bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('tax_rates.add_tax_rate')}
                    </Button>
                </div>

                {/* Tax Rates List */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {taxRates.map((taxRate) => (
                                <div
                                    key={taxRate.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <PercentCircle className="h-5 w-5 text-muted-foreground" />
                                            <h3 className="font-semibold">{taxRate.name}</h3>
                                            <Badge variant="outline">{taxRate.code}</Badge>
                                            {taxRate.is_default && (
                                                <Badge variant="default" className="flex items-center gap-1">
                                                    <Star className="h-3 w-3" />
                                                    {t('tax_rates.is_default')}
                                                </Badge>
                                            )}
                                            {!taxRate.is_active && (
                                                <Badge variant="secondary">{t('common.inactive')}</Badge>
                                            )}
                                        </div>
                                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                            <div className="font-semibold text-primary text-lg">
                                                {taxRate.rate}%
                                            </div>
                                            {taxRate.description && (
                                                <p className="text-sm">{taxRate.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openDialog(taxRate)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        {!taxRate.is_default && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    if (confirm(t('tax_rates.delete_confirm'))) {
                                                        router.delete(`/tax-rates/${taxRate.id}`);
                                                    }
                                                }}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {taxRates.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    {t('tax_rates.no_tax_rates')}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Dialog */}
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                {editingTaxRate ? t('tax_rates.edit_tax_rate') : t('tax_rates.add_tax_rate')}
                            </DialogTitle>
                            <DialogDescription>
                                {editingTaxRate ? t('tax_rates.edit_tax_rate') : t('tax_rates.add_tax_rate')}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>{t('tax_rates.name')} *</Label>
                                        <Input
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                        />
                                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <Label>{t('tax_rates.code')} *</Label>
                                        <Input
                                            value={data.code}
                                            onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                            required
                                        />
                                        {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
                                    </div>
                                </div>
                                <div>
                                    <Label>{t('tax_rates.rate')} *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={data.rate}
                                        onChange={(e) => setData('rate', parseFloat(e.target.value) || 0)}
                                        required
                                    />
                                    {errors.rate && <p className="text-sm text-destructive">{errors.rate}</p>}
                                </div>
                                <div>
                                    <Label>{t('tax_rates.description')}</Label>
                                    <Textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={data.is_default}
                                        onChange={(e) => setData('is_default', e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <Label>{t('tax_rates.is_default')}</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <Label>{t('tax_rates.is_active')}</Label>
                                </div>
                            </div>
                            <DialogFooter className="mt-4">
                                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {editingTaxRate ? t('common.update') : t('common.create')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

