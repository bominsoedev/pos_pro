import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, RefreshCw, Play, Pause, Trash2, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface Account {
    id: number;
    code: string;
    name: string;
}

interface EntryLine {
    id: number;
    account: Account;
    description: string | null;
    debit: number;
    credit: number;
}

interface JournalEntry {
    id: number;
    entry_number: string;
    entry_date: string;
    total_debit: number;
}

interface RecurringEntry {
    id: number;
    name: string;
    description: string | null;
    frequency: string;
    day_of_week: number | null;
    day_of_month: number | null;
    start_date: string;
    end_date: string | null;
    next_run_date: string;
    last_run_date: string | null;
    total_amount: number;
    occurrences: number;
    max_occurrences: number | null;
    is_active: boolean;
    lines: EntryLine[];
    created_by: { name: string } | null;
    generated_entries: JournalEntry[];
}

interface Props {
    entry: RecurringEntry;
}

export default function ShowRecurringEntry({ entry }: Props) {
    const { t, currentLanguage } = useTranslation();
    const locale = currentLanguage === 'my' ? 'my-MM' : 'en-US';

    const handleToggle = () => {
        router.post(`/accounting/recurring-entries/${entry.id}/toggle`);
    };

    const handleRunNow = () => {
        if (confirm(t('accounting.confirm_run_now'))) {
            router.post(`/accounting/recurring-entries/${entry.id}/run`);
        }
    };

    const handleDelete = () => {
        if (confirm(t('common.confirm_delete'))) {
            router.delete(`/accounting/recurring-entries/${entry.id}`);
        }
    };

    const getFrequencyColor = (frequency: string) => {
        const colors: Record<string, string> = {
            daily: 'bg-blue-100 text-blue-800',
            weekly: 'bg-green-100 text-green-800',
            monthly: 'bg-purple-100 text-purple-800',
            quarterly: 'bg-orange-100 text-orange-800',
            yearly: 'bg-red-100 text-red-800',
        };
        return colors[frequency] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting'), href: '/accounting/dashboard' },
            { title: t('accounting.recurring_entries'), href: '/accounting/recurring-entries' },
            { title: entry.name, href: '#' },
        ]}>
            <Head title={entry.name} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/accounting/recurring-entries">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <RefreshCw className="h-6 w-6" />
                                {entry.name}
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge className={getFrequencyColor(entry.frequency)}>
                                    {entry.frequency}
                                </Badge>
                                <Badge variant={entry.is_active ? 'default' : 'secondary'}>
                                    {entry.is_active ? t('common.active') : t('accounting.paused')}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {entry.is_active && (
                            <Button variant="outline" onClick={handleRunNow}>
                                <Play className="h-4 w-4 mr-2" />
                                {t('accounting.run_now')}
                            </Button>
                        )}
                        <Button variant="outline" onClick={handleToggle}>
                            {entry.is_active ? (
                                <>
                                    <Pause className="h-4 w-4 mr-2" />
                                    {t('accounting.pause')}
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4 mr-2" />
                                    {t('accounting.activate')}
                                </>
                            )}
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('common.delete')}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Details */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70 lg:col-span-2">
                        <CardHeader>
                            <CardTitle>{t('accounting.template_info')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {entry.description && (
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('common.description')}</p>
                                    <p>{entry.description}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('accounting.start_date')}</p>
                                    <p className="font-medium">{new Date(entry.start_date).toLocaleDateString(locale)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('accounting.end_date')}</p>
                                    <p className="font-medium">{entry.end_date ? new Date(entry.end_date).toLocaleDateString(locale) : t('common.never')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('accounting.next_run')}</p>
                                    <p className="font-medium">{new Date(entry.next_run_date).toLocaleDateString(locale)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('accounting.last_run')}</p>
                                    <p className="font-medium">{entry.last_run_date ? new Date(entry.last_run_date).toLocaleDateString(locale) : '-'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('common.amount')}</p>
                                    <p className="text-xl font-bold">{formatCurrency(entry.total_amount, locale)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('accounting.runs')}</p>
                                    <p className="font-medium">
                                        {entry.occurrences}
                                        {entry.max_occurrences && ` / ${entry.max_occurrences}`}
                                    </p>
                                </div>
                                {entry.created_by && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">{t('common.created_by')}</p>
                                        <p className="font-medium">{entry.created_by.name}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Schedule Info */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                {t('accounting.schedule')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('accounting.frequency')}</span>
                                <Badge className={getFrequencyColor(entry.frequency)}>{entry.frequency}</Badge>
                            </div>
                            {entry.day_of_week !== null && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('accounting.day_of_week')}</span>
                                    <span>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][entry.day_of_week]}</span>
                                </div>
                            )}
                            {entry.day_of_month !== null && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('accounting.day_of_month')}</span>
                                    <span>{entry.day_of_month}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Entry Lines */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('accounting.entry_lines')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2 px-2">{t('accounting.account')}</th>
                                    <th className="text-left py-2 px-2">{t('common.description')}</th>
                                    <th className="text-right py-2 px-2">{t('accounting.debit')}</th>
                                    <th className="text-right py-2 px-2">{t('accounting.credit')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entry.lines.map((line) => (
                                    <tr key={line.id} className="border-b">
                                        <td className="py-2 px-2">
                                            <span className="font-mono text-sm">{line.account.code}</span> - {line.account.name}
                                        </td>
                                        <td className="py-2 px-2 text-muted-foreground">{line.description || '-'}</td>
                                        <td className="py-2 px-2 text-right">
                                            {line.debit > 0 ? formatCurrency(line.debit, locale) : ''}
                                        </td>
                                        <td className="py-2 px-2 text-right">
                                            {line.credit > 0 ? formatCurrency(line.credit, locale) : ''}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="font-bold">
                                    <td colSpan={2} className="py-2 px-2 text-right">{t('common.total')}</td>
                                    <td className="py-2 px-2 text-right">{formatCurrency(entry.total_amount, locale)}</td>
                                    <td className="py-2 px-2 text-right">{formatCurrency(entry.total_amount, locale)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </CardContent>
                </Card>

                {/* Generated Entries History */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('accounting.generated_entries')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2">{t('common.date')}</th>
                                    <th className="text-left py-2">{t('accounting.entry_number')}</th>
                                    <th className="text-right py-2">{t('common.amount')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entry.generated_entries.map((je) => (
                                    <tr key={je.id} className="border-b hover:bg-muted/30">
                                        <td className="py-2">{new Date(je.entry_date).toLocaleDateString(locale)}</td>
                                        <td className="py-2">
                                            <Link 
                                                href={`/accounting/journal-entries/${je.id}`}
                                                className="text-primary hover:underline"
                                            >
                                                {je.entry_number}
                                            </Link>
                                        </td>
                                        <td className="py-2 text-right">{formatCurrency(je.total_debit, locale)}</td>
                                    </tr>
                                ))}
                                {entry.generated_entries.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-muted-foreground">
                                            {t('accounting.no_generated_entries')}
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
