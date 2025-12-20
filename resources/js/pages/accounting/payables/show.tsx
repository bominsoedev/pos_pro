import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, router, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, DollarSign, Printer } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface Payment {
    id: number;
    payment_number: string;
    payment_date: string;
    amount: number;
    payment_method: string;
    reference: string | null;
    created_by: { name: string } | null;
}

interface Payable {
    id: number;
    invoice_number: string;
    supplier: { id: number; name: string } | null;
    invoice_date: string;
    due_date: string;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    paid_amount: number;
    balance_due: number;
    status: string;
    description: string | null;
    notes: string | null;
    payments: Payment[];
    created_by: { name: string } | null;
}

interface Props {
    payable: Payable;
}

export default function ShowPayable({ payable }: Props) {
    const { t, currentLanguage } = useTranslation();
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        payment_date: new Date().toISOString().split('T')[0],
        amount: payable.balance_due,
        payment_method: 'cash',
        bank_account_id: null as number | null,
        reference: '',
        notes: '',
    });

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            partial: 'bg-blue-100 text-blue-800',
            paid: 'bg-green-100 text-green-800',
            overdue: 'bg-red-100 text-red-800',
            void: 'bg-gray-100 text-gray-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/accounting/payables/${payable.id}/payment`, {
            onSuccess: () => {
                setShowPaymentDialog(false);
                reset();
            },
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting'), href: '/accounting/accounts' },
            { title: t('accounting.accounts_payable'), href: '/accounting/payables' },
            { title: payable.invoice_number, href: `/accounting/payables/${payable.id}` },
        ]}>
            <Head title={payable.invoice_number} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between print:hidden">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/accounting/payables">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                {payable.invoice_number}
                                <Badge className={getStatusColor(payable.status)}>
                                    {t(`accounting.${payable.status}`)}
                                </Badge>
                            </h1>
                            <p className="text-muted-foreground">{payable.supplier?.name}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="h-4 w-4 mr-2" />
                            {t('common.print')}
                        </Button>
                        {payable.balance_due > 0 && (
                            <Button onClick={() => setShowPaymentDialog(true)}>
                                <DollarSign className="h-4 w-4 mr-2" />
                                {t('accounting.record_payment')}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Invoice Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('common.details')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">{t('accounting.invoice_date')}</Label>
                                    <p className="font-medium">
                                        {new Date(payable.invoice_date).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">{t('accounting.due_date')}</Label>
                                    <p className="font-medium">
                                        {new Date(payable.due_date).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                    </p>
                                </div>
                            </div>
                            {payable.description && (
                                <div>
                                    <Label className="text-muted-foreground">{t('common.description')}</Label>
                                    <p className="font-medium">{payable.description}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('common.summary')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
                                <span>{t('accounting.subtotal')}</span>
                                <span>{formatCurrency(payable.subtotal, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>{t('accounting.tax')}</span>
                                <span>{formatCurrency(payable.tax_amount, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                            </div>
                            <div className="flex justify-between font-bold border-t pt-2">
                                <span>{t('common.total')}</span>
                                <span>{formatCurrency(payable.total_amount, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                            </div>
                            <div className="flex justify-between text-green-600">
                                <span>{t('accounting.paid')}</span>
                                <span>{formatCurrency(payable.paid_amount, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg border-t pt-2">
                                <span>{t('accounting.balance')}</span>
                                <span className={payable.balance_due > 0 ? 'text-red-600' : 'text-green-600'}>
                                    {formatCurrency(payable.balance_due, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Payment History */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('accounting.payment_history')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-2">{t('common.date')}</th>
                                    <th className="text-left py-3 px-2">{t('accounting.payment_number')}</th>
                                    <th className="text-left py-3 px-2">{t('accounting.method')}</th>
                                    <th className="text-left py-3 px-2">{t('accounting.reference')}</th>
                                    <th className="text-right py-3 px-2">{t('common.amount')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payable.payments.map((payment) => (
                                    <tr key={payment.id} className="border-b">
                                        <td className="py-3 px-2">
                                            {new Date(payment.payment_date).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                        </td>
                                        <td className="py-3 px-2">{payment.payment_number}</td>
                                        <td className="py-3 px-2 capitalize">{payment.payment_method}</td>
                                        <td className="py-3 px-2">{payment.reference || '-'}</td>
                                        <td className="py-3 px-2 text-right font-medium">
                                            {formatCurrency(payment.amount, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                        </td>
                                    </tr>
                                ))}
                                {payable.payments.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-muted-foreground">
                                            {t('accounting.no_payments')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Payment Dialog */}
                <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('accounting.record_payment')}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handlePayment}>
                            <div className="space-y-4 py-4">
                                <div>
                                    <Label>{t('accounting.payment_date')} *</Label>
                                    <Input
                                        type="date"
                                        value={data.payment_date}
                                        onChange={(e) => setData('payment_date', e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>{t('common.amount')} *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        max={payable.balance_due}
                                        value={data.amount}
                                        onChange={(e) => setData('amount', parseFloat(e.target.value))}
                                        required
                                    />
                                    {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
                                </div>
                                <div>
                                    <Label>{t('accounting.payment_method')} *</Label>
                                    <Select value={data.payment_method} onValueChange={(v) => setData('payment_method', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cash">{t('pos.cash')}</SelectItem>
                                            <SelectItem value="bank_transfer">{t('pos.bank_transfer')}</SelectItem>
                                            <SelectItem value="cheque">{t('accounting.cheque')}</SelectItem>
                                            <SelectItem value="other">{t('common.other')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>{t('accounting.reference')}</Label>
                                    <Input
                                        value={data.reference}
                                        onChange={(e) => setData('reference', e.target.value)}
                                        placeholder={t('accounting.reference_placeholder')}
                                    />
                                </div>
                                <div>
                                    <Label>{t('common.notes')}</Label>
                                    <Textarea
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={2}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowPaymentDialog(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {t('accounting.record_payment')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
