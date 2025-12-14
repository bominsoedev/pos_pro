import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';

interface Permission {
    id: number;
    name: string;
    slug: string;
    group: string | null;
}

interface Role {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
    permissions: Permission[];
}

interface RolesPageProps {
    roles: Role[];
    permissions: Record<string, Permission[]>;
}

export default function RolesIndex({ roles, permissions }: RolesPageProps) {
    const { t } = useTranslation();
    const [showDialog, setShowDialog] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        slug: '',
        description: '',
        is_active: true,
        permissions: [] as number[],
    });

    const openDialog = (role?: Role) => {
        if (role) {
            setEditingRole(role);
            setData({
                name: role.name,
                slug: role.slug,
                description: role.description || '',
                is_active: role.is_active,
                permissions: role.permissions.map(p => p.id),
            });
        } else {
            setEditingRole(null);
            reset();
        }
        setShowDialog(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingRole) {
            put(`/roles/${editingRole.id}`, {
                onSuccess: () => {
                    setShowDialog(false);
                    reset();
                },
            });
        } else {
            post('/roles', {
                onSuccess: () => {
                    setShowDialog(false);
                    reset();
                },
            });
        }
    };

    const togglePermission = (permissionId: number) => {
        setData('permissions', data.permissions.includes(permissionId)
            ? data.permissions.filter(id => id !== permissionId)
            : [...data.permissions, permissionId]
        );
    };

    return (
        <AppLayout breadcrumbs={[{ title: t('roles.title'), href: '/roles' }]}>
            <Head title={t('roles.title')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('roles.title')}</h1>
                        <p className="text-muted-foreground">{t('roles.title')}</p>
                    </div>
                    <Button onClick={() => openDialog()} className="backdrop-blur-sm bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('roles.add_role')}
                    </Button>
                </div>

                {/* Roles Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {roles.map((role) => (
                        <Card key={role.id} className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="flex items-center gap-2">
                                            <Shield className="h-5 w-5" />
                                            {role.name}
                                        </CardTitle>
                                        {role.description && (
                                            <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => openDialog(role)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        {role.slug !== 'admin' && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => {
                                                    if (confirm(t('roles.delete_confirm'))) {
                                                        router.delete(`/roles/${role.id}`);
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">{t('shifts.status')}:</span>
                                        <Badge variant={role.is_active ? 'default' : 'outline'}>
                                            {role.is_active ? t('common.active') : t('common.inactive')}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">{t('roles.permissions')}:</span>
                                        <Badge variant="secondary">{role.permissions.length}</Badge>
                                    </div>
                                    {role.permissions.length > 0 && (
                                        <div className="mt-2 pt-2 border-t">
                                            <p className="text-xs text-muted-foreground mb-1">{t('roles.permissions')}:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {role.permissions.slice(0, 5).map((permission) => (
                                                    <Badge key={permission.id} variant="outline" className="text-xs">
                                                        {permission.name}
                                                    </Badge>
                                                ))}
                                                {role.permissions.length > 5 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{role.permissions.length - 5} {t('common.more')}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Dialog */}
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogContent className="backdrop-blur-sm bg-background/95 max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingRole ? t('roles.edit_role') : t('roles.add_role')}</DialogTitle>
                            <DialogDescription>
                                {editingRole ? t('roles.update_info') : t('roles.create_info')}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>{t('roles.role_name')} *</Label>
                                    <Input
                                        value={data.name}
                                        onChange={(e) => {
                                            setData('name', e.target.value);
                                            if (!editingRole) {
                                                setData('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'));
                                            }
                                        }}
                                        required
                                    />
                                    {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                                </div>
                                <div>
                                    <Label>{t('roles.slug')} *</Label>
                                    <Input
                                        value={data.slug}
                                        onChange={(e) => setData('slug', e.target.value)}
                                        required
                                        disabled={editingRole?.slug === 'admin'}
                                    />
                                    {errors.slug && <p className="text-sm text-destructive mt-1">{errors.slug}</p>}
                                </div>
                            </div>
                            <div>
                                <Label>{t('roles.description')}</Label>
                                <Textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={2}
                                />
                                {errors.description && <p className="text-sm text-destructive mt-1">{errors.description}</p>}
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                                />
                                <Label htmlFor="is_active">{t('common.active')}</Label>
                            </div>
                            <div>
                                <Label>{t('roles.permissions')}</Label>
                                <div className="mt-2 space-y-4 max-h-96 overflow-y-auto border rounded p-4">
                                    {Object.entries(permissions).map(([group, groupPermissions]) => (
                                        <div key={group} className="space-y-2">
                                            <h4 className="font-medium text-sm">{group || t('common.other')}</h4>
                                            <div className="grid grid-cols-2 gap-2 ml-4">
                                                {groupPermissions.map((permission) => (
                                                    <div key={permission.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`permission-${permission.id}`}
                                                            checked={data.permissions.includes(permission.id)}
                                                            onCheckedChange={() => togglePermission(permission.id)}
                                                        />
                                                        <Label htmlFor={`permission-${permission.id}`} className="text-sm">
                                                            {permission.name}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {editingRole ? t('common.update') : t('common.create')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

