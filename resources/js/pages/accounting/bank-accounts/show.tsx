import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Building2, Upload, FileCheck, Download, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';
import Pagination from '@/components/pagination';

interface BankTransaction {
    id: number;
    transaction_date: string;
    description: string;
    reference: string | null;
    amount: number;
    type: 'deposit' | 'withdrawal';
    is_reconciled: boolean;
    journal_entry_id: number | null;
}

interface BankAccount {
    id: number;
    name: string;
    bank_name: string;
    account_number: string;
    account_type: string;
    currency: string;
    opening_balance: number;
    current_balance: number;
    is_active: boolean;
    last_reconciled_at: string | null;
    last_reconciled_balance: number | null;
}

interface Props {
    bankAccount: BankAccount;
    transactions: {
        data: BankTransaction[];
        links: any;
    };
}

export default function ShowBankAccount({ bankAccount, transactions }: Props) {
    const { t, currentLanguage } = useTranslation();
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);

    const handleImport = (e: React.FormEvent) => {
        e.preventDefault();
        if (!importFile) return;

        const formData = new FormData();
        formData.append('file', importFile);

        router.post(`/accounting/bank-accounts/${bankAccount.id}/import`, formData, {
            forceFormData: true,
            onSuccess: () => {
                setShowImportDialog(false);
                setImportFile(null);
            },
        });
    };

    const deposits = transactions.data.filter(t => t.type === 'deposit').reduce((sum, t) => sum + Number(t.amount), 0);
    const withdrawals = transactions.data.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + Number(t.amount), 0);

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting'), href: '/accounting/accounts' },
            { title: t('accounting.bank_accounts'), href: '/accounting/bank-accounts' },
            { title: bankAccount.name, href: `/accounting/bank-accounts/${bankAccount.id}` },
        ]}>
            <Head title={bankAccount.name} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/accounting/bank-accounts">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Building2 className="h-6 w-6" />
                                {bankAccount.name}
                                <Badge variant={bankAccount.is_active ? 'default' : 'secondary'}>
                                    {bankAccount.is_active ? t('common.active') : t('common.inactive')}
                                </Badge>
                            </h1>
                            <p className="text-muted-foreground">
                                {bankAccount.bank_name} • ****{bankAccount.account_number.slice(-4)}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                            <Upload className="h-4 w-4 mr-2" />
                            {t('accounting.import_transactions')}
                        </Button>
                        <Button asChild>
                            <Link href={`/accounting/bank-accounts/${bankAccount.id}/reconcile`}>
                                <FileCheck className="h-4 w-4 mr-2" />
                                {t('accounting.reconcile')}
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {t('accounting.current_balance')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(bankAccount.current_balance, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                <ArrowDownLeft className="h-4 w-4 text-green-600" />
                                {t('accounting.deposits')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(deposits, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                <ArrowUpRight className="h-4 w-4 text-red-600" />
                                {t('accounting.withdrawals')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {formatCurrency(withdrawals, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {t('accounting.last_reconciled')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-medium">
                                {bankAccount.last_reconciled_at
                                    ? new Date(bankAccount.last_reconciled_at).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')
                                    : t('common.never')
                                }
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Transactions Table */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('accounting.transactions')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-2">{t('common.date')}</th>
                                    <th className="text-left py-3 px-2">{t('common.description')}</th>
                                    <th className="text-left py-3 px-2">{t('accounting.reference')}</th>
                                    <th className="text-right py-3 px-2">{t('accounting.deposit')}</th>
                                    <th className="text-right py-3 px-2">{t('accounting.withdrawal')}</th>
                                    <th className="text-center py-3 px-2">{t('accounting.reconciled')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.data.map((txn) => (
                                    <tr key={txn.id} className="border-b hover:bg-muted/30">
                                        <td className="py-3 px-2">
                                            {new Date(txn.transaction_date).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                        </td>
                                        <td className="py-3 px-2">{txn.description}</td>
                                        <td className="py-3 px-2 text-muted-foreground">{txn.reference || '-'}</td>
                                        <td className="py-3 px-2 text-right text-green-600">
                                            {txn.type === 'deposit' ? formatCurrency(txn.amount, currentLanguage === 'my' ? 'my-MM' : 'en-US') : ''}
                                        </td>
                                        <td className="py-3 px-2 text-right text-red-600">
                                            {txn.type === 'withdrawal' ? formatCurrency(txn.amount, currentLanguage === 'my' ? 'my-MM' : 'en-US') : ''}
                                        </td>
                                        <td className="py-3 px-2 text-center">
                                            {txn.is_reconciled ? (
                                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                                    {t('common.yes')}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                                    {t('common.no')}
                                                </Badge>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {transactions.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                                            {t('accounting.no_transactions')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                <Pagination links={transactions.links} />

                {/* Import Dialog */}
                <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('accounting.import_transactions')}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleImport}>
                            <div className="space-y-4 py-4">
                                <div>
                                    <Label>{t('accounting.csv_file')} *</Label>
                                    <Input
                                        type="file"
                                        accept=".csv"
                                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {t('accounting.csv_format_help')}
                                    </p>
                                </div>
                                <div className="bg-muted p-3 rounded text-sm">
                                    <p className="font-medium mb-2">{t('accounting.csv_columns')}:</p>
                                    <code className="text-xs">date, description, reference, amount, type</code>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowImportDialog(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" disabled={!importFile}>
                                    <Upload className="h-4 w-4 mr-2" />
                                    {t('common.import')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
