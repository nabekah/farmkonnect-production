import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Eye, FileText } from "lucide-react";
import { toast } from "sonner";

export default function AdminVerification() {
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  const { data: verifications = [], refetch } = trpc.marketplace.listVerificationRequests.useQuery();
  const reviewMutation = trpc.marketplace.reviewVerification.useMutation({
    onSuccess: () => {
      toast.success("Verification reviewed successfully");
      setIsReviewDialogOpen(false);
      setSelectedVerification(null);
      setReviewNotes("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to review verification");
    },
  });

  const handleReview = (status: "approved" | "rejected") => {
    if (!selectedVerification) return;
    
    reviewMutation.mutate({
      verificationId: selectedVerification.id,
      status,
      notes: reviewNotes || undefined,
    });
  };

  const statusConfig = {
    pending: { label: "Pending", color: "bg-yellow-500" },
    approved: { label: "Approved", color: "bg-green-500" },
    rejected: { label: "Rejected", color: "bg-red-500" },
  };

  const pendingCount = verifications.filter((v: any) => v.status === "pending").length;
  const approvedCount = verifications.filter((v: any) => v.status === "approved").length;
  const rejectedCount = verifications.filter((v: any) => v.status === "rejected").length;

  return (
    <div className="container max-w-7xl py-4 sm:py-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Seller Verification Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Review and approve seller verification requests</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Verification Requests */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold">Verification Requests</h2>
        
        {verifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 sm:p-12">
              <div className="text-center text-muted-foreground">
                No verification requests found
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {verifications.map((verification: any) => {
              const config = statusConfig[verification.status as keyof typeof statusConfig];
              return (
                <Card key={verification.id}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-base sm:text-lg">Seller ID: {verification.sellerId}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Submitted: {new Date(verification.createdAt).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <Badge className={`${config.color} text-white text-xs`}>
                            {config.label}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Document Type</p>
                            <p className="capitalize">{verification.documentType}</p>
                          </div>
                          {verification.reviewedAt && (
                            <div>
                              <p className="text-xs text-muted-foreground">Reviewed</p>
                              <p>{new Date(verification.reviewedAt).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}</p>
                            </div>
                          )}
                        </div>

                        {verification.notes && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">Review Notes</p>
                            <p className="text-sm">{verification.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex sm:flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(verification.documentUrl, "_blank")}
                          className="flex-1 sm:flex-none"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">View Document</span>
                          <span className="sm:hidden">View</span>
                        </Button>
                        
                        {verification.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedVerification(verification);
                              setIsReviewDialogOpen(true);
                            }}
                            className="flex-1 sm:flex-none"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Verification Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Review Notes (Optional)</label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any notes about your decision..."
                className="mt-2"
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleReview("approved")}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={reviewMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={() => handleReview("rejected")}
                variant="destructive"
                className="flex-1"
                disabled={reviewMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
