
"use client";

import { useState, useRef, useEffect, ChangeEvent, DragEvent } from "react";
import Image from "next/image";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, Loader, Upload, Sparkles, ChefHat, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { analyzePlate } from "@/ai/flows/analyze-plate";
import { findRecipeFromMeal } from "@/ai/flows/find-recipe-from-meal";
import type { AnalyzePlateOutput, Recipe } from "@/ai/schemas";
import { cn } from "@/lib/utils";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import type { User } from 'firebase/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

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

  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [foundRecipe, setFoundRecipe] = useState<Recipe | null>(null);
  const [isFindingRecipe, setIsFindingRecipe] = useState(false);
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };
    getCameraPermission();
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

  const handleFindRecipe = async () => {
    if (!analysis) return;
    setIsFindingRecipe(true);
    setFoundRecipe(null);
    setIsRecipeModalOpen(true);
    try {
        const result = await findRecipeFromMeal({ mealName: analysis.mealName });
        setFoundRecipe(result);
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
    <Dialog open={isRecipeModalOpen} onOpenChange={setIsRecipeModalOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle className="text-2xl">Generated Recipe</DialogTitle>
                <DialogDescription>Here is an AI-generated recipe for "{analysis?.mealName}".</DialogDescription>
            </DialogHeader>
            {isFindingRecipe && (
                <div className="py-10 flex items-center justify-center text-muted-foreground">
                    <Loader className="mr-2 animate-spin" />
                    <p>Generating recipe...</p>
                </div>
            )}
            {foundRecipe && (
                 <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-4">
                    <h3 className="font-bold text-lg text-primary">{foundRecipe.name}</h3>
                    
                    <Separator/>

                    <div>
                        <h4 className="font-semibold mb-2">Ingredients</h4>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground">
                            {foundRecipe.ingredients.map(ing => (
                                <li key={ing.name}>{ing.quantity} {ing.name}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-2">Instructions</h4>
                        <div className="prose prose-sm prose-p:text-muted-foreground max-w-none whitespace-pre-wrap">
                            {foundRecipe.instructions}
                        </div>
                    </div>
                </div>
            )}
             <DialogFooter>
                <Button variant="outline" onClick={() => setIsRecipeModalOpen(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
    
