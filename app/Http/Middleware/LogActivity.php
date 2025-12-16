<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\ActivityLog;

class LogActivity
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only log for authenticated users and non-GET requests
        if (auth()->check() && !$request->isMethod('GET')) {
            try {
                $subject = null;
                $subjectType = null;
                $subjectId = null;

                // Try to get the subject from route model binding
                $route = $request->route();
                if ($route) {
                    foreach ($route->parameters() as $key => $value) {
                        if (is_object($value) && method_exists($value, 'getTable')) {
                            $subject = $value;
                            $subjectType = get_class($value);
                            $subjectId = $value->id;
                            break;
                        }
                    }
                }

                $description = $this->getDescription($request, $subject);

                ActivityLog::create([
                    'log_name' => $this->getLogName($request),
                    'description' => $description,
                    'subject_type' => $subjectType,
                    'subject_id' => $subjectId,
                    'event' => $request->method(),
                    'causer_type' => get_class(auth()->user()),
                    'causer_id' => auth()->id(),
                    'properties' => [
                        'url' => $request->fullUrl(),
                        'method' => $request->method(),
                        'ip' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                    ],
                ]);
            } catch (\Exception $e) {
                // Silently fail - don't break the application
                \Log::error('Activity log error: ' . $e->getMessage());
            }
        }

        return $response;
    }

    private function getLogName(Request $request): string
    {
        $route = $request->route();
        if ($route) {
            $name = $route->getName();
            if ($name) {
                return explode('.', $name)[0] ?? 'default';
            }
        }
        return 'default';
    }

    private function getDescription(Request $request, $subject = null): string
    {
        $method = $request->method();
        $route = $request->route();
        $action = $route?->getActionMethod() ?? 'unknown';

        $resource = $this->getResourceName($route);
        
        if ($subject) {
            $subjectName = $this->getSubjectName($subject);
            return ucfirst($method) . " {$resource}: {$subjectName}";
        }

        return ucfirst($method) . " {$resource}";
    }

    private function getResourceName($route): string
    {
        if (!$route) {
            return 'resource';
        }

        $name = $route->getName();
        if ($name) {
            $parts = explode('.', $name);
            return $parts[0] ?? 'resource';
        }

        $uri = $route->uri();
        $segments = explode('/', $uri);
        return $segments[0] ?? 'resource';
    }

    private function getSubjectName($subject): string
    {
        if (method_exists($subject, 'name')) {
            return $subject->name;
        }
        if (method_exists($subject, 'title')) {
            return $subject->title;
        }
        if (isset($subject->id)) {
            return get_class($subject) . ' #' . $subject->id;
        }
        return 'Unknown';
    }
}
