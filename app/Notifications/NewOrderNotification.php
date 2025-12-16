<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewOrderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public Order $order
    ) {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $storeName = \App\Models\Setting::get('store_name', 'Store');
        $order = $this->order->load(['items.product', 'customer', 'user']);
        
        return (new MailMessage)
            ->subject(__('notifications.new_order_subject', ['order' => $order->order_number]))
            ->greeting(__('notifications.hello'))
            ->line(__('notifications.new_order_message', [
                'order' => $order->order_number,
                'customer' => $order->customer?->name ?? __('notifications.walk_in_customer'),
                'cashier' => $order->user->name,
                'total' => number_format($order->total, 0) . ' ' . \App\Models\Setting::get('currency_symbol', 'K'),
                'items' => $order->items->sum('quantity'),
            ]))
            ->action(__('notifications.view_order'), route('orders.show', $order->id))
            ->line(__('notifications.thank_you', ['store' => $storeName]));
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'total' => $this->order->total,
            'customer_name' => $this->order->customer?->name,
        ];
    }
}
