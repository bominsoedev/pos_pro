import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Plus, Building2, CreditCard, Search, Upload, FileCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface Account {
    id: number;
    code: string;
    name: string;
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
    account: Account | null;
    last_reconciled_at: string | null;
}

interface Props {
    bankAccounts: BankAccount[];
    accounts: Account[];
}

export default function BankAccountsIndex({ bankAccounts, accounts }: Props) {
    const { t, currentLanguage } = useTranslation();
    const [search, setSearch] = useState('');
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [selectedBankAccount, setSelectedBankAccount] = useState<BankAccount | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        bank_name: '',
        account_number: '',
        account_type: 'checking',
        currency: 'MMK',
        opening_balance: 0,
        account_id: null as number | null,
        description: '',
    });

    const filteredAccounts = bankAccounts.filter((account) =>
        account.name.toLowerCase().includes(search.toLowerCase()) ||
        account.bank_name.toLowerCase().includes(search.toLowerCase()) ||
        account.account_number.includes(search)
    );

    const totalBalance = bankAccounts.reduce((sum, acc) => sum + Number(acc.current_balance), 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedBankAccount) {
            put(`/accounting/bank-accounts/${selectedBankAccount.id}`, {
                onSuccess: () => {
                    setShowCreateDialog(false);
                    setSelectedBankAccount(null);
                    reset();
                },
            });
        } else {
            post('/accounting/bank-accounts', {
                onSuccess: () => {
                    setShowCreateDialog(false);
                    reset();
                },
            });
        }
    };

    const handleEdit = (bankAccount: BankAccount) => {
        setSelectedBankAccount(bankAccount);
        setData({
            name: bankAccount.name,
            bank_name: bankAccount.bank_name,
            account_number: bankAccount.account_number,
            account_type: bankAccount.account_type,
            currency: bankAccount.currency,
            opening_balance: bankAccount.opening_balance,
            account_id: bankAccount.account?.id || null,
            description: '',
        });
        setShowCreateDialog(true);
    };

    const handleCreate = () => {
        setSelectedBankAccount(null);
        reset();
        setShowCreateDialog(true);
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting'), href: '/accounting/accounts' },
            { title: t('accounting.bank_accounts'), href: '/accounting/bank-accounts' },
        ]}>
            <Head title={t('accounting.bank_accounts')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Building2 className="h-6 w-6" />
                            {t('accounting.bank_accounts')}
                        </h1>
                        <p className="text-muted-foreground">{t('accounting.bank_accounts_description')}</p>
                    </div>
                    <Button onClick={handleCreate}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('accounting.add_bank_account')}
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {t('accounting.total_balance')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(totalBalance, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {t('accounting.active_accounts')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {bankAccounts.filter(a => a.is_active).length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {t('accounting.needs_reconciliation')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">
                                {bankAccounts.filter(a => !a.last_reconciled_at || new Date(a.last_reconciled_at) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <div className="flex gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('common.search')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Bank Accounts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAccounts.map((bankAccount) => (
                        <Card key={bankAccount.id} className="backdrop-blur-sm bg-background/80 border-sidebar-border/70 hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{bankAccount.name}</CardTitle>
                                        <p className="text-sm text-muted-foreground">{bankAccount.bank_name}</p>
                                    </div>
                                    <Badge variant={bankAccount.is_active ? 'default' : 'secondary'}>
                                        {bankAccount.is_active ? t('common.active') : t('common.inactive')}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <CreditCard className="h-4 w-4" />
                                    <span>****{bankAccount.account_number.slice(-4)}</span>
                                    <Badge variant="outline" className="ml-auto capitalize">
                                        {bankAccount.account_type}
                                    </Badge>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">{t('accounting.current_balance')}</div>
                                    <div className="text-xl font-bold">
                                        {formatCurrency(bankAccount.current_balance, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1" asChild>
                                        <Link href={`/accounting/bank-accounts/${bankAccount.id}`}>
                                            {t('common.view')}
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(bankAccount)}>
                                        {t('common.edit')}
                                    </Button>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/accounting/bank-accounts/${bankAccount.id}/reconcile`}>
                                            <FileCheck className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {filteredAccounts.length === 0 && (
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardContent className="py-12 text-center text-muted-foreground">
                            {t('accounting.no_bank_accounts')}
                        </CardContent>
                    </Card>
                )}

                {/* Create/Edit Dialog */}
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedBankAccount ? t('accounting.edit_bank_account') : t('accounting.add_bank_account')}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4 py-4">
                                <div>
                                    <Label>{t('common.name')} *</Label>
                                    <Input
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder={t('accounting.account_name_placeholder')}
                                        required
                                    />
                                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                </div>
                                <div>
                                    <Label>{t('accounting.bank_name')} *</Label>
                                    <Input
                                        value={data.bank_name}
                                        onChange={(e) => setData('bank_name', e.target.value)}
                                        placeholder="e.g., KBZ Bank, AYA Bank"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>{t('accounting.account_number')} *</Label>
                                    <Input
                                        value={data.account_number}
                                        onChange={(e) => setData('account_number', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>{t('accounting.account_type')}</Label>
                                        <Select value={data.account_type} onValueChange={(v) => setData('account_type', v)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="checking">{t('accounting.checking')}</SelectItem>
                                                <SelectItem value="savings">{t('accounting.savings')}</SelectItem>
                                                <SelectItem value="credit_card">{t('accounting.credit_card')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>{t('accounting.currency')}</Label>
                                        <Select value={data.currency} onValueChange={(v) => setData('currency', v)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MMK">MMK</SelectItem>
                                                <SelectItem value="USD">USD</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div>
                                    <Label>{t('accounting.opening_balance')}</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={data.opening_balance}
                                        onChange={(e) => setData('opening_balance', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div>
                                    <Label>{t('accounting.linked_account')}</Label>
                                    <Select
                                        value={data.account_id?.toString() || ''}
                                        onValueChange={(v) => setData('account_id', v ? parseInt(v) : null)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('common.select')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {accounts.map((acc) => (
                                                <SelectItem key={acc.id} value={acc.id.toString()}>
                                                    {acc.code} - {acc.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {t('accounting.linked_account_help')}
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {selectedBankAccount ? t('common.save') : t('common.create')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
