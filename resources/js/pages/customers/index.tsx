import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Search, Edit, Trash2, User, Mail, Phone } from 'lucide-react';
import { Label } from '@/components/ui/label';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface Customer {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
    total_spent: number;
    total_orders: number;
}

interface CustomersPageProps {
    customers: {
        data: Customer[];
        links: any;
    };
    filters: {
        search?: string;
    };
}

export default function CustomersIndex({ customers, filters }: CustomersPageProps) {
    const { t } = useTranslation();
    const [showDialog, setShowDialog] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
    });

    const openDialog = (customer?: Customer) => {
        if (customer) {
            setEditingCustomer(customer);
            setData({
                name: customer.name,
                email: customer.email || '',
                phone: customer.phone || '',
                address: customer.address || '',
                city: customer.city || '',
                state: customer.state || '',
                postal_code: customer.postal_code || '',
                country: customer.country || '',
            });
        } else {
            setEditingCustomer(null);
            reset();
        }
        setShowDialog(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCustomer) {
            put(`/customers/${editingCustomer.id}`, {
                onSuccess: () => {
                    setShowDialog(false);
                    reset();
                },
            });
        } else {
            post('/customers', {
                onSuccess: () => {
                    setShowDialog(false);
                    reset();
                },
            });
        }
    };


    return (
        <AppLayout breadcrumbs={[{ title: t('nav.customers'), href: '/customers' }]}>
            <Head title={t('customers.title')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('customers.title')}</h1>
                        <p className="text-muted-foreground">{t('customers.title')}</p>
                    </div>
                    <Button onClick={() => openDialog()} className="backdrop-blur-sm bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('customers.add_customer')}
                    </Button>
                </div>

                {/* Search */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="pt-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('customers.search_customers')}
                                className="pl-10"
                                defaultValue={filters.search}
                                onChange={(e) => {
                                    router.get('/customers', { search: e.target.value }, {
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Customers Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {customers.data.map((customer) => (
                        <Card key={customer.id} className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-muted-foreground" />
                                        <CardTitle className="text-lg">{customer.name}</CardTitle>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => openDialog(customer)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this customer?')) {
                                                    router.delete(`/customers/${customer.id}`);
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {customer.email && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <span>{customer.email}</span>
                                        </div>
                                    )}
                                    {customer.phone && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <span>{customer.phone}</span>
                                        </div>
                                    )}
                                    {customer.address && (
                                        <p className="text-sm text-muted-foreground">{customer.address}</p>
                                    )}
                                    <div className="flex items-center justify-between pt-2 border-t">
                                        <div>
                                            <p className="text-xs text-muted-foreground">{t('customers.total_spent')}</p>
                                            <p className="font-bold">{formatCurrency(customer.total_spent)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">{t('customers.total_orders')}</p>
                                            <Badge variant="secondary">{customer.total_orders}</Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Dialog */}
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogContent className="backdrop-blur-sm bg-background/95 max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingCustomer ? t('customers.edit_customer') : t('customers.add_customer')}</DialogTitle>
                            <DialogDescription>
                                {editingCustomer ? t('customers.update_info') : t('customers.create_new')}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>{t('customers.name')} *</Label>
                                <Input
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>{t('customers.email')}</Label>
                                    <Input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                    />
                                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                                </div>
                                <div>
                                    <Label>{t('customers.phone')}</Label>
                                    <Input
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>{t('customers.address')}</Label>
                                <textarea
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    rows={2}
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label>{t('customers.city')}</Label>
                                    <Input
                                        value={data.city}
                                        onChange={(e) => setData('city', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>{t('customers.state')}</Label>
                                    <Input
                                        value={data.state}
                                        onChange={(e) => setData('state', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>{t('customers.postal_code')}</Label>
                                    <Input
                                        value={data.postal_code}
                                        onChange={(e) => setData('postal_code', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>{t('customers.country')}</Label>
                                <Input
                                    value={data.country}
                                    onChange={(e) => setData('country', e.target.value)}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {editingCustomer ? t('common.update') : t('common.create')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

