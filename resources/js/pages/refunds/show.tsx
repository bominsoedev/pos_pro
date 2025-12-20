import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface RefundItem {
    id: number;
    order_item_id: number;
    product_id: number;
    quantity: number;
    amount: number;
    reason: string | null;
    product: {
        id: number;
        name: string;
        sku: string | null;
    } | null;
    orderItem: {
        id: number;
        product_name: string;
        price: number;
        quantity: number;
    } | null;
}

interface Refund {
    id: number;
    refund_number: string;
    type: string;
    status: string;
    amount: number;
    reason: string | null;
    notes: string | null;
    created_at: string;
    order: {
        id: number;
        order_number: string;
        total: number;
        customer: {
            name: string;
            email: string | null;
            phone: string | null;
        } | null;
    } | null;
    user: {
        name: string;
    } | null;
    items: RefundItem[];
}

interface RefundShowProps {
    refund: Refund;
}

export default function RefundShow({ refund }: RefundShowProps) {
    const { t, currentLanguage } = useTranslation();

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            completed: 'default',
            pending: 'secondary',
            cancelled: 'destructive',
        };
        return variants[status] || 'secondary';
    };

    const getTypeLabel = (type: string) => {
        return type === 'full' ? t('refunds.full_refund') : t('refunds.partial_refund');
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('refunds.title'), href: '/refunds' },
            { title: refund.refund_number, href: `/refunds/${refund.id}` },
        ]}>
            <Head title={`${t('refunds.title')} - ${refund.refund_number}`} />
            <div className="flex h-full flex-1 flex-col gap-2 overflow-x-auto rounded-lg p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href="/refunds">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold">{refund.refund_number}</h1>
                            <p className="text-muted-foreground">{t('refunds.title')}</p>
                        </div>
                    </div>
                    <Badge variant={getStatusBadge(refund.status)}>
                        {t(`refunds.${refund.status}`)}
                    </Badge>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                    {/* Refund Details */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('refunds.refund_details')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('refunds.refund_number')}:</span>
                                <span className="font-medium">{refund.refund_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('refunds.type')}:</span>
                                <span className="font-medium">{getTypeLabel(refund.type)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('refunds.amount')}:</span>
                                <span className="font-medium">{formatCurrency(refund.amount, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('refunds.status')}:</span>
                                <Badge variant={getStatusBadge(refund.status)}>
                                    {t(`refunds.${refund.status}`)}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('refunds.created_at')}:</span>
                                <span className="font-medium">{new Date(refund.created_at).toLocaleString()}</span>
                            </div>
                            {refund.reason && (
                                <div className="pt-2 border-t">
                                    <span className="text-muted-foreground">{t('refunds.reason')}:</span>
                                    <p className="mt-1">{refund.reason}</p>
                                </div>
                            )}
                            {refund.notes && (
                                <div className="pt-2 border-t">
                                    <span className="text-muted-foreground">{t('refunds.additional_notes')}:</span>
                                    <p className="mt-1">{refund.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Order Details */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('orders.order_details')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {refund.order ? (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t('orders.order_number')}:</span>
                                        <Link href={`/orders/${refund.order.id}`} className="text-primary hover:underline font-medium">
                                            {refund.order.order_number}
                                        </Link>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t('orders.total')}:</span>
                                        <span className="font-medium">{formatCurrency(refund.order.total, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                    </div>
                                    {refund.order.customer && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">{t('customers.name')}:</span>
                                                <span className="font-medium">{refund.order.customer.name}</span>
                                            </div>
                                            {refund.order.customer.email && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">{t('customers.email')}:</span>
                                                    <span className="font-medium">{refund.order.customer.email}</span>
                                                </div>
                                            )}
                                            {refund.order.customer.phone && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">{t('customers.phone')}:</span>
                                                    <span className="font-medium">{refund.order.customer.phone}</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            ) : (
                                <p className="text-muted-foreground">{t('common.no_data')}</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Refund Items */}
                {refund.items && refund.items.length > 0 && (
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('refunds.refunded_items')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2 font-medium">{t('products.name')}</th>
                                            <th className="text-left p-2 font-medium">{t('refunds.quantity')}</th>
                                            <th className="text-left p-2 font-medium">{t('refunds.amount')}</th>
                                            {refund.items.some(item => item.reason) && (
                                                <th className="text-left p-2 font-medium">{t('refunds.reason')}</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {refund.items.map((item) => (
                                            <tr key={item.id} className="border-b hover:bg-muted/50">
                                                <td className="p-2">
                                                    {item.product ? item.product.name : (item.orderItem?.product_name || '-')}
                                                </td>
                                                <td className="p-2">{item.quantity}</td>
                                                <td className="p-2">{formatCurrency(item.amount, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</td>
                                                {refund.items.some(i => i.reason) && (
                                                    <td className="p-2">{item.reason || '-'}</td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
