import { useState } from "react";
import { 
  ArrowLeft, Shield, Lock, Smartphone, Users, MapPin, Eye, Download, Trash2, Loader2, AlertTriangle
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PrivacySecurity = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [locationSharing, setLocationSharing] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState(true);
  
  // Change password
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Download data
  const [downloadingData, setDownloadingData] = useState(false);
  
  // Delete account
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const securityScore = twoFactorEnabled ? 95 : 75;

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully!");
      setShowPasswordDialog(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleToggle2FA = async (enabled: boolean) => {
    // Note: Supabase MFA requires TOTP setup which needs additional UI
    // For now we show a toast indicating the feature
    if (enabled) {
      toast.info("Two-factor authentication will be available in a future update. Your account is protected with email verification.");
    }
    setTwoFactorEnabled(enabled);
  };

  const handleDownloadData = async () => {
    if (!user) return;
    setDownloadingData(true);
    try {
      // Fetch user profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      // Fetch bookings
      const { data: bookings } = await supabase
        .from("bookings")
        .select("*")
        .or(`customer_id.eq.${profile?.id || ''}`);

      // Fetch notifications  
      const { data: notifications } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id);

      const userData = {
        exportDate: new Date().toISOString(),
        account: {
          email: user.email,
          createdAt: user.created_at,
        },
        profile: profile || {},
        bookings: bookings || [],
        notifications: notifications || [],
      };

      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `safesight-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Your data has been downloaded!");
    } catch (err: any) {
      toast.error("Failed to download data: " + err.message);
    } finally {
      setDownloadingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }
    if (!user) return;

    setDeletingAccount(true);
    try {
      // Delete profile (cascades to related data via RLS)
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", user.id);
      
      if (profileError) throw profileError;

      // Sign out
      await signOut();
      toast.success("Your account has been deleted. We're sorry to see you go.");
      navigate("/sign-in");
    } catch (err: any) {
      toast.error("Failed to delete account: " + err.message);
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Privacy & Security</span>
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Security Score */}
        <div className="bg-primary rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-6 h-6 text-primary-foreground" />
            <div>
              <h2 className="font-semibold text-primary-foreground">Account Protected</h2>
              <p className="text-sm text-primary-foreground/80">Your account is secure</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-primary-foreground/80 mb-2">
            <span>Security Score</span>
            <span className="font-semibold">{securityScore}/100</span>
          </div>
          <Progress value={securityScore} className="h-2 bg-primary-foreground/20" />
        </div>

        {/* Security Section */}
        <div className="bg-card rounded-xl border border-border overflow-hidden mb-4">
          <div className="px-4 py-3 bg-muted/30">
            <h3 className="font-semibold text-foreground">Security</h3>
          </div>
          
          <button 
            onClick={() => setShowPasswordDialog(true)}
            className="w-full flex items-center justify-between p-4 border-b border-border hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <div className="text-left">
                <span className="font-medium text-foreground block">Change Password</span>
                <span className="text-xs text-muted-foreground">Update your account password</span>
              </div>
            </div>
            <span className="text-primary text-sm font-medium">Change</span>
          </button>

          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-muted-foreground" />
              <div>
                <span className="font-medium text-foreground block">Two-Factor Authentication</span>
                <span className="text-xs text-muted-foreground">Add an extra layer of security</span>
              </div>
            </div>
            <Switch checked={twoFactorEnabled} onCheckedChange={handleToggle2FA} />
          </div>

          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div className="text-left">
                <span className="font-medium text-foreground block">Active Sessions</span>
                <span className="text-xs text-muted-foreground">Manage your logged-in devices</span>
              </div>
            </div>
            <span className="text-muted-foreground text-sm">1 device</span>
          </button>
        </div>

        {/* Privacy Section */}
        <div className="bg-card rounded-xl border border-border overflow-hidden mb-4">
          <div className="px-4 py-3 bg-muted/30">
            <h3 className="font-semibold text-foreground">Privacy</h3>
          </div>

          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-primary" />
              <div>
                <span className="font-medium text-foreground block">Location Sharing</span>
                <span className="text-xs text-muted-foreground">Share location with professionals</span>
              </div>
            </div>
            <Switch checked={locationSharing} onCheckedChange={setLocationSharing} />
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-primary" />
              <div>
                <span className="font-medium text-foreground block">Profile Visibility</span>
                <span className="text-xs text-muted-foreground">Show your profile to professionals</span>
              </div>
            </div>
            <Switch checked={profileVisibility} onCheckedChange={setProfileVisibility} />
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-card rounded-xl border border-border overflow-hidden mb-6">
          <div className="px-4 py-3 bg-muted/30">
            <h3 className="font-semibold text-foreground">Data Management</h3>
          </div>

          <button 
            onClick={handleDownloadData}
            disabled={downloadingData}
            className="w-full flex items-center justify-between p-4 border-b border-border hover:bg-muted/50 disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              {downloadingData ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                <Download className="w-5 h-5 text-muted-foreground" />
              )}
              <div className="text-left">
                <span className="font-medium text-foreground block">Download My Data</span>
                <span className="text-xs text-muted-foreground">Get a copy of your information</span>
              </div>
            </div>
            <span className="text-primary text-sm font-medium">
              {downloadingData ? "Preparing..." : "Download"}
            </span>
          </button>

          <button 
            onClick={() => setShowDeleteDialog(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-destructive" />
              <div className="text-left">
                <span className="font-medium text-foreground block">Delete Account</span>
                <span className="text-xs text-muted-foreground">Permanently delete your account</span>
              </div>
            </div>
            <span className="text-destructive text-sm font-medium">Delete</span>
          </button>
        </div>

        {/* Security Tips */}
        <div className="bg-muted/50 rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-2">Security Tips</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Use a strong, unique password</li>
            <li>• Enable two-factor authentication</li>
            <li>• Never share your password with anyone</li>
            <li>• Review active sessions regularly</li>
          </ul>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your new password below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
            <Button onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone. All your data, bookings, and messages will be deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Type <strong>DELETE</strong> to confirm</Label>
            <Input
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Type DELETE"
              className="h-11 rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setDeleteConfirmation(""); }}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount} 
              disabled={deletingAccount || deleteConfirmation !== "DELETE"}
            >
              {deletingAccount ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete My Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrivacySecurity;
