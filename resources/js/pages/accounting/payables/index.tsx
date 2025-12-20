import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, router, Link } from '@inertiajs/react';
import { Plus, Search, Eye, DollarSign, AlertTriangle, Clock } from 'lucide-react';
import Pagination from '@/components/pagination';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface Supplier {
    id: number;
    name: string;
}

interface Payable {
    id: number;
    invoice_number: string;
    supplier: Supplier | null;
    invoice_date: string;
    due_date: string;
    total_amount: number;
    paid_amount: number;
    balance_due: number;
    status: string;
    created_by: { name: string } | null;
}

interface Props {
    payables: {
        data: Payable[];
        links: any;
    };
    summary: {
        total_outstanding: number;
        overdue: number;
        due_this_week: number;
    };
    suppliers: { id: number; name: string }[];
    filters: {
        search?: string;
        status?: string;
        supplier_id?: string;
    };
}

export default function PayablesIndex({ payables, summary, suppliers, filters }: Props) {
    const { t, currentLanguage } = useTranslation();

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-800',
            pending: 'bg-yellow-100 text-yellow-800',
            partial: 'bg-blue-100 text-blue-800',
            paid: 'bg-green-100 text-green-800',
            overdue: 'bg-red-100 text-red-800',
            void: 'bg-gray-100 text-gray-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting'), href: '/accounting/accounts' },
            { title: t('accounting.accounts_payable'), href: '/accounting/payables' },
        ]}>
            <Head title={t('accounting.accounts_payable')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('accounting.accounts_payable')}</h1>
                        <p className="text-muted-foreground">{t('accounting.ap_desc')}</p>
                    </div>
                    <Button asChild className="backdrop-blur-sm bg-primary/90">
                        <Link href="/accounting/payables/create">
                            <Plus className="mr-2 h-4 w-4" />
                            {t('accounting.new_payable')}
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
                                        router.get('/accounting/payables', {
                                            ...filters,
                                            search: e.target.value || undefined,
                                        }, { preserveState: true });
                                    }}
                                />
                            </div>
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(value) => {
                                    router.get('/accounting/payables', {
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
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.supplier_id || 'all'}
                                onValueChange={(value) => {
                                    router.get('/accounting/payables', {
                                        ...filters,
                                        supplier_id: value === 'all' ? undefined : value,
                                    }, { preserveState: true });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('accounting.supplier')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('common.all')}</SelectItem>
                                    {suppliers.map((supplier) => (
                                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                            {supplier.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Payables List */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {payables.data.map((payable) => (
                                <div key={payable.id} className="p-4 hover:bg-muted/50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <Link href={`/accounting/payables/${payable.id}`} className="font-semibold hover:underline">
                                                    {payable.invoice_number}
                                                </Link>
                                                <Badge className={getStatusColor(payable.status)}>
                                                    {t(`accounting.${payable.status}`)}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground mt-1">
                                                {payable.supplier?.name || t('accounting.no_supplier')}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                <span>{t('accounting.due')}: {new Date(payable.due_date).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold">
                                                {formatCurrency(payable.total_amount, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                            </div>
                                            {payable.balance_due > 0 && payable.balance_due < payable.total_amount && (
                                                <div className="text-sm text-muted-foreground">
                                                    {t('accounting.balance')}: {formatCurrency(payable.balance_due, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                                </div>
                                            )}
                                            <Button variant="ghost" size="sm" asChild className="mt-2">
                                                <Link href={`/accounting/payables/${payable.id}`}>
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    {t('common.view')}
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {payables.data.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    {t('accounting.no_payables')}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Pagination links={payables.links} />
            </div>
        </AppLayout>
    );
}
