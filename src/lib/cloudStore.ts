// Real-time Universal Cloud Sync Store for Netlify & Multi-Device Operations
// Ensures data added on Mobile Phone A immediately syncs to Mobile Phone B and Laptops worldwide

const globalForStore = globalThis as unknown as {
  __LIFECART_GROCERY_ITEMS__?: any[];
  __LIFECART_EXPENSES__?: any[];
  __LAST_FETCH_TIME__?: number;
};

if (!globalForStore.__LIFECART_GROCERY_ITEMS__) {
  globalForStore.__LIFECART_GROCERY_ITEMS__ = [];
}

if (!globalForStore.__LIFECART_EXPENSES__) {
  globalForStore.__LIFECART_EXPENSES__ = [];
}

// Shared Cloud Bin Endpoint for Household CART-892X
const SHARED_CLOUD_ENDPOINT = 'https://api.npoint.io/088b90a618e478546bdf';

export function getMemoryGroceryItems(): any[] {
  return globalForStore.__LIFECART_GROCERY_ITEMS__ || [];
}

export function setMemoryGroceryItems(items: any[]) {
  globalForStore.__LIFECART_GROCERY_ITEMS__ = items;
  syncPushToCloud();
}

export function addMemoryGroceryItem(item: any) {
  if (!globalForStore.__LIFECART_GROCERY_ITEMS__) {
    globalForStore.__LIFECART_GROCERY_ITEMS__ = [];
  }
  globalForStore.__LIFECART_GROCERY_ITEMS__.unshift(item);
  syncPushToCloud();
}

export function getMemoryExpenses(): any[] {
  return globalForStore.__LIFECART_EXPENSES__ || [];
}

export function setMemoryExpenses(expenses: any[]) {
  globalForStore.__LIFECART_EXPENSES__ = expenses;
  syncPushToCloud();
}

export function addMemoryExpense(expense: any) {
  if (!globalForStore.__LIFECART_EXPENSES__) {
    globalForStore.__LIFECART_EXPENSES__ = [];
  }
  globalForStore.__LIFECART_EXPENSES__.unshift(expense);
  syncPushToCloud();
}

// Asynchronously pull latest shared data from cloud endpoint
export async function syncPullFromCloud(): Promise<{ groceryItems: any[]; expenses: any[] }> {
  try {
    const now = Date.now();
    // Cache for 1 second to avoid rate limiting
    if (globalForStore.__LAST_FETCH_TIME__ && now - globalForStore.__LAST_FETCH_TIME__ < 1000) {
      return {
        groceryItems: globalForStore.__LIFECART_GROCERY_ITEMS__ || [],
        expenses: globalForStore.__LIFECART_EXPENSES__ || [],
      };
    }

    const res = await fetch(SHARED_CLOUD_ENDPOINT, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.groceryItems)) {
        globalForStore.__LIFECART_GROCERY_ITEMS__ = data.groceryItems;
      }
      if (Array.isArray(data.expenses)) {
        globalForStore.__LIFECART_EXPENSES__ = data.expenses;
      }
      globalForStore.__LAST_FETCH_TIME__ = now;
    }
  } catch (err) {
    console.warn('Cloud pull warning:', err);
  }

  return {
    groceryItems: globalForStore.__LIFECART_GROCERY_ITEMS__ || [],
    expenses: globalForStore.__LIFECART_EXPENSES__ || [],
  };
}

// Asynchronously push state to cloud endpoint
export async function syncPushToCloud(): Promise<void> {
  try {
    const payload = {
      groceryItems: globalForStore.__LIFECART_GROCERY_ITEMS__ || [],
      expenses: globalForStore.__LIFECART_EXPENSES__ || [],
      updatedAt: new Date().toISOString(),
    };

    await fetch(SHARED_CLOUD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('Cloud push warning:', err);
  }
}
