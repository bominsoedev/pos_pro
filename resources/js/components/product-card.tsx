import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface ProductCardProps {
    product: {
        id: number;
        name: string;
        sku: string | null;
        price: number | string;
        stock_quantity: number | string;
        image: string | null;
        category: { name: string } | null;
        is_active: boolean;
    };
    isSelected: boolean;
    onSelect: (id: number, checked: boolean) => void;
    onEdit: (product: any) => void;
    onDelete: (product: any) => void;
}

const ProductCard = memo(function ProductCard({
    product,
    isSelected,
    onSelect,
    onEdit,
    onDelete,
}: ProductCardProps) {
    const { t } = useTranslation();

    return (
        <Card 
            className={`backdrop-blur-sm bg-background/80 border-sidebar-border/70 ${isSelected ? 'ring-2 ring-primary' : ''}`}
        >
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => onSelect(product.id, e.target.checked)}
                            className="rounded border-gray-300"
                        />
                        <div className="flex-1">
                            <CardTitle className="text-lg">{product.name}</CardTitle>
                            {product.sku && (
                                <p className="text-sm text-muted-foreground">
                                    {t('products.sku_label')}: {product.sku}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(product)}
                            className="h-8 w-8"
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(product)}
                            className="h-8 w-8 text-destructive"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {product.image && (
                    <div className="mb-4 aspect-square w-full overflow-hidden rounded-lg bg-muted">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                        />
                    </div>
                )}
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('products.price_label')}:</span>
                        <span className="font-bold text-primary">{formatPrice(Number(product.price))}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('products.stock_label')}:</span>
                        <Badge variant={Number(product.stock_quantity) > 0 ? 'default' : 'destructive'}>
                            {product.stock_quantity}
                        </Badge>
                    </div>
                    {product.category && (
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">{t('products.category_label')}:</span>
                            <span className="text-sm">{product.category.name}</span>
                        </div>
                    )}
                    {!product.is_active && (
                        <Badge variant="secondary" className="w-full justify-center">
                            {t('products.inactive')}
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
});

export default ProductCard;

