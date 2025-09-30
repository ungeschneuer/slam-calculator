// Debug script for multiple decimal separators
function debugMultipleSeparators(value) {
    console.log(`\nDebugging: "${value}"`);
    
    const commaCount = (value.match(/,/g) || []).length;
    const dotCount = (value.match(/\./g) || []).length;
    
    console.log(`Comma count: ${commaCount}`);
    console.log(`Dot count: ${dotCount}`);
    
    // Only allow one decimal separator
    if (commaCount > 1 || dotCount > 1) {
        console.log('Multiple separators detected');
        // If multiple separators of same type, keep only the first one
        if (commaCount > 1) {
            const firstComma = value.indexOf(',');
            console.log(`First comma at position: ${firstComma}`);
            value = value.substring(0, firstComma + 1) + value.substring(firstComma + 1).replace(/,/g, '');
            console.log(`After removing extra commas: "${value}"`);
        }
        if (dotCount > 1) {
            const firstDot = value.indexOf('.');
            console.log(`First dot at position: ${firstDot}`);
            value = value.substring(0, firstDot + 1) + value.substring(firstDot + 1).replace(/\./g, '');
            console.log(`After removing extra dots: "${value}"`);
        }
    }
    
    // If both comma and dot are present, remove the first one and keep the last one
    if (commaCount > 0 && dotCount > 0) {
        console.log('Both separators present');
        const lastComma = value.lastIndexOf(',');
        const lastDot = value.lastIndexOf('.');
        
        console.log(`Last comma at: ${lastComma}, Last dot at: ${lastDot}`);
        
        if (lastComma > lastDot) {
            console.log('Keep comma, remove dots');
            value = value.replace(/\./g, '');
            value = value.replace(',', '.');
            console.log(`After processing: "${value}"`);
        } else {
            console.log('Keep dot, remove commas');
            value = value.replace(/,/g, '');
            console.log(`After processing: "${value}"`);
        }
    } else if (commaCount > 0) {
        console.log('Only comma present');
        value = value.replace(',', '.');
        console.log(`After converting comma to dot: "${value}"`);
    }
    
    return value;
}

// Test the problematic cases
console.log('Testing problematic cases:');
debugMultipleSeparators('8,5,2.3');
debugMultipleSeparators('8.5.2,3');
