import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { Head, router, Link } from '@inertiajs/react';
import { Plus, Search, Eye, Trash2, FileText, Send, ArrowRight } from 'lucide-react';
import { Label } from '@/components/ui/label';
import Pagination from '@/components/pagination';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';
import { useDebounce } from '@/hooks/use-debounce';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Quotation {
    id: number;
    quotation_number: string;
    customer: { id: number; name: string } | null;
    user: { id: number; name: string };
    way: { id: number; name: string } | null;
    status: string;
    valid_until: string | null;
    total: number;
    created_at: string;
}

interface QuotationsPageProps {
    quotations: {
        data: Quotation[];
        links: any;
    };
    filters: {
        search?: string;
        status?: string;
    };
}

export default function QuotationsIndex({ quotations, filters }: QuotationsPageProps) {
    const { t, currentLanguage } = useTranslation();
    const [searchInput, setSearchInput] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const debouncedSearch = useDebounce(searchInput, 500);

    useEffect(() => {
        router.get('/quotations', {
            search: debouncedSearch || undefined,
            status: statusFilter === 'all' ? undefined : statusFilter,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    }, [debouncedSearch, statusFilter]);

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            draft: 'secondary',
            sent: 'default',
            accepted: 'default',
            rejected: 'destructive',
            expired: 'secondary',
            converted: 'default',
        };
        return <Badge variant={variants[status] || 'default'}>{t(`quotations.${status}`)}</Badge>;
    };

    return (
        <AppLayout breadcrumbs={[{ title: t('quotations.title'), href: '/quotations' }]}>
            <Head title={t('quotations.title')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('quotations.title')}</h1>
                        <p className="text-muted-foreground">{t('quotations.create_new')}</p>
                    </div>
                    <Link href="/quotations/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('quotations.add_quotation')}
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>{t('quotations.title')}</CardTitle>
                            <div className="flex items-center gap-2">
                                <Select value={statusFilter || 'all'} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder={t('common.all')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('common.all')}</SelectItem>
                                        <SelectItem value="draft">{t('quotations.draft')}</SelectItem>
                                        <SelectItem value="sent">{t('quotations.sent')}</SelectItem>
                                        <SelectItem value="accepted">{t('quotations.accepted')}</SelectItem>
                                        <SelectItem value="rejected">{t('quotations.rejected')}</SelectItem>
                                        <SelectItem value="expired">{t('quotations.expired')}</SelectItem>
                                        <SelectItem value="converted">{t('quotations.converted')}</SelectItem>
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
                        {quotations.data.length === 0 ? (
                            <div className="text-center py-6">
                                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold">{t('quotations.no_quotations')}</h3>
                                <Link href="/quotations/create">
                                    <Button className="mt-4">{t('quotations.add_quotation')}</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {quotations.data.map((quotation) => (
                                    <Card key={quotation.id} className="hover:bg-accent/50 transition-colors">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold">{quotation.quotation_number}</h3>
                                                        {getStatusBadge(quotation.status)}
                                                    </div>
                                                    <div className="mt-2 text-sm text-muted-foreground">
                                                        <p>{t('quotations.customer')}: {quotation.customer?.name || t('notifications.walk_in_customer')}</p>
                                                        <p>{t('common.date')}: {new Date(quotation.created_at).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}</p>
                                                        {quotation.valid_until && (
                                                            <p>{t('quotations.valid_until')}: {new Date(quotation.valid_until).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold">{formatCurrency(quotation.total, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</p>
                                                    </div>
                                                    <Link href={`/quotations/${quotation.id}`}>
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
                        {quotations.links && <Pagination links={quotations.links} />}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
