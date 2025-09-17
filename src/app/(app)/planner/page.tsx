
"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { PlusCircle, ShoppingCart, Sparkles, Loader, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { generateMealPlan } from "@/ai/flows/generate-meal-plan";
import type { GenerateMealPlanOutput } from "@/ai/schemas";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, query, writeBatch, doc, addDoc, deleteDoc, updateDoc } from "firebase/firestore";
import type { User } from 'firebase/auth';
import type { InventoryItem, PantryItem, ShoppingListItem } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";


const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const dayTitles = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function PlannerPage() {
  const [user, setUser] = useState<User | null>(null);
  const [availableIngredients, setAvailableIngredients] = useState<string[]>([]);
  const [nutritionalGoal, setNutritionalGoal] = useState("balanced");
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [mealPlan, setMealPlan] = useState<GenerateMealPlanOutput['mealPlan'] | null>(null);
  
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [isShoppingListLoading, setIsShoppingListLoading] = useState(true);
  const [newShoppingItemName, setNewShoppingItemName] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [isAddToInventoryDialogOpen, setIsAddToInventoryDialogOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<ShoppingListItem[]>([]);
  const [isAddingToInventory, setIsAddingToInventory] = useState(false);


   useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // --- Inventory and Pantry Essentials Listener ---
        const inventoryQuery = query(collection(db, "users", currentUser.uid, "inventory"));
        const unsubscribeInventory = onSnapshot(inventoryQuery, (snapshot) => {
          const items = snapshot.docs.map(doc => (doc.data() as InventoryItem).name);
          
          const pantryQuery = query(collection(db, "users", currentUser.uid, "pantry_essentials"));
          const unsubscribePantry = onSnapshot(pantryQuery, (pantrySnapshot) => {
              const pantryItems = pantrySnapshot.docs.map(doc => (doc.data() as PantryItem).name);
              setAvailableIngredients(Array.from(new Set([...items, ...pantryItems])));
          });

          return () => unsubscribePantry();
        });
        
        // --- Shopping List Listener ---
        const shoppingListQuery = query(collection(db, "users", currentUser.uid, "shopping_list"));
        const unsubscribeShoppingList = onSnapshot(shoppingListQuery, (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ShoppingListItem[];
          setShoppingList(items);
          setIsShoppingListLoading(false);
        });

        return () => {
          unsubscribeInventory();
          unsubscribeShoppingList();
        };

      } else {
        setUser(null);
        setAvailableIngredients([]);
        setShoppingList([]);
        setIsShoppingListLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGeneratePlan = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'You must be logged in to generate a plan.' });
        return;
    }
    setIsLoading(true);
    setMealPlan(null);

    try {
      const restrictionsArray = dietaryRestrictions.split(',').map(s => s.trim()).filter(Boolean);
      if (nutritionalGoal === 'vegetarian') {
          restrictionsArray.push('vegetarian');
      }

      const result = await generateMealPlan({
        availableIngredients,
        nutritionalGoal,
        dietaryRestrictions: restrictionsArray,
      });
      setMealPlan(result.mealPlan);
      
      if (result.shoppingList && result.shoppingList.length > 0) {
        // Automatically add to Firestore shopping list
        const batch = writeBatch(db);
        const shoppingListRef = collection(db, "users", user.uid, "shopping_list");
        result.shoppingList.forEach(itemName => {
            const docRef = doc(shoppingListRef);
            batch.set(docRef, { name: itemName, quantity: '1', checked: false });
        });
        await batch.commit();

        toast({
            title: "Shopping List Updated!",
            description: `${result.shoppingList.length} items were added to your shopping list.`,
        });
      }

    } catch (error) {
      console.error("Error generating meal plan:", error);
      toast({
        variant: "destructive",
        title: "Meal Plan Generation Failed",
        description: "There was an error creating your meal plan. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddShoppingItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !newShoppingItemName.trim()) {
      toast({ variant: "destructive", title: "Item name cannot be empty." });
      return;
    }
    try {
      await addDoc(collection(db, "users", user.uid, "shopping_list"), {
        name: newShoppingItemName,
        quantity: "1",
        checked: false,
      });
      setNewShoppingItemName("");
    } catch (error) {
      console.error("Error adding shopping list item:", error);
      toast({ variant: "destructive", title: "Failed to add item." });
    }
  };

  const handleToggleChecked = async (item: ShoppingListItem) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid, "shopping_list", item.id), {
        checked: !item.checked,
      });
    } catch (error) {
      console.error("Error updating item:", error);
      toast({ variant: "destructive", title: "Failed to update item." });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "shopping_list", itemId));
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({ variant: "destructive", title: "Failed to delete item." });
    }
  };

  const handleMoveCheckedToInventory = () => {
      const itemsToMove = shoppingList.filter(item => item.checked);
      if (itemsToMove.length === 0) {
          toast({ variant: "destructive", title: "No items selected", description: "Check some items to move them to your inventory."});
          return;
      }
      setCheckedItems(itemsToMove);
      setIsAddToInventoryDialogOpen(true);
  }

  const confirmMoveToInventory = async () => {
    if (!user || checkedItems.length === 0) return;
    setIsAddingToInventory(true);
    
    const inventoryBatch = writeBatch(db);
    const shoppingListBatch = writeBatch(db);
    const inventoryRef = collection(db, "users", user.uid, "inventory");
    const today = new Date().toISOString().split('T')[0];

    checkedItems.forEach(item => {
        // Add to inventory
        const newInventoryItemRef = doc(inventoryRef);
        inventoryBatch.set(newInventoryItemRef, {
            name: item.name,
            quantity: item.quantity,
            expiry: 'N/A', // Expiry can be predicted/edited later
            purchaseDate: today,
            price: 0
        });
        
        // Remove from shopping list
        const shoppingListItemRef = doc(db, "users", user.uid, "shopping_list", item.id);
        shoppingListBatch.delete(shoppingListItemRef);
    });
    
    try {
        await inventoryBatch.commit();
        await shoppingListBatch.commit();
        toast({
            title: "Inventory Updated!",
            description: `${checkedItems.length} items moved from your shopping list to your inventory.`
        });
    } catch (error) {
        console.error("Error moving items to inventory:", error);
        toast({ variant: "destructive", title: "Action Failed", description: "Could not move items to inventory." });
    } finally {
        setIsAddingToInventory(false);
        setIsAddToInventoryDialogOpen(false);
        setCheckedItems([]);
    }
  };


  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="This Week's Meal Plan" />
      
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center"><Sparkles className="w-6 h-6 mr-2 text-primary" /> AI Meal Plan Generator</CardTitle>
            <CardDescription>Select your goals and let our AI create a personalized 7-day meal plan and an automatic shopping list for missing items.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                  <Label htmlFor="nutritional-goal">Nutritional Goal</Label>
                  <Select onValueChange={setNutritionalGoal} defaultValue={nutritionalGoal}>
                      <SelectTrigger id="nutritional-goal" suppressHydrationWarning>
                          <SelectValue placeholder="Select a nutritional goal..." />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="balanced">Balanced Diet</SelectItem>
                          <SelectItem value="high-protein">High Protein</SelectItem>
                          <SelectItem value="low-carb">Low Carb</SelectItem>
                          <SelectItem value="vegetarian">Vegetarian</SelectItem>
                          <SelectItem value="low-calorie">Low Calorie</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
              <div>
                  <Label htmlFor="dietary-restrictions">Dietary Restrictions</Label>
                  <Input 
                      id="dietary-restrictions" 
                      placeholder="e.g. nut allergy, gluten-free"
                      value={dietaryRestrictions}
                      onChange={(e) => setDietaryRestrictions(e.target.value)}
                      suppressHydrationWarning
                  />
              </div>
          </CardContent>
          <CardFooter>
               <Button onClick={handleGeneratePlan} disabled={isLoading || availableIngredients.length === 0} className="w-full sm:w-auto" suppressHydrationWarning>
                  {isLoading ? <><Loader className="mr-2 animate-spin"/> Generating...</> : "Generate Plan"}
              </Button>
          </CardFooter>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Shopping List</CardTitle>
                <CardDescription>Items needed for your meal plan will appear here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form onSubmit={handleAddShoppingItem} className="flex gap-2">
                    <Input 
                        placeholder="Add item manually..."
                        value={newShoppingItemName}
                        onChange={(e) => setNewShoppingItemName(e.target.value)}
                    />
                    <Button type="submit" size="icon" variant="outline"><PlusCircle /></Button>
                </form>

                <div className="h-48 overflow-y-auto space-y-2 pr-2">
                  {isShoppingListLoading ? (
                     <div className="flex justify-center items-center h-full"><Loader className="animate-spin" /></div>
                  ) : shoppingList.length > 0 ? (
                    shoppingList.map((item) => (
                      <div key={item.id} className={`flex items-center gap-2 p-2 rounded-md ${item.checked ? 'bg-muted/50' : ''}`}>
                          <Checkbox
                            id={`item-${item.id}`}
                            checked={item.checked}
                            onCheckedChange={() => handleToggleChecked(item)}
                          />
                          <Label htmlFor={`item-${item.id}`} className={`flex-1 ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                            {item.name} <span className="text-xs text-muted-foreground">({item.quantity})</span>
                          </Label>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteItem(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-10">Your shopping list is empty.</div>
                  )}
                </div>
            </CardContent>
            <CardFooter>
                 <Button className="w-full" onClick={handleMoveCheckedToInventory} disabled={shoppingList.filter(i => i.checked).length === 0}>
                    <ShoppingCart className="mr-2"/> Add Purchased to Pantry
                </Button>
            </CardFooter>
        </Card>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 items-start">
        {dayTitles.map((dayTitle, index) => {
           const dayKey = days[index];
           const dayPlan = mealPlan ? mealPlan[dayKey] : null;

           return (
              <Card key={dayKey} className="w-full">
                <CardHeader>
                  <CardTitle className="text-center text-lg">{dayTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(['breakfast', 'lunch', 'dinner'] as const).map(mealType => (
                    <div key={mealType}>
                      <h4 className="font-semibold mb-2 text-primary capitalize">{mealType}</h4>
                      {isLoading ? (
                        <Skeleton className="h-16 w-full" />
                      ) : dayPlan && dayPlan[mealType] ? (
                        <Card className="p-2 bg-secondary">
                          <p className="text-sm font-medium text-secondary-foreground text-center">
                            {dayPlan[mealType]}
                          </p>
                        </Card>
                      ) : (
                        <button className="w-full border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 flex items-center justify-center text-muted-foreground hover:bg-secondary hover:border-primary/50 transition-colors" suppressHydrationWarning>
                          <PlusCircle className="w-5 h-5 mr-2" />
                          Add Meal
                        </button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
           )
        })}
      </div>

       <Dialog open={isAddToInventoryDialogOpen} onOpenChange={setIsAddToInventoryDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Move Items to Inventory?</DialogTitle>
                <DialogDescription>
                    You are about to move {checkedItems.length} item(s) to your main inventory. This will remove them from the shopping list.
                </DialogDescription>
            </DialogHeader>
            <ul className="list-disc pl-5 space-y-1 max-h-48 overflow-y-auto">
                {checkedItems.map(item => <li key={item.id}>{item.name} ({item.quantity})</li>)}
            </ul>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddToInventoryDialogOpen(false)} disabled={isAddingToInventory}>Cancel</Button>
                <Button onClick={confirmMoveToInventory} disabled={isAddingToInventory}>
                    {isAddingToInventory ? <Loader className="animate-spin mr-2"/> : null}
                    Confirm & Move
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
