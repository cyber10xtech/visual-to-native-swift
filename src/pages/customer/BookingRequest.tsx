import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Clock, FileText, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useBookings } from "@/hooks/useBookings";
import { useProfessionals } from "@/hooks/useProfessionals";
import { createNotification } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { bookingSchema } from "@/lib/validation";
import { motion } from "framer-motion";

const BookingRequest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id: professionalId } = useParams<{ id: string }>();
  const { createBooking } = useBookings();
  const { getProfessionalById } = useProfessionals();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [professional, setProfessional] = useState<{
    user_id: string | null;
    full_name: string;
    profession: string | null;
    avatar_url: string | null;
    daily_rate: string | null;
  } | null>(null);

  useEffect(() => {
    if (professionalId) {
      getProfessionalById(professionalId).then(({ data }) => {
        if (data) setProfessional({
          user_id: data.user_id,
          full_name: data.full_name,
          profession: data.profession,
          avatar_url: data.avatar_url,
          daily_rate: data.daily_rate,
        });
      });
    }
  }, [professionalId]);

  const [formData, setFormData] = useState({
    serviceType: "",
    description: "",
    scheduledDate: "",
    scheduledTime: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!professionalId) { toast.error("Professional not found"); return; }

    const result = bookingSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(i => { fieldErrors[i.path[0] as string] = i.message; });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    const { error } = await createBooking({
      professional_id: professionalId,
      service_type: formData.serviceType.trim(),
      description: formData.description.trim() || undefined,
      scheduled_date: formData.scheduledDate,
      scheduled_time: formData.scheduledTime || undefined,
    });

    setIsLoading(false);

    if (error) {
      toast.error("Failed to create booking. Please try again.");
      return;
    }

    // Notify the professional
    if (professional?.user_id) {
      await createNotification(
        professional.user_id,
        "professional",
        "booking",
        "New Booking Request 📅",
        `${user?.user_metadata?.full_name || "A customer"} requested ${formData.serviceType} on ${formData.scheduledDate}`,
      );
    }

    toast.success("Booking request sent successfully!");
    navigate("/hub");
  };

  const initials = professional?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border px-4 py-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Book a Service</span>
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {professional && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-primary/5 rounded-2xl p-4 mb-6 flex items-center gap-3 border border-primary/10">
            <Avatar className="w-12 h-12">
              <AvatarImage src={professional.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{professional.full_name}</p>
              <p className="text-sm text-muted-foreground">{professional.profession || "Professional"}</p>
            </div>
            {professional.daily_rate && (
              <div className="text-right">
                <p className="text-primary font-bold">₦{parseInt(professional.daily_rate).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">per day</p>
              </div>
            )}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="serviceType" className="flex items-center gap-2">
              <FileText className="w-4 h-4" /> Service Type *
            </Label>
            <Input id="serviceType" placeholder="e.g., Plumbing, Electrical, Renovation"
              value={formData.serviceType} onChange={(e) => handleChange("serviceType", e.target.value)}
              required maxLength={200} className="h-12 rounded-xl" />
            {errors.serviceType && <p className="text-xs text-destructive">{errors.serviceType}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Describe the work you need done..."
              value={formData.description} onChange={(e) => handleChange("description", e.target.value)}
              maxLength={2000} className="rounded-xl min-h-[100px]" />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduledDate" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Preferred Date *
            </Label>
            <Input id="scheduledDate" type="date" value={formData.scheduledDate}
              onChange={(e) => handleChange("scheduledDate", e.target.value)}
              required min={new Date().toISOString().split("T")[0]} className="h-12 rounded-xl" />
            {errors.scheduledDate && <p className="text-xs text-destructive">{errors.scheduledDate}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduledTime" className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> Preferred Time
            </Label>
            <Input id="scheduledTime" type="time" value={formData.scheduledTime}
              onChange={(e) => handleChange("scheduledTime", e.target.value)} className="h-12 rounded-xl" />
          </div>

          <Button type="submit" className="w-full h-12 rounded-xl gradient-primary border-0 text-white hover:opacity-90" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <><CheckCircle className="w-4 h-4 mr-2" /> Send Booking Request</>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            The professional will review and confirm availability.
          </p>
        </form>
      </div>
    </div>
  );
};

export default BookingRequest;
