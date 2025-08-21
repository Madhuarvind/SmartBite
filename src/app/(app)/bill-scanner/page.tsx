
"use client";

import { useState, useRef, ChangeEvent, useEffect, DragEvent } from "react";
import Image from "next/image";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, Sparkles, Loader, ReceiptText, PlusCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { scanReceipt } from "@/ai/flows/scan-receipt";
import type { ScannedItem } from "@/ai/schemas";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
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
    setScannedItems([]);
    setReceiptImage(photoDataUri);
    try {
      const result = await scanReceipt({ receiptDataUri: photoDataUri });
      setScannedItems(result.items);
      if (result.items.length === 0) {
        toast({
          title: "No items detected",
          description: "The AI couldn't find any items on the receipt. Please try a clearer picture.",
        });
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
        
        scannedItems.forEach(item => {
            const docRef = doc(inventoryRef);
            // For now, new items don't have an expiry date set automatically.
            // This could be a future enhancement with the predictExpiryDate flow.
            batch.set(docRef, { name: item.name, quantity: item.quantity, expiry: 'N/A' });
        });

        await batch.commit();

        toast({
            title: "Inventory Updated!",
            description: `${scannedItems.length} items have been added to your inventory.`,
        });
        
        // Clear the state after adding
        setScannedItems([]);
        setReceiptImage(null);

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
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="animate-fade-in-slide-up">
          <CardHeader>
            <CardTitle>Scan Your Grocery Receipt</CardTitle>
            <CardDescription>Upload a picture of your shopping receipt to automatically update your pantry.</CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className={cn(
                "relative aspect-[9/16] w-full max-w-sm mx-auto border-2 border-dashed border-muted-foreground/50 rounded-lg flex items-center justify-center bg-secondary overflow-hidden cursor-pointer transition-colors",
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
            <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
              {isLoading ? <><Loader className="mr-2 animate-spin"/> Scanning...</> : <><Upload className="mr-2" /> Upload Receipt</>}
            </Button>
          </CardFooter>
        </Card>

        <Card className="animate-fade-in-slide-up" style={{animationDelay: '0.1s'}}>
          <CardHeader>
            <CardTitle className="flex items-center"><Sparkles className="w-5 h-5 mr-2 text-primary"/> Extracted Items</CardTitle>
            <CardDescription>Review the items found on your receipt. Add them to your inventory when ready.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col h-full">
             <div className="flex-grow">
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
                                <TableHead className="text-right">Quantity</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {scannedItems.map((item, index) => (
                                <TableRow key={`${item.name}-${index}`}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center text-muted-foreground py-10 h-full flex flex-col justify-center items-center">
                        <p>Upload a receipt to see the extracted items here.</p>
                    </div>
                )}
            </div>
            {scannedItems.length > 0 && !isLoading && (
                 <div className="pt-6">
                    <Button className="w-full" onClick={handleAddToInventory} disabled={isAdding}>
                      {isAdding ? <><Loader className="mr-2 animate-spin"/> Adding Items...</> : <><PlusCircle className="mr-2"/> Add to Inventory</>}
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    