import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, router, Link } from '@inertiajs/react';
import { Printer, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface AccountAmount {
    id: number;
    code: string;
    name: string;
    name_mm: string | null;
    subtype: string;
    amount: number;
}

interface Props {
    salesRevenue: AccountAmount[];
    otherIncome: AccountAmount[];
    costOfGoodsSold: AccountAmount[];
    operatingExpenses: AccountAmount[];
    payrollExpenses: AccountAmount[];
    otherExpenses: AccountAmount[];
    totalRevenue: number;
    totalCogs: number;
    grossProfit: number;
    totalOperatingExpenses: number;
    operatingIncome: number;
    totalOtherIncome: number;
    totalOtherExpenses: number;
    netIncome: number;
    dateFrom: string;
    dateTo: string;
}

export default function IncomeStatement({
    salesRevenue, otherIncome, costOfGoodsSold, operatingExpenses, payrollExpenses, otherExpenses,
    totalRevenue, totalCogs, grossProfit, totalOperatingExpenses, operatingIncome,
    totalOtherIncome, totalOtherExpenses, netIncome, dateFrom, dateTo
}: Props) {
    const { t, currentLanguage } = useTranslation();

    const renderAccountList = (accounts: AccountAmount[]) => {
        const filtered = accounts.filter(a => a.amount !== 0);
        return filtered.map((account) => (
            <div key={account.id} className="flex justify-between py-1 hover:bg-muted/30 px-2 -mx-2 rounded">
                <Link href={`/accounting/accounts/${account.id}`} className="hover:underline">
                    {currentLanguage === 'my' && account.name_mm ? account.name_mm : account.name}
                </Link>
                <span>{formatCurrency(account.amount, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
            </div>
        ));
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting'), href: '/accounting/accounts' },
            { title: t('accounting.income_statement'), href: '/accounting/reports/income-statement' },
        ]}>
            <Head title={t('accounting.income_statement')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold">{t('accounting.income_statement')}</h1>
                        <p className="text-muted-foreground">
                            {new Date(dateFrom).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')} - {new Date(dateTo).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="h-4 w-4 mr-2" />
                        {t('common.print')}
                    </Button>
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
                                    value={dateFrom}
                                    onChange={(e) => router.get('/accounting/reports/income-statement', {
                                        date_from: e.target.value,
                                        date_to: dateTo,
                                    }, { preserveState: true })}
                                />
                            </div>
                            <div>
                                <Label>{t('common.to')}</Label>
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => router.get('/accounting/reports/income-statement', {
                                        date_from: dateFrom,
                                        date_to: e.target.value,
                                    }, { preserveState: true })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Income Statement */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader className="print:pb-2">
                        <CardTitle className="text-center print:text-xl">
                            {t('accounting.income_statement')}
                            <div className="text-sm font-normal text-muted-foreground mt-1">
                                {new Date(dateFrom).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')} - {new Date(dateTo).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="max-w-3xl mx-auto">
                        {/* Revenue */}
                        <div className="mb-6">
                            <h3 className="font-bold text-lg mb-2">{t('accounting.revenue')}</h3>
                            {renderAccountList(salesRevenue)}
                            <div className="flex justify-between font-semibold border-t mt-2 pt-2">
                                <span>{t('accounting.total_revenue')}</span>
                                <span className="text-green-600">{formatCurrency(totalRevenue, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                            </div>
                        </div>

                        {/* Cost of Goods Sold */}
                        <div className="mb-6">
                            <h3 className="font-bold text-lg mb-2">{t('accounting.cost_of_goods_sold')}</h3>
                            {renderAccountList(costOfGoodsSold)}
                            <div className="flex justify-between font-semibold border-t mt-2 pt-2">
                                <span>{t('accounting.total_cogs')}</span>
                                <span className="text-red-600">({formatCurrency(totalCogs, currentLanguage === 'my' ? 'my-MM' : 'en-US')})</span>
                            </div>
                        </div>

                        {/* Gross Profit */}
                        <div className="flex justify-between font-bold text-lg border-y-2 py-3 mb-6">
                            <span>{t('accounting.gross_profit')}</span>
                            <span className={grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {formatCurrency(grossProfit, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                            </span>
                        </div>

                        {/* Operating Expenses */}
                        <div className="mb-6">
                            <h3 className="font-bold text-lg mb-2">{t('accounting.operating_expenses')}</h3>
                            {renderAccountList(operatingExpenses)}
                            {renderAccountList(payrollExpenses)}
                            <div className="flex justify-between font-semibold border-t mt-2 pt-2">
                                <span>{t('accounting.total_operating_expenses')}</span>
                                <span className="text-red-600">({formatCurrency(totalOperatingExpenses, currentLanguage === 'my' ? 'my-MM' : 'en-US')})</span>
                            </div>
                        </div>

                        {/* Operating Income */}
                        <div className="flex justify-between font-bold text-lg border-y py-3 mb-6">
                            <span>{t('accounting.operating_income')}</span>
                            <span className={operatingIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {formatCurrency(operatingIncome, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                            </span>
                        </div>

                        {/* Other Income/Expenses */}
                        {(otherIncome.length > 0 || otherExpenses.length > 0) && (
                            <div className="mb-6">
                                <h3 className="font-bold text-lg mb-2">{t('accounting.other_income_expenses')}</h3>
                                {renderAccountList(otherIncome)}
                                {renderAccountList(otherExpenses)}
                            </div>
                        )}

                        {/* Net Income */}
                        <div className="flex justify-between font-bold text-xl border-t-4 border-double pt-4">
                            <span className="flex items-center gap-2">
                                {netIncome >= 0 ? <TrendingUp className="h-5 w-5 text-green-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />}
                                {t('accounting.net_income')}
                            </span>
                            <span className={netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {formatCurrency(netIncome, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
