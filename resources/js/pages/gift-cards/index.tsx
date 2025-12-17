import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, router, Link } from '@inertiajs/react';
import { Plus, Search, Eye, Gift } from 'lucide-react';
import Pagination from '@/components/pagination';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';
import { useDebounce } from '@/hooks/use-debounce';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GiftCard {
    id: number;
    card_number: string;
    pin_code: string | null;
    initial_amount: number;
    current_balance: number;
    customer: { id: number; name: string } | null;
    purchasedBy: { id: number; name: string } | null;
    status: string;
    expires_at: string | null;
    created_at: string;
}

interface GiftCardsPageProps {
    giftCards: {
        data: GiftCard[];
        links: any;
    };
    filters: {
        search?: string;
        status?: string;
    };
}

export default function GiftCardsIndex({ giftCards, filters }: GiftCardsPageProps) {
    const { t } = useTranslation();
    const [searchInput, setSearchInput] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const debouncedSearch = useDebounce(searchInput, 500);

    useEffect(() => {
        router.get('/gift-cards', {
            search: debouncedSearch || undefined,
            status: statusFilter === 'all' ? undefined : statusFilter,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    }, [debouncedSearch, statusFilter]);

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            active: 'default',
            used: 'secondary',
            expired: 'secondary',
            cancelled: 'destructive',
        };
        return <Badge variant={variants[status] || 'default'}>{t(`gift_cards.${status}`)}</Badge>;
    };

    return (
        <AppLayout breadcrumbs={[{ title: t('gift_cards.title'), href: '/gift-cards' }]}>
            <Head title={t('gift_cards.title')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('gift_cards.title')}</h1>
                        <p className="text-muted-foreground">{t('gift_cards.title')}</p>
                    </div>
                    <Link href="/gift-cards/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('gift_cards.add_gift_card')}
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>{t('gift_cards.title')}</CardTitle>
                            <div className="flex items-center gap-2">
                                <Select value={statusFilter || 'all'} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder={t('common.all')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('common.all')}</SelectItem>
                                        <SelectItem value="active">{t('gift_cards.active')}</SelectItem>
                                        <SelectItem value="used">{t('gift_cards.used')}</SelectItem>
                                        <SelectItem value="expired">{t('gift_cards.expired')}</SelectItem>
                                        <SelectItem value="cancelled">{t('gift_cards.cancelled')}</SelectItem>
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
                        {giftCards.data.length === 0 ? (
                            <div className="text-center py-6">
                                <Gift className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold">{t('gift_cards.no_gift_cards')}</h3>
                                <Link href="/gift-cards/create">
                                    <Button className="mt-4">{t('gift_cards.add_gift_card')}</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {giftCards.data.map((giftCard) => (
                                    <Card key={giftCard.id} className="hover:bg-accent/50 transition-colors">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold">{giftCard.card_number}</h3>
                                                        {getStatusBadge(giftCard.status)}
                                                    </div>
                                                    <div className="mt-2 text-sm text-muted-foreground">
                                                        <p>{t('gift_cards.current_balance')}: {formatCurrency(giftCard.current_balance)}</p>
                                                        <p>{t('gift_cards.initial_amount')}: {formatCurrency(giftCard.initial_amount)}</p>
                                                        {giftCard.customer && (
                                                            <p>{t('quotations.customer')}: {giftCard.customer.name}</p>
                                                        )}
                                                        {giftCard.expires_at && (
                                                            <p>{t('gift_cards.expires_at')}: {new Date(giftCard.expires_at).toLocaleDateString()}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Link href={`/gift-cards/${giftCard.id}`}>
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
                        {giftCards.links && <Pagination links={giftCards.links} />}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
