<?php

namespace App\Notifications;

use App\Models\Product;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LowStockAlert extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public Product $product
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
        
        return (new MailMessage)
            ->subject(__('notifications.low_stock_subject', ['product' => $this->product->name]))
            ->greeting(__('notifications.hello'))
            ->line(__('notifications.low_stock_message', [
                'product' => $this->product->name,
                'sku' => $this->product->sku,
                'stock' => $this->product->stock_quantity,
                'threshold' => $this->product->low_stock_threshold,
            ]))
            ->action(__('notifications.view_product'), route('products.show', $this->product->id))
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
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'stock_quantity' => $this->product->stock_quantity,
            'low_stock_threshold' => $this->product->low_stock_threshold,
        ];
    }
}
