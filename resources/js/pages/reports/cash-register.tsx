import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, router, Link } from '@inertiajs/react';
import { 
    DollarSign, 
    Calendar,
    Download,
    CreditCard,
    Banknote,
    Smartphone,
    Building2,
    MoreHorizontal
} from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface Payment {
    id: number;
    method: string;
    amount: number;
    created_at: string;
    order: {
        id: number;
        order_number: string;
        customer: { name: string } | null;
        user: { name: string } | null;
    };
}

interface CashRegisterReportProps {
    date: string;
    payments: Payment[];
    summary: {
        cash: number;
        card: number;
        mobile_payment: number;
        bank_transfer: number;
        other: number;
        total: number;
    };
}

export default function CashRegisterReport({ date, payments, summary }: CashRegisterReportProps) {
    const { t } = useTranslation();

    const formatTime = (date: string) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getMethodIcon = (method: string) => {
        switch (method) {
            case 'cash':
                return <Banknote className="h-4 w-4" />;
            case 'card':
                return <CreditCard className="h-4 w-4" />;
            case 'mobile_payment':
                return <Smartphone className="h-4 w-4" />;
            case 'bank_transfer':
                return <Building2 className="h-4 w-4" />;
            default:
                return <MoreHorizontal className="h-4 w-4" />;
        }
    };

    const getMethodLabel = (method: string) => {
        const methodMap: Record<string, string> = {
            'cash': t('pos.payment_method_cash'),
            'card': t('pos.payment_method_card'),
            'mobile_payment': t('pos.payment_method_mobile'),
            'bank_transfer': t('pos.payment_method_bank'),
            'other': t('pos.payment_method_other'),
        };
        return methodMap[method] || method.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const handleDateChange = (newDate: string) => {
        router.get('/reports/cash-register', { date: newDate }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.reports'), href: '/reports/cash-register' },
            { title: t('reports.cash_register'), href: '/reports/cash-register' },
        ]}>
            <Head title={t('reports.cash_register')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold">{t('reports.cash_register')}</h1>
                        <p className="text-muted-foreground">{t('reports.cash_register')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => handleDateChange(e.target.value)}
                            className="w-auto"
                        />
                        <Button 
                            onClick={() => {
                                window.location.href = `/export/cash-register?date=${date}`;
                            }}
                            variant="outline"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            {t('products.export_csv')}
                        </Button>
                        <Button onClick={handlePrint} variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            {t('common.print')}
                        </Button>
                    </div>
                </div>

                {/* Report Navigation */}
                <div className="flex gap-2 print:hidden flex-wrap">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/reports/daily">{t('reports.daily')}</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/reports/monthly">{t('reports.monthly')}</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/reports/yearly">{t('reports.yearly')}</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/reports/product-performance">{t('reports.product_performance')}</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/reports/cash-register">{t('reports.cash_register')}</Link>
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 print:grid-cols-3">
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('pos.payment_method_cash')}</CardTitle>
                            <Banknote className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(summary.cash)}</div>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('pos.payment_method_card')}</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(summary.card)}</div>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('pos.payment_method_mobile')}</CardTitle>
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(summary.mobile_payment)}</div>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('pos.payment_method_bank')}</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(summary.bank_transfer)}</div>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('pos.total')}</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(summary.total)}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Payment Transactions */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('reports.payment_transactions')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">{t('reports.time')}</th>
                                        <th className="text-left p-2">{t('orders.order_number')}</th>
                                        <th className="text-left p-2">{t('orders.customer')}</th>
                                        <th className="text-left p-2">{t('orders.cashier')}</th>
                                        <th className="text-left p-2">{t('reports.method')}</th>
                                        <th className="text-right p-2">{t('reports.amount')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.length > 0 ? (
                                        payments.map((payment) => (
                                            <tr key={payment.id} className="border-b hover:bg-muted/50">
                                                <td className="p-2 text-sm">{formatTime(payment.created_at)}</td>
                                                <td className="p-2">
                                                    <Link 
                                                        href={`/orders/${payment.order.id}`}
                                                        className="font-medium hover:underline"
                                                    >
                                                        {payment.order.order_number}
                                                    </Link>
                                                </td>
                                                <td className="p-2 text-sm">
                                                    {payment.order.customer?.name || t('pos.walk_in')}
                                                </td>
                                                <td className="p-2 text-sm">
                                                    {payment.order.user?.name || '-'}
                                                </td>
                                                <td className="p-2">
                                                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                                        {getMethodIcon(payment.method)}
                                                        {getMethodLabel(payment.method)}
                                                    </Badge>
                                                </td>
                                                <td className="p-2 text-right font-bold">
                                                    {formatCurrency(payment.amount)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="p-4 text-center text-muted-foreground">
                                                {t('common.no_data')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 font-bold">
                                        <td colSpan={5} className="p-2 text-right">{t('pos.total')}:</td>
                                        <td className="p-2 text-right">{formatCurrency(summary.total)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <style>{`
                @media print {
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </AppLayout>
    );
}

