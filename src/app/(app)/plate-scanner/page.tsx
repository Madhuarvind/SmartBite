
"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import Image from "next/image";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, Loader, Upload, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { analyzePlate } from "@/ai/flows/analyze-plate";
import type { AnalyzePlateOutput } from "@/ai/schemas";

export default function PlateScannerPage() {
  const [analysis, setAnalysis] = useState<AnalyzePlateOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoDataUri = e.target?.result as string;
        processImage(photoDataUri);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <PageHeader title="Plate Scanner" />
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="animate-fade-in-slide-up">
          <CardHeader>
            <CardTitle>Scan Your Meal</CardTitle>
            <CardDescription>Take a picture of your plate to get an instant nutritional analysis from our AI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-video w-full border-2 border-dashed border-muted-foreground/50 rounded-lg flex items-center justify-center bg-secondary overflow-hidden">
              {scannedImage && !hasCameraPermission ? (
                <Image src={scannedImage} alt="Scanned meal" layout="fill" objectFit="contain" />
              ) : (
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
              )}
               {hasCameraPermission === false && (
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
        </Card>
      </div>
    </div>
  );
}
