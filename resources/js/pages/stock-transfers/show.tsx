import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Package, ArrowLeftRight } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';

interface StockTransferItem {
    id: number;
    product_name: string;
    product_sku: string | null;
    quantity_requested: number;
    quantity_transferred: number;
    notes: string | null;
    product: { id: number; name: string } | null;
}

interface StockTransfer {
    id: number;
    transfer_number: string;
    fromWay: { id: number; name: string };
    toWay: { id: number; name: string };
    user: { id: number; name: string };
    approvedBy: { id: number; name: string } | null;
    status: string;
    transfer_date: string;
    expected_date: string | null;
    notes: string | null;
    approved_at: string | null;
    completed_at: string | null;
    created_at: string;
    items: StockTransferItem[];
}

interface StockTransferShowProps {
    transfer: StockTransfer;
}

export default function StockTransferShow({ transfer }: StockTransferShowProps) {
    const { t, currentLanguage } = useTranslation();
    const [quantities, setQuantities] = useState<Record<number, number>>(
        transfer.items.reduce((acc, item) => {
            acc[item.id] = item.quantity_transferred || item.quantity_requested;
            return acc;
        }, {} as Record<number, number>)
    );

    const { data, setData, post, processing } = useForm({
        items: [] as any[],
    });

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            pending: 'secondary',
            approved: 'default',
            in_transit: 'default',
            completed: 'default',
            cancelled: 'destructive',
        };
        return <Badge variant={variants[status] || 'default'}>{t(`stock_transfers.${status}`)}</Badge>;
    };

    const handleApprove = () => {
        if (confirm(t('stock_transfers.approve') + '?')) {
            post(`/stock-transfers/${transfer.id}/approve`, {
                preserveScroll: true,
            });
        }
    };

    const handleComplete = () => {
        const items = transfer.items.map(item => ({
            id: item.id,
            quantity_transferred: quantities[item.id] || 0,
        }));

        if (items.some(item => item.quantity_transferred <= 0)) {
            alert('Please enter transferred quantities for all items');
            return;
        }

        setData('items', items);
        post(`/stock-transfers/${transfer.id}/complete`, {
            preserveScroll: true,
        });
    };

    const canApprove = transfer.status === 'pending';
    const canComplete = transfer.status === 'approved';

    return (
        <AppLayout breadcrumbs={[
            { title: t('stock_transfers.title'), href: '/stock-transfers' },
            { title: transfer.transfer_number, href: `/stock-transfers/${transfer.id}` },
        ]}>
            <Head title={transfer.transfer_number} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/stock-transfers">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{transfer.transfer_number}</h1>
                            <p className="text-muted-foreground">{t('stock_transfers.title')}</p>
                        </div>
                        {getStatusBadge(transfer.status)}
                    </div>
                    <div className="flex items-center gap-2">
                        {canApprove && (
                            <Button onClick={handleApprove} disabled={processing}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                {t('stock_transfers.approve')}
                            </Button>
                        )}
                        {canComplete && (
                            <Button onClick={handleComplete} disabled={processing}>
                                <Package className="mr-2 h-4 w-4" />
                                {t('stock_transfers.complete')}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {/* Main Content */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70 md:col-span-2">
                        <CardHeader>
                            <CardTitle>{t('stock_transfers.title')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Transfer Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('stock_transfers.from_location')}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <ArrowLeftRight className="h-4 w-4" />
                                        <p className="font-semibold">{transfer.fromWay.name}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('stock_transfers.to_location')}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <ArrowLeftRight className="h-4 w-4" />
                                        <p className="font-semibold">{transfer.toWay.name}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('stock_transfers.transfer_date')}</p>
                                    <p className="font-semibold">{new Date(transfer.transfer_date).toLocaleDateString()}</p>
                                </div>
                                {transfer.expected_date && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">{t('stock_transfers.expected_date')}</p>
                                        <p className="font-semibold">{new Date(transfer.expected_date).toLocaleDateString()}</p>
                                    </div>
                                )}
                            </div>

                            {/* Items */}
                            <div>
                                <h3 className="font-semibold mb-2">{t('products.items')}</h3>
                                <div className="space-y-2">
                                    {transfer.items.map((item) => (
                                        <div key={item.id} className="border rounded-lg p-3">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <p className="font-medium">{item.product_name}</p>
                                                    {item.product_sku && (
                                                        <p className="text-sm text-muted-foreground">{item.product_sku}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <Label className="text-xs">{t('stock_transfers.quantity_requested')}</Label>
                                                    <Input
                                                        value={item.quantity_requested}
                                                        disabled
                                                        className="font-semibold"
                                                    />
                                                </div>
                                                {canComplete ? (
                                                    <div>
                                                        <Label className="text-xs">{t('stock_transfers.quantity_transferred')}</Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max={item.quantity_requested}
                                                            value={quantities[item.id] || 0}
                                                            onChange={(e) => setQuantities({
                                                                ...quantities,
                                                                [item.id]: parseInt(e.target.value) || 0,
                                                            })}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <Label className="text-xs">{t('stock_transfers.quantity_transferred')}</Label>
                                                        <Input
                                                            value={item.quantity_transferred || 0}
                                                            disabled
                                                            className="font-semibold"
                                                        />
                                                    </div>
                                                )}
                                                <div>
                                                    <Label className="text-xs">{t('common.status')}</Label>
                                                    <Input
                                                        value={item.quantity_transferred >= item.quantity_requested ? 'Complete' : 'Partial'}
                                                        disabled
                                                        className="font-semibold"
                                                    />
                                                </div>
                                            </div>
                                            {item.notes && (
                                                <div className="mt-2">
                                                    <p className="text-xs text-muted-foreground">{item.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {transfer.notes && (
                                <div>
                                    <h3 className="font-semibold mb-2">{t('orders.notes')}</h3>
                                    <p className="text-sm text-muted-foreground">{transfer.notes}</p>
                                </div>
                            )}
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
                                <span>{transfer.items.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('stock_transfers.quantity_requested')}</span>
                                <span>{transfer.items.reduce((sum, item) => sum + item.quantity_requested, 0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('stock_transfers.quantity_transferred')}</span>
                                <span>{transfer.items.reduce((sum, item) => sum + (item.quantity_transferred || 0), 0)}</span>
                            </div>
                            <div className="pt-4 border-t">
                                <p className="text-sm text-muted-foreground mb-1">{t('common.created_by')}</p>
                                <p className="text-sm">{transfer.user.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(transfer.created_at).toLocaleString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                </p>
                            </div>
                            {transfer.approvedBy && (
                                <div className="pt-2">
                                    <p className="text-sm text-muted-foreground mb-1">{t('common.approved_by')}</p>
                                    <p className="text-sm">{transfer.approvedBy.name}</p>
                                    {transfer.approved_at && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(transfer.approved_at).toLocaleString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
