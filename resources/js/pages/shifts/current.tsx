import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Clock, DollarSign, ShoppingCart, X } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';
import { useState } from 'react';

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

interface CurrentShiftProps {
    shift: Shift;
}

export default function CurrentShift({ shift }: CurrentShiftProps) {
    const { t } = useTranslation();
    const [showCloseDialog, setShowCloseDialog] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        closing_cash: shift.expected_cash || shift.opening_cash,
        closing_notes: '',
    });

    const handleCloseShift = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/shifts/${shift.id}/close`, {
            preserveScroll: true,
            onSuccess: () => {
                setShowCloseDialog(false);
                router.visit('/shifts');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.shifts'), href: '/shifts' },
            { title: t('shifts.current_shift'), href: '/shifts/current' },
        ]}>
            <Head title={t('shifts.current_shift')} />
            <div className="flex h-full flex-1 flex-col gap-2 overflow-x-auto rounded-lg p-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">{t('shifts.current_shift')}</h1>
                        <p className="text-muted-foreground">{shift.shift_number}</p>
                    </div>
                    <div className="flex gap-2">
                        <Badge variant="default">{t('shifts.open')}</Badge>
                        <Button onClick={() => setShowCloseDialog(true)} variant="destructive">
                            <X className="mr-2 h-4 w-4" />
                            {t('shifts.close_shift')}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-2 md:grid-cols-3">
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                            <CardTitle className="text-xs font-medium">{t('shifts.total_sales')}</CardTitle>
                            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">{formatCurrency(shift.total_sales)}</div>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                            <CardTitle className="text-xs font-medium">{t('shifts.total_orders')}</CardTitle>
                            <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">{shift.total_orders}</div>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                            <CardTitle className="text-xs font-medium">{t('shifts.expected_cash')}</CardTitle>
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">{formatCurrency(shift.expected_cash || shift.opening_cash)}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('shifts.shift_details')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('shifts.shift_number')}:</span>
                            <span className="font-medium">{shift.shift_number}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('shifts.user')}:</span>
                            <span className="font-medium">{shift.user.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('shifts.opened_at')}:</span>
                            <span className="font-medium">{new Date(shift.opened_at).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('shifts.opening_cash')}:</span>
                            <span className="font-medium">{formatCurrency(shift.opening_cash)}</span>
                        </div>
                        {shift.expected_cash !== null && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('shifts.expected_cash')}:</span>
                                <span className="font-medium">{formatCurrency(shift.expected_cash)}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Close Shift Dialog */}
                <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('shifts.close_shift')}</DialogTitle>
                            <DialogDescription>
                                {t('shifts.close_shift_description')}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCloseShift}>
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="closing_cash">{t('shifts.closing_cash')}</Label>
                                    <Input
                                        id="closing_cash"
                                        type="number"
                                        step="0.01"
                                        value={data.closing_cash}
                                        onChange={(e) => setData('closing_cash', parseFloat(e.target.value) || 0)}
                                        required
                                    />
                                    {errors.closing_cash && (
                                        <p className="text-sm text-destructive mt-1">{errors.closing_cash}</p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="closing_notes">{t('shifts.closing_notes')}</Label>
                                    <Textarea
                                        id="closing_notes"
                                        value={data.closing_notes}
                                        onChange={(e) => setData('closing_notes', e.target.value)}
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <DialogFooter className="mt-4">
                                <Button type="button" variant="outline" onClick={() => setShowCloseDialog(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" variant="destructive" disabled={processing}>
                                    {processing ? t('common.loading') : t('shifts.close_shift')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
