import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTranslation } from '@/hooks/use-translation';
import { router, usePage } from '@inertiajs/react';
import { MapPin, Check, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Way {
    id: number;
    name: string;
    code: string;
    description?: string;
}

interface WaySelectorProps {
    variant?: 'header' | 'sidebar';
    currentWayId?: number | null;
    ways?: Way[];
}

export function WaySelector({ variant = 'header', currentWayId, ways: initialWays }: WaySelectorProps) {
    const { t } = useTranslation();
    const page = usePage();
    const sharedData = page.props as any;
    
    // Get ways and current way from shared props
    const sharedWays = sharedData?.ways || [];
    const sharedCurrentWay = sharedData?.currentWay || null;
    
    const [ways, setWays] = useState<Way[]>(initialWays || sharedWays);
    const [loading, setLoading] = useState(false);
    const [currentWay, setCurrentWay] = useState<Way | null>(
        sharedCurrentWay || initialWays?.find(w => w.id === currentWayId) || null
    );

    // Update current way when shared data changes
    useEffect(() => {
        if (sharedCurrentWay) {
            setCurrentWay(sharedCurrentWay);
        }
    }, [sharedCurrentWay]);

    // Use shared ways if available
    useEffect(() => {
        if (sharedWays.length > 0) {
            setWays(sharedWays);
        } else if (initialWays && initialWays.length > 0) {
            setWays(initialWays);
        }
    }, [initialWays, sharedWays]);

    const handleWayChange = (wayId: number | null) => {
        setLoading(true);
        router.post('/ways/set-current', { way_id: wayId }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: (page) => {
                const selectedWay = ways.find(w => w.id === wayId) || null;
                setCurrentWay(selectedWay);
                setLoading(false);
                // Reload page to apply filters
                router.reload({ only: ['currentWay'] });
            },
            onError: () => {
                setLoading(false);
            },
        });
    };

    const buttonClass = variant === 'sidebar' 
        ? "w-full justify-start gap-2 h-auto py-2 px-2" 
        : "h-9 w-9";

    return (
        <TooltipProvider delayDuration={0}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size={variant === 'sidebar' ? 'default' : 'icon'}
                                    className={buttonClass}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <MapPin className="h-5 w-5" />
                                    )}
                                    {variant === 'sidebar' && (
                                        <span className="text-sm font-medium truncate">
                                            {currentWay ? currentWay.name : t('ways.all_ways')}
                                        </span>
                                    )}
                                    <span className="sr-only">{t('ways.select_way')}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={variant === 'sidebar' ? 'start' : 'end'} className="backdrop-blur-sm bg-background/95 min-w-[200px] max-w-[300px]">
                                <DropdownMenuLabel className="text-xs text-muted-foreground">
                                    {t('ways.select_way')}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => handleWayChange(null)}
                                    className="cursor-pointer flex items-center justify-between"
                                >
                                    <span className="flex-1">{t('ways.all_ways')}</span>
                                    {!currentWay && (
                                        <Check className="h-4 w-4 ml-2" />
                                    )}
                                </DropdownMenuItem>
                                {ways.length > 0 && <DropdownMenuSeparator />}
                                {ways.map((way) => (
                                    <DropdownMenuItem
                                        key={way.id}
                                        onClick={() => handleWayChange(way.id)}
                                        className="cursor-pointer flex items-center justify-between"
                                    >
                                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                            <span className="text-sm font-medium truncate">{way.name}</span>
                                            {way.description && (
                                                <span className="text-xs text-muted-foreground truncate">
                                                    {way.description}
                                                </span>
                                            )}
                                        </div>
                                        {currentWay?.id === way.id && (
                                            <Check className="h-4 w-4 ml-2 flex-shrink-0" />
                                        )}
                                    </DropdownMenuItem>
                                ))}
                                {ways.length === 0 && !loading && (
                                    <DropdownMenuItem disabled className="text-muted-foreground">
                                        {t('ways.no_ways_available')}
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t('ways.select_way_tooltip')}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
