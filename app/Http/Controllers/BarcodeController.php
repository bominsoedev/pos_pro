<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Picqer\Barcode\BarcodeGeneratorPNG;
use Picqer\Barcode\BarcodeGeneratorSVG;
use Illuminate\Support\Facades\Storage;

class BarcodeController extends Controller
{
    public function generate(Request $request, Product $product)
    {
        $format = $request->get('format', 'png'); // png, svg, html
        $type = $request->get('type', 'C128'); // C128, EAN13, etc.
        $width = $request->get('width', 2);
        $height = $request->get('height', 30);

        $barcodeValue = $product->barcode ?: $product->sku ?: (string)$product->id;

        if (empty($barcodeValue)) {
            return response()->json(['error' => 'Product has no barcode or SKU'], 400);
        }

        try {
            if ($format === 'svg') {
                $generator = new BarcodeGeneratorSVG();
                $barcode = $generator->getBarcode($barcodeValue, $type, $width, $height);
                return response($barcode, 200)
                    ->header('Content-Type', 'image/svg+xml');
            } elseif ($format === 'html') {
                $generator = new BarcodeGeneratorSVG();
                $barcode = $generator->getBarcode($barcodeValue, $type, $width, $height);
                return response($barcode, 200)
                    ->header('Content-Type', 'text/html');
            } else {
                $generator = new BarcodeGeneratorPNG();
                $barcode = $generator->getBarcode($barcodeValue, $type, $width, $height);
                return response($barcode, 200)
                    ->header('Content-Type', 'image/png');
            }
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to generate barcode: ' . $e->getMessage()], 500);
        }
    }

    public function printLabel(Request $request, Product $product)
    {
        $quantity = $request->get('quantity', 1);
        $format = $request->get('format', 'png');

        $barcodeValue = $product->barcode ?: $product->sku ?: (string)$product->id;

        if (empty($barcodeValue)) {
            return response()->json(['error' => 'Product has no barcode or SKU'], 400);
        }

        return view('barcodes.label', [
            'product' => $product,
            'barcodeValue' => $barcodeValue,
            'quantity' => $quantity,
            'format' => $format,
        ]);
    }

    public function autoGenerate(Product $product)
    {
        if ($product->barcode) {
            return redirect()->back()->with('error', 'Product already has a barcode.');
        }

        // Generate barcode based on product ID
        $barcode = str_pad($product->id, 8, '0', STR_PAD_LEFT);
        
        // Check if barcode already exists
        while (Product::where('barcode', $barcode)->where('id', '!=', $product->id)->exists()) {
            $barcode = str_pad(rand(10000000, 99999999), 8, '0', STR_PAD_LEFT);
        }

        $product->update(['barcode' => $barcode]);

        return redirect()->back()->with('success', 'Barcode generated successfully: ' . $barcode);
    }

    public function bulkGenerate(Request $request)
    {
        $productIds = $request->get('product_ids', []);

        if (empty($productIds)) {
            return redirect()->back()->with('error', 'No products selected.');
        }

        $products = Product::whereIn('id', $productIds)->get();
        $generated = 0;
        $skipped = 0;

        foreach ($products as $product) {
            if ($product->barcode) {
                $skipped++;
                continue;
            }

            $barcode = str_pad($product->id, 8, '0', STR_PAD_LEFT);
            
            while (Product::where('barcode', $barcode)->where('id', '!=', $product->id)->exists()) {
                $barcode = str_pad(rand(10000000, 99999999), 8, '0', STR_PAD_LEFT);
            }

            $product->update(['barcode' => $barcode]);
            $generated++;
        }

        return redirect()->back()->with('success', "Generated {$generated} barcodes. {$skipped} products already had barcodes.");
    }
}
