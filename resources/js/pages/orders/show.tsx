import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { ArrowLeft, RotateCcw, CheckCircle2, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { formatCurrency } from '@/lib/currency';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from '@inertiajs/react';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';

interface OrderItem {
    id: number;
    product_name: string;
    price: number;
    quantity: number;
    subtotal: number;
    discount: number;
    total: number;
}

interface Payment {
    id: number;
    method: string;
    amount: number;
    created_at: string;
}

interface RefundItem {
    id: number;
    order_item_id: number;
    product_id: number;
    quantity: number;
    amount: number;
    reason: string | null;
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
    items: RefundItem[];
}

interface Order {
    id: number;
    order_number: string;
    status: string;
    payment_status: string;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total: number;
    notes: string | null;
    created_at: string;
    customer: { name: string; email: string | null; phone: string | null } | null;
    user: { name: string } | null;
    items: OrderItem[];
    payments: Payment[];
    refunds: Refund[];
}

interface OrderShowProps {
    order: Order;
}

export default function OrderShow({ order }: OrderShowProps) {
    const { t } = useTranslation();
    const [showRefundDialog, setShowRefundDialog] = useState(false);
    const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
    const [selectedItems, setSelectedItems] = useState<Record<number, { quantity: number; amount: number; reason: string }>>({});

    const { data, setData, patch, processing } = useForm({
        status: order.status,
    });

    const { data: refundData, setData: setRefundData, post: postRefund, processing: refundProcessing, errors: refundErrors } = useForm({
        type: 'full',
        amount: 0,
        reason: '',
        notes: '',
        items: [] as any[],
    });

    const handleStatusChange = (newStatus: string) => {
        setData('status', newStatus);
        patch(`/orders/${order.id}/status`, {
            preserveScroll: true,
        });
    };

    const totalRefunded = order.refunds?.reduce((sum, refund) => sum + (refund.status === 'completed' ? refund.amount : 0), 0) || 0;
    const remainingAmount = order.total - totalRefunded;
    const canRefund = order.status === 'completed' && remainingAmount > 0;

    const handleRefund = () => {
        if (refundType === 'partial') {
            const items = Object.entries(selectedItems).map(([orderItemId, data]) => ({
                order_item_id: parseInt(orderItemId),
                quantity: data.quantity,
                amount: data.amount,
                reason: data.reason,
            }));
            setRefundData('items', items);
            setRefundData('amount', items.reduce((sum, item) => sum + item.amount, 0));
        } else {
            setRefundData('amount', remainingAmount);
            setRefundData('items', []);
        }

        postRefund(`/orders/${order.id}/refund`, {
            onSuccess: () => {
                setShowRefundDialog(false);
                setRefundData({
                    type: 'full',
                    amount: 0,
                    reason: '',
                    notes: '',
                    items: [],
                });
                setSelectedItems({});
            },
        });
    };

    const updateSelectedItem = (orderItemId: number, field: 'quantity' | 'amount' | 'reason', value: number | string) => {
        const item = order.items.find(i => i.id === orderItemId);
        if (!item) return;

        setSelectedItems(prev => {
            const current = prev[orderItemId] || { quantity: 0, amount: 0, reason: '' };
            
            if (field === 'quantity') {
                const qty = Math.min(Math.max(1, value as number), item.quantity);
                const amount = (item.total / item.quantity) * qty;
                return {
                    ...prev,
                    [orderItemId]: { ...current, quantity: qty, amount: parseFloat(amount.toFixed(2)) },
                };
            } else if (field === 'amount') {
                return {
                    ...prev,
                    [orderItemId]: { ...current, amount: value as number },
                };
            } else {
                return {
                    ...prev,
                    [orderItemId]: { ...current, reason: value as string },
                };
            }
        });
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            completed: 'default',
            pending: 'secondary',
            cancelled: 'destructive',
            refunded: 'outline',
        };
        return variants[status] || 'secondary';
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.orders'), href: '/orders' },
            { title: order.order_number, href: `/orders/${order.id}` },
        ]}>
            <Head title={`${t('orders.title')} ${order.order_number}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/orders">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{t('orders.title')} {order.order_number}</h1>
                            <p className="text-muted-foreground">
                                {new Date(order.created_at).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Select value={data.status} onValueChange={handleStatusChange} disabled={processing}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder={t('orders.update_status')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">{t('orders.pending')}</SelectItem>
                                <SelectItem value="completed">{t('orders.completed')}</SelectItem>
                                <SelectItem value="cancelled">{t('orders.cancelled')}</SelectItem>
                                <SelectItem value="refunded">{t('orders.refunded')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                            {t(`orders.${order.payment_status}`)}
                        </Badge>
                        <Button
                            variant="outline"
                            asChild
                        >
                            <a href={`/orders/${order.id}/invoice`} target="_blank" rel="noopener noreferrer">
                                <FileDown className="mr-2 h-4 w-4" />
                                {t('orders.download_invoice')}
                            </a>
                        </Button>
                        {canRefund && (
                            <Button
                                variant="outline"
                                onClick={() => setShowRefundDialog(true)}
                            >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                {t('orders.refund')}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Order Details */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('orders.order_details')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">{t('orders.cashier')}</p>
                                <p className="font-medium">{order.user?.name || '-'}</p>
                            </div>
                            {order.customer && (
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('orders.customer')}</p>
                                    <p className="font-medium">{order.customer.name}</p>
                                    {order.customer.email && (
                                        <p className="text-sm text-muted-foreground">{order.customer.email}</p>
                                    )}
                                    {order.customer.phone && (
                                        <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
                                    )}
                                </div>
                            )}
                            {order.notes && (
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('orders.notes')}</p>
                                    <p className="text-sm">{order.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment Details */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('orders.payment')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {order.payments.map((payment) => (
                                <div key={payment.id} className="flex justify-between items-center p-2 rounded border">
                                    <div>
                                        <p className="font-medium capitalize">{payment.method}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(payment.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <p className="font-bold">{formatCurrency(payment.amount)}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Order Items */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('orders.items')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">{t('inventory.product')}</th>
                                        <th className="text-right p-2">{t('products.price')}</th>
                                        <th className="text-right p-2">{t('orders.quantity')}</th>
                                        <th className="text-right p-2">{t('pos.discount')}</th>
                                        <th className="text-right p-2">{t('orders.total')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items.map((item) => (
                                        <tr key={item.id} className="border-b">
                                            <td className="p-2">{item.product_name}</td>
                                            <td className="p-2 text-right">{formatCurrency(item.price)}</td>
                                            <td className="p-2 text-right">{item.quantity}</td>
                                            <td className="p-2 text-right text-destructive">
                                                {item.discount > 0 ? `-${formatCurrency(item.discount)}` : '-'}
                                            </td>
                                            <td className="p-2 text-right font-bold">{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t">
                                        <td colSpan={4} className="p-2 text-right font-medium">{t('pos.subtotal')}:</td>
                                        <td className="p-2 text-right">{formatCurrency(order.subtotal)}</td>
                                    </tr>
                                    {order.tax_amount > 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-2 text-right font-medium">{t('pos.tax')}:</td>
                                            <td className="p-2 text-right">{formatCurrency(order.tax_amount)}</td>
                                        </tr>
                                    )}
                                    {order.discount_amount > 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-2 text-right font-medium text-destructive">
                                                {t('pos.discount')}:
                                            </td>
                                            <td className="p-2 text-right text-destructive">
                                                -{formatCurrency(order.discount_amount)}
                                            </td>
                                        </tr>
                                    )}
                                    <tr className="border-t-2">
                                        <td colSpan={4} className="p-2 text-right font-bold text-lg">{t('pos.total')}:</td>
                                        <td className="p-2 text-right font-bold text-lg">
                                            {formatCurrency(order.total)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Refunds History */}
                {order.refunds && order.refunds.length > 0 && (
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('orders.refund_history')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {order.refunds.map((refund) => (
                                    <div key={refund.id} className="p-3 rounded border">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p className="font-medium">{refund.refund_number}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(refund.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-destructive">
                                                    -{formatCurrency(refund.amount)}
                                                </p>
                                                <Badge variant={refund.status === 'completed' ? 'default' : 'secondary'}>
                                                    {refund.status}
                                                </Badge>
                                            </div>
                                        </div>
                                        {refund.reason && (
                                            <p className="text-sm text-muted-foreground">{t('orders.reason')}: {refund.reason}</p>
                                        )}
                                        {refund.type === 'partial' && refund.items && refund.items.length > 0 && (
                                            <div className="mt-2 text-xs">
                                                <p className="font-medium mb-1">{t('orders.refunded_items')}:</p>
                                                {refund.items.map((item, idx) => (
                                                    <p key={idx} className="text-muted-foreground">
                                                        • {item.quantity} item(s) - {formatCurrency(item.amount)}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div className="pt-2 border-t">
                                    <div className="flex justify-between">
                                        <span className="font-medium">{t('orders.total_refunded')}:</span>
                                        <span className="font-bold text-destructive">
                                            -{formatCurrency(totalRefunded)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-sm text-muted-foreground">{t('orders.remaining')}:</span>
                                        <span className="text-sm font-medium">
                                            {formatCurrency(remainingAmount)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Refund Dialog */}
            <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
                <DialogContent className="backdrop-blur-sm bg-background/95 max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('orders.process_refund')}</DialogTitle>
                        <DialogDescription>
                            {t('orders.total')}: {formatCurrency(order.total)} | 
                            {t('orders.already_refunded')}: {formatCurrency(totalRefunded)} | 
                            {t('orders.remaining')}: {formatCurrency(remainingAmount)}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>{t('orders.refund_type')}</Label>
                            <Select value={refundType} onValueChange={(value: 'full' | 'partial') => {
                                setRefundType(value);
                                setRefundData('type', value);
                            }}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="full">{t('orders.full_refund')} ({formatCurrency(remainingAmount)})</SelectItem>
                                    <SelectItem value="partial">{t('orders.partial_refund')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {refundType === 'partial' && (
                            <div>
                                <Label>{t('orders.select_items')}</Label>
                                <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                                    {order.items.map((item) => {
                                        const selected = selectedItems[item.id];
                                        const maxQty = item.quantity;
                                        const itemPrice = item.total / item.quantity;
                                        
                                        return (
                                            <div key={item.id} className="p-3 border rounded">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex-1">
                                                        <p className="font-medium">{item.product_name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {t('orders.available')}: {item.quantity} × {formatCurrency(itemPrice)}
                                                        </p>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={!!selected}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                updateSelectedItem(item.id, 'quantity', 1);
                                                            } else {
                                                                setSelectedItems(prev => {
                                                                    const newItems = { ...prev };
                                                                    delete newItems[item.id];
                                                                    return newItems;
                                                                });
                                                            }
                                                        }}
                                                        className="rounded border-gray-300"
                                                    />
                                                </div>
                                                {selected && (
                                                    <div className="space-y-2 mt-2">
                                                        <div>
                                                            <Label className="text-xs">{t('orders.quantity')}</Label>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                max={maxQty}
                                                                value={selected.quantity}
                                                                onChange={(e) => updateSelectedItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-xs">{t('orders.refund_amount')}</Label>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={selected.amount}
                                                                onChange={(e) => updateSelectedItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-xs">{t('orders.reason')} ({t('common.optional')})</Label>
                                                            <Input
                                                                value={selected.reason}
                                                                onChange={(e) => updateSelectedItem(item.id, 'reason', e.target.value)}
                                                                placeholder={t('orders.reason_for_refund')}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-2 p-2 bg-muted rounded">
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium">{t('orders.selected_refund_amount')}:</span>
                                        <span className="text-sm font-bold">
                                            {formatCurrency(Object.values(selectedItems).reduce((sum, item) => sum + item.amount, 0))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <Label>{t('orders.refund_amount')}</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={refundType === 'full' ? remainingAmount : Object.values(selectedItems).reduce((sum, item) => sum + item.amount, 0)}
                                onChange={(e) => setRefundData('amount', parseFloat(e.target.value) || 0)}
                                disabled={refundType === 'partial'}
                                max={remainingAmount}
                            />
                            {refundErrors.amount && (
                                <p className="text-sm text-destructive mt-1">{refundErrors.amount}</p>
                            )}
                        </div>

                        <div>
                            <Label>{t('orders.reason')} ({t('common.optional')})</Label>
                            <Textarea
                                value={refundData.reason}
                                onChange={(e) => setRefundData('reason', e.target.value)}
                                placeholder={t('orders.reason_for_refund')}
                                rows={3}
                            />
                        </div>

                        <div>
                            <Label>{t('orders.notes')} ({t('common.optional')})</Label>
                            <Textarea
                                value={refundData.notes}
                                onChange={(e) => setRefundData('notes', e.target.value)}
                                placeholder={t('orders.additional_notes')}
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            onClick={handleRefund}
                            disabled={refundProcessing || (refundType === 'partial' && Object.keys(selectedItems).length === 0)}
                            variant="destructive"
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            {t('orders.process_refund')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

