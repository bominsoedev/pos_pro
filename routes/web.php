<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
    
    // POS Routes
    Route::get('pos', [App\Http\Controllers\PosController::class, 'index'])->name('pos');
    Route::get('pos/search', [App\Http\Controllers\PosController::class, 'searchProduct'])->name('pos.search');
    Route::get('pos/barcode', [App\Http\Controllers\PosController::class, 'findByBarcode'])->name('pos.barcode');
    
    // Products
    Route::resource('products', App\Http\Controllers\ProductController::class);
    Route::post('products/bulk-delete', [App\Http\Controllers\ProductController::class, 'bulkDelete'])->name('products.bulk-delete');
    Route::post('products/import', [App\Http\Controllers\ProductController::class, 'import'])->name('products.import');
    Route::post('products/{product}/images', [App\Http\Controllers\ProductController::class, 'storeImage'])->name('products.images.store');
    Route::delete('products/{product}/images/{image}', [App\Http\Controllers\ProductController::class, 'deleteImage'])->name('products.images.delete');
    Route::post('products/{product}/images/{image}/set-primary', [App\Http\Controllers\ProductController::class, 'setPrimaryImage'])->name('products.images.set-primary');
    
    // Product Variants
    Route::get('products/{product}/variants', [App\Http\Controllers\ProductVariantController::class, 'index'])->name('products.variants');
    Route::post('products/{product}/variants/options', [App\Http\Controllers\ProductVariantController::class, 'storeOption'])->name('products.variants.options.store');
    Route::post('products/{product}/variants', [App\Http\Controllers\ProductVariantController::class, 'storeVariant'])->name('products.variants.store');
    Route::put('variants/{variant}', [App\Http\Controllers\ProductVariantController::class, 'update'])->name('variants.update');
    Route::delete('variants/{variant}', [App\Http\Controllers\ProductVariantController::class, 'destroy'])->name('variants.destroy');
    Route::delete('variant-options/{option}', [App\Http\Controllers\ProductVariantController::class, 'destroyOption'])->name('variant-options.destroy');
    
    // Product Bundles
    if (feature_enabled('bundles')) {
        Route::resource('bundles', App\Http\Controllers\BundleController::class);
    }
    
    // Search
    Route::get('search', [App\Http\Controllers\SearchController::class, 'global'])->name('search');
    Route::get('search/quick', [App\Http\Controllers\SearchController::class, 'quick'])->name('search.quick');
    
    // Backup & Restore
    if (feature_enabled('backup')) {
        Route::get('backup', [App\Http\Controllers\BackupController::class, 'index'])->name('backup.index');
        Route::post('backup/create', [App\Http\Controllers\BackupController::class, 'create'])->name('backup.create');
        Route::post('backup/restore', [App\Http\Controllers\BackupController::class, 'restore'])->name('backup.restore');
        Route::get('backup/{filename}/download', [App\Http\Controllers\BackupController::class, 'download'])->name('backup.download');
        Route::delete('backup/{filename}', [App\Http\Controllers\BackupController::class, 'destroy'])->name('backup.destroy');
        Route::get('backup/export', [App\Http\Controllers\BackupController::class, 'exportData'])->name('backup.export');
    }
    
    // Barcodes
    Route::get('products/{product}/barcode', [App\Http\Controllers\BarcodeController::class, 'generate'])->name('products.barcode');
    Route::get('products/{product}/barcode/label', [App\Http\Controllers\BarcodeController::class, 'printLabel'])->name('products.barcode.label');
    Route::post('products/{product}/barcode/generate', [App\Http\Controllers\BarcodeController::class, 'autoGenerate'])->name('products.barcode.generate');
    Route::post('products/barcode/bulk-generate', [App\Http\Controllers\BarcodeController::class, 'bulkGenerate'])->name('products.barcode.bulk-generate');
    
    // Categories
    Route::resource('categories', App\Http\Controllers\CategoryController::class);
    
    // Customers
    Route::resource('customers', App\Http\Controllers\CustomerController::class);
    
    // Orders
    Route::resource('orders', App\Http\Controllers\OrderController::class)->except(['edit', 'update']);
    Route::patch('orders/{order}/status', [App\Http\Controllers\OrderController::class, 'updateStatus'])->name('orders.update-status');
    Route::get('orders/{order}/receipt', [App\Http\Controllers\OrderController::class, 'receipt'])->name('orders.receipt');
    Route::get('orders/{order}/invoice', [App\Http\Controllers\OrderController::class, 'invoice'])->name('orders.invoice');
    
    // Refunds
    Route::post('orders/{order}/refund', [App\Http\Controllers\RefundController::class, 'store'])->name('orders.refund');
    Route::get('refunds', [App\Http\Controllers\RefundController::class, 'index'])->name('refunds.index');
    Route::get('refunds/{refund}', [App\Http\Controllers\RefundController::class, 'show'])->name('refunds.show');
    
    // Reports
    Route::get('reports/daily', [App\Http\Controllers\ReportController::class, 'daily'])->name('reports.daily');
    Route::get('reports/monthly', [App\Http\Controllers\ReportController::class, 'monthly'])->name('reports.monthly');
    Route::get('reports/yearly', [App\Http\Controllers\ReportController::class, 'yearly'])->name('reports.yearly');
    Route::get('reports/product-performance', [App\Http\Controllers\ReportController::class, 'productPerformance'])->name('reports.product-performance');
    Route::get('reports/cash-register', [App\Http\Controllers\ReportController::class, 'cashRegister'])->name('reports.cash-register');
    Route::get('reports/profit-loss', [App\Http\Controllers\ReportController::class, 'profitLoss'])->name('reports.profit-loss');
    Route::get('reports/sales-by-employee', [App\Http\Controllers\ReportController::class, 'salesByEmployee'])->name('reports.sales-by-employee');
    Route::get('reports/customer-analytics', [App\Http\Controllers\ReportController::class, 'customerAnalytics'])->name('reports.customer-analytics');
    Route::get('reports/inventory-valuation', [App\Http\Controllers\ReportController::class, 'inventoryValuation'])->name('reports.inventory-valuation');
    
    // Inventory
    Route::get('inventory', [App\Http\Controllers\InventoryController::class, 'index'])->name('inventory.index');
    Route::post('inventory/{product}/adjust', [App\Http\Controllers\InventoryController::class, 'adjust'])->name('inventory.adjust');
    Route::get('inventory/{product}/history', [App\Http\Controllers\InventoryController::class, 'history'])->name('inventory.history');
    
    // Discounts
    Route::resource('discounts', App\Http\Controllers\DiscountController::class);
    Route::get('discounts/validate', [App\Http\Controllers\DiscountController::class, 'validate'])->name('discounts.validate');
    
    // Roles & Permissions
    if (feature_enabled('roles')) {
        Route::resource('roles', App\Http\Controllers\RoleController::class);
    }
    
    // Shifts
    Route::get('shifts', [App\Http\Controllers\ShiftController::class, 'index'])->name('shifts.index');
    Route::get('shifts/current', [App\Http\Controllers\ShiftController::class, 'current'])->name('shifts.current');
    Route::post('shifts', [App\Http\Controllers\ShiftController::class, 'store'])->name('shifts.store');
    Route::post('shifts/{shift}/close', [App\Http\Controllers\ShiftController::class, 'close'])->name('shifts.close');
    Route::get('shifts/{shift}', [App\Http\Controllers\ShiftController::class, 'show'])->name('shifts.show');
    
    // Loyalty
    if (feature_enabled('loyalty')) {
        Route::get('loyalty', [App\Http\Controllers\LoyaltyController::class, 'index'])->name('loyalty.index');
        Route::get('loyalty/{customer}', [App\Http\Controllers\LoyaltyController::class, 'show'])->name('loyalty.show');
        Route::post('loyalty/{customer}/adjust', [App\Http\Controllers\LoyaltyController::class, 'adjustPoints'])->name('loyalty.adjust');
    }
    
    // Image Upload
    Route::post('images/upload', [App\Http\Controllers\ImageController::class, 'upload'])->name('images.upload');
    
    // Exports
    Route::get('export/orders', [App\Http\Controllers\ExportController::class, 'ordersCsv'])->name('export.orders');
    Route::get('export/products', [App\Http\Controllers\ExportController::class, 'productsCsv'])->name('export.products');
    Route::get('export/daily-report', [App\Http\Controllers\ExportController::class, 'dailyReportCsv'])->name('export.daily-report');
    Route::get('export/product-performance', [App\Http\Controllers\ExportController::class, 'productPerformanceCsv'])->name('export.product-performance');
    Route::get('export/monthly-report', [App\Http\Controllers\ExportController::class, 'monthlyReportCsv'])->name('export.monthly-report');
    Route::get('export/yearly-report', [App\Http\Controllers\ExportController::class, 'yearlyReportCsv'])->name('export.yearly-report');
    Route::get('export/cash-register', [App\Http\Controllers\ExportController::class, 'cashRegisterCsv'])->name('export.cash-register');
    
    // Business Features (conditionally enabled)
    if (feature_enabled('suppliers')) {
        Route::resource('suppliers', App\Http\Controllers\SupplierController::class);
    }
    
    if (feature_enabled('purchase_orders')) {
        Route::get('purchase-orders/create', [App\Http\Controllers\PurchaseOrderController::class, 'create'])->name('purchase-orders.create');
        Route::resource('purchase-orders', App\Http\Controllers\PurchaseOrderController::class)->except(['edit', 'update', 'create']);
        Route::patch('purchase-orders/{purchaseOrder}/status', [App\Http\Controllers\PurchaseOrderController::class, 'updateStatus'])->name('purchase-orders.update-status');
    }
    
    if (feature_enabled('expenses')) {
        Route::resource('expenses', App\Http\Controllers\ExpenseController::class);
    }
    
    if (feature_enabled('tax_rates')) {
        Route::resource('tax-rates', App\Http\Controllers\TaxRateController::class);
    }
    
    // Ways
    if (feature_enabled('ways')) {
        Route::resource('ways', App\Http\Controllers\WayController::class);
        Route::get('ways/list', [App\Http\Controllers\WayController::class, 'list'])->name('ways.list');
        Route::post('ways/set-current', [App\Http\Controllers\WayController::class, 'setCurrent'])->name('ways.set-current');
    }
    
    // Quotations
    if (feature_enabled('quotations')) {
        Route::resource('quotations', App\Http\Controllers\QuotationController::class);
        Route::post('quotations/{quotation}/send', [App\Http\Controllers\QuotationController::class, 'send'])->name('quotations.send');
        Route::post('quotations/{quotation}/convert', [App\Http\Controllers\QuotationController::class, 'convertToOrder'])->name('quotations.convert');
    }
    
    // Stock Transfers
    if (feature_enabled('stock_transfers')) {
        Route::resource('stock-transfers', App\Http\Controllers\StockTransferController::class);
        Route::post('stock-transfers/{stockTransfer}/approve', [App\Http\Controllers\StockTransferController::class, 'approve'])->name('stock-transfers.approve');
        Route::post('stock-transfers/{stockTransfer}/complete', [App\Http\Controllers\StockTransferController::class, 'complete'])->name('stock-transfers.complete');
    }
    
    // Gift Cards
    if (feature_enabled('gift_cards')) {
        Route::resource('gift-cards', App\Http\Controllers\GiftCardController::class);
        Route::post('gift-cards/{giftCard}/redeem', [App\Http\Controllers\GiftCardController::class, 'redeem'])->name('gift-cards.redeem');
    }
    
    // Currencies
    if (feature_enabled('currencies')) {
        Route::resource('currencies', App\Http\Controllers\CurrencyController::class);
        Route::post('currencies/{currency}/set-default', [App\Http\Controllers\CurrencyController::class, 'setDefault'])->name('currencies.set-default');
    }
    
    // Activity Logs
    if (feature_enabled('activity_logs')) {
        Route::get('activity-logs', [App\Http\Controllers\ActivityLogController::class, 'index'])->name('activity-logs.index');
    }
    
    // Accounting System
    if (feature_enabled('accounting')) {
        Route::prefix('accounting')->name('accounting.')->group(function () {
            // Dashboard
            Route::get('dashboard', [App\Http\Controllers\Accounting\DashboardController::class, 'index'])->name('dashboard');
            
            // Chart of Accounts
            Route::resource('accounts', App\Http\Controllers\Accounting\AccountController::class);
            
            // Journal Entries
            Route::get('journal-entries', [App\Http\Controllers\Accounting\JournalEntryController::class, 'index'])->name('journal-entries.index');
            Route::get('journal-entries/create', [App\Http\Controllers\Accounting\JournalEntryController::class, 'create'])->name('journal-entries.create');
            Route::post('journal-entries', [App\Http\Controllers\Accounting\JournalEntryController::class, 'store'])->name('journal-entries.store');
            Route::get('journal-entries/{journalEntry}', [App\Http\Controllers\Accounting\JournalEntryController::class, 'show'])->name('journal-entries.show');
            Route::post('journal-entries/{journalEntry}/post', [App\Http\Controllers\Accounting\JournalEntryController::class, 'post'])->name('journal-entries.post');
            Route::post('journal-entries/{journalEntry}/void', [App\Http\Controllers\Accounting\JournalEntryController::class, 'void'])->name('journal-entries.void');
            Route::post('journal-entries/{journalEntry}/reverse', [App\Http\Controllers\Accounting\JournalEntryController::class, 'reverse'])->name('journal-entries.reverse');
            
            // Recurring Journal Entries
            Route::get('recurring-entries', [App\Http\Controllers\Accounting\RecurringEntryController::class, 'index'])->name('recurring-entries.index');
            Route::get('recurring-entries/create', [App\Http\Controllers\Accounting\RecurringEntryController::class, 'create'])->name('recurring-entries.create');
            Route::post('recurring-entries', [App\Http\Controllers\Accounting\RecurringEntryController::class, 'store'])->name('recurring-entries.store');
            Route::get('recurring-entries/{recurringEntry}', [App\Http\Controllers\Accounting\RecurringEntryController::class, 'show'])->name('recurring-entries.show');
            Route::post('recurring-entries/{recurringEntry}/toggle', [App\Http\Controllers\Accounting\RecurringEntryController::class, 'toggle'])->name('recurring-entries.toggle');
            Route::post('recurring-entries/{recurringEntry}/run', [App\Http\Controllers\Accounting\RecurringEntryController::class, 'runNow'])->name('recurring-entries.run');
            Route::delete('recurring-entries/{recurringEntry}', [App\Http\Controllers\Accounting\RecurringEntryController::class, 'destroy'])->name('recurring-entries.destroy');
            
            // General Ledger
            Route::get('general-ledger', [App\Http\Controllers\Accounting\GeneralLedgerController::class, 'index'])->name('general-ledger.index');
            Route::get('trial-balance', [App\Http\Controllers\Accounting\GeneralLedgerController::class, 'trialBalance'])->name('trial-balance');
            
            // Financial Reports
            Route::get('reports/balance-sheet', [App\Http\Controllers\Accounting\FinancialReportController::class, 'balanceSheet'])->name('reports.balance-sheet');
            Route::get('reports/income-statement', [App\Http\Controllers\Accounting\FinancialReportController::class, 'incomeStatement'])->name('reports.income-statement');
            Route::get('reports/cash-flow', [App\Http\Controllers\Accounting\FinancialReportController::class, 'cashFlow'])->name('reports.cash-flow');
            Route::get('reports/ratios', [App\Http\Controllers\Accounting\RatiosController::class, 'index'])->name('reports.ratios');
            
            // Fiscal Years
            Route::get('fiscal-years', [App\Http\Controllers\Accounting\FiscalYearController::class, 'index'])->name('fiscal-years.index');
            Route::get('fiscal-years/create', [App\Http\Controllers\Accounting\FiscalYearController::class, 'create'])->name('fiscal-years.create');
            Route::post('fiscal-years', [App\Http\Controllers\Accounting\FiscalYearController::class, 'store'])->name('fiscal-years.store');
            Route::get('fiscal-years/{fiscalYear}/close', [App\Http\Controllers\Accounting\FiscalYearController::class, 'close'])->name('fiscal-years.close');
            Route::post('fiscal-years/{fiscalYear}/process-close', [App\Http\Controllers\Accounting\FiscalYearController::class, 'processClose'])->name('fiscal-years.process-close');
            
            // Statements
            Route::get('statements/supplier', [App\Http\Controllers\Accounting\StatementController::class, 'supplier'])->name('statements.supplier');
            Route::get('statements/customer', [App\Http\Controllers\Accounting\StatementController::class, 'customer'])->name('statements.customer');
            
            // Exports
            Route::get('export/trial-balance', [App\Http\Controllers\Accounting\ExportController::class, 'trialBalanceCsv'])->name('export.trial-balance');
            Route::get('export/balance-sheet', [App\Http\Controllers\Accounting\ExportController::class, 'balanceSheetCsv'])->name('export.balance-sheet');
            Route::get('export/income-statement', [App\Http\Controllers\Accounting\ExportController::class, 'incomeStatementCsv'])->name('export.income-statement');
            Route::get('export/general-ledger', [App\Http\Controllers\Accounting\ExportController::class, 'generalLedgerCsv'])->name('export.general-ledger');
            Route::get('export/journal-entries', [App\Http\Controllers\Accounting\ExportController::class, 'journalEntriesCsv'])->name('export.journal-entries');
            
            // Bank Accounts & Reconciliation
            Route::resource('bank-accounts', App\Http\Controllers\Accounting\BankAccountController::class);
            Route::post('bank-accounts/{bankAccount}/import', [App\Http\Controllers\Accounting\BankAccountController::class, 'importTransactions'])->name('bank-accounts.import');
            Route::get('bank-accounts/{bankAccount}/reconcile', [App\Http\Controllers\Accounting\BankAccountController::class, 'reconcile'])->name('bank-accounts.reconcile');
            Route::post('bank-accounts/{bankAccount}/complete-reconciliation', [App\Http\Controllers\Accounting\BankAccountController::class, 'completeReconciliation'])->name('bank-accounts.complete-reconciliation');
            
            // Accounts Payable
            Route::get('payables', [App\Http\Controllers\Accounting\PayableController::class, 'index'])->name('payables.index');
            Route::get('payables/create', [App\Http\Controllers\Accounting\PayableController::class, 'create'])->name('payables.create');
            Route::post('payables', [App\Http\Controllers\Accounting\PayableController::class, 'store'])->name('payables.store');
            Route::get('payables/{payable}', [App\Http\Controllers\Accounting\PayableController::class, 'show'])->name('payables.show');
            Route::post('payables/{payable}/payment', [App\Http\Controllers\Accounting\PayableController::class, 'recordPayment'])->name('payables.payment');
            
            // Accounts Receivable
            Route::get('receivables', [App\Http\Controllers\Accounting\ReceivableController::class, 'index'])->name('receivables.index');
            Route::get('receivables/create', [App\Http\Controllers\Accounting\ReceivableController::class, 'create'])->name('receivables.create');
            Route::post('receivables', [App\Http\Controllers\Accounting\ReceivableController::class, 'store'])->name('receivables.store');
            Route::get('receivables/{receivable}', [App\Http\Controllers\Accounting\ReceivableController::class, 'show'])->name('receivables.show');
            Route::post('receivables/{receivable}/payment', [App\Http\Controllers\Accounting\ReceivableController::class, 'recordPayment'])->name('receivables.payment');
            Route::post('receivables/{receivable}/bad-debt', [App\Http\Controllers\Accounting\ReceivableController::class, 'markAsBadDebt'])->name('receivables.bad-debt');
        });
    }
});

require __DIR__.'/settings.php';
