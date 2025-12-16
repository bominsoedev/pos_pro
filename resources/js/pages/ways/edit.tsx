import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';

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
}

interface WaysEditProps {
    way: Way;
}

export default function WaysEdit({ way }: WaysEditProps) {
    const { t } = useTranslation();

    const { data, setData, put, processing, errors } = useForm({
        name: way.name,
        code: way.code,
        description: way.description || '',
        address: way.address || '',
        phone: way.phone || '',
        email: way.email || '',
        is_active: way.is_active,
        sort_order: way.sort_order,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/ways/${way.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                router.visit('/ways');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.ways'), href: '/ways' },
            { title: t('ways.edit'), href: `/ways/${way.id}/edit` },
        ]}>
            <Head title={t('ways.edit')} />
            <div className="flex h-full flex-1 flex-col gap-2 overflow-x-auto rounded-lg p-3">
                <div className="flex items-center gap-2">
                    <Link href="/ways">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">{t('ways.edit')}</h1>
                        <p className="text-muted-foreground">{way.name}</p>
                    </div>
                </div>

                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('ways.way_details')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <Label htmlFor="name">{t('ways.name')} *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive mt-1">{errors.name}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="code">{t('ways.code')} *</Label>
                                <Input
                                    id="code"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                    required
                                />
                                {errors.code && (
                                    <p className="text-sm text-destructive mt-1">{errors.code}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="description">{t('ways.description')}</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive mt-1">{errors.description}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="address">{t('ways.address')}</Label>
                                <Input
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                />
                                {errors.address && (
                                    <p className="text-sm text-destructive mt-1">{errors.address}</p>
                                )}
                            </div>

                            <div className="grid gap-2 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="phone">{t('ways.phone')}</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                    />
                                    {errors.phone && (
                                        <p className="text-sm text-destructive mt-1">{errors.phone}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="email">{t('ways.email')}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-destructive mt-1">{errors.email}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-2 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="sort_order">{t('ways.sort_order')}</Label>
                                    <Input
                                        id="sort_order"
                                        type="number"
                                        value={data.sort_order}
                                        onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                                        min="0"
                                    />
                                    {errors.sort_order && (
                                        <p className="text-sm text-destructive mt-1">{errors.sort_order}</p>
                                    )}
                                </div>

                                <div className="flex items-center space-x-2 pt-6">
                                    <Checkbox
                                        id="is_active"
                                        checked={data.is_active}
                                        onCheckedChange={(checked) => setData('is_active', checked === true)}
                                    />
                                    <Label htmlFor="is_active" className="cursor-pointer">
                                        {t('ways.is_active')}
                                    </Label>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button type="submit" disabled={processing}>
                                    {processing ? t('common.loading') : t('common.update')}
                                </Button>
                                <Link href="/ways">
                                    <Button type="button" variant="outline">
                                        {t('common.cancel')}
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
