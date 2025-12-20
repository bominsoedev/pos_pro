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
    name_mm: string | null;
    type: string;
    subtype: string;
    balance: number;
}

interface Props {
    assets: AccountBalance[];
    liabilities: AccountBalance[];
    equity: AccountBalance[];
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    retainedEarnings: number;
    isBalanced: boolean;
    asOfDate: string;
}

export default function BalanceSheet({
    assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity, retainedEarnings, isBalanced, asOfDate
}: Props) {
    const { t, currentLanguage } = useTranslation();

    const renderAccountGroup = (accounts: AccountBalance[], title: string) => {
        const filtered = accounts.filter(a => a.balance !== 0);
        if (filtered.length === 0) return null;

        return (
            <div className="mb-6">
                <h4 className="font-semibold text-muted-foreground mb-2">{title}</h4>
                {filtered.map((account) => (
                    <div key={account.id} className="flex justify-between py-1 hover:bg-muted/30 px-2 -mx-2 rounded">
                        <Link href={`/accounting/accounts/${account.id}`} className="hover:underline">
                            {currentLanguage === 'my' && account.name_mm ? account.name_mm : account.name}
                        </Link>
                        <span>{formatCurrency(Math.abs(account.balance), currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting'), href: '/accounting/accounts' },
            { title: t('accounting.balance_sheet'), href: '/accounting/reports/balance-sheet' },
        ]}>
            <Head title={t('accounting.balance_sheet')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold">{t('accounting.balance_sheet')}</h1>
                        <p className="text-muted-foreground">
                            {t('accounting.as_of')} {new Date(asOfDate).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}
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

                {/* Date Filter */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70 print:hidden">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div>
                                <Label>{t('accounting.as_of_date')}</Label>
                                <Input
                                    type="date"
                                    value={asOfDate}
                                    onChange={(e) => router.get('/accounting/reports/balance-sheet', {
                                        as_of_date: e.target.value,
                                    }, { preserveState: true })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Balance Sheet */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Assets */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('accounting.assets')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {renderAccountGroup(assets.filter(a => ['cash', 'bank', 'accounts_receivable'].includes(a.subtype)), t('accounting.current_assets'))}
                            {renderAccountGroup(assets.filter(a => a.subtype === 'inventory'), t('accounting.inventory'))}
                            {renderAccountGroup(assets.filter(a => a.subtype === 'fixed_asset'), t('accounting.fixed_assets'))}
                            {renderAccountGroup(assets.filter(a => ['prepaid', 'other_asset'].includes(a.subtype)), t('accounting.other_assets'))}
                            
                            <div className="border-t-2 pt-4 mt-4">
                                <div className="flex justify-between font-bold text-lg">
                                    <span>{t('accounting.total_assets')}</span>
                                    <span>{formatCurrency(totalAssets, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Liabilities & Equity */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('accounting.liabilities_equity')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <h3 className="font-bold mb-4">{t('accounting.liabilities')}</h3>
                            {renderAccountGroup(liabilities.filter(a => ['accounts_payable', 'credit_card', 'current_liability'].includes(a.subtype)), t('accounting.current_liabilities'))}
                            {renderAccountGroup(liabilities.filter(a => ['long_term_liability', 'other_liability'].includes(a.subtype)), t('accounting.long_term_liabilities'))}
                            
                            <div className="border-t pt-4 mt-4 mb-6">
                                <div className="flex justify-between font-semibold">
                                    <span>{t('accounting.total_liabilities')}</span>
                                    <span>{formatCurrency(totalLiabilities, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                </div>
                            </div>

                            <h3 className="font-bold mb-4">{t('accounting.equity')}</h3>
                            {equity.filter(a => a.balance !== 0).map((account) => (
                                <div key={account.id} className="flex justify-between py-1 hover:bg-muted/30 px-2 -mx-2 rounded">
                                    <Link href={`/accounting/accounts/${account.id}`} className="hover:underline">
                                        {currentLanguage === 'my' && account.name_mm ? account.name_mm : account.name}
                                    </Link>
                                    <span>{formatCurrency(Math.abs(account.balance), currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                </div>
                            ))}
                            {retainedEarnings !== 0 && (
                                <div className="flex justify-between py-1 px-2 -mx-2">
                                    <span>{t('accounting.retained_earnings')}</span>
                                    <span className={retainedEarnings >= 0 ? 'text-green-600' : 'text-red-600'}>
                                        {formatCurrency(retainedEarnings, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                    </span>
                                </div>
                            )}
                            
                            <div className="border-t pt-4 mt-4">
                                <div className="flex justify-between font-semibold mb-4">
                                    <span>{t('accounting.total_equity')}</span>
                                    <span>{formatCurrency(totalEquity, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                </div>
                            </div>

                            <div className="border-t-2 pt-4">
                                <div className="flex justify-between font-bold text-lg">
                                    <span>{t('accounting.total_liabilities_equity')}</span>
                                    <span>{formatCurrency(totalLiabilities + totalEquity, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
