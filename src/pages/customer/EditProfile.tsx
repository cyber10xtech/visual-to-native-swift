import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Camera, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useCustomerProfile } from "@/hooks/useCustomerProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { profileSchema, NIGERIAN_CITIES } from "@/lib/validation";
import { motion } from "framer-motion";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useCustomerProfile();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    address: "",
    city: "",
    zipCode: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || "",
        email: profile.email || user?.email || "",
        address: profile.address || "",
        city: profile.city || "",
        zipCode: profile.zip_code || "",
      });
      setAvatarUrl(profile.avatar_url || "");
    } else if (user && !profileLoading) {
      setFormData(prev => ({
        ...prev,
        fullName: user.user_metadata?.full_name || "",
        email: user.email || "",
      }));
    }
  }, [profile, user, profileLoading]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(publicUrl);
      toast.success("Photo uploaded!");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setErrors({});
    const result = profileSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(i => { fieldErrors[i.path[0] as string] = i.message; });
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    const { error } = await updateProfile({
      full_name: formData.fullName.trim(),
      address: formData.address.trim(),
      city: formData.city,
      zip_code: formData.zipCode.trim(),
      avatar_url: avatarUrl || null,
    });
    setSaving(false);

    if (error) {
      toast.error("Failed to update profile.");
    } else {
      toast.success("Profile updated!");
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
      <div className="bg-card border-b border-border px-4 py-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Edit Profile</span>
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8">
          <div className="relative">
            <Avatar className="w-24 h-24 ring-4 ring-primary/20">
              <AvatarImage src={avatarUrl} alt="Profile" />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-md">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" /> : <Camera className="w-4 h-4 text-primary-foreground" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </div>
          <button onClick={() => fileInputRef.current?.click()} className="text-sm text-primary mt-2 hover:underline font-medium">
            Change photo
          </button>
        </motion.div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={formData.fullName} onChange={(e) => handleChange("fullName", e.target.value)}
              className="h-12 rounded-xl" />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={formData.email} disabled className="h-12 rounded-xl opacity-60" />
          </div>

          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={formData.address} onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Enter your address" className="h-12 rounded-xl" />
          </div>

          <div className="space-y-2">
            <Label>City</Label>
            <Select value={formData.city} onValueChange={(v) => handleChange("city", v)}>
              <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select your city" /></SelectTrigger>
              <SelectContent>
                {NIGERIAN_CITIES.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>ZIP Code</Label>
            <Input value={formData.zipCode} onChange={(e) => handleChange("zipCode", e.target.value)}
              placeholder="e.g., 100001" className="h-12 rounded-xl" maxLength={20} />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}
          className="w-full h-12 mt-6 gap-2 rounded-xl gradient-primary border-0 text-white hover:opacity-90">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default EditProfile;
