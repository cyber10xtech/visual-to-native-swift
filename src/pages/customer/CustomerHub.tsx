import { useState } from "react";
import { Calendar, Heart, AlertCircle, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomerBottomNav from "@/components/layout/CustomerBottomNav";
import ProfessionalCard from "@/components/customer/ProfessionalCard";
import CustomerBookingCard from "@/components/customer/CustomerBookingCard";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useProfessionals } from "@/hooks/useProfessionals";
import { useFavorites } from "@/hooks/useFavorites";
import { useBookings } from "@/hooks/useBookings";

type HubTab = "bookings" | "favorites" | "emergency";

const mapBookingStatus = (status: string): "upcoming" | "in_progress" | "completed" | "pending" => {
  switch (status.toLowerCase()) {
    case "confirmed":
      return "upcoming";
    case "in_progress":
      return "in_progress";
    case "completed":
      return "completed";
    case "cancelled":
      return "completed";
    default:
      return "pending";
  }
};

// Resolve profession display label from unified schema specialty columns
const getProfession = (professional: any): string => {
  if (!professional) return "";
  // profiles_compat_view exposes `profession`; direct profiles join exposes specialty enums
  if (professional.profession) return professional.profession;
  return professional.profession_specialty ?? professional.handyman_specialty ?? "";
};

const CustomerHub = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as HubTab) || "bookings";

  const [activeHubTab, setActiveHubTab] = useState<HubTab>(initialTab);

  const { professionals, loading: professionalsLoading } = useProfessionals();
  const { favorites, loading: favoritesLoading, removeFavorite, isFavorite } = useFavorites();
  const { bookings, loading: bookingsLoading } = useBookings();

  const handleToggleFavorite = async (professionalId: string) => {
    if (isFavorite(professionalId)) {
      await removeFavorite(professionalId);
    }
  };

  // Emergency filter — matches on enum values or display labels
  const emergencySpecialties = ["plumber", "electrician", "ac_installer"];
  const emergencyProfessionals = professionals.filter((p) => {
    const prof = (p.profession ?? "").toLowerCase().replace(/\s+/g, "_");
    return emergencySpecialties.includes(prof);
  });

  const hubTabs = [
    { id: "bookings" as const, label: "Bookings", icon: Calendar },
    { id: "favorites" as const, label: "Favorites", icon: Heart },
    { id: "emergency" as const, label: "Emergency", icon: AlertCircle },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-foreground mb-4">Hub</h1>

        {/* Hub Tabs */}
        <div className="flex gap-2 mb-4">
          {hubTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeHubTab === tab.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveHubTab(tab.id)}
              className="flex-1 gap-1"
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* ── Bookings ─────────────────────────────────────────────────────── */}
        {activeHubTab === "bookings" && (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground">My Bookings</h2>
              <span className="text-sm text-muted-foreground">{bookings.length} total</span>
            </div>

            {bookingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p>No bookings yet</p>
                <p className="text-sm mt-1">Find a professional and make your first booking!</p>
                <Button onClick={() => navigate("/home")} className="mt-4" size="sm">
                  Find Professionals
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking, index) => {
                  // Unified schema: scheduled_date (DATE) + scheduled_time (TIME)
                  const dateStr = booking.scheduled_date ?? null;
                  const timeStr = booking.scheduled_time ?? null;
                  const dateDisplay = dateStr ? new Date(dateStr).toLocaleDateString() : "TBD";
                  const timeDisplay = timeStr ?? "TBD";

                  return (
                    <CustomerBookingCard
                      key={booking.id}
                      id={booking.id}
                      number={bookings.length - index}
                      title={booking.service_type}
                      professionalName={booking.professional?.full_name || "Professional"}
                      profession={getProfession(booking.professional)}
                      date={dateDisplay}
                      time={timeDisplay}
                      location={booking.professional?.location || ""}
                      price={booking.rate_amount ?? 0} // was: booking.amount
                      status={mapBookingStatus(booking.status)}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Favorites ────────────────────────────────────────────────────── */}
        {activeHubTab === "favorites" && (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground">Favorites</h2>
              <span className="text-sm text-muted-foreground">{favorites.length} saved</span>
            </div>

            {favoritesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : favorites.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p>No favorites yet</p>
                <p className="text-sm mt-1">Heart a professional to save them here!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {favorites.map((fav) => (
                  <ProfessionalCard
                    key={fav.id}
                    id={fav.professional_id} // was: fav.pro_id
                    name={fav.professional?.full_name || "Professional"}
                    profession={getProfession(fav.professional) || "Professional"}
                    location={fav.professional?.location || "Location not set"}
                    lastActive="Recently"
                    rating={4.8}
                    reviewCount={0}
                    distance=""
                    dailyRate={fav.professional?.daily_rate ? parseInt(fav.professional.daily_rate) : 0}
                    variant="favorite"
                    isFavorite={true}
                    onBook={() => navigate(`/professional/${fav.professional_id}`)}
                    onFavoriteToggle={() => handleToggleFavorite(fav.professional_id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Emergency ────────────────────────────────────────────────────── */}
        {activeHubTab === "emergency" && (
          <>
            <div className="bg-destructive rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-5 h-5 text-destructive-foreground" />
                <h2 className="font-semibold text-destructive-foreground">Emergency Services</h2>
              </div>
              <p className="text-sm text-destructive-foreground/80">Available 24/7 for urgent repairs</p>
            </div>

            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">For immediate assistance</p>
                  <p className="text-xs text-muted-foreground">
                    These professionals offer emergency services and can respond quickly.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">Available Now</h3>
              <span className="text-sm text-muted-foreground">({emergencyProfessionals.length})</span>
            </div>

            {professionalsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : emergencyProfessionals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No emergency professionals available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {emergencyProfessionals.map((professional) => (
                  <ProfessionalCard
                    key={professional.id}
                    id={professional.id}
                    name={professional.full_name}
                    profession={getProfession(professional) || "Professional"}
                    location={professional.location || "Location not set"}
                    lastActive="Recently"
                    rating={4.8}
                    reviewCount={0}
                    distance=""
                    dailyRate={professional.daily_rate ? parseInt(professional.daily_rate) : 0}
                    variant="emergency"
                    onView={() => navigate(`/professional/${professional.id}`)}
                    onCall={() => navigate(`/book/${professional.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <CustomerBottomNav />
    </div>
  );
};

export default CustomerHub;
