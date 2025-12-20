import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, router, Link } from '@inertiajs/react';
import { CheckCircle, XCircle, RotateCcw, ArrowLeft, Printer } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface Account {
    id: number;
    code: string;
    name: string;
    name_mm: string | null;
}

interface JournalEntryLine {
    id: number;
    account: Account;
    description: string | null;
    debit: number;
    credit: number;
}

interface JournalEntry {
    id: number;
    entry_number: string;
    entry_date: string;
    reference: string | null;
    description: string;
    status: 'draft' | 'posted' | 'void';
    source: string;
    total_debit: number;
    total_credit: number;
    created_by: { name: string } | null;
    posted_by: { name: string } | null;
    posted_at: string | null;
    voided_by: { name: string } | null;
    voided_at: string | null;
    void_reason: string | null;
    lines: JournalEntryLine[];
    created_at: string;
}

interface Props {
    entry: JournalEntry;
}

export default function ShowJournalEntry({ entry }: Props) {
    const { t, currentLanguage } = useTranslation();
    const [showVoidDialog, setShowVoidDialog] = useState(false);
    const [voidReason, setVoidReason] = useState('');

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'posted': return 'bg-green-100 text-green-800';
            case 'draft': return 'bg-yellow-100 text-yellow-800';
            case 'void': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handlePost = () => {
        if (confirm(t('accounting.confirm_post'))) {
            router.post(`/accounting/journal-entries/${entry.id}/post`);
        }
    };

    const handleVoid = () => {
        router.post(`/accounting/journal-entries/${entry.id}/void`, { reason: voidReason }, {
            onSuccess: () => {
                setShowVoidDialog(false);
                setVoidReason('');
            },
        });
    };

    const handleReverse = () => {
        if (confirm(t('accounting.confirm_reverse'))) {
            router.post(`/accounting/journal-entries/${entry.id}/reverse`);
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting'), href: '/accounting/accounts' },
            { title: t('accounting.journal_entries'), href: '/accounting/journal-entries' },
            { title: entry.entry_number, href: `/accounting/journal-entries/${entry.id}` },
        ]}>
            <Head title={entry.entry_number} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between print:hidden">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/accounting/journal-entries">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                {entry.entry_number}
                                <Badge className={getStatusColor(entry.status)}>
                                    {t(`accounting.${entry.status}`)}
                                </Badge>
                            </h1>
                            <p className="text-muted-foreground">{entry.description}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="h-4 w-4 mr-2" />
                            {t('common.print')}
                        </Button>
                        {entry.status === 'draft' && (
                            <Button onClick={handlePost} className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {t('accounting.post_entry')}
                            </Button>
                        )}
                        {entry.status === 'posted' && (
                            <>
                                <Button variant="outline" onClick={() => setShowVoidDialog(true)} className="text-red-600">
                                    <XCircle className="h-4 w-4 mr-2" />
                                    {t('accounting.void_entry')}
                                </Button>
                                <Button variant="outline" onClick={handleReverse}>
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    {t('accounting.reverse_entry')}
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Entry Details */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('accounting.entry_details')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <Label className="text-muted-foreground">{t('accounting.entry_date')}</Label>
                                <p className="font-medium">
                                    {new Date(entry.entry_date).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                </p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">{t('accounting.reference')}</Label>
                                <p className="font-medium">{entry.reference || '-'}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">{t('accounting.source')}</Label>
                                <p className="font-medium capitalize">{entry.source}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">{t('common.created_by')}</Label>
                                <p className="font-medium">{entry.created_by?.name || '-'}</p>
                            </div>
                            {entry.posted_at && (
                                <>
                                    <div>
                                        <Label className="text-muted-foreground">{t('accounting.posted_at')}</Label>
                                        <p className="font-medium">
                                            {new Date(entry.posted_at).toLocaleString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">{t('accounting.posted_by')}</Label>
                                        <p className="font-medium">{entry.posted_by?.name || '-'}</p>
                                    </div>
                                </>
                            )}
                            {entry.voided_at && (
                                <>
                                    <div>
                                        <Label className="text-muted-foreground">{t('accounting.voided_at')}</Label>
                                        <p className="font-medium">
                                            {new Date(entry.voided_at).toLocaleString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">{t('accounting.void_reason')}</Label>
                                        <p className="font-medium text-red-600">{entry.void_reason}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Entry Lines */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('accounting.entry_lines')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-2">{t('accounting.account')}</th>
                                    <th className="text-left py-3 px-2">{t('common.description')}</th>
                                    <th className="text-right py-3 px-2 w-40">{t('accounting.debit')}</th>
                                    <th className="text-right py-3 px-2 w-40">{t('accounting.credit')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entry.lines.map((line) => (
                                    <tr key={line.id} className="border-b">
                                        <td className={`py-3 px-2 ${line.credit > 0 ? 'pl-8' : ''}`}>
                                            <Link href={`/accounting/accounts/${line.account.id}`} className="hover:underline">
                                                <span className="font-mono text-sm text-muted-foreground mr-2">
                                                    {line.account.code}
                                                </span>
                                                {currentLanguage === 'my' && line.account.name_mm ? line.account.name_mm : line.account.name}
                                            </Link>
                                        </td>
                                        <td className="py-3 px-2 text-muted-foreground">
                                            {line.description || '-'}
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            {line.debit > 0 ? formatCurrency(line.debit, currentLanguage === 'my' ? 'my-MM' : 'en-US') : ''}
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            {line.credit > 0 ? formatCurrency(line.credit, currentLanguage === 'my' ? 'my-MM' : 'en-US') : ''}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="font-bold text-lg">
                                    <td colSpan={2} className="py-4 px-2 text-right">{t('common.total')}</td>
                                    <td className="py-4 px-2 text-right border-t-2">
                                        {formatCurrency(entry.total_debit, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                    </td>
                                    <td className="py-4 px-2 text-right border-t-2">
                                        {formatCurrency(entry.total_credit, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </CardContent>
                </Card>

                {/* Void Dialog */}
                <Dialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('accounting.void_entry')}</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <Label>{t('accounting.void_reason')} *</Label>
                            <Textarea
                                value={voidReason}
                                onChange={(e) => setVoidReason(e.target.value)}
                                placeholder={t('accounting.void_reason_placeholder')}
                                rows={3}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowVoidDialog(false)}>
                                {t('common.cancel')}
                            </Button>
                            <Button variant="destructive" onClick={handleVoid} disabled={!voidReason.trim()}>
                                {t('accounting.void_entry')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
