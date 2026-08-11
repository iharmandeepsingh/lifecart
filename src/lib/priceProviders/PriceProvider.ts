import { Currency } from '../currency';

export interface PriceRecordItem {
  productId: string;
  productName: string;
  storeName: string;
  price: number;
  unitPrice: number;
  currency: Currency;
  source: 'LIVE_API' | 'RECEIPT_DERIVED' | 'ADMIN' | 'DEMO';
  timestamp: Date;
  isAvailable: boolean;
  confidence: number;
}

export interface PriceProvider {
  name: string;
  sourceType: 'LIVE_API' | 'RECEIPT_DERIVED' | 'ADMIN' | 'DEMO';
  fetchPrice(productId: string, storeName: string): Promise<PriceRecordItem | null>;
  searchPrices(productName: string): Promise<PriceRecordItem[]>;
}

export class DemoPriceProvider implements PriceProvider {
  name = 'LifeCart Demo Price Provider';
  sourceType: 'DEMO' = 'DEMO';

  async fetchPrice(productId: string, storeName: string): Promise<PriceRecordItem | null> {
    return {
      productId,
      productName: 'Organic Whole Milk',
      storeName,
      price: 3.99,
      unitPrice: 3.99,
      currency: 'EUR',
      source: 'DEMO',
      timestamp: new Date(),
      isAvailable: true,
      confidence: 80,
    };
  }

  async searchPrices(productName: string): Promise<PriceRecordItem[]> {
    return [
      {
        productId: 'demo-1',
        productName,
        storeName: 'Walmart Supercenter',
        price: 3.89,
        unitPrice: 3.89,
        currency: 'EUR',
        source: 'DEMO',
        timestamp: new Date(),
        isAvailable: true,
        confidence: 85,
      },
      {
        productId: 'demo-1',
        productName,
        storeName: "Trader Joe's",
        price: 4.29,
        unitPrice: 4.29,
        currency: 'EUR',
        source: 'DEMO',
        timestamp: new Date(),
        isAvailable: true,
        confidence: 85,
      },
    ];
  }
}
