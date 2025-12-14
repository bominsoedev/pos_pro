import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTranslation } from '@/hooks/use-translation';
import { Languages, Check } from 'lucide-react';

interface LanguageSwitcherProps {
    variant?: 'header' | 'sidebar';
}

export function LanguageSwitcher({ variant = 'header' }: LanguageSwitcherProps) {
    const { changeLanguage, currentLanguage } = useTranslation();

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
                                >
                                    <Languages className="h-5 w-5" />
                                    {variant === 'sidebar' && (
                                        <span className="text-sm font-medium">
                                            {currentLanguage === 'en' ? 'English' : 'မြန်မာ'}
                                        </span>
                                    )}
                                    <span className="sr-only">Change language</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={variant === 'sidebar' ? 'start' : 'end'} className="backdrop-blur-sm bg-background/95 min-w-[150px]">
                                <DropdownMenuItem
                                    onClick={() => changeLanguage('en')}
                                    className="cursor-pointer flex items-center justify-between"
                                >
                                    <span className="flex-1">English</span>
                                    {currentLanguage === 'en' && (
                                        <Check className="h-4 w-4 ml-2" />
                                    )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => changeLanguage('my')}
                                    className="cursor-pointer flex items-center justify-between"
                                >
                                    <span className="flex-1">မြန်မာ</span>
                                    {currentLanguage === 'my' && (
                                        <Check className="h-4 w-4 ml-2" />
                                    )}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{currentLanguage === 'en' ? 'Switch to Myanmar' : 'Switch to English'}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
