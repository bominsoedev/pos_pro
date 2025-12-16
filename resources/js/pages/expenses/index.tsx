import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Search, Edit, Trash2, ReceiptText, Calendar, DollarSign } from 'lucide-react';
import { Label } from '@/components/ui/label';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';
import { useDebounce } from '@/hooks/use-debounce';

interface Expense {
    id: number;
    expense_number: string;
    category: string;
    title: string;
    description: string | null;
    amount: number;
    expense_date: string;
    payment_method: string;
    reference_number: string | null;
    receipt: string | null;
    is_recurring: boolean;
    recurring_frequency: string | null;
    notes: string | null;
    user: { name: string };
}

interface ExpensesPageProps {
    expenses: {
        data: Expense[];
        links: any;
    };
    categories: string[];
    filters: {
        search?: string;
        category?: string;
        date_from?: string;
        date_to?: string;
    };
}

export default function ExpensesIndex({ expenses, categories, filters }: ExpensesPageProps) {
    const { t } = useTranslation();
    const [showDialog, setShowDialog] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [searchInput, setSearchInput] = useState(filters.search || '');
    const debouncedSearch = useDebounce(searchInput, 500);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        category: '',
        title: '',
        description: '',
        amount: 0,
        expense_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        reference_number: '',
        receipt: '',
        is_recurring: false,
        recurring_frequency: null as string | null,
        notes: '',
    });

    // Debounced search effect
    useEffect(() => {
        if (debouncedSearch !== filters.search) {
            router.get('/expenses', {
                search: debouncedSearch || undefined,
                category: filters.category,
                date_from: filters.date_from,
                date_to: filters.date_to,
            }, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    }, [debouncedSearch, filters.category, filters.date_from, filters.date_to]);

    const openDialog = (expense?: Expense) => {
        if (expense) {
            setEditingExpense(expense);
            setData({
                category: expense.category,
                title: expense.title,
                description: expense.description || '',
                amount: expense.amount,
                expense_date: expense.expense_date,
                payment_method: expense.payment_method,
                reference_number: expense.reference_number || '',
                receipt: expense.receipt || '',
                is_recurring: expense.is_recurring,
                recurring_frequency: expense.recurring_frequency,
                notes: expense.notes || '',
            });
        } else {
            setEditingExpense(null);
            reset();
        }
        setShowDialog(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingExpense) {
            put(`/expenses/${editingExpense.id}`, {
                onSuccess: () => {
                    setShowDialog(false);
                    reset();
                },
            });
        } else {
            post('/expenses', {
                onSuccess: () => {
                    setShowDialog(false);
                    reset();
                },
            });
        }
    };

    const getPaymentMethodLabel = (method: string) => {
        const methods: Record<string, string> = {
            cash: t('pos.payment_method_cash'),
            card: t('pos.payment_method_card'),
            bank_transfer: t('pos.payment_method_bank'),
            other: t('pos.payment_method_other'),
        };
        return methods[method] || method;
    };

    return (
        <AppLayout breadcrumbs={[{ title: t('nav.expenses'), href: '/expenses' }]}>
            <Head title={t('expenses.title')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('expenses.title')}</h1>
                        <p className="text-muted-foreground">{t('expenses.title')}</p>
                    </div>
                    <Button onClick={() => openDialog()} className="backdrop-blur-sm bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('expenses.add_expense')}
                    </Button>
                </div>

                {/* Filters */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={t('common.search')}
                                    className="pl-10"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                />
                            </div>
                            <Select
                                value={filters.category || 'all'}
                                onValueChange={(value) => {
                                    router.get('/expenses', {
                                        ...filters,
                                        category: value === 'all' ? undefined : value,
                                    }, {
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('expenses.category')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('common.all')}</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                type="date"
                                value={filters.date_from || ''}
                                onChange={(e) => {
                                    router.get('/expenses', {
                                        ...filters,
                                        date_from: e.target.value || undefined,
                                    }, {
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                }}
                                placeholder={t('common.from')}
                            />
                            <Input
                                type="date"
                                value={filters.date_to || ''}
                                onChange={(e) => {
                                    router.get('/expenses', {
                                        ...filters,
                                        date_to: e.target.value || undefined,
                                    }, {
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                }}
                                placeholder={t('common.to')}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Expenses List */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {expenses.data.map((expense) => (
                                <div
                                    key={expense.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <ReceiptText className="h-5 w-5 text-muted-foreground" />
                                            <h3 className="font-semibold">{expense.title}</h3>
                                            <Badge variant="outline">{expense.category}</Badge>
                                            {expense.is_recurring && (
                                                <Badge variant="secondary">{expense.recurring_frequency}</Badge>
                                            )}
                                        </div>
                                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4" />
                                                <span className="font-semibold text-primary">{formatCurrency(expense.amount)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                {new Date(expense.expense_date).toLocaleDateString()}
                                            </div>
                                            <div>{getPaymentMethodLabel(expense.payment_method)}</div>
                                            {expense.description && (
                                                <p className="text-sm">{expense.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openDialog(expense)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                if (confirm(t('common.delete') + '?')) {
                                                    router.delete(`/expenses/${expense.id}`);
                                                }
                                            }}
                                            className="text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {expenses.data.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    {t('expenses.no_expenses')}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Pagination links={expenses.links} />

                {/* Dialog */}
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingExpense ? t('expenses.edit_expense') : t('expenses.add_expense')}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>{t('expenses.category')} *</Label>
                                        <Input
                                            value={data.category}
                                            onChange={(e) => setData('category', e.target.value)}
                                            required
                                        />
                                        {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                                    </div>
                                    <div>
                                        <Label>{t('expenses.title')} *</Label>
                                        <Input
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            required
                                        />
                                        {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                                    </div>
                                </div>
                                <div>
                                    <Label>{t('expenses.description')}</Label>
                                    <Textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={2}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>{t('expenses.amount')} *</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.amount}
                                            onChange={(e) => setData('amount', parseFloat(e.target.value) || 0)}
                                            required
                                        />
                                        {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
                                    </div>
                                    <div>
                                        <Label>{t('expenses.expense_date')} *</Label>
                                        <Input
                                            type="date"
                                            value={data.expense_date}
                                            onChange={(e) => setData('expense_date', e.target.value)}
                                            required
                                        />
                                        {errors.expense_date && <p className="text-sm text-destructive">{errors.expense_date}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>{t('expenses.payment_method')} *</Label>
                                        <Select
                                            value={data.payment_method}
                                            onValueChange={(value) => setData('payment_method', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cash">{t('pos.payment_method_cash')}</SelectItem>
                                                <SelectItem value="card">{t('pos.payment_method_card')}</SelectItem>
                                                <SelectItem value="bank_transfer">{t('pos.payment_method_bank')}</SelectItem>
                                                <SelectItem value="other">{t('pos.payment_method_other')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>{t('expenses.reference_number')}</Label>
                                        <Input
                                            value={data.reference_number}
                                            onChange={(e) => setData('reference_number', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label>{t('expenses.receipt')}</Label>
                                    <Input
                                        value={data.receipt}
                                        onChange={(e) => setData('receipt', e.target.value)}
                                        placeholder="Receipt URL or path"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={data.is_recurring}
                                        onChange={(e) => setData('is_recurring', e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <Label>{t('expenses.is_recurring')}</Label>
                                </div>
                                {data.is_recurring && (
                                    <div>
                                        <Label>{t('expenses.recurring_frequency')}</Label>
                                        <Select
                                            value={data.recurring_frequency || ''}
                                            onValueChange={(value) => setData('recurring_frequency', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select frequency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="daily">Daily</SelectItem>
                                                <SelectItem value="weekly">Weekly</SelectItem>
                                                <SelectItem value="monthly">Monthly</SelectItem>
                                                <SelectItem value="yearly">Yearly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <div>
                                    <Label>{t('expenses.notes')}</Label>
                                    <Textarea
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <DialogFooter className="mt-4">
                                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {editingExpense ? t('common.update') : t('common.create')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

