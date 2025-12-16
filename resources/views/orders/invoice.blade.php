<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice - {{ $order->order_number }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .info-section {
            display: table;
            width: 100%;
            margin-bottom: 30px;
        }
        .info-left, .info-right {
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }
        .info-right {
            text-align: right;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        .text-right {
            text-align: right;
        }
        .total-section {
            margin-top: 20px;
            border-top: 2px solid #000;
            padding-top: 10px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }
        .total-final {
            font-size: 16px;
            font-weight: bold;
            margin-top: 10px;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $settings['store_name'] }}</h1>
        @if($settings['store_address'])
            <p>{{ $settings['store_address'] }}</p>
        @endif
        @if($settings['store_phone'])
            <p>Phone: {{ $settings['store_phone'] }}</p>
        @endif
        @if($settings['store_email'])
            <p>Email: {{ $settings['store_email'] }}</p>
        @endif
    </div>

    <div class="info-section">
        <div class="info-left">
            <h3>Bill To:</h3>
            <p>
                @if($order->customer)
                    <strong>{{ $order->customer->name }}</strong><br>
                    @if($order->customer->email) {{ $order->customer->email }}<br> @endif
                    @if($order->customer->phone) {{ $order->customer->phone }}<br> @endif
                    @if($order->customer->address) {{ $order->customer->address }}<br> @endif
                @else
                    Walk-in Customer
                @endif
            </p>
        </div>
        <div class="info-right">
            <h3>Invoice Details:</h3>
            <p>
                <strong>Invoice #:</strong> {{ $order->order_number }}<br>
                <strong>Date:</strong> {{ $order->created_at->format('Y-m-d H:i') }}<br>
                <strong>Cashier:</strong> {{ $order->user->name }}<br>
                <strong>Status:</strong> {{ ucfirst($order->status) }}
            </p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Item</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Price</th>
                <th class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->items as $item)
            <tr>
                <td>{{ $item->product_name }}</td>
                <td class="text-right">{{ $item->quantity }}</td>
                <td class="text-right">{{ number_format($item->price, 0) }} {{ $settings['currency_symbol'] }}</td>
                <td class="text-right">{{ number_format($item->total, 0) }} {{ $settings['currency_symbol'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="total-section">
        <div class="total-row">
            <span>Subtotal:</span>
            <span>{{ number_format($order->subtotal, 0) }} {{ $settings['currency_symbol'] }}</span>
        </div>
        @if($order->tax_amount > 0)
        <div class="total-row">
            <span>Tax:</span>
            <span>{{ number_format($order->tax_amount, 0) }} {{ $settings['currency_symbol'] }}</span>
        </div>
        @endif
        @if($order->discount_amount > 0)
        <div class="total-row">
            <span>Discount:</span>
            <span>-{{ number_format($order->discount_amount, 0) }} {{ $settings['currency_symbol'] }}</span>
        </div>
        @endif
        <div class="total-row total-final">
            <span>Total:</span>
            <span>{{ number_format($order->total, 0) }} {{ $settings['currency_symbol'] }}</span>
        </div>
    </div>

    @if($order->payments->isNotEmpty())
    <div style="margin-top: 20px;">
        <h3>Payment:</h3>
        @foreach($order->payments as $payment)
        <p>
            <strong>{{ ucfirst(str_replace('_', ' ', $payment->method)) }}:</strong>
            {{ number_format($payment->amount, 0) }} {{ $settings['currency_symbol'] }}
        </p>
        @endforeach
    </div>
    @endif

    <div class="footer">
        <p>Thank you for your business!</p>
        <p>Generated on {{ now()->format('Y-m-d H:i:s') }}</p>
    </div>
</body>
</html>
