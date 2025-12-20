<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Expense;
use App\Models\FiscalYear;
use App\Models\JournalEntry;
use App\Models\Order;
use App\Models\PurchaseOrder;
use App\Models\Refund;
use Illuminate\Support\Facades\DB;

class AccountingService
{
    /**
     * Create journal entry for a completed sale/order
     */
    public function createSaleEntry(Order $order): ?JournalEntry
    {
        if (!feature_enabled('accounting')) {
            return null;
        }

        $cashAccount = Account::where('subtype', 'cash')->first();
        $bankAccount = Account::where('subtype', 'bank')->first();
        $arAccount = Account::where('subtype', 'accounts_receivable')->first();
        $salesAccount = Account::where('subtype', 'sales')->first();
        $cogsAccount = Account::where('subtype', 'cost_of_goods_sold')->first();
        $inventoryAccount = Account::where('subtype', 'inventory')->first();

        if (!$salesAccount) {
            return null;
        }

        return DB::transaction(function () use ($order, $cashAccount, $bankAccount, $arAccount, $salesAccount, $cogsAccount, $inventoryAccount) {
            $fiscalYear = FiscalYear::findByDate($order->created_at);

            $entry = JournalEntry::create([
                'entry_number' => JournalEntry::generateEntryNumber(),
                'entry_date' => $order->created_at->format('Y-m-d'),
                'fiscal_year_id' => $fiscalYear?->id,
                'reference' => $order->order_number,
                'description' => 'Sale: Order #' . $order->order_number,
                'source' => 'sales',
                'source_type' => Order::class,
                'source_id' => $order->id,
                'created_by' => $order->user_id,
                'status' => 'posted',
                'posted_by' => $order->user_id,
                'posted_at' => now(),
            ]);

            // Determine which asset account to debit based on payment method
            $paymentAccount = $cashAccount;
            $payment = $order->payments()->first();
            if ($payment) {
                if (in_array($payment->method, ['card', 'bank_transfer'])) {
                    $paymentAccount = $bankAccount ?? $cashAccount;
                } elseif ($payment->method === 'credit' && $arAccount) {
                    $paymentAccount = $arAccount;
                }
            }

            // Debit: Cash/Bank/AR
            if ($paymentAccount) {
                $entry->lines()->create([
                    'account_id' => $paymentAccount->id,
                    'description' => 'Payment received',
                    'debit' => $order->total,
                    'credit' => 0,
                    'line_order' => 0,
                ]);
            }

            // Credit: Sales Revenue
            $entry->lines()->create([
                'account_id' => $salesAccount->id,
                'description' => 'Sales revenue',
                'debit' => 0,
                'credit' => $order->total,
                'line_order' => 1,
            ]);

            // Record COGS if we have the accounts
            if ($cogsAccount && $inventoryAccount) {
                $totalCost = 0;
                foreach ($order->items as $item) {
                    $totalCost += ($item->product->cost ?? 0) * $item->quantity;
                }

                if ($totalCost > 0) {
                    // Debit: COGS
                    $entry->lines()->create([
                        'account_id' => $cogsAccount->id,
                        'description' => 'Cost of goods sold',
                        'debit' => $totalCost,
                        'credit' => 0,
                        'line_order' => 2,
                    ]);

                    // Credit: Inventory
                    $entry->lines()->create([
                        'account_id' => $inventoryAccount->id,
                        'description' => 'Inventory reduction',
                        'debit' => 0,
                        'credit' => $totalCost,
                        'line_order' => 3,
                    ]);
                }
            }

            $entry->recalculateTotals();

            return $entry;
        });
    }

    /**
     * Create journal entry for an expense
     */
    public function createExpenseEntry(Expense $expense): ?JournalEntry
    {
        if (!feature_enabled('accounting')) {
            return null;
        }

        $cashAccount = Account::where('subtype', 'cash')->first();
        $bankAccount = Account::where('subtype', 'bank')->first();
        $expenseAccount = Account::where('subtype', 'operating_expense')->first();

        if (!$expenseAccount) {
            return null;
        }

        return DB::transaction(function () use ($expense, $cashAccount, $bankAccount, $expenseAccount) {
            $fiscalYear = FiscalYear::findByDate($expense->expense_date);

            $entry = JournalEntry::create([
                'entry_number' => JournalEntry::generateEntryNumber(),
                'entry_date' => $expense->expense_date->format('Y-m-d'),
                'fiscal_year_id' => $fiscalYear?->id,
                'reference' => $expense->expense_number,
                'description' => 'Expense: ' . $expense->title,
                'source' => 'expense',
                'source_type' => Expense::class,
                'source_id' => $expense->id,
                'created_by' => $expense->user_id,
                'status' => 'posted',
                'posted_by' => $expense->user_id,
                'posted_at' => now(),
            ]);

            // Debit: Expense Account
            $entry->lines()->create([
                'account_id' => $expenseAccount->id,
                'description' => $expense->category . ': ' . $expense->title,
                'debit' => $expense->amount,
                'credit' => 0,
                'line_order' => 0,
            ]);

            // Credit: Cash/Bank
            $paymentAccount = $expense->payment_method === 'bank_transfer' ? ($bankAccount ?? $cashAccount) : $cashAccount;
            if ($paymentAccount) {
                $entry->lines()->create([
                    'account_id' => $paymentAccount->id,
                    'description' => 'Payment for expense',
                    'debit' => 0,
                    'credit' => $expense->amount,
                    'line_order' => 1,
                ]);
            }

            $entry->recalculateTotals();

            return $entry;
        });
    }

