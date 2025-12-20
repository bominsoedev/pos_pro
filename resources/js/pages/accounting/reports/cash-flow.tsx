import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, router, Link } from '@inertiajs/react';
import { Printer, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface CashActivity {
    description: string;
    amount: number;
    date: string;
}

interface Props {
    operatingActivities: CashActivity[];
    investingActivities: CashActivity[];
    financingActivities: CashActivity[];
    totalOperating: number;
    totalInvesting: number;
    totalFinancing: number;
    netChange: number;
    openingCashBalance: number;
    closingCashBalance: number;
    dateFrom: string;
    dateTo: string;
}

export default function CashFlowStatement({
    operatingActivities, investingActivities, financingActivities,
    totalOperating, totalInvesting, totalFinancing, netChange,
    openingCashBalance, closingCashBalance, dateFrom, dateTo
}: Props) {
    const { t, currentLanguage } = useTranslation();

    const renderActivities = (activities: CashActivity[]) => {
        if (activities.length === 0) {
            return <p className="text-muted-foreground py-2">{t('accounting.no_activities')}</p>;
        }
        return activities.map((activity, index) => (
            <div key={index} className="flex justify-between py-1 hover:bg-muted/30 px-2 -mx-2 rounded">
                <div className="flex items-center gap-2">
                    {activity.amount >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                    ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                    )}
                    <span>{activity.description}</span>
                </div>
                <span className={activity.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(activity.amount, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                </span>
            </div>
        ));
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting'), href: '/accounting/accounts' },
            { title: t('accounting.cash_flow'), href: '/accounting/reports/cash-flow' },
        ]}>
            <Head title={t('accounting.cash_flow')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold">{t('accounting.cash_flow_statement')}</h1>
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
                                    onChange={(e) => router.get('/accounting/reports/cash-flow', {
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
                                    onChange={(e) => router.get('/accounting/reports/cash-flow', {
                                        date_from: dateFrom,
                                        date_to: e.target.value,
                                    }, { preserveState: true })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{t('accounting.opening_cash')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(openingCashBalance, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{t('accounting.net_change')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold flex items-center gap-2 ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {netChange >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                                {formatCurrency(netChange, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{t('accounting.closing_cash')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(closingCashBalance, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Cash Flow Statement */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader className="print:pb-2">
                        <CardTitle className="text-center print:text-xl">
                            {t('accounting.cash_flow_statement')}
                            <div className="text-sm font-normal text-muted-foreground mt-1">
                                {new Date(dateFrom).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')} - {new Date(dateTo).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="max-w-3xl mx-auto">
                        {/* Operating Activities */}
                        <div className="mb-6">
                            <h3 className="font-bold text-lg mb-2">{t('accounting.operating_activities')}</h3>
                            {renderActivities(operatingActivities)}
                            <div className="flex justify-between font-semibold border-t mt-2 pt-2">
                                <span>{t('accounting.net_cash_operating')}</span>
                                <span className={totalOperating >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {formatCurrency(totalOperating, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                </span>
                            </div>
                        </div>

                        {/* Investing Activities */}
                        <div className="mb-6">
                            <h3 className="font-bold text-lg mb-2">{t('accounting.investing_activities')}</h3>
                            {renderActivities(investingActivities)}
                            <div className="flex justify-between font-semibold border-t mt-2 pt-2">
                                <span>{t('accounting.net_cash_investing')}</span>
                                <span className={totalInvesting >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {formatCurrency(totalInvesting, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                </span>
                            </div>
                        </div>

                        {/* Financing Activities */}
                        <div className="mb-6">
                            <h3 className="font-bold text-lg mb-2">{t('accounting.financing_activities')}</h3>
                            {renderActivities(financingActivities)}
                            <div className="flex justify-between font-semibold border-t mt-2 pt-2">
                                <span>{t('accounting.net_cash_financing')}</span>
                                <span className={totalFinancing >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {formatCurrency(totalFinancing, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                </span>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="border-t-2 pt-4 space-y-2">
                            <div className="flex justify-between">
                                <span>{t('accounting.net_change_in_cash')}</span>
                                <span className={netChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {formatCurrency(netChange, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>{t('accounting.opening_cash_balance')}</span>
                                <span>{formatCurrency(openingCashBalance, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg border-t-2 pt-2">
                                <span>{t('accounting.closing_cash_balance')}</span>
                                <span>{formatCurrency(closingCashBalance, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
