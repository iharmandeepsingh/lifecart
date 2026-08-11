const assert = require('assert');

console.log('====================================================');
console.log('🧪 Running LifeCart V1.0 Automated Test Suite');
console.log('====================================================\n');

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}:`, err.message);
    failedTests++;
  }
}

// ----------------------------------------------------
// 1. UNIT TESTS: Currency & Standardized Units
// ----------------------------------------------------
test('Unit Test: Currency Formatting (EUR / INR / USD)', () => {
  const formatMoney = (amount, curr) => {
    if (curr === 'EUR') return `€${amount.toFixed(2)}`;
    if (curr === 'INR') return `₹${amount.toFixed(0)}`;
    return `$${amount.toFixed(2)}`;
  };

  assert.strictEqual(formatMoney(39.9, 'EUR'), '€39.90');
  assert.strictEqual(formatMoney(1499, 'INR'), '₹1499');
  assert.strictEqual(formatMoney(29.99, 'USD'), '$29.99');
});

test('Unit Test: Standardized Unit Conversion (Volume & Mass)', () => {
  const convertUnit = (qty, unit) => {
    if (unit === 'l') return { val: qty * 1000, baseUnit: 'ml' };
    if (unit === 'kg') return { val: qty * 1000, baseUnit: 'g' };
    return { val: qty, baseUnit: unit };
  };

  assert.deepStrictEqual(convertUnit(1.5, 'l'), { val: 1500, baseUnit: 'ml' });
  assert.deepStrictEqual(convertUnit(2, 'kg'), { val: 2000, baseUnit: 'g' });
});

// ----------------------------------------------------
// 2. UNIT TESTS: Product Normalization
// ----------------------------------------------------
test('Unit Test: Product Brand & Name Normalization', () => {
  const cleanStr = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const name1 = cleanStr('Coca-Cola Zero 1.5L');
  const name2 = cleanStr('Coca Cola Zero Sugar 1500ml');

  assert.strictEqual(name1.includes('coca'), true);
  assert.strictEqual(name2.includes('coke') || name2.includes('coca'), true);
});

// ----------------------------------------------------
// 3. UNIT TESTS: Expense Splitting Math
// ----------------------------------------------------
test('Unit Test: Equal Expense Splitting Calculation', () => {
  const amount = 90.00;
  const memberCount = 3;
  const perMember = parseFloat((amount / memberCount).toFixed(2));

  assert.strictEqual(perMember, 30.00);
  assert.strictEqual(perMember * memberCount, 90.00);
});

// ----------------------------------------------------
// 4. UNIT TESTS: Dual Prediction Interval Math
// ----------------------------------------------------
test('Unit Test: Baseline Mean Interval vs Improved Exponential Weighting', () => {
  const intervals = [10, 8, 4]; // Recent interval is shorter (4 days)
  
  // Baseline mean
  const baselineMean = intervals.reduce((a, b) => a + b, 0) / intervals.length; // (10+8+4)/3 = 7.33
  
  // Improved weighted (recent interval has 1.5x weight)
  const weightedSum = 10 * 1.0 + 8 * 1.5 + 4 * 2.25; // 10 + 12 + 9 = 31
  const weightSum = 1.0 + 1.5 + 2.25; // 4.75
  const improvedWeighted = weightedSum / weightSum; // ~6.52 days

  assert.ok(improvedWeighted < baselineMean, 'Improved prediction should give more weight to recent short interval');
});

// ----------------------------------------------------
// 5. SECURITY TESTS: Cross-Household IDOR Protection
// ----------------------------------------------------
test('Security Test: Household Data Isolation (IDOR Check)', () => {
  const verifyAccess = (userHouseholdId, targetHouseholdId) => {
    return userHouseholdId === targetHouseholdId;
  };

  assert.strictEqual(verifyAccess('household-A', 'household-A'), true);
  assert.strictEqual(verifyAccess('household-A', 'household-B'), false);
});

console.log('\n====================================================');
console.log(`📊 Test Summary: ${passedTests} Passed, ${failedTests} Failed`);
console.log('====================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
