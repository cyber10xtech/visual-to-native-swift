import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Star, Heart, MessageSquare, Calendar, Loader2, CheckCircle, Share2, Image, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/useProfile";
import { useFavorites } from "@/hooks/useFavorites";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
}

const ProfessionalProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, loading } = useProfile(id);
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [proStats, setProStats] = useState<{ jobs: number; rating: number; views: number } | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;

    supabase.from("reviews")
      .select("id, rating, comment, created_at")
      .eq("pro_id", id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) {
          setReviews(data as Review[]);
          if (data.length > 0) {
            setAvgRating(data.reduce((sum: number, r: any) => sum + r.rating, 0) / data.length);
          }
        }
      });

    supabase.from("pro_stats")
      .select("jobs, rating, views")
      .eq("pro_id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProStats(data as any);
      });

    supabase.from("gallery")
      .select("id, image_url, caption, display_order")
      .eq("profile_id", id)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setGalleryImages(data as GalleryImage[]);
      });
  }, [id]);

  const toggleFavorite = async () => {
    if (!id) return;
    if (isFavorite(id)) {
      await removeFavorite(id);
      toast.success("Removed from favorites");
    } else {
      await addFavorite(id);
      toast.success("Added to favorites");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${profile?.full_name} - Safesight`,
        text: `Check out ${profile?.full_name} on Safesight`,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Profile link copied!");
    }
  };

  const navigateLightbox = useCallback((dir: number) => {
    if (lightboxIndex === null) return;
    const next = lightboxIndex + dir;
    if (next >= 0 && next < galleryImages.length) setLightboxIndex(next);
  }, [lightboxIndex, galleryImages.length]);

  // Swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > 50) navigateLightbox(diff > 0 ? -1 : 1);
    setTouchStart(null);
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
  const rating = proStats?.rating ?? (avgRating > 0 ? avgRating : 0);
  const ratingDisplay = rating > 0 ? rating.toFixed(1) : "New";

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Profile</span>
        </button>
        <div className="flex items-center gap-3">
          <button onClick={handleShare}><Share2 className="w-5 h-5 text-muted-foreground" /></button>
          <button onClick={toggleFavorite}>
            <Heart className={`w-5 h-5 transition-colors ${isFavorite(id!) ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-6">
          <Avatar className="w-28 h-28 mb-4 ring-4 ring-primary/20">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">{initials}</AvatarFallback>
          </Avatar>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            {profile.full_name}
            {profile.is_verified && <CheckCircle className="w-5 h-5 text-primary" />}
          </h1>
          <p className="text-muted-foreground">{profile.profession || profile.account_type}</p>
          {profile.location && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="w-3 h-3" /> {profile.location}
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-warning text-warning" />
              <span className="font-semibold">{ratingDisplay}</span>
              <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card border border-border rounded-2xl p-3 text-center">
            <p className="text-lg font-bold text-primary">{proStats?.jobs ?? reviews.length}</p>
            <p className="text-xs text-muted-foreground">Jobs</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-3 text-center">
            <p className="text-lg font-bold text-primary">{ratingDisplay}</p>
            <p className="text-xs text-muted-foreground">Rating</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-3 text-center">
            <p className="text-lg font-bold text-primary">{profile.is_verified ? "✓" : "—"}</p>
            <p className="text-xs text-muted-foreground">Verified</p>
          </div>
        </motion.div>

        {profile.bio && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mb-6">
            <h2 className="font-bold text-foreground mb-2">About</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
          </motion.div>
        )}

        {profile.skills && profile.skills.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-6">
            <h2 className="font-bold text-foreground mb-2">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, i) => (
                <Badge key={i} variant="secondary" className="rounded-full">{skill}</Badge>
              ))}
            </div>
          </motion.div>
        )}

        {/* Work Gallery */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Image className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-foreground">Work Gallery</h2>
          </div>
          {galleryImages.length === 0 ? (
            <p className="text-sm text-muted-foreground/60 italic">No gallery photos yet</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {galleryImages.map((img, i) => (
                <button key={img.id} onClick={() => setLightboxIndex(i)}
                  className="aspect-square rounded-xl overflow-hidden border border-border hover:ring-2 hover:ring-primary/30 transition-all">
                  <img src={img.image_url} alt={img.caption || "Gallery"} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {(profile.daily_rate || profile.contract_rate) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mb-6">
            <h2 className="font-bold text-foreground mb-2">Rates</h2>
            <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
              {profile.daily_rate && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Daily Rate</span>
                  <span className="font-bold text-primary">₦{parseInt(profile.daily_rate).toLocaleString()}</span>
                </div>
              )}
              {profile.contract_rate && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Contract Rate</span>
                  <span className="font-bold text-primary">₦{parseInt(profile.contract_rate).toLocaleString()}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {reviews.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-6">
            <h2 className="font-bold text-foreground mb-2">Reviews</h2>
            <div className="space-y-3">
              {reviews.map(review => (
                <div key={review.id} className="bg-card border border-border rounded-2xl p-3">
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < review.rating ? "fill-warning text-warning" : "text-muted"}`} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-2">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="flex gap-3 sticky bottom-4">
          <Button className="flex-1 h-12 gap-2 rounded-xl gradient-primary border-0 text-white hover:opacity-90"
            onClick={() => navigate(`/book/${id}`)}>
            <Calendar className="w-4 h-4" /> Book Now
          </Button>
          <Button variant="outline" className="h-12 gap-2 rounded-xl" onClick={() => navigate(`/chat/${id}`)}>
            <MessageSquare className="w-4 h-4" /> Message
          </Button>
        </motion.div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && galleryImages[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setLightboxIndex(null)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <button onClick={() => setLightboxIndex(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </button>

            {lightboxIndex > 0 && (
              <button onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }}
                className="absolute left-3 z-10 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {lightboxIndex < galleryImages.length - 1 && (
              <button onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }}
                className="absolute right-3 z-10 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20">
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            <div className="flex flex-col items-center max-w-[90vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
              <motion.img
                key={lightboxIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                src={galleryImages[lightboxIndex].image_url}
                alt={galleryImages[lightboxIndex].caption || "Gallery"}
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
              {galleryImages[lightboxIndex].caption && (
                <p className="text-white/80 text-sm mt-3 text-center px-4">{galleryImages[lightboxIndex].caption}</p>
              )}
              <p className="text-white/40 text-xs mt-2">{lightboxIndex + 1} / {galleryImages.length}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfessionalProfile;
