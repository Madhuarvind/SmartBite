


import type { Recipe as AiRecipe } from '@/ai/schemas';

export type Ingredient = {
  id: string;
  name: string;
  quantity: string;
  expiryDate: string;
  category: 'fridge' | 'pantry';
};

export type InventoryItem = {
  id: string;
  name: string;
  quantity: string;
  expiry: string;
  purchaseDate?: string;
  price?: number;
}

export type PantryItem = {
    id: string;
    name: string;
    quantity: string;
}

export type ShoppingListItem = {
    id: string;
    name: string;
    quantity: string;
    checked: boolean;
}

export type Recipe = {
  id: string;
  name: string;
  imageUrl: string;
  time: string;
  servings: number;
  ingredients: string[];
  instructions: string[];
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
};

export type MealPlanItem = {
  id: string;
  day: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner';
  recipe?: Recipe;
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

// Represents a cooked recipe stored in Firestore history
export type RecipeHistoryItem = AiRecipe & {
    id: string;
    cookedAt: {
        seconds: number;
        nanoseconds: number;
    };
}

export type ScannedBill = {
  id: string;
  billNo?: string;
  totalAmount: number;
  receiptImage: string;
  scannedAt: {
    seconds: number;
    nanoseconds: number;
  };
}

export type ActivityLog = {
    id: string;
    type: 'mealCooked' | 'itemWasted' | 'carbonIncurred';
    timestamp: any;
    [key: string]: any;
}
