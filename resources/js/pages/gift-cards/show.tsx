import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Gift, CreditCard, History } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';
import { Label } from '@/components/ui/label';

interface GiftCardTransaction {
    id: number;
    type: string;
    amount: number;
    balance_after: number;
    description: string | null;
    created_at: string;
    user: { id: number; name: string } | null;
    order: { id: number; order_number: string } | null;
}

interface GiftCard {
    id: number;
    card_number: string;
    pin_code: string | null;
    initial_amount: number;
    current_balance: number;
    customer: { id: number; name: string; email: string | null; phone: string | null } | null;
    purchasedBy: { id: number; name: string };
    status: string;
    expires_at: string | null;
    notes: string | null;
    created_at: string;
    transactions: GiftCardTransaction[];
    order: { id: number; order_number: string } | null;
}

interface GiftCardShowProps {
    giftCard: GiftCard;
}

export default function GiftCardShow({ giftCard }: GiftCardShowProps) {
    const { t, currentLanguage } = useTranslation();
    const [showRedeemDialog, setShowRedeemDialog] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        amount: 0,
        order_id: null as number | null,
        description: '',
    });

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            active: 'default',
            used: 'secondary',
            expired: 'secondary',
            cancelled: 'destructive',
        };
        return <Badge variant={variants[status] || 'default'}>{t(`gift_cards.${status}`)}</Badge>;
    };

    const handleRedeem = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/gift-cards/${giftCard.id}/redeem`, {
            onSuccess: () => {
                setShowRedeemDialog(false);
                reset();
            },
        });
    };

    const canRedeem = giftCard.status === 'active' && giftCard.current_balance > 0;

    return (
        <AppLayout breadcrumbs={[
            { title: t('gift_cards.title'), href: '/gift-cards' },
            { title: giftCard.card_number, href: `/gift-cards/${giftCard.id}` },
        ]}>
            <Head title={giftCard.card_number} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/gift-cards">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{giftCard.card_number}</h1>
                            <p className="text-muted-foreground">{t('gift_cards.title')}</p>
                        </div>
                        {getStatusBadge(giftCard.status)}
                    </div>
                    {canRedeem && (
                        <Button onClick={() => setShowRedeemDialog(true)}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            {t('gift_cards.redeem')}
                        </Button>
                    )}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {/* Main Content */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70 md:col-span-2">
                        <CardHeader>
                            <CardTitle>{t('gift_cards.title')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Card Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('gift_cards.card_number')}</p>
                                    <p className="font-semibold text-lg">{giftCard.card_number}</p>
                                </div>
                                {giftCard.pin_code && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">{t('gift_cards.pin_code')}</p>
                                        <p className="font-semibold">{giftCard.pin_code}</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('gift_cards.initial_amount')}</p>
                                    <p className="font-semibold text-lg">{formatCurrency(giftCard.initial_amount, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('gift_cards.current_balance')}</p>
                                    <p className="font-semibold text-lg text-primary">{formatCurrency(giftCard.current_balance, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</p>
                                </div>
                            </div>

                            {/* Customer Info */}
                            {giftCard.customer && (
                                <div>
                                    <h3 className="font-semibold mb-2">{t('quotations.customer')}</h3>
                                    <div className="text-sm text-muted-foreground">
                                        <p>{giftCard.customer.name}</p>
                                        {giftCard.customer.email && <p>{giftCard.customer.email}</p>}
                                        {giftCard.customer.phone && <p>{giftCard.customer.phone}</p>}
                                    </div>
                                </div>
                            )}

                            {/* Transactions */}
                            <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <History className="h-4 w-4" />
                                    {t('common.transactions')}
                                </h3>
                                <div className="space-y-2">
                                    {giftCard.transactions.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">{t('common.no_data')}</p>
                                    ) : (
                                        giftCard.transactions.map((transaction) => (
                                            <div key={transaction.id} className="border rounded-lg p-3">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium">{transaction.description || transaction.type}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {new Date(transaction.created_at).toLocaleString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                                        </p>
                                                        {transaction.user && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {t('common.created_by')}: {transaction.user.name}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`font-semibold ${transaction.amount < 0 ? 'text-destructive' : 'text-primary'}`}>
                                                            {transaction.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount), currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {t('common.balance')}: {formatCurrency(transaction.balance_after, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {giftCard.notes && (
                                <div>
                                    <h3 className="font-semibold mb-2">{t('orders.notes')}</h3>
                                    <p className="text-sm text-muted-foreground">{giftCard.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Summary */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('common.summary')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('gift_cards.status')}</span>
                                {getStatusBadge(giftCard.status)}
                            </div>
                            {giftCard.expires_at && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('gift_cards.expires_at')}</span>
                                    <span>{new Date(giftCard.expires_at).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                </div>
                            )}
                            <div className="pt-4 border-t">
                                <p className="text-sm text-muted-foreground mb-1">{t('common.created_by')}</p>
                                <p className="text-sm">{giftCard.purchasedBy.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(giftCard.created_at).toLocaleString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Redeem Dialog */}
                <Dialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('gift_cards.redeem')}</DialogTitle>
                            <DialogDescription>
                                {t('gift_cards.current_balance')}: {formatCurrency(giftCard.current_balance, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleRedeem}>
                            <div className="space-y-4">
                                <div>
                                    <Label>{t('pos.amount')} *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max={giftCard.current_balance}
                                        value={data.amount}
                                        onChange={(e) => setData('amount', parseFloat(e.target.value) || 0)}
                                        required
                                    />
                                    {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
                                </div>
                                <div>
                                    <Label>{t('orders.order_number')}</Label>
                                    <Input
                                        type="number"
                                        value={data.order_id || ''}
                                        onChange={(e) => setData('order_id', e.target.value ? parseInt(e.target.value) : null)}
                                        placeholder={t('common.optional')}
                                    />
                                    {errors.order_id && <p className="text-sm text-destructive">{errors.order_id}</p>}
                                </div>
                                <div>
                                    <Label>{t('common.description')}</Label>
                                    <Input
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder={t('common.optional')}
                                    />
                                    {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowRedeemDialog(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" disabled={processing || data.amount <= 0 || data.amount > giftCard.current_balance}>
                                    {t('gift_cards.redeem')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
