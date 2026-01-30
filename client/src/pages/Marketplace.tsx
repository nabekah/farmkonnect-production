import { useState } from "react";
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
import { ShoppingCart, Plus, Trash2, Star, Search, TrendingUp, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["Vegetables", "Dairy", "Meat", "Grains", "Fruits", "Herbs", "Eggs", "Other"];
const UNITS = ["kg", "liter", "dozen", "piece", "ton", "bag"];

export default function Marketplace() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cartQuantities, setCartQuantities] = useState<Record<number, number>>({});
  const [checkoutForm, setCheckoutForm] = useState({
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
  });

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    category: "",
    productType: "",
    price: "",
    quantity: "",
    unit: "kg",
  });

  // Queries
  const { data: products = [], isLoading: productsLoading, refetch: refetchProducts } = trpc.marketplace.listProducts.useQuery({
    category: selectedCategory || undefined,
    search: searchQuery || undefined,
    limit: 50,
  });

  const { data: cart = [], refetch: refetchCart } = trpc.marketplace.getCart.useQuery();
  const { data: sellerStats } = trpc.marketplace.getSellerStats.useQuery();
  const { data: orders = [] } = trpc.marketplace.listOrders.useQuery({ role: "buyer" });

  // Mutations
  const createProductMutation = trpc.marketplace.createProduct.useMutation({
    onSuccess: () => {
      refetchProducts();
      toast.success("Product listed successfully!");
    },
  });

  const addToCartMutation = trpc.marketplace.addToCart.useMutation({
    onSuccess: () => {
      refetchCart();
      toast.success("Added to cart!");
    },
  });

  const removeFromCartMutation = trpc.marketplace.removeFromCart.useMutation({
    onSuccess: () => {
      refetchCart();
      toast.success("Removed from cart!");
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
  });

  // Handlers
  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.category || !newProduct.price || !newProduct.quantity) {
      toast.error("Please fill in all required fields");
      return;
    }

    await createProductMutation.mutateAsync({
      name: newProduct.name,
      description: newProduct.description,
      category: newProduct.category,
      productType: newProduct.productType,
      price: parseFloat(newProduct.price),
      quantity: parseFloat(newProduct.quantity),
      unit: newProduct.unit,
    });

    setNewProduct({ name: "", description: "", category: "", productType: "", price: "", quantity: "", unit: "kg" });
    setIsCreateOpen(false);
  };

  const handleAddToCart = async (productId: number) => {
    const quantity = cartQuantities[productId] || 1;
    await addToCartMutation.mutateAsync({ productId, quantity });
    setCartQuantities({ ...cartQuantities, [productId]: 1 });
  };

  const handleRemoveFromCart = async (cartId: number) => {
    await removeFromCartMutation.mutateAsync({ cartId });
  };

  const handleCheckout = async () => {
    if (!checkoutForm.address || !checkoutForm.city || !checkoutForm.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    const orderItems = cart.map((item: any) => ({
      productId: item.productId,
      quantity: parseFloat(item.quantity),
    }));

    await createOrderMutation.mutateAsync({
      sellerId: user?.id || 0,
      items: orderItems,
      deliveryAddress: `${checkoutForm.address}, ${checkoutForm.city}, ${checkoutForm.state} ${checkoutForm.zipCode}`,
    });
  };

  const cartTotal = cart.reduce((sum: number, item: any) => {
    const product = products.find((p: any) => p.id === item.productId);
    return sum + (product ? parseFloat(product.price) * parseFloat(item.quantity) : 0);
  }, 0);

  const sortedProducts = [...products].sort((a: any, b: any) => {
    switch (sortBy) {
      case "price-low":
        return parseFloat(a.price) - parseFloat(b.price);
      case "price-high":
        return parseFloat(b.price) - parseFloat(a.price);
      case "newest":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse">Browse Products</TabsTrigger>
          <TabsTrigger value="orders">My Orders</TabsTrigger>
          <TabsTrigger value="selling">My Products</TabsTrigger>
        </TabsList>

        {/* Browse Products Tab */}
        <TabsContent value="browse" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Marketplace</h1>
              <p className="text-muted-foreground">Buy and sell agricultural products directly</p>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Sell Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>List New Product</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Product Name *</Label>
                    <Input
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="e.g., Organic Tomatoes"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      placeholder="Describe your product..."
                      className="h-24"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Category *</Label>
                      <Select value={newProduct.category} onValueChange={(v) => setNewProduct({ ...newProduct, category: v })}>
                        <SelectTrigger>
                          <SelectValue />
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
                      <Label>Type</Label>
                      <Input
                        value={newProduct.productType}
                        onChange={(e) => setNewProduct({ ...newProduct, productType: e.target.value })}
                        placeholder="e.g., Cherry, Beefsteak"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Price (₹) *</Label>
                      <Input
                        type="number"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        value={newProduct.quantity}
                        onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Select value={newProduct.unit} onValueChange={(v) => setNewProduct({ ...newProduct, unit: v })}>
                        <SelectTrigger>
                          <SelectValue />
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
                  <Button onClick={handleCreateProduct} disabled={createProductMutation.isPending} className="w-full">
                    {createProductMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    List Product
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters and Search */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Shopping Cart Summary */}
          {cart.length > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-semibold">{cart.length} items in cart</p>
                    <p className="text-sm text-muted-foreground">Total: ₹{cartTotal.toFixed(2)}</p>
                  </div>
                </div>
                <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                  <DialogTrigger asChild>
                    <Button>Proceed to Checkout</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Checkout</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="bg-muted p-4 rounded-lg space-y-2">
                        <p className="font-semibold">Order Summary</p>
                        {cart.map((item: any) => {
                          const product = products.find((p: any) => p.id === item.productId);
                          return (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>{product?.name} x {item.quantity}</span>
                              <span>₹{((product?.price as unknown as number || 0) * parseFloat(item.quantity)).toFixed(2)}</span>
                            </div>
                          );
                        })}
                        <div className="border-t pt-2 font-semibold flex justify-between">
                          <span>Total</span>
                          <span>₹{cartTotal.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label>Address *</Label>
                          <Input
                            value={checkoutForm.address}
                            onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                            placeholder="Street address"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>City *</Label>
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
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>ZIP Code</Label>
                            <Input
                              value={checkoutForm.zipCode}
                              onChange={(e) => setCheckoutForm({ ...checkoutForm, zipCode: e.target.value })}
                              placeholder="12345"
                            />
                          </div>
                          <div>
                            <Label>Phone *</Label>
                            <Input
                              value={checkoutForm.phone}
                              onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                              placeholder="+91 9876543210"
                            />
                          </div>
                        </div>
                      </div>

                      <Button onClick={handleCheckout} disabled={createOrderMutation.isPending} className="w-full">
                        {createOrderMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Place Order - ₹{cartTotal.toFixed(2)}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}

          {/* Products Grid */}
          {productsLoading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : sortedProducts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No products found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedProducts.map((product: any) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="line-clamp-2">{product.name}</CardTitle>
                        <CardDescription>{product.category}</CardDescription>
                      </div>
                      <Badge variant="secondary">{product.unit}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">₹{(product.price as unknown as number).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{product.quantity} {product.unit} available</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={cartQuantities[product.id] || 1}
                        onChange={(e) => setCartQuantities({ ...cartQuantities, [product.id]: parseInt(e.target.value) })}
                        className="w-20"
                      />
                      <Button onClick={() => handleAddToCart(product.id)} className="flex-1" disabled={addToCartMutation.isPending}>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <h2 className="text-2xl font-bold">My Orders</h2>
          {orders.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No orders yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Order #{order.id}</CardTitle>
                        <CardDescription>{new Date(order.createdAt).toLocaleDateString()}</CardDescription>
                      </div>
                      <Badge variant={order.status === "completed" ? "default" : "secondary"}>{order.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">₹{(order.totalAmount as unknown as number).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground mt-2">{order.shippingAddress}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Selling Tab */}
        <TabsContent value="selling" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">My Products</h2>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>

          {sellerStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">₹{(sellerStats.totalRevenue as unknown as number).toFixed(2)}</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products
              .filter((p: any) => p.sellerId === user?.id)
              .map((product: any) => (
                <Card key={product.id}>
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{product.name}</CardTitle>
                    <CardDescription>{product.category}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-2xl font-bold">₹{(product.price as unknown as number).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">{product.quantity} {product.unit} available</p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
