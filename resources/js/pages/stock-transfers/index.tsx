import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, router, Link } from '@inertiajs/react';
import { Plus, Search, Eye, ArrowLeftRight } from 'lucide-react';
import Pagination from '@/components/pagination';
import { useTranslation } from '@/hooks/use-translation';
import { useDebounce } from '@/hooks/use-debounce';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Way {
    id: number;
    name: string;
}

interface StockTransfer {
    id: number;
    transfer_number: string;
    fromWay: { id: number; name: string };
    toWay: { id: number; name: string };
    user: { id: number; name: string };
    status: string;
    transfer_date: string;
    expected_date: string | null;
    created_at: string;
}

interface StockTransfersPageProps {
    transfers: {
        data: StockTransfer[];
        links: any;
    };
    filters: {
        search?: string;
        status?: string;
        from_way_id?: number;
        to_way_id?: number;
    };
}

export default function StockTransfersIndex({ transfers, filters }: StockTransfersPageProps) {
    const { t } = useTranslation();
    const [searchInput, setSearchInput] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const debouncedSearch = useDebounce(searchInput, 500);

    useEffect(() => {
        router.get('/stock-transfers', {
            search: debouncedSearch || undefined,
            status: statusFilter === 'all' ? undefined : statusFilter,
            from_way_id: filters.from_way_id,
            to_way_id: filters.to_way_id,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    }, [debouncedSearch, statusFilter]);

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            pending: 'secondary',
            approved: 'default',
            in_transit: 'default',
            completed: 'default',
            cancelled: 'destructive',
        };
        return <Badge variant={variants[status] || 'default'}>{t(`stock_transfers.${status}`)}</Badge>;
    };

    return (
        <AppLayout breadcrumbs={[{ title: t('stock_transfers.title'), href: '/stock-transfers' }]}>
            <Head title={t('stock_transfers.title')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('stock_transfers.title')}</h1>
                        <p className="text-muted-foreground">{t('stock_transfers.title')}</p>
                    </div>
                    <Link href="/stock-transfers/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('stock_transfers.add_transfer')}
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>{t('stock_transfers.title')}</CardTitle>
                            <div className="flex items-center gap-2">
                                <Select value={statusFilter || 'all'} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder={t('common.all')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('common.all')}</SelectItem>
                                        <SelectItem value="pending">{t('stock_transfers.pending')}</SelectItem>
                                        <SelectItem value="approved">{t('stock_transfers.approved')}</SelectItem>
                                        <SelectItem value="in_transit">{t('stock_transfers.in_transit')}</SelectItem>
                                        <SelectItem value="completed">{t('stock_transfers.completed')}</SelectItem>
                                        <SelectItem value="cancelled">{t('stock_transfers.cancelled')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="relative w-64">
                                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder={t('common.search')}
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {transfers.data.length === 0 ? (
                            <div className="text-center py-6">
                                <ArrowLeftRight className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold">{t('stock_transfers.no_transfers')}</h3>
                                <Link href="/stock-transfers/create">
                                    <Button className="mt-4">{t('stock_transfers.add_transfer')}</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {transfers.data.map((transfer) => (
                                    <Card key={transfer.id} className="hover:bg-accent/50 transition-colors">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold">{transfer.transfer_number}</h3>
                                                        {getStatusBadge(transfer.status)}
                                                    </div>
                                                    <div className="mt-2 text-sm text-muted-foreground">
                                                        <p>{t('stock_transfers.from_location')}: {transfer.fromWay.name}</p>
                                                        <p>{t('stock_transfers.to_location')}: {transfer.toWay.name}</p>
                                                        <p>{t('stock_transfers.transfer_date')}: {new Date(transfer.transfer_date).toLocaleDateString()}</p>
                                                        {transfer.expected_date && (
                                                            <p>{t('stock_transfers.expected_date')}: {new Date(transfer.expected_date).toLocaleDateString()}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Link href={`/stock-transfers/${transfer.id}`}>
                                                        <Button variant="ghost" size="icon">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                        {transfers.links && <Pagination links={transfers.links} />}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
