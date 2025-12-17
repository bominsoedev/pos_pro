<?php

use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('guests are redirected from business feature pages', function () {
    $routes = [
        'quotations.index',
        'stock-transfers.index',
        'gift-cards.index',
        'currencies.index',
        'activity-logs.index',
    ];

    foreach ($routes as $route) {
        $this->get(route($route))->assertRedirect(route('login'));
    }
});

test('authenticated users can view business feature index pages', function () {
    $this->actingAs(User::factory()->create());

    $routes = [
        'quotations.index',
        'stock-transfers.index',
        'gift-cards.index',
        'currencies.index',
        'activity-logs.index',
    ];

    foreach ($routes as $route) {
        $this->get(route($route))->assertOk();
    }
});

