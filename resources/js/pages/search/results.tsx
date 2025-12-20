import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Package, Users, Receipt, FolderTree, Search as SearchIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-translation';

interface SearchResultsProps {
    query: string;
    results: {
        products: Array<{
            id: number;
            name: string;
            sku: string | null;
            price: number;
            category: { name: string } | null;
        }>;
        customers: Array<{
            id: number;
            name: string;
            email: string | null;
            phone: string | null;
        }>;
        orders: Array<{
            id: number;
            order_number: string;
            total: number;
            customer: { name: string } | null;
            user: { name: string } | null;
        }>;
        categories: Array<{
            id: number;
            name: string;
            description: string | null;
        }>;
    };
}

export default function SearchResults({ query, results }: SearchResultsProps) {
    const { t, currentLanguage } = useTranslation();
    const totalResults = results.products.length + results.customers.length + 
                     results.orders.length + results.categories.length;

    return (
        <AppLayout breadcrumbs={[{ title: t('search.title'), href: '/search' }]}>
            <Head title={`${t('search.title')}: ${query}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center gap-4">
                    <SearchIcon className="h-8 w-8 text-muted-foreground" />
                    <div>
                        <h1 className="text-2xl font-bold">{t('search.title')}</h1>
                        <p className="text-muted-foreground">
                            {t('search.found')} {totalResults} {t('search.results_for')} "{query}"
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Products */}
                    {results.products.length > 0 && (
                        <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    {t('nav.products')} ({results.products.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {results.products.map((product) => (
                                        <Link
                                            key={product.id}
                                            href={`/products/${product.id}`}
                                            className="block p-3 rounded border hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="font-medium">{product.name}</p>
                                                    {product.sku && (
                                                        <p className="text-sm text-muted-foreground">{t('products.sku')}: {product.sku}</p>
                                                    )}
                                                    {product.category && (
                                                        <Badge variant="outline" className="mt-1 text-xs">
                                                            {product.category.name}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="font-bold ml-4">{formatCurrency(product.price, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Customers */}
                    {results.customers.length > 0 && (
                        <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Customers ({results.customers.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {results.customers.map((customer) => (
                                        <Link
                                            key={customer.id}
                                            href={`/customers/${customer.id}`}
                                            className="block p-3 rounded border hover:bg-muted/50 transition-colors"
                                        >
                                            <p className="font-medium">{customer.name}</p>
                                            {customer.phone && (
                                                <p className="text-sm text-muted-foreground">{t('customers.phone')}: {customer.phone}</p>
                                            )}
                                            {customer.email && (
                                                <p className="text-sm text-muted-foreground">{t('customers.email')}: {customer.email}</p>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Orders */}
                    {results.orders.length > 0 && (
                        <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Receipt className="h-5 w-5" />
                                    {t('nav.orders')} ({results.orders.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {results.orders.map((order) => (
                                        <Link
                                            key={order.id}
                                            href={`/orders/${order.id}`}
                                            className="block p-3 rounded border hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="font-medium">{order.order_number}</p>
                                                    {order.customer && (
                                                        <p className="text-sm text-muted-foreground">{order.customer.name}</p>
                                                    )}
                                                </div>
                                                <p className="font-bold ml-4">{formatCurrency(order.total, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Categories */}
                    {results.categories.length > 0 && (
                        <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FolderTree className="h-5 w-5" />
                                    {t('nav.categories')} ({results.categories.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {results.categories.map((category) => (
                                        <Link
                                            key={category.id}
                                            href={`/categories/${category.id}`}
                                            className="block p-3 rounded border hover:bg-muted/50 transition-colors"
                                        >
                                            <p className="font-medium">{category.name}</p>
                                            {category.description && (
                                                <p className="text-sm text-muted-foreground">{category.description}</p>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {totalResults === 0 && (
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardContent className="pt-6 text-center py-12">
                            <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-lg font-medium mb-2">{t('search.no_results')}</p>
                            <p className="text-sm text-muted-foreground">
                                {t('search.try_different')}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}

