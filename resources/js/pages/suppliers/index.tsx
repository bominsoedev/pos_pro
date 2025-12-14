import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Search, Edit, Trash2, Truck, Mail, Phone, MapPin } from 'lucide-react';
import { Label } from '@/components/ui/label';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-translation';
import { useDebounce } from '@/hooks/use-debounce';

interface Supplier {
    id: number;
    name: string;
    code: string | null;
    email: string | null;
    phone: string | null;
    contact_person: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
    tax_id: string | null;
    notes: string | null;
    is_active: boolean;
}

interface SuppliersPageProps {
    suppliers: {
        data: Supplier[];
        links: any;
    };
    filters: {
        search?: string;
        active_only?: boolean;
    };
}

export default function SuppliersIndex({ suppliers, filters }: SuppliersPageProps) {
    const { t } = useTranslation();
    const [showDialog, setShowDialog] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [searchInput, setSearchInput] = useState(filters.search || '');
    const debouncedSearch = useDebounce(searchInput, 500);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        code: '',
        email: '',
        phone: '',
        contact_person: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        tax_id: '',
        notes: '',
        is_active: true,
    });

    // Debounced search effect
    useEffect(() => {
        if (debouncedSearch !== filters.search) {
            router.get('/suppliers', {
                search: debouncedSearch || undefined,
                active_only: filters.active_only,
            }, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    }, [debouncedSearch, filters.active_only]);

    const openDialog = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setData({
                name: supplier.name,
                code: supplier.code || '',
                email: supplier.email || '',
                phone: supplier.phone || '',
                contact_person: supplier.contact_person || '',
                address: supplier.address || '',
                city: supplier.city || '',
                state: supplier.state || '',
                postal_code: supplier.postal_code || '',
                country: supplier.country || '',
                tax_id: supplier.tax_id || '',
                notes: supplier.notes || '',
                is_active: supplier.is_active,
            });
        } else {
            setEditingSupplier(null);
            reset();
        }
        setShowDialog(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSupplier) {
            put(`/suppliers/${editingSupplier.id}`, {
                onSuccess: () => {
                    setShowDialog(false);
                    reset();
                },
            });
        } else {
            post('/suppliers', {
                onSuccess: () => {
                    setShowDialog(false);
                    reset();
                },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: t('nav.suppliers'), href: '/suppliers' }]}>
            <Head title={t('suppliers.title')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('suppliers.title')}</h1>
                        <p className="text-muted-foreground">{t('suppliers.title')}</p>
                    </div>
                    <Button onClick={() => openDialog()} className="backdrop-blur-sm bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('suppliers.add_supplier')}
                    </Button>
                </div>

                {/* Filters */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="pt-6">
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={`${t('common.search')} (${t('shortcuts.focus_search')}: /)`}
                                    className="pl-10"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Suppliers List */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {suppliers.data.map((supplier) => (
                                <div
                                    key={supplier.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <Truck className="h-5 w-5 text-muted-foreground" />
                                            <h3 className="font-semibold">{supplier.name}</h3>
                                            {supplier.code && (
                                                <Badge variant="outline">{supplier.code}</Badge>
                                            )}
                                            {!supplier.is_active && (
                                                <Badge variant="secondary">{t('common.inactive')}</Badge>
                                            )}
                                        </div>
                                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                            {supplier.email && (
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4" />
                                                    {supplier.email}
                                                </div>
                                            )}
                                            {supplier.phone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4" />
                                                    {supplier.phone}
                                                </div>
                                            )}
                                            {supplier.contact_person && (
                                                <div>{t('suppliers.contact_person')}: {supplier.contact_person}</div>
                                            )}
                                            {(supplier.city || supplier.state || supplier.country) && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4" />
                                                    {[supplier.city, supplier.state, supplier.country].filter(Boolean).join(', ')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openDialog(supplier)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                if (confirm(t('suppliers.delete_confirm'))) {
                                                    router.delete(`/suppliers/${supplier.id}`);
                                                }
                                            }}
                                            className="text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {suppliers.data.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    {t('suppliers.no_suppliers')}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Pagination links={suppliers.links} />

                {/* Dialog */}
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingSupplier ? t('suppliers.edit_supplier') : t('suppliers.add_supplier')}
                            </DialogTitle>
                            <DialogDescription>
                                {editingSupplier ? t('suppliers.edit_supplier') : t('suppliers.add_supplier')}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>{t('suppliers.name')} *</Label>
                                        <Input
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                        />
                                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <Label>{t('suppliers.code')}</Label>
                                        <Input
                                            value={data.code}
                                            onChange={(e) => setData('code', e.target.value)}
                                        />
                                        {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>{t('suppliers.email')}</Label>
                                        <Input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                        />
                                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                                    </div>
                                    <div>
                                        <Label>{t('suppliers.phone')}</Label>
                                        <Input
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                        />
                                        {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                                    </div>
                                </div>
                                <div>
                                    <Label>{t('suppliers.contact_person')}</Label>
                                    <Input
                                        value={data.contact_person}
                                        onChange={(e) => setData('contact_person', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>{t('suppliers.address')}</Label>
                                    <Textarea
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        rows={2}
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <Label>{t('suppliers.city')}</Label>
                                        <Input
                                            value={data.city}
                                            onChange={(e) => setData('city', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>{t('suppliers.state')}</Label>
                                        <Input
                                            value={data.state}
                                            onChange={(e) => setData('state', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>{t('suppliers.postal_code')}</Label>
                                        <Input
                                            value={data.postal_code}
                                            onChange={(e) => setData('postal_code', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label>{t('suppliers.country')}</Label>
                                    <Input
                                        value={data.country}
                                        onChange={(e) => setData('country', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>{t('suppliers.tax_id')}</Label>
                                    <Input
                                        value={data.tax_id}
                                        onChange={(e) => setData('tax_id', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>{t('suppliers.notes')}</Label>
                                    <Textarea
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={3}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <Label>{t('suppliers.is_active')}</Label>
                                </div>
                            </div>
                            <DialogFooter className="mt-4">
                                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {editingSupplier ? t('common.update') : t('common.create')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

