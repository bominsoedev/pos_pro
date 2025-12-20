import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, router, Link } from '@inertiajs/react';
import { Plus, Search, Eye, FileText } from 'lucide-react';
import Pagination from '@/components/pagination';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface JournalEntryLine {
    id: number;
    account: {
        id: number;
        code: string;
        name: string;
    };
    description: string | null;
    debit: number;
    credit: number;
}

interface JournalEntry {
    id: number;
    entry_number: string;
    entry_date: string;
    reference: string | null;
    description: string;
    status: 'draft' | 'posted' | 'void';
    source: string;
    total_debit: number;
    total_credit: number;
    created_by: { name: string } | null;
    lines: JournalEntryLine[];
}

interface Props {
    entries: {
        data: JournalEntry[];
        links: any;
    };
    filters: {
        search?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
    };
}

export default function JournalEntriesIndex({ entries, filters }: Props) {
    const { t, currentLanguage } = useTranslation();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'posted': return 'bg-green-100 text-green-800';
            case 'draft': return 'bg-yellow-100 text-yellow-800';
            case 'void': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getSourceLabel = (source: string) => {
        const labels: Record<string, string> = {
            manual: t('accounting.source_manual'),
            sales: t('accounting.source_sales'),
            expense: t('accounting.source_expense'),
            purchase: t('accounting.source_purchase'),
            refund: t('accounting.source_refund'),
            payment: t('accounting.source_payment'),
            adjustment: t('accounting.source_adjustment'),
        };
        return labels[source] || source;
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting'), href: '/accounting/accounts' },
            { title: t('accounting.journal_entries'), href: '/accounting/journal-entries' },
        ]}>
            <Head title={t('accounting.journal_entries')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('accounting.journal_entries')}</h1>
                        <p className="text-muted-foreground">{t('accounting.journal_entries_desc')}</p>
                    </div>
                    <Button asChild className="backdrop-blur-sm bg-primary/90">
                        <Link href="/accounting/journal-entries/create">
                            <Plus className="mr-2 h-4 w-4" />
                            {t('accounting.new_entry')}
                        </Link>
                    </Button>
                </div>

                {/* Filters */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="relative md:col-span-2">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={t('common.search')}
                                    className="pl-10"
                                    defaultValue={filters.search}
                                    onChange={(e) => {
                                        router.get('/accounting/journal-entries', {
                                            ...filters,
                                            search: e.target.value || undefined,
                                        }, { preserveState: true });
                                    }}
                                />
                            </div>
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(value) => {
                                    router.get('/accounting/journal-entries', {
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
                                    <SelectItem value="draft">{t('accounting.draft')}</SelectItem>
                                    <SelectItem value="posted">{t('accounting.posted')}</SelectItem>
                                    <SelectItem value="void">{t('accounting.void')}</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                type="date"
                                value={filters.date_from || ''}
                                onChange={(e) => {
                                    router.get('/accounting/journal-entries', {
                                        ...filters,
                                        date_from: e.target.value || undefined,
                                    }, { preserveState: true });
                                }}
                                placeholder={t('common.from')}
                            />
                            <Input
                                type="date"
                                value={filters.date_to || ''}
                                onChange={(e) => {
                                    router.get('/accounting/journal-entries', {
                                        ...filters,
                                        date_to: e.target.value || undefined,
                                    }, { preserveState: true });
                                }}
                                placeholder={t('common.to')}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Entries List */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {entries.data.map((entry) => (
                                <div key={entry.id} className="p-4 hover:bg-muted/50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-5 w-5 text-muted-foreground" />
                                                <Link href={`/accounting/journal-entries/${entry.id}`} className="font-semibold hover:underline">
                                                    {entry.entry_number}
                                                </Link>
                                                <Badge className={getStatusColor(entry.status)}>
                                                    {t(`accounting.${entry.status}`)}
                                                </Badge>
                                                <Badge variant="outline">{getSourceLabel(entry.source)}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                <span>{new Date(entry.entry_date).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                                {entry.reference && <span>Ref: {entry.reference}</span>}
                                                {entry.created_by && <span>By: {entry.created_by.name}</span>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold">
                                                {formatCurrency(entry.total_debit, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                            </div>
                                            <Button variant="ghost" size="sm" asChild className="mt-2">
                                                <Link href={`/accounting/journal-entries/${entry.id}`}>
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    {t('common.view')}
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                    {/* Entry Lines Preview */}
                                    <div className="mt-3 ml-8 text-sm">
                                        {entry.lines.slice(0, 4).map((line, idx) => (
                                            <div key={line.id} className="flex items-center gap-4 py-1">
                                                <span className={`w-24 ${line.credit > 0 ? 'pl-4' : ''}`}>
                                                    {line.account.code}
                                                </span>
                                                <span className="flex-1 text-muted-foreground">{line.account.name}</span>
                                                <span className="w-24 text-right">{line.debit > 0 ? formatCurrency(line.debit, currentLanguage === 'my' ? 'my-MM' : 'en-US') : ''}</span>
                                                <span className="w-24 text-right">{line.credit > 0 ? formatCurrency(line.credit, currentLanguage === 'my' ? 'my-MM' : 'en-US') : ''}</span>
                                            </div>
                                        ))}
                                        {entry.lines.length > 4 && (
                                            <div className="text-muted-foreground italic">
                                                +{entry.lines.length - 4} {t('common.more')}...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {entries.data.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    {t('accounting.no_entries')}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Pagination links={entries.links} />
            </div>
        </AppLayout>
    );
}
