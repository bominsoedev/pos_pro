import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import Pagination from '@/components/pagination';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface Account {
    id: number;
    code: string;
    name: string;
    name_mm: string | null;
    description: string | null;
    type: string;
    subtype: string;
    parent?: Account;
    children?: Account[];
    opening_balance: number;
    is_system: boolean;
    is_active: boolean;
}

interface LedgerEntry {
    id: number;
    journal_entry: {
        id: number;
        entry_number: string;
        entry_date: string;
        description: string;
    };
    description: string | null;
    debit: number;
    credit: number;
}

interface Props {
    account: Account;
    ledgerEntries: {
        data: LedgerEntry[];
        links: any;
    };
    balance: number;
}

export default function ShowAccount({ account, ledgerEntries, balance }: Props) {
    const { t, currentLanguage } = useTranslation();

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            asset: 'bg-blue-100 text-blue-800',
            liability: 'bg-red-100 text-red-800',
            equity: 'bg-purple-100 text-purple-800',
            income: 'bg-green-100 text-green-800',
            expense: 'bg-orange-100 text-orange-800',
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting'), href: '/accounting/accounts' },
            { title: t('accounting.chart_of_accounts'), href: '/accounting/accounts' },
            { title: account.code, href: `/accounting/accounts/${account.id}` },
        ]}>
            <Head title={account.name} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/accounting/accounts">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <BookOpen className="h-6 w-6" />
                                <span className="font-mono">{account.code}</span>
                                <span>{currentLanguage === 'my' && account.name_mm ? account.name_mm : account.name}</span>
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge className={getTypeColor(account.type)}>{account.type}</Badge>
                                <span className="text-muted-foreground">{account.subtype?.replace(/_/g, ' ')}</span>
                                {account.is_system && <Badge variant="outline">{t('accounting.system')}</Badge>}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-muted-foreground">{t('accounting.balance')}</div>
                        <div className="text-2xl font-bold">
                            {formatCurrency(balance, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                        </div>
                    </div>
                </div>

                {/* Account Details */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('common.details')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <div className="text-sm text-muted-foreground">{t('accounting.opening_balance')}</div>
                                <div className="font-medium">
                                    {formatCurrency(account.opening_balance, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                </div>
                            </div>
                            {account.parent && (
                                <div>
                                    <div className="text-sm text-muted-foreground">{t('accounting.parent_account')}</div>
                                    <Link href={`/accounting/accounts/${account.parent.id}`} className="font-medium hover:underline">
                                        {account.parent.code} - {account.parent.name}
                                    </Link>
                                </div>
                            )}
                            {account.description && (
                                <div className="col-span-2">
                                    <div className="text-sm text-muted-foreground">{t('common.description')}</div>
                                    <div className="font-medium">{account.description}</div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Ledger Entries */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('accounting.journal_entries')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-2">{t('common.date')}</th>
                                    <th className="text-left py-3 px-2">{t('accounting.entry_number')}</th>
                                    <th className="text-left py-3 px-2">{t('common.description')}</th>
                                    <th className="text-right py-3 px-2 w-32">{t('accounting.debit')}</th>
                                    <th className="text-right py-3 px-2 w-32">{t('accounting.credit')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ledgerEntries.data.map((entry) => (
                                    <tr key={entry.id} className="border-b hover:bg-muted/30">
                                        <td className="py-3 px-2">
                                            {new Date(entry.journal_entry.entry_date).toLocaleDateString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                        </td>
                                        <td className="py-3 px-2">
                                            <Link href={`/accounting/journal-entries/${entry.journal_entry.id}`} className="text-primary hover:underline">
                                                {entry.journal_entry.entry_number}
                                            </Link>
                                        </td>
                                        <td className="py-3 px-2">{entry.description || entry.journal_entry.description}</td>
                                        <td className="py-3 px-2 text-right">
                                            {entry.debit > 0 ? formatCurrency(entry.debit, currentLanguage === 'my' ? 'my-MM' : 'en-US') : ''}
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            {entry.credit > 0 ? formatCurrency(entry.credit, currentLanguage === 'my' ? 'my-MM' : 'en-US') : ''}
                                        </td>
                                    </tr>
                                ))}
                                {ledgerEntries.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-muted-foreground">
                                            {t('accounting.no_transactions')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                <Pagination links={ledgerEntries.links} />
            </div>
        </AppLayout>
    );
}
