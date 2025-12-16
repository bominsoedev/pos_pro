import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';

interface Customer {
    id: number;
    name: string;
}

interface GiftCardCreateProps {
    customers: Customer[];
}

export default function GiftCardCreate({ customers }: GiftCardCreateProps) {
    const { t } = useTranslation();

    const { data, setData, post, processing, errors } = useForm({
        initial_amount: 0,
        customer_id: null as number | null,
        expires_at: '',
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/gift-cards', {
            onSuccess: () => {
                // Redirect handled by controller
            },
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('gift_cards.title'), href: '/gift-cards' },
            { title: t('gift_cards.add_gift_card'), href: '/gift-cards/create' },
        ]}>
            <Head title={t('gift_cards.add_gift_card')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/gift-cards">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{t('gift_cards.add_gift_card')}</h1>
                        <p className="text-muted-foreground">{t('gift_cards.title')}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70 max-w-2xl">
                        <CardHeader>
                            <CardTitle>{t('gift_cards.add_gift_card')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>{t('gift_cards.initial_amount')} *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.initial_amount}
                                    onChange={(e) => setData('initial_amount', parseFloat(e.target.value) || 0)}
                                    required
                                />
                                {errors.initial_amount && <p className="text-sm text-destructive">{errors.initial_amount}</p>}
                            </div>

                            <div>
                                <Label>{t('quotations.customer')}</Label>
                                <Select
                                    value={data.customer_id?.toString() || ''}
                                    onValueChange={(value) => setData('customer_id', value ? parseInt(value) : null)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('quotations.customer')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">{t('notifications.walk_in_customer')}</SelectItem>
                                        {customers.map((customer) => (
                                            <SelectItem key={customer.id} value={customer.id.toString()}>
                                                {customer.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.customer_id && <p className="text-sm text-destructive">{errors.customer_id}</p>}
                            </div>

                            <div>
                                <Label>{t('gift_cards.expires_at')}</Label>
                                <Input
                                    type="date"
                                    value={data.expires_at}
                                    onChange={(e) => setData('expires_at', e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                                {errors.expires_at && <p className="text-sm text-destructive">{errors.expires_at}</p>}
                            </div>

                            <div>
                                <Label>{t('orders.notes')}</Label>
                                <Textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                />
                                {errors.notes && <p className="text-sm text-destructive">{errors.notes}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-2 mt-4">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/gift-cards">{t('common.cancel')}</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {t('common.create')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
