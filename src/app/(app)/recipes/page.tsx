"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Users, Flame, UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

const availableIngredients = [
  'Tomatoes', 'Chicken Breast', 'Milk', 'Spinach', 'Eggs', 'Onion', 'Garlic', 'Bread'
];

const recommendedRecipes = [
  { id: '1', name: 'Tomato Basil Bruschetta', time: '15 min', servings: 4, calories: 150, imageUrl: 'https://placehold.co/600x400.png', dataAiHint: 'bruschetta tomato' },
  { id: '2', name: 'Spinach and Feta Omelette', time: '10 min', servings: 1, calories: 300, imageUrl: 'https://placehold.co/600x400.png', dataAiHint: 'omelette spinach' },
  { id: '3', name: 'Creamy Tomato Chicken', time: '30 min', servings: 2, calories: 450, imageUrl: 'https://placehold.co/600x400.png', dataAiHint: 'chicken dish' },
  { id: '4', name: 'Garlic Bread', time: '20 min', servings: 4, calories: 250, imageUrl: 'https://placehold.co/600x400.png', dataAiHint: 'garlic bread' },
];

export default function RecipesPage() {
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
                    <Checkbox id={ingredient} />
                    <Label htmlFor={ingredient} className="font-normal">{ingredient}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="dietary-needs">Dietary Needs</Label>
            <Select>
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
          <Button>
            <UtensilsCrossed className="mr-2" />
            Generate Recipes
          </Button>
        </CardFooter>
      </Card>
      
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Recommended For You</h2>
        <div className="grid gap-6 mt-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recommendedRecipes.map(recipe => (
            <Card key={recipe.id} className="overflow-hidden flex flex-col">
              <CardHeader className="p-0">
                <div className="relative aspect-video">
                  <Image src={recipe.imageUrl} alt={recipe.name} layout="fill" objectFit="cover" data-ai-hint={recipe.dataAiHint} />
                   <Badge variant="secondary" className="absolute top-2 right-2">Recommended</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <CardTitle className="text-lg mb-2">{recipe.name}</CardTitle>
                <div className="flex items-center text-sm text-muted-foreground gap-4">
                  <div className="flex items-center gap-1"><Clock className="w-4 h-4"/> {recipe.time}</div>
                  <div className="flex items-center gap-1"><Users className="w-4 h-4"/> {recipe.servings}</div>
                  <div className="flex items-center gap-1"><Flame className="w-4 h-4"/> {recipe.calories} kcal</div>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button className="w-full">View Recipe</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
