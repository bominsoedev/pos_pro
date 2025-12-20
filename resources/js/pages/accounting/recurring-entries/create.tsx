import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface Account {
    id: number;
    code: string;
    name: string;
    type: string;
}

interface EntryLine {
    account_id: number | null;
    description: string;
    debit: number;
    credit: number;
}

interface Props {
    accounts: Account[];
    frequencies: Record<string, string>;
}

export default function CreateRecurringEntry({ accounts, frequencies }: Props) {
    const { t, currentLanguage } = useTranslation();
    const locale = currentLanguage === 'my' ? 'my-MM' : 'en-US';

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        frequency: 'monthly',
        day_of_week: null as number | null,
        day_of_month: null as number | null,
        month_of_year: null as number | null,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        max_occurrences: null as number | null,
        lines: [
            { account_id: null, description: '', debit: 0, credit: 0 },
            { account_id: null, description: '', debit: 0, credit: 0 },
        ] as EntryLine[],
    });

    const totalDebit = data.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = data.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    const addLine = () => {
        setData('lines', [...data.lines, { account_id: null, description: '', debit: 0, credit: 0 }]);
    };

    const removeLine = (index: number) => {
        if (data.lines.length > 2) {
            setData('lines', data.lines.filter((_, i) => i !== index));
        }
    };

    const updateLine = (index: number, field: keyof EntryLine, value: any) => {
        const newLines = [...data.lines];
        newLines[index] = { ...newLines[index], [field]: value };
        setData('lines', newLines);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/accounting/recurring-entries');
    };

    const daysOfWeek = [
        { value: 0, label: t('common.sunday') },
        { value: 1, label: t('common.monday') },
        { value: 2, label: t('common.tuesday') },
        { value: 3, label: t('common.wednesday') },
        { value: 4, label: t('common.thursday') },
        { value: 5, label: t('common.friday') },
        { value: 6, label: t('common.saturday') },
    ];

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting'), href: '/accounting/dashboard' },
            { title: t('accounting.recurring_entries'), href: '/accounting/recurring-entries' },
            { title: t('common.create'), href: '/accounting/recurring-entries/create' },
        ]}>
            <Head title={t('accounting.new_recurring')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/accounting/recurring-entries">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <RefreshCw className="h-6 w-6" />
                            {t('accounting.new_recurring')}
                        </h1>
                        <p className="text-muted-foreground">{t('accounting.recurring_create_desc')}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('accounting.template_info')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>{t('common.name')} *</Label>
                                    <Input
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder={t('accounting.recurring_name_placeholder')}
                                        required
                                    />
                                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                </div>
                                <div>
                                    <Label>{t('accounting.frequency')} *</Label>
                                    <Select value={data.frequency} onValueChange={(v) => setData('frequency', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(frequencies).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Frequency-specific options */}
                            {data.frequency === 'weekly' && (
                                <div>
                                    <Label>{t('accounting.day_of_week')}</Label>
                                    <Select
                                        value={data.day_of_week?.toString() || ''}
                                        onValueChange={(v) => setData('day_of_week', parseInt(v))}
                                    >
                                        <SelectTrigger className="w-48">
                                            <SelectValue placeholder={t('common.select')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {daysOfWeek.map((day) => (
                                                <SelectItem key={day.value} value={day.value.toString()}>
                                                    {day.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {(data.frequency === 'monthly' || data.frequency === 'quarterly') && (
                                <div>
                                    <Label>{t('accounting.day_of_month')}</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={31}
                                        value={data.day_of_month || ''}
                                        onChange={(e) => setData('day_of_month', parseInt(e.target.value) || null)}
                                        className="w-24"
                                        placeholder="1-31"
                                    />
                                </div>
                            )}

                            <div>
                                <Label>{t('common.description')}</Label>
                                <Textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={2}
                                    placeholder={t('accounting.recurring_desc_placeholder')}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label>{t('accounting.start_date')} *</Label>
                                    <Input
                                        type="date"
                                        value={data.start_date}
                                        onChange={(e) => setData('start_date', e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>{t('accounting.end_date')}</Label>
                                    <Input
                                        type="date"
                                        value={data.end_date}
                                        onChange={(e) => setData('end_date', e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">{t('accounting.end_date_help')}</p>
                                </div>
                                <div>
                                    <Label>{t('accounting.max_occurrences')}</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={data.max_occurrences || ''}
                                        onChange={(e) => setData('max_occurrences', parseInt(e.target.value) || null)}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">{t('accounting.max_occurrences_help')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Entry Lines */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{t('accounting.entry_lines')}</CardTitle>
                            <div className="flex items-center gap-4">
                                <Badge variant={isBalanced ? 'default' : 'destructive'}>
                                    {isBalanced ? t('accounting.balanced') : t('accounting.not_balanced')}
                                </Badge>
                                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    {t('accounting.add_line')}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2 px-2">{t('accounting.account')}</th>
                                        <th className="text-left py-2 px-2">{t('common.description')}</th>
                                        <th className="text-right py-2 px-2 w-32">{t('accounting.debit')}</th>
                                        <th className="text-right py-2 px-2 w-32">{t('accounting.credit')}</th>
                                        <th className="w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.lines.map((line, index) => (
                                        <tr key={index} className="border-b">
                                            <td className="py-2 px-2">
                                                <Select
                                                    value={line.account_id?.toString() || ''}
                                                    onValueChange={(v) => updateLine(index, 'account_id', parseInt(v))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={t('accounting.select_account')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {accounts.map((acc) => (
                                                            <SelectItem key={acc.id} value={acc.id.toString()}>
                                                                {acc.code} - {acc.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <td className="py-2 px-2">
                                                <Input
                                                    value={line.description}
                                                    onChange={(e) => updateLine(index, 'description', e.target.value)}
                                                    placeholder={t('common.optional')}
                                                />
                                            </td>
                                            <td className="py-2 px-2">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={line.debit || ''}
                                                    onChange={(e) => updateLine(index, 'debit', parseFloat(e.target.value) || 0)}
                                                    className="text-right"
                                                />
                                            </td>
                                            <td className="py-2 px-2">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={line.credit || ''}
                                                    onChange={(e) => updateLine(index, 'credit', parseFloat(e.target.value) || 0)}
                                                    className="text-right"
                                                />
                                            </td>
                                            <td className="py-2 px-2">
                                                {data.lines.length > 2 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeLine(index)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="font-bold">
                                        <td colSpan={2} className="py-3 px-2 text-right">{t('common.total')}</td>
                                        <td className="py-3 px-2 text-right">{formatCurrency(totalDebit, locale)}</td>
                                        <td className="py-3 px-2 text-right">{formatCurrency(totalCredit, locale)}</td>
                                        <td></td>
                                    </tr>
                                    {!isBalanced && (
                                        <tr className="text-destructive">
                                            <td colSpan={2} className="py-2 px-2 text-right">{t('accounting.difference')}</td>
                                            <td colSpan={2} className="py-2 px-2 text-center">
                                                {formatCurrency(Math.abs(totalDebit - totalCredit), locale)}
                                            </td>
                                            <td></td>
                                        </tr>
                                    )}
                                </tfoot>
                            </table>
                            {errors.lines && <p className="text-sm text-destructive mt-2">{errors.lines}</p>}
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end gap-4">
                        <Button variant="outline" asChild>
                            <Link href="/accounting/recurring-entries">{t('common.cancel')}</Link>
                        </Button>
                        <Button type="submit" disabled={processing || !isBalanced}>
                            {t('common.create')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
