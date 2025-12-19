import { memo, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';

const Toast = memo(function Toast() {
    const { t } = useTranslation();
    const { flash } = usePage().props as any;
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [type, setType] = useState<'success' | 'error' | null>(null);

    useEffect(() => {
        if (flash?.success) {
            setMessage(flash.success);
            setType('success');
            setVisible(true);
            setTimeout(() => setVisible(false), 5000);
        } else if (flash?.error) {
            setMessage(flash.error);
            setType('error');
            setVisible(true);
            setTimeout(() => setVisible(false), 5000);
        }
    }, [flash]);

    if (!visible || !message) return null;

    return (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5">
            <Alert
                variant={type === 'error' ? 'destructive' : 'default'}
                className="min-w-[300px] shadow-lg"
            >
                <div className="flex items-start gap-3">
                    {type === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                        <XCircle className="h-5 w-5" />
                    )}
                    <div className="flex-1">
                        <AlertTitle>
                            {type === 'success' ? t('common.success') : t('common.error')}
                        </AlertTitle>
                        <AlertDescription>{message}</AlertDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setVisible(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </Alert>
        </div>
    );
});

export default Toast;

