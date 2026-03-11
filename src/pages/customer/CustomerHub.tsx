import { useState } from "react";
import { Calendar, Heart, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomerBottomNav from "@/components/layout/CustomerBottomNav";
import ProfessionalCard from "@/components/customer/ProfessionalCard";
import CustomerBookingCard from "@/components/customer/CustomerBookingCard";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useProfessionals } from "@/hooks/useProfessionals";
import { useFavorites } from "@/hooks/useFavorites";
import { useBookings } from "@/hooks/useBookings";
import { motion } from "framer-motion";

type HubTab = "bookings" | "favorites" | "emergency";

const mapBookingStatus = (status: string): "upcoming" | "in_progress" | "completed" | "pending" => {
  switch (status.toLowerCase()) {
    case "confirmed": return "upcoming";
    case "in_progress": return "in_progress";
    case "completed": case "cancelled": return "completed";
    default: return "pending";
  }
};

const CustomerHub = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as HubTab) || "bookings";
  const [activeHubTab, setActiveHubTab] = useState<HubTab>(initialTab);

  const { professionals, loading: professionalsLoading } = useProfessionals();
  const { favorites, loading: favoritesLoading, removeFavorite } = useFavorites();
  const { bookings, loading: bookingsLoading } = useBookings();

  const emergencySpecialties = ["plumber", "electrician", "ac installer"];
  const emergencyProfessionals = professionals.filter((p) =>
    emergencySpecialties.includes((p.profession ?? "").toLowerCase())
  );

  const hubTabs = [
    { id: "bookings" as const, label: "Bookings", icon: Calendar, count: bookings.length },
    { id: "favorites" as const, label: "Favourites", icon: Heart, count: favorites.length },
    { id: "emergency" as const, label: "Emergency", icon: AlertCircle, count: 0 },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Hub</h1>
        <p className="text-sm text-muted-foreground mb-4">Manage your bookings and favourites</p>

        <div className="flex gap-2 mb-5">
          {hubTabs.map((tab) => (
            <Button key={tab.id} variant={activeHubTab === tab.id ? "default" : "outline"} size="sm"
              onClick={() => setActiveHubTab(tab.id)}
              className={`flex-1 gap-1 rounded-full ${activeHubTab === tab.id ? "gradient-primary border-0 text-white" : ""}`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count > 0 && <span className="text-xs opacity-70">({tab.count})</span>}
            </Button>
          ))}
        </div>

        {/* Bookings */}
        {activeHubTab === "bookings" && (
          <>
            {bookingsLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="font-medium">No bookings yet</p>
                <p className="text-sm mt-1">Find a professional and make your first booking!</p>
                <Button onClick={() => navigate("/home")} className="mt-4 rounded-full gradient-primary border-0 text-white" size="sm">
                  Find Professionals
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking, index) => {
                  const dateDisplay = booking.scheduled_date
                    ? new Date(booking.scheduled_date).toLocaleDateString("en-NG")
                    : "TBD";
                  const timeDisplay = booking.scheduled_time || "TBD";
                  return (
                    <motion.div key={booking.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}>
                      <CustomerBookingCard id={booking.id} number={bookings.length - index}
                        title={booking.service_type}
                        professionalName={booking.professional?.full_name || "Professional"}
                        profession={booking.professional?.profession || ""}
                        date={dateDisplay} time={timeDisplay}
                        location={booking.professional?.location || ""}
                        price={booking.rate_amount ?? 0}
                        status={mapBookingStatus(booking.status)} />
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Favorites */}
        {activeHubTab === "favorites" && (
          <>
            {favoritesLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : favorites.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Heart className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="font-medium">No favourites yet</p>
                <p className="text-sm mt-1">Heart a professional to save them here!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {favorites.map((fav) => (
                  <ProfessionalCard key={fav.id} id={fav.professional_id}
                    name={fav.professional?.full_name || "Professional"}
                    profession={fav.professional?.profession || "Professional"}
                    location={fav.professional?.location || "Nigeria"}
                    lastActive="Recently" rating={4.8} reviewCount={0} distance=""
                    dailyRate={fav.professional?.daily_rate ? parseInt(fav.professional.daily_rate) : 0}
                    variant="favorite" isFavorite={true}
                    onBook={() => navigate(`/professional/${fav.professional_id}`)}
                    onFavoriteToggle={() => removeFavorite(fav.professional_id)} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Emergency */}
        {activeHubTab === "emergency" && (
          <>
            <div className="bg-destructive rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-5 h-5 text-destructive-foreground" />
                <h2 className="font-bold text-destructive-foreground">Emergency Services</h2>
              </div>
              <p className="text-sm text-destructive-foreground/80">Available 24/7 for urgent repairs in Nigeria</p>
            </div>

            {professionalsLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : emergencyProfessionals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground"><p>No emergency professionals available</p></div>
            ) : (
              <div className="space-y-3">
                {emergencyProfessionals.map((professional) => (
                  <ProfessionalCard key={professional.id} id={professional.id}
                    name={professional.full_name}
                    profession={professional.profession || "Professional"}
                    location={professional.location || "Nigeria"}
                    lastActive="Available" rating={4.8} reviewCount={0} distance=""
                    dailyRate={professional.daily_rate ? parseInt(professional.daily_rate) : 0}
                    variant="emergency"
                    onView={() => navigate(`/professional/${professional.id}`)}
                    onCall={() => navigate(`/book/${professional.id}`)} />
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
