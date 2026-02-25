import { useState } from "react";
import { ArrowLeft, Gift, Copy, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const InviteFriends = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const referralCode = `SAFE${user?.id?.slice(0, 4).toUpperCase() || "2026"}`;
  const referralLink = `https://safesight.ng/ref/${referralCode}`;

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success("Referral code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    toast.success("Link copied to clipboard!");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Safesight",
          text: `Use my referral code ${referralCode} to get ₦5,000 credit on your first booking!`,
          url: referralLink,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      handleCopyLink();
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
          <span className="font-medium">Invite Friends</span>
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <div className="bg-primary rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Gift className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-primary-foreground text-lg">₦5,000 Reward</h2>
              <p className="text-sm text-primary-foreground/80">For you and your friends</p>
              <p className="text-sm text-primary-foreground/80 mt-2">
                Invite your friends to Safesight. When they complete their first booking, you both get ₦5,000 credit!
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 mb-4">
          <h3 className="font-medium text-foreground mb-1">Your Referral Code</h3>
          <p className="text-sm text-muted-foreground mb-3">Share this code with your friends</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-muted rounded-xl px-4 py-3 text-center">
              <span className="font-bold text-lg text-foreground tracking-wider">{referralCode}</span>
            </div>
            <Button variant="outline" size="icon" onClick={handleCopyCode} className="w-12 h-12">
              {copied ? <Check className="w-5 h-5 text-primary" /> : <Copy className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <h3 className="font-medium text-foreground mb-1">Share Link</h3>
          <p className="text-sm text-muted-foreground mb-3">Or share this direct link</p>
          <p className="text-sm text-muted-foreground bg-muted rounded-lg px-3 py-2 mb-3 truncate">
            {referralLink}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-2" onClick={handleCopyLink}>
              <Copy className="w-4 h-4" />
              Copy Link
            </Button>
            <Button className="flex-1 gap-2" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <h3 className="font-semibold text-foreground mb-4">How it Works</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center flex-shrink-0">1</div>
              <div>
                <h4 className="font-medium text-foreground">Share Your Code</h4>
                <p className="text-sm text-muted-foreground">Send your referral code or link to friends</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center flex-shrink-0">2</div>
              <div>
                <h4 className="font-medium text-foreground">Friend Signs Up</h4>
                <p className="text-sm text-muted-foreground">They create an account using your code</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center flex-shrink-0">3</div>
              <div>
                <h4 className="font-medium text-foreground">Get Rewarded</h4>
                <p className="text-sm text-muted-foreground">Both receive ₦5,000 credit after their first booking</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-semibold text-foreground mb-3">Your Referrals</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <span className="text-2xl font-bold text-primary">0</span>
              <p className="text-sm text-muted-foreground">Friends Invited</p>
            </div>
            <div className="bg-primary/10 rounded-xl p-4 text-center">
              <span className="text-2xl font-bold text-primary">₦0</span>
              <p className="text-sm text-muted-foreground">Earned</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteFriends;
