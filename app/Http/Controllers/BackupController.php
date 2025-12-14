<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class BackupController extends Controller
{
    public function index()
    {
        $backups = $this->getBackupFiles();

        return Inertia::render('backup/index', [
            'backups' => $backups,
        ]);
    }

    public function create()
    {
        try {
            $filename = 'backup_' . Carbon::now()->format('Y-m-d_His') . '.sql';
            $filepath = storage_path('app/backups/' . $filename);

            // Create backups directory if it doesn't exist
            if (!file_exists(storage_path('app/backups'))) {
                mkdir(storage_path('app/backups'), 0755, true);
            }

            $database = config('database.connections.mysql.database');
            $username = config('database.connections.mysql.username');
            $password = config('database.connections.mysql.password');
            $host = config('database.connections.mysql.host');

            // Create SQL dump
            $command = sprintf(
                'mysqldump --user=%s --password=%s --host=%s %s > %s',
                escapeshellarg($username),
                escapeshellarg($password),
                escapeshellarg($host),
                escapeshellarg($database),
                escapeshellarg($filepath)
            );

            exec($command, $output, $returnVar);

            if ($returnVar !== 0) {
                // Fallback: Use Laravel's database dump
                Artisan::call('db:backup', [
                    '--path' => 'backups/' . $filename,
                ]);
            }

            return redirect()->back()->with('success', 'Backup created successfully: ' . $filename);
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to create backup: ' . $e->getMessage());
        }
    }

    public function download($filename)
    {
        $filepath = storage_path('app/backups/' . $filename);

        if (!file_exists($filepath)) {
            return redirect()->back()->with('error', 'Backup file not found.');
        }

        return response()->download($filepath, $filename);
    }

    public function restore(Request $request)
    {
        $validated = $request->validate([
            'backup_file' => 'required|file|mimes:sql',
        ]);

        try {
            $file = $validated['backup_file'];
            $filepath = $file->storeAs('temp', 'restore_' . time() . '.sql');

            $database = config('database.connections.mysql.database');
            $username = config('database.connections.mysql.username');
            $password = config('database.connections.mysql.password');
            $host = config('database.connections.mysql.host');
            $fullPath = storage_path('app/' . $filepath);

            // Restore database
            $command = sprintf(
                'mysql --user=%s --password=%s --host=%s %s < %s',
                escapeshellarg($username),
                escapeshellarg($password),
                escapeshellarg($host),
                escapeshellarg($database),
                escapeshellarg($fullPath)
            );

            exec($command, $output, $returnVar);

            // Clean up temp file
            Storage::delete($filepath);

            if ($returnVar !== 0) {
                return redirect()->back()->with('error', 'Failed to restore backup.');
            }

            return redirect()->back()->with('success', 'Database restored successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to restore backup: ' . $e->getMessage());
        }
    }

    public function destroy($filename)
    {
        $filepath = storage_path('app/backups/' . $filename);

        if (!file_exists($filepath)) {
            return redirect()->back()->with('error', 'Backup file not found.');
        }

        unlink($filepath);

        return redirect()->back()->with('success', 'Backup deleted successfully.');
    }

    public function exportData(Request $request)
    {
        $type = $request->get('type', 'all'); // all, products, customers, orders

        try {
            $filename = 'export_' . $type . '_' . Carbon::now()->format('Y-m-d_His') . '.json';
            $filepath = storage_path('app/exports/' . $filename);

            if (!file_exists(storage_path('app/exports'))) {
                mkdir(storage_path('app/exports'), 0755, true);
            }

            $data = [];

            if ($type === 'all' || $type === 'products') {
                $data['products'] = DB::table('products')->get();
                $data['categories'] = DB::table('categories')->get();
            }

            if ($type === 'all' || $type === 'customers') {
                $data['customers'] = DB::table('customers')->get();
            }

            if ($type === 'all' || $type === 'orders') {
                $data['orders'] = DB::table('orders')->get();
                $data['order_items'] = DB::table('order_items')->get();
            }

            file_put_contents($filepath, json_encode($data, JSON_PRETTY_PRINT));

            return response()->download($filepath, $filename)->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to export data: ' . $e->getMessage());
        }
    }

    private function getBackupFiles(): array
    {
        $backups = [];
        $backupDir = storage_path('app/backups');

        if (file_exists($backupDir)) {
            $files = glob($backupDir . '/*.sql');
            
            foreach ($files as $file) {
                $backups[] = [
                    'filename' => basename($file),
                    'size' => filesize($file),
                    'created_at' => date('Y-m-d H:i:s', filemtime($file)),
                ];
            }

            // Sort by created_at descending
            usort($backups, function ($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });
        }

        return $backups;
    }
}
