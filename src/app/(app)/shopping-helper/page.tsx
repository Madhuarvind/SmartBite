
"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Camera, Loader, Sparkles, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { identifyAndCheckItem } from '@/ai/flows/identify-and-check-item';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function ShoppingHelperPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

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
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use the Smart Shopping Lens.',
        });
      }
    };

    getCameraPermission();
  }, [toast]);
  
  const processImage = async (photoDataUri: string) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'You must be logged in.' });
        return;
    }
    
    setIsLoading(true);
    setScannedImage(photoDataUri);
    setAnalysisResult(null);

    try {
        const result = await identifyAndCheckItem({ photoDataUri, userId: user.uid });
        setAnalysisResult(result.response);
    } catch(error) {
        console.error("Error identifying item:", error);
        toast({
            variant: "destructive",
            title: "Analysis Failed",
            description: "Could not identify the item from the image. Please try again.",
        });
    } finally {
        setIsLoading(false);
    }
  }

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

  const handleReset = () => {
    setScannedImage(null);
    setAnalysisResult(null);
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <PageHeader title="Smart Shopping Lens" />
      <Card>
        <CardHeader>
          <CardTitle>Check Before You Buy</CardTitle>
          <CardDescription>
            Point your camera at a grocery item and scan it. The AI will check your pantry to see if you already have it at home.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
            <div className="relative w-full max-w-lg aspect-[4/3] border-2 border-dashed border-muted-foreground/50 rounded-lg flex items-center justify-center bg-secondary overflow-hidden">
                {scannedImage && !isLoading ? (
                    <Image src={scannedImage} alt="Scanned item" layout="fill" objectFit="contain" />
                ) : (
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                )}

                {hasCameraPermission === false && !scannedImage && (
                    <Alert variant="destructive" className="absolute m-4">
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>
                        To use the Smart Shopping Lens, please allow camera access in your browser settings.
                    </AlertDescription>
                    </Alert>
                )}
                
                {isLoading && (
                    <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center text-primary gap-4">
                        <Loader className="w-16 h-16 animate-spin" />
                        <p className="font-semibold text-lg">Analyzing...</p>
                    </div>
                )}

                {analysisResult && (
                    <div className="absolute inset-x-4 bottom-4 bg-background/90 p-4 rounded-lg border-2 border-primary shadow-2xl animate-fade-in-slide-up">
                         <div className="flex items-start gap-3">
                             <Sparkles className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                             <p className="text-foreground font-medium">{analysisResult}</p>
                         </div>
                    </div>
                )}
            </div>
            
            <div className="flex gap-4">
                {!analysisResult ? (
                    <Button onClick={handleScanFromCamera} disabled={isLoading || hasCameraPermission === false} size="lg">
                        <Camera className="mr-2" /> Scan Item
                    </Button>
                ) : (
                    <Button onClick={handleReset} size="lg" variant="outline">
                        <X className="mr-2" /> Scan Another Item
                    </Button>
                )}
            </div>

        </CardContent>
      </Card>
    </div>
  );
}
