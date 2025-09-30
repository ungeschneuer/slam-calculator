// Test script for single decimal separator logic
console.log('Testing single decimal separator logic...\n');

// Simulate the limitDecimalPlaces function
function limitDecimalPlaces(value) {
    // Count decimal separators
    const commaCount = (value.match(/,/g) || []).length;
    const dotCount = (value.match(/\./g) || []).length;
    
    // Only allow one decimal separator
    if (commaCount > 1 || dotCount > 1) {
        // If multiple separators of same type, keep only the first one
        if (commaCount > 1) {
            const firstComma = value.indexOf(',');
            value = value.substring(0, firstComma + 1) + value.substring(firstComma + 1).replace(/,/g, '');
        }
        if (dotCount > 1) {
            const firstDot = value.indexOf('.');
            value = value.substring(0, firstDot + 1) + value.substring(firstDot + 1).replace(/\./g, '');
        }
    }
    
    // If both comma and dot are present, remove the first one and keep the last one
    if (commaCount > 0 && dotCount > 0) {
        const lastComma = value.lastIndexOf(',');
        const lastDot = value.lastIndexOf('.');
        
        if (lastComma > lastDot) {
            // Keep comma, remove all dots
            value = value.replace(/\./g, '');
            value = value.replace(',', '.');
        } else {
            // Keep dot, remove all commas
            value = value.replace(/,/g, '');
        }
    } else if (commaCount > 0) {
        // Only comma present, convert to dot
        value = value.replace(',', '.');
    }
    
    // Limit to one decimal place
    if (value.includes('.')) {
        const parts = value.split('.');
        if (parts[1].length > 1) {
            return parts[0] + '.' + parts[1].substring(0, 1);
        }
    }
    
    return value;
}

// Test cases for single decimal separator
const testCases = [
    // Valid single separators
    { input: '8,5', expected: '8.5', description: 'Single comma decimal separator' },
    { input: '9,2', expected: '9.2', description: 'Single comma decimal separator' },
    { input: '8.5', expected: '8.5', description: 'Single dot decimal separator' },
    { input: '9.2', expected: '9.2', description: 'Single dot decimal separator' },
    
    // Multiple separators of same type - should keep first one
    { input: '8,5,2', expected: '8.5', description: 'Multiple commas - keep first' },
    { input: '8.5.2', expected: '8.5', description: 'Multiple dots - keep first' },
    { input: '8,5,2,3', expected: '8.5', description: 'Many commas - keep first' },
    { input: '8.5.2.3', expected: '8.5', description: 'Many dots - keep first' },
    
    // Mixed separators - should keep last one
    { input: '8,5.2', expected: '85.2', description: 'Mixed separators - dot wins' },
    { input: '8.5,2', expected: '85.2', description: 'Mixed separators - comma wins' },
    { input: '8,5,2.3', expected: '85.2', description: 'Multiple commas + dot - dot wins' },
    { input: '8.5.2,3', expected: '85.2', description: 'Multiple dots + comma - comma wins' },
    
    // Decimal place limitation
    { input: '8,55', expected: '8.5', description: 'Comma with 2 decimal places - limit to 1' },
    { input: '8.55', expected: '8.5', description: 'Dot with 2 decimal places - limit to 1' },
    
    // Edge cases
    { input: '10', expected: '10', description: 'Integer value' },
    { input: '10,0', expected: '10.0', description: 'Comma with zero decimal' },
    { input: '10.0', expected: '10.0', description: 'Dot with zero decimal' }
];

// Run tests
let passCount = 0;
let totalCount = testCases.length;

console.log('Running tests...\n');

testCases.forEach((testCase, index) => {
    const actual = limitDecimalPlaces(testCase.input);
    const passed = actual === testCase.expected;
    
    if (passed) passCount++;
    
    console.log(`Test ${index + 1}: ${testCase.description}`);
    console.log(`  Input: "${testCase.input}"`);
    console.log(`  Expected: "${testCase.expected}"`);
    console.log(`  Actual: "${actual}"`);
    console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
});

// Summary
console.log('='.repeat(50));
console.log(`Test Summary:`);
console.log(`Passed: ${passCount}/${totalCount}`);
console.log(`Success Rate: ${Math.round((passCount/totalCount) * 100)}%`);
console.log('='.repeat(50));

if (passCount === totalCount) {
    console.log('🎉 All tests passed! Single decimal separator logic is working correctly.');
} else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
}
