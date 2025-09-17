
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { PlusCircle, Sparkles, Loader } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { generateMealPlan } from "@/ai/flows/generate-meal-plan";
import type { GenerateMealPlanOutput } from "@/ai/schemas";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, query, writeBatch, doc } from "firebase/firestore";
import type { User } from 'firebase/auth';
import type { InventoryItem, PantryItem } from "@/lib/types";


const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const dayTitles = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function PlannerPage() {
  const [user, setUser] = useState<User | null>(null);
  const [availableIngredients, setAvailableIngredients] = useState<string[]>([]);
  const [nutritionalGoal, setNutritionalGoal] = useState("balanced");
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [mealPlan, setMealPlan] = useState<GenerateMealPlanOutput['mealPlan'] | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();


   useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
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

        return () => {
          unsubscribeInventory();
        };

      } else {
        setUser(null);
        setAvailableIngredients([]);
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
        const batch = writeBatch(db);
        const shoppingListRef = collection(db, "users", user.uid, "shopping_list");
        result.shoppingList.forEach(itemName => {
            const docRef = doc(shoppingListRef);
            batch.set(docRef, { name: itemName, quantity: '1', checked: false });
        });
        await batch.commit();

        toast({
            title: "Shopping List Updated!",
            description: `${result.shoppingList.length} items were added to your shopping list, viewable in the Shopping Helper.`,
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


  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="This Week's Meal Plan" />
      
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center"><Sparkles className="w-6 h-6 mr-2 text-primary" /> AI Meal Plan Generator</CardTitle>
            <CardDescription>Select your goals and let our AI create a personalized 7-day meal plan. Missing items will be automatically added to your shopping list in the Shopping Helper.</CardDescription>
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
    </div>
  );
}
