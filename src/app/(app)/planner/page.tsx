
"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { PlusCircle, ShoppingCart, Sparkles, Loader } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { generateMealPlan } from "@/ai/flows/generate-meal-plan";
import type { GenerateMealPlanOutput } from "@/ai/schemas";
import { useToast } from "@/hooks/use-toast";

const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const dayTitles = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Mock user's available ingredients. In a real app, this would come from the inventory state.
const availableIngredients = [
  'Tomatoes', 'Chicken Breast', 'Milk', 'Spinach', 'Eggs', 'Onion', 'Garlic', 'Bread', 'Flour', 'Sugar', 'Butter', 'Olive Oil', 'Salt', 'Pepper'
];

export default function PlannerPage() {
  const [nutritionalGoal, setNutritionalGoal] = useState("balanced");
  const [mealPlan, setMealPlan] = useState<GenerateMealPlanOutput['mealPlan'] | null>(null);
  const [shoppingList, setShoppingList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGeneratePlan = async () => {
    setIsLoading(true);
    setMealPlan(null);
    setShoppingList([]);

    try {
      const result = await generateMealPlan({
        availableIngredients,
        nutritionalGoal,
        dietaryRestrictions: [] // Add any restrictions if needed
      });
      setMealPlan(result.mealPlan);
      setShoppingList(result.shoppingList);
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
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Sparkles className="w-6 h-6 mr-2 text-primary" /> AI Meal Plan Generator</CardTitle>
          <CardDescription>Select a nutritional goal and let our AI create a personalized 7-day meal plan and shopping list for you.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="w-full sm:w-auto flex-grow">
                 <Select onValueChange={setNutritionalGoal} defaultValue={nutritionalGoal}>
                    <SelectTrigger>
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
            <Button onClick={handleGeneratePlan} disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? <><Loader className="mr-2 animate-spin"/> Generating...</> : "Generate Plan"}
            </Button>
            {shoppingList.length > 0 && (
                 <Dialog>
                    <DialogTrigger asChild>
                         <Button variant="outline" className="w-full sm:w-auto">
                            <ShoppingCart className="mr-2"/> View Shopping List ({shoppingList.length} items)
                         </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Your Shopping List</DialogTitle>
                            <DialogDescription>Here are the ingredients you need to buy for this week's meal plan.</DialogDescription>
                        </DialogHeader>
                        <ul className="list-disc pl-5 mt-4 space-y-2 max-h-[60vh] overflow-y-auto">
                            {shoppingList.map(item => <li key={item}>{item}</li>)}
                        </ul>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => (document.querySelector('[aria-label="Close"]') as HTMLElement)?.click()}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                 </Dialog>
            )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 items-start">
        {dayTitles.map((dayTitle, index) => {
           const dayKey = days[index];
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
                      ) : mealPlan && mealPlan[dayKey]?.[mealType] ? (
                        <Card className="p-2 bg-secondary">
                          <p className="text-sm font-medium text-secondary-foreground text-center">
                            {mealPlan[dayKey][mealType]?.name}
                          </p>
                        </Card>
                      ) : (
                        <button className="w-full border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 flex items-center justify-center text-muted-foreground hover:bg-secondary hover:border-primary/50 transition-colors">
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
