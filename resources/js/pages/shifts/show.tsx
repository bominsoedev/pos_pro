import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Clock, DollarSign, ShoppingCart, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface Order {
    id: number;
    order_number: string;
    total: number;
    created_at: string;
    customer: { name: string } | null;
    items: Array<{ quantity: number }>;
    payments: Array<{ method: string; amount: number }>;
}

interface PaymentBreakdown {
    method: string;
    total: number;
}

interface Shift {
    id: number;
    shift_number: string;
    status: string;
    opened_at: string;
    closed_at: string | null;
    opening_cash: number;
    closing_cash: number | null;
    expected_cash: number | null;
    cash_difference: number | null;
    total_sales: number;
    total_orders: number;
    user: {
        name: string;
    };
}

interface ShiftShowProps {
    shift: Shift;
    orders: Order[];
    paymentBreakdown: PaymentBreakdown[];
}

export default function ShiftShow({ shift, orders, paymentBreakdown }: ShiftShowProps) {
    const { t, currentLanguage } = useTranslation();

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            open: 'default',
            closed: 'secondary',
        };
        return variants[status] || 'secondary';
    };

    const getPaymentMethodLabel = (method: string) => {
        const labels: Record<string, string> = {
            cash: t('pos.cash'),
            card: t('pos.card'),
            mobile_payment: t('pos.mobile_payment'),
            bank_transfer: t('pos.bank_transfer'),
            other: t('pos.other'),
        };
        return labels[method] || method;
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.shifts'), href: '/shifts' },
            { title: shift.shift_number, href: `/shifts/${shift.id}` },
        ]}>
            <Head title={`${t('nav.shifts')} - ${shift.shift_number}`} />
            <div className="flex h-full flex-1 flex-col gap-2 overflow-x-auto rounded-lg p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href="/shifts">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold">{shift.shift_number}</h1>
                            <p className="text-muted-foreground">{t('nav.shifts')}</p>
                        </div>
                    </div>
                    <Badge variant={getStatusBadge(shift.status)}>
                        {shift.status === 'open' ? t('shifts.open') : t('shifts.closed')}
                    </Badge>
                </div>

                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                    {/* Stats Cards */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                            <CardTitle className="text-xs font-medium">{t('shifts.total_sales')}</CardTitle>
                            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">{formatCurrency(shift.total_sales, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</div>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                            <CardTitle className="text-xs font-medium">{t('shifts.total_orders')}</CardTitle>
                            <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">{shift.total_orders}</div>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                            <CardTitle className="text-xs font-medium">{t('shifts.opening_cash')}</CardTitle>
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">{formatCurrency(shift.opening_cash, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</div>
                        </CardContent>
                    </Card>

                    {shift.closed_at && (
                        <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                                <CardTitle className="text-xs font-medium">{t('shifts.cash_difference')}</CardTitle>
                                {shift.cash_difference && shift.cash_difference !== 0 ? (
                                    <X className="h-3.5 w-3.5 text-destructive" />
                                ) : (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className={`text-xl font-bold ${shift.cash_difference && shift.cash_difference !== 0 ? 'text-destructive' : 'text-green-500'}`}>
                                    {shift.cash_difference ? formatCurrency(shift.cash_difference, currentLanguage === 'my' ? 'my-MM' : 'en-US') : formatCurrency(0, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                    {/* Shift Details */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('shifts.shift_details')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('shifts.shift_number')}:</span>
                                <span className="font-medium">{shift.shift_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('shifts.user')}:</span>
                                <span className="font-medium">{shift.user.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('shifts.opened_at')}:</span>
                                <span className="font-medium">{new Date(shift.opened_at).toLocaleString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                            </div>
                            {shift.closed_at && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('shifts.closed_at')}:</span>
                                    <span className="font-medium">{new Date(shift.closed_at).toLocaleString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('shifts.opening_cash')}:</span>
                                <span className="font-medium">{formatCurrency(shift.opening_cash, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                            </div>
                            {shift.closing_cash !== null && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('shifts.closing_cash')}:</span>
                                    <span className="font-medium">{formatCurrency(shift.closing_cash, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                </div>
                            )}
                            {shift.expected_cash !== null && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('shifts.expected_cash')}:</span>
                                    <span className="font-medium">{formatCurrency(shift.expected_cash, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment Breakdown */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('shifts.payment_breakdown')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {paymentBreakdown.length > 0 ? (
                                paymentBreakdown.map((payment) => (
                                    <div key={payment.method} className="flex justify-between">
                                        <span className="text-muted-foreground">{getPaymentMethodLabel(payment.method)}:</span>
                                        <span className="font-medium">{formatCurrency(payment.total, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted-foreground">{t('common.no_data')}</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Orders List */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('orders.title')} ({orders.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {orders.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                {t('common.no_data')}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2 font-medium">{t('orders.order_number')}</th>
                                            <th className="text-left p-2 font-medium">{t('customers.name')}</th>
                                            <th className="text-left p-2 font-medium">{t('orders.total')}</th>
                                            <th className="text-left p-2 font-medium">{t('orders.payment_method')}</th>
                                            <th className="text-left p-2 font-medium">{t('orders.created_at')}</th>
                                            <th className="text-left p-2 font-medium">{t('common.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order) => (
                                            <tr key={order.id} className="border-b hover:bg-muted/50">
                                                <td className="p-2">{order.order_number}</td>
                                                <td className="p-2">{order.customer?.name || t('pos.walk_in_customer')}</td>
                                                <td className="p-2">{formatCurrency(order.total, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</td>
                                                <td className="p-2">
                                                    {order.payments.length > 0 ? (
                                                        order.payments.map((p, idx) => (
                                                            <span key={idx}>
                                                                {getPaymentMethodLabel(p.method)}
                                                                {idx < order.payments.length - 1 ? ', ' : ''}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="p-2">{new Date(order.created_at).toLocaleString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}</td>
                                                <td className="p-2">
                                                    <Link href={`/orders/${order.id}`}>
                                                        <Button variant="ghost" size="icon" title={t('common.view')}>
                                                            <ArrowLeft className="h-4 w-4 rotate-180" />
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
