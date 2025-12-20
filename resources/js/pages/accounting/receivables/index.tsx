import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, router, Link } from '@inertiajs/react';
import { Plus, Search, Eye, DollarSign, AlertTriangle, Clock, TrendingDown } from 'lucide-react';
import Pagination from '@/components/pagination';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface Customer {
    id: number;
    name: string;
}

interface Receivable {
    id: number;
    invoice_number: string;
    customer: Customer | null;
    invoice_date: string;
    due_date: string;
    total_amount: number;
    paid_amount: number;
    balance_due: number;
    status: string;
    created_by: { name: string } | null;
}

interface Props {
    receivables: {
        data: Receivable[];
        links: any;
    };
    summary: {
        total_outstanding: number;
        overdue: number;
        due_this_week: number;
    };
    aging: {
        current: number;
        '1_30': number;
        '31_60': number;
        '61_90': number;
        over_90: number;
    };
    customers: { id: number; name: string }[];
    filters: {
        search?: string;
        status?: string;
        customer_id?: string;
    };
}

export default function ReceivablesIndex({ receivables, summary, aging, customers, filters }: Props) {
    const { t, currentLanguage } = useTranslation();

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-800',
            pending: 'bg-yellow-100 text-yellow-800',
            partial: 'bg-blue-100 text-blue-800',
            paid: 'bg-green-100 text-green-800',
            overdue: 'bg-red-100 text-red-800',
            bad_debt: 'bg-red-200 text-red-900',
            void: 'bg-gray-100 text-gray-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting'), href: '/accounting/accounts' },
            { title: t('accounting.accounts_receivable'), href: '/accounting/receivables' },
        ]}>
            <Head title={t('accounting.accounts_receivable')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('accounting.accounts_receivable')}</h1>
                        <p className="text-muted-foreground">{t('accounting.ar_desc')}</p>
                    </div>
                    <Button asChild className="backdrop-blur-sm bg-primary/90">
                        <Link href="/accounting/receivables/create">
                            <Plus className="mr-2 h-4 w-4" />
                            {t('accounting.new_receivable')}
                        </Link>
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('accounting.total_outstanding')}</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(summary.total_outstanding, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70 border-red-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-red-600">{t('accounting.overdue')}</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {formatCurrency(summary.overdue, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70 border-yellow-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-yellow-600">{t('accounting.due_this_week')}</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">
                                {formatCurrency(summary.due_this_week, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Aging Report */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5" />
                            {t('accounting.aging_report')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-5 gap-4 text-center">
                            <div>
                                <div className="text-sm text-muted-foreground">{t('accounting.current')}</div>
                                <div className="text-lg font-semibold text-green-600">
                                    {formatCurrency(aging.current, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">1-30 {t('common.days')}</div>
                                <div className="text-lg font-semibold text-yellow-600">
                                    {formatCurrency(aging['1_30'], currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">31-60 {t('common.days')}</div>
                                <div className="text-lg font-semibold text-orange-600">
                                    {formatCurrency(aging['31_60'], currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">61-90 {t('common.days')}</div>
                                <div className="text-lg font-semibold text-red-500">
                                    {formatCurrency(aging['61_90'], currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">90+ {t('common.days')}</div>
                                <div className="text-lg font-semibold text-red-700">
                                    {formatCurrency(aging.over_90, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Filters */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative md:col-span-2">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={t('common.search')}
                                    className="pl-10"
                                    defaultValue={filters.search}
                                    onChange={(e) => {
                                        router.get('/accounting/receivables', {
                                            ...filters,
                                            search: e.target.value || undefined,
                                        }, { preserveState: true });
                                    }}
                                />
                            </div>
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(value) => {
                                    router.get('/accounting/receivables', {
                                        ...filters,
                                        status: value === 'all' ? undefined : value,
                                    }, { preserveState: true });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('common.status')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('common.all')}</SelectItem>
                                    <SelectItem value="pending">{t('accounting.pending')}</SelectItem>
                                    <SelectItem value="partial">{t('accounting.partial')}</SelectItem>
                                    <SelectItem value="paid">{t('accounting.paid')}</SelectItem>
                                    <SelectItem value="overdue">{t('accounting.overdue')}</SelectItem>
                                    <SelectItem value="bad_debt">{t('accounting.bad_debt')}</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.customer_id || 'all'}
                                onValueChange={(value) => {
                                    router.get('/accounting/receivables', {
                                        ...filters,
                                        customer_id: value === 'all' ? undefined : value,
                                    }, { preserveState: true });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('accounting.customer')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('common.all')}</SelectItem>
                                    {customers.map((customer) => (
                                        <SelectItem key={customer.id} value={customer.id.toString()}>
                                            {customer.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Receivables List */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {receivables.data.map((receivable) => (
                                <div key={receivable.id} className="p-4 hover:bg-muted/50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <Link href={`/accounting/receivables/${receivable.id}`} className="font-semibold hover:underline">
                                                    {receivable.invoice_number}
                                                </Link>
                                                <Badge className={getStatusColor(receivable.status)}>
                                                    {t(`accounting.${receivable.status}`)}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground mt-1">
                                                {receivable.customer?.name || t('accounting.no_customer')}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                <span>{t('accounting.due')}: {new Date(receivable.due_date).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold">
                                                {formatCurrency(receivable.total_amount, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                            </div>
                                            {receivable.balance_due > 0 && receivable.balance_due < receivable.total_amount && (
                                                <div className="text-sm text-muted-foreground">
                                                    {t('accounting.balance')}: {formatCurrency(receivable.balance_due, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                                </div>
                                            )}
                                            <Button variant="ghost" size="sm" asChild className="mt-2">
                                                <Link href={`/accounting/receivables/${receivable.id}`}>
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    {t('common.view')}
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {receivables.data.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    {t('accounting.no_receivables')}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Pagination links={receivables.links} />
            </div>
        </AppLayout>
    );
}
