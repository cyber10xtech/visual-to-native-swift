import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Clock, 
  Calendar,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate, useParams } from "react-router-dom";
import CustomerBottomNav from "@/components/layout/CustomerBottomNav";
import { cn } from "@/lib/utils";
import { useProfessionals } from "@/hooks/useProfessionals";
import type { Profile } from "@/hooks/useProfile";

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const ProfessionalProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getProfessionalById } = useProfessionals();
  const [professional, setProfessional] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfessional = async () => {
      if (!id) return;
      setLoading(true);
      const { data } = await getProfessionalById(id);
      setProfessional(data as Profile | null);
      setLoading(false);
    };
    fetchProfessional();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="bg-card border-b border-border px-4 py-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Professional not found
        </div>
        <CustomerBottomNav />
      </div>
    );
  }

  const initials = professional.full_name.split(' ').map(n => n[0]).join('');
  const dailyRate = professional.daily_rate ? parseInt(professional.daily_rate) : 0;
  const contractRate = professional.contract_rate ? parseInt(professional.contract_rate) : 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Profile Header Card */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Avatar className="w-20 h-20 rounded-xl">
                <AvatarImage src={professional.avatar_url || undefined} alt={professional.full_name} />
                <AvatarFallback className="rounded-xl bg-muted text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground">{professional.full_name}</h1>
                  {professional.documents_uploaded && (
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-muted-foreground">{professional.profession || "Professional"}</p>
                <Badge variant="outline" className="text-success border-success mt-1 capitalize">
                  {professional.account_type}
                </Badge>
                
                {professional.location && (
                  <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3 text-destructive" />
                    <span>{professional.location}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 mt-1">
                  <Star className="w-4 h-4 fill-warning text-warning" />
                  <span className="font-semibold">New</span>
                </div>
              </div>
            </div>

            {/* Action Buttons - Contact info available after booking */}
            <div className="flex gap-3 mt-4">
              <Button 
                className="flex-1 gap-2"
                onClick={() => navigate(`/book/${id}`)}
              >
                <Calendar className="w-4 h-4" />
                Book Now
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        {professional.bio && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <h2 className="font-semibold text-foreground mb-3">About</h2>
              <p className="text-muted-foreground">{professional.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Skills */}
        {professional.skills && professional.skills.length > 0 && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <h2 className="font-semibold text-foreground mb-3">Skills</h2>
              <div className="flex gap-2 flex-wrap">
                {professional.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">{skill}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing */}
        {(dailyRate > 0 || contractRate > 0) && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <h2 className="font-semibold text-foreground mb-3">Pricing</h2>
              <div className="grid grid-cols-2 gap-3">
                {dailyRate > 0 && (
                  <div className="bg-primary/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-primary mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">Daily Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      $ {dailyRate}
                      <span className="text-sm font-normal text-muted-foreground">/day</span>
                    </div>
                  </div>
                )}
                {contractRate > 0 && (
                  <div className="bg-success/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-success mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">Contract Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      $ {contractRate}
                      <span className="text-sm font-normal text-muted-foreground">/contract</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Book Button */}
        <Button 
          className="w-full h-12 text-lg font-semibold"
          onClick={() => navigate(`/book/${id}`)}
        >
          Book {professional.full_name}
        </Button>
      </div>

      <CustomerBottomNav />
    </div>
  );
};

export default ProfessionalProfile;
