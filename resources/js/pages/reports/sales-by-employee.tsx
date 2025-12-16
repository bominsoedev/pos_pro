import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { User, Calendar, DollarSign, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from '@/hooks/use-translation';

interface Employee {
    id: number;
    name: string;
    email: string;
    total_orders: number;
    total_sales: number;
    average_order_value: number;
}

interface SalesByEmployeeProps {
    date_from: string;
    date_to: string;
    employees: Employee[];
}

export default function SalesByEmployeeReport({
    date_from,
    date_to,
    employees,
}: SalesByEmployeeProps) {
    const { t } = useTranslation();
    const [dateFrom, setDateFrom] = useState(date_from);
    const [dateTo, setDateTo] = useState(date_to);

    const handleFilter = () => {
        router.get('/reports/sales-by-employee', {
            date_from: dateFrom,
            date_to: dateTo,
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.reports'), href: '/reports' },
            { title: 'Sales by Employee', href: '/reports/sales-by-employee' },
        ]}>
            <Head title="Sales by Employee" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Sales by Employee</h1>
                        <p className="text-muted-foreground">Performance by cashier</p>
                    </div>
                </div>

                {/* Date Filters */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                            </div>
                            <span>{t('common.to')}</span>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                            <Button onClick={handleFilter}>Filter</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Employees List */}
                <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>Employee Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {employees.length === 0 ? (
                            <div className="text-center py-6">
                                <User className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold">No sales data found</h3>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {employees.map((employee) => (
                                    <Card key={employee.id} className="hover:bg-accent/50 transition-colors">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                                                        <User className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold">{employee.name}</h3>
                                                        <p className="text-sm text-muted-foreground">{employee.email}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4 text-right">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">{t('orders.title')}</p>
                                                        <p className="font-semibold">{employee.total_orders}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">{t('pos.total')}</p>
                                                        <p className="font-semibold text-lg">{formatCurrency(employee.total_sales)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Avg. Order</p>
                                                        <p className="font-semibold">{formatCurrency(employee.average_order_value)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Summary */}
                {employees.length > 0 && (
                    <Card className="backdrop-blur-sm bg-background/80 border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Employees</p>
                                    <p className="text-2xl font-bold">{employees.length}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Orders</p>
                                    <p className="text-2xl font-bold">{employees.reduce((sum, e) => sum + e.total_orders, 0)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Sales</p>
                                    <p className="text-2xl font-bold text-primary">
                                        {formatCurrency(employees.reduce((sum, e) => sum + e.total_sales, 0))}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
