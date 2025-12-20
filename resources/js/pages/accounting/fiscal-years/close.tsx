import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Lock, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';
import { useState } from 'react';

interface AccountDetail {
    id: number;
    code: string;
    name: string;
    balance: number;
}

interface Account {
    id: number;
    code: string;
    name: string;
}

interface FiscalYear {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
}

interface Props {
    fiscalYear: FiscalYear;
    revenueDetails: AccountDetail[];
    expenseDetails: AccountDetail[];
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    retainedEarningsAccount: Account | null;
}

export default function CloseFiscalYear({
    fiscalYear,
    revenueDetails,
    expenseDetails,
    totalRevenue,
    totalExpenses,
    netIncome,
    retainedEarningsAccount,
}: Props) {
    const { t, currentLanguage } = useTranslation();
    const locale = currentLanguage === 'my' ? 'my-MM' : 'en-US';
    const [processing, setProcessing] = useState(false);

    const handleClose = () => {
        if (!confirm(t('accounting.confirm_close_year'))) {
            return;
        }

        setProcessing(true);
        router.post(`/accounting/fiscal-years/${fiscalYear.id}/process-close`, {}, {
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting'), href: '/accounting/dashboard' },
            { title: t('accounting.fiscal_years'), href: '/accounting/fiscal-years' },
            { title: t('accounting.close_year'), href: '#' },
        ]}>
            <Head title={`${t('accounting.close_year')} - ${fiscalYear.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/accounting/fiscal-years">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Lock className="h-6 w-6" />
                            {t('accounting.close_year')}: {fiscalYear.name}
                        </h1>
                        <p className="text-muted-foreground">
                            {new Date(fiscalYear.start_date).toLocaleDateString(locale)} - {new Date(fiscalYear.end_date).toLocaleDateString(locale)}
                        </p>
                    </div>
                </div>

                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        {t('accounting.close_year_warning')}
                    </AlertDescription>
                </Alert>

                {!retainedEarningsAccount && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            {t('accounting.no_retained_earnings')}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                {t('accounting.total_revenue')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(totalRevenue, locale)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <TrendingDown className="h-4 w-4 text-red-600" />
                                {t('accounting.total_expenses')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {formatCurrency(totalExpenses, locale)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">{t('accounting.net_income')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(netIncome, locale)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Revenue Accounts */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('accounting.revenue_accounts')}</CardTitle>
                            <CardDescription>{t('accounting.accounts_to_close')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2">{t('accounting.code')}</th>
                                        <th className="text-left py-2">{t('common.name')}</th>
                                        <th className="text-right py-2">{t('accounting.balance')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {revenueDetails.map((account) => (
                                        <tr key={account.id} className="border-b">
                                            <td className="py-2 font-mono">{account.code}</td>
                                            <td className="py-2">{account.name}</td>
                                            <td className="py-2 text-right text-green-600">
                                                {formatCurrency(account.balance, locale)}
                                            </td>
                                        </tr>
                                    ))}
                                    {revenueDetails.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="py-4 text-center text-muted-foreground">
                                                {t('accounting.no_revenue')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="font-bold">
                                        <td colSpan={2} className="py-2">{t('common.total')}</td>
                                        <td className="py-2 text-right text-green-600">
                                            {formatCurrency(totalRevenue, locale)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </CardContent>
                    </Card>

                    {/* Expense Accounts */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('accounting.expense_accounts')}</CardTitle>
                            <CardDescription>{t('accounting.accounts_to_close')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2">{t('accounting.code')}</th>
                                        <th className="text-left py-2">{t('common.name')}</th>
                                        <th className="text-right py-2">{t('accounting.balance')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenseDetails.map((account) => (
                                        <tr key={account.id} className="border-b">
                                            <td className="py-2 font-mono">{account.code}</td>
                                            <td className="py-2">{account.name}</td>
                                            <td className="py-2 text-right text-red-600">
                                                {formatCurrency(account.balance, locale)}
                                            </td>
                                        </tr>
                                    ))}
                                    {expenseDetails.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="py-4 text-center text-muted-foreground">
                                                {t('accounting.no_expenses')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="font-bold">
                                        <td colSpan={2} className="py-2">{t('common.total')}</td>
                                        <td className="py-2 text-right text-red-600">
                                            {formatCurrency(totalExpenses, locale)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </CardContent>
                    </Card>
                </div>

                {/* Closing Entry Preview */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('accounting.closing_entry_preview')}</CardTitle>
                        <CardDescription>{t('accounting.closing_entry_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-muted/30 p-4 rounded-lg">
                            <p className="text-sm mb-2">
                                <strong>{t('accounting.net_income_transfer')}:</strong>
                            </p>
                            <p className="text-sm text-muted-foreground mb-4">
                                {netIncome >= 0 
                                    ? t('accounting.credit_retained_earnings', { amount: formatCurrency(netIncome, locale) })
                                    : t('accounting.debit_retained_earnings', { amount: formatCurrency(Math.abs(netIncome), locale) })
                                }
                            </p>
                            {retainedEarningsAccount && (
                                <p className="text-sm">
                                    <strong>{t('accounting.to_account')}:</strong> {retainedEarningsAccount.code} - {retainedEarningsAccount.name}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <Button variant="outline" asChild>
                        <Link href="/accounting/fiscal-years">{t('common.cancel')}</Link>
                    </Button>
                    <Button 
                        variant="destructive" 
                        onClick={handleClose} 
                        disabled={processing || !retainedEarningsAccount}
                    >
                        <Lock className="h-4 w-4 mr-2" />
                        {processing ? t('common.loading') : t('accounting.close_fiscal_year')}
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
