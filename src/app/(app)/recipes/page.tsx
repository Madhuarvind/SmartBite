
"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Users, Flame, UtensilsCrossed, Loader, Music, Video } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { recommendRecipes, RecommendRecipesOutput } from "@/ai/flows/recommend-recipes";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const availableIngredients = [
  'Tomatoes', 'Chicken Breast', 'Milk', 'Spinach', 'Eggs', 'Onion', 'Garlic', 'Bread'
];

type Recipe = RecommendRecipesOutput['recipes'][0];

export default function RecipesPage() {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [dietaryNeeds, setDietaryNeeds] = useState<string>('any');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendedRecipes, setRecommendedRecipes] = useState<Recipe[]>([]);
  const { toast } = useToast();

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


  return (
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
                <Button className="w-full">View Full Recipe</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
