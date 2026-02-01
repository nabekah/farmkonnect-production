import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, Eye, Truck, CheckCircle2, Clock, XCircle, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

const statusConfig: Record<OrderStatus, { label: string; icon: any; color: string }> = {
  pending: { label: "Pending", icon: Clock, color: "bg-yellow-500" },
  confirmed: { label: "Confirmed", icon: CheckCircle2, color: "bg-blue-500" },
  shipped: { label: "Shipped", icon: Truck, color: "bg-purple-500" },
  delivered: { label: "Delivered", icon: CheckCircle2, color: "bg-green-500" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "bg-red-500" },
};

export default function Orders() {
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Safe JSON parser for deliveryAddress
  const parseDeliveryAddress = (address: string) => {
    try {
      return JSON.parse(address);
    } catch {
      // If not valid JSON, return as plain string
      return { city: address };
    }
  };

  const { data: orders = [], refetch } = trpc.marketplace.listOrders.useQuery({ role });
  const { data: orderDetails } = trpc.marketplace.getOrder.useQuery(
    { id: selectedOrderId! },
    { enabled: !!selectedOrderId }
  );

  const updateOrderStatus = trpc.marketplace.updateOrderStatus.useMutation({
    onSuccess: () => {
      toast.success("Order status updated");
      refetch();
      setSelectedOrderId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update order");
    },
  });

  const cancelOrder = trpc.marketplace.cancelOrder.useMutation({
    onSuccess: (data) => {
      toast.success(`Order ${data.orderNumber} cancelled successfully`);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel order");
    },
  });

  const handleCancelOrder = (orderId: number, orderNumber: string) => {
    if (confirm(`Are you sure you want to cancel order ${orderNumber}?`)) {
      cancelOrder.mutate({ orderId });
    }
  };

  const handleStatusUpdate = (orderId: number, status: OrderStatus) => {
    updateOrderStatus.mutate({ orderId, status });
  };

  return (
    <div className="container max-w-7xl py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Orders</h1>
        <div className="flex gap-3">
          {role === "seller" && (
            <Link href="/seller-analytics">
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </Link>
          )}
          <Select value={role} onValueChange={(v) => setRole(v as "buyer" | "seller")}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buyer">My Orders</SelectItem>
              <SelectItem value="seller">Seller Orders</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground">
              {role === "buyer" 
                ? "Orders you place will appear here" 
                : "Orders from customers will appear here"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order: any) => {
            const status = order.status as OrderStatus;
            const StatusIcon = statusConfig[status].icon;
            
            return (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                        <Badge className={`${statusConfig[status].color} text-white`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig[status].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">GH₵{parseFloat(order.totalAmount).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">{order.paymentStatus}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      <p className="text-muted-foreground">Delivery Address:</p>
                      <p className="font-medium">{parseDeliveryAddress(order.deliveryAddress).city || "N/A"}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrderId(order.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      {role === "buyer" && status === "pending" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelOrder(order.id, order.orderNumber)}
                          disabled={cancelOrder.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancel Order
                        </Button>
                      )}
                      {role === "seller" && status !== "delivered" && status !== "cancelled" && (
                        <Select
                          value={status}
                          onValueChange={(v) => handleStatusUpdate(order.id, v as OrderStatus)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="confirmed">Confirm</SelectItem>
                            <SelectItem value="shipped">Ship</SelectItem>
                            <SelectItem value="delivered">Deliver</SelectItem>
                            <SelectItem value="cancelled">Cancel</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrderId} onOpenChange={() => setSelectedOrderId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {orderDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="font-semibold">{orderDetails.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={`${statusConfig[orderDetails.status as OrderStatus].color} text-white`}>
                    {statusConfig[orderDetails.status as OrderStatus].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium">
                    {new Date(orderDetails.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <p className="font-medium capitalize">{orderDetails.paymentStatus}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Delivery Address</h4>
                <div className="bg-accent p-3 rounded-lg text-sm">
                  {(() => {
                    try {
                      const addr = JSON.parse(orderDetails.deliveryAddress || '{}');
                      return (
                        <>
                          <p>{addr.fullName}</p>
                          <p>{addr.phone}</p>
                          <p>{addr.address}</p>
                          <p>{addr.city}, {addr.region}</p>
                        </>
                      );
                    } catch {
                      return <p>{orderDetails.deliveryAddress}</p>;
                    }
                  })()}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Order Items</h4>
                <div className="space-y-2">
                    {(orderDetails.items || []).map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-accent rounded-lg">
                      <div>
                        <p className="font-medium">Product #{item.productId}</p>
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">GH₵{parseFloat(item.subtotal).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount</span>
                <span>GH₵{parseFloat(orderDetails.totalAmount).toFixed(2)}</span>
              </div>

              {orderDetails.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{orderDetails.notes}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
