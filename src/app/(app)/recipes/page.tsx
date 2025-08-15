
"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader, Music, Video, UtensilsCrossed, Sparkles, ChefHat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { recommendRecipes, RecommendRecipesOutput } from "@/ai/flows/recommend-recipes";
import { suggestSubstitutions } from "@/ai/flows/suggest-substitutions";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const availableIngredients = [
  'Tomatoes', 'Chicken Breast', 'Milk', 'Spinach', 'Eggs', 'Onion', 'Garlic', 'Bread', 'Flour', 'Sugar', 'Butter', 'Olive Oil', 'Salt', 'Pepper'
];

type Recipe = RecommendRecipesOutput['recipes'][0];

export default function RecipesPage() {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>(['Tomatoes', 'Chicken Breast', 'Garlic']);
  const [dietaryNeeds, setDietaryNeeds] = useState<string>('any');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendedRecipes, setRecommendedRecipes] = useState<Recipe[]>([]);
  const { toast } = useToast();

  // State for recipe detail modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // State for substitutions
  const [missingIngredient, setMissingIngredient] = useState<string | null>(null);
  const [substitutions, setSubstitutions] = useState<string[]>([]);
  const [isSubstituting, setIsSubstituting] = useState(false);

  const handleIngredientChange = (ingredient: string, checked: boolean | 'indeterminate') => {
    if (checked) {
      setSelectedIngredients(prev => [...prev, ingredient]);
    } else {
      setSelectedIngredients(prev => prev.filter(item => item !== ingredient));
    }
  };

  const handleGenerateRecipes = async () => {
    if (selectedIngredients.length === 0) {
      toast({
        variant: "destructive",
        title: "No Ingredients Selected",
        description: "Please select at least one ingredient to get recommendations.",
      });
      return;
    }

    setIsLoading(true);
    setRecommendedRecipes([]);

    try {
      const input = {
        ingredients: selectedIngredients,
        dietaryRestrictions: dietaryNeeds === 'any' ? [] : [dietaryNeeds],
      };
      const result = await recommendRecipes(input);
      setRecommendedRecipes(result.recipes);
      if (result.recipes.length === 0) {
        toast({
          title: "No Recipes Found",
          description: "We couldn't find any recipes with the selected ingredients. Try selecting more items!",
        });
      }
    } catch (error) {
      console.error("Error generating recipes:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "There was an error generating recipes. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
    setSubstitutions([]);
    setMissingIngredient(null);
  };
  
  const handleFindSubstitutions = async () => {
      if (!missingIngredient) {
          toast({ variant: "destructive", title: "Please select an ingredient to substitute."});
          return;
      }
      setIsSubstituting(true);
      setSubstitutions([]);
      try {
          const result = await suggestSubstitutions({
              missingIngredient: missingIngredient,
              availableIngredients: selectedIngredients
          });
          setSubstitutions(result.substitutions);
           if (result.substitutions.length === 0) {
                toast({ title: "No substitutions found from your available ingredients." });
           }
      } catch (error) {
          console.error("Error finding substitutions:", error);
          toast({ variant: "destructive", title: "Substitution failed. Please try again."});
      } finally {
          setIsSubstituting(false);
      }
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        <PageHeader title="Find Your Next Meal" />
        
        <Card>
          <CardHeader>
            <CardTitle>Recipe Finder</CardTitle>
            <CardDescription>Select ingredients and preferences to get AI-powered recipe recommendations.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <Label>Available Ingredients</Label>
              <div className="mt-2 p-4 border rounded-md min-h-[120px] bg-background/50">
                <div className="flex flex-wrap gap-4">
                  {availableIngredients.map(ingredient => (
                    <div key={ingredient} className="flex items-center space-x-2">
                      <Checkbox 
                        id={ingredient} 
                        onCheckedChange={(checked) => handleIngredientChange(ingredient, checked)}
                        checked={selectedIngredients.includes(ingredient)}
                      />
                      <Label htmlFor={ingredient} className="font-normal">{ingredient}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="dietary-needs">Dietary Needs</Label>
              <Select onValueChange={setDietaryNeeds} value={dietaryNeeds}>
                <SelectTrigger id="dietary-needs" className="mt-2">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                  <SelectItem value="vegetarian">Vegetarian</SelectItem>
                  <SelectItem value="gluten-free">Gluten-Free</SelectItem>
                  <SelectItem value="low-carb">Low-Carb</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleGenerateRecipes} disabled={isLoading}>
              {isLoading ? <><Loader className="mr-2 animate-spin" /> Generating...</> : <><UtensilsCrossed className="mr-2" /> Generate Recipes</>}
            </Button>
          </CardFooter>
        </Card>
        
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Recommended For You</h2>
          <div className="grid gap-6 mt-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {isLoading && Array.from({ length: 4 }).map((_, i) => (
               <Card key={i} className="overflow-hidden flex flex-col">
                  <CardHeader className="p-0">
                      <Skeleton className="aspect-video w-full" />
                  </CardHeader>
                  <CardContent className="p-4 flex-grow">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full" />
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                      <Skeleton className="h-10 w-full" />
                  </CardFooter>
               </Card>
            ))}
            {recommendedRecipes.map((recipe, index) => (
              <Card key={`${recipe.name}-${index}`} className="overflow-hidden flex flex-col">
                <CardHeader className="p-0">
                   <div className="relative aspect-video">
                    {recipe.video?.videoDataUri ? (
                      <video
                        src={recipe.video.videoDataUri}
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-secondary flex flex-col items-center justify-center text-muted-foreground">
                          <Video className="w-10 h-10 mb-2"/>
                          <p className="text-sm">Video is generating...</p>
                          <Skeleton className="w-full h-full absolute inset-0" />
                      </div>
                    )}
                    <Badge variant="secondary" className="absolute top-2 right-2">Recommended</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex-grow">
                  <CardTitle className="text-lg mb-2">{recipe.name}</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    <p className="line-clamp-3">{recipe.instructions}</p>
                  </div>

                  {recipe.audio?.audioDataUri ? (
                    <div className="mt-4">
                        <Label className="flex items-center mb-2"><Music className="mr-2"/> Audio Narration</Label>
                        <audio controls src={recipe.audio.audioDataUri} className="w-full h-10" />
                    </div>
                  ) : (
                    <div className="mt-4">
                      <Label className="flex items-center mb-2"><Music className="mr-2"/> Audio Narration</Label>
                      <div className="h-10 w-full flex items-center justify-center bg-secondary rounded-md">
                          <p className="text-sm text-muted-foreground">Audio is generating...</p>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button className="w-full" onClick={() => handleViewRecipe(recipe)}>
                    <ChefHat className="mr-2"/> View Full Recipe
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {selectedRecipe && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-3xl text-primary">{selectedRecipe.name}</DialogTitle>
                    <DialogDescription>
                        View the full recipe details and find ingredient substitutions.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto p-1">
                    <div>
                        <h3 className="font-bold text-lg mb-2">Ingredients</h3>
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                           {selectedRecipe.ingredients.map(ing => <li key={ing}>{ing}</li>)}
                        </ul>

                        <Separator className="my-4" />

                        <h3 className="font-bold text-lg mb-2">Instructions</h3>
                        <div className="prose prose-sm prose-p:text-muted-foreground max-w-none whitespace-pre-wrap">
                           {selectedRecipe.instructions}
                        </div>
                    </div>
                    <div>
                        <Card className="bg-secondary/50">
                            <CardHeader>
                                <CardTitle className="flex items-center"><Sparkles className="w-5 h-5 mr-2 text-primary"/> Substitution Helper</CardTitle>
                                <CardDescription>Missing an ingredient? Find a smart substitution from what you have on hand.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Label htmlFor="missing-ingredient">Which ingredient are you missing?</Label>
                                <Select onValueChange={setMissingIngredient}>
                                    <SelectTrigger id="missing-ingredient" className="mt-2">
                                        <SelectValue placeholder="Select an ingredient..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedRecipe.ingredients.map(ing => (
                                            <SelectItem key={ing} value={ing}>{ing}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Button onClick={handleFindSubstitutions} disabled={isSubstituting || !missingIngredient} className="w-full mt-4">
                                    {isSubstituting ? <><Loader className="mr-2 animate-spin"/> Finding...</> : 'Find Substitutions'}
                                </Button>
                                
                                {substitutions.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="font-semibold mb-2">Suggested Substitutions:</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {substitutions.map(sub => (
                                                <Badge key={sub} variant="outline">{sub}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </>
  );
}
