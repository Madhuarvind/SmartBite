
"use client";

import { useState, useRef, ChangeEvent, useEffect, DragEvent } from "react";
import Image from "next/image";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, Sparkles, Loader, ReceiptText, PlusCircle, Leaf } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { scanReceipt } from "@/ai/flows/scan-receipt";
import { calculateCarbonFootprint } from "@/ai/flows/calculate-carbon-footprint";
import type { ScannedItem, CalculateCarbonFootprintOutput } from "@/ai/schemas";
import { auth, db } from "@/lib/firebase";
import { collection, writeBatch, doc } from "firebase/firestore";
import type { User } from 'firebase/auth';
import { cn } from "@/lib/utils";

export default function BillScannerPage() {
  const [user, setUser] = useState<User | null>(null);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [carbonAnalysis, setCarbonAnalysis] = useState<CalculateCarbonFootprintOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const clearState = () => {
    setScannedItems([]);
    setReceiptImage(null);
    setCarbonAnalysis(null);
  };

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
    setScannedItems([]);
    setCarbonAnalysis(null);
    setReceiptImage(photoDataUri);
    try {
      const result = await scanReceipt({ receiptDataUri: photoDataUri });
      setScannedItems(result.items);
      if (result.items.length === 0) {
        toast({
          title: "No items detected",
          description: "The AI couldn't find any items on the receipt. Please try a clearer picture.",
        });
      } else {
        // Kick off carbon analysis in the background
        setIsAnalyzing(true);
        calculateCarbonFootprint({ items: result.items })
          .then(setCarbonAnalysis)
          .catch(err => {
              console.error("Carbon analysis failed:", err);
              toast({ variant: "destructive", title: "Carbon Analysis Failed" });
          })
          .finally(() => setIsAnalyzing(false));
      }
    } catch (error) {
      console.error("Error scanning receipt:", error);
      toast({
        variant: "destructive",
        title: "Scan Failed",
        description: "Could not detect items from the receipt image. Please try again.",
      });
    } finally {
      setIsLoading(false);
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

  const handleAddToInventory = async () => {
    if (!user || scannedItems.length === 0) {
        toast({ variant: "destructive", title: "Nothing to add", description: "No items were scanned from the receipt." });
        return;
    }

    setIsAdding(true);
    try {
        const batch = writeBatch(db);
        const inventoryRef = collection(db, "users", user.uid, "inventory");
        const today = new Date().toISOString().split('T')[0];
        
        scannedItems.forEach(item => {
            const docRef = doc(inventoryRef);
            batch.set(docRef, { 
                name: item.name, 
                quantity: item.quantity, 
                expiry: item.expiryDate || 'N/A',
                price: item.price || 0,
                purchaseDate: today,
            });
        });

        await batch.commit();

        toast({
            title: "Inventory Updated!",
            description: `${scannedItems.length} items have been added to your inventory.`,
        });
        
        clearState();

    } catch (error) {
        console.error("Error adding items to inventory:", error);
        toast({ variant: "destructive", title: "Failed to Update Inventory", description: "There was an error saving your items. Please try again." });
    } finally {
        setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <PageHeader title="AI Bill Scanner" />
      
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 animate-fade-in-slide-up">
          <CardHeader>
            <CardTitle>1. Scan Your Receipt</CardTitle>
            <CardDescription>Upload a picture of your shopping receipt to automatically add items to your pantry.</CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className={cn(
                "relative aspect-[4/5] w-full max-w-sm mx-auto border-2 border-dashed border-muted-foreground/50 rounded-lg flex items-center justify-center bg-secondary overflow-hidden cursor-pointer transition-colors",
                isDragging && "bg-primary/10 border-primary"
              )}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragEvents}
              onDrop={handleDrop}
            >
              {receiptImage ? (
                <Image src={receiptImage} alt="Scanned receipt" layout="fill" objectFit="contain" />
              ) : (
                <div className="text-center text-muted-foreground p-4">
                  <ReceiptText className="w-16 h-16 mx-auto mb-2" />
                  <p>Click or drag & drop to upload</p>
                </div>
              )}
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          </CardContent>
          <CardFooter>
            <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="w-full">
              {isLoading ? <><Loader className="mr-2 animate-spin"/> Scanning...</> : <><Upload className="mr-2" /> Upload Receipt</>}
            </Button>
          </CardFooter>
        </Card>

        <div className="lg:col-span-2 space-y-6 animate-fade-in-slide-up" style={{animationDelay: '0.1s'}}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Sparkles className="w-5 h-5 mr-2 text-primary"/> 2. Review Extracted Items</CardTitle>
              <CardDescription>Review the items found on your receipt. Add them to your inventory when ready.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="max-h-60 overflow-y-auto">
                   {isLoading ? (
                      <div className="space-y-2">
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-10 w-full" />
                      </div>
                  ) : scannedItems.length > 0 ? (
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Item Name</TableHead>
                                  <TableHead>Quantity</TableHead>
                                  <TableHead>Expiry (Predicted)</TableHead>
                                  <TableHead className="text-right">Price</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {scannedItems.map((item, index) => (
                                  <TableRow key={`${item.name}-${index}`}>
                                      <TableCell className="font-medium">{item.name}</TableCell>
                                      <TableCell>{item.quantity}</TableCell>
                                      <TableCell>{item.expiryDate || 'N/A'}</TableCell>
                                      <TableCell className="text-right">{item.price ? `₹${item.price.toFixed(2)}` : 'N/A'}</TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  ) : (
                      <div className="text-center text-muted-foreground py-10">
                          <p>Upload a receipt to see the extracted items here.</p>
                      </div>
                  )}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full sm:w-auto" onClick={handleAddToInventory} disabled={isAdding || scannedItems.length === 0}>
                {isAdding ? <><Loader className="mr-2 animate-spin"/> Adding Items...</> : <><PlusCircle className="mr-2"/> Add to Inventory</>}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Leaf className="w-5 h-5 mr-2 text-primary"/> 3. Carbon Footprint Analysis</CardTitle>
              <CardDescription>An AI-powered estimate of the environmental impact of your purchase.</CardDescription>
            </CardHeader>
            <CardContent>
              {isAnalyzing ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  <Loader className="mr-2 animate-spin" />
                  <p>Analyzing footprint...</p>
                </div>
              ) : carbonAnalysis ? (
                 <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex flex-col items-center justify-center bg-secondary p-6 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Carbon Footprint</p>
                        <p className="text-4xl font-bold text-primary">{carbonAnalysis.totalCarbonFootprint.toFixed(2)}</p>
                        <p className="font-medium">kg CO₂e</p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Eco-Friendly Suggestions</h4>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                            {carbonAnalysis.suggestions.map((tip, index) => (
                                <li key={index}>{tip}</li>
                            ))}
                        </ul>
                    </div>
                 </div>
              ) : (
                <div className="text-center text-muted-foreground py-10">
                    <p>Scan a receipt to see your carbon footprint analysis.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
