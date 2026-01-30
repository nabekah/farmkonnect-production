import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ProductImageCarousel } from "./ProductImageCarousel";

interface SellerProductCardProps {
  product: any;
}

export function SellerProductCard({ product }: SellerProductCardProps) {
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
      <CardContent className="space-y-2">
        <p className="text-2xl font-bold">₹{parseFloat(product.price).toFixed(2)}</p>
        <p className="text-sm text-muted-foreground">{product.quantity} {product.unit} available</p>
        <Badge variant={product.status === "active" ? "default" : "secondary"}>{product.status}</Badge>
      </CardContent>
    </Card>
  );
}
