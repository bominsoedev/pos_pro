import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
// import { pos } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm, Link } from '@inertiajs/react';
import { 
    ShoppingCart, 
    Plus, 
    Minus, 
    Trash2, 
    Search,
    CreditCard,
    X,
    ScanLine,
    Printer,
    Percent,
    Keyboard,
    Layers
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';
import { useDebounce } from '@/hooks/use-debounce';

const getBreadcrumbs = (t: (key: string) => string): BreadcrumbItem[] => [
    {
        title: t('nav.pos'),
        href: '/pos',
    },
];

interface CartItem {
    product_id: number;
    product_name: string;
    price: number;
    quantity: number;
    discount: number;
    subtotal: number;
    total: number;
}

interface Cart {
    id: string;
    items: CartItem[];
    customer_id: number | null;
    discountAmount: number;
    discountCode: string;
    name?: string;
}

interface PosProps {
    products: {
        data: any[];
        links: any;
    };
    categories: any[];
    customers: any[];
    taxRate?: number;
    filters: {
        search?: string;
        category_id?: number;
    };
}

export default function Pos({ products, categories, customers, taxRate = 0, filters }: PosProps) {
    const { t, currentLanguage } = useTranslation();
    const breadcrumbs = getBreadcrumbs(t);
    
    const [carts, setCarts] = useState<Cart[]>([{
        id: '1',
        items: [],
        customer_id: null,
        discountAmount: 0,
        discountCode: '',
        name: t('pos.cart') + ' 1',
    }]);
    const [activeCartId, setActiveCartId] = useState<string>('1');
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [barcodeInput, setBarcodeInput] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const barcodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [nextCartNumber, setNextCartNumber] = useState(2);
    const [searchInput, setSearchInput] = useState(filters.search || '');
    const debouncedSearch = useDebounce(searchInput, 500);

    // Get active cart
    const activeCart = carts.find(c => c.id === activeCartId) || carts[0];
    const cart = activeCart.items;
    const selectedCustomer = activeCart.customer_id;
    const discountAmount = activeCart.discountAmount;
    const discountCode = activeCart.discountCode;

    const { data, setData, post, processing, errors } = useForm({
        customer_id: null as number | null,
        items: [] as any[],
        tax_rate: 0,
        discount_amount: 0,
        notes: '',
        payment_method: 'cash',
        payment_amount: 0,
    });

    const updateCart = useCallback((cartId: string, updater: (cart: Cart) => Cart) => {
        setCarts(prevCarts => prevCarts.map(c => c.id === cartId ? updater(c) : c));
    }, []);

    const addToCart = useCallback((product: any) => {
        const stockQty = Number(product.stock_quantity) || 0;
        if (product.track_inventory && stockQty <= 0) {
            alert(t('pos.out_of_stock'));
            return;
        }

        const currentCart = activeCart;
        const existingItem = currentCart.items.find(item => item.product_id === product.id);
        
        if (existingItem) {
            if (product.track_inventory && existingItem.quantity >= stockQty) {
                alert(t('pos.insufficient_stock'));
                return;
            }
            updateCart(activeCartId, (cart) => ({
                ...cart,
                items: cart.items.map(item =>
                    item.product_id === product.id
                        ? {
                            ...item,
                            quantity: item.quantity + 1,
                            subtotal: (item.price * (item.quantity + 1)),
                            total: (item.price * (item.quantity + 1)) - item.discount,
                        }
                        : item
                ),
            }));
        } else {
            const price = Number(product.price);
            updateCart(activeCartId, (cart) => ({
                ...cart,
                items: [...cart.items, {
                    product_id: product.id,
                    product_name: product.name,
                    price: price,
                    quantity: 1,
                    discount: 0,
                    subtotal: price,
                    total: price,
                }],
            }));
        }
    }, [activeCart, activeCartId, updateCart, t]);

    const updateQuantity = useCallback((productId: number, change: number) => {
        updateCart(activeCartId, (cart) => ({
            ...cart,
            items: cart.items.map(item => {
                if (item.product_id === productId) {
                    const newQuantity = item.quantity + change;
                    if (newQuantity <= 0) return null;
                    return {
                        ...item,
                        quantity: newQuantity,
                        subtotal: item.price * newQuantity,
                        total: (item.price * newQuantity) - item.discount,
                    };
                }
                return item;
            }).filter(Boolean) as CartItem[],
        }));
    }, [activeCartId, updateCart]);

    const removeFromCart = useCallback((productId: number) => {
        updateCart(activeCartId, (cart) => ({
            ...cart,
            items: cart.items.filter(item => item.product_id !== productId),
        }));
    }, [activeCartId, updateCart]);

    const createNewCart = () => {
        const newCartId = nextCartNumber.toString();
        const newCart: Cart = {
            id: newCartId,
            items: [],
            customer_id: null,
            discountAmount: 0,
            discountCode: '',
            name: `Cart ${nextCartNumber}`,
        };
        setCarts([...carts, newCart]);
        setActiveCartId(newCartId);
        setNextCartNumber(nextCartNumber + 1);
    };

    const deleteCart = (cartId: string) => {
        if (carts.length <= 1) {
            alert(t('pos.cart') + ' - ' + t('common.cannot_delete'));
            return;
        }
        const newCarts = carts.filter(c => c.id !== cartId);
        setCarts(newCarts);
        if (activeCartId === cartId) {
            setActiveCartId(newCarts[0].id);
        }
    };

    // Barcode scanner handler
    const handleBarcodeScan = async (barcode: string) => {
        if (!barcode || barcode.trim().length < 2) {
            setBarcodeInput('');
            return;
        }

        const trimmedBarcode = barcode.trim();
        setIsScanning(true);

        try {
            const response = await fetch(`/pos/barcode?barcode=${encodeURIComponent(trimmedBarcode)}`);
            
            if (response.ok) {
                const product = await response.json();
                
                // Check stock before adding
                const stockQty = Number(product.stock_quantity) || 0;
                if (product.track_inventory && stockQty <= 0) {
                    alert(`${t('pos.out_of_stock')}: "${product.name}"`);
                    setBarcodeInput('');
                    setIsScanning(false);
                    barcodeInputRef.current?.focus();
                    return;
                }

                addToCart(product);
                setBarcodeInput('');
                
                // Visual feedback - briefly show success
                setTimeout(() => {
                    setIsScanning(false);
                    barcodeInputRef.current?.focus();
                }, 300);
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(errorData.error || t('pos.barcode_not_found', { barcode: trimmedBarcode }));
                setBarcodeInput('');
                setIsScanning(false);
                barcodeInputRef.current?.focus();
            }
        } catch (error) {
            console.error('Barcode scan error:', error);
            alert(t('pos.error_scanning_barcode'));
            setBarcodeInput('');
            setIsScanning(false);
            barcodeInputRef.current?.focus();
        }
    };

    // Handle barcode input with auto-scan (for barcode scanners that send data quickly)
    useEffect(() => {
        // Clear any existing timeout
        if (barcodeTimeoutRef.current) {
            clearTimeout(barcodeTimeoutRef.current);
        }

        // If barcode input is empty, reset scanning state
        if (!barcodeInput) {
            setIsScanning(false);
            return;
        }

        // Set timeout to auto-scan after user stops typing (barcode scanners send data very quickly)
        // This handles barcode scanners that don't send Enter key
        barcodeTimeoutRef.current = setTimeout(() => {
            if (barcodeInput.length >= 3) {
                handleBarcodeScan(barcodeInput);
            }
        }, 500); // 500ms delay - barcode scanners typically send all data within 100-200ms

        return () => {
            if (barcodeTimeoutRef.current) {
                clearTimeout(barcodeTimeoutRef.current);
            }
        };
    }, [barcodeInput]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Focus barcode input on any key press when not in input field
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // F1 - Focus barcode scanner
            if (e.key === 'F1') {
                e.preventDefault();
                barcodeInputRef.current?.focus();
                barcodeInputRef.current?.select();
            }
            // F2 - Checkout
            else if (e.key === 'F2' && cart.length > 0) {
                e.preventDefault();
                handleCheckout();
            }
            // F3 - Clear cart
            else if (e.key === 'F3') {
                e.preventDefault();
                updateCart(activeCartId, (cart) => ({
                    ...cart,
                    items: [],
                    discountAmount: 0,
                    discountCode: '',
                }));
            }
            // Enter - Checkout if cart has items
            else if (e.key === 'Enter' && cart.length > 0 && !showPaymentDialog) {
                e.preventDefault();
                handleCheckout();
            }
            // Escape - Close dialogs
            else if (e.key === 'Escape') {
                setShowPaymentDialog(false);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [cart, showPaymentDialog]);

    const calculateTotals = useCallback(() => {
        const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
        const tax = subtotal * (taxRate / 100);
        const total = subtotal + tax - discountAmount;
        return { subtotal, tax, total };
    }, [cart, taxRate, discountAmount]);

    const { subtotal, tax, total } = useMemo(() => calculateTotals(), [calculateTotals]);

    const applyDiscount = useCallback((code: string) => {
        // Simple discount codes - can be enhanced with database lookup
        const discounts: Record<string, number> = {
            'SAVE10': 10,
            'SAVE20': 20,
            'SAVE50': 50,
        };

        const discount = discounts[code.toUpperCase()] || 0;
        if (discount > 0) {
            const { subtotal } = calculateTotals();
            updateCart(activeCartId, (cart) => ({
                ...cart,
                discountAmount: (subtotal * discount) / 100,
                discountCode: code,
            }));
            alert(t('pos.discount_applied', { discount }));
        } else {
            alert(t('pos.invalid_discount_code'));
        }
    }, [calculateTotals, activeCartId, updateCart, t]);

    const handleCheckout = useCallback(() => {
        if (cart.length === 0) {
            alert(t('pos.cart_empty'));
            return;
        }

        const { total } = calculateTotals();
        setData({
            customer_id: selectedCustomer,
            items: cart.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price,
                discount: item.discount,
            })),
            tax_rate: taxRate,
            discount_amount: discountAmount,
            discount_code: discountCode || null,
            notes: '',
            payment_method: paymentMethod,
            payment_amount: total,
        });
        setShowPaymentDialog(true);
    }, [cart, calculateTotals, selectedCustomer, taxRate, discountAmount, discountCode, paymentMethod, setData, t]);

    const handlePayment = () => {
        const { total } = calculateTotals();
        post('/orders', {
            onSuccess: (page: any) => {
                // Clear the active cart after successful payment
                updateCart(activeCartId, (cart) => ({
                    ...cart,
                    items: [],
                    customer_id: null,
                    discountAmount: 0,
                    discountCode: '',
                }));
                setShowPaymentDialog(false);
                
                // Get order ID from various possible locations
                let orderId = null;
                
                // Try to get from order object in props
                if (page?.props?.order?.id) {
                    orderId = page.props.order.id;
                }
                // Try to get from flash message
                else if (page?.props?.flash?.order_id) {
                    orderId = page.props.flash.order_id;
                }
                // Try to extract from URL
                else if (page?.url) {
                    const match = page.url.match(/\/orders\/(\d+)/);
                    if (match) {
                        orderId = match[1];
                    }
                }
                
                // Open receipt in new window for printing
                if (orderId) {
                    setTimeout(() => {
                        const receiptWindow = window.open(`/orders/${orderId}/receipt`, '_blank');
                        if (receiptWindow) {
                            receiptWindow.onload = () => {
                                setTimeout(() => {
                                    receiptWindow.print();
                                }, 500);
                            };
                        }
                    }, 100);
                }
            },
            onError: (errors) => {
                console.error('Payment error:', errors);
                alert(t('pos.error_processing_payment'));
            },
        });
    };


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('pos.title')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-hidden p-4">
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Product Grid */}
                    <div className="md:col-span-2 flex flex-col gap-4">
                        {/* Search and Filters */}
                        <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                            <CardContent className="pt-6">
                                <div className="space-y-2">
                                    {/* Barcode Scanner Input */}
                                    <div className="relative">
                                        <ScanLine className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isScanning ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                                        <Input
                                            ref={barcodeInputRef}
                                            placeholder={t('pos.scan_barcode') + ' (F1)'}
                                            className={`pl-10 font-mono ${isScanning ? 'border-primary ring-2 ring-primary' : ''}`}
                                            value={barcodeInput}
                                            disabled={isScanning}
                                            onChange={(e) => {
                                                setBarcodeInput(e.target.value);
                                            }}
                                            onKeyDown={async (e) => {
                                                // Enter key - scan immediately
                                                if (e.key === 'Enter' && barcodeInput.length >= 2) {
                                                    e.preventDefault();
                                                    // Clear timeout since we're scanning manually
                                                    if (barcodeTimeoutRef.current) {
                                                        clearTimeout(barcodeTimeoutRef.current);
                                                    }
                                                    await handleBarcodeScan(barcodeInput);
                                                }
                                                // Escape key - clear input
                                                else if (e.key === 'Escape') {
                                                    setBarcodeInput('');
                                                    setIsScanning(false);
                                                }
                                            }}
                                            autoFocus
                                        />
                                        {isScanning && (
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                                            </div>
                                        )}
                                    </div>
                                    {barcodeInput && !isScanning && (
                                        <p className="text-xs text-muted-foreground px-1">
                                            {t('pos.press_enter_to_scan')}
                                        </p>
                                    )}
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder={t('pos.search_products')}
                                                className="pl-10"
                                                value={searchInput}
                                                onChange={(e) => {
                                                    setSearchInput(e.target.value);
                                                }}
                                            />
                                        </div>
                                        <Select
                                            value={filters.category_id?.toString() || 'all'}
                                            onValueChange={(value) => {
                                                router.get('/pos', { 
                                                    search: filters.search, 
                                                    category_id: value === 'all' ? null : parseInt(value) 
                                                }, {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                });
                                            }}
                                        >
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder={t('pos.all_categories')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{t('pos.all_categories')}</SelectItem>
                                                {categories.map((category) => (
                                                    <SelectItem key={category.id} value={category.id.toString()}>
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Products Grid */}
                        <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70 flex-1 overflow-hidden">
                            <CardContent className="pt-6 overflow-y-auto h-full">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {products.data.map((product) => (
                                        <button
                                            key={product.id}
                                            onClick={() => addToCart(product)}
                                            disabled={product.track_inventory && (Number(product.stock_quantity) || 0) <= 0}
                                            className="group relative p-4 rounded-lg border border-sidebar-border/70 hover:border-primary/50 transition-all backdrop-blur-sm bg-background/60 hover:bg-background/80 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {product.image && (
                                                <img 
                                                    src={product.image} 
                                                    alt={product.name}
                                                    className="w-full h-24 object-cover rounded mb-2"
                                                />
                                            )}
                                            <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
                                            <p className="text-lg font-bold text-primary">{formatPrice(product.price, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</p>
                                            {product.track_inventory && (
                                                    <Badge variant={(Number(product.stock_quantity) || 0) <= (Number(product.low_stock_threshold) || 0) ? 'destructive' : 'secondary'} className="mt-1">
                                                    {t('pos.stock')}: {product.stock_quantity}
                                                </Badge>
                                            )}
                                            <div className="absolute inset-0 flex items-center justify-center bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                                <Plus className="h-8 w-8 text-primary" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Cart Sidebar */}
                    <div className="flex flex-col gap-4">
                        <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70 flex-1 flex flex-col overflow-hidden">
                            <CardHeader>
                                <div className="flex items-center justify-between mb-2">
                                    <CardTitle className="flex items-center gap-2">
                                        <ShoppingCart className="h-5 w-5" />
                                        {activeCart.name || `Cart ${activeCartId}`} ({cart.length})
                                    </CardTitle>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={createNewCart}
                                        title={t('pos.new_cart')}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                {/* Cart Tabs */}
                                <div className="flex gap-1 overflow-x-auto pb-2">
                                    {carts.map((c) => {
                                        const cartTotal = c.items.reduce((sum, item) => sum + item.total, 0);
                                        const cartTax = cartTotal * (taxRate / 100);
                                        const cartFinalTotal = cartTotal + cartTax - c.discountAmount;
                                        return (
                                            <button
                                                key={c.id}
                                                onClick={() => setActiveCartId(c.id)}
                                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                                                    activeCartId === c.id
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-muted hover:bg-muted/80'
                                                }`}
                                            >
                                                <div className="flex items-center gap-1">
                                                    <span>{c.name || `Cart ${c.id}`}</span>
                                                    {c.items.length > 0 && (
                                                        <Badge variant="secondary" className="ml-1 text-xs">
                                                            {c.items.length}
                                                        </Badge>
                                                    )}
                                                    {carts.length > 1 && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const cartName = c.name || t('pos.cart_number', { number: c.id });
                                                                if (confirm(`${t('pos.delete_cart_confirm')} ${cartName}?`)) {
                                                                    deleteCart(c.id);
                                                                }
                                                            }}
                                                            className="ml-1 hover:text-destructive"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto">
                                {cart.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        {t('pos.cart_empty')}
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {cart.map((item) => (
                                            <div key={item.product_id} className="p-3 rounded-lg border border-sidebar-border/70 backdrop-blur-sm bg-background/60">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-sm">{item.product_name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatPrice(item.price, currentLanguage === 'my' ? 'my-MM' : 'en-US')} × {item.quantity}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFromCart(item.product_id)}
                                                        className="text-destructive hover:text-destructive/80"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="icon"
                                                            variant="outline"
                                                            className="h-7 w-7"
                                                            onClick={() => updateQuantity(item.product_id, -1)}
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                                                        <Button
                                                            size="icon"
                                                            variant="outline"
                                                            className="h-7 w-7"
                                                            onClick={() => updateQuantity(item.product_id, 1)}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                    <p className="font-bold">{formatPrice(item.total, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                            {cart.length > 0 && (
                                <div className="border-t p-4 space-y-3">
                                    {/* Discount Code */}
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <Percent className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder={t('pos.discount_code')}
                                                className="pl-8 text-sm"
                                                value={discountCode}
                                                onChange={(e) => {
                                                    updateCart(activeCartId, (cart) => ({
                                                        ...cart,
                                                        discountCode: e.target.value,
                                                    }));
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && discountCode) {
                                                        applyDiscount(discountCode);
                                                    }
                                                }}
                                            />
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => discountCode && applyDiscount(discountCode)}
                                        >
                                            {t('pos.apply')}
                                        </Button>
                                    </div>
                                    
                                    <div className="flex justify-between text-sm">
                                        <span>{t('pos.subtotal')}:</span>
                                        <span>{formatPrice(subtotal, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                    </div>
                                    {tax > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span>{t('pos.tax')}:</span>
                                            <span>{formatPrice(tax, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                        </div>
                                    )}
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between text-sm text-destructive">
                                            <span>{t('pos.discount')} {discountCode && `(${discountCode})`}:</span>
                                            <span>-{formatPrice(discountAmount, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                        <span>{t('pos.total')}:</span>
                                        <span>{formatPrice(total, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                    </div>
                                    
                                    {/* Keyboard Shortcuts Hint */}
                                    <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                                        <div className="flex items-center gap-2">
                                            <Keyboard className="h-3 w-3" />
                                            <span>{t('pos.shortcuts')}: {t('pos.shortcut_barcode')} | {t('pos.shortcut_checkout')} | {t('pos.shortcut_clear')}</span>
                                        </div>
                                    </div>
                                    
                                    <Button 
                                        className="w-full" 
                                        size="lg"
                                        onClick={handleCheckout}
                                    >
                                        <CreditCard className="mr-2 h-5 w-5" />
                                        {t('pos.checkout')} (F2)
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>

                {/* Payment Dialog */}
                <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                    <DialogContent className="backdrop-blur-sm bg-background/95">
                        <DialogHeader>
                            <DialogTitle>{t('pos.complete_payment')}</DialogTitle>
                            <DialogDescription>
                                {t('pos.select_payment_method')}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>{t('pos.customer')} ({t('common.optional')})</Label>
                                <Select
                                    value={selectedCustomer?.toString() || 'none'}
                                    onValueChange={(value) => {
                                        updateCart(activeCartId, (cart) => ({
                                            ...cart,
                                            customer_id: value === 'none' ? null : parseInt(value),
                                        }));
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('pos.customer')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">{t('pos.walk_in')}</SelectItem>
                                        {customers.map((customer) => (
                                            <SelectItem key={customer.id} value={customer.id.toString()}>
                                                {customer.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>{t('pos.payment_method')}</Label>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">{t('pos.cash')}</SelectItem>
                                        <SelectItem value="card">{t('pos.card')}</SelectItem>
                                        <SelectItem value="mobile_payment">{t('pos.mobile_payment')}</SelectItem>
                                        <SelectItem value="bank_transfer">{t('pos.bank_transfer')}</SelectItem>
                                        <SelectItem value="other">{t('pos.other')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="p-4 rounded-lg border bg-muted/50">
                                <div className="flex justify-between text-lg font-bold">
                                    <span>{t('pos.total')}:</span>
                                    <span>{formatPrice(total, currentLanguage === 'my' ? 'my-MM' : 'en-US')}</span>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                                {t('common.cancel')}
                            </Button>
                            <Button onClick={handlePayment} disabled={processing}>
                                {t('pos.complete_payment')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

