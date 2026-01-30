import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { ProductImageCarousel } from "./ProductImageCarousel";
import { ShoppingCart } from "lucide-react";

interface ProductCardProps {
  product: any;
  onAddToCart: (productId: number) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  // Fetch images for this specific product
  const { data: images = [] } = trpc.marketplace.getProductImages.useQuery({ 
    productId: product.id 
  });

  // Combine fetched images with fallback to imageUrl
  const displayImages = images.length > 0 
    ? images.map((img: any) => img.imageUrl)
    : (product.imageUrl ? [product.imageUrl] : []);

  return (
    <Card>
      {displayImages.length > 0 && (
        <ProductImageCarousel images={displayImages} productName={product.name} />
      )}
      <CardHeader>
        <CardTitle className="line-clamp-2">{product.name}</CardTitle>
        <CardDescription>{product.category}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">₹{parseFloat(product.price).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{product.quantity} {product.unit} available</p>
          </div>
        </div>
        <Button onClick={() => onAddToCart(product.id)} className="w-full">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  );
}
