import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Search, Edit, Trash2, Folder } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-translation';

interface Category {
    id: number;
    name: string;
    description: string | null;
    image: string | null;
    is_active: boolean;
    products_count: number;
}

interface CategoriesPageProps {
    categories: {
        data: Category[];
        links: any;
    };
    filters: {
        search?: string;
    };
}

export default function CategoriesIndex({ categories, filters }: CategoriesPageProps) {
    const { t } = useTranslation();
    const [showDialog, setShowDialog] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        description: '',
        image: '',
        is_active: true,
    });

    const openDialog = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setData({
                name: category.name,
                description: category.description || '',
                image: category.image || '',
                is_active: category.is_active,
            });
        } else {
            setEditingCategory(null);
            reset();
        }
        setShowDialog(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategory) {
            put(`/categories/${editingCategory.id}`, {
                onSuccess: () => {
                    setShowDialog(false);
                    reset();
                },
            });
        } else {
            post('/categories', {
                onSuccess: () => {
                    setShowDialog(false);
                    reset();
                },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: t('nav.categories'), href: '/categories' }]}>
            <Head title={t('categories.title')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('categories.title')}</h1>
                        <p className="text-muted-foreground">{t('categories.title')}</p>
                    </div>
                    <Button onClick={() => openDialog()} className="backdrop-blur-sm bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('categories.add_category')}
                    </Button>
                </div>

                {/* Search */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="pt-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={`${t('categories.title')}... (${t('shortcuts.focus_search')}: /)`}
                                className="pl-10"
                                defaultValue={filters.search}
                                onChange={(e) => {
                                    router.get('/categories', { search: e.target.value }, {
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Categories Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categories.data.map((category) => (
                        <Card key={category.id} className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <Folder className="h-5 w-5 text-muted-foreground" />
                                        <CardTitle className="text-lg">{category.name}</CardTitle>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => openDialog(category)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => {
                                                if (category.products_count > 0) {
                                                    alert(t('categories.cannot_delete_with_products'));
                                                    return;
                                                }
                                                if (confirm(t('categories.delete_confirm'))) {
                                                    router.delete(`/categories/${category.id}`);
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
                                    {category.description && (
                                        <p className="text-sm text-muted-foreground">{category.description}</p>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">{t('products.title')}:</span>
                                        <Badge variant="secondary">{category.products_count}</Badge>
                                    </div>
                                    {!category.is_active && (
                                        <Badge variant="outline">{t('products.inactive')}</Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Dialog */}
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogContent className="backdrop-blur-sm bg-background/95">
                        <DialogHeader>
                            <DialogTitle>{editingCategory ? t('categories.edit_category') : t('categories.add_category')}</DialogTitle>
                            <DialogDescription>
                                {editingCategory ? t('categories.update_info') : t('categories.create_new')}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>{t('categories.name')} *</Label>
                                <Input
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>
                            <div>
                                <Label>{t('categories.description')}</Label>
                                <textarea
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div>
                                <Label>{t('categories.image_url')}</Label>
                                <Input
                                    value={data.image}
                                    onChange={(e) => setData('image', e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="rounded border-gray-300"
                                />
                                <Label>{t('categories.is_active')}</Label>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {editingCategory ? t('common.update') : t('common.create')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

