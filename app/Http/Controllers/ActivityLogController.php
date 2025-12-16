<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ActivityLog::with(['causer']);

        if ($request->search) {
            $query->where('description', 'like', "%{$request->search}%");
        }

        if ($request->log_name) {
            $query->where('log_name', $request->log_name);
        }

        if ($request->subject_type) {
            $query->where('subject_type', $request->subject_type);
        }

        if ($request->event) {
            $query->where('event', $request->event);
        }

        if ($request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate(50);

        return Inertia::render('activity-logs/index', [
            'logs' => $logs,
            'filters' => $request->only(['search', 'log_name', 'subject_type', 'event', 'date_from', 'date_to']),
        ]);
    }
}
