import { useState } from "react";
import { Search, SlidersHorizontal, ChevronDown, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CustomerBottomNav from "@/components/layout/CustomerBottomNav";
import ProfessionalCard from "@/components/customer/ProfessionalCard";
import CategoryCard from "@/components/customer/CategoryCard";
import { useNavigate } from "react-router-dom";
import { useProfessionals } from "@/hooks/useProfessionals";

const categories = [
  { name: "Electrician", icon: "electrician" },
  { name: "Plumber", icon: "plumber" },
  { name: "Carpenter", icon: "carpenter" },
  { name: "Painter", icon: "painter" },
  { name: "Mason / Bricklayer", icon: "mason" },
  { name: "Tiler", icon: "tiler" },
  { name: "Welder", icon: "welder" },
  { name: "AC / HVAC Technician", icon: "hvac" },
  { name: "Generator Technician", icon: "generator" },
  { name: "Auto Mechanic", icon: "mechanic" },
  { name: "Roofer", icon: "roofer" },
  { name: "Landscaper / Gardener", icon: "landscaper" },
  { name: "Pest Control Specialist", icon: "pest" },
  { name: "Locksmith", icon: "locksmith" },
  { name: "Cleaner", icon: "cleaner" },
  { name: "Furniture Maker", icon: "furniture" },
  { name: "Aluminium Fabricator", icon: "aluminium" },
  { name: "POP / Ceiling Installer", icon: "ceiling" },
  { name: "Solar Panel Installer", icon: "solar" },
  { name: "CCTV / Security Installer", icon: "security" },
  { name: "Appliance Repair Technician", icon: "appliance" },
  { name: "Phone / Laptop Repair", icon: "phone" },
  { name: "Tailor / Fashion Designer", icon: "tailor" },
  { name: "Barber / Hairstylist", icon: "barber" },
  { name: "Makeup Artist", icon: "makeup" },
  { name: "Photographer / Videographer", icon: "photographer" },
  { name: "Event Planner / Decorator", icon: "event" },
  { name: "Caterer / Cook", icon: "caterer" },
  { name: "Driver", icon: "driver" },
  { name: "Dispatch Rider", icon: "dispatch" },
  { name: "Other", icon: "other" },
];

const CustomerHome = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "professionals" | "handymen">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("Newest First");
  const [showAllCategories, setShowAllCategories] = useState(false);
  
  const { professionals, loading, fetchProfessionals } = useProfessionals();

  const displayedCategories = showAllCategories ? categories : categories.slice(0, 6);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    fetchProfessionals({ search: value });
  };

  const handleCategoryClick = (categoryName: string) => {
    const newCategory = selectedCategory === categoryName ? null : categoryName;
    setSelectedCategory(newCategory);
    fetchProfessionals({ profession: newCategory || undefined, search: searchQuery });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <h1 className="text-xl font-bold text-foreground mb-4">Find a Professional</h1>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search for services..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 h-10 bg-muted/50 border-0 rounded-xl"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          {(["all", "professionals", "handymen"] as const).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setActiveTab(tab);
                const accountType = tab === "professionals" ? "professional" : tab === "handymen" ? "handyman" : undefined;
                fetchProfessionals({ search: searchQuery, accountType });
              }}
              className="capitalize rounded-full"
            >
              {tab === "all" ? "All" : tab}
            </Button>
          ))}
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-2 mb-4">
          <Button variant="outline" size="sm" className="gap-1">
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            {sortBy}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Urgent Help Banner */}
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-destructive mb-1">Need Urgent Help?</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Emergency services available 24/7 for urgent repairs
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/hub?tab=emergency")}
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                Get Emergency Help
              </Button>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <h2 className="font-semibold text-foreground mb-3">All Categories</h2>
          <div className="grid grid-cols-3 gap-3">
            {displayedCategories.map((category) => (
              <CategoryCard
                key={category.name}
                name={category.name}
                icon={category.icon}
                isSelected={selectedCategory === category.name}
                onClick={() => handleCategoryClick(category.name)}
              />
            ))}
          </div>
          <button
            onClick={() => setShowAllCategories(!showAllCategories)}
            className="w-full text-center text-primary text-sm font-medium mt-3 hover:underline"
          >
            {showAllCategories ? "Show Less" : `Show All Categories (${categories.length})`}
          </button>
        </div>

        {/* Top Rated Professionals */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">New Professionals</h2>
            <Badge variant="secondary" className="text-xs">
              {professionals.length}
            </Badge>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : professionals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No professionals found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {professionals.map((professional) => (
                <ProfessionalCard
                  key={professional.id}
                  id={professional.id}
                  name={professional.full_name}
                  profession={professional.profession || "Professional"}
                  location={professional.location || "Location not set"}
                  lastActive="Recently"
                  rating={4.8}
                  reviewCount={0}
                  distance=""
                  avatarUrl={professional.avatar_url || undefined}
                  dailyRate={professional.daily_rate ? parseInt(professional.daily_rate) : 0}
                  variant="compact"
                  onView={() => navigate(`/professional/${professional.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CustomerBottomNav />
    </div>
  );
};

export default CustomerHome;
