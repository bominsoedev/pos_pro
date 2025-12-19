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
    const { changeLanguage, currentLanguage, t } = useTranslation();

    const buttonClass = variant === 'sidebar' 
        ? "w-full justify-start gap-2 h-auto py-2 px-2 cursor-pointer" 
        : "h-9 w-9";

    if (variant === 'sidebar') {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button 
                        variant="ghost" 
                        size="default"
                        className={buttonClass}
                    >
                        <Languages className="h-5 w-5" />
                        <span className="text-sm font-medium">
                            {currentLanguage === 'en' ? t('common.english') : t('common.myanmar')}
                        </span>
                        <span className="sr-only">{t('common.change_language')}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="backdrop-blur-sm bg-background/95 min-w-[150px] z-50">
                    <DropdownMenuItem
                        onClick={() => changeLanguage('en')}
                        className="cursor-pointer flex items-center justify-between"
                    >
                        <span className="flex-1">{t('common.english')}</span>
                        {currentLanguage === 'en' && (
                            <Check className="h-4 w-4 ml-2" />
                        )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => changeLanguage('my')}
                        className="cursor-pointer flex items-center justify-between"
                    >
                        <span className="flex-1">{t('common.myanmar')}</span>
                        {currentLanguage === 'my' && (
                            <Check className="h-4 w-4 ml-2" />
                        )}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    const button = (
        <Button 
            variant="ghost" 
            size="icon"
            className={buttonClass}
        >
            <Languages className="h-5 w-5" />
            <span className="sr-only">{t('common.change_language')}</span>
        </Button>
    );

    const dropdownMenu = (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {button}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="backdrop-blur-sm bg-background/95 min-w-[150px]">
                <DropdownMenuItem
                    onClick={() => changeLanguage('en')}
                    className="cursor-pointer flex items-center justify-between"
                >
                    <span className="flex-1">{t('common.english')}</span>
                    {currentLanguage === 'en' && (
                        <Check className="h-4 w-4 ml-2" />
                    )}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => changeLanguage('my')}
                    className="cursor-pointer flex items-center justify-between"
                >
                    <span className="flex-1">{t('common.myanmar')}</span>
                    {currentLanguage === 'my' && (
                        <Check className="h-4 w-4 ml-2" />
                    )}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <TooltipProvider delayDuration={0}>
            <Tooltip>
                <TooltipTrigger asChild>
                    {dropdownMenu}
                </TooltipTrigger>
                <TooltipContent>
                    <p>{currentLanguage === 'en' ? t('common.switch_to_myanmar') : t('common.switch_to_english')}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
