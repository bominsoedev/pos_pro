import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Search, Edit, Trash2, MapPin, Mail, Phone, Building2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-translation';
import { useDebounce } from '@/hooks/use-debounce';
import { Checkbox } from '@/components/ui/checkbox';

interface Way {
    id: number;
    name: string;
    code: string;
    description: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    is_active: boolean;
    sort_order: number;
    orders_count?: number;
    products_count?: number;
    customers_count?: number;
}

interface WaysPageProps {
    ways: Way[];
    filters?: {
        search?: string;
        active_only?: boolean;
    };
}

export default function WaysIndex({ ways: initialWays, filters = {} }: WaysPageProps) {
    const { t } = useTranslation();
    const [showDialog, setShowDialog] = useState(false);
    const [editingWay, setEditingWay] = useState<Way | null>(null);
    const [searchInput, setSearchInput] = useState(filters.search || '');
    const [activeOnly, setActiveOnly] = useState(filters.active_only || false);
    const debouncedSearch = useDebounce(searchInput, 500);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        code: '',
        description: '',
        address: '',
        phone: '',
        email: '',
        is_active: true,
        sort_order: 0,
    });

    // Debounced search effect
    useEffect(() => {
        router.get('/ways', {
            search: debouncedSearch || undefined,
            active_only: activeOnly || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    }, [debouncedSearch, activeOnly]);

    const openDialog = (way?: Way) => {
        if (way) {
            setEditingWay(way);
            setData({
                name: way.name,
                code: way.code,
                description: way.description || '',
                address: way.address || '',
                phone: way.phone || '',
                email: way.email || '',
                is_active: way.is_active,
                sort_order: way.sort_order,
            });
        } else {
            setEditingWay(null);
            reset();
        }
        setShowDialog(true);
    };

    const closeDialog = () => {
        setShowDialog(false);
        setEditingWay(null);
        reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingWay) {
            put(`/ways/${editingWay.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    closeDialog();
                },
            });
        } else {
            post('/ways', {
                preserveScroll: true,
                onSuccess: () => {
                    closeDialog();
                },
            });
        }
    };

    const handleDelete = (way: Way) => {
        if (confirm(t('ways.delete_confirm'))) {
            router.delete(`/ways/${way.id}`, {
                preserveScroll: true,
            });
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: t('nav.ways'), href: '/ways' }]}>
            <Head title={t('ways.title')} />
            <div className="flex h-full flex-1 flex-col gap-2 overflow-x-auto rounded-lg p-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">{t('ways.title')}</h1>
                        <p className="text-muted-foreground">
                            {t('ways.create_new')}
                        </p>
                    </div>
                    <Button onClick={() => openDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('ways.add_way')}
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>{t('ways.title')}</CardTitle>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="active-only"
                                        checked={activeOnly}
                                        onCheckedChange={(checked) => setActiveOnly(checked === true)}
                                    />
                                    <Label htmlFor="active-only" className="text-sm font-normal cursor-pointer">
                                        {t('common.active')} {t('ways.active_only')}
                                    </Label>
                                </div>
                                <div className="relative w-64">
                                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder={t('common.search_with_shortcut')}
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {initialWays.length === 0 ? (
                            <div className="text-center py-6">
                                <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold">{t('ways.no_ways_available')}</h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {t('ways.create_new')}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {initialWays.map((way) => (
                                    <Card key={way.id} className="hover:bg-accent/50 transition-colors">
                                        <CardContent className="p-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-2 flex-1">
                                                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                                                        <MapPin className="h-6 w-6 text-primary" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-lg font-semibold">{way.name}</h3>
                                                            {!way.is_active && (
                                                                <Badge variant="secondary">{t('common.inactive')}</Badge>
                                                            )}
                                                            {way.code && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    {way.code}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {way.description && (
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {way.description}
                                                            </p>
                                                        )}
                                                        <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                                                            {way.address && (
                                                                <div className="flex items-center gap-1">
                                                                    <Building2 className="h-4 w-4" />
                                                                    <span>{way.address}</span>
                                                                </div>
                                                            )}
                                                            {way.phone && (
                                                                <div className="flex items-center gap-1">
                                                                    <Phone className="h-4 w-4" />
                                                                    <span>{way.phone}</span>
                                                                </div>
                                                            )}
                                                            {way.email && (
                                                                <div className="flex items-center gap-1">
                                                                    <Mail className="h-4 w-4" />
                                                                    <span>{way.email}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {(way.orders_count !== undefined || way.products_count !== undefined || way.customers_count !== undefined) && (
                                                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                                                {way.orders_count !== undefined && (
                                                                    <span>{way.orders_count} {t('nav.orders')}</span>
                                                                )}
                                                                {way.products_count !== undefined && (
                                                                    <span>{way.products_count} {t('nav.products')}</span>
                                                                )}
                                                                {way.customers_count !== undefined && (
                                                                    <span>{way.customers_count} {t('nav.customers')}</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openDialog(way)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(way)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingWay ? t('ways.edit_way') : t('ways.add_way')}
                            </DialogTitle>
                            <DialogDescription>
                                {editingWay ? t('ways.update_info') : t('ways.create_new')}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-2 py-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">
                                        {t('ways.name')} <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder={t('ways.name')}
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name}</p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="code">
                                        {t('ways.code')} <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="code"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value)}
                                        placeholder={t('ways.code')}
                                    />
                                    {errors.code && (
                                        <p className="text-sm text-destructive">{errors.code}</p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="description">{t('ways.description')}</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder={t('ways.description')}
                                        rows={3}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-destructive">{errors.description}</p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="address">{t('ways.address')}</Label>
                                    <Input
                                        id="address"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        placeholder={t('ways.address')}
                                    />
                                    {errors.address && (
                                        <p className="text-sm text-destructive">{errors.address}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">{t('ways.phone')}</Label>
                                        <Input
                                            id="phone"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            placeholder={t('ways.phone')}
                                        />
                                        {errors.phone && (
                                            <p className="text-sm text-destructive">{errors.phone}</p>
                                        )}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="email">{t('ways.email')}</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder={t('ways.email')}
                                        />
                                        {errors.email && (
                                            <p className="text-sm text-destructive">{errors.email}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="is_active"
                                            checked={data.is_active}
                                            onCheckedChange={(checked) => setData('is_active', checked === true)}
                                        />
                                        <Label htmlFor="is_active" className="cursor-pointer">
                                            {t('ways.is_active')}
                                        </Label>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="sort_order">{t('ways.sort_order')}</Label>
                                        <Input
                                            id="sort_order"
                                            type="number"
                                            value={data.sort_order}
                                            onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                                            min="0"
                                        />
                                        {errors.sort_order && (
                                            <p className="text-sm text-destructive">{errors.sort_order}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={closeDialog}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? t('common.loading') : (editingWay ? t('common.update') : t('common.create'))}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
