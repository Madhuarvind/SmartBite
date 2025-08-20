
"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { PlusCircle, Camera, MoreHorizontal, Trash2, Pencil, Loader, Upload, Wand2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { scanIngredients } from "@/ai/flows/scan-ingredients";
import { predictExpiryDate } from "@/ai/flows/predict-expiry-date";
import { useToast } from "@/hooks/use-toast";
import type { DetectedIngredient } from "@/ai/schemas";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";
import { initialInventory, pantryEssentials } from "@/lib/inventory";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";


export default function InventoryPage() {
  const [inventory, setInventory] = useState(initialInventory);
  const [scannedIngredients, setScannedIngredients] = useState<DetectedIngredient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // State for the Add Item Dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [newItemPurchaseDate, setNewItemPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [newItemExpiry, setNewItemExpiry] = useState("");


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

  const handleScanFromCamera = async () => {
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
        setUploadedImage(photoDataUri);
        processImage(photoDataUri);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handlePredictExpiry = async () => {
    if (!newItemName) {
      toast({
        variant: "destructive",
        title: "Missing Ingredient Name",
        description: "Please enter an ingredient name to predict its expiry date.",
      });
      return;
    }
    setIsPredicting(true);
    try {
        const result = await predictExpiryDate({
            ingredientName: newItemName,
            purchaseDate: newItemPurchaseDate,
        });
        setNewItemExpiry(result.expiryDate);
    } catch(e) {
        console.error("Error predicting expiry date:", e);
        toast({
            variant: "destructive",
            title: "Prediction Failed",
            description: "Could not predict the expiry date. Please enter it manually."
        });
    } finally {
        setIsPredicting(false);
    }
  };

  const handleAddItem = () => {
    if (!newItemName || !newItemQuantity) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out at least the name and quantity.",
      });
      return;
    }
    const newItem = {
      id: (inventory.length + 1).toString(),
      name: newItemName,
      quantity: newItemQuantity,
      expiry: newItemExpiry || 'N/A',
    };
    setInventory(prev => [...prev, newItem]);
    setIsAddDialogOpen(false);
    setNewItemName("");
    setNewItemQuantity("");
    setNewItemPurchaseDate(new Date().toISOString().split('T')[0]);
    setNewItemExpiry("");
     toast({
        title: "Item Added",
        description: `${newItem.name} has been added to your inventory.`,
      });
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="My Inventory" action={
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2"/> Add Item</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Inventory Item</DialogTitle>
                    <DialogDescription>Enter the details of your new item below.</DialogDescription>
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
                        <Label htmlFor="item-purchase-date" className="text-right">Purchase Date</Label>
                        <Input id="item-purchase-date" type="date" value={newItemPurchaseDate} onChange={(e) => setNewItemPurchaseDate(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="item-expiry" className="text-right">Expiry Date</Label>
                        <div className="col-span-3 grid grid-cols-3 gap-2">
                             <Input id="item-expiry" type="date" value={newItemExpiry} onChange={(e) => setNewItemExpiry(e.target.value)} className="col-span-2" />
                             <Button onClick={handlePredictExpiry} disabled={isPredicting} variant="outline" size="sm" className="col-span-1">
                                {isPredicting ? <Loader className="animate-spin" /> : <Wand2 />}
                                <span className="sr-only">Predict Expiry</span>
                             </Button>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" onClick={handleAddItem}>Save Item</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      } />
      
      <Tabs defaultValue="inventory">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inventory">My Items</TabsTrigger>
          <TabsTrigger value="pantry">Pantry Essentials</TabsTrigger>
        </TabsList>
        <TabsContent value="inventory">
          <div className="grid gap-6 mt-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pantry Scanner</CardTitle>
                <CardDescription>Scan your pantry using your camera or upload a picture to automatically detect items.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative aspect-video w-full border-2 border-dashed border-muted-foreground/50 rounded-lg flex items-center justify-center bg-secondary overflow-hidden">
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
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button onClick={handleScanFromCamera} disabled={isLoading || hasCameraPermission === false} >
                        {isLoading ? <><Loader className="mr-2 animate-spin"/> Scanning...</> : <><Camera className="mr-2" /> Scan With Camera</>}
                    </Button>
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline" disabled={isLoading}>
                        <Upload className="mr-2" /> Upload Image
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
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {scannedIngredients.map((ing, index) => (
                                    <TableRow key={`${ing.name}-${index}`}>
                                        <TableCell className="font-medium">{ing.name}</TableCell>
                                        <TableCell>{ing.quantity}</TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" variant="outline">Add to Inventory</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                    </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Inventory</CardTitle>
                <CardDescription>All items currently in your fridge and pantry.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map((item) => (
                      <TableRow key={item.id}>
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
                                <DropdownMenuItem><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="pantry">
          <Card className="mt-6">
            <CardHeader>
                <CardTitle>Pantry Essentials</CardTitle>
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
                    {pantryEssentials.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell className="text-right">
                           <Button variant="ghost" size="sm">Remove</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </CardContent>
            <CardFooter>
                <Button variant="outline">Add Essential Item</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
