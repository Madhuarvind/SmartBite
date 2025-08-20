
"use client";

import { useState, useRef, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { PlusCircle, Camera, MoreHorizontal, Trash2, Pencil, Loader } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { scanIngredients } from "@/ai/flows/scan-ingredients";
import { useToast } from "@/hooks/use-toast";
import type { DetectedIngredient } from "@/ai/schemas";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const initialInventory = [
  { id: '1', name: 'Tomatoes', quantity: '500g', expiry: '2024-08-15' },
  { id: '2', name: 'Chicken Breast', quantity: '2 pcs', expiry: '2024-08-16' },
  { id: '3', name: 'Milk', quantity: '1L', expiry: '2024-08-18' },
  { id: '4', name: 'Spinach', quantity: '200g', expiry: '2024-08-19' },
  { id: '5', name: 'Eggs', quantity: '12 pcs', expiry: '2024-09-01' },
];

const pantryEssentials = [
  { id: 'p1', name: 'Olive Oil', quantity: '1 bottle' },
  { id: 'p2', name: 'Salt', quantity: '1 box' },
  { id: 'p3', name: 'Black Pepper', quantity: '1 shaker' },
  { id: 'p4', name: 'Garlic Powder', quantity: '1 jar' },
];

export default function InventoryPage() {
  const [scannedIngredients, setScannedIngredients] = useState<DetectedIngredient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
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
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };
    getCameraPermission();
  }, [toast]);
  
  const handleScan = async () => {
    if (!videoRef.current) return;
    setIsLoading(true);
    setScannedIngredients([]);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    if(context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const photoDataUri = canvas.toDataURL('image/jpeg');

        try {
          const result = await scanIngredients({ photoDataUri });
          setScannedIngredients(result.ingredients);
        } catch (error) {
          console.error("Error scanning ingredients:", error);
          toast({
            variant: "destructive",
            title: "Scan Failed",
            description: "Could not detect ingredients from the image. Please try another one.",
          });
        } finally {
          setIsLoading(false);
        }
    } else {
        toast({
            variant: "destructive",
            title: "Scan Error",
            description: "Could not capture an image from the video stream.",
        });
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="My Inventory" action={<Button><PlusCircle className="mr-2"/> Add Item</Button>} />
      
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
                <CardDescription>Point your camera at your fridge or pantry to automatically detect items.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative aspect-video w-full border-2 border-dashed border-muted-foreground/50 rounded-lg flex items-center justify-center bg-secondary">
                  <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
                  {hasCameraPermission === false && (
                     <Alert variant="destructive" className="absolute m-4">
                       <AlertTitle>Camera Access Required</AlertTitle>
                       <AlertDescription>
                         Please allow camera access in your browser settings to use this feature.
                       </AlertDescription>
                     </Alert>
                  )}
                </div>
                 <Button onClick={handleScan} disabled={isLoading || hasCameraPermission === false} className="w-full">
                    {isLoading ? <><Loader className="mr-2 animate-spin"/> Scanning...</> : <><Camera className="mr-2" /> Scan What You See</>}
                </Button>
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
                    {initialInventory.map((item) => (
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
