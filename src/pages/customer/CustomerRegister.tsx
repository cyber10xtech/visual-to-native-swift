import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { signUpSchema } from "@/lib/validation";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

const CustomerRegister = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signUpSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(i => { fieldErrors[i.path[0] as string] = i.message; });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const { error: signUpError } = await signUp(formData.email.trim(), formData.password, { fullName: formData.fullName.trim() });
      if (signUpError) throw signUpError;

      if (avatarFile) {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (userId) {
          const fileExt = avatarFile.name.split(".").pop();
          const filePath = `${userId}/avatar.${fileExt}`;
          await supabase.storage.from("avatars").upload(filePath, avatarFile, { upsert: true });
          const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
          await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", userId);
        }
      }

      toast.success("Account created! Please check your email to verify.");
      navigate("/sign-in");
    } catch (error: any) {
      const msg = error.message || "";
      if (msg.includes("already registered") || msg.includes("already been registered") || error.status === 422) {
        toast.error("This email is already registered. Please sign in instead.");
      } else if (msg.includes("password") || msg.includes("weak")) {
        toast.error("Password is too weak. Please use a stronger password.");
      } else {
        toast.error("Registration failed: " + (msg || "Please check your details."));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const initials = formData.fullName
    ? formData.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

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
            <motion.img
              src={logo}
              alt="Safesight"
              className="w-20 h-20 rounded-2xl mb-4 object-contain shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            />
            <h1 className="text-2xl font-bold text-gradient">Create Account</h1>
            <p className="text-muted-foreground">Join Safesight today</p>
          </div>

          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <Avatar className="w-20 h-20 bg-primary">
                <AvatarImage src={avatarPreview} alt="Profile" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 bg-muted rounded-full flex items-center justify-center border-2 border-background">
                <Camera className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
            </div>
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="text-xs text-muted-foreground mt-2 hover:text-foreground">Add profile photo</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" placeholder="Chukwudi Okafor" value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)} required className="h-12 rounded-xl" />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)} required className="h-12 rounded-xl" />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                  value={formData.password} onChange={(e) => handleChange("password", e.target.value)}
                  required className="h-12 rounded-xl pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              <div className="space-y-1 mt-2">
                <p className={cn("text-xs flex items-center gap-1", formData.password.length >= 6 ? "text-success" : "text-muted-foreground")}>
                  {formData.password.length >= 6 ? "✓" : "○"} At least 6 characters
                </p>
                <p className={cn("text-xs flex items-center gap-1", /[a-zA-Z]/.test(formData.password) ? "text-success" : "text-muted-foreground")}>
                  {/[a-zA-Z]/.test(formData.password) ? "✓" : "○"} Contains a letter
                </p>
                <p className={cn("text-xs flex items-center gap-1", /[0-9]/.test(formData.password) ? "text-success" : "text-muted-foreground")}>
                  {/[0-9]/.test(formData.password) ? "✓" : "○"} Contains a number
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="••••••••"
                value={formData.confirmPassword} onChange={(e) => handleChange("confirmPassword", e.target.value)}
                required className="h-12 rounded-xl" />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl gradient-primary border-0 text-white hover:opacity-90" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account? <Link to="/sign-in" className="text-primary font-medium hover:underline">Sign In</Link>
          </p>
          <p className="text-center text-xs text-muted-foreground mt-4">
            By creating an account, you agree to our{" "}
            <Link to="/terms" className="text-primary hover:underline">Terms & Privacy Policy</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default CustomerRegister;
