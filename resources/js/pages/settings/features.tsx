import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import HeadingSmall from '@/components/heading-small';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Head, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { useTranslation } from '@/hooks/use-translation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface FeaturesSettingsProps {
    features: {
        bundles: boolean;
        loyalty: boolean;
        ways: boolean;
        roles: boolean;
        backup: boolean;
        suppliers: boolean;
        purchase_orders: boolean;
        expenses: boolean;
        tax_rates: boolean;
        quotations: boolean;
        stock_transfers: boolean;
        gift_cards: boolean;
        currencies: boolean;
        activity_logs: boolean;
        refunds: boolean;
        accounting: boolean;
    };
}

export default function FeaturesSettings({ features }: FeaturesSettingsProps) {
    const { t } = useTranslation();
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('settings.features.title'),
            href: '/settings/features',
        },
    ];

    const { data, setData, put, processing } = useForm({
        bundles: features.bundles ?? true,
        loyalty: features.loyalty ?? true,
        ways: features.ways ?? false,
        roles: features.roles ?? false,
        backup: features.backup ?? true,
        suppliers: features.suppliers ?? false,
        purchase_orders: features.purchase_orders ?? false,
        expenses: features.expenses ?? false,
        tax_rates: features.tax_rates ?? true,
        quotations: features.quotations ?? false,
        stock_transfers: features.stock_transfers ?? false,
        gift_cards: features.gift_cards ?? false,
        currencies: features.currencies ?? false,
        activity_logs: features.activity_logs ?? false,
        refunds: features.refunds ?? true,
        accounting: features.accounting ?? false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/settings/features', {
            preserveScroll: false,
            onSuccess: () => {
                // Force a full page reload to update shared data including sidebar
                window.location.reload();
            },
        });
    };

    const featureGroups = [
        {
            title: t('settings.features.core'),
            description: t('settings.features.core_description'),
            items: [
                { key: 'bundles', label: t('nav.bundles'), description: t('settings.features.bundles_desc') },
                { key: 'loyalty', label: t('nav.loyalty'), description: t('settings.features.loyalty_desc') },
                { key: 'backup', label: t('nav.backup'), description: t('settings.features.backup_desc') },
                { key: 'tax_rates', label: t('nav.tax_rates'), description: t('settings.features.tax_rates_desc') },
                { key: 'refunds', label: t('orders.refunds'), description: t('settings.features.refunds_desc') },
            ],
        },
        {
            title: t('settings.features.business'),
            description: t('settings.features.business_description'),
            items: [
                { key: 'suppliers', label: t('nav.suppliers'), description: t('settings.features.suppliers_desc') },
                { key: 'purchase_orders', label: t('nav.purchase_orders'), description: t('settings.features.purchase_orders_desc') },
                { key: 'expenses', label: t('nav.expenses'), description: t('settings.features.expenses_desc') },
                { key: 'quotations', label: t('nav.quotations'), description: t('settings.features.quotations_desc') },
            ],
        },
        {
            title: t('settings.features.advanced'),
            description: t('settings.features.advanced_description'),
            items: [
                { key: 'ways', label: t('nav.ways'), description: t('settings.features.ways_desc') },
                { key: 'roles', label: t('nav.roles'), description: t('settings.features.roles_desc') },
                { key: 'stock_transfers', label: t('nav.stock_transfers'), description: t('settings.features.stock_transfers_desc') },
                { key: 'gift_cards', label: t('nav.gift_cards'), description: t('settings.features.gift_cards_desc') },
                { key: 'currencies', label: t('nav.currencies'), description: t('settings.features.currencies_desc') },
                { key: 'activity_logs', label: t('nav.activity_logs'), description: t('settings.features.activity_logs_desc') },
                { key: 'accounting', label: t('nav.accounting'), description: t('settings.features.accounting_desc') },
            ],
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('settings.features.title')} />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title={t('settings.features.title')}
                        description={t('settings.features.description')}
                    />

                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            {t('settings.features.alert')}
                        </AlertDescription>
                    </Alert>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {featureGroups.map((group, groupIndex) => (
                            <Card key={groupIndex}>
                                <CardHeader>
                                    <CardTitle>{group.title}</CardTitle>
                                    <CardDescription>{group.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {group.items.map((item) => (
                                        <div key={item.key} className="flex items-center justify-between py-2 border-b last:border-0">
                                            <div className="flex-1">
                                                <Label htmlFor={item.key} className="text-base font-medium cursor-pointer">
                                                    {item.label}
                                                </Label>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {item.description}
                                                </p>
                                            </div>
                                            <Switch
                                                id={item.key}
                                                checked={data[item.key as keyof typeof data] as boolean}
                                                onCheckedChange={(checked) => setData(item.key as keyof typeof data, checked)}
                                            />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        ))}

                        <div className="flex justify-end">
                            <Button type="submit" disabled={processing}>
                                {processing ? t('common.loading') : t('common.save')}
                            </Button>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
