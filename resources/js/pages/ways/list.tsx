import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';

interface Way {
    id: number;
    name: string;
    code: string;
    description: string | null;
}

interface WaysListProps {
    ways: Way[];
}

export default function WaysList({ ways }: WaysListProps) {
    const { t } = useTranslation();

    return (
        <AppLayout breadcrumbs={[{ title: t('nav.ways'), href: '/ways' }]}>
            <Head title={t('nav.ways')} />
            <div className="flex h-full flex-1 flex-col gap-2 overflow-x-auto rounded-lg p-3">
                <div>
                    <h1 className="text-xl font-bold">{t('nav.ways')}</h1>
                    <p className="text-muted-foreground">{t('ways.active_ways')}</p>
                </div>

                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('ways.active_ways')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {ways.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                {t('common.no_data')}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {ways.map((way) => (
                                    <div key={way.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50">
                                        <div>
                                            <div className="font-medium">{way.name}</div>
                                            {way.description && (
                                                <div className="text-sm text-muted-foreground">{way.description}</div>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground">{way.code}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
