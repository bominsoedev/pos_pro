import { Head } from '@inertiajs/react';
import { useEffect } from 'react';
import { Printer } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface OrderItem {
    id: number;
    product_name: string;
    price: number;
    quantity: number;
    subtotal: number;
    discount: number;
    total: number;
}

interface Payment {
    id: number;
    method: string;
    amount: number;
    created_at: string;
}

interface Order {
    id: number;
    order_number: string;
    status: string;
    payment_status: string;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total: number;
    notes: string | null;
    created_at: string;
    customer: { name: string; email: string | null; phone: string | null } | null;
    user: { name: string } | null;
    items: OrderItem[];
    payments: Payment[];
}

interface ReceiptProps {
    order: Order;
    settings?: {
        store_name: string;
        store_address: string;
        store_phone: string;
        receipt_header: string;
        receipt_footer: string;
        receipt_logo: string;
        receipt_show_logo: boolean;
        receipt_show_barcode: boolean;
        receipt_show_tax_details: boolean;
    };
}

export default function Receipt({ order, settings }: ReceiptProps) {
    const storeName = settings?.store_name || '24 HOUR STORE';
    const storeAddress = settings?.store_address || '';
    const storePhone = settings?.store_phone || '';
    const receiptHeader = settings?.receipt_header || 'Thank you for your purchase!';
    const receiptFooter = settings?.receipt_footer || 'Have a great day!';
    useEffect(() => {
        // Auto-print when page loads
        window.onload = () => {
            setTimeout(() => {
                window.print();
            }, 500);
        };
    }, []);


    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <>
            <Head title={`Receipt - ${order.order_number}`} />
            <div className="min-h-screen bg-white p-8 print:p-4">
                {/* Print Button - Hidden when printing */}
                <div className="mb-4 print:hidden">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                    >
                        <Printer className="h-4 w-4" />
                        Print Receipt
                    </button>
                </div>

                {/* Receipt Content */}
                <div className="max-w-md mx-auto bg-white border-2 border-gray-300 p-6 print:border-0">
                    {/* Header */}
                    <div className="text-center mb-6 border-b pb-4">
                        {settings?.receipt_show_logo && settings?.receipt_logo && (
                            <div className="mb-3">
                                <img 
                                    src={settings.receipt_logo} 
                                    alt="Store Logo" 
                                    className="max-h-20 mx-auto object-contain"
                                />
                            </div>
                        )}
                        <h1 className="text-2xl font-bold mb-2">{storeName}</h1>
                        {storeAddress && (
                            <p className="text-sm text-gray-600 mb-1">{storeAddress}</p>
                        )}
                        {storePhone && (
                            <p className="text-sm text-gray-600 mb-1">Phone: {storePhone}</p>
                        )}
                        <p className="text-sm text-gray-600 mt-2">{receiptHeader}</p>
                        {settings?.receipt_show_barcode && (
                            <div className="mt-3">
                                <div className="inline-block p-2 bg-gray-100">
                                    {/* Simple barcode representation - can be enhanced with barcode library */}
                                    <div className="text-xs font-mono">{order.order_number}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Info */}
                    <div className="mb-4 space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Order #:</span>
                            <span className="font-semibold">{order.order_number}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Date:</span>
                            <span>{formatDate(order.created_at)}</span>
                        </div>
                        {order.user && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">Cashier:</span>
                                <span>{order.user.name}</span>
                            </div>
                        )}
                        {order.customer && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">Customer:</span>
                                <span>{order.customer.name}</span>
                            </div>
                        )}
                    </div>

                    {/* Items */}
                    <div className="mb-4 border-t border-b py-4">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left">
                                    <th className="pb-2">Item</th>
                                    <th className="text-right pb-2">Qty</th>
                                    <th className="text-right pb-2">Price</th>
                                    <th className="text-right pb-2">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item) => (
                                    <tr key={item.id} className="border-b">
                                        <td className="py-2">
                                            <div>
                                                <div className="font-medium">{item.product_name}</div>
                                                {item.discount > 0 && (
                                                    <div className="text-xs text-red-600">
                                                        Discount: {formatCurrency(item.discount)}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="text-right py-2">{item.quantity}</td>
                                        <td className="text-right py-2">{formatCurrency(item.price)}</td>
                                        <td className="text-right py-2 font-semibold">{formatCurrency(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="mb-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(order.subtotal)}</span>
                        </div>
                        {order.tax_amount > 0 && settings?.receipt_show_tax_details && (
                            <div className="flex justify-between">
                                <span>Tax:</span>
                                <span>{formatCurrency(order.tax_amount)}</span>
                            </div>
                        )}
                        {order.discount_amount > 0 && (
                            <div className="flex justify-between text-red-600">
                                <span>Discount:</span>
                                <span>-{formatCurrency(order.discount_amount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                            <span>TOTAL:</span>
                            <span>{formatCurrency(order.total)}</span>
                        </div>
                    </div>

                    {/* Payment */}
                    <div className="mb-4 border-t pt-4">
                        <div className="text-sm space-y-1">
                            {order.payments.map((payment) => (
                                <div key={payment.id} className="flex justify-between">
                                    <span className="capitalize">{payment.method}:</span>
                                    <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-xs text-gray-600 border-t pt-4 mt-4">
                        <p>{receiptFooter}</p>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page {
                        size: 80mm auto;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:border-0 {
                        border: 0 !important;
                    }
                    .print\\:p-4 {
                        padding: 1rem !important;
                    }
                }
            `}</style>
        </>
    );
}

