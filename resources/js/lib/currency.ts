/**
 * Format amount as Myanmar Kyat (MMK)
 * @param amount - The amount to format
 * @param locale - Optional locale for formatting (defaults to 'en-US')
 * @returns Formatted string with K symbol
 */
export function formatCurrency(amount: number | string | null | undefined, locale: string = 'en-US'): string {
    const numAmount = Number(amount) || 0;
    
    // Format with commas for thousands separator
    const formatted = numAmount.toLocaleString(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
    
    return `${formatted} K`;
}

/**
 * Format amount as Myanmar Kyat with decimals (for prices)
 * @param amount - The amount to format
 * @param locale - Optional locale for formatting (defaults to 'en-US')
 * @returns Formatted string with K symbol and 2 decimals
 */
export function formatPrice(amount: number | string | null | undefined, locale: string = 'en-US'): string {
    const numAmount = Number(amount) || 0;
    
    // Format with commas and 2 decimal places
    const formatted = numAmount.toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    
    return `${formatted} K`;
}

