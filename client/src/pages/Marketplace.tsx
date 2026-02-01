import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingCart, Plus, Trash2, Search, Package, Truck, Trophy } from "lucide-react";
import { toast } from "sonner";
import { ProductImageCarousel } from "@/components/ProductImageCarousel";
import { ProductCard } from "@/components/ProductCard";
import { SellerProductCard } from "@/components/SellerProductCard";

const CATEGORIES = ["Seeds", "Fertilizers", "Pesticides", "Equipment", "Tools"];
const UNITS = ["kg", "liter", "dozen", "piece", "ton", "bag"];

export default function Marketplace() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isTransportDialogOpen, setIsTransportDialogOpen] = useState(false);
  const [selectedOrderForTransport, setSelectedOrderForTransport] = useState<any>(null);

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    category: "",
    productType: "standard",
    price: "",
    quantity: "",
    unit: "kg",
    imageUrl: "",
    imageUrls: [] as string[],
  });

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const MAX_IMAGES = 5;

  const [checkoutForm, setCheckoutForm] = useState({
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
  });

  // Queries
  const { data: allProducts = [], refetch: refetchProducts } = trpc.marketplace.listProducts.useQuery({
    category: selectedCategory || undefined,
    search: searchQuery || undefined,
    limit: 50,
  });

  // Client-side filtering and sorting
  const products = useMemo(() => {
    let filtered = [...allProducts];

    // Price range filter
    filtered = filtered.filter(p => {
      const price = parseFloat(p.price);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return parseFloat(a.price) - parseFloat(b.price);
        case "price-high":
          return parseFloat(b.price) - parseFloat(a.price);
        case "name":
          return a.name.localeCompare(b.name);
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [allProducts, priceRange, sortBy]);

  // Update active filters
  useEffect(() => {
    const filters: string[] = [];
    if (selectedCategory) filters.push(`Category: ${selectedCategory}`);
    if (searchQuery) filters.push(`Search: "${searchQuery}"`);
    if (priceRange[0] > 0 || priceRange[1] < 10000) {
      filters.push(`Price: GH₵${priceRange[0]} - GH₵${priceRange[1]}`);
    }
    setActiveFilters(filters);
  }, [selectedCategory, searchQuery, priceRange]);

  const { data: cart = [], refetch: refetchCart } = trpc.marketplace.getCart.useQuery();
  const { data: sellerStats } = trpc.marketplace.getSellerStats.useQuery();
  const { data: orders = [] } = trpc.marketplace.listOrders.useQuery({ role: "buyer" });

  // For now, we'll use imageUrl from products and fetch images on-demand in the component
  // This avoids violating React hooks rules by calling useQuery in a loop

  // Mutations
  const uploadImageMutation = trpc.marketplace.uploadProductImage.useMutation({
    onSuccess: (data) => {
      setNewProduct({ ...newProduct, imageUrl: data.url });
      toast.success("Image uploaded successfully!");
      setIsUploadingImage(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to upload image");
      setIsUploadingImage(false);
    },
  });

  const createProductMutation = trpc.marketplace.createProduct.useMutation({
    onSuccess: () => {
      refetchProducts();
      toast.success("Product listed successfully!");
      setIsAddProductOpen(false);
      setNewProduct({
        name: "",
        description: "",
        category: "",
        productType: "standard",
        price: "",
        quantity: "",
        unit: "kg",
        imageUrl: "",
        imageUrls: [],
      });
      setSelectedImages([]);
      setImagePreviews([]);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to add product");
    },
  });

  const addToCartMutation = trpc.marketplace.addToCart.useMutation({
    onSuccess: () => {
      refetchCart();
      toast.success("Added to cart!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to add to cart");
    },
  });

  const removeFromCartMutation = trpc.marketplace.removeFromCart.useMutation({
    onSuccess: () => {
      refetchCart();
      toast.success("Removed from cart!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to remove from cart");
    },
  });

  const createOrderMutation = trpc.marketplace.createOrder.useMutation({
    onSuccess: () => {
      refetchCart();
      refetchProducts();
      setIsCheckoutOpen(false);
      setCheckoutForm({ address: "", city: "", state: "", zipCode: "", phone: "" });
      toast.success("Order placed successfully!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to place order");
    },
  });

  // Handlers
  const handleImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check if adding these files would exceed MAX_IMAGES
    if (selectedImages.length + files.length > MAX_IMAGES) {
      toast.error(`You can only upload up to ${MAX_IMAGES} images`);
      return;
    }

    // Validate each file
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select only image files');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Each image must be less than 5MB');
        return;
      }
    }

    // Add files to selected images
    setSelectedImages(prev => [...prev, ...files]);
    
    // Create previews for new files
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setNewProduct(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index)
    }));
  };

  const handleUploadImages = async () => {
    if (selectedImages.length === 0) return;

    setIsUploadingImage(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of selectedImages) {
        const reader = new FileReader();
        const uploadPromise = new Promise<string>((resolve, reject) => {
          reader.onloadend = async () => {
            try {
              const result = await uploadImageMutation.mutateAsync({
                imageData: reader.result as string,
                fileName: file.name,
                mimeType: file.type,
              });
              resolve(result.url);
            } catch (error) {
              reject(error);
            }
          };
          reader.readAsDataURL(file);
        });
        
        const url = await uploadPromise;
        uploadedUrls.push(url);
      }

      setNewProduct(prev => ({
        ...prev,
        imageUrls: [...prev.imageUrls, ...uploadedUrls],
        imageUrl: uploadedUrls[0] || prev.imageUrl, // Set first image as primary
      }));
      
      // Clear selected images after successful upload
      setSelectedImages([]);
      setImagePreviews([]);
      
      toast.success(`${uploadedUrls.length} image(s) uploaded successfully!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload some images');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.category || !newProduct.price || !newProduct.quantity) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createProductMutation.mutateAsync({
        name: newProduct.name,
        description: newProduct.description,
        category: newProduct.category,
        productType: newProduct.productType,
        price: parseFloat(newProduct.price),
        quantity: parseFloat(newProduct.quantity),
        unit: newProduct.unit,
        imageUrl: newProduct.imageUrl || undefined,
        imageUrls: newProduct.imageUrls.length > 0 ? newProduct.imageUrls : undefined,
      });
    } catch (error: any) {
      console.error("Error creating product:", error);
    }
  };

  const handleAddToCart = async (productId: number) => {
    try {
      await addToCartMutation.mutateAsync({
        productId,
        quantity: 1,
      });
    } catch (error: any) {
      console.error("Error adding to cart:", error);
    }
  };

  const handleRemoveFromCart = async (cartId: number) => {
    try {
      await removeFromCartMutation.mutateAsync({ cartId });
    } catch (error: any) {
      console.error("Error removing from cart:", error);
    }
  };

  const handleCheckout = async () => {
    if (!checkoutForm.address || !checkoutForm.city || !checkoutForm.state || !checkoutForm.zipCode) {
      toast.error("Please fill in all address fields");
      return;
    }

    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    const firstProduct = products.find((p: any) => p.id === cart[0]?.productId);
    if (!firstProduct) {
      toast.error("Product not found");
      return;
    }

    const orderItems = cart.map((item: any) => ({
      productId: item.productId,
      quantity: parseFloat(item.quantity),
    }));

    try {
      await createOrderMutation.mutateAsync({
        sellerId: firstProduct.sellerId || user?.id || 0,
        items: orderItems,
        deliveryAddress: `${checkoutForm.address}, ${checkoutForm.city}, ${checkoutForm.state} ${checkoutForm.zipCode}`,
      });
    } catch (error: any) {
      console.error("Error placing order:", error);
    }
  };

  const cartTotal = cart.reduce((sum: number, item: any) => {
    const product = products.find((p: any) => p.id === item.productId);
    return sum + (product ? parseFloat(product.price) * parseFloat(item.quantity) : 0);
  }, 0);

  const filteredProducts = products
    .filter((p: any) => {
      if (selectedCategory && p.category !== selectedCategory) return false;
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a: any, b: any) => {
      if (sortBy === "price-low") return parseFloat(a.price) - parseFloat(b.price);
      if (sortBy === "price-high") return parseFloat(b.price) - parseFloat(a.price);
      return (b.id || 0) - (a.id || 0);
    });

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground">Browse and purchase agricultural products</p>
        </div>
        <Button onClick={() => window.location.href = "/seller-leaderboard"} variant="outline">
          <Trophy className="mr-2 h-4 w-4" />
          Seller Leaderboard
        </Button>
      </div>
      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Browse Products</TabsTrigger>
          <TabsTrigger value="orders">My Orders</TabsTrigger>
          <TabsTrigger value="selling">My Products</TabsTrigger>
        </TabsList>

        {/* Browse Products Tab */}
        <TabsContent value="browse" className="space-y-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Range Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Price Range</Label>
                  <span className="text-sm text-muted-foreground">
                    GH₵{priceRange[0]} - GH₵{priceRange[1]}
                  </span>
                </div>
                <div className="flex gap-4">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                    className="w-24"
                  />
                  <span className="self-center">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 10000])}
                    className="w-24"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPriceRange([0, 10000])}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {activeFilters.map((filter, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1">
                  {filter}
                  <button
                    className="ml-2 hover:text-destructive"
                    onClick={() => {
                      if (filter.startsWith("Category:")) setSelectedCategory("");
                      if (filter.startsWith("Search:")) setSearchQuery("");
                      if (filter.startsWith("Price:")) setPriceRange([0, 10000]);
                    }}
                  >
                    ×
                  </button>
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCategory("");
                  setSearchQuery("");
                  setPriceRange([0, 10000]);
                }}
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            Showing {products.length} product{products.length !== 1 ? 's' : ''}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search query
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCategory("");
                    setSearchQuery("");
                    setPriceRange([0, 10000]);
                  }}
                >
                  Clear all filters
                </Button>
              </div>
            ) : (
              products.map((product: any) => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
              ))
            )}
          </div>
        </TabsContent>

        {/* My Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No orders yet. Start shopping!
              </CardContent>
            </Card>
          ) : (
            orders.map((order: any) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{order.orderNumber}</CardTitle>
                      <CardDescription>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}</CardDescription>
                    </div>
                    <Badge variant={order.status === "delivered" ? "default" : "secondary"}>{order.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-lg font-semibold">GH₵{parseFloat(order.totalAmount).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">{order.deliveryAddress}</p>
                    {order.status === "confirmed" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedOrderForTransport(order);
                          setIsTransportDialogOpen(true);
                        }}
                      >
                        <Truck className="mr-2 h-4 w-4" />
                        Request Transport
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {/* Shopping Cart */}
          {cart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Shopping Cart</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.map((item: any) => {
                  const product = products.find((p: any) => p.id === item.productId);
                  return (
                             <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{product?.name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p>GH₵{(parseFloat(product?.price || "0") * parseFloat(item.quantity)).toFixed(2)}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFromCart(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                <div className="border-t pt-4">
                  <p className="text-lg font-bold mb-4">Total: GH₵{cartTotal.toFixed(2)}</p>
                  <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full">Proceed to Checkout</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Checkout</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Address</Label>
                          <Input
                            value={checkoutForm.address}
                            onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                            placeholder="Street address"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>City</Label>
                            <Input
                              value={checkoutForm.city}
                              onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                              placeholder="City"
                            />
                          </div>
                          <div>
                            <Label>State</Label>
                            <Input
                              value={checkoutForm.state}
                              onChange={(e) => setCheckoutForm({ ...checkoutForm, state: e.target.value })}
                              placeholder="State"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>ZIP Code</Label>
                          <Input
                            value={checkoutForm.zipCode}
                            onChange={(e) => setCheckoutForm({ ...checkoutForm, zipCode: e.target.value })}
                            placeholder="ZIP code"
                          />
                        </div>
                        <Button onClick={handleCheckout} className="w-full">
                          Place Order
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* My Products Tab */}
        <TabsContent value="selling" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">My Products</h2>
            <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>List New Product</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Product Images (Max {MAX_IMAGES})</Label>
                    <div className="space-y-2">
                      {/* Image Previews Grid */}
                      {(imagePreviews.length > 0 || newProduct.imageUrls.length > 0) && (
                        <div className="grid grid-cols-3 gap-2">
                          {imagePreviews.map((preview, index) => (
                            <div key={`preview-${index}`} className="relative w-full h-32 border rounded-lg overflow-hidden group">
                              <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          {newProduct.imageUrls.map((url, index) => (
                            <div key={`uploaded-${index}`} className="relative w-full h-32 border rounded-lg overflow-hidden">
                              <img src={url} alt={`Uploaded ${index + 1}`} className="w-full h-full object-cover" />
                              <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-1 text-xs">
                                ✓
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* File Input and Upload Button */}
                      {(selectedImages.length + newProduct.imageUrls.length) < MAX_IMAGES && (
                        <div className="flex gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImagesSelect}
                            className="flex-1"
                          />
                          {selectedImages.length > 0 && (
                            <Button
                              type="button"
                              onClick={handleUploadImages}
                              disabled={isUploadingImage}
                            >
                              {isUploadingImage ? "Uploading..." : `Upload (${selectedImages.length})`}
                            </Button>
                          )}
                        </div>
                      )}
                      
                      {newProduct.imageUrls.length > 0 && (
                        <p className="text-sm text-green-600">✓ {newProduct.imageUrls.length} image(s) uploaded</p>
                      )}
                      {(selectedImages.length + newProduct.imageUrls.length) >= MAX_IMAGES && (
                        <p className="text-sm text-muted-foreground">Maximum {MAX_IMAGES} images reached</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Product Name</Label>
                    <Input
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="Product name"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      placeholder="Product description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Category</Label>
                      <Select value={newProduct.category} onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Select value={newProduct.unit} onValueChange={(value) => setNewProduct({ ...newProduct, unit: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {UNITS.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Price (₹)</Label>
                      <Input
                        type="number"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={newProduct.quantity}
                        onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreateProduct} className="w-full">
                    List Product
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Seller Stats */}
          {sellerStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">GH₵{parseFloat(String(sellerStats.totalRevenue)).toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Products Listed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{sellerStats.totalProducts}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{sellerStats.totalOrders}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* My Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products
              .filter((p: any) => p.sellerId === user?.id)
              .map((product: any) => (
                <SellerProductCard key={product.id} product={product} />
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Transport Request Dialog */}
      <Dialog open={isTransportDialogOpen} onOpenChange={setIsTransportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Transport for Order</DialogTitle>
          </DialogHeader>
          {selectedOrderForTransport && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Order Number</Label>
                <Input value={selectedOrderForTransport.orderNumber} disabled />
              </div>
              <div className="grid gap-2">
                <Label>Delivery Address</Label>
                <Textarea value={selectedOrderForTransport.deliveryAddress} disabled rows={2} />
              </div>
              <div className="grid gap-2">
                <Label>Total Amount</Label>
                <Input value={`GH₵${parseFloat(selectedOrderForTransport.totalAmount).toFixed(2)}`} disabled />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsTransportDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // Navigate to transport page with pre-filled order details
                    window.location.href = `/transport?orderId=${selectedOrderForTransport.id}`;
                  }}
                >
                  <Truck className="mr-2 h-4 w-4" />
                  Create Transport Request
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
