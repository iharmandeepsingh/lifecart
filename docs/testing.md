# LifeCart Automated Testing Guide

LifeCart includes a lightweight, zero-dependency automated test runner (`scripts/run-tests.js`).

---

## 🧪 Running Automated Tests

```bash
node scripts/run-tests.js
```

### Covered Test Categories:
1. **Unit Tests**:
   - Currency Formatting (`EUR`, `INR`, `USD`).
   - Standardized Unit Conversions (`l` → `ml`, `kg` → `g`).
   - Product String Cleaning & Brand Normalization.
   - Equal Expense Splitting & Settle Up math.
   - Baseline vs Improved Prediction weighting algorithm.
2. **Security Tests**:
   - Cross-Household IDOR Data Access Isolation.
