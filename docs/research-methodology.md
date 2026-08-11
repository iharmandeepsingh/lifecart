# LifeCart Research & Evaluation Methodology

This document outlines the empirical evaluation framework used in **LifeCart V1.0** for academic research and university presentations.

---

## 📈 Evaluated Algorithms

### 1. OCR Accuracy vs Correction Rate
- **Metric**: Difference between OCRConfidence % and confirmed human corrections (`correctedItemsCount`).
- **Equation**: `Accuracy = ((Total Items - Corrected Items) / Total Items) * 100`.

### 2. Dual Purchase Prediction Models
- **Baseline Model**: Mean Purchase Interval ($\bar{I} = \frac{1}{n-1} \sum_{i=1}^{n-1} (T_{i+1} - T_i)$).
- **Improved Model**: Weighted Decay ($w_i = 1.5^i$) + Quantity Decay Factor.
- **Evaluation Metric**: Mean Absolute Error (MAE in days) compared against actual next purchase dates.
