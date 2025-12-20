import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { FileText, Printer, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';
import { useState } from 'react';

interface Supplier {
    id: number;
    name: string;
}

interface Transaction {
    date: string;
    type: string;
    reference: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
}

interface Statement {
    openingBalance: number;
    transactions: Transaction[];
    totalDebits: number;
    totalCredits: number;
    closingBalance: number;
}

interface Props {
    suppliers: Supplier[];
    supplier: Supplier | null;
    statement: Statement | null;
    filters: {
        supplier_id: number | null;
        start_date: string;
        end_date: string;
    };
}

export default function SupplierStatement({ suppliers, supplier, statement, filters }: Props) {
    const { t, currentLanguage } = useTranslation();
    const locale = currentLanguage === 'my' ? 'my-MM' : 'en-US';
    
    const [supplierId, setSupplierId] = useState(filters.supplier_id?.toString() || '');
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);

    const handleGenerate = () => {
        router.get('/accounting/statements/supplier', {
            supplier_id: supplierId,
            start_date: startDate,
            end_date: endDate,
        }, { preserveState: true });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting'), href: '/accounting/dashboard' },
            { title: t('accounting.statements'), href: '/accounting/statements/supplier' },
            { title: t('accounting.supplier_statement'), href: '/accounting/statements/supplier' },
        ]}>
            <Head title={t('accounting.supplier_statement')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <FileText className="h-6 w-6" />
                            {t('accounting.supplier_statement')}
                        </h1>
                        <p className="text-muted-foreground">{t('accounting.supplier_statement_desc')}</p>
                    </div>
                    {statement && (
                        <Button variant="outline" onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-2" />
                            {t('common.print')}
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70 print:hidden">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <Label>{t('suppliers.supplier')}</Label>
                                <Select value={supplierId} onValueChange={setSupplierId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('common.select')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map((s) => (
                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>{t('common.from')}</Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>{t('common.to')}</Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                            <div className="flex items-end">
                                <Button onClick={handleGenerate} className="w-full">
                                    {t('accounting.generate_statement')}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Statement */}
                {statement && supplier && (
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader className="print:pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl">{t('accounting.statement_of_account')}</CardTitle>
                                    <p className="text-lg font-bold mt-2">{supplier.name}</p>
                                </div>
                                <div className="text-right text-sm">
                                    <p>{t('accounting.period')}: {new Date(startDate).toLocaleDateString(locale)} - {new Date(endDate).toLocaleDateString(locale)}</p>
                                    <p className="text-muted-foreground">{t('accounting.generated_on')}: {new Date().toLocaleDateString(locale)}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Opening Balance */}
                            <div className="flex justify-between py-2 border-b font-medium bg-muted/30 px-2 rounded-t">
                                <span>{t('accounting.opening_balance')}</span>
                                <span>{formatCurrency(statement.openingBalance, locale)}</span>
                            </div>

                            {/* Transactions */}
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2 px-2">{t('common.date')}</th>
                                        <th className="text-left py-2 px-2">{t('common.type')}</th>
                                        <th className="text-left py-2 px-2">{t('accounting.reference')}</th>
                                        <th className="text-left py-2 px-2">{t('common.description')}</th>
                                        <th className="text-right py-2 px-2">{t('accounting.charges')}</th>
                                        <th className="text-right py-2 px-2">{t('accounting.payments')}</th>
                                        <th className="text-right py-2 px-2">{t('accounting.balance')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {statement.transactions.map((txn, index) => (
                                        <tr key={index} className="border-b hover:bg-muted/30">
                                            <td className="py-2 px-2">
                                                {new Date(txn.date).toLocaleDateString(locale)}
                                            </td>
                                            <td className="py-2 px-2">
                                                <Badge variant={txn.type === 'invoice' ? 'default' : 'secondary'}>
                                                    {txn.type === 'invoice' ? t('accounting.invoice') : t('accounting.payment')}
                                                </Badge>
                                            </td>
                                            <td className="py-2 px-2 font-mono">{txn.reference}</td>
                                            <td className="py-2 px-2">{txn.description}</td>
                                            <td className="py-2 px-2 text-right">
                                                {txn.debit > 0 ? formatCurrency(txn.debit, locale) : ''}
                                            </td>
                                            <td className="py-2 px-2 text-right text-green-600">
                                                {txn.credit > 0 ? formatCurrency(txn.credit, locale) : ''}
                                            </td>
                                            <td className="py-2 px-2 text-right font-medium">
                                                {formatCurrency(txn.balance, locale)}
                                            </td>
                                        </tr>
                                    ))}
                                    {statement.transactions.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="text-center py-8 text-muted-foreground">
                                                {t('accounting.no_transactions')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t font-bold">
                                        <td colSpan={4} className="py-2 px-2">{t('common.total')}</td>
                                        <td className="py-2 px-2 text-right">{formatCurrency(statement.totalDebits, locale)}</td>
                                        <td className="py-2 px-2 text-right text-green-600">{formatCurrency(statement.totalCredits, locale)}</td>
                                        <td className="py-2 px-2 text-right"></td>
                                    </tr>
                                </tfoot>
                            </table>

                            {/* Closing Balance */}
                            <div className="flex justify-between py-3 border-t-2 font-bold text-lg mt-4 bg-muted/30 px-2 rounded-b">
                                <span>{t('accounting.closing_balance')}</span>
                                <span className={statement.closingBalance > 0 ? 'text-red-600' : 'text-green-600'}>
                                    {formatCurrency(statement.closingBalance, locale)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {!statement && (
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardContent className="py-12 text-center text-muted-foreground">
                            {t('accounting.select_supplier_prompt')}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
