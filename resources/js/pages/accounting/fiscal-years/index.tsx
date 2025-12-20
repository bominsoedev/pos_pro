import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Plus, Calendar, Lock, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

interface FiscalYear {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    is_closed: boolean;
    closed_at: string | null;
    closed_by: { name: string } | null;
}

interface Props {
    fiscalYears: FiscalYear[];
    currentYear: FiscalYear | null;
}

export default function FiscalYearsIndex({ fiscalYears, currentYear }: Props) {
    const { t, currentLanguage } = useTranslation();
    const locale = currentLanguage === 'my' ? 'my-MM' : 'en-US';

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting'), href: '/accounting/dashboard' },
            { title: t('accounting.fiscal_years'), href: '/accounting/fiscal-years' },
        ]}>
            <Head title={t('accounting.fiscal_years')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Calendar className="h-6 w-6" />
                            {t('accounting.fiscal_years')}
                        </h1>
                        <p className="text-muted-foreground">{t('accounting.fiscal_years_desc')}</p>
                    </div>
                    <Button asChild>
                        <Link href="/accounting/fiscal-years/create">
                            <Plus className="h-4 w-4 mr-2" />
                            {t('accounting.new_fiscal_year')}
                        </Link>
                    </Button>
                </div>

                {/* Current Year Card */}
                {currentYear && (
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70 border-green-200 bg-green-50/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                {t('accounting.current_fiscal_year')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold">{currentYear.name}</h3>
                                    <p className="text-muted-foreground">
                                        {new Date(currentYear.start_date).toLocaleDateString(locale)} - {new Date(currentYear.end_date).toLocaleDateString(locale)}
                                    </p>
                                </div>
                                <Button variant="outline" asChild>
                                    <Link href={`/accounting/fiscal-years/${currentYear.id}/close`}>
                                        <Lock className="h-4 w-4 mr-2" />
                                        {t('accounting.close_year')}
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Fiscal Years List */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="p-0">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="text-left py-3 px-4">{t('common.name')}</th>
                                    <th className="text-left py-3 px-4">{t('accounting.start_date')}</th>
                                    <th className="text-left py-3 px-4">{t('accounting.end_date')}</th>
                                    <th className="text-center py-3 px-4">{t('common.status')}</th>
                                    <th className="text-left py-3 px-4">{t('accounting.closed_at')}</th>
                                    <th className="text-right py-3 px-4">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fiscalYears.map((year) => (
                                    <tr key={year.id} className="border-b hover:bg-muted/30">
                                        <td className="py-3 px-4 font-medium">{year.name}</td>
                                        <td className="py-3 px-4">
                                            {new Date(year.start_date).toLocaleDateString(locale)}
                                        </td>
                                        <td className="py-3 px-4">
                                            {new Date(year.end_date).toLocaleDateString(locale)}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {year.is_closed ? (
                                                <Badge variant="secondary" className="bg-gray-100">
                                                    <Lock className="h-3 w-3 mr-1" />
                                                    {t('accounting.closed')}
                                                </Badge>
                                            ) : (
                                                <Badge variant="default" className="bg-green-100 text-green-800">
                                                    {t('accounting.open')}
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-muted-foreground">
                                            {year.closed_at ? (
                                                <div>
                                                    <div>{new Date(year.closed_at).toLocaleDateString(locale)}</div>
                                                    {year.closed_by && (
                                                        <div className="text-xs">{t('common.by')} {year.closed_by.name}</div>
                                                    )}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            {!year.is_closed && (
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/accounting/fiscal-years/${year.id}/close`}>
                                                        {t('accounting.close_year')}
                                                    </Link>
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {fiscalYears.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                                            {t('accounting.no_fiscal_years')}
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