    /**
     * Create journal entry for a purchase order when received
     */
    public function createPurchaseEntry(PurchaseOrder $purchaseOrder): ?JournalEntry
    {
        if (!feature_enabled('accounting')) {
            return null;
        }

        $inventoryAccount = Account::where('subtype', 'inventory')->first();
        $apAccount = Account::where('subtype', 'accounts_payable')->first();
        $cashAccount = Account::where('subtype', 'cash')->first();

        if (!$inventoryAccount) {
            return null;
        }

        return DB::transaction(function () use ($purchaseOrder, $inventoryAccount, $apAccount, $cashAccount) {
            $fiscalYear = FiscalYear::findByDate($purchaseOrder->order_date);

            $entry = JournalEntry::create([
                'entry_number' => JournalEntry::generateEntryNumber(),
                'entry_date' => $purchaseOrder->order_date->format('Y-m-d'),
                'fiscal_year_id' => $fiscalYear?->id,
                'reference' => $purchaseOrder->po_number,
                'description' => 'Purchase Order: ' . $purchaseOrder->po_number,
                'source' => 'purchase',
                'source_type' => PurchaseOrder::class,
                'source_id' => $purchaseOrder->id,
                'created_by' => auth()->id(),
                'status' => 'posted',
                'posted_by' => auth()->id(),
                'posted_at' => now(),
            ]);

            // Debit: Inventory
            $entry->lines()->create([
                'account_id' => $inventoryAccount->id,
                'description' => 'Inventory purchase from ' . ($purchaseOrder->supplier->name ?? 'Supplier'),
                'debit' => $purchaseOrder->total,
                'credit' => 0,
                'line_order' => 0,
            ]);

            // Credit: Accounts Payable or Cash
            $creditAccount = $apAccount ?? $cashAccount;
            if ($creditAccount) {
                $entry->lines()->create([
                    'account_id' => $creditAccount->id,
                    'description' => 'Payable to ' . ($purchaseOrder->supplier->name ?? 'Supplier'),
                    'debit' => 0,
                    'credit' => $purchaseOrder->total,
                    'line_order' => 1,
                ]);
            }

            $entry->recalculateTotals();

            return $entry;
        });
    }

    /**
     * Create journal entry for a refund
     */
    public function createRefundEntry(Refund $refund): ?JournalEntry
    {
        if (!feature_enabled('accounting')) {
            return null;
        }

        $cashAccount = Account::where('subtype', 'cash')->first();
        $salesAccount = Account::where('subtype', 'sales')->first();

        if (!$salesAccount || !$cashAccount) {
            return null;
        }

        return DB::transaction(function () use ($refund, $cashAccount, $salesAccount) {
            $fiscalYear = FiscalYear::findByDate($refund->created_at);

            $entry = JournalEntry::create([
                'entry_number' => JournalEntry::generateEntryNumber(),
                'entry_date' => $refund->created_at->format('Y-m-d'),
                'fiscal_year_id' => $fiscalYear?->id,
                'reference' => $refund->refund_number,
                'description' => 'Refund: ' . $refund->refund_number,
                'source' => 'refund',
                'source_type' => Refund::class,
                'source_id' => $refund->id,
                'created_by' => auth()->id(),
                'status' => 'posted',
                'posted_by' => auth()->id(),
                'posted_at' => now(),
            ]);

            // Debit: Sales (reduce revenue)
            $entry->lines()->create([
                'account_id' => $salesAccount->id,
                'description' => 'Sales refund',
                'debit' => $refund->amount,
                'credit' => 0,
                'line_order' => 0,
            ]);

            // Credit: Cash (money returned)
            $entry->lines()->create([
                'account_id' => $cashAccount->id,
                'description' => 'Cash refund',
                'debit' => 0,
                'credit' => $refund->amount,
                'line_order' => 1,
            ]);

            $entry->recalculateTotals();

            return $entry;
        });
    }

