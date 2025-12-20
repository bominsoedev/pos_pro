import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface Supplier {
    id: number;
    name: string;
}

interface Account {
    id: number;
    code: string;
    name: string;
}

interface Props {
    suppliers: Supplier[];
    expenseAccounts: Account[];
}

export default function CreatePayable({ suppliers, expenseAccounts }: Props) {
    const { t, currentLanguage } = useTranslation();

    const { data, setData, post, processing, errors } = useForm({
        supplier_id: null as number | null,
        invoice_number: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        subtotal: 0,
        tax_amount: 0,
        description: '',
        notes: '',
        expense_account_id: null as number | null,
    });

    const totalAmount = (data.subtotal || 0) + (data.tax_amount || 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/accounting/payables');
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting'), href: '/accounting/accounts' },
            { title: t('accounting.accounts_payable'), href: '/accounting/payables' },
            { title: t('common.create'), href: '/accounting/payables/create' },
        ]}>
            <Head title={t('accounting.create_payable')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/accounting/payables">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <FileText className="h-6 w-6" />
                            {t('accounting.create_payable')}
                        </h1>
                        <p className="text-muted-foreground">{t('accounting.create_payable_description')}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="max-w-2xl">
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('accounting.invoice_details')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>{t('suppliers.supplier')} *</Label>
                                <Select
                                    value={data.supplier_id?.toString() || ''}
                                    onValueChange={(v) => setData('supplier_id', v ? parseInt(v) : null)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('accounting.select_supplier')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map((supplier) => (
                                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                                {supplier.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.supplier_id && <p className="text-sm text-destructive">{errors.supplier_id}</p>}
                            </div>

                            <div>
                                <Label>{t('accounting.invoice_number')}</Label>
                                <Input
                                    value={data.invoice_number}
                                    onChange={(e) => setData('invoice_number', e.target.value)}
                                    placeholder={t('accounting.invoice_number_placeholder')}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {t('accounting.invoice_number_help')}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>{t('accounting.invoice_date')} *</Label>
                                    <Input
                                        type="date"
                                        value={data.invoice_date}
                                        onChange={(e) => setData('invoice_date', e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>{t('accounting.due_date')} *</Label>
                                    <Input
                                        type="date"
                                        value={data.due_date}
                                        onChange={(e) => setData('due_date', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>{t('accounting.expense_account')}</Label>
                                <Select
                                    value={data.expense_account_id?.toString() || ''}
                                    onValueChange={(v) => setData('expense_account_id', v ? parseInt(v) : null)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('common.select')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {expenseAccounts.map((acc) => (
                                            <SelectItem key={acc.id} value={acc.id.toString()}>
                                                {acc.code} - {acc.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {t('accounting.expense_account_help')}
                                </p>
                            </div>

                            <div>
                                <Label>{t('common.description')}</Label>
                                <Textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={2}
                                    placeholder={t('accounting.payable_description_placeholder')}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70 mt-4">
                        <CardHeader>
                            <CardTitle>{t('accounting.amounts')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>{t('accounting.subtotal')} *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.subtotal}
                                        onChange={(e) => setData('subtotal', parseFloat(e.target.value) || 0)}
                                        required
                                    />
                                    {errors.subtotal && <p className="text-sm text-destructive">{errors.subtotal}</p>}
                                </div>
                                <div>
                                    <Label>{t('accounting.tax_amount')}</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.tax_amount}
                                        onChange={(e) => setData('tax_amount', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <div className="flex justify-between text-lg font-bold">
                                    <span>{t('common.total')}</span>
                                    <span>{formatCurrency(totalAmount, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70 mt-4">
                        <CardContent className="pt-6">
                            <div>
                                <Label>{t('common.notes')}</Label>
                                <Textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={2}
                                    placeholder={t('accounting.internal_notes_placeholder')}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4 mt-6">
                        <Button variant="outline" asChild>
                            <Link href="/accounting/payables">{t('common.cancel')}</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {t('common.create')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
