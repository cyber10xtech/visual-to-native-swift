import { User, Heart, CreditCard, Bell, Shield, HelpCircle, Share2, FileText, LogOut, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CustomerBottomNav from "@/components/layout/CustomerBottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerProfile } from "@/hooks/useCustomerProfile";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const settingsItems = [
  { icon: User, label: "Edit Profile", description: "Update your personal information", path: "/settings/edit-profile" },
  { icon: Heart, label: "Saved Professionals", description: "View your favourite professionals", path: "/hub?tab=favorites" },
  { icon: CreditCard, label: "Payment Methods", description: "Manage your payment options", path: "/settings/payments" },
  { icon: Bell, label: "Notifications", description: "Manage notification preferences", path: "/settings/notifications" },
  { icon: Shield, label: "Privacy & Security", description: "Control your privacy settings", path: "/settings/privacy" },
  { icon: HelpCircle, label: "Help & Support", description: "Get help and contact support", path: "/settings/help" },
];

const secondaryItems = [
  { icon: Share2, label: "Invite Friends", description: "Share Safesight and earn rewards", path: "/invite" },
  { icon: FileText, label: "Terms & Privacy", description: "Read our terms and privacy policy", path: "/terms" },
];

const CustomerSettings = () => {
  const { user, signOut } = useAuth();
  const { profile } = useCustomerProfile();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/sign-in");
  };

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="gradient-primary rounded-2xl p-5 mb-6 shadow-lg">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-white/20 shadow-md">
              <AvatarImage src={profile?.avatar_url || ""} alt={displayName} />
              <AvatarFallback className="bg-white/20 text-white text-lg font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="font-bold text-white text-lg">{displayName}</h2>
              <p className="text-sm text-white/80">{user?.email}</p>
              {profile?.city && <p className="text-xs text-white/60 mt-0.5">📍 {profile.city}, Nigeria</p>}
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate("/settings/edit-profile")}
            className="mt-4 bg-white/20 text-white hover:bg-white/30 border-0 rounded-full">
            View Profile
          </Button>
        </motion.div>

        {/* Main Settings */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden mb-4 shadow-sm">
          {settingsItems.map((item, index) => (
            <motion.button key={item.label} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors ${
                index < settingsItems.length - 1 ? "border-b border-border" : ""
              }`}>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <span className="font-medium text-foreground block text-sm">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.description}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          ))}
        </div>

        {/* Secondary */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden mb-4 shadow-sm">
          {secondaryItems.map((item, index) => (
            <button key={item.label} onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors ${
                index < secondaryItems.length - 1 ? "border-b border-border" : ""
              }`}>
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <span className="font-medium text-foreground block text-sm">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.description}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        <div className="text-center text-xs text-muted-foreground mb-4">
          <p>Safesight v1.0.0 • Made in Nigeria 🇳🇬</p>
        </div>

        <Button variant="outline"
          className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 rounded-xl h-12"
          onClick={handleSignOut}>
          <LogOut className="w-5 h-5" /> Log Out
        </Button>
      </div>
      <CustomerBottomNav />
    </div>
  );
};

export default CustomerSettings;