    /**
     * Seed default chart of accounts
     */
    public static function seedDefaultAccounts(): void
    {
        $accounts = [
            // Assets (1000-1999)
            ['code' => '1000', 'name' => 'Cash', 'name_mm' => 'ငွေသား', 'type' => 'asset', 'subtype' => 'cash', 'is_system' => true],
            ['code' => '1010', 'name' => 'Bank Account', 'name_mm' => 'ဘဏ်စာရင်း', 'type' => 'asset', 'subtype' => 'bank', 'is_system' => true],
            ['code' => '1100', 'name' => 'Accounts Receivable', 'name_mm' => 'ရရန်ငွေ', 'type' => 'asset', 'subtype' => 'accounts_receivable', 'is_system' => true],
            ['code' => '1200', 'name' => 'Inventory', 'name_mm' => 'ကုန်ပစ္စည်းစာရင်း', 'type' => 'asset', 'subtype' => 'inventory', 'is_system' => true],
            ['code' => '1300', 'name' => 'Prepaid Expenses', 'name_mm' => 'ကြိုတင်အသုံးစရိတ်', 'type' => 'asset', 'subtype' => 'prepaid', 'is_system' => false],
            ['code' => '1500', 'name' => 'Fixed Assets', 'name_mm' => 'ပုံသေပိုင်ဆိုင်မှု', 'type' => 'asset', 'subtype' => 'fixed_asset', 'is_system' => false],

            // Liabilities (2000-2999)
            ['code' => '2000', 'name' => 'Accounts Payable', 'name_mm' => 'ပေးရန်ငွေ', 'type' => 'liability', 'subtype' => 'accounts_payable', 'is_system' => true],
            ['code' => '2100', 'name' => 'Credit Card Payable', 'name_mm' => 'ကြွေးကတ်ပေးရန်', 'type' => 'liability', 'subtype' => 'credit_card', 'is_system' => false],
            ['code' => '2500', 'name' => 'Long-term Loans', 'name_mm' => 'ရေရှည်ချေးငွေ', 'type' => 'liability', 'subtype' => 'long_term_liability', 'is_system' => false],

            // Equity (3000-3999)
            ['code' => '3000', 'name' => "Owner's Equity", 'name_mm' => 'ပိုင်ရှင်အရင်းအနှီး', 'type' => 'equity', 'subtype' => 'owners_equity', 'is_system' => true],
            ['code' => '3100', 'name' => 'Retained Earnings', 'name_mm' => 'ထိန်းသိမ်းထားသောအမြတ်', 'type' => 'equity', 'subtype' => 'retained_earnings', 'is_system' => true],

            // Income (4000-4999)
            ['code' => '4000', 'name' => 'Sales Revenue', 'name_mm' => 'ရောင်းအားဝင်ငွေ', 'type' => 'income', 'subtype' => 'sales', 'is_system' => true],
            ['code' => '4100', 'name' => 'Other Income', 'name_mm' => 'အခြားဝင်ငွေ', 'type' => 'income', 'subtype' => 'other_income', 'is_system' => false],

            // Expenses (5000-5999)
            ['code' => '5000', 'name' => 'Cost of Goods Sold', 'name_mm' => 'ရောင်းချသောကုန်ကုန်ကျစရိတ်', 'type' => 'expense', 'subtype' => 'cost_of_goods_sold', 'is_system' => true],
            ['code' => '5100', 'name' => 'Operating Expenses', 'name_mm' => 'လုပ်ငန်းအသုံးစရိတ်', 'type' => 'expense', 'subtype' => 'operating_expense', 'is_system' => true],
            ['code' => '5200', 'name' => 'Payroll Expense', 'name_mm' => 'လစာအသုံးစရိတ်', 'type' => 'expense', 'subtype' => 'payroll', 'is_system' => false],
            ['code' => '5300', 'name' => 'Rent Expense', 'name_mm' => 'ငှားရမ်းခအသုံးစရိတ်', 'type' => 'expense', 'subtype' => 'operating_expense', 'is_system' => false],
            ['code' => '5400', 'name' => 'Utilities Expense', 'name_mm' => 'အသုံးအဆောင်အသုံးစရိတ်', 'type' => 'expense', 'subtype' => 'operating_expense', 'is_system' => false],
            ['code' => '5900', 'name' => 'Bad Debt Expense', 'name_mm' => 'ကောက်မရသောအကြွေးအသုံးစရိတ်', 'type' => 'expense', 'subtype' => 'other_expense', 'is_system' => false],
        ];

        foreach ($accounts as $account) {
            Account::firstOrCreate(
                ['code' => $account['code']],
                $account
            );
        }
    }
}
