import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Search, History, Filter } from 'lucide-react';
import Pagination from '@/components/pagination';
import { useTranslation } from '@/hooks/use-translation';
import { useDebounce } from '@/hooks/use-debounce';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ActivityLog {
    id: number;
    log_name: string;
    description: string;
    subject_type: string | null;
    subject_id: number | null;
    event: string;
    causer: { id: number; name: string } | null;
    properties: any;
    created_at: string;
}

interface ActivityLogsPageProps {
    logs: {
        data: ActivityLog[];
        links: any;
    };
    filters: {
        search?: string;
        log_name?: string;
        subject_type?: string;
        event?: string;
        date_from?: string;
        date_to?: string;
    };
}

export default function ActivityLogsIndex({ logs, filters }: ActivityLogsPageProps) {
    const { t } = useTranslation();
    const [searchInput, setSearchInput] = useState(filters.search || '');
    const [logNameFilter, setLogNameFilter] = useState(filters.log_name || 'all');
    const [eventFilter, setEventFilter] = useState(filters.event || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const debouncedSearch = useDebounce(searchInput, 500);

    useEffect(() => {
        router.get('/activity-logs', {
            search: debouncedSearch || undefined,
            log_name: logNameFilter === 'all' ? undefined : logNameFilter,
            event: eventFilter === 'all' ? undefined : eventFilter,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    }, [debouncedSearch, logNameFilter, eventFilter, dateFrom, dateTo]);

    const getEventBadge = (event: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            POST: 'default',
            PUT: 'default',
            PATCH: 'default',
            DELETE: 'destructive',
            GET: 'secondary',
        };
        return <Badge variant={variants[event] || 'default'}>{event}</Badge>;
    };

    return (
        <AppLayout breadcrumbs={[{ title: t('activity_logs.title'), href: '/activity-logs' }]}>
            <Head title={t('activity_logs.title')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('activity_logs.title')}</h1>
                        <p className="text-muted-foreground">{t('activity_logs.title')}</p>
                    </div>
                </div>

                {/* Filters */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            <CardTitle>{t('common.filter')}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={t('common.search')}
                                    className="pl-10"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                />
                            </div>
                            <Select value={logNameFilter || 'all'} onValueChange={setLogNameFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Log Name" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('common.all')}</SelectItem>
                                    <SelectItem value="products">Products</SelectItem>
                                    <SelectItem value="orders">Orders</SelectItem>
                                    <SelectItem value="customers">Customers</SelectItem>
                                    <SelectItem value="quotations">Quotations</SelectItem>
                                    <SelectItem value="stock-transfers">Stock Transfers</SelectItem>
                                    <SelectItem value="gift-cards">Gift Cards</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={eventFilter || 'all'} onValueChange={setEventFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Event" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('common.all')}</SelectItem>
                                    <SelectItem value="POST">POST</SelectItem>
                                    <SelectItem value="PUT">PUT</SelectItem>
                                    <SelectItem value="PATCH">PATCH</SelectItem>
                                    <SelectItem value="DELETE">DELETE</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                type="date"
                                placeholder={t('common.from')}
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                            <Input
                                type="date"
                                placeholder={t('common.to')}
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Logs List */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('activity_logs.title')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {logs.data.length === 0 ? (
                            <div className="text-center py-6">
                                <History className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold">{t('activity_logs.no_logs')}</h3>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {logs.data.map((log) => (
                                    <Card key={log.id} className="hover:bg-accent/50 transition-colors">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {getEventBadge(log.event)}
                                                        <span className="text-sm text-muted-foreground">{log.log_name}</span>
                                                    </div>
                                                    <p className="font-medium">{log.description}</p>
                                                    <div className="mt-2 text-sm text-muted-foreground">
                                                        {log.causer && (
                                                            <p>{t('activity_logs.causer')}: {log.causer.name}</p>
                                                        )}
                                                        <p>{t('activity_logs.date')}: {new Date(log.created_at).toLocaleString()}</p>
                                                        {log.subject_type && (
                                                            <p>{t('activity_logs.subject')}: {log.subject_type} #{log.subject_id}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                        {logs.links && <Pagination links={logs.links} />}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
