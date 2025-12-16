import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import HeadingSmall from '@/components/heading-small';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Upload, X } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

interface PosSettingsProps {
    settings: {
        tax_rate: number;
        store_name: string;
        store_address: string;
        store_phone: string;
        store_email: string;
        receipt_header: string;
        receipt_footer: string;
        receipt_logo: string;
        receipt_show_logo: boolean;
        receipt_show_barcode: boolean;
        receipt_show_tax_details: boolean;
        currency_symbol: string;
        low_stock_notification: boolean;
    };
}

export default function PosSettings({ settings }: PosSettingsProps) {
    const { t } = useTranslation();
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('settings.pos_settings'),
            href: '/settings/pos',
        },
    ];

    const [logoPreview, setLogoPreview] = useState<string | null>(settings.receipt_logo || null);
    const [uploading, setUploading] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        tax_rate: settings.tax_rate || 0,
        store_name: settings.store_name || '',
        store_address: settings.store_address || '',
        store_phone: settings.store_phone || '',
        store_email: settings.store_email || '',
        receipt_header: settings.receipt_header || '',
        receipt_footer: settings.receipt_footer || '',
        receipt_logo: settings.receipt_logo || '',
        receipt_show_logo: settings.receipt_show_logo ?? false,
        receipt_show_barcode: settings.receipt_show_barcode ?? false,
        receipt_show_tax_details: settings.receipt_show_tax_details ?? true,
        currency_symbol: settings.currency_symbol || 'K',
        low_stock_notification: settings.low_stock_notification ?? true,
    });

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
            setData('receipt_logo', result.url);
            setLogoPreview(result.url);
        } catch (error) {
            console.error('Upload error:', error);
            alert(t('common_errors.upload_logo_failed'));
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/settings/pos', {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('settings.pos_settings')} />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title={t('settings.pos_settings')}
                        description={t('settings.pos_settings_description')}
                    />

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Tax Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('settings.tax_rate')}</CardTitle>
                                <CardDescription>
                                    {t('settings.tax_rate_description')}
                                </CardDescription>
                            </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>{t('settings.tax_rate')}</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={data.tax_rate}
                                    onChange={(e) => setData('tax_rate', parseFloat(e.target.value) || 0)}
                                />
                                {errors.tax_rate && (
                                    <p className="text-sm text-destructive mt-1">{errors.tax_rate}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                    {t('settings.tax_rate_description')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                        {/* Store Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('settings.store_name')}</CardTitle>
                                <CardDescription>
                                    {t('settings.store_name_description')}
                                </CardDescription>
                            </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>{t('settings.store_name')} *</Label>
                                <Input
                                    value={data.store_name}
                                    onChange={(e) => setData('store_name', e.target.value)}
                                    placeholder={t('settings.store_name_placeholder')}
                                    required
                                />
                                {errors.store_name && (
                                    <p className="text-sm text-destructive mt-1">{errors.store_name}</p>
                                )}
                            </div>
                            <div>
                                <Label>{t('settings.store_address')}</Label>
                                <textarea
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                    value={data.store_address}
                                    onChange={(e) => setData('store_address', e.target.value)}
                                    placeholder={t('settings.store_address_placeholder')}
                                    rows={3}
                                />
                                {errors.store_address && (
                                    <p className="text-sm text-destructive mt-1">{errors.store_address}</p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>{t('settings.store_phone')}</Label>
                                    <Input
                                        value={data.store_phone}
                                        onChange={(e) => setData('store_phone', e.target.value)}
                                        placeholder={t('settings.store_phone_placeholder')}
                                    />
                                    {errors.store_phone && (
                                        <p className="text-sm text-destructive mt-1">{errors.store_phone}</p>
                                    )}
                                </div>
                                <div>
                                    <Label>{t('settings.store_email')}</Label>
                                    <Input
                                        type="email"
                                        value={data.store_email}
                                        onChange={(e) => setData('store_email', e.target.value)}
                                        placeholder={t('settings.store_email_placeholder')}
                                    />
                                    {errors.store_email && (
                                        <p className="text-sm text-destructive mt-1">{errors.store_email}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                        {/* Receipt Settings */}
                        <HeadingSmall title={t('settings.receipt_settings')} />
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('settings.receipt_settings')}</CardTitle>
                                <CardDescription>
                                    {t('settings.receipt_settings')}
                                </CardDescription>
                            </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>{t('settings.receipt_logo')}</Label>
                                <div className="space-y-2">
                                    {logoPreview && (
                                        <div className="relative w-32 h-32 border rounded-md overflow-hidden">
                                            <img
                                                src={logoPreview}
                                                alt="Logo Preview"
                                                className="w-full h-full object-contain"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-1 right-1 h-6 w-6 rounded-full"
                                                onClick={() => {
                                                    setData('receipt_logo', '');
                                                    setLogoPreview(null);
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        disabled={uploading}
                                        className="block w-full text-sm text-muted-foreground
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-primary/10 file:text-primary
                                        hover:file:bg-primary/20"
                                    />
                                    {uploading && <p className="text-xs text-muted-foreground">{t('products.uploading')}</p>}
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="receipt_show_logo"
                                    checked={data.receipt_show_logo}
                                    onCheckedChange={(checked) => setData('receipt_show_logo', checked as boolean)}
                                />
                                <Label htmlFor="receipt_show_logo">{t('settings.show_logo')}</Label>
                            </div>
                            <div>
                                <Label>{t('settings.receipt_header')}</Label>
                                <Input
                                    value={data.receipt_header}
                                    onChange={(e) => setData('receipt_header', e.target.value)}
                                    placeholder={t('receipt.default_header')}
                                />
                                {errors.receipt_header && (
                                    <p className="text-sm text-destructive mt-1">{errors.receipt_header}</p>
                                )}
                            </div>
                            <div>
                                <Label>{t('settings.receipt_footer')}</Label>
                                <Input
                                    value={data.receipt_footer}
                                    onChange={(e) => setData('receipt_footer', e.target.value)}
                                    placeholder={t('receipt.default_footer')}
                                />
                                {errors.receipt_footer && (
                                    <p className="text-sm text-destructive mt-1">{errors.receipt_footer}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="receipt_show_barcode"
                                        checked={data.receipt_show_barcode}
                                        onCheckedChange={(checked) => setData('receipt_show_barcode', checked as boolean)}
                                    />
                                    <Label htmlFor="receipt_show_barcode">{t('settings.show_barcode')}</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="receipt_show_tax_details"
                                        checked={data.receipt_show_tax_details}
                                        onCheckedChange={(checked) => setData('receipt_show_tax_details', checked as boolean)}
                                    />
                                    <Label htmlFor="receipt_show_tax_details">{t('settings.show_tax_details')}</Label>
                                </div>
                            </div>
                            <div>
                                <Label>{t('settings.currency_symbol')}</Label>
                                <Input
                                    value={data.currency_symbol}
                                    onChange={(e) => setData('currency_symbol', e.target.value)}
                                    maxLength={10}
                                />
                                {errors.currency_symbol && (
                                    <p className="text-sm text-destructive mt-1">{errors.currency_symbol}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                        {/* Currency & Notifications */}
                        <HeadingSmall title={t('settings.currency_and_notifications')} />

                        {/* Notification Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('settings.low_stock_notification')}</CardTitle>
                                <CardDescription>
                                    {t('settings.low_stock_notification')}
                                </CardDescription>
                            </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={data.low_stock_notification}
                                    onChange={(e) => setData('low_stock_notification', e.target.checked)}
                                    className="rounded border-gray-300"
                                />
                                <Label>{t('settings.low_stock_notification')}</Label>
                            </div>
                        </CardContent>
                    </Card>

                        <div className="flex justify-end gap-2">
                            <Button type="submit" disabled={processing}>
                                {t('common.save')}
                            </Button>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

