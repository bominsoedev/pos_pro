import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, RefreshCw, Calendar, Play, Pause, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';
import Pagination from '@/components/pagination';

interface RecurringEntry {
    id: number;
    name: string;
    description: string | null;
    frequency: string;
    frequency_display: string;
    next_run_date: string;
    last_run_date: string | null;
    total_amount: number;
    occurrences: number;
    max_occurrences: number | null;
    is_active: boolean;
    created_by: { name: string } | null;
}

interface Props {
    entries: {
        data: RecurringEntry[];
        links: any;
    };
    upcomingEntries: RecurringEntry[];
    filters: {
        status?: string;
    };
}

export default function RecurringEntriesIndex({ entries, upcomingEntries, filters }: Props) {
    const { t, currentLanguage } = useTranslation();
    const locale = currentLanguage === 'my' ? 'my-MM' : 'en-US';

    const handleStatusFilter = (status: string) => {
        router.get('/accounting/recurring-entries', { status: status || undefined }, { preserveState: true });
    };

    const handleToggle = (id: number) => {
        router.post(`/accounting/recurring-entries/${id}/toggle`);
    };

    const handleRunNow = (id: number) => {
        if (confirm(t('accounting.confirm_run_now'))) {
            router.post(`/accounting/recurring-entries/${id}/run`);
        }
    };

    const handleDelete = (id: number) => {
        if (confirm(t('common.confirm_delete'))) {
            router.delete(`/accounting/recurring-entries/${id}`);
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
        ]}>
            <Head title={t('accounting.recurring_entries')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <RefreshCw className="h-6 w-6" />
                            {t('accounting.recurring_entries')}
                        </h1>
                        <p className="text-muted-foreground">{t('accounting.recurring_entries_desc')}</p>
                    </div>
                    <Button asChild>
                        <Link href="/accounting/recurring-entries/create">
                            <Plus className="h-4 w-4 mr-2" />
                            {t('accounting.new_recurring')}
                        </Link>
                    </Button>
                </div>

                {/* Upcoming Entries */}
                {upcomingEntries.length > 0 && (
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {t('accounting.upcoming_entries')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {upcomingEntries.map((entry) => (
                                    <div key={entry.id} className="flex items-center gap-2 p-2 border rounded bg-yellow-50">
                                        <span className="text-sm font-medium">{entry.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(entry.next_run_date).toLocaleDateString(locale)}
                                        </span>
                                        <span className="text-sm font-bold">
                                            {formatCurrency(entry.total_amount, locale)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Filters */}
                <div className="flex gap-4">
                    <Select value={filters.status || 'all'} onValueChange={handleStatusFilter}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder={t('common.status')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('common.all')}</SelectItem>
                            <SelectItem value="active">{t('common.active')}</SelectItem>
                            <SelectItem value="inactive">{t('common.inactive')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Entries Table */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="p-0">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="text-left py-3 px-4">{t('common.name')}</th>
                                    <th className="text-left py-3 px-4">{t('accounting.frequency')}</th>
                                    <th className="text-left py-3 px-4">{t('accounting.next_run')}</th>
                                    <th className="text-left py-3 px-4">{t('accounting.last_run')}</th>
                                    <th className="text-right py-3 px-4">{t('common.amount')}</th>
                                    <th className="text-center py-3 px-4">{t('accounting.runs')}</th>
                                    <th className="text-center py-3 px-4">{t('common.status')}</th>
                                    <th className="text-right py-3 px-4">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.data.map((entry) => (
                                    <tr key={entry.id} className="border-b hover:bg-muted/30">
                                        <td className="py-3 px-4">
                                            <Link
                                                href={`/accounting/recurring-entries/${entry.id}`}
                                                className="font-medium text-primary hover:underline"
                                            >
                                                {entry.name}
                                            </Link>
                                            {entry.description && (
                                                <p className="text-xs text-muted-foreground">{entry.description}</p>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge className={getFrequencyColor(entry.frequency)}>
                                                {entry.frequency}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4">
                                            {new Date(entry.next_run_date).toLocaleDateString(locale)}
                                        </td>
                                        <td className="py-3 px-4 text-muted-foreground">
                                            {entry.last_run_date
                                                ? new Date(entry.last_run_date).toLocaleDateString(locale)
                                                : '-'
                                            }
                                        </td>
                                        <td className="py-3 px-4 text-right font-medium">
                                            {formatCurrency(entry.total_amount, locale)}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {entry.occurrences}
                                            {entry.max_occurrences && ` / ${entry.max_occurrences}`}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <Badge variant={entry.is_active ? 'default' : 'secondary'}>
                                                {entry.is_active ? t('common.active') : t('accounting.paused')}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {entry.is_active && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRunNow(entry.id)}
                                                        title={t('accounting.run_now')}
                                                    >
                                                        <Play className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleToggle(entry.id)}
                                                    title={entry.is_active ? t('accounting.pause') : t('accounting.activate')}
                                                >
                                                    {entry.is_active ? (
                                                        <Pause className="h-4 w-4" />
                                                    ) : (
                                                        <Play className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(entry.id)}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {entries.data.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8 text-muted-foreground">
                                            {t('accounting.no_recurring_entries')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                <Pagination links={entries.links} />
            </div>
        </AppLayout>
    );
}
