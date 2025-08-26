
"use client";

import { useState, useRef, useEffect, ChangeEvent, DragEvent } from "react";
import Image from "next/image";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, Loader, Upload, Sparkles, ChefHat, CheckCircle, Music, Video, Wand2, CheckSquare, MinusCircle, PlusCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { analyzePlate } from "@/ai/flows/analyze-plate";
import { findRecipeFromMeal } from "@/ai/flows/find-recipe-from-meal";
import { suggestSubstitutions } from "@/ai/flows/suggest-substitutions";
import { transformRecipe } from "@/ai/flows/transform-recipe";
import { AnalyzePlateOutput, Recipe, GenerateRecipeAudioOutput, GenerateRecipeVideoOutput, SubstitutionSuggestion, RecipeIngredient } from "@/ai/schemas";
import { cn } from "@/lib/utils";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, Timestamp, onSnapshot, query } from "firebase/firestore";
import type { User } from 'firebase/auth';
import type { InventoryItem, PantryItem } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

type InventoryCheckResult = {
    ingredient: RecipeIngredient;
    status: 'available' | 'missing' | 'partial';
    notes: string;
}

export default function PlateScannerPage() {
  const [user, setUser] = useState<User | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzePlateOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [stream, setStream] = useState<MediaStream | null>(null);

  // States for the full recipe modal
  const [userInventory, setUserInventory] = useState<InventoryItem[]>([]);
  const [pantryEssentials, setPantryEssentials] = useState<PantryItem[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<string[]>([]);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [foundRecipe, setFoundRecipe] = useState<Recipe | null>(null);
  const [isFindingRecipe, setIsFindingRecipe] = useState(false);
  const [recipeMedia, setRecipeMedia] = useState<{ audio?: GenerateRecipeAudioOutput, video?: GenerateRecipeVideoOutput }>({});
  const [transformedRecipe, setTransformedRecipe] = useState<Recipe | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformationRequest, setTransformationRequest] = useState("");
  const [missingIngredient, setMissingIngredient] = useState<string | null>(null);
  const [substitutions, setSubstitutions] = useState<SubstitutionSuggestion[]>([]);
  const [isSubstituting, setIsSubstituting] = useState(false);
  const [inventoryCheckResults, setInventoryCheckResults] = useState<InventoryCheckResult[]>([]);
  const [isCheckingInventory, setIsCheckingInventory] = useState(false);
  const [servings, setServings] = useState(2);
  
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
       if (currentUser) {
        // Fetch Inventory
        const inventoryQuery = query(collection(db, "users", currentUser.uid, "inventory"));
        const unsubscribeInventory = onSnapshot(inventoryQuery, (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as InventoryItem[];
          setUserInventory(items);
          
          // Fetch Pantry Essentials inside the inventory subscription to ensure we have both
          const pantryQuery = query(collection(db, "users", currentUser.uid, "pantry_essentials"));
          const unsubscribePantry = onSnapshot(pantryQuery, (pantrySnapshot) => {
              const pantryItems = pantrySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PantryItem[];
              setPantryEssentials(pantryItems);

              // Combine both lists for substitution suggestions
              const allIngredients = Array.from(new Set([...items.map(i => i.name), ...pantryItems.map(p => p.name)]));
              setAvailableIngredients(allIngredients);
          });
          return () => unsubscribePantry();
        });
        return () => unsubscribeInventory();
      } else {
        setUser(null);
        setUserInventory([]);
        setPantryEssentials([]);
        setAvailableIngredients([]);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        return;
      }
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(cameraStream);
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = cameraStream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };
    getCameraPermission();

    return () => {
        stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const handleFile = (file: File) => {
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const photoDataUri = e.target?.result as string;
            processImage(photoDataUri);
        };
        reader.readAsDataURL(file);
      } else {
        toast({
            variant: "destructive",
            title: "Invalid File Type",
            description: "Please upload an image file.",
        });
      }
  }

  const processImage = async (photoDataUri: string) => {
    setIsLoading(true);
    setAnalysis(null);
    setScannedImage(photoDataUri);
    try {
      const result = await analyzePlate({ photoDataUri });
      setAnalysis(result);
    } catch (error) {
      console.error("Error analyzing plate:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Could not analyze the image. Please try again with a clearer picture of the meal.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanFromCamera = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const photoDataUri = canvas.toDataURL('image/jpeg');
      processImage(photoDataUri);
      stream?.getTracks().forEach(track => track.stop());
      setStream(null);
    } else {
      toast({
        variant: "destructive",
        title: "Scan Error",
        description: "Could not capture an image from the video stream.",
      });
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };
  
  const handleDragEvents = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(true);
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
        handleFile(file);
    }
  }

  const handleLogMeal = async () => {
      if (!user || !analysis) {
          toast({ variant: 'destructive', title: 'Cannot Log Meal', description: 'You must be logged in and have a meal analyzed.'});
          return;
      }
      setIsLogging(true);
      try {
        await addDoc(collection(db, 'users', user.uid, 'activity'), {
            type: 'mealCooked', // Using 'mealCooked' for simplicity, could be 'mealEaten'
            recipeName: analysis.mealName,
            timestamp: Timestamp.now(),
            calories: analysis.nutrition.calories,
            protein: analysis.nutrition.protein,
            carbs: analysis.nutrition.carbs,
            fat: analysis.nutrition.fat,
        });
        toast({
            title: 'Meal Logged!',
            description: `${analysis.mealName} has been added to your activity history.`
        });
      } catch (error) {
        console.error("Error logging meal:", error);
        toast({ variant: 'destructive', title: 'Logging Failed'});
      } finally {
        setIsLogging(false);
      }
  }

  const openRecipeModal = (recipe: Recipe) => {
    setFoundRecipe(recipe);
    setTransformedRecipe(null);
    setRecipeMedia({ audio: recipe.audio, video: recipe.video });
    setIsRecipeModalOpen(true);
    setSubstitutions([]);
    setMissingIngredient(null);
    setTransformationRequest("");
    setInventoryCheckResults([]);
    setIsCheckingInventory(false);
    setServings(2);

    if (recipe.mediaPromise) {
      (recipe.mediaPromise as Promise<{ audio?: GenerateRecipeAudioOutput; video?: GenerateRecipeVideoOutput }>)
        .then(media => {
          setFoundRecipe(currentRecipe => {
            if (currentRecipe && currentRecipe.name === recipe.name) {
              setRecipeMedia(media);
            }
            return currentRecipe;
          });
        });
    }
  };


  const handleFindRecipe = async () => {
    if (!analysis) return;
    setIsFindingRecipe(true);
    setFoundRecipe(null);
    setIsRecipeModalOpen(true);
    try {
        const result = await findRecipeFromMeal({ mealName: analysis.mealName });
        openRecipeModal(result);
    } catch (error) {
        console.error("Error finding recipe:", error);
        toast({
            variant: "destructive",
            title: "Couldn't Find Recipe",
            description: "The AI was unable to generate a recipe for this meal.",
        });
        setIsRecipeModalOpen(false);
    } finally {
        setIsFindingRecipe(false);
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
              availableIngredients: availableIngredients
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
    if (!foundRecipe || !transformationRequest) {
      toast({ variant: "destructive", title: "Please enter a transformation request." });
      return;
    }
    setIsTransforming(true);
    setTransformedRecipe(null);
    setRecipeMedia({});
    try {
      const result = await transformRecipe({
        recipe: foundRecipe,
        transformation: transformationRequest,
      });
      setTransformedRecipe(result);

      if (result.mediaPromise) {
        (result.mediaPromise as Promise<{ audio?: GenerateRecipeAudioOutput; video?: GenerateRecipeVideoOutput }>)
            .then(media => setRecipeMedia(media));
      }
      toast({ title: "Recipe Transformed!", description: "Your new creation is ready." });
    } catch (error) {
      console.error("Error transforming recipe:", error);
      toast({ variant: "destructive", title: "Transformation failed. Please try again." });
    } finally {
      setIsTransforming(false);
    }
  }

  const currentRecipe = transformedRecipe || foundRecipe;

  return (
    <>
    <div className="flex flex-col gap-8 animate-fade-in">
      <PageHeader title="Plate Scanner" />
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="animate-fade-in-slide-up">
          <CardHeader>
            <CardTitle>Scan Your Meal</CardTitle>
            <CardDescription>Take a picture of your plate to get an instant nutritional analysis from our AI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div 
              className={cn(
                "relative aspect-video w-full border-2 border-dashed border-muted-foreground/50 rounded-lg flex items-center justify-center bg-secondary overflow-hidden cursor-pointer transition-colors",
                isDragging && "bg-primary/10 border-primary"
              )}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragEvents}
              onDrop={handleDrop}
            >
              {scannedImage ? (
                <Image src={scannedImage} alt="Scanned meal" layout="fill" objectFit="contain" />
              ) : (
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
              )}
               {hasCameraPermission === false && !scannedImage && (
                 <Alert variant="destructive" className="absolute m-4">
                   <AlertTitle>Camera Access Required</AlertTitle>
                   <AlertDescription>
                     To use the live scanner, please allow camera access. You can still upload an image.
                   </AlertDescription>
                 </Alert>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button onClick={handleScanFromCamera} disabled={isLoading || hasCameraPermission === false}>
                {isLoading ? <><Loader className="mr-2 animate-spin"/> Analyzing...</> : <><Camera className="mr-2" /> Scan from Camera</>}
              </Button>
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" disabled={isLoading}>
                <Upload className="mr-2" /> Upload Image
              </Button>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-slide-up" style={{animationDelay: '0.1s'}}>
          <CardHeader>
            <CardTitle className="flex items-center"><Sparkles className="w-5 h-5 mr-2 text-primary"/> AI Analysis</CardTitle>
            <CardDescription>Here's what our AI thinks about your meal. Estimates are per serving.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-24 w-24 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            )}
            {!isLoading && !analysis && (
              <div className="text-center text-muted-foreground py-10">
                <p>Scan a meal to see its nutritional information here.</p>
              </div>
            )}
            {analysis && (
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        {scannedImage && <Image src={scannedImage} alt={analysis.mealName} width={96} height={96} className="rounded-lg border object-cover" />}
                        <div>
                             <p className="text-sm text-muted-foreground">Identified Meal</p>
                             <h3 className="text-2xl font-bold text-primary">{analysis.mealName}</h3>
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nutrient</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">Calories</TableCell>
                                <TableCell className="text-right">{analysis.nutrition.calories.toFixed(0)} kcal</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell className="font-medium">Protein</TableCell>
                                <TableCell className="text-right">{analysis.nutrition.protein.toFixed(1)} g</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell className="font-medium">Carbohydrates</TableCell>
                                <TableCell className="text-right">{analysis.nutrition.carbs.toFixed(1)} g</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell className="font-medium">Fat</TableCell>
                                <TableCell className="text-right">{analysis.nutrition.fat.toFixed(1)} g</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            )}
          </CardContent>
            {analysis && (
                 <CardFooter className="flex-col sm:flex-row gap-2">
                    <Button onClick={handleLogMeal} disabled={isLogging}>
                        {isLogging ? <Loader className="animate-spin mr-2"/> : <CheckCircle className="mr-2" />} Log This Meal
                    </Button>
                    <Button onClick={handleFindRecipe} variant="secondary" disabled={isFindingRecipe}>
                        {isFindingRecipe ? <Loader className="animate-spin mr-2"/> : <ChefHat className="mr-2" />} Find Recipe For This
                    </Button>
                </CardFooter>
            )}
        </Card>
      </div>
    </div>

    {isRecipeModalOpen && (
        <Dialog open={isRecipeModalOpen} onOpenChange={setIsRecipeModalOpen}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    {isFindingRecipe ? <Skeleton className="h-8 w-3/4"/> : 
                        <DialogTitle className="text-3xl text-primary">{currentRecipe?.name}</DialogTitle>
                    }
                    <DialogDescription>
                        {isFindingRecipe ? 'Please wait while we find the perfect recipe for you...' : 
                        'View the full recipe details, and use our AI tools to find substitutions or transform the recipe.'
                        }
                    </DialogDescription>
                </DialogHeader>
                
                {isFindingRecipe ? (
                    <div className="flex items-center justify-center h-96">
                        <Loader className="w-16 h-16 animate-spin text-primary" />
                    </div>
                ) : (
                currentRecipe &&
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
                           {recipeMedia.video?.videoDataUri ? (
                              <video
                                src={recipeMedia.video.videoDataUri}
                                controls
                                className="w-full aspect-video rounded-lg bg-black"
                                autoPlay
                                loop
                                muted
                                playsInline
                              />
                            ) : (
                              <div className="w-full aspect-video bg-secondary flex flex-col items-center justify-center text-muted-foreground p-4 text-center rounded-lg">
                                  <Loader className="w-10 h-10 mb-2 animate-spin text-primary"/>
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
                                <CardTitle className="flex items-center text-lg"><Music className="w-5 h-5 mr-2 text-primary"/> Audio Guide</CardTitle>
                                <CardDescription>Listen to the recipe instructions.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {recipeMedia.audio?.audioDataUri ? (
                                    <audio controls src={recipeMedia.audio.audioDataUri} className="w-full" />
                                ) : (
                                    <div className="flex items-center justify-center text-muted-foreground text-sm">
                                        <Loader className="mr-2 animate-spin"/> Loading audio...
                                    </div>
                                )}
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
                                        {currentRecipe.estimatedCost && (
                                            <TableRow>
                                                <TableCell className="font-medium">Est. Cost</TableCell>
                                                <TableCell className="text-right">${currentRecipe.estimatedCost.toFixed(2)}</TableCell>
                                            </TableRow>
                                        )}
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
                                        {foundRecipe?.ingredients.map(ing => (
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
                                        <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2 text-sm">
                                            {substitutions.map(sub => (
                                                <li key={sub.name}>
                                                   <span className="font-semibold text-foreground">{sub.name}</span>: {sub.explanation}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                         <Card className="bg-secondary/50">
                            <CardHeader>
                                <CardTitle className="flex items-center text-lg"><Wand2 className="w-5 h-5 mr-2 text-primary"/> AI Taste Predictor</CardTitle>
                                <CardDescription>Transform this recipe to better match your personal taste.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Textarea 
                                  id="transform-request"
                                  className="mt-2"
                                  placeholder="e.g., 'This seems bland, can you make it spicier?' or 'How can I make this vegetarian and lower in fat?'"
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
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsRecipeModalOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </>
  );
}

    
