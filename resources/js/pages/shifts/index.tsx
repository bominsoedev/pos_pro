import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, Link, router } from '@inertiajs/react';
import { Plus, Clock, DollarSign, ShoppingCart, X, CheckCircle2, Eye } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/currency';
import Pagination from '@/components/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectTrigger as SelectTriggerAlias } from '@/components/ui/select';
import { useTranslation } from '@/hooks/use-translation';

interface Shift {
    id: number;
    shift_number: string;
    status: string;
    opened_at: string;
    closed_at: string | null;
    opening_cash: number;
    closing_cash: number | null;
    expected_cash: number | null;
    cash_difference: number | null;
    total_sales: number;
    total_orders: number;
    user: {
        name: string;
    };
}

interface ShiftsPageProps {
    shifts: {
        data: Shift[];
        links: any;
    };
    currentShift: Shift | null;
    filters: {
        status?: string;
        user_id?: number;
        date_from?: string;
        date_to?: string;
    };
}

export default function ShiftsIndex({ shifts, currentShift, filters }: ShiftsPageProps) {
    const { t, currentLanguage } = useTranslation();
    const [showOpenDialog, setShowOpenDialog] = useState(false);
    const [showCloseDialog, setShowCloseDialog] = useState(false);

    const { data: openData, setData: setOpenData, post: postOpen, processing: opening } = useForm({
        opening_cash: 0,
        opening_notes: '',
    });

    const { data: closeData, setData: setCloseData, post: postClose, processing: closing } = useForm({
        closing_cash: 0,
        closing_notes: '',
    });

    const handleOpenShift = (e: React.FormEvent) => {
        e.preventDefault();
        postOpen('/shifts', {
            onSuccess: () => {
                setShowOpenDialog(false);
                setOpenData({ opening_cash: 0, opening_notes: '' });
            },
        });
    };

    const handleCloseShift = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentShift) return;
        postClose(`/shifts/${currentShift.id}/close`, {
            onSuccess: () => {
                setShowCloseDialog(false);
                setCloseData({ closing_cash: 0, closing_notes: '' });
            },
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: t('shifts.title'), href: '/shifts' }]}>
            <Head title={t('shifts.title')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('shifts.title')}</h1>
                        <p className="text-muted-foreground">{t('shifts.title')}</p>
                    </div>
                    <div className="flex gap-2">
                        {currentShift ? (
                            <>
                                <Button
                                    variant="outline"
                                    asChild
                                >
                                    <Link href={`/shifts/${currentShift.id}`}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        {t('shifts.view_shift')}
                                    </Link>
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => setShowCloseDialog(true)}
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    {t('shifts.close_shift')}
                                </Button>
                            </>
                        ) : (
                            <Button onClick={() => setShowOpenDialog(true)} className="backdrop-blur-sm bg-primary/90">
                                <Plus className="mr-2 h-4 w-4" />
                                {t('shifts.open_shift')}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Current Shift Card */}
                {currentShift && (
                    <Card className="backdrop-blur-sm bg-primary/10 border-primary/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                {t('shifts.current_shift')}: {currentShift.shift_number}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('shifts.opening_cash')}</p>
                                    <p className="text-lg font-bold">{formatCurrency(currentShift.opening_cash, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('reports.total_sales')}</p>
                                    <p className="text-lg font-bold">{formatCurrency(currentShift.total_sales, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('reports.total_orders')}</p>
                                    <p className="text-lg font-bold">{currentShift.total_orders}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('shifts.opened_at')}</p>
                                    <p className="text-sm font-medium">
                                        {new Date(currentShift.opened_at).toLocaleString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Filters */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(value) => {
                                    router.get('/shifts', { ...filters, status: value === 'all' ? null : value }, {
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('shifts.status')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('common.all')}</SelectItem>
                                    <SelectItem value="open">{t('shifts.open')}</SelectItem>
                                    <SelectItem value="closed">{t('shifts.closed')}</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                type="date"
                                placeholder={t('orders.from_date')}
                                value={filters.date_from || ''}
                                onChange={(e) => {
                                    router.get('/shifts', { ...filters, date_from: e.target.value }, {
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                }}
                            />
                            <Input
                                type="date"
                                placeholder={t('orders.to_date')}
                                value={filters.date_to || ''}
                                onChange={(e) => {
                                    router.get('/shifts', { ...filters, date_to: e.target.value }, {
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                }}
                            />
                            <Button
                                variant="outline"
                                onClick={() => router.get('/shifts')}
                            >
                                {t('common.clear_filters')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Shifts List */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('shifts.shift_history')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">{t('shifts.shift_number')}</th>
                                        <th className="text-left p-2">{t('shifts.cashier')}</th>
                                        <th className="text-left p-2">{t('shifts.status')}</th>
                                        <th className="text-left p-2">{t('shifts.opened_at')}</th>
                                        <th className="text-left p-2">{t('shifts.closed_at')}</th>
                                        <th className="text-right p-2">{t('reports.sales')}</th>
                                        <th className="text-right p-2">{t('reports.orders')}</th>
                                        <th className="text-right p-2">{t('shifts.cash_difference')}</th>
                                        <th className="text-right p-2">{t('backup.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shifts.data.map((shift) => (
                                        <tr key={shift.id} className="border-b hover:bg-muted/50">
                                            <td className="p-2 font-medium">{shift.shift_number}</td>
                                            <td className="p-2">{shift.user.name}</td>
                                            <td className="p-2">
                                                <Badge variant={shift.status === 'open' ? 'default' : 'secondary'}>
                                                    {shift.status === 'open' ? t('shifts.open') : t('shifts.closed')}
                                                </Badge>
                                            </td>
                                            <td className="p-2 text-sm">
                                                {new Date(shift.opened_at).toLocaleString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                            </td>
                                            <td className="p-2 text-sm">
                                                {shift.closed_at ? new Date(shift.closed_at).toLocaleString(currentLanguage === 'my' ? 'my-MM' : 'en-US') : '-'}
                                            </td>
                                            <td className="p-2 text-right font-medium">
                                                {formatCurrency(shift.total_sales, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                            </td>
                                            <td className="p-2 text-right">{shift.total_orders}</td>
                                            <td className="p-2 text-right">
                                                {shift.cash_difference !== null ? (
                                                    <span className={shift.cash_difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                        {shift.cash_difference >= 0 ? '+' : ''}{formatCurrency(shift.cash_difference, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                                    </span>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td className="p-2 text-right">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/shifts/${shift.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {shifts.data.length === 0 && (
                            <p className="text-center text-muted-foreground py-8">{t('common.no_data')}</p>
                        )}
                    </CardContent>
                </Card>

                {shifts.links && <Pagination links={shifts.links} />}

                {/* Open Shift Dialog */}
                <Dialog open={showOpenDialog} onOpenChange={setShowOpenDialog}>
                    <DialogContent className="backdrop-blur-sm bg-background/95">
                        <DialogHeader>
                            <DialogTitle>{t('shifts.open_shift')}</DialogTitle>
                            <DialogDescription>
                                {t('shifts.enter_opening_cash')}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleOpenShift} className="space-y-4">
                            <div>
                                <Label>{t('shifts.opening_cash')} *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={openData.opening_cash}
                                    onChange={(e) => setOpenData('opening_cash', parseFloat(e.target.value) || 0)}
                                    required
                                />
                            </div>
                            <div>
                                <Label>{t('shifts.opening_notes')} ({t('common.optional')})</Label>
                                <Textarea
                                    value={openData.opening_notes}
                                    onChange={(e) => setOpenData('opening_notes', e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowOpenDialog(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" disabled={opening}>
                                    {t('shifts.open_shift')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Close Shift Dialog */}
                <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
                    <DialogContent className="backdrop-blur-sm bg-background/95">
                        <DialogHeader>
                            <DialogTitle>{t('shifts.close_shift')}</DialogTitle>
                            <DialogDescription>
                                {t('shifts.enter_closing_cash')}
                            </DialogDescription>
                        </DialogHeader>
                        {currentShift && (
                            <form onSubmit={handleCloseShift} className="space-y-4">
                                <div className="p-4 bg-muted rounded-lg space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">{t('shifts.opening_cash')}:</span>
                                        <span className="font-medium">{formatCurrency(currentShift.opening_cash, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">{t('reports.total_sales')}:</span>
                                        <span className="font-medium">{formatCurrency(currentShift.total_sales, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2">
                                        <span className="text-sm font-medium">{t('shifts.expected_cash')}:</span>
                                        <span className="font-bold">
                                            {formatCurrency((currentShift.expected_cash || currentShift.opening_cash + currentShift.total_sales), currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <Label>{t('shifts.closing_cash')} *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={closeData.closing_cash}
                                        onChange={(e) => setCloseData('closing_cash', parseFloat(e.target.value) || 0)}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>{t('shifts.closing_notes')} ({t('common.optional')})</Label>
                                    <Textarea
                                        value={closeData.closing_notes}
                                        onChange={(e) => setCloseData('closing_notes', e.target.value)}
                                        rows={3}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setShowCloseDialog(false)}>
                                        {t('common.cancel')}
                                    </Button>
                                    <Button type="submit" variant="destructive" disabled={closing}>
                                        {t('shifts.close_shift')}
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

