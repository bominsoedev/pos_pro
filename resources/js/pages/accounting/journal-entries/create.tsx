import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface Account {
    id: number;
    code: string;
    name: string;
    type: string;
    display_name: string;
}

interface Props {
    accounts: Account[];
    entryNumber: string;
}

interface Line {
    account_id: number | null;
    description: string;
    debit: number;
    credit: number;
}

export default function CreateJournalEntry({ accounts, entryNumber }: Props) {
    const { t, currentLanguage } = useTranslation();
    
    const { data, setData, post, processing, errors } = useForm({
        entry_date: new Date().toISOString().split('T')[0],
        reference: '',
        description: '',
        lines: [
            { account_id: null, description: '', debit: 0, credit: 0 },
            { account_id: null, description: '', debit: 0, credit: 0 },
        ] as Line[],
    });

    const totalDebit = data.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = data.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
    const difference = totalDebit - totalCredit;

    const addLine = () => {
        setData('lines', [...data.lines, { account_id: null, description: '', debit: 0, credit: 0 }]);
    };

    const removeLine = (index: number) => {
        if (data.lines.length <= 2) return;
        const newLines = data.lines.filter((_, i) => i !== index);
        setData('lines', newLines);
    };

    const updateLine = (index: number, field: keyof Line, value: any) => {
        const newLines = [...data.lines];
        newLines[index] = { ...newLines[index], [field]: value };
        
        // Clear opposite field when entering a value
        if (field === 'debit' && value > 0) {
            newLines[index].credit = 0;
        } else if (field === 'credit' && value > 0) {
            newLines[index].debit = 0;
        }
        
        setData('lines', newLines);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isBalanced) {
            alert(t('accounting.entry_not_balanced'));
            return;
        }
        post('/accounting/journal-entries');
    };

    const groupedAccounts = accounts.reduce((groups, account) => {
        if (!groups[account.type]) {
            groups[account.type] = [];
        }
        groups[account.type].push(account);
        return groups;
    }, {} as Record<string, Account[]>);

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting'), href: '/accounting/accounts' },
            { title: t('accounting.journal_entries'), href: '/accounting/journal-entries' },
            { title: t('accounting.new_entry'), href: '/accounting/journal-entries/create' },
        ]}>
            <Head title={t('accounting.new_entry')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('accounting.new_entry')}</h1>
                        <p className="text-muted-foreground">{entryNumber}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70 mb-4">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label>{t('accounting.entry_date')} *</Label>
                                    <Input
                                        type="date"
                                        value={data.entry_date}
                                        onChange={(e) => setData('entry_date', e.target.value)}
                                        required
                                    />
                                    {errors.entry_date && <p className="text-sm text-destructive">{errors.entry_date}</p>}
                                </div>
                                <div>
                                    <Label>{t('accounting.reference')}</Label>
                                    <Input
                                        value={data.reference}
                                        onChange={(e) => setData('reference', e.target.value)}
                                        placeholder={t('accounting.reference_placeholder')}
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <Label>{t('common.description')} *</Label>
                                    <Textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        required
                                        rows={1}
                                    />
                                    {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Lines */}
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70 mb-4">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>{t('accounting.entry_lines')}</span>
                                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    {t('accounting.add_line')}
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2 px-2 w-1/3">{t('accounting.account')}</th>
                                            <th className="text-left py-2 px-2 w-1/3">{t('common.description')}</th>
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
                                                            {Object.entries(groupedAccounts).map(([type, accts]) => (
                                                                <div key={type}>
                                                                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                                                                        {type}
                                                                    </div>
                                                                    {accts.map((account) => (
                                                                        <SelectItem key={account.id} value={account.id.toString()}>
                                                                            {account.display_name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </div>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="py-2 px-2">
                                                    <Input
                                                        value={line.description}
                                                        onChange={(e) => updateLine(index, 'description', e.target.value)}
                                                        placeholder={t('common.description')}
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
                                                        placeholder="0.00"
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
                                                        placeholder="0.00"
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
                                        <tr className="font-semibold">
                                            <td colSpan={2} className="py-3 px-2 text-right">{t('common.total')}</td>
                                            <td className="py-3 px-2 text-right">
                                                {formatCurrency(totalDebit, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                {formatCurrency(totalCredit, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                            </td>
                                            <td></td>
                                        </tr>
                                        <tr>
                                            <td colSpan={2} className="py-2 px-2 text-right">{t('accounting.difference')}</td>
                                            <td colSpan={2} className="py-2 px-2 text-center">
                                                <div className={`flex items-center justify-center gap-2 ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                                                    {isBalanced ? (
                                                        <>
                                                            <CheckCircle className="h-4 w-4" />
                                                            {t('accounting.balanced')}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <AlertCircle className="h-4 w-4" />
                                                            {formatCurrency(Math.abs(difference), currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                                            {difference > 0 ? ` (${t('accounting.debit')})` : ` (${t('accounting.credit')})`}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            {errors.lines && <p className="text-sm text-destructive mt-2">{errors.lines}</p>}
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => router.visit('/accounting/journal-entries')}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" disabled={processing || !isBalanced}>
                            {t('accounting.save_entry')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
