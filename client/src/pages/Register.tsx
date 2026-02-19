import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { UserPlus, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
    requestedRole: "farmer" as "farmer" | "agent" | "veterinarian" | "buyer" | "transporter",
  });
  const [submitted, setSubmitted] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);

  const toast = (props: { title: string; description?: string; variant?: "default" | "destructive" }) => {
    const toastEl = document.createElement("div");
    toastEl.className = `fixed bottom-4 right-4 bg-${props.variant === "destructive" ? "red" : "green"}-600 text-white px-6 py-3 rounded-lg shadow-lg z-50`;
    toastEl.innerHTML = `<strong>${props.title}</strong>${props.description ? `<br/><span class="text-sm">${props.description}</span>` : ""}`;
    document.body.appendChild(toastEl);
    setTimeout(() => toastEl.remove(), 3000);
  };

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      setSubmitted(true);
      setRequiresApproval(data.approvalStatus === "pending");
      toast({ title: "Success", description: "Registration successful! Please check your email for confirmation." });
    },
    onError: (error) => {
      toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.name) {
      toast({ title: "Missing Fields", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    registerMutation.mutate({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.requestedRole,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {requiresApproval ? (
                <AlertCircle className="h-16 w-16 text-yellow-500" />
              ) : (
                <CheckCircle className="h-16 w-16 text-green-500" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {requiresApproval ? "Registration Submitted" : "Registration Successful"}
            </CardTitle>
            <CardDescription>
              {requiresApproval
                ? "Your registration request has been submitted for admin approval. You will be notified via email once your account is approved."
                : "Your account has been created successfully! You can now log in to access the system."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {requiresApproval && (
              <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
                <h4 className="font-semibold mb-2">What happens next?</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Admin will review your registration request</li>
                  <li>You'll receive an email notification once approved</li>
                  <li>Approval typically takes 1-2 business days</li>
                  <li>You can then log in with your credentials</li>
                </ul>
              </div>
            )}
            <div className="flex justify-center gap-4">
              <Link href="/">
                <Button>Go to Home</Button>
              </Link>
              {!requiresApproval && (
                <Button variant="outline" onClick={() => (window.location.href = "/login")}>
                  Log In Now
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <UserPlus className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl">Register for FarmKonnect</CardTitle>
          </div>
          <CardDescription>
            Create an account to access our comprehensive agricultural management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+233 XX XXX XXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">
                  Requested Role <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.requestedRole}
                  onValueChange={(value: any) => setFormData({ ...formData, requestedRole: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="farmer">Farmer</SelectItem>
                    <SelectItem value="agent">Extension Agent</SelectItem>
                    <SelectItem value="veterinarian">Veterinarian</SelectItem>
                    <SelectItem value="buyer">Buyer</SelectItem>
                    <SelectItem value="transporter">Transporter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>



            <div className="p-4 border rounded-lg bg-muted">
              <h4 className="font-semibold mb-2">What to expect:</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Your registration will be reviewed by our admin team</li>
                <li>You'll receive an email notification once approved</li>
                <li>Approval typically takes 1-2 business days</li>
                <li>Once approved, you can log in and start managing your farm operations</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? "Submitting..." : "Submit Registration"}
              </Button>
              <Link href="/">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <a href="/login" className="text-primary hover:underline">
                Log in here
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
