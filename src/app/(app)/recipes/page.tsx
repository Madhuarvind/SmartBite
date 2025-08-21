
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader, Music, Video, UtensilsCrossed, Sparkles, ChefHat, Film, Wand2, CheckSquare, MinusCircle, PlusCircle, AlertTriangle, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { recommendRecipes } from "@/ai/flows/recommend-recipes";
import type { Recipe, RecommendRecipesOutput, TransformRecipeOutput, RecipeIngredient } from "@/ai/schemas";
import type { InventoryItem, PantryItem } from "@/lib/types";
import { suggestSubstitutions } from "@/ai/flows/suggest-substitutions";
import { transformRecipe } from "@/ai/flows/transform-recipe";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { suggestRecipesByMood } from "@/ai/flows/suggest-recipes-by-mood";
import { Textarea } from "@/components/ui/textarea";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, Timestamp, onSnapshot, query } from "firebase/firestore";
import type { User } from "firebase/auth";

type InventoryCheckResult = {
    ingredient: RecipeIngredient;
    status: 'available' | 'missing' | 'partial';
    notes: string;
}

export default function RecipesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userInventory, setUserInventory] = useState<InventoryItem[]>([]);
  const [pantryEssentials, setPantryEssentials] = useState<PantryItem[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<string[]>([]);
  const [isInventoryLoading, setIsInventoryLoading] = useState(true);

  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [dietaryNeeds, setDietaryNeeds] = useState<string>('any');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendedRecipes, setRecommendedRecipes] = useState<Recipe[]>([]);
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [missingIngredient, setMissingIngredient] = useState<string | null>(null);
  const [substitutions, setSubstitutions] = useState<string[]>([]);
  const [isSubstituting, setIsSubstituting] = useState(false);
  const [transformationRequest, setTransformationRequest] = useState("");
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformedRecipe, setTransformedRecipe] = useState<TransformRecipeOutput | null>(null);
  const [servings, setServings] = useState(2);
  const [inventoryCheckResults, setInventoryCheckResults] = useState<InventoryCheckResult[]>([]);
  const [isCheckingInventory, setIsCheckingInventory] = useState(false);
  const [mood, setMood] = useState("");
  const [isSuggestingByMood, setIsSuggestingByMood] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch Inventory
        const inventoryQuery = query(collection(db, "users", currentUser.uid, "inventory"));
        const unsubscribeInventory = onSnapshot(inventoryQuery, (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as InventoryItem[];
          setUserInventory(items);
          
          const pantryQuery = query(collection(db, "users", currentUser.uid, "pantry_essentials"));
          const unsubscribePantry = onSnapshot(pantryQuery, (pantrySnapshot) => {
              const pantryItems = pantrySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PantryItem[];
              setPantryEssentials(pantryItems);

              const allIngredients = Array.from(new Set([...items.map(i => i.name), ...pantryItems.map(p => p.name)]));
              setAvailableIngredients(allIngredients);
              setIsInventoryLoading(false);
          });
          return () => unsubscribePantry();
        });
        return () => unsubscribeInventory();
      } else {
        setUser(null);
        setUserInventory([]);
        setPantryEssentials([]);
        setAvailableIngredients([]);
        setIsInventoryLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

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
        expiringIngredients: [], // This could be enhanced later
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
  
  const handleSuggestByMood = async () => {
    if (!mood) {
        toast({ variant: "destructive", title: "Please tell us how you feel."});
        return;
    }
    setIsSuggestingByMood(true);
    setRecommendedRecipes([]);
    try {
        const result = await suggestRecipesByMood({ mood });
        setRecommendedRecipes(result.recipes);
        if (result.recipes.length === 0) {
            toast({ title: "No suggestions found", description: "The AI couldn't find recipes for that mood. Try being more descriptive!" });
        }
    } catch(e) {
        console.error("Error suggesting recipes by mood:", e);
        toast({ variant: "destructive", title: "Suggestion Failed", description: "There was an error. Please try again." });
    } finally {
        setIsSuggestingByMood(false);
    }
  };

  const handleViewRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
    setSubstitutions([]);
    setMissingIngredient(null);
    setTransformedRecipe(null);
    setTransformationRequest("");
    setInventoryCheckResults([]);
    setIsCheckingInventory(false);
    setServings(2);
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

  const handleTransformRecipe = async () => {
    if (!selectedRecipe || !transformationRequest) {
      toast({ variant: "destructive", title: "Please enter a transformation request." });
      return;
    }
    setIsTransforming(true);
    setTransformedRecipe(null);
    try {
      const result = await transformRecipe({
        recipe: selectedRecipe,
        transformation: transformationRequest,
      });
      setTransformedRecipe(result);
      toast({ title: "Recipe Transformed!", description: "Your new creation is ready." });
    } catch (error) {
      console.error("Error transforming recipe:", error);
      toast({ variant: "destructive", title: "Transformation failed. Please try again." });
    } finally {
      setIsTransforming(false);
    }
  }
  
  const handleCookedThis = async (recipeName: string) => {
    if (!user) {
        toast({ variant: "destructive", title: "Not logged in", description: "You must be logged in to track activity."});
        return;
    }
    try {
        await addDoc(collection(db, "users", user.uid, "activity"), {
            type: 'mealCooked',
            recipeName: recipeName,
            timestamp: Timestamp.now()
        });
        toast({
            title: "Activity Logged!",
            description: `Great job cooking ${recipeName}! Check your dashboard to see your progress.`
        });
    } catch (error) {
        console.error("Error logging activity:", error);
        toast({ variant: "destructive", title: "Logging Failed", description: "Could not save your cooking activity." });
    }
  };

  const handleInventoryCheck = () => {
      if (!currentRecipe) return;
      setIsCheckingInventory(true);
      
      const allUserItems = [...userInventory, ...pantryEssentials];
      const results: InventoryCheckResult[] = currentRecipe.ingredients.map(ing => {
          const inventoryItem = allUserItems.find(item => item.name.toLowerCase() === ing.name.toLowerCase());
          if (inventoryItem) {
              return { ingredient: ing, status: 'available', notes: `You have ${inventoryItem.quantity}` };
          } else {
              return { ingredient: ing, status: 'missing', notes: 'Not in inventory' };
          }
      });

      setInventoryCheckResults(results);
      setIsCheckingInventory(false);
  }
  
  const currentRecipe = transformedRecipe || selectedRecipe;

  return (
    <>
      <div className="flex flex-col gap-8 animate-fade-in">
        <PageHeader title="Find Your Next Meal" />
        
        <div className="grid gap-6 md:grid-cols-2">
            <Card className="animate-fade-in-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center"><UtensilsCrossed className="mr-2"/> Recipe Finder</CardTitle>
                <CardDescription>Select ingredients and preferences to get AI-powered recipe recommendations.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div>
                  <Label>Available Ingredients</Label>
                  <div className="mt-2 p-4 border rounded-md min-h-[120px] bg-background/50">
                    {isInventoryLoading ? (
                        <div className="flex items-center justify-center h-[120px]">
                           <Loader className="animate-spin" />
                        </div>
                    ) : availableIngredients.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {availableIngredients.map(ingredient => (
                            <div key={ingredient} className="flex items-center space-x-2">
                              <Checkbox 
                                id={ingredient} 
                                onCheckedChange={(checked) => handleIngredientChange(ingredient, checked)}
                                checked={selectedIngredients.includes(ingredient)}
                              />
                              <Label htmlFor={ingredient} className="font-normal cursor-pointer">{ingredient}</Label>
                            </div>
                          ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center">Add items to your inventory to get started.</p>
                    )}
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
                      <SelectItem value="diabetes-friendly">Diabetes-Friendly</SelectItem>
                      <SelectItem value="vegan">Vegan</SelectItem>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="gluten-free">Gluten-Free</SelectItem>
                      <SelectItem value="low-carb">Low-Carb</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleGenerateRecipes} disabled={isLoading || isInventoryLoading || selectedIngredients.length === 0}>
                  {isLoading ? <><Loader className="mr-2 animate-spin" /> Generating...</> : <> Generate Recipes</>}
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="animate-fade-in-slide-up" style={{animationDelay: '0.1s'}}>
                <CardHeader>
                    <CardTitle className="flex items-center"><Heart className="mr-2"/> Feeling Inspired?</CardTitle>
                    <CardDescription>Get recipe suggestions based on your current mood or craving.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Label htmlFor="mood-input">How are you feeling today?</Label>
                    <Textarea 
                        id="mood-input"
                        placeholder="e.g., 'I'm feeling stressed and need something comforting' or 'I want to cook something adventurous!'"
                        value={mood}
                        onChange={(e) => setMood(e.target.value)}
                        className="mt-2"
                    />
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSuggestByMood} disabled={isSuggestingByMood}>
                        {isSuggestingByMood ? <><Loader className="mr-2 animate-spin" /> Suggesting...</> : <>Suggest Recipes</>}
                    </Button>
                </CardFooter>
            </Card>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Recommended For You</h2>
          <div className="grid gap-6 mt-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(isLoading || isSuggestingByMood) && Array.from({ length: 4 }).map((_, i) => (
               <Card key={i} className="overflow-hidden flex flex-col animate-fade-in-slide-up" style={{animationDelay: `${i * 0.1}s`}}>
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
              <Card key={`${recipe.name}-${index}`} className="overflow-hidden flex flex-col bg-card hover:bg-secondary/50 transition-colors duration-300 animate-fade-in-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
                <CardHeader className="p-0">
                   <div className="relative aspect-video">
                    {recipe.instructionSteps && recipe.instructionSteps[0]?.image?.imageDataUri ? (
                        <Image src={recipe.instructionSteps[0].image.imageDataUri} alt={recipe.name} layout="fill" objectFit="cover" className="bg-secondary"/>
                    ) : (
                       <Skeleton className="w-full h-full" />
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
                      <Label className="flex items-center mb-2 text-muted-foreground"><Music className="mr-2"/> Audio Narration</Label>
                      <div className="h-10 w-full flex items-center justify-center bg-secondary rounded-md text-sm text-muted-foreground">
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          <span>Generating...</span>
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

      {currentRecipe && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="text-3xl text-primary">{currentRecipe.name}</DialogTitle>
                    <DialogDescription>
                        View the full recipe details, and use our AI tools to find substitutions or transform the recipe.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid md:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto p-1">
                    <div className="md:col-span-2 space-y-4">
                        {transformedRecipe && (
                           <Alert>
                               <Wand2 className="h-4 w-4" />
                               <AlertTitle className="text-accent-foreground">This is an AI-Transformed Recipe!</AlertTitle>
                               <AlertDescription>
                                   You're viewing a new creation based on your request. The original recipe has been modified.
                               </AlertDescription>
                           </Alert>
                        )}
                        
                        <div>
                           <h3 className="font-bold text-lg mb-2">Full Recipe Video</h3>
                           {currentRecipe.video?.videoDataUri ? (
                              <video
                                src={currentRecipe.video.videoDataUri}
                                controls
                                className="w-full aspect-video rounded-lg bg-black"
                                autoPlay
                                loop
                                muted
                                playsInline
                              />
                            ) : (
                              <div className="w-full aspect-video bg-secondary flex flex-col items-center justify-center text-muted-foreground p-4 text-center rounded-lg">
                                  <Loader className="w-10 h-10 mb-2 animate-pulse text-primary"/>
                                  <p className="text-sm font-medium">Preparing your video...</p>
                                  <p className="text-xs">This can take a moment, especially for new recipes.</p>
                              </div>
                            )}
                        </div>

                        <div>
                            <h3 className="font-bold text-lg mb-2">Ingredients</h3>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ingredient</TableHead>
                                        <TableHead>Quantity</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentRecipe.ingredients.map(ing => (
                                        <TableRow key={ing.name}>
                                            <TableCell>{ing.name}</TableCell>
                                            <TableCell>{ing.quantity}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <Separator/>

                        <div>
                            <h3 className="font-bold text-lg mb-2">Instructions</h3>
                            <div className="space-y-4">
                                {currentRecipe.instructionSteps?.map((step, index) => (
                                    <div key={index} className="flex gap-4 items-start">
                                        <div className="flex flex-col items-center gap-1">
                                           <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{step.step}</div>
                                           <Checkbox id={`step-${index}`} className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <Label htmlFor={`step-${index}`} className="font-normal text-base text-foreground leading-snug">{step.text}</Label>
                                            {step.image?.imageDataUri ? (
                                                <Image src={step.image.imageDataUri} alt={`Step ${step.step}`} width={400} height={225} className="rounded-lg border aspect-video object-cover" />
                                            ) : (
                                                <Skeleton className="w-full aspect-video rounded-lg" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {!currentRecipe.instructionSteps && (
                                     <div className="prose prose-sm prose-p:text-muted-foreground max-w-none whitespace-pre-wrap">
                                         {currentRecipe.instructions}
                                     </div>

                                )}
                            </div>
                        </div>

                    </div>
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Log Your Progress</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button className="w-full" onClick={() => handleCookedThis(currentRecipe.name)}>
                                    <ChefHat className="mr-2"/> I Cooked This!
                                </Button>
                            </CardContent>
                        </Card>
                        <Card className="bg-secondary/50">
                            <CardHeader>
                                <CardTitle className="flex items-center text-lg"><Sparkles className="w-5 h-5 mr-2 text-primary"/> Nutritional Info</CardTitle>
                                <CardDescription>Estimated values per serving.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell className="font-medium">Calories</TableCell>
                                            <TableCell className="text-right">{currentRecipe.nutrition.calories.toFixed(0)} kcal</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium">Protein</TableCell>
                                            <TableCell className="text-right">{currentRecipe.nutrition.protein.toFixed(1)}g</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium">Carbs</TableCell>
                                            <TableCell className="text-right">{currentRecipe.nutrition.carbs.toFixed(1)}g</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium">Fat</TableCell>
                                            <TableCell className="text-right">{currentRecipe.nutrition.fat.toFixed(1)}g</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                         <Card className="bg-secondary/50">
                            <CardHeader>
                                <CardTitle className="flex items-center text-lg"><CheckSquare className="w-5 h-5 mr-2 text-primary"/> Inventory Check</CardTitle>
                                <CardDescription>Do you have enough ingredients to cook this?</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 mb-4">
                                    <Label htmlFor="servings">Servings:</Label>
                                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setServings(s => Math.max(1, s - 1))}><MinusCircle /></Button>
                                    <span className="font-bold text-lg">{servings}</span>
                                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setServings(s => s + 1)}><PlusCircle /></Button>
                                </div>
                                <Button onClick={handleInventoryCheck} disabled={isCheckingInventory} className="w-full">
                                    {isCheckingInventory ? <><Loader className="mr-2 animate-spin"/> Checking...</> : 'Check My Inventory'}
                                </Button>
                                {inventoryCheckResults.length > 0 && (
                                     <div className="mt-4 space-y-2">
                                        {inventoryCheckResults.map(res => (
                                            <Alert key={res.ingredient.name} variant={res.status === 'missing' ? 'destructive' : 'default'}>
                                                {res.status === 'missing' ? <AlertTriangle className="h-4 w-4"/> : <CheckSquare className="h-4 w-4"/>}
                                                <AlertTitle className="text-sm">{res.ingredient.name}</AlertTitle>
                                                <AlertDescription className="text-xs">
                                                   Required: {res.ingredient.quantity}. {res.notes}
                                                </AlertDescription>
                                            </Alert>
                                        ))}
                                     </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card className="bg-secondary/50">
                            <CardHeader>
                                <CardTitle className="flex items-center text-lg"><Sparkles className="w-5 h-5 mr-2 text-primary"/> Substitution Helper</CardTitle>
                                <CardDescription>Missing an ingredient? Find a smart substitution.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Label htmlFor="missing-ingredient">Which ingredient are you missing?</Label>
                                <Select onValueChange={setMissingIngredient}>
                                    <SelectTrigger id="missing-ingredient" className="mt-2">
                                        <SelectValue placeholder="Select an ingredient..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedRecipe?.ingredients.map(ing => (
                                            <SelectItem key={ing.name} value={ing.name}>{ing.name}</SelectItem>
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
                         <Card className="bg-secondary/50">
                            <CardHeader>
                                <CardTitle className="flex items-center text-lg"><Wand2 className="w-5 h-5 mr-2 text-primary"/> Transform Recipe</CardTitle>
                                <CardDescription>Give this recipe a creative twist with AI.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Input 
                                  id="transform-request"
                                  className="mt-2"
                                  placeholder="e.g., 'make it vegan'"
                                  value={transformationRequest}
                                  onChange={(e) => setTransformationRequest(e.target.value)}
                                />
                                <Button onClick={handleTransformRecipe} disabled={isTransforming || !transformationRequest} className="w-full mt-4">
                                    {isTransforming ? <><Loader className="mr-2 animate-spin"/> Transforming...</> : 'Transform with AI'}
                                </Button>
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

    