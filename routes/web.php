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
    
    // Product Variants
    Route::get('products/{product}/variants', [App\Http\Controllers\ProductVariantController::class, 'index'])->name('products.variants');
    Route::post('products/{product}/variants/options', [App\Http\Controllers\ProductVariantController::class, 'storeOption'])->name('products.variants.options.store');
    Route::post('products/{product}/variants', [App\Http\Controllers\ProductVariantController::class, 'storeVariant'])->name('products.variants.store');
    Route::put('variants/{variant}', [App\Http\Controllers\ProductVariantController::class, 'update'])->name('variants.update');
    Route::delete('variants/{variant}', [App\Http\Controllers\ProductVariantController::class, 'destroy'])->name('variants.destroy');
    Route::delete('variant-options/{option}', [App\Http\Controllers\ProductVariantController::class, 'destroyOption'])->name('variant-options.destroy');
    
    // Product Bundles
    Route::resource('bundles', App\Http\Controllers\BundleController::class);
    
    // Search
    Route::get('search', [App\Http\Controllers\SearchController::class, 'global'])->name('search');
    Route::get('search/quick', [App\Http\Controllers\SearchController::class, 'quick'])->name('search.quick');
    
    // Backup & Restore
    Route::get('backup', [App\Http\Controllers\BackupController::class, 'index'])->name('backup.index');
    Route::post('backup/create', [App\Http\Controllers\BackupController::class, 'create'])->name('backup.create');
    Route::post('backup/restore', [App\Http\Controllers\BackupController::class, 'restore'])->name('backup.restore');
    Route::get('backup/{filename}/download', [App\Http\Controllers\BackupController::class, 'download'])->name('backup.download');
    Route::delete('backup/{filename}', [App\Http\Controllers\BackupController::class, 'destroy'])->name('backup.destroy');
    Route::get('backup/export', [App\Http\Controllers\BackupController::class, 'exportData'])->name('backup.export');
    
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
    Route::post('orders/bulk-receipt', [App\Http\Controllers\OrderController::class, 'bulkReceipt'])->name('orders.bulk-receipt');
    
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
    
    // Inventory
    Route::get('inventory', [App\Http\Controllers\InventoryController::class, 'index'])->name('inventory.index');
    Route::post('inventory/{product}/adjust', [App\Http\Controllers\InventoryController::class, 'adjust'])->name('inventory.adjust');
    Route::get('inventory/{product}/history', [App\Http\Controllers\InventoryController::class, 'history'])->name('inventory.history');
    
    // Discounts
    Route::resource('discounts', App\Http\Controllers\DiscountController::class);
    Route::get('discounts/validate', [App\Http\Controllers\DiscountController::class, 'validate'])->name('discounts.validate');
    
    // Roles & Permissions
    Route::resource('roles', App\Http\Controllers\RoleController::class);
    
    // Shifts
    Route::get('shifts', [App\Http\Controllers\ShiftController::class, 'index'])->name('shifts.index');
    Route::get('shifts/current', [App\Http\Controllers\ShiftController::class, 'current'])->name('shifts.current');
    Route::post('shifts', [App\Http\Controllers\ShiftController::class, 'store'])->name('shifts.store');
    Route::post('shifts/{shift}/close', [App\Http\Controllers\ShiftController::class, 'close'])->name('shifts.close');
    Route::get('shifts/{shift}', [App\Http\Controllers\ShiftController::class, 'show'])->name('shifts.show');
    
    // Loyalty
    Route::get('loyalty', [App\Http\Controllers\LoyaltyController::class, 'index'])->name('loyalty.index');
    Route::get('loyalty/{customer}', [App\Http\Controllers\LoyaltyController::class, 'show'])->name('loyalty.show');
    Route::post('loyalty/{customer}/adjust', [App\Http\Controllers\LoyaltyController::class, 'adjustPoints'])->name('loyalty.adjust');
    
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
    
    // Business Features
    Route::resource('suppliers', App\Http\Controllers\SupplierController::class);
    Route::get('purchase-orders/create', [App\Http\Controllers\PurchaseOrderController::class, 'create'])->name('purchase-orders.create');
    Route::resource('purchase-orders', App\Http\Controllers\PurchaseOrderController::class)->except(['edit', 'update', 'create']);
    Route::patch('purchase-orders/{purchaseOrder}/status', [App\Http\Controllers\PurchaseOrderController::class, 'updateStatus'])->name('purchase-orders.update-status');
    Route::resource('expenses', App\Http\Controllers\ExpenseController::class);
    Route::resource('tax-rates', App\Http\Controllers\TaxRateController::class);
});

require __DIR__.'/settings.php';
