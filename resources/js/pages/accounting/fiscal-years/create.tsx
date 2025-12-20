import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

interface Props {
    suggestedStart: string;
    suggestedEnd: string;
}

export default function CreateFiscalYear({ suggestedStart, suggestedEnd }: Props) {
    const { t } = useTranslation();

    const { data, setData, post, processing, errors } = useForm({
        name: `FY ${new Date(suggestedStart).getFullYear()}`,
        start_date: suggestedStart,
        end_date: suggestedEnd,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/accounting/fiscal-years');
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting'), href: '/accounting/dashboard' },
            { title: t('accounting.fiscal_years'), href: '/accounting/fiscal-years' },
            { title: t('common.create'), href: '/accounting/fiscal-years/create' },
        ]}>
            <Head title={t('accounting.new_fiscal_year')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/accounting/fiscal-years">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Calendar className="h-6 w-6" />
                            {t('accounting.new_fiscal_year')}
                        </h1>
                        <p className="text-muted-foreground">{t('accounting.create_fiscal_year_desc')}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70 max-w-xl">
                        <CardHeader>
                            <CardTitle>{t('accounting.fiscal_year_details')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>{t('common.name')} *</Label>
                                <Input
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g., FY 2025"
                                    required
                                />
                                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>{t('accounting.start_date')} *</Label>
                                    <Input
                                        type="date"
                                        value={data.start_date}
                                        onChange={(e) => setData('start_date', e.target.value)}
                                        required
                                    />
                                    {errors.start_date && <p className="text-sm text-destructive mt-1">{errors.start_date}</p>}
                                </div>
                                <div>
                                    <Label>{t('accounting.end_date')} *</Label>
                                    <Input
                                        type="date"
                                        value={data.end_date}
                                        onChange={(e) => setData('end_date', e.target.value)}
                                        required
                                    />
                                    {errors.end_date && <p className="text-sm text-destructive mt-1">{errors.end_date}</p>}
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                                <Button variant="outline" asChild>
                                    <Link href="/accounting/fiscal-years">{t('common.cancel')}</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {t('common.create')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
