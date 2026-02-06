import { useState, useEffect } from "react";
import { ArrowLeft, Camera, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useCustomerProfile } from "@/hooks/useCustomerProfile";
import { toast } from "sonner";

const EditProfile = () => {
  const navigate = useNavigate();
  const { profile, loading: profileLoading, updateProfile } = useCustomerProfile();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        zipCode: profile.zip_code || "",
      });
    }
  }, [profile]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      full_name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      zip_code: formData.zipCode,
    });
    setSaving(false);

    if (error) {
      toast.error("Failed to update profile. Please try again.");
    } else {
      toast.success("Profile updated successfully!");
      navigate(-1);
    }
  };

  const initials = formData.fullName
    ? formData.fullName.split(" ").map(n => n[0]).join("").toUpperCase()
    : "?";

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Edit Profile</span>
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <Avatar className="w-24 h-24 bg-primary">
              <AvatarImage src={profile?.avatar_url || ""} alt="Profile" />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center border-2 border-background">
              <Camera className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <button className="text-sm text-muted-foreground mt-2 hover:text-foreground">
            Change profile photo
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              className="h-12 bg-muted/50 border border-border rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
              className="h-12 bg-muted/50 border border-border rounded-xl opacity-60"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="Enter your phone number"
              className="h-12 bg-muted/50 border border-border rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Enter your address"
              className="h-12 bg-muted/50 border border-border rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              placeholder="Enter your city"
              className="h-12 bg-muted/50 border border-border rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input
              id="zipCode"
              value={formData.zipCode}
              onChange={(e) => handleChange("zipCode", e.target.value)}
              placeholder="Enter your ZIP code"
              className="h-12 bg-muted/50 border border-border rounded-xl"
            />
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 mt-6 gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default EditProfile;
