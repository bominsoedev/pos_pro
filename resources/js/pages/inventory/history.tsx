import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Package, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Pagination from '@/components/pagination';
import { type BreadcrumbItem } from '@/types';

interface InventoryLog {
    id: number;
    type: string;
    quantity_change: number;
    quantity_before: number;
    quantity_after: number;
    notes: string | null;
    created_at: string;
    user: { name: string } | null;
}

interface Product {
    id: number;
    name: string;
    sku: string | null;
    category: { name: string } | null;
}

interface InventoryHistoryProps {
    product: Product;
    logs: {
        data: InventoryLog[];
        links: any;
    };
}

export default function InventoryHistory({ product, logs }: InventoryHistoryProps) {
    const { t } = useTranslation();
    const getTypeIcon = (type: string, change: number) => {
        if (type === 'sale') {
            return <TrendingDown className="h-4 w-4 text-destructive" />;
        } else if (change > 0) {
            return <TrendingUp className="h-4 w-4 text-green-600" />;
        } else {
            return <Minus className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getTypeBadge = (type: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            sale: 'destructive',
            purchase: 'default',
            adjustment: 'secondary',
            return: 'outline',
        };
        return variants[type] || 'secondary';
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.inventory'), href: '/inventory' },
            { title: product.name, href: `/inventory/${product.id}/history` },
        ]}>
            <Head title={`${t('inventory.history')} - ${product.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/inventory">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{product.name}</h1>
                            <p className="text-muted-foreground">
                                {product.sku && `${t('products.sku')}: ${product.sku} • `}
                                {product.category?.name}
                            </p>
                        </div>
                    </div>
                </div>

                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('inventory.history')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">{t('inventory.date')}</th>
                                        <th className="text-left p-2">{t('inventory.type')}</th>
                                        <th className="text-left p-2">{t('inventory.user')}</th>
                                        <th className="text-right p-2">{t('inventory.before')}</th>
                                        <th className="text-right p-2">{t('inventory.change')}</th>
                                        <th className="text-right p-2">{t('inventory.after')}</th>
                                        <th className="text-left p-2">{t('inventory.notes')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.data.map((log) => (
                                        <tr key={log.id} className="border-b hover:bg-muted/50">
                                            <td className="p-2 text-sm">{formatDate(log.created_at)}</td>
                                            <td className="p-2">
                                                <Badge variant={getTypeBadge(log.type)} className="flex items-center gap-1 w-fit">
                                                    {getTypeIcon(log.type, log.quantity_change)}
                                                    {getTypeLabel(log.type)}
                                                </Badge>
                                            </td>
                                            <td className="p-2 text-sm">{log.user?.name || t('inventory.system')}</td>
                                            <td className="p-2 text-right">{log.quantity_before}</td>
                                            <td className={`p-2 text-right font-bold ${log.quantity_change > 0 ? 'text-green-600' : 'text-destructive'}`}>
                                                {log.quantity_change > 0 ? '+' : ''}{log.quantity_change}
                                            </td>
                                            <td className="p-2 text-right font-semibold">{log.quantity_after}</td>
                                            <td className="p-2 text-sm text-muted-foreground">{log.notes || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {logs.data.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    {t('inventory.no_history')}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination */}
                <Pagination links={logs.links} />
            </div>
        </AppLayout>
    );
}

