import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Edit, Send, ArrowRight, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface QuotationItem {
    id: number;
    product_name: string;
    product_sku: string | null;
    quantity: number;
    price: number;
    discount: number;
    subtotal: number;
    total: number;
    product: { id: number; name: string } | null;
}

interface Quotation {
    id: number;
    quotation_number: string;
    customer: { id: number; name: string; email: string | null; phone: string | null } | null;
    user: { id: number; name: string };
    way: { id: number; name: string } | null;
    status: string;
    valid_until: string | null;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total: number;
    notes: string | null;
    terms: string | null;
    created_at: string;
    sent_at: string | null;
    accepted_at: string | null;
    converted_at: string | null;
    converted_to_order_id: number | null;
    items: QuotationItem[];
}

interface QuotationShowProps {
    quotation: Quotation;
}

export default function QuotationShow({ quotation }: QuotationShowProps) {
    const { t } = useTranslation();
    const { post, processing } = useForm({});

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

    const handleSend = () => {
        if (confirm(t('quotations.send_quotation') + '?')) {
            post(`/quotations/${quotation.id}/send`, {
                preserveScroll: true,
            });
        }
    };

    const handleConvert = () => {
        if (confirm(t('quotations.convert_to_order') + '?')) {
            post(`/quotations/${quotation.id}/convert`, {
                preserveScroll: true,
            });
        }
    };

    const canEdit = quotation.status === 'draft';
    const canSend = quotation.status === 'draft';
    const canConvert = quotation.status === 'sent' || quotation.status === 'accepted';

    return (
        <AppLayout breadcrumbs={[
            { title: t('quotations.title'), href: '/quotations' },
            { title: quotation.quotation_number, href: `/quotations/${quotation.id}` },
        ]}>
            <Head title={quotation.quotation_number} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/quotations">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{quotation.quotation_number}</h1>
                            <p className="text-muted-foreground">{t('quotations.title')}</p>
                        </div>
                        {getStatusBadge(quotation.status)}
                    </div>
                    <div className="flex items-center gap-2">
                        {canEdit && (
                            <Button variant="outline" asChild>
                                <Link href={`/quotations/${quotation.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    {t('common.edit')}
                                </Link>
                            </Button>
                        )}
                        {canSend && (
                            <Button onClick={handleSend} disabled={processing}>
                                <Send className="mr-2 h-4 w-4" />
                                {t('quotations.send_quotation')}
                            </Button>
                        )}
                        {canConvert && (
                            <Button onClick={handleConvert} disabled={processing}>
                                <ArrowRight className="mr-2 h-4 w-4" />
                                {t('quotations.convert_to_order')}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {/* Main Content */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70 md:col-span-2">
                        <CardHeader>
                            <CardTitle>{t('quotations.title')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Customer Info */}
                            <div>
                                <h3 className="font-semibold mb-2">{t('quotations.customer')}</h3>
                                <div className="text-sm text-muted-foreground">
                                    <p>{quotation.customer?.name || t('notifications.walk_in_customer')}</p>
                                    {quotation.customer?.email && <p>{quotation.customer.email}</p>}
                                    {quotation.customer?.phone && <p>{quotation.customer.phone}</p>}
                                </div>
                            </div>

                            {/* Items */}
                            <div>
                                <h3 className="font-semibold mb-2">{t('products.items')}</h3>
                                <div className="space-y-2">
                                    {quotation.items.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between border-b pb-2">
                                            <div className="flex-1">
                                                <p className="font-medium">{item.product_name}</p>
                                                {item.product_sku && (
                                                    <p className="text-sm text-muted-foreground">{item.product_sku}</p>
                                                )}
                                                <p className="text-sm text-muted-foreground">
                                                    {item.quantity} x {formatCurrency(item.price)}
                                                    {item.discount > 0 && ` - ${formatCurrency(item.discount)} discount`}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">{formatCurrency(item.total)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            {quotation.notes && (
                                <div>
                                    <h3 className="font-semibold mb-2">{t('orders.notes')}</h3>
                                    <p className="text-sm text-muted-foreground">{quotation.notes}</p>
                                </div>
                            )}

                            {/* Terms */}
                            {quotation.terms && (
                                <div>
                                    <h3 className="font-semibold mb-2">Terms</h3>
                                    <p className="text-sm text-muted-foreground">{quotation.terms}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Summary */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('pos.total')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('pos.subtotal')}</span>
                                <span>{formatCurrency(quotation.subtotal)}</span>
                            </div>
                            {quotation.tax_amount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('pos.tax')}</span>
                                    <span>{formatCurrency(quotation.tax_amount)}</span>
                                </div>
                            )}
                            {quotation.discount_amount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('pos.discount')}</span>
                                    <span className="text-destructive">-{formatCurrency(quotation.discount_amount)}</span>
                                </div>
                            )}
                            <div className="border-t pt-2 mt-2">
                                <div className="flex justify-between font-bold text-lg">
                                    <span>{t('pos.total')}</span>
                                    <span>{formatCurrency(quotation.total)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Additional Info */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('common.details')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">{t('common.date')}</p>
                                <p className="font-medium">{new Date(quotation.created_at).toLocaleDateString()}</p>
                            </div>
                            {quotation.valid_until && (
                                <div>
                                    <p className="text-muted-foreground">{t('quotations.valid_until')}</p>
                                    <p className="font-medium">{new Date(quotation.valid_until).toLocaleDateString()}</p>
                                </div>
                            )}
                            {quotation.way && (
                                <div>
                                    <p className="text-muted-foreground">{t('ways.title')}</p>
                                    <p className="font-medium">{quotation.way.name}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-muted-foreground">{t('common.created_by')}</p>
                                <p className="font-medium">{quotation.user.name}</p>
                            </div>
                        </div>
                        {quotation.converted_to_order_id && (
                            <div className="mt-4">
                                <Button variant="outline" asChild>
                                    <Link href={`/orders/${quotation.converted_to_order_id}`}>
                                        {t('quotations.converted')} - {t('orders.title')} #{quotation.converted_to_order_id}
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
