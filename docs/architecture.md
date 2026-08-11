# LifeCart V1.0 — Architecture & Research Technical Documentation

LifeCart is an intelligent, multi-tenant SaaS decision-support platform designed for individuals, families, students, and roommates to manage everyday household activities, groceries, expenses, and document management.

---

## 🏛️ System Architecture

```mermaid
graph TD
    User[Client App / Mobile PWA] --> API[Next.js App Router API Layer]
    API --> Security[Security & Household Isolation Layer]
    Security --> Engines[LifeCart Core Engines]
    
    Engines --> OCR[OCR & Verified Evaluation Pipeline]
    Engines --> Normalization[Multi-Stage Product Normalization Engine]
    Engines --> Prediction[Dual Purchase Prediction Engine (Baseline vs Improved)]
    Engines --> Pricing[Multi-Provider Price Intelligence Architecture]
    Engines --> Optimizer[Realistic Multi-Store Basket Optimizer]
    Engines --> AI[Secure LifeCart AI Tool Assistant]
    
    Engines --> DB[(Prisma ORM + PostgreSQL / SQLite)]
    Engines --> MetricsStore[(Research & Evaluation Metrics Store)]
```

---

## 🔒 Security & Data Isolation Architecture

- **IDOR Protection**: All API route handlers enforce `verifyHouseholdAccess(userId, householdId)` using primary compound keys on `HouseholdMember`.
- **Server-Side Admin Role Enforcement**: The University Evaluation Dashboard (`/admin/evaluation`) checks `role === 'SYSTEM_ADMIN'` on the server before serving data.
- **MIME & Upload Restrictions**: File upload verification enforces a 10MB limit and restricts formats to `PNG`, `JPG`, `WebP`, and `PDF`.

---

## 📊 Evaluation & Research Methodology

LifeCart includes built-in anonymized research tracking for empirical evaluation:

1. **OCR Performance**: Tracks `ocrConfidence`, `extractedItemsCount`, and `correctedItemsCount` to compute true OCR Accuracy %.
2. **Dual Purchase Prediction Engine**:
   - **Baseline**: Mean Purchase Interval.
   - **Improved**: Exponentially Weighted Recent Intervals + Quantity Decay + Consumption Rate.
   - Compares Mean Absolute Error (MAE in days) and Suggestion Acceptance Rate %.
3. **Multi-Store Basket Optimizer**: Calculates raw savings vs. travel cost ($) and trip duration (mins) trade-offs.
