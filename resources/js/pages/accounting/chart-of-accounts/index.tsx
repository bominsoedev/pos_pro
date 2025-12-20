import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm, Link } from '@inertiajs/react';
import { Plus, Search, Edit, Trash2, ChevronRight, ChevronDown, BookOpen } from 'lucide-react';
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
    parent_id: number | null;
    parent?: Account;
    children?: Account[];
    opening_balance: number;
    is_system: boolean;
    is_active: boolean;
    level: number;
}

interface Props {
    accounts: {
        data: Account[];
        links: any;
    };
    accountTree: Account[];
    accountTypes: Record<string, string>;
    subtypes: Record<string, string[]>;
    filters: {
        search?: string;
        type?: string;
    };
}

export default function ChartOfAccountsIndex({ accounts, accountTree, accountTypes, subtypes, filters }: Props) {
    const { t, currentLanguage } = useTranslation();
    const [showDialog, setShowDialog] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
    const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');

    const { data, setData, post, put, processing, errors, reset } = useForm({
        code: '',
        name: '',
        name_mm: '',
        description: '',
        type: 'asset',
        subtype: 'cash',
        parent_id: null as number | null,
        opening_balance: 0,
        is_active: true,
    });

    const openDialog = (account?: Account) => {
        if (account) {
            setEditingAccount(account);
            setData({
                code: account.code,
                name: account.name,
                name_mm: account.name_mm || '',
                description: account.description || '',
                type: account.type,
                subtype: account.subtype,
                parent_id: account.parent_id,
                opening_balance: account.opening_balance,
                is_active: account.is_active,
            });
        } else {
            setEditingAccount(null);
            reset();
        }
        setShowDialog(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingAccount) {
            put(`/accounting/accounts/${editingAccount.id}`, {
                onSuccess: () => {
                    setShowDialog(false);
                    reset();
                },
            });
        } else {
            post('/accounting/accounts', {
                onSuccess: () => {
                    setShowDialog(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = (account: Account) => {
        if (account.is_system) {
            alert(t('accounting.cannot_delete_system_account'));
            return;
        }
        if (confirm(t('common.confirm_delete'))) {
            router.delete(`/accounting/accounts/${account.id}`);
        }
    };

    const toggleNode = (id: number) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedNodes(newExpanded);
    };

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

    const renderTreeNode = (account: Account, depth: number = 0) => {
        const hasChildren = account.children && account.children.length > 0;
        const isExpanded = expandedNodes.has(account.id);

        return (
            <div key={account.id}>
                <div
                    className={`flex items-center justify-between p-3 hover:bg-muted/50 border-b`}
                    style={{ paddingLeft: `${depth * 24 + 12}px` }}
                >
                    <div className="flex items-center gap-2">
                        {hasChildren ? (
                            <button onClick={() => toggleNode(account.id)} className="p-1">
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                        ) : (
                            <span className="w-6" />
                        )}
                        <span className="font-mono text-sm text-muted-foreground">{account.code}</span>
                        <Link href={`/accounting/accounts/${account.id}`} className="font-medium hover:underline">
                            {currentLanguage === 'my' && account.name_mm ? account.name_mm : account.name}
                        </Link>
                        <Badge className={getTypeColor(account.type)}>{accountTypes[account.type]}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        {!account.is_system && (
                            <>
                                <Button variant="ghost" size="icon" onClick={() => openDialog(account)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(account)} className="text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
                {hasChildren && isExpanded && account.children!.map(child => renderTreeNode(child, depth + 1))}
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting'), href: '/accounting/accounts' },
            { title: t('accounting.chart_of_accounts'), href: '/accounting/accounts' },
        ]}>
            <Head title={t('accounting.chart_of_accounts')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('accounting.chart_of_accounts')}</h1>
                        <p className="text-muted-foreground">{t('accounting.manage_accounts')}</p>
                    </div>
                    <Button onClick={() => openDialog()} className="backdrop-blur-sm bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('accounting.add_account')}
                    </Button>
                </div>

                {/* Filters */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={t('common.search')}
                                    className="pl-10"
                                    defaultValue={filters.search}
                                    onChange={(e) => {
                                        router.get('/accounting/accounts', {
                                            search: e.target.value || undefined,
                                            type: filters.type,
                                        }, { preserveState: true });
                                    }}
                                />
                            </div>
                            <Select
                                value={filters.type || 'all'}
                                onValueChange={(value) => {
                                    router.get('/accounting/accounts', {
                                        search: filters.search,
                                        type: value === 'all' ? undefined : value,
                                    }, { preserveState: true });
                                }}
                            >
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder={t('accounting.account_type')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('common.all')}</SelectItem>
                                    {Object.entries(accountTypes).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex gap-1 border rounded-md p-1">
                                <Button
                                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('list')}
                                >
                                    {t('common.list')}
                                </Button>
                                <Button
                                    variant={viewMode === 'tree' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('tree')}
                                >
                                    {t('common.tree')}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Accounts List/Tree */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="p-0">
                        {viewMode === 'tree' ? (
                            <div className="divide-y">
                                {accountTree.map(account => renderTreeNode(account))}
                            </div>
                        ) : (
                            <div className="divide-y">
                                {accounts.data.map((account) => (
                                    <div key={account.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                                        <div className="flex items-center gap-4">
                                            <BookOpen className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sm text-muted-foreground">{account.code}</span>
                                                    <Link href={`/accounting/accounts/${account.id}`} className="font-medium hover:underline">
                                                        {currentLanguage === 'my' && account.name_mm ? account.name_mm : account.name}
                                                    </Link>
                                                    <Badge className={getTypeColor(account.type)}>{accountTypes[account.type]}</Badge>
                                                    {account.is_system && <Badge variant="outline">{t('accounting.system')}</Badge>}
                                                    {!account.is_active && <Badge variant="destructive">{t('common.inactive')}</Badge>}
                                                </div>
                                                {account.description && (
                                                    <p className="text-sm text-muted-foreground mt-1">{account.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-semibold">
                                                {formatCurrency(account.opening_balance, currentLanguage === 'my' ? 'my-MM' : 'en-US')}
                                            </span>
                                            {!account.is_system && (
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => openDialog(account)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(account)} className="text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {accounts.data.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        {t('accounting.no_accounts')}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {viewMode === 'list' && <Pagination links={accounts.links} />}

                {/* Create/Edit Dialog */}
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingAccount ? t('accounting.edit_account') : t('accounting.add_account')}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>{t('accounting.account_code')} *</Label>
                                        <Input
                                            value={data.code}
                                            onChange={(e) => setData('code', e.target.value)}
                                            placeholder="1000"
                                            required
                                        />
                                        {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
                                    </div>
                                    <div>
                                        <Label>{t('accounting.account_type')} *</Label>
                                        <Select value={data.type} onValueChange={(v) => {
                                            setData('type', v);
                                            setData('subtype', subtypes[v][0]);
                                        }}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(accountTypes).map(([key, label]) => (
                                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>{t('accounting.account_name')} *</Label>
                                        <Input
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                        />
                                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <Label>{t('accounting.account_name_mm')}</Label>
                                        <Input
                                            value={data.name_mm}
                                            onChange={(e) => setData('name_mm', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>{t('accounting.subtype')} *</Label>
                                        <Select value={data.subtype} onValueChange={(v) => setData('subtype', v)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {subtypes[data.type]?.map((subtype) => (
                                                    <SelectItem key={subtype} value={subtype}>
                                                        {subtype.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>{t('accounting.opening_balance')}</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={data.opening_balance}
                                            onChange={(e) => setData('opening_balance', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>{t('accounting.parent_account')}</Label>
                                    <Select
                                        value={data.parent_id?.toString() || 'none'}
                                        onValueChange={(v) => setData('parent_id', v === 'none' ? null : parseInt(v))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('accounting.select_parent')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">{t('common.none')}</SelectItem>
                                            {accounts.data
                                                .filter(a => a.type === data.type && a.id !== editingAccount?.id)
                                                .map((account) => (
                                                    <SelectItem key={account.id} value={account.id.toString()}>
                                                        {account.code} - {account.name}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>{t('common.description')}</Label>
                                    <Textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={2}
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <Label>{t('common.active')}</Label>
                                </div>
                            </div>
                            <DialogFooter className="mt-6">
                                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {editingAccount ? t('common.update') : t('common.create')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
