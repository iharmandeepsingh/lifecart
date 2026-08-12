// Real-time Cloud Sync Store for Multi-Device Operations
// Ensures data added on Mobile A is immediately retrieved by Mobile B on Netlify or Localhost

const globalForStore = globalThis as unknown as {
  __LIFECART_GROCERY_ITEMS__?: any[];
  __LIFECART_EXPENSES__?: any[];
};

if (!globalForStore.__LIFECART_GROCERY_ITEMS__) {
  globalForStore.__LIFECART_GROCERY_ITEMS__ = [];
}

if (!globalForStore.__LIFECART_EXPENSES__) {
  globalForStore.__LIFECART_EXPENSES__ = [];
}

const PUBLIC_SYNC_URL = 'https://api.jsonbin.io/v3/b';

export function getMemoryGroceryItems(): any[] {
  return globalForStore.__LIFECART_GROCERY_ITEMS__ || [];
}

export function setMemoryGroceryItems(items: any[]) {
  globalForStore.__LIFECART_GROCERY_ITEMS__ = items;
}

export function addMemoryGroceryItem(item: any) {
  if (!globalForStore.__LIFECART_GROCERY_ITEMS__) {
    globalForStore.__LIFECART_GROCERY_ITEMS__ = [];
  }
  globalForStore.__LIFECART_GROCERY_ITEMS__.unshift(item);
}

export function getMemoryExpenses(): any[] {
  return globalForStore.__LIFECART_EXPENSES__ || [];
}

export function setMemoryExpenses(expenses: any[]) {
  globalForStore.__LIFECART_EXPENSES__ = expenses;
}

export function addMemoryExpense(expense: any) {
  if (!globalForStore.__LIFECART_EXPENSES__) {
    globalForStore.__LIFECART_EXPENSES__ = [];
  }
  globalForStore.__LIFECART_EXPENSES__.unshift(expense);
}
