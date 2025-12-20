import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';
import { useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';

interface Ratios {
    liquidity: {
        current_ratio: number | null;
        quick_ratio: number | null;
        cash_ratio: number | null;
    };
    profitability: {
        gross_profit_margin: number | null;
        net_profit_margin: number | null;
        return_on_assets: number | null;
        return_on_equity: number | null;
    };
    leverage: {
        debt_ratio: number | null;
        debt_to_equity: number | null;
        equity_ratio: number | null;
    };
    efficiency: {
        ar_turnover: number | null;
        ap_turnover: number | null;
        ar_days: number | null;
        ap_days: number | null;
    };
}

interface Summary {
    current_assets: number;
    current_liabilities: number;
    total_assets: number;
    total_liabilities: number;
    total_equity: number;
    revenue_ytd: number;
    expenses_ytd: number;
    net_income_ytd: number;
    gross_profit_ytd: number;
}

interface Props {
    ratios: Ratios;
    summary: Summary;
    trends: { month: string; current_ratio: number; profit_margin: number }[];
    asOfDate: string;
}

export default function FinancialRatios({ ratios, summary, trends, asOfDate }: Props) {
    const { t, currentLanguage } = useTranslation();
    const locale = currentLanguage === 'my' ? 'my-MM' : 'en-US';
    const [date, setDate] = useState(asOfDate);

    const handleDateChange = (newDate: string) => {
        setDate(newDate);
        router.get('/accounting/reports/ratios', { as_of_date: newDate }, { preserveState: true });
    };

    const getRatioStatus = (value: number | null, goodMin: number, goodMax: number, type: 'higher' | 'lower' | 'range' = 'range') => {
        if (value === null) return { status: 'neutral', icon: Minus, color: 'text-gray-500' };
        
        if (type === 'higher') {
            if (value >= goodMin) return { status: 'good', icon: CheckCircle2, color: 'text-green-600' };
            if (value >= goodMin * 0.7) return { status: 'warning', icon: AlertTriangle, color: 'text-yellow-600' };
            return { status: 'bad', icon: TrendingDown, color: 'text-red-600' };
        }
        
        if (type === 'lower') {
            if (value <= goodMax) return { status: 'good', icon: CheckCircle2, color: 'text-green-600' };
            if (value <= goodMax * 1.3) return { status: 'warning', icon: AlertTriangle, color: 'text-yellow-600' };
            return { status: 'bad', icon: TrendingUp, color: 'text-red-600' };
        }

        if (value >= goodMin && value <= goodMax) return { status: 'good', icon: CheckCircle2, color: 'text-green-600' };
        if (value >= goodMin * 0.7 || value <= goodMax * 1.3) return { status: 'warning', icon: AlertTriangle, color: 'text-yellow-600' };
        return { status: 'bad', icon: AlertTriangle, color: 'text-red-600' };
    };

    const RatioCard = ({ 
        title, 
        value, 
        suffix = '', 
        description, 
        benchmark,
        status 
    }: { 
        title: string; 
        value: number | null; 
        suffix?: string; 
        description: string;
        benchmark: string;
        status: { icon: any; color: string };
    }) => {
        const Icon = status.icon;
        return (
            <div className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold mt-1">
                            {value !== null ? `${value}${suffix}` : '-'}
                        </p>
                    </div>
                    <Icon className={`h-5 w-5 ${status.color}`} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{description}</p>
                <p className="text-xs mt-1 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    {benchmark}
                </p>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting'), href: '/accounting/dashboard' },
            { title: t('accounting.reports'), href: '/accounting/reports/balance-sheet' },
            { title: t('accounting.financial_ratios'), href: '/accounting/reports/ratios' },
        ]}>
            <Head title={t('accounting.financial_ratios')} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('accounting.financial_ratios')}</h1>
                        <p className="text-muted-foreground">{t('accounting.ratios_description')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label>{t('accounting.as_of_date')}</Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => handleDateChange(e.target.value)}
                            className="w-40"
                        />
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">{t('accounting.total_assets')}</p>
                            <p className="text-xl font-bold">{formatCurrency(summary.total_assets, locale)}</p>
                        </CardContent>
                    </Card>
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">{t('accounting.total_liabilities')}</p>
                            <p className="text-xl font-bold">{formatCurrency(summary.total_liabilities, locale)}</p>
                        </CardContent>
                    </Card>
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">{t('accounting.revenue_ytd')}</p>
                            <p className="text-xl font-bold text-green-600">{formatCurrency(summary.revenue_ytd, locale)}</p>
                        </CardContent>
                    </Card>
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">{t('accounting.net_income_ytd')}</p>
                            <p className={`text-xl font-bold ${summary.net_income_ytd >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(summary.net_income_ytd, locale)}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Liquidity Ratios */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('accounting.liquidity_ratios')}</CardTitle>
                        <CardDescription>{t('accounting.liquidity_ratios_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <RatioCard
                                title={t('accounting.current_ratio')}
                                value={ratios.liquidity.current_ratio}
                                description={t('accounting.current_ratio_desc')}
                                benchmark={t('accounting.benchmark_current_ratio')}
                                status={getRatioStatus(ratios.liquidity.current_ratio, 1.5, 3, 'range')}
                            />
                            <RatioCard
                                title={t('accounting.quick_ratio')}
                                value={ratios.liquidity.quick_ratio}
                                description={t('accounting.quick_ratio_desc')}
                                benchmark={t('accounting.benchmark_quick_ratio')}
                                status={getRatioStatus(ratios.liquidity.quick_ratio, 1, 2, 'range')}
                            />
                            <RatioCard
                                title={t('accounting.cash_ratio')}
                                value={ratios.liquidity.cash_ratio}
                                description={t('accounting.cash_ratio_desc')}
                                benchmark={t('accounting.benchmark_cash_ratio')}
                                status={getRatioStatus(ratios.liquidity.cash_ratio, 0.5, 1, 'range')}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Profitability Ratios */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('accounting.profitability_ratios')}</CardTitle>
                        <CardDescription>{t('accounting.profitability_ratios_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <RatioCard
                                title={t('accounting.gross_profit_margin')}
                                value={ratios.profitability.gross_profit_margin}
                                suffix="%"
                                description={t('accounting.gross_margin_desc')}
                                benchmark={t('accounting.benchmark_gross_margin')}
                                status={getRatioStatus(ratios.profitability.gross_profit_margin, 30, 100, 'higher')}
                            />
                            <RatioCard
                                title={t('accounting.net_profit_margin')}
                                value={ratios.profitability.net_profit_margin}
                                suffix="%"
                                description={t('accounting.net_margin_desc')}
                                benchmark={t('accounting.benchmark_net_margin')}
                                status={getRatioStatus(ratios.profitability.net_profit_margin, 10, 100, 'higher')}
                            />
                            <RatioCard
                                title={t('accounting.roa')}
                                value={ratios.profitability.return_on_assets}
                                suffix="%"
                                description={t('accounting.roa_desc')}
                                benchmark={t('accounting.benchmark_roa')}
                                status={getRatioStatus(ratios.profitability.return_on_assets, 5, 100, 'higher')}
                            />
                            <RatioCard
                                title={t('accounting.roe')}
                                value={ratios.profitability.return_on_equity}
                                suffix="%"
                                description={t('accounting.roe_desc')}
                                benchmark={t('accounting.benchmark_roe')}
                                status={getRatioStatus(ratios.profitability.return_on_equity, 15, 100, 'higher')}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Leverage Ratios */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('accounting.leverage_ratios')}</CardTitle>
                        <CardDescription>{t('accounting.leverage_ratios_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <RatioCard
                                title={t('accounting.debt_ratio')}
                                value={ratios.leverage.debt_ratio}
                                suffix="%"
                                description={t('accounting.debt_ratio_desc')}
                                benchmark={t('accounting.benchmark_debt_ratio')}
                                status={getRatioStatus(ratios.leverage.debt_ratio, 0, 50, 'lower')}
                            />
                            <RatioCard
                                title={t('accounting.debt_to_equity')}
                                value={ratios.leverage.debt_to_equity}
                                description={t('accounting.debt_equity_desc')}
                                benchmark={t('accounting.benchmark_debt_equity')}
                                status={getRatioStatus(ratios.leverage.debt_to_equity, 0, 1.5, 'lower')}
                            />
                            <RatioCard
                                title={t('accounting.equity_ratio')}
                                value={ratios.leverage.equity_ratio}
                                suffix="%"
                                description={t('accounting.equity_ratio_desc')}
                                benchmark={t('accounting.benchmark_equity_ratio')}
                                status={getRatioStatus(ratios.leverage.equity_ratio, 50, 100, 'higher')}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Efficiency Ratios */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('accounting.efficiency_ratios')}</CardTitle>
                        <CardDescription>{t('accounting.efficiency_ratios_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <RatioCard
                                title={t('accounting.ar_turnover')}
                                value={ratios.efficiency.ar_turnover}
                                suffix="x"
                                description={t('accounting.ar_turnover_desc')}
                                benchmark={t('accounting.benchmark_ar_turnover')}
                                status={getRatioStatus(ratios.efficiency.ar_turnover, 6, 100, 'higher')}
                            />
                            <RatioCard
                                title={t('accounting.ar_days')}
                                value={ratios.efficiency.ar_days}
                                suffix={` ${t('common.days')}`}
                                description={t('accounting.ar_days_desc')}
                                benchmark={t('accounting.benchmark_ar_days')}
                                status={getRatioStatus(ratios.efficiency.ar_days, 0, 45, 'lower')}
                            />
                            <RatioCard
                                title={t('accounting.ap_turnover')}
                                value={ratios.efficiency.ap_turnover}
                                suffix="x"
                                description={t('accounting.ap_turnover_desc')}
                                benchmark={t('accounting.benchmark_ap_turnover')}
                                status={getRatioStatus(ratios.efficiency.ap_turnover, 4, 12, 'range')}
                            />
                            <RatioCard
                                title={t('accounting.ap_days')}
                                value={ratios.efficiency.ap_days}
                                suffix={` ${t('common.days')}`}
                                description={t('accounting.ap_days_desc')}
                                benchmark={t('accounting.benchmark_ap_days')}
                                status={getRatioStatus(ratios.efficiency.ap_days, 30, 60, 'range')}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Trends Chart */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('accounting.ratio_trends')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trends}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="current_ratio"
                                        name={t('accounting.current_ratio')}
                                        stroke="#8884d8"
                                        strokeWidth={2}
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="profit_margin"
                                        name={t('accounting.profit_margin')}
                                        stroke="#82ca9d"
                                        strokeWidth={2}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
