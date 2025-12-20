import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, router, Link } from '@inertiajs/react';
import { Printer, CheckCircle, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface AccountBalance {
    id: number;
    code: string;
    name: string;
    type: string;
    debit: number;
    credit: number;
    balance: number;
    debit_balance: number;
    credit_balance: number;
}

interface Props {
    accounts: AccountBalance[];
    totals: {
        debit: number;
        credit: number;
    };
    isBalanced: boolean;
    filters: {
        date_from?: string;
        date_to?: string;
    };
    dateTo: string;
}

export default function TrialBalance({ accounts, totals, isBalanced, filters, dateTo }: Props) {
    const { t, currentLanguage } = useTranslation();

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            asset: 'text-blue-600',
            liability: 'text-red-600',
            equity: 'text-purple-600',
            income: 'text-green-600',
            expense: 'text-orange-600',
        };
        return colors[type] || '';
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting'), href: '/accounting/accounts' },
            { title: t('accounting.trial_balance'), href: '/accounting/trial-balance' },
        ]}>
            <Head title={t('accounting.trial_balance')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold">{t('accounting.trial_balance')}</h1>
                        <p className="text-muted-foreground">
                            {t('accounting.as_of')} {new Date(dateTo).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {isBalanced ? (
                            <Badge className="bg-green-100 text-green-800 gap-1">
                                <CheckCircle className="h-4 w-4" />
                                {t('accounting.balanced')}
                            </Badge>
                        ) : (
                            <Badge className="bg-red-100 text-red-800 gap-1">
                                <AlertCircle className="h-4 w-4" />
                                {t('accounting.not_balanced')}
                            </Badge>
                        )}
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="h-4 w-4 mr-2" />
                            {t('common.print')}
                        </Button>
                    </div>
                </div>

                {/* Report Navigation */}
                <div className="flex gap-2 print:hidden flex-wrap">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/accounting/trial-balance">{t('accounting.trial_balance')}</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/accounting/reports/balance-sheet">{t('accounting.balance_sheet')}</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/accounting/reports/income-statement">{t('accounting.income_statement')}</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/accounting/reports/cash-flow">{t('accounting.cash_flow')}</Link>
                    </Button>
                </div>

                {/* Date Filters */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70 print:hidden">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div>
                                <Label>{t('common.from')}</Label>
                                <Input
                                    type="date"
                                    value={filters.date_from || ''}
                                    onChange={(e) => router.get('/accounting/trial-balance', {
                                        ...filters,
                                        date_from: e.target.value || undefined,
                                    }, { preserveState: true })}
                                />
                            </div>
                            <div>
                                <Label>{t('common.to')}</Label>
                                <Input
                                    type="date"
                                    value={filters.date_to || ''}
                                    onChange={(e) => router.get('/accounting/trial-balance', {
                                        ...filters,
                                        date_to: e.target.value || undefined,
                                    }, { preserveState: true })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Trial Balance */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader className="print:pb-2">
                        <CardTitle className="text-center print:text-xl">
                            {t('accounting.trial_balance')}
                            <div className="text-sm font-normal text-muted-foreground mt-1">
                                {t('accounting.as_of')} {new Date(dateTo).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2">
                                    <th className="text-left py-3 px-2 w-24">{t('accounting.code')}</th>
                                    <th className="text-left py-3 px-2">{t('accounting.account_name')}</th>
                                    <th className="text-right py-3 px-2 w-40">{t('accounting.debit')}</th>
                                    <th className="text-right py-3 px-2 w-40">{t('accounting.credit')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map((account) => (
                                    <tr key={account.id} className="border-b hover:bg-muted/30">
                                        <td className="py-2 px-2 font-mono text-sm">{account.code}</td>
                                        <td className={`py-2 px-2 ${getTypeColor(account.type)}`}>
                                            <Link href={`/accounting/accounts/${account.id}`} className="hover:underline">
                                                {account.name}
                                            </Link>
                                        </td>
                                        <td className="py-2 px-2 text-right">
                                            {account.debit_balance > 0 ? formatCurrency(account.debit_balance, currentLanguage === 'my' ? 'my-MM' : 'en-US') : ''}
                                        </td>
                                        <td className="py-2 px-2 text-right">
                                            {account.credit_balance > 0 ? formatCurrency(account.credit_balance, currentLanguage === 'my' ? 'my-MM' : 'en-US') : ''}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="font-bold text-lg border-t-2">
                                    <td colSpan={2} className="py-4 px-2 text-right">{t('common.total')}</td>
                                    <td className="py-4 px-2 text-right border-t-2 border-b-4 border-double">
                                        {formatCurrency(totals.debit, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                    </td>
                                    <td className="py-4 px-2 text-right border-t-2 border-b-4 border-double">
                                        {formatCurrency(totals.credit, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                        {accounts.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                {t('accounting.no_data')}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
