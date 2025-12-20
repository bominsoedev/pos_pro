import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Download, Upload, Trash2, Database, FileDown, AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface Backup {
    filename: string;
    size: number;
    created_at: string;
}

interface BackupPageProps {
    backups: Backup[];
}

export default function BackupIndex({ backups }: BackupPageProps) {
    const { t, currentLanguage } = useTranslation();
    const [showRestoreDialog, setShowRestoreDialog] = useState(false);
    const { data, setData, post, processing } = useForm({
        backup_file: null as File | null,
    });

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const handleCreateBackup = () => {
        if (confirm(t('backup.create_confirm'))) {
            router.post('/backup/create', {}, {
                preserveScroll: true,
            });
        }
    };

    const handleRestore = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.backup_file) {
            alert(t('backup.select_file'));
            return;
        }

        if (confirm(t('backup.restore_warning'))) {
            post('/backup/restore', {
                forceFormData: true,
                onSuccess: () => {
                    setShowRestoreDialog(false);
                    setData({ backup_file: null });
                },
            });
        }
    };

    const handleDelete = (filename: string) => {
        if (confirm(t('backup.delete_backup') + ' ' + filename + '?')) {
            router.delete(`/backup/${filename}`, {
                preserveScroll: true,
            });
        }
    };

    const handleExport = (type: string) => {
        window.location.href = `/backup/export?type=${type}`;
    };

    return (
        <AppLayout breadcrumbs={[{ title: t('backup.title'), href: '/backup' }]}>
            <Head title={t('backup.title')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('backup.title')}</h1>
                        <p className="text-muted-foreground">{t('backup.title')}</p>
                    </div>
                    <Button onClick={handleCreateBackup} className="backdrop-blur-sm bg-primary/90">
                        <Database className="mr-2 h-4 w-4" />
                        {t('backup.create_backup')}
                    </Button>
                </div>

                {/* Actions */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('backup.database_backup')}</CardTitle>
                            <CardDescription>
                                {t('backup.database_backup_desc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button onClick={handleCreateBackup} className="w-full" variant="outline">
                                <Database className="mr-2 h-4 w-4" />
                                {t('backup.create_backup')}
                            </Button>
                            <Button 
                                onClick={() => setShowRestoreDialog(true)} 
                                className="w-full" 
                                variant="outline"
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                {t('backup.restore_backup')}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>{t('backup.export_data')}</CardTitle>
                            <CardDescription>
                                {t('backup.export_data_desc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button 
                                onClick={() => handleExport('all')} 
                                className="w-full" 
                                variant="outline"
                            >
                                <FileDown className="mr-2 h-4 w-4" />
                                {t('backup.export_all')}
                            </Button>
                            <div className="grid grid-cols-3 gap-2">
                                <Button 
                                    onClick={() => handleExport('products')} 
                                    variant="outline"
                                    size="sm"
                                >
                                    {t('nav.products')}
                                </Button>
                                <Button 
                                    onClick={() => handleExport('customers')} 
                                    variant="outline"
                                    size="sm"
                                >
                                    {t('nav.customers')}
                                </Button>
                                <Button 
                                    onClick={() => handleExport('orders')} 
                                    variant="outline"
                                    size="sm"
                                >
                                    {t('nav.orders')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Backup List */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>{t('backup.backup_history')}</CardTitle>
                        <CardDescription>
                            {t('backup.backup_history_desc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {backups.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2">{t('backup.filename')}</th>
                                            <th className="text-left p-2">{t('backup.size')}</th>
                                            <th className="text-left p-2">{t('backup.created')}</th>
                                            <th className="text-right p-2">{t('backup.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {backups.map((backup) => (
                                            <tr key={backup.filename} className="border-b hover:bg-muted/50">
                                                <td className="p-2 font-mono text-sm">{backup.filename}</td>
                                                <td className="p-2">{formatFileSize(backup.size)}</td>
                                                <td className="p-2">{new Date(backup.created_at).toLocaleString(currentLanguage === 'my' ? 'my-MM' : 'en-US')}</td>
                                                <td className="p-2 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                window.location.href = `/backup/${backup.filename}/download`;
                                                            }}
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(backup.filename)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">{t('backup.no_backups')}</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {t('backup.create_first_backup')}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Restore Dialog */}
                <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
                    <DialogContent className="backdrop-blur-sm bg-background/95">
                        <DialogHeader>
                            <DialogTitle>{t('backup.restore_title')}</DialogTitle>
                            <DialogDescription>
                                <div className="flex items-start gap-2 mt-2 p-3 bg-destructive/10 border border-destructive/50 rounded">
                                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                                    <div>
                                        <p className="font-medium text-destructive">{t('backup.warning')}</p>
                                        <p className="text-sm">
                                            {t('backup.restore_warning')}
                                        </p>
                                    </div>
                                </div>
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleRestore} className="space-y-4">
                            <div>
                                <Label>{t('backup.select_backup_file')}</Label>
                                <Input
                                    type="file"
                                    accept=".sql"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setData('backup_file', file);
                                        }
                                    }}
                                    required
                                />
                            </div>
                            <DialogFooter>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setShowRestoreDialog(false)}
                                >
                                    {t('common.cancel')}
                                </Button>
                                <Button 
                                    type="submit" 
                                    variant="destructive" 
                                    disabled={processing || !data.backup_file}
                                >
                                    {t('backup.restore_button')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

