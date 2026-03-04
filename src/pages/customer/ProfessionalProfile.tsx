import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Star, Heart, MessageSquare, Calendar, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/useProfile";
import { useFavorites } from "@/hooks/useFavorites";

const ProfessionalProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, loading } = useProfile(id);
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const toggleFavorite = async () => {
    if (!id) return;
    if (isFavorite(id)) {
      await removeFavorite(id);
    } else {
      await addFavorite(id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b border-border px-4 py-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
        </div>
        <div className="text-center py-12 text-muted-foreground">Professional not found</div>
      </div>
    );
  }

  const initials = profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Profile</span>
        </button>
        <button onClick={toggleFavorite}>
          <Heart className={`w-5 h-5 ${isFavorite(id!) ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex flex-col items-center mb-6">
          <Avatar className="w-24 h-24 mb-3">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            {profile.full_name}
            {profile.is_verified && <CheckCircle className="w-5 h-5 text-primary" />}
          </h1>
          <p className="text-muted-foreground">{profile.profession || profile.account_type}</p>
          {profile.location && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="w-3 h-3" />
              {profile.location}
            </div>
          )}
        </div>

        {profile.bio && (
          <div className="mb-6">
            <h2 className="font-semibold text-foreground mb-2">About</h2>
            <p className="text-sm text-muted-foreground">{profile.bio}</p>
          </div>
        )}

        {profile.skills && profile.skills.length > 0 && (
          <div className="mb-6">
            <h2 className="font-semibold text-foreground mb-2">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, i) => (
                <Badge key={i} variant="secondary">{skill}</Badge>
              ))}
            </div>
          </div>
        )}

        {(profile.daily_rate || profile.contract_rate) && (
          <div className="mb-6">
            <h2 className="font-semibold text-foreground mb-2">Rates</h2>
            <div className="space-y-1 text-sm text-muted-foreground">
              {profile.daily_rate && <p>Daily Rate: ₦{profile.daily_rate}</p>}
              {profile.contract_rate && <p>Contract Rate: ₦{profile.contract_rate}</p>}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button className="flex-1 gap-2" onClick={() => navigate(`/book/${id}`)}>
            <Calendar className="w-4 h-4" />
            Book Now
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => navigate(`/chat/${id}`)}>
            <MessageSquare className="w-4 h-4" />
            Message
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalProfile;
