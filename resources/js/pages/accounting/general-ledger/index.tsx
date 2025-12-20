import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, router, Link } from '@inertiajs/react';
import { BookOpen, Printer } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface Account {
    id: number;
    code: string;
    name: string;
    type: string;
    display_name: string;
}

interface LedgerEntry {
    id: number;
    date: string;
    entry_number: string;
    description: string;
    reference: string | null;
    debit: number;
    credit: number;
    balance: number;
}

interface Props {
    accounts: Account[];
    selectedAccount: Account | null;
    ledgerEntries: LedgerEntry[];
    openingBalance: number;
    closingBalance: number;
    filters: {
        account_id?: string;
        date_from?: string;
        date_to?: string;
    };
}

export default function GeneralLedgerIndex({ accounts, selectedAccount, ledgerEntries, openingBalance, closingBalance, filters }: Props) {
    const { t, currentLanguage } = useTranslation();

    const groupedAccounts = accounts.reduce((groups, account) => {
        if (!groups[account.type]) {
            groups[account.type] = [];
        }
        groups[account.type].push(account);
        return groups;
    }, {} as Record<string, Account[]>);

    const handleFilter = (newFilters: Partial<typeof filters>) => {
        router.get('/accounting/general-ledger', {
            ...filters,
            ...newFilters,
        }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting'), href: '/accounting/accounts' },
            { title: t('accounting.general_ledger'), href: '/accounting/general-ledger' },
        ]}>
            <Head title={t('accounting.general_ledger')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold">{t('accounting.general_ledger')}</h1>
                        <p className="text-muted-foreground">{t('accounting.general_ledger_desc')}</p>
                    </div>
                    {selectedAccount && (
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="h-4 w-4 mr-2" />
                            {t('common.print')}
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70 print:hidden">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                                <Label>{t('accounting.select_account')}</Label>
                                <Select
                                    value={filters.account_id || ''}
                                    onValueChange={(v) => handleFilter({ account_id: v || undefined })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('accounting.select_account')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(groupedAccounts).map(([type, accts]) => (
                                            <div key={type}>
                                                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                                                    {type}
                                                </div>
                                                {accts.map((account) => (
                                                    <SelectItem key={account.id} value={account.id.toString()}>
                                                        {account.display_name}
                                                    </SelectItem>
                                                ))}
                                            </div>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>{t('common.from')}</Label>
                                <Input
                                    type="date"
                                    value={filters.date_from || ''}
                                    onChange={(e) => handleFilter({ date_from: e.target.value || undefined })}
                                />
                            </div>
                            <div>
                                <Label>{t('common.to')}</Label>
                                <Input
                                    type="date"
                                    value={filters.date_to || ''}
                                    onChange={(e) => handleFilter({ date_to: e.target.value || undefined })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {selectedAccount ? (
                    <>
                        {/* Account Header */}
                        <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5" />
                                    <span className="font-mono">{selectedAccount.code}</span>
                                    <span>{selectedAccount.name}</span>
                                </CardTitle>
                            </CardHeader>
                        </Card>

                        {/* Ledger */}
                        <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                            <CardContent className="pt-6">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-2">{t('common.date')}</th>
                                            <th className="text-left py-3 px-2">{t('accounting.entry_number')}</th>
                                            <th className="text-left py-3 px-2">{t('common.description')}</th>
                                            <th className="text-right py-3 px-2 w-32">{t('accounting.debit')}</th>
                                            <th className="text-right py-3 px-2 w-32">{t('accounting.credit')}</th>
                                            <th className="text-right py-3 px-2 w-40">{t('accounting.balance')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Opening Balance */}
                                        <tr className="bg-muted/50 font-medium">
                                            <td colSpan={5} className="py-3 px-2">{t('accounting.opening_balance')}</td>
                                            <td className="py-3 px-2 text-right">
                                                {formatCurrency(openingBalance, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                            </td>
                                        </tr>
                                        {ledgerEntries.map((entry) => (
                                            <tr key={entry.id} className="border-b hover:bg-muted/30">
                                                <td className="py-3 px-2">
                                                    {new Date(entry.date).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                                </td>
                                                <td className="py-3 px-2">
                                                    <Link href={`/accounting/journal-entries/${entry.id}`} className="text-primary hover:underline">
                                                        {entry.entry_number}
                                                    </Link>
                                                </td>
                                                <td className="py-3 px-2">{entry.description}</td>
                                                <td className="py-3 px-2 text-right">
                                                    {entry.debit > 0 ? formatCurrency(entry.debit, currentLanguage === 'my' ? 'my-MM' : 'en-US') : ''}
                                                </td>
                                                <td className="py-3 px-2 text-right">
                                                    {entry.credit > 0 ? formatCurrency(entry.credit, currentLanguage === 'my' ? 'my-MM' : 'en-US') : ''}
                                                </td>
                                                <td className="py-3 px-2 text-right font-medium">
                                                    {formatCurrency(entry.balance, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Closing Balance */}
                                        <tr className="bg-muted font-bold">
                                            <td colSpan={5} className="py-3 px-2">{t('accounting.closing_balance')}</td>
                                            <td className="py-3 px-2 text-right">
                                                {formatCurrency(closingBalance, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                {ledgerEntries.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        {t('accounting.no_transactions')}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardContent className="py-16 text-center text-muted-foreground">
                            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>{t('accounting.select_account_prompt')}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
