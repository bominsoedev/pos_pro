import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Eye, Edit, Trash2, Package } from 'lucide-react';
import Pagination from '@/components/pagination';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';
import { useState } from 'react';

interface BundleItem {
    id: number;
    product_id: number;
    quantity: number;
    product: {
        id: number;
        name: string;
        price: number;
    };
}

interface Bundle {
    id: number;
    name: string;
    description: string | null;
    bundle_price: number;
    savings: number;
    is_active: boolean;
    product: {
        id: number;
        name: string;
        sku: string | null;
    };
    items: BundleItem[];
}

interface BundlesPageProps {
    bundles: {
        data: Bundle[];
        links: any;
    };
}

export default function BundlesIndex({ bundles }: BundlesPageProps) {
    const { t, currentLanguage } = useTranslation();

    const handleDelete = (bundleId: number) => {
        if (confirm(t('bundles.delete_confirm'))) {
            router.delete(`/bundles/${bundleId}`, {
                preserveScroll: true,
            });
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: t('bundles.title'), href: '/bundles' }]}>
            <Head title={t('bundles.title')} />
            <div className="flex h-full flex-1 flex-col gap-2 overflow-x-auto rounded-lg p-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">{t('bundles.title')}</h1>
                        <p className="text-muted-foreground">{t('bundles.description')}</p>
                    </div>
                    <Link href="/bundles/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('bundles.create')}
                        </Button>
                    </Link>
                </div>

                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('bundles.title')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {bundles.data.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                {t('common.no_data')}
                            </div>
                        ) : (
                            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                                {bundles.data.map((bundle) => (
                                    <Card key={bundle.id} className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <CardTitle className="text-base">{bundle.name}</CardTitle>
                                                    {bundle.product && (
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {bundle.product.name}
                                                        </p>
                                                    )}
                                                </div>
                                                {bundle.is_active ? (
                                                    <Badge variant="default">{t('common.active')}</Badge>
                                                ) : (
                                                    <Badge variant="secondary">{t('common.inactive')}</Badge>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            {bundle.description && (
                                                <p className="text-sm text-muted-foreground">{bundle.description}</p>
                                            )}
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">{t('bundles.bundle_price')}:</span>
                                                <span className="font-medium">{formatCurrency(bundle.bundle_price, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                            </div>
                                            {bundle.savings > 0 && (
                                                <div className="flex justify-between text-green-600">
                                                    <span>{t('bundles.savings')}:</span>
                                                    <span className="font-medium">{formatCurrency(bundle.savings, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                                </div>
                                            )}
                                            <div className="pt-2 border-t">
                                                <p className="text-sm text-muted-foreground mb-1">{t('bundles.items')}:</p>
                                                <div className="space-y-1">
                                                    {bundle.items.map((item) => (
                                                        <div key={item.id} className="text-xs flex justify-between">
                                                            <span>{item.product.name}</span>
                                                            <span className="text-muted-foreground">x{item.quantity}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <Link href={`/bundles/${bundle.id}`} className="flex-1">
                                                    <Button variant="outline" size="sm" className="w-full">
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        {t('common.view')}
                                                    </Button>
                                                </Link>
                                                <Link href={`/bundles/${bundle.id}/edit`} className="flex-1">
                                                    <Button variant="outline" size="sm" className="w-full">
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        {t('common.edit')}
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(bundle.id)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                        <Pagination links={bundles.links} />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
