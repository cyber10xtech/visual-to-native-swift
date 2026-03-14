import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, AlertCircle, ArrowLeft, LogOut } from "lucide-react";
import { NIGERIAN_STATES } from "@/lib/validation";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

const CompleteAccount = () => {
  const navigate = useNavigate();
  const { user, refreshCustomerProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.user_metadata?.full_name || "",
    phone: "",
    city: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("customer_profiles")
        .upsert(
          {
            user_id: user.id,
            full_name: formData.fullName.trim(),
            email: user.email,
            phone: formData.phone.trim() || null,
            city: formData.city || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;

      await refreshCustomerProfile();
      toast.success("Profile completed!");
      navigate("/home", { replace: true });
    } catch (err: any) {
      toast.error("Failed to save profile: " + (err.message || "Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-primary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-card rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-8">
          <div className="flex flex-col items-center mb-6">
            <img src={logo} alt="Safesight" className="w-16 h-16 rounded-2xl mb-4 object-contain shadow-lg" />
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-warning" />
              <h1 className="text-xl font-bold text-foreground">Complete Your Profile</h1>
            </div>
            <p className="text-muted-foreground text-center text-sm">
              We've updated SafeSight. Please complete your profile to continue using the app.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                placeholder="Your full name"
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                required
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+234 800 000 0000"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Select value={formData.city} onValueChange={(v) => handleChange("city", v)}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Select your city" />
                </SelectTrigger>
                <SelectContent>
                  {NIGERIAN_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl gradient-primary border-0 text-white hover:opacity-90"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Profile"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CompleteAccount;
