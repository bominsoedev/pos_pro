import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface BundleItem {
    id: number;
    product_id: number;
    quantity: number;
    product: {
        id: number;
        name: string;
        sku: string | null;
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
        price: number;
    };
    items: BundleItem[];
}

interface BundlesShowProps {
    bundle: Bundle;
}

export default function BundlesShow({ bundle }: BundlesShowProps) {
    const { t } = useTranslation();

    const calculateTotalIndividualPrice = () => {
        return bundle.items.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
        }, 0);
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('bundles.title'), href: '/bundles' },
            { title: bundle.name, href: `/bundles/${bundle.id}` },
        ]}>
            <Head title={`${t('bundles.title')} - ${bundle.name}`} />
            <div className="flex h-full flex-1 flex-col gap-2 overflow-x-auto rounded-lg p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href="/bundles">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold">{bundle.name}</h1>
                            <p className="text-muted-foreground">{t('bundles.title')}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {bundle.is_active ? (
                            <Badge variant="default">{t('common.active')}</Badge>
                        ) : (
                            <Badge variant="secondary">{t('common.inactive')}</Badge>
                        )}
                        <Link href={`/bundles/${bundle.id}/edit`}>
                            <Button variant="outline">
                                <Edit className="mr-2 h-4 w-4" />
                                {t('common.edit')}
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                    {/* Bundle Details */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('bundles.bundle_details')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('bundles.name')}:</span>
                                <span className="font-medium">{bundle.name}</span>
                            </div>
                            {bundle.description && (
                                <div className="pt-2 border-t">
                                    <span className="text-muted-foreground">{t('bundles.description')}:</span>
                                    <p className="mt-1">{bundle.description}</p>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('bundles.main_product')}:</span>
                                <span className="font-medium">{bundle.product.name}</span>
                            </div>
                            {bundle.product.sku && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('products.sku')}:</span>
                                    <span className="font-medium">{bundle.product.sku}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('bundles.bundle_price')}:</span>
                                <span className="font-medium text-lg">{formatCurrency(bundle.bundle_price)}</span>
                            </div>
                            {bundle.savings > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>{t('bundles.savings')}:</span>
                                    <span className="font-medium">{formatCurrency(bundle.savings)}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pricing Summary */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('bundles.pricing_summary')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('bundles.total_individual_price')}:</span>
                                <span className="font-medium">{formatCurrency(calculateTotalIndividualPrice())}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('bundles.bundle_price')}:</span>
                                <span className="font-medium">{formatCurrency(bundle.bundle_price)}</span>
                            </div>
                            <div className="pt-2 border-t">
                                <div className="flex justify-between text-green-600 font-medium">
                                    <span>{t('bundles.savings')}:</span>
                                    <span>{formatCurrency(bundle.savings)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Bundle Items */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('bundles.bundle_items')} ({bundle.items.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2 font-medium">{t('products.name')}</th>
                                        <th className="text-left p-2 font-medium">{t('products.sku')}</th>
                                        <th className="text-left p-2 font-medium">{t('products.price')}</th>
                                        <th className="text-left p-2 font-medium">{t('bundles.quantity')}</th>
                                        <th className="text-left p-2 font-medium">{t('bundles.subtotal')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bundle.items.map((item) => (
                                        <tr key={item.id} className="border-b hover:bg-muted/50">
                                            <td className="p-2">{item.product.name}</td>
                                            <td className="p-2">{item.product.sku || '-'}</td>
                                            <td className="p-2">{formatCurrency(item.product.price)}</td>
                                            <td className="p-2">{item.quantity}</td>
                                            <td className="p-2">{formatCurrency(item.product.price * item.quantity)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t font-medium">
                                        <td colSpan={4} className="p-2 text-right">{t('bundles.total')}:</td>
                                        <td className="p-2">{formatCurrency(calculateTotalIndividualPrice())}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
