import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, FileCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface BankTransaction {
    id: number;
    transaction_date: string;
    description: string;
    reference: string | null;
    amount: number;
    type: 'deposit' | 'withdrawal';
    is_reconciled: boolean;
}

interface JournalEntryLine {
    id: number;
    journal_entry: {
        id: number;
        entry_number: string;
        entry_date: string;
        description: string;
    };
    debit: number;
    credit: number;
    description: string | null;
}

interface BankAccount {
    id: number;
    name: string;
    bank_name: string;
    account_number: string;
    current_balance: number;
    last_reconciled_at: string | null;
    last_reconciled_balance: number | null;
}

interface Props {
    bankAccount: BankAccount;
    bankTransactions: BankTransaction[];
    bookTransactions: JournalEntryLine[];
    statementBalance: number;
    bookBalance: number;
}

export default function ReconcileBankAccount({
    bankAccount,
    bankTransactions,
    bookTransactions,
    statementBalance,
    bookBalance,
}: Props) {
    const { t, currentLanguage } = useTranslation();
    const [statementEndingBalance, setStatementEndingBalance] = useState(statementBalance);
    const [reconcileDate, setReconcileDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedBankTxns, setSelectedBankTxns] = useState<number[]>(
        bankTransactions.filter(t => t.is_reconciled).map(t => t.id)
    );
    const [selectedBookTxns, setSelectedBookTxns] = useState<number[]>([]);

    // Calculate cleared balance
    const clearedDeposits = bankTransactions
        .filter(t => selectedBankTxns.includes(t.id) && t.type === 'deposit')
        .reduce((sum, t) => sum + Number(t.amount), 0);
    const clearedWithdrawals = bankTransactions
        .filter(t => selectedBankTxns.includes(t.id) && t.type === 'withdrawal')
        .reduce((sum, t) => sum + Number(t.amount), 0);
    const clearedBalance = (bankAccount.last_reconciled_balance || 0) + clearedDeposits - clearedWithdrawals;
    const difference = statementEndingBalance - clearedBalance;
    const isBalanced = Math.abs(difference) < 0.01;

    const toggleBankTxn = (id: number) => {
        setSelectedBankTxns(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleBookTxn = (id: number) => {
        setSelectedBookTxns(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleReconcile = () => {
        router.post(`/accounting/bank-accounts/${bankAccount.id}/complete-reconciliation`, {
            reconcile_date: reconcileDate,
            statement_balance: statementEndingBalance,
            cleared_transactions: selectedBankTxns,
            matched_journal_entries: selectedBookTxns,
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting'), href: '/accounting/accounts' },
            { title: t('accounting.bank_accounts'), href: '/accounting/bank-accounts' },
            { title: bankAccount.name, href: `/accounting/bank-accounts/${bankAccount.id}` },
            { title: t('accounting.reconcile'), href: '#' },
        ]}>
            <Head title={`${t('accounting.reconcile')} - ${bankAccount.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={`/accounting/bank-accounts/${bankAccount.id}`}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <FileCheck className="h-6 w-6" />
                                {t('accounting.bank_reconciliation')}
                            </h1>
                            <p className="text-muted-foreground">
                                {bankAccount.name} • {bankAccount.bank_name}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Reconciliation Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {t('accounting.statement_ending_balance')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Input
                                type="number"
                                step="0.01"
                                value={statementEndingBalance}
                                onChange={(e) => setStatementEndingBalance(parseFloat(e.target.value) || 0)}
                                className="text-lg font-bold"
                            />
                        </CardContent>
                    </Card>
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {t('accounting.cleared_balance')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(clearedBalance, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {t('accounting.difference')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(difference, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {t('accounting.reconcile_date')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Input
                                type="date"
                                value={reconcileDate}
                                onChange={(e) => setReconcileDate(e.target.value)}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Status Banner */}
                {isBalanced ? (
                    <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium">{t('accounting.reconciliation_balanced')}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">{t('accounting.reconciliation_not_balanced')}</span>
                    </div>
                )}

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Bank Statement Transactions */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>{t('accounting.bank_statement')}</span>
                                <Badge variant="outline">
                                    {selectedBankTxns.length} / {bankTransactions.length} {t('accounting.cleared')}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-96 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-background">
                                        <tr className="border-b">
                                            <th className="w-8 py-2"></th>
                                            <th className="text-left py-2">{t('common.date')}</th>
                                            <th className="text-left py-2">{t('common.description')}</th>
                                            <th className="text-right py-2">{t('common.amount')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bankTransactions.map((txn) => (
                                            <tr
                                                key={txn.id}
                                                className={`border-b cursor-pointer hover:bg-muted/30 ${
                                                    selectedBankTxns.includes(txn.id) ? 'bg-green-50' : ''
                                                }`}
                                                onClick={() => toggleBankTxn(txn.id)}
                                            >
                                                <td className="py-2">
                                                    <Checkbox
                                                        checked={selectedBankTxns.includes(txn.id)}
                                                        onCheckedChange={() => toggleBankTxn(txn.id)}
                                                    />
                                                </td>
                                                <td className="py-2">
                                                    {new Date(txn.transaction_date).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                                </td>
                                                <td className="py-2">{txn.description}</td>
                                                <td className={`py-2 text-right ${txn.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {txn.type === 'deposit' ? '+' : '-'}
                                                    {formatCurrency(txn.amount, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                                </td>
                                            </tr>
                                        ))}
                                        {bankTransactions.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="text-center py-8 text-muted-foreground">
                                                    {t('accounting.no_transactions')}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Book Transactions */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>{t('accounting.book_entries')}</span>
                                <Badge variant="outline">
                                    {selectedBookTxns.length} / {bookTransactions.length} {t('accounting.matched')}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-96 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-background">
                                        <tr className="border-b">
                                            <th className="w-8 py-2"></th>
                                            <th className="text-left py-2">{t('common.date')}</th>
                                            <th className="text-left py-2">{t('accounting.entry')}</th>
                                            <th className="text-right py-2">{t('common.amount')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookTransactions.map((txn) => {
                                            const amount = txn.debit > 0 ? txn.debit : txn.credit;
                                            const isDebit = txn.debit > 0;
                                            return (
                                                <tr
                                                    key={txn.id}
                                                    className={`border-b cursor-pointer hover:bg-muted/30 ${
                                                        selectedBookTxns.includes(txn.id) ? 'bg-green-50' : ''
                                                    }`}
                                                    onClick={() => toggleBookTxn(txn.id)}
                                                >
                                                    <td className="py-2">
                                                        <Checkbox
                                                            checked={selectedBookTxns.includes(txn.id)}
                                                            onCheckedChange={() => toggleBookTxn(txn.id)}
                                                        />
                                                    </td>
                                                    <td className="py-2">
                                                        {new Date(txn.journal_entry.entry_date).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                                    </td>
                                                    <td className="py-2">
                                                        <Link
                                                            href={`/accounting/journal-entries/${txn.journal_entry.id}`}
                                                            className="text-primary hover:underline"
                                                        >
                                                            {txn.journal_entry.entry_number}
                                                        </Link>
                                                        <span className="text-muted-foreground ml-2">
                                                            {txn.description || txn.journal_entry.description}
                                                        </span>
                                                    </td>
                                                    <td className={`py-2 text-right ${isDebit ? 'text-green-600' : 'text-red-600'}`}>
                                                        {isDebit ? '+' : '-'}
                                                        {formatCurrency(amount, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {bookTransactions.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="text-center py-8 text-muted-foreground">
                                                    {t('accounting.no_entries')}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <Button variant="outline" asChild>
                        <Link href={`/accounting/bank-accounts/${bankAccount.id}`}>
                            {t('common.cancel')}
                        </Link>
                    </Button>
                    <Button onClick={handleReconcile} disabled={!isBalanced}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {t('accounting.complete_reconciliation')}
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
