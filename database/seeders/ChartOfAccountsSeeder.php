<?php

namespace Database\Seeders;

use App\Services\AccountingService;
use Illuminate\Database\Seeder;

class ChartOfAccountsSeeder extends Seeder
{
    public function run(): void
    {
        AccountingService::seedDefaultAccounts();
    }
}
