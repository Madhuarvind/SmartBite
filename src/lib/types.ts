
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
}

export type PantryItem = {
    id: string;
    name: string;
    quantity: string;
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
