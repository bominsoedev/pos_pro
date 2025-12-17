<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'type',
        'description',
    ];

    public static function get(string $key, $default = null)
    {
        $cacheKey = "settings.{$key}";

        return Cache::rememberForever($cacheKey, function () use ($key, $default) {
            $setting = static::where('key', $key)->first();
            
            if (!$setting) {
                return $default;
            }

            return match ($setting->type) {
                'boolean' => (bool) $setting->value,
                'integer' => (int) $setting->value,
                'float' => (float) $setting->value,
                'json' => json_decode($setting->value, true),
                default => $setting->value,
            };
        });
    }

    public static function set(string $key, $value, string $type = 'string', ?string $description = null): void
    {
        $setting = static::firstOrNew(['key' => $key]);
        
        $setting->value = match ($type) {
            'json' => json_encode($value),
            default => (string) $value,
        };
        
        $setting->type = $type;
        
        if ($description) {
            $setting->description = $description;
        }
        
        $setting->save();

        // Clear cache for this key so the new value is used
        Cache::forget("settings.{$key}");
    }
}

