export interface BuyingRecommendationInput {
  category: string; // Laptop, Phone, Headphones, TV, Appliance
  budget: number;
  usage: string; // Programming, Gaming, University, Everyday, Audio, Photo/Video
  priority: string; // Battery, Performance, Portability, Display, Value
}

export interface RankedProductRecommendation {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  matchScore: number; // 0 - 100%
  badge: 'Best Overall' | 'Best Value' | 'Best Performance';
  explanation: string;
  specs: Record<string, string>;
  pros: string[];
  cons: string[];
  dealScore: string;
  valueScore: number; // 1 - 10
}

const CATALOG_DATABASE: RankedProductRecommendation[] = [
  {
    id: 'lap-1',
    name: 'MacBook Air M3 (15-inch, 16GB RAM, 512GB SSD)',
    brand: 'Apple',
    category: 'Laptop',
    price: 1199,
    matchScore: 94,
    badge: 'Best Overall',
    explanation: 'Perfect match for University + Programming! M3 chip delivers exceptional performance with up to 18-hour battery life and silent fanless design.',
    specs: {
      Processor: 'Apple M3 8-core CPU',
      RAM: '16GB Unified Memory',
      Storage: '512GB NVMe SSD',
      Battery: '18 hours battery life',
      Weight: '1.51 kg (Light & Portable)',
      Display: '15.3-inch Liquid Retina Display',
    },
    pros: ['Industry-leading battery life', 'Top-tier build quality & trackpad', 'Silent fanless operation'],
    cons: ['Limited port selection', 'No active cooling fan for heavy sustained 3D gaming'],
    dealScore: '🔥 10% below MSRP',
    valueScore: 9.2,
  },
  {
    id: 'lap-2',
    name: 'ASUS ROG Zephyrus G14 (AMD Ryzen 9, RTX 4060, 16GB)',
    brand: 'ASUS',
    category: 'Laptop',
    price: 1099,
    matchScore: 89,
    badge: 'Best Performance',
    explanation: 'Top choice for Gaming + Programming! Dedicated RTX 4060 graphics card handles AAA gaming and machine learning smoothly with 120Hz OLED screen.',
    specs: {
      Processor: 'AMD Ryzen 9 8945HS',
      GPU: 'NVIDIA GeForce RTX 4060 8GB',
      RAM: '16GB LPDDR5X',
      Storage: '1TB PCIe 4.0 SSD',
      Display: '14-inch 3K 120Hz OLED',
      Weight: '1.50 kg',
    },
    pros: ['Stunning 120Hz OLED display', 'High gaming performance', 'Ultra-compact 14" chassis'],
    cons: ['Battery life lower than MacBook (7-8 hours)', 'Gets warm under full load'],
    dealScore: '⚡ Historic Low Price',
    valueScore: 9.0,
  },
  {
    id: 'lap-3',
    name: 'Lenovo IdeaPad Slim 5 (Intel Core Ultra 7, 16GB, 512GB)',
    brand: 'Lenovo',
    category: 'Laptop',
    price: 799,
    matchScore: 85,
    badge: 'Best Value',
    explanation: 'Exceptional value for University + Everyday coding! Well within budget at €799 with sharp 2.5K display and ergonomic keyboard.',
    specs: {
      Processor: 'Intel Core Ultra 7 155H',
      RAM: '16GB LPDDR5',
      Storage: '512GB PCIe SSD',
      Battery: '11 hours battery life',
      Display: '14-inch 2.5K IPS (300 nits)',
      Weight: '1.46 kg',
    },
    pros: ['Unbeatable €799 price point', 'Great keyboard feel', 'Sturdy aluminum lid'],
    cons: ['Integrated graphics (light gaming only)', 'Average speakers'],
    dealScore: 'Fair Price',
    valueScore: 9.4,
  },
  {
    id: 'phone-1',
    name: 'Google Pixel 8 Pro (128GB, Obsidian)',
    brand: 'Google',
    category: 'Phone',
    price: 749,
    matchScore: 92,
    badge: 'Best Overall',
    explanation: 'Unrivaled AI camera software with 7 years of Android OS updates and brilliant 120Hz Super Actua display.',
    specs: {
      Processor: 'Google Tensor G3',
      RAM: '12GB',
      Camera: '50MP Main + 48MP Ultrawide + 48MP 5x Telephoto',
      Battery: '5050 mAh (1.5 days)',
      Screen: '6.7-inch OLED 120Hz',
    },
    pros: ['Best smartphone camera photo quality', '7 years OS updates', 'Pure Android UI'],
    cons: ['Tensor G3 isn’t built for hardcore gaming benchmarks'],
    dealScore: '🔥 €150 Off MSRP',
    valueScore: 9.1,
  },
];

export function calculateBuyingRecommendations(input: BuyingRecommendationInput): RankedProductRecommendation[] {
  const categoryProducts = CATALOG_DATABASE.filter(
    (p) => p.category.toLowerCase() === input.category.toLowerCase()
  );

  if (categoryProducts.length === 0) return CATALOG_DATABASE;

  return categoryProducts
    .map((p) => {
      let score = 70;

      // Hard budget check
      if (p.price <= input.budget) {
        score += 15;
      } else {
        const over = p.price - input.budget;
        score -= Math.min(25, Math.round(over / 50));
      }

      // Priority adjustments
      if (input.priority === 'Battery' && p.specs.Battery?.includes('18')) score += 10;
      if (input.priority === 'Performance' && (p.specs.GPU || p.specs.Processor?.includes('M3'))) score += 10;
      if (input.priority === 'Portability' && p.specs.Weight?.includes('Light')) score += 8;

      const matchScore = Math.min(98, Math.max(60, score));

      return {
        ...p,
        matchScore,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}
