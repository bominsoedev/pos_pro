<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\Setting;
use App\Models\Way;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        // Get current way from session
        $currentWayId = session('current_way_id');
        $currentWay = $currentWayId ? Way::find($currentWayId) : null;
        
        // Get all active ways for selector
        $activeWays = Way::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'description']);

        return [
            ...parent::share($request),
            'name' => Setting::get('app_name', config('app.name', 'Laravel')),
            'app_name' => Setting::get('app_name', config('app.name', 'Laravel')),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'currentWay' => $currentWay ? [
                'id' => $currentWay->id,
                'name' => $currentWay->name,
                'code' => $currentWay->code,
            ] : null,
            'ways' => $activeWays,
            'features' => $this->getFeatures(),
        ];
    }

    /**
     * Get all feature flags with database values taking priority over config.
     */
    private function getFeatures(): array
    {
        $configFeatures = config('features', []);
        $features = [];

        foreach ($configFeatures as $feature => $defaultValue) {
            $features[$feature] = feature_enabled($feature);
        }

        return $features;
    }
}
