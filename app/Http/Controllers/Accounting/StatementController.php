<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Payable;
use App\Models\PayablePayment;
use App\Models\Receivable;
use App\Models\ReceivablePayment;
use App\Models\Supplier;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StatementController extends Controller
{
    public function supplier(Request $request)
    {
        $suppliers = Supplier::orderBy('name')->get(['id', 'name']);
        
        $supplierId = $request->supplier_id;
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->subMonths(3)->startOfMonth();
        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();

        $statement = null;
        $supplier = null;

        if ($supplierId) {
            $supplier = Supplier::find($supplierId);

            if ($supplier) {
                // Get opening balance (payables before start date)
                $openingBalance = Payable::where('supplier_id', $supplierId)
                    ->where('invoice_date', '<', $startDate)
                    ->whereNotIn('status', ['void'])
                    ->sum('balance_due');

                // Get transactions in the period
                $invoices = Payable::where('supplier_id', $supplierId)
                    ->whereBetween('invoice_date', [$startDate, $endDate])
                    ->whereNotIn('status', ['void'])
                    ->orderBy('invoice_date')
                    ->get();

                $payments = PayablePayment::whereHas('payable', function ($q) use ($supplierId) {
                    $q->where('supplier_id', $supplierId);
                })
                    ->whereBetween('payment_date', [$startDate, $endDate])
                    ->with('payable')
                    ->orderBy('payment_date')
                    ->get();

                // Combine and sort transactions
                $transactions = collect();
                
                foreach ($invoices as $invoice) {
                    $transactions->push([
                        'date' => $invoice->invoice_date,
                        'type' => 'invoice',
                        'reference' => $invoice->invoice_number,
                        'description' => $invoice->description ?? 'Invoice',
                        'debit' => $invoice->total_amount,
                        'credit' => 0,
                    ]);
                }

                foreach ($payments as $payment) {
                    $transactions->push([
                        'date' => $payment->payment_date,
                        'type' => 'payment',
                        'reference' => $payment->payment_number,
                        'description' => 'Payment for ' . $payment->payable->invoice_number,
                        'debit' => 0,
                        'credit' => $payment->amount,
                    ]);
                }

                $transactions = $transactions->sortBy('date')->values();

                // Calculate running balance
                $runningBalance = $openingBalance;
                $transactions = $transactions->map(function ($txn) use (&$runningBalance) {
                    $runningBalance += $txn['debit'] - $txn['credit'];
                    $txn['balance'] = $runningBalance;
                    return $txn;
                });

                $closingBalance = $runningBalance;
                $totalDebits = $transactions->sum('debit');
                $totalCredits = $transactions->sum('credit');

                $statement = [
                    'openingBalance' => $openingBalance,
                    'transactions' => $transactions->values()->all(),
                    'totalDebits' => $totalDebits,
                    'totalCredits' => $totalCredits,
                    'closingBalance' => $closingBalance,
                ];
            }
        }

        return Inertia::render('accounting/statements/supplier', [
            'suppliers' => $suppliers,
            'supplier' => $supplier,
            'statement' => $statement,
            'filters' => [
                'supplier_id' => $supplierId,
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
        ]);
    }

    public function customer(Request $request)
    {
        $customers = Customer::orderBy('name')->get(['id', 'name']);
        
        $customerId = $request->customer_id;
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->subMonths(3)->startOfMonth();
        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();

        $statement = null;
        $customer = null;

        if ($customerId) {
            $customer = Customer::find($customerId);

            if ($customer) {
                // Get opening balance (receivables before start date)
                $openingBalance = Receivable::where('customer_id', $customerId)
                    ->where('invoice_date', '<', $startDate)
                    ->whereNotIn('status', ['void', 'bad_debt'])
                    ->sum('balance_due');

                // Get transactions in the period
                $invoices = Receivable::where('customer_id', $customerId)
                    ->whereBetween('invoice_date', [$startDate, $endDate])
                    ->whereNotIn('status', ['void', 'bad_debt'])
                    ->orderBy('invoice_date')
                    ->get();

                $payments = ReceivablePayment::whereHas('receivable', function ($q) use ($customerId) {
                    $q->where('customer_id', $customerId);
                })
                    ->whereBetween('payment_date', [$startDate, $endDate])
                    ->with('receivable')
                    ->orderBy('payment_date')
                    ->get();

                // Combine and sort transactions
                $transactions = collect();
                
                foreach ($invoices as $invoice) {
                    $transactions->push([
                        'date' => $invoice->invoice_date,
                        'type' => 'invoice',
                        'reference' => $invoice->invoice_number,
                        'description' => $invoice->description ?? 'Invoice',
                        'debit' => $invoice->total_amount,
                        'credit' => 0,
                    ]);
                }

                foreach ($payments as $payment) {
                    $transactions->push([
                        'date' => $payment->payment_date,
                        'type' => 'payment',
                        'reference' => $payment->payment_number,
                        'description' => 'Payment received for ' . $payment->receivable->invoice_number,
                        'debit' => 0,
                        'credit' => $payment->amount,
                    ]);
                }

                $transactions = $transactions->sortBy('date')->values();

                // Calculate running balance
                $runningBalance = $openingBalance;
                $transactions = $transactions->map(function ($txn) use (&$runningBalance) {
                    $runningBalance += $txn['debit'] - $txn['credit'];
                    $txn['balance'] = $runningBalance;
                    return $txn;
                });

                $closingBalance = $runningBalance;
                $totalDebits = $transactions->sum('debit');
                $totalCredits = $transactions->sum('credit');

                $statement = [
                    'openingBalance' => $openingBalance,
                    'transactions' => $transactions->values()->all(),
                    'totalDebits' => $totalDebits,
                    'totalCredits' => $totalCredits,
                    'closingBalance' => $closingBalance,
                ];
            }
        }

        return Inertia::render('accounting/statements/customer', [
            'customers' => $customers,
            'customer' => $customer,
            'statement' => $statement,
            'filters' => [
                'customer_id' => $customerId,
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
        ]);
    }
}
