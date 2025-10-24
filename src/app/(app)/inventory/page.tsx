
"use client";

import { useState, useRef, useEffect, ChangeEvent, DragEvent, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { PlusCircle, Camera, MoreHorizontal, Trash2, Pencil, Loader, Upload, Wand2, Mic, Beaker } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { scanIngredients } from "@/ai/flows/scan-ingredients";
import { predictEdibility } from "@/ai/flows/predict-expiry-date";
import { logWaste } from "@/ai/flows/log-waste";
import { getPreservationSuggestions } from "@/ai/flows/get-preservation-suggestions";
import { inventRecipe } from "@/ai/flows/invent-recipe";
import { useToast } from "@/hooks/use-toast";
import type { DetectedIngredient, PredictEdibilityOutput, GetPreservationSuggestionsOutput } from "@/ai/schemas";
import type { InventoryItem, PantryItem } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, Timestamp, doc, deleteDoc, onSnapshot, query, writeBatch } from "firebase/firestore";
import { parseISO, isPast } from "date-fns";
import type { User } from 'firebase/auth';
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";


export default function InventoryPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [pantryEssentials, setPantryEssentials] = useState<PantryItem[]>([]);
  const [isInventoryLoading, setIsInventoryLoading] = useState(true);

  const [scannedIngredients, setScannedIngredients] = useState<DetectedIngredient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // State for multi-delete
  const [selectedItems, setSelectedItems] = useState<string[]>([]);


  // State for main inventory item dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [newItemPurchaseDate, setNewItemPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [newItemExpiry, setNewItemExpiry] = useState("");
  const [newItemStorage, setNewItemStorage] = useState<'refrigerator' | 'pantry' | 'countertop' | 'freezer'>('refrigerator');
  const [edibilityPrediction, setEdibilityPrediction] = useState<PredictEdibilityOutput | null>(null);
  
  // State for pantry essential dialog
  const [isEssentialDialogOpen, setIsEssentialDialogOpen] = useState(false);
  const [newEssentialName, setNewEssentialName] = useState("");
  const [newEssentialQuantity, setNewEssentialQuantity] = useState("");
  
  // State for preservation dialog
  const [isPreserveDialogOpen, setIsPreserveDialogOpen] = useState(false);
  const [itemToPreserve, setItemToPreserve] = useState<InventoryItem | null>(null);
  const [isGettingSuggestions, setIsGettingSuggestions] = useState(false);
  const [preservationSuggestions, setPreservationSuggestions] = useState<GetPreservationSuggestionsOutput['suggestions']>([]);


  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsInventoryLoading(true);
        const inventoryQuery = query(collection(db, "users", currentUser.uid, "inventory"));
        const unsubscribeInventory = onSnapshot(inventoryQuery, (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as InventoryItem[];
          setInventory(items);
          
          const pantryQuery = query(collection(db, "users", currentUser.uid, "pantry_essentials"));
          const unsubscribePantry = onSnapshot(pantryQuery, (pantrySnapshot) => {
              const items = pantrySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PantryItem[];
              setPantryEssentials(items);
              setIsInventoryLoading(false);
          });

          return () => unsubscribePantry();
        });

        return () => {
          unsubscribeInventory();
        };
      } else {
        setUser(null);
        setInventory([]);
        setPantryEssentials([]);
        setIsInventoryLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        return;
      }
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
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
        setUploadedImage(photoDataUri);
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
     setScannedIngredients([]);
     try {
        const result = await scanIngredients({ photoDataUri });
        setScannedIngredients(result.ingredients);
        if(result.ingredients.length === 0) {
            toast({
                title: "No ingredients detected",
                description: "The AI couldn't find any ingredients in the image. Please try a clearer picture.",
            });
        }
      } catch (error) {
        console.error("Error scanning ingredients:", error);
        toast({
          variant: "destructive",
          title: "Scan Failed",
          description: "Could not detect ingredients from the image. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
  }

  const handleScanFromCamera = () => {
    if (!videoRef.current) return;
    setUploadedImage(null);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    if(context) {
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
  
  const handlePredictEdibility = async () => {
    if (!newItemName) {
      toast({
        variant: "destructive",
        title: "Missing Ingredient Name",
        description: "Please enter an ingredient name to predict its edibility.",
      });
      return;
    }
    setIsPredicting(true);
    setEdibilityPrediction(null);
    try {
        const result = await predictEdibility({
            ingredientName: newItemName,
            purchaseDate: newItemPurchaseDate,
            storageMethod: newItemStorage,
        });
        setEdibilityPrediction(result);
        setNewItemExpiry(result.predictedExpiry);
    } catch(e) {
        console.error("Error predicting edibility:", e);
        toast({
            variant: "destructive",
            title: "Prediction Failed",
            description: "Could not predict the edibility. Please enter it manually."
        });
    } finally {
        setIsPredicting(false);
    }
  };

  const resetAddDialog = () => {
    setNewItemName("");
    setNewItemQuantity("");
    setNewItemPurchaseDate(new Date().toISOString().split('T')[0]);
    setNewItemExpiry("");
    setEdibilityPrediction(null);
    setNewItemStorage('refrigerator');
  }

  const handleAddItem = () => {
    if (!user || !newItemName || !newItemQuantity) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out at least the name and quantity.",
      });
      return;
    }
    const newItem = {
      name: newItemName,
      quantity: newItemQuantity,
      expiry: newItemExpiry || 'N/A',
      purchaseDate: newItemPurchaseDate,
      storage: newItemStorage,
    };
    try {
        addDoc(collection(db, "users", user.uid, "inventory"), newItem);
        toast({
            title: "Item Added",
            description: `${newItem.name} has been added to your inventory.`,
        });
        setIsAddDialogOpen(false);
        resetAddDialog();
    } catch (error) {
        console.error("Error adding item to Firestore:", error);
        toast({ variant: "destructive", title: "Failed to Add Item"});
    }
  };

  const handleDeleteItem = async (itemId: string, itemName: string, expiry: string) => {
    if (!user) {
        toast({ variant: "destructive", title: "Not logged in", description: "You must be logged in to delete items."});
        return;
    }
    
    // Log as wasted if the item is expired
    if (expiry !== 'N/A' && isPast(parseISO(expiry))) {
        try {
            const wasteInfo = await logWaste({ itemName });
            addDoc(collection(db, "users", user.uid, "activity"), {
                type: 'itemWasted',
                itemName: itemName,
                timestamp: Timestamp.now(),
                isCompostable: wasteInfo.isCompostable,
            });

            // "Reincarnation" Logic
            const allItems = [...inventory, ...pantryEssentials];
            const otherIngredients = allItems
              .filter(i => i.id !== itemId) // Exclude the wasted item itself
              .map(i => ({ name: i.name, price: 'price' in i ? i.price : undefined }))
              .sort(() => 0.5 - Math.random()) // Shuffle
              .slice(0, 4); // Take a few random items
            
            const ingredientsForInvention = [{ name: itemName, price: inventory.find(i=>i.id === itemId)?.price }, ...otherIngredients];
            
            try {
                const reincarnation = await inventRecipe({ ingredients: ingredientsForInvention });
                toast({
                    duration: 10000,
                    title: `Your ${itemName} could have been reincarnated!`,
                    description: `As '${reincarnation.name}' (Est. Cost: ₹${reincarnation.estimatedCost?.toFixed(2)}). For composting: ${wasteInfo.tip}`
                });
            } catch (reincarnationError) {
                // Fallback to simple toast if invention fails
                toast({ 
                    title: "Item Logged as Waste",
                    description: wasteInfo.tip,
                });
            }

        } catch (error) {
            console.error("Error logging wasted item:", error);
        }
    }

    try {
        await deleteDoc(doc(db, "users", user.uid, "inventory", itemId));
        if (!(expiry !== 'N/A' && isPast(parseISO(expiry)))) {
            toast({ variant: "destructive", title: "Item Deleted", description: `${itemName} has been removed from your inventory.` });
        }
    } catch (error) {
        console.error("Error deleting item from Firestore:", error);
        toast({ variant: "destructive", title: "Failed to Delete Item"});
    }
  };

  const handlePreserveItem = async (item: InventoryItem) => {
    setItemToPreserve(item);
    setIsPreserveDialogOpen(true);
    setIsGettingSuggestions(true);
    setPreservationSuggestions([]);
    try {
        const result = await getPreservationSuggestions({ ingredientName: item.name });
        setPreservationSuggestions(result.suggestions);
    } catch (error) {
        console.error("Error getting preservation suggestions:", error);
        toast({
            variant: "destructive",
            title: "Could not get suggestions",
            description: "The AI failed to generate preservation ideas. Please try again."
        });
    } finally {
        setIsGettingSuggestions(false);
    }
  };


  const handleAddAllScannedItems = (target: 'inventory' | 'essentials') => {
    if (!user || scannedIngredients.length === 0) {
      toast({
        variant: "destructive",
        title: "Nothing to add",
        description: "No ingredients were scanned.",
      });
      return;
    }
    setIsAdding(true);
    try {
      const batch = writeBatch(db);
      const collectionName = target === 'inventory' ? 'inventory' : 'pantry_essentials';
      const itemRef = collection(db, "users", user.uid, collectionName);
      const today = new Date().toISOString().split('T')[0];

      scannedIngredients.forEach(item => {
        const docRef = doc(itemRef);
        if (target === 'inventory') {
          batch.set(docRef, {
            name: item.name,
            quantity: item.quantity,
            expiry: item.expiryDate || 'N/A',
            purchaseDate: today,
          });
        } else {
           batch.set(docRef, {
            name: item.name,
            quantity: item.quantity,
          });
        }
      });

      batch.commit();

      toast({
        title: `${target === 'inventory' ? 'Inventory' : 'Pantry Essentials'} Updated!`,
        description: `${scannedIngredients.length} items have been added.`,
      });

      setScannedIngredients([]);
      setUploadedImage(null);

    } catch (error) {
      console.error("Error adding items:", error);
      toast({ variant: "destructive", title: "Failed to Update List" });
    } finally {
      setIsAdding(false);
    }
  };
  
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        variant: "destructive",
        title: "Browser Not Supported",
        description: "Your browser does not support voice recognition."
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    setScannedIngredients([]);
    setUploadedImage(null);

    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      toast({
        title: "You said:",
        description: transcript,
      });
      
      setIsLoading(true);
      try {
        const result = scanIngredients({ textQuery: transcript });
        result.then(res => {
          setScannedIngredients(res.ingredients);
          if(res.ingredients.length === 0) {
              toast({
                  title: "No ingredients detected",
                  description: "The AI couldn't understand the ingredients in your request. Please try again.",
              });
          }
        });
      } catch (error) {
         console.error("Error parsing voice input:", error);
         toast({
          variant: "destructive",
          title: "Scan Failed",
          description: "Could not process your voice request. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    recognition.onspeechend = () => {
      recognition.stop();
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      toast({
        variant: "destructive",
        title: "Voice Recognition Error",
        description: event.error,
      });
      setIsListening(false);
    };
  };

  const handleAddEssentialItem = () => {
    if (!user || !newEssentialName || !newEssentialQuantity) {
        toast({ variant: "destructive", title: "Missing Information", description: "Please fill out both name and quantity." });
        return;
    }
    try {
        addDoc(collection(db, "users", user.uid, "pantry_essentials"), {
            name: newEssentialName,
            quantity: newEssentialQuantity,
        });
        toast({ title: "Essential Item Added" });
        setIsEssentialDialogOpen(false);
        setNewEssentialName("");
        setNewEssentialQuantity("");
    } catch (error) {
        console.error("Error adding essential item:", error);
        toast({ variant: "destructive", title: "Failed to Add Item" });
    }
  };

  const handleRemoveEssentialItem = (itemId: string, itemName: string) => {
    if (!user) return;
    try {
        deleteDoc(doc(db, "users", user.uid, "pantry_essentials", itemId));
        toast({ variant: "destructive", title: "Item Removed", description: `${itemName} removed from essentials.` });
    } catch (error) {
        console.error("Error removing essential item:", error);
        toast({ variant: "destructive", title: "Failed to Remove Item" });
    }
  };

  const handleDeleteSelectedItems = () => {
    if (!user || selectedItems.length === 0) return;

    const batch = writeBatch(db);
    
    selectedItems.forEach(async id => {
      const itemToDelete = inventory.find(item => item.id === id);
      if (itemToDelete) {
        // Log wasted item if it's expired
        if (itemToDelete.expiry && itemToDelete.expiry !== 'N/A' && isPast(parseISO(itemToDelete.expiry))) {
          try {
              const wasteInfo = await logWaste({ itemName: itemToDelete.name });
              await addDoc(collection(db, "users", user.uid, "activity"), {
                  type: 'itemWasted',
                  itemName: itemToDelete.name,
                  timestamp: Timestamp.now(),
                  isCompostable: wasteInfo.isCompostable,
              });
              toast({ title: "Composting Tip", description: wasteInfo.tip });
          } catch(e) { console.error("Error in waste logging for batch delete", e); }
        }
        // Add delete operation to the main batch
        const docRef = doc(db, "users", user.uid, "inventory", id);
        batch.delete(docRef);
      }
    });

    try {
      batch.commit();
      toast({
        variant: "destructive",
        title: "Items Deleted",
        description: `${selectedItems.length} items have been removed from your inventory.`,
      });
      setSelectedItems([]); // Clear selection
    } catch (error) {
      console.error("Error deleting multiple items:", error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "There was an error deleting the selected items.",
      });
    }
  };

  const renderScannerCard = (target: 'inventory' | 'essentials') => (
    <Card className="animate-fade-in-slide-up">
      <CardHeader>
        <CardTitle>AI Scanner</CardTitle>
        <CardDescription>Use multimodal input to add items. Scan with your camera, upload a photo, or add items with your voice.</CardDescription>
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
          {uploadedImage ? (
            <Image src={uploadedImage} alt="Uploaded ingredients" layout="fill" objectFit="contain" />
          ) : (
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
          )}
          {hasCameraPermission === false && !uploadedImage && (
             <Alert variant="destructive" className="absolute m-4">
               <AlertTitle>Camera Access Required</AlertTitle>
               <AlertDescription>
                 To use the live scanner, please allow camera access in your browser settings. You can still upload an image.
               </AlertDescription>
             </Alert>
          )}
           {!uploadedImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
              <p className="text-white font-semibold">
                Click or drag &amp; drop to upload
              </p>
            </div>
          )}
        </div>
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button onClick={handleScanFromCamera} disabled={isLoading || hasCameraPermission === false} >
                {isLoading ? <><Loader className="mr-2 animate-spin"/> Scanning...</> : <><Camera className="mr-2" /> Scan Camera</>}
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" disabled={isLoading}>
                <Upload className="mr-2" /> Upload Image
            </Button>
             <Button onClick={handleVoiceInput} variant="outline" disabled={isListening || isLoading}>
                {isListening ? <><Loader className="mr-2 animate-spin"/> Listening...</> : <><Mic className="mr-2" /> Add by Voice</>}
            </Button>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
         </div>
        {scannedIngredients.length > 0 && (
            <div>
                <h4 className="font-semibold mb-2">Detected Ingredients:</h4>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Quantity</TableHead>
                            {target === 'inventory' && <TableHead>Expiry (Predicted)</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {scannedIngredients.map((ing, index) => (
                            <TableRow key={`${ing.name}-${index}`}>
                                <TableCell className="font-medium">{ing.name}</TableCell>
                                <TableCell>{ing.quantity}</TableCell>
                                {target === 'inventory' && <TableCell>{ing.expiryDate || 'N/A'}</TableCell>}
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
                 <Button onClick={() => handleAddAllScannedItems(target)} disabled={isAdding} className="w-full mt-4">
                    {isAdding ? <><Loader className="animate-spin mr-2" /> Adding...</> : <><PlusCircle className="mr-2" /> Add All to List</>}
                 </Button>
            </div>
        )}
      </CardContent>
    </Card>
  );


  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <PageHeader title="My Inventory" action={
        <Dialog open={isAddDialogOpen} onOpenChange={(isOpen) => {
            setIsAddDialogOpen(isOpen);
            if (!isOpen) resetAddDialog();
        }}>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2"/> Add Item Manually</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Add New Inventory Item</DialogTitle>
                    <DialogDescription>Enter the details of your new item below. Use the AI wand to predict its freshness.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="item-name" className="text-right">Name</Label>
                        <Input id="item-name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="col-span-3" placeholder="e.g. Tomatoes"/>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="item-quantity" className="text-right">Quantity</Label>
                        <Input id="item-quantity" value={newItemQuantity} onChange={(e) => setNewItemQuantity(e.target.value)} className="col-span-3" placeholder="e.g. 500g" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="item-storage" className="text-right">Storage</Label>
                        <Select onValueChange={(v) => setNewItemStorage(v as any)} defaultValue={newItemStorage}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select storage method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="refrigerator">Refrigerator</SelectItem>
                                <SelectItem value="pantry">Pantry</SelectItem>
                                <SelectItem value="countertop">Countertop</SelectItem>
                                <SelectItem value="freezer">Freezer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="item-purchase-date" className="text-right">Purchase Date</Label>
                        <Input id="item-purchase-date" type="date" value={newItemPurchaseDate} onChange={(e) => setNewItemPurchaseDate(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="item-expiry" className="text-right">Expiry Date</Label>
                        <div className="col-span-3 grid grid-cols-3 gap-2">
                             <Input id="item-expiry" type="date" value={newItemExpiry} onChange={(e) => setNewItemExpiry(e.target.value)} className="col-span-2" />
                             <Button onClick={handlePredictEdibility} disabled={isPredicting || !newItemName} variant="outline" size="sm" className="col-span-1">
                                {isPredicting ? <Loader className="animate-spin" /> : <Wand2 />}
                                <span className="sr-only">Predict Edibility</span>
                             </Button>
                        </div>
                    </div>
                    {isPredicting ? (
                      <div className="col-start-2 col-span-3 space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ) : edibilityPrediction && (
                      <div className="col-start-2 col-span-3">
                        <Alert>
                           <Wand2 className="h-4 w-4" />
                          <AlertTitle className="flex justify-between items-center">
                            <span>{edibilityPrediction.status}</span>
                            <span className="font-normal text-sm">{edibilityPrediction.edibilityScore}% Edibility</span>
                          </AlertTitle>
                          <AlertDescription>
                            <Progress value={edibilityPrediction.edibilityScore} className="h-2 my-2" />
                            {edibilityPrediction.reasoning}
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                </div>
                <DialogFooter>
                    <Button type="button" onClick={handleAddItem}>Save Item</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      } />
      
      <Tabs defaultValue="inventory" onValueChange={() => {
        setScannedIngredients([]);
        setUploadedImage(null);
      }}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inventory">My Items</TabsTrigger>
          <TabsTrigger value="pantry">Pantry Essentials</TabsTrigger>
        </TabsList>
        <TabsContent value="inventory">
          <div className="grid gap-6 mt-6 md:grid-cols-2">
            {renderScannerCard('inventory')}

            <Card className="animate-fade-in-slide-up" style={{animationDelay: '0.1s'}}>
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Current Inventory</CardTitle>
                        <CardDescription>All items currently in your fridge and pantry.</CardDescription>
                    </div>
                    {selectedItems.length > 0 && (
                        <Button variant="destructive" size="sm" onClick={handleDeleteSelectedItems}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete ({selectedItems.length})
                        </Button>
                    )}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                            checked={inventory.length > 0 && selectedItems.length === inventory.length}
                            onCheckedChange={(checked) => {
                                if (checked) {
                                    setSelectedItems(inventory.map(item => item.id));
                                } else {
                                    setSelectedItems([]);
                                }
                            }}
                            aria-label="Select all"
                         />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isInventoryLoading ? (
                        <TableRow><TableCell colSpan={5} className="text-center"><Loader className="mx-auto animate-spin" /></TableCell></TableRow>
                    ) : inventory.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Your inventory is empty.</TableCell></TableRow>
                    ) : (
                        inventory.map((item) => (
                        <TableRow key={item.id} data-state={selectedItems.includes(item.id) && "selected"}>
                            <TableCell>
                                <Checkbox
                                    checked={selectedItems.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                        setSelectedItems(prev => 
                                            checked 
                                                ? [...prev, item.id] 
                                                : prev.filter(id => id !== item.id)
                                        );
                                    }}
                                    aria-label={`Select ${item.name}`}
                                />
                            </TableCell>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.expiry}</TableCell>
                            <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handlePreserveItem(item)}><Beaker className="mr-2 h-4 w-4" /> Preserve with AI</DropdownMenuItem>
                                    <DropdownMenuItem disabled><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleDeleteItem(item.id, item.name, item.expiry)}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="pantry">
          <div className="grid gap-6 mt-6 md:grid-cols-2">
            {renderScannerCard('essentials')}
            <Card className="animate-fade-in">
              <CardHeader>
                  <CardTitle>Current Essentials</CardTitle>
                  <CardDescription>Items you usually have on hand. These are always considered available for recipes.</CardDescription>
              </CardHeader>
              <CardContent>
              <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Typical Quantity</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isInventoryLoading ? (
                          <TableRow><TableCell colSpan={3} className="text-center"><Loader className="mx-auto animate-spin" /></TableCell></TableRow>
                      ) : pantryEssentials.length === 0 ? (
                          <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No pantry essentials defined.</TableCell></TableRow>
                      ) : (
                          pantryEssentials.map((item) => (
                          <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveEssentialItem(item.id, item.name)}>
                                      <Trash2 className="h-4 w-4 text-destructive"/>
                                      <span className="sr-only">Remove</span>
                                  </Button>
                              </TableCell>
                          </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
              </CardContent>
              <CardFooter>
                   <Dialog open={isEssentialDialogOpen} onOpenChange={setIsEssentialDialogOpen}>
                      <DialogTrigger asChild>
                          <Button variant="outline"><PlusCircle className="mr-2" />Add Manually</Button>
                      </DialogTrigger>
                      <DialogContent>
                          <DialogHeader>
                              <DialogTitle>Add Pantry Essential</DialogTitle>
                              <DialogDescription>Add an item you usually have on hand.</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="essential-name" className="text-right">Name</Label>
                                  <Input id="essential-name" value={newEssentialName} onChange={(e) => setNewEssentialName(e.target.value)} className="col-span-3" placeholder="e.g. Olive Oil"/>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="essential-quantity" className="text-right">Quantity</Label>
                                  <Input id="essential-quantity" value={newEssentialQuantity} onChange={(e) => setNewEssentialQuantity(e.target.value)} className="col-span-3" placeholder="e.g. 1 bottle" />
                              </div>
                          </div>
                          <DialogFooter>
                              <Button type="button" onClick={handleAddEssentialItem}>Save Item</Button>
                          </DialogFooter>
                      </DialogContent>
                   </Dialog>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isPreserveDialogOpen} onOpenChange={setIsPreserveDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>AI Preservation Coach for: <span className="text-primary">{itemToPreserve?.name}</span></DialogTitle>
                <DialogDescription>
                    Here are some AI-powered suggestions to preserve your item and prevent waste.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                {isGettingSuggestions ? (
                    <div className="space-y-2">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                ) : preservationSuggestions.length > 0 ? (
                    <div className="space-y-4">
                        {preservationSuggestions.map((suggestion, index) => (
                            <Card key={index} className="bg-secondary/50">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center">{suggestion.method}</CardTitle>
                                    <CardDescription>Difficulty: {suggestion.difficulty}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm mb-2">{suggestion.description}</p>
                                    <p className="text-sm font-semibold">You'll need: <span className="font-normal">{suggestion.requiredItems.join(', ')}</span></p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground">The AI couldn't find any specific preservation methods for this item.</p>
                )}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsPreserveDialogOpen(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    
