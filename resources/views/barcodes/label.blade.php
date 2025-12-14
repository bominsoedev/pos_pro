<!DOCTYPE html>
<html>
<head>
    <title>Barcode Label - {{ $product->name }}</title>
    <style>
        @media print {
            @page {
                size: 50mm 30mm;
                margin: 0;
            }
            body {
                margin: 0;
                padding: 5mm;
            }
        }
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 5mm;
        }
        .label {
            width: 50mm;
            height: 30mm;
            border: 1px solid #000;
            padding: 2mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        .product-name {
            font-size: 8pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 1mm;
            word-wrap: break-word;
        }
        .barcode-container {
            text-align: center;
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .barcode-value {
            font-size: 7pt;
            text-align: center;
            margin-top: 1mm;
        }
        .price {
            font-size: 9pt;
            font-weight: bold;
            text-align: center;
            margin-top: 1mm;
        }
    </style>
</head>
<body>
    @for($i = 0; $i < $quantity; $i++)
        <div class="label">
            <div class="product-name">{{ Str::limit($product->name, 20) }}</div>
            <div class="barcode-container">
                <img src="/products/{{ $product->id }}/barcode?format={{ $format }}" alt="Barcode" style="max-width: 100%; max-height: 15mm;">
            </div>
            <div class="barcode-value">{{ $barcodeValue }}</div>
            <div class="price">{{ number_format($product->price, 0) }} MMK</div>
        </div>
        @if($i < $quantity - 1)
            <div style="page-break-after: always;"></div>
        @endif
    @endfor

    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>

