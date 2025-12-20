import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    CreditCard, 
    FileText, 
    ArrowUpRight, 
    ArrowDownLeft,
    Building2,
    Users,
    Truck,
    Plus,
    Calculator
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Legend,
    PieChart,
    Pie,
    Cell
} from 'recharts';

interface BankAccount {
    id: number;
    name: string;
    bank_name: string;
    current_balance: number;
    currency: string;
}

interface JournalEntry {
    id: number;
    entry_number: string;
    entry_date: string;
    description: string;
    total_debit: number;
    created_by: { name: string } | null;
}

interface Props {
    cashFlow: {
        today: { inflow: number; outflow: number; net: number };
        thisMonth: { inflow: number; outflow: number; net: number };
        lastMonth: { inflow: number; outflow: number; net: number };
    };
    revenue: {
        thisMonth: number;
        lastMonth: number;
        change: number;
    };
    expenses: {
        thisMonth: number;
        lastMonth: number;
        change: number;
    };
    netIncome: number;
    monthlyData: { month: string; revenue: number; expenses: number }[];
    arSummary: {
        total: number;
        overdue: number;
        current: number;
        count: number;
    };
    apSummary: {
        total: number;
        overdue: number;
        current: number;
        count: number;
    };
    bankAccounts: BankAccount[];
    recentEntries: JournalEntry[];
    topExpenses: { name: string; amount: number }[];
    totalCashBalance: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AccountingDashboard({
    cashFlow,
    revenue,
    expenses,
    netIncome,
    monthlyData,
    arSummary,
    apSummary,
    bankAccounts,
    recentEntries,
    topExpenses,
    totalCashBalance,
}: Props) {
    const { t, currentLanguage } = useTranslation();
    const locale = currentLanguage === 'my' ? 'my-MM' : 'en-US';

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting'), href: '/accounting/dashboard' },
            { title: t('nav.dashboard'), href: '/accounting/dashboard' },
        ]}>
            <Head title={t('accounting.dashboard')} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Calculator className="h-6 w-6" />
                            {t('accounting.dashboard')}
                        </h1>
                        <p className="text-muted-foreground">{t('accounting.dashboard_description')}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/accounting/journal-entries/create">
                                <Plus className="h-4 w-4 mr-2" />
                                {t('accounting.new_entry')}
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Cash */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {t('accounting.total_cash')}
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(totalCashBalance, locale)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {t('accounting.cash_and_bank')}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Revenue This Month */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {t('accounting.revenue_this_month')}
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(revenue.thisMonth, locale)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                {revenue.change >= 0 ? (
                                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                                ) : (
                                    <ArrowDownLeft className="h-3 w-3 text-red-600" />
                                )}
                                <span className={revenue.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {revenue.change}%
                                </span>
                                {t('accounting.vs_last_month')}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Expenses This Month */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {t('accounting.expenses_this_month')}
                            </CardTitle>
                            <TrendingDown className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {formatCurrency(expenses.thisMonth, locale)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                {expenses.change <= 0 ? (
                                    <ArrowDownLeft className="h-3 w-3 text-green-600" />
                                ) : (
                                    <ArrowUpRight className="h-3 w-3 text-red-600" />
                                )}
                                <span className={expenses.change <= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {Math.abs(expenses.change)}%
                                </span>
                                {t('accounting.vs_last_month')}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Net Income */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {t('accounting.net_income')}
                            </CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(netIncome, locale)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {t('accounting.this_month')}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Cash Flow Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">{t('accounting.today_cash_flow')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-green-600 flex items-center gap-1">
                                    <ArrowDownLeft className="h-3 w-3" /> {t('accounting.inflow')}
                                </span>
                                <span>{formatCurrency(cashFlow.today.inflow, locale)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-red-600 flex items-center gap-1">
                                    <ArrowUpRight className="h-3 w-3" /> {t('accounting.outflow')}
                                </span>
                                <span>{formatCurrency(cashFlow.today.outflow, locale)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold border-t pt-2">
                                <span>{t('accounting.net')}</span>
                                <span className={cashFlow.today.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {formatCurrency(cashFlow.today.net, locale)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">{t('accounting.this_month_cash_flow')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-green-600 flex items-center gap-1">
                                    <ArrowDownLeft className="h-3 w-3" /> {t('accounting.inflow')}
                                </span>
                                <span>{formatCurrency(cashFlow.thisMonth.inflow, locale)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-red-600 flex items-center gap-1">
                                    <ArrowUpRight className="h-3 w-3" /> {t('accounting.outflow')}
                                </span>
                                <span>{formatCurrency(cashFlow.thisMonth.outflow, locale)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold border-t pt-2">
                                <span>{t('accounting.net')}</span>
                                <span className={cashFlow.thisMonth.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {formatCurrency(cashFlow.thisMonth.net, locale)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">{t('accounting.last_month_cash_flow')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-green-600 flex items-center gap-1">
                                    <ArrowDownLeft className="h-3 w-3" /> {t('accounting.inflow')}
                                </span>
                                <span>{formatCurrency(cashFlow.lastMonth.inflow, locale)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-red-600 flex items-center gap-1">
                                    <ArrowUpRight className="h-3 w-3" /> {t('accounting.outflow')}
                                </span>
                                <span>{formatCurrency(cashFlow.lastMonth.outflow, locale)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold border-t pt-2">
                                <span>{t('accounting.net')}</span>
                                <span className={cashFlow.lastMonth.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {formatCurrency(cashFlow.lastMonth.net, locale)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Revenue vs Expenses Chart */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70 lg:col-span-2">
                        <CardHeader>
                            <CardTitle>{t('accounting.revenue_vs_expenses')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={monthlyData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip 
                                            formatter={(value: number) => formatCurrency(value, locale)}
                                        />
                                        <Legend />
                                        <Bar dataKey="revenue" name={t('accounting.revenue')} fill="#22c55e" />
                                        <Bar dataKey="expenses" name={t('accounting.expenses')} fill="#ef4444" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Expenses */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('accounting.top_expenses')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {topExpenses.length > 0 ? (
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={topExpenses}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={80}
                                                dataKey="amount"
                                                nameKey="name"
                                                label={({ name }) => name}
                                            >
                                                {topExpenses.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => formatCurrency(value, locale)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-muted-foreground">
                                    {t('accounting.no_expenses')}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* AR/AP and Bank Accounts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Accounts Receivable */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                {t('accounting.accounts_receivable')}
                            </CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/accounting/receivables">{t('common.view')}</Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('common.total')}</span>
                                <span className="font-bold">{formatCurrency(arSummary.total, locale)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('accounting.current')}</span>
                                <span className="text-green-600">{formatCurrency(arSummary.current, locale)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('accounting.overdue')}</span>
                                <span className="text-red-600">{formatCurrency(arSummary.overdue, locale)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                                <span className="text-muted-foreground">{t('accounting.invoices')}</span>
                                <Badge variant="outline">{arSummary.count}</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Accounts Payable */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="h-5 w-5" />
                                {t('accounting.accounts_payable')}
                            </CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/accounting/payables">{t('common.view')}</Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('common.total')}</span>
                                <span className="font-bold">{formatCurrency(apSummary.total, locale)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('accounting.current')}</span>
                                <span className="text-green-600">{formatCurrency(apSummary.current, locale)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('accounting.overdue')}</span>
                                <span className="text-red-600">{formatCurrency(apSummary.overdue, locale)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                                <span className="text-muted-foreground">{t('accounting.invoices')}</span>
                                <Badge variant="outline">{apSummary.count}</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bank Accounts */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                {t('accounting.bank_accounts')}
                            </CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/accounting/bank-accounts">{t('common.view')}</Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {bankAccounts.length > 0 ? (
                                bankAccounts.map((account) => (
                                    <div key={account.id} className="flex justify-between">
                                        <div>
                                            <div className="font-medium">{account.name}</div>
                                            <div className="text-xs text-muted-foreground">{account.bank_name}</div>
                                        </div>
                                        <span className="font-bold">
                                            {formatCurrency(account.current_balance, locale)}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-muted-foreground py-4">
                                    {t('accounting.no_bank_accounts')}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Journal Entries */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {t('accounting.recent_entries')}
                        </CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/accounting/journal-entries">{t('common.view')}</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-sm">
                                    <th className="text-left py-2">{t('common.date')}</th>
                                    <th className="text-left py-2">{t('accounting.entry_number')}</th>
                                    <th className="text-left py-2">{t('common.description')}</th>
                                    <th className="text-right py-2">{t('common.amount')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentEntries.map((entry) => (
                                    <tr key={entry.id} className="border-b hover:bg-muted/30">
                                        <td className="py-2 text-sm">
                                            {new Date(entry.entry_date).toLocaleDateString(locale)}
                                        </td>
                                        <td className="py-2">
                                            <Link 
                                                href={`/accounting/journal-entries/${entry.id}`}
                                                className="text-primary hover:underline"
                                            >
                                                {entry.entry_number}
                                            </Link>
                                        </td>
                                        <td className="py-2 text-sm text-muted-foreground">
                                            {entry.description}
                                        </td>
                                        <td className="py-2 text-right font-medium">
                                            {formatCurrency(entry.total_debit, locale)}
                                        </td>
                                    </tr>
                                ))}
                                {recentEntries.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-muted-foreground">
                                            {t('accounting.no_entries')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
