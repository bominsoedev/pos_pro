import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Package, Truck, Calendar, User, CheckCircle2, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface PurchaseOrderItem {
    id: number;
    product_name: string;
    product_sku: string | null;
    quantity: number;
    unit_cost: number;
    subtotal: number;
    discount: number;
    total: number;
    product: { id: number; name: string } | null;
}

interface PurchaseOrder {
    id: number;
    po_number: string;
    supplier: { id: number; name: string; email: string | null; phone: string | null };
    user: { id: number; name: string };
    order_date: string;
    expected_delivery_date: string | null;
    status: string;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total: number;
    notes: string | null;
    terms: string | null;
    created_at: string;
    items: PurchaseOrderItem[];
}

interface PurchaseOrderShowProps {
    purchaseOrder: PurchaseOrder;
}

export default function PurchaseOrderShow({ purchaseOrder }: PurchaseOrderShowProps) {
    const { t, currentLanguage } = useTranslation();
    const { data, setData, patch, processing } = useForm({
        status: purchaseOrder.status,
    });

    const handleStatusChange = (newStatus: string) => {
        setData('status', newStatus);
        patch(`/purchase-orders/${purchaseOrder.id}/status`, {
            preserveScroll: true,
        });
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
            draft: { label: t('purchase_orders.draft'), variant: 'outline' },
            pending: { label: t('purchase_orders.pending'), variant: 'secondary' },
            approved: { label: t('purchase_orders.approved'), variant: 'default' },
            received: { label: t('purchase_orders.received'), variant: 'default' },
            cancelled: { label: t('purchase_orders.cancelled'), variant: 'destructive' },
        };
        const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const };
        return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.purchase_orders'), href: '/purchase-orders' },
            { title: purchaseOrder.po_number, href: `/purchase-orders/${purchaseOrder.id}` },
        ]}>
            <Head title={purchaseOrder.po_number} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/purchase-orders">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{purchaseOrder.po_number}</h1>
                            <p className="text-muted-foreground">{t('purchase_orders.title')}</p>
                        </div>
                        {getStatusBadge(purchaseOrder.status)}
                    </div>
                    {purchaseOrder.status !== 'received' && purchaseOrder.status !== 'cancelled' && (
                        <Select value={data.status} onValueChange={handleStatusChange} disabled={processing}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">{t('purchase_orders.draft')}</SelectItem>
                                <SelectItem value="pending">{t('purchase_orders.pending')}</SelectItem>
                                <SelectItem value="approved">{t('purchase_orders.approved')}</SelectItem>
                                <SelectItem value="received">{t('purchase_orders.received')}</SelectItem>
                                <SelectItem value="cancelled">{t('purchase_orders.cancelled')}</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {/* Order Details */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70 md:col-span-2">
                        <CardHeader>
                            <CardTitle>{t('purchase_orders.title')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('purchase_orders.supplier')}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Truck className="h-4 w-4" />
                                        <p className="font-semibold">{purchaseOrder.supplier.name}</p>
                                    </div>
                                    {purchaseOrder.supplier.email && (
                                        <p className="text-sm text-muted-foreground">{purchaseOrder.supplier.email}</p>
                                    )}
                                    {purchaseOrder.supplier.phone && (
                                        <p className="text-sm text-muted-foreground">{purchaseOrder.supplier.phone}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('purchase_orders.order_date')}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Calendar className="h-4 w-4" />
                                        <p className="font-semibold">{new Date(purchaseOrder.order_date).toLocaleDateString()}</p>
                                    </div>
                                    {purchaseOrder.expected_delivery_date && (
                                        <>
                                            <p className="text-sm text-muted-foreground mt-2">{t('purchase_orders.expected_delivery')}</p>
                                            <p className="text-sm">{new Date(purchaseOrder.expected_delivery_date).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="mt-6">
                                <h3 className="font-semibold mb-2">{t('orders.items')}</h3>
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="text-left p-2">{t('products.name')}</th>
                                                <th className="text-right p-2">{t('products.quantity')}</th>
                                                <th className="text-right p-2">{t('products.price')}</th>
                                                <th className="text-right p-2">{t('pos.discount')}</th>
                                                <th className="text-right p-2">{t('pos.total')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {purchaseOrder.items.map((item) => (
                                                <tr key={item.id} className="border-b">
                                                    <td className="p-2">
                                                        <div>
                                                            <p className="font-medium">{item.product_name}</p>
                                                            {item.product_sku && (
                                                                <p className="text-sm text-muted-foreground">{item.product_sku}</p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-2 text-right">{item.quantity}</td>
                                                    <td className="p-2 text-right">{formatCurrency(item.unit_cost, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</td>
                                                    <td className="p-2 text-right">{formatCurrency(item.discount, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</td>
                                                    <td className="p-2 text-right font-semibold">{formatCurrency(item.total, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {purchaseOrder.notes && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">{t('orders.notes')}</p>
                                    <p className="text-sm">{purchaseOrder.notes}</p>
                                </div>
                            )}

                            {purchaseOrder.terms && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Terms</p>
                                    <p className="text-sm">{purchaseOrder.terms}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Summary */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('pos.total')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('pos.subtotal')}</span>
                                <span>{formatCurrency(purchaseOrder.subtotal, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                            </div>
                            {purchaseOrder.tax_amount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('pos.tax')}</span>
                                    <span>{formatCurrency(purchaseOrder.tax_amount, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                </div>
                            )}
                            {purchaseOrder.discount_amount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('pos.discount')}</span>
                                    <span className="text-destructive">-{formatCurrency(purchaseOrder.discount_amount, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                </div>
                            )}
                            <div className="border-t pt-2 mt-2">
                                <div className="flex justify-between font-bold text-lg">
                                    <span>{t('pos.total')}</span>
                                    <span>{formatCurrency(purchaseOrder.total, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                </div>
                            </div>
                            <div className="pt-4 border-t">
                                <p className="text-sm text-muted-foreground mb-1">{t('common.created_by')}</p>
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <p className="text-sm">{purchaseOrder.user.name}</p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(purchaseOrder.created_at).toLocaleString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

