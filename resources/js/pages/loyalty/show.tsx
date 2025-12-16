import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Star, Plus, Minus } from 'lucide-react';
import Pagination from '@/components/pagination';
import { useTranslation } from '@/hooks/use-translation';

interface PointTransaction {
    id: number;
    points: number;
    type: string;
    description: string | null;
    created_at: string;
    order: {
        id: number;
        order_number: string;
    } | null;
}

interface Customer {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    loyalty_points: number;
    loyalty_tier: string;
    total_spent: number;
    total_orders: number;
}

interface LoyaltyShowProps {
    customer: Customer;
    transactions: {
        data: PointTransaction[];
        links: any;
    };
}

export default function LoyaltyShow({ customer, transactions }: LoyaltyShowProps) {
    const { t } = useTranslation();
    const [showAdjustDialog, setShowAdjustDialog] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        points: 0,
        type: 'add',
        description: '',
    });

    const handleAdjust = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/loyalty/${customer.id}/adjust`, {
            preserveScroll: true,
            onSuccess: () => {
                setShowAdjustDialog(false);
                reset();
            },
        });
    };

    const getTierBadge = (tier: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            bronze: 'secondary',
            silver: 'default',
            gold: 'outline',
            platinum: 'default',
        };
        return variants[tier] || 'secondary';
    };

    const getTierLabel = (tier: string) => {
        return t(`loyalty.tier_${tier}`) || tier;
    };

    const getTransactionTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            earned: t('loyalty.earned'),
            redeemed: t('loyalty.redeemed'),
            adjusted: t('loyalty.adjusted'),
        };
        return labels[type] || type;
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('loyalty.title'), href: '/loyalty' },
            { title: customer.name, href: `/loyalty/${customer.id}` },
        ]}>
            <Head title={`${t('loyalty.title')} - ${customer.name}`} />
            <div className="flex h-full flex-1 flex-col gap-2 overflow-x-auto rounded-lg p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href="/loyalty">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold">{customer.name}</h1>
                            <p className="text-muted-foreground">{t('loyalty.title')}</p>
                        </div>
                    </div>
                    <Button onClick={() => setShowAdjustDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('loyalty.adjust_points')}
                    </Button>
                </div>

                <div className="grid gap-2 md:grid-cols-4">
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                            <CardTitle className="text-xs font-medium">{t('loyalty.points')}</CardTitle>
                            <Star className="h-3.5 w-3.5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">{customer.loyalty_points}</div>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                            <CardTitle className="text-xs font-medium">{t('loyalty.tier')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Badge variant={getTierBadge(customer.loyalty_tier)}>
                                {getTierLabel(customer.loyalty_tier)}
                            </Badge>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                            <CardTitle className="text-xs font-medium">{t('customers.total_spent')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">{customer.total_spent.toFixed(2)}</div>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                            <CardTitle className="text-xs font-medium">{t('customers.total_orders')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">{customer.total_orders}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Customer Details */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('customers.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('customers.name')}:</span>
                            <span className="font-medium">{customer.name}</span>
                        </div>
                        {customer.email && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('customers.email')}:</span>
                                <span className="font-medium">{customer.email}</span>
                            </div>
                        )}
                        {customer.phone && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('customers.phone')}:</span>
                                <span className="font-medium">{customer.phone}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Transactions */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('loyalty.transactions')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {transactions.data.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                {t('common.no_data')}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2 font-medium">{t('loyalty.points')}</th>
                                            <th className="text-left p-2 font-medium">{t('loyalty.type')}</th>
                                            <th className="text-left p-2 font-medium">{t('orders.order_number')}</th>
                                            <th className="text-left p-2 font-medium">{t('loyalty.description')}</th>
                                            <th className="text-left p-2 font-medium">{t('loyalty.date')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.data.map((transaction) => (
                                            <tr key={transaction.id} className="border-b hover:bg-muted/50">
                                                <td className="p-2">
                                                    <Badge variant={transaction.points > 0 ? 'default' : 'destructive'}>
                                                        {transaction.points > 0 ? (
                                                            <Plus className="mr-1 h-3 w-3" />
                                                        ) : (
                                                            <Minus className="mr-1 h-3 w-3" />
                                                        )}
                                                        {Math.abs(transaction.points)}
                                                    </Badge>
                                                </td>
                                                <td className="p-2">{getTransactionTypeLabel(transaction.type)}</td>
                                                <td className="p-2">
                                                    {transaction.order ? (
                                                        <Link href={`/orders/${transaction.order.id}`} className="text-primary hover:underline">
                                                            {transaction.order.order_number}
                                                        </Link>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="p-2">{transaction.description || '-'}</td>
                                                <td className="p-2">{new Date(transaction.created_at).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <Pagination links={transactions.links} />
                    </CardContent>
                </Card>

                {/* Adjust Points Dialog */}
                <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('loyalty.adjust_points')}</DialogTitle>
                            <DialogDescription>
                                {t('loyalty.adjust_points_description')}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAdjust}>
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="type">{t('loyalty.adjustment_type')}</Label>
                                    <Select
                                        value={data.type}
                                        onValueChange={(value: 'add' | 'subtract') => setData('type', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="add">{t('loyalty.add_points')}</SelectItem>
                                            <SelectItem value="subtract">{t('loyalty.subtract_points')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.type && (
                                        <p className="text-sm text-destructive mt-1">{errors.type}</p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="points">{t('loyalty.points')}</Label>
                                    <Input
                                        id="points"
                                        type="number"
                                        value={data.points}
                                        onChange={(e) => setData('points', parseInt(e.target.value) || 0)}
                                        min="1"
                                        required
                                    />
                                    {errors.points && (
                                        <p className="text-sm text-destructive mt-1">{errors.points}</p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="description">{t('loyalty.description')}</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-destructive mt-1">{errors.description}</p>
                                    )}
                                </div>
                            </div>
                            <DialogFooter className="mt-4">
                                <Button type="button" variant="outline" onClick={() => setShowAdjustDialog(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? t('common.loading') : t('common.save')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
