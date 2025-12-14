import { memo } from 'react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationProps {
    links: PaginationLink[];
}

const Pagination = memo(function Pagination({ links }: PaginationProps) {
    if (!links || links.length <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-2 mt-4">
            {links.map((link, index) => {
                if (index === 0) {
                    // Previous button
                    return (
                        <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            disabled={!link.url}
                            asChild={!!link.url}
                        >
                            {link.url ? (
                                <Link href={link.url}>
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Previous
                                </Link>
                            ) : (
                                <>
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Previous
                                </>
                            )}
                        </Button>
                    );
                }

                if (index === links.length - 1) {
                    // Next button
                    return (
                        <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            disabled={!link.url}
                            asChild={!!link.url}
                        >
                            {link.url ? (
                                <Link href={link.url}>
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Link>
                            ) : (
                                <>
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </>
                            )}
                        </Button>
                    );
                }

                // Page numbers
                if (link.label === '...') {
                    return (
                        <span key={index} className="px-2 text-muted-foreground">
                            ...
                        </span>
                    );
                }

                return (
                    <Button
                        key={index}
                        variant={link.active ? 'default' : 'outline'}
                        size="sm"
                        asChild
                    >
                        <Link href={link.url || '#'}>
                            {link.label}
                        </Link>
                    </Button>
                );
            })}
        </div>
    );
});

export default Pagination;

