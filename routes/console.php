<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Process recurring journal entries daily at midnight
Schedule::command('accounting:process-recurring')
    ->daily()
    ->at('00:05')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/recurring-entries.log'));
