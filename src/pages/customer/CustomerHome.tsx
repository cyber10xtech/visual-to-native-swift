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

const professionalCategories = [
  { name: "Architect", icon: "architect" },
  { name: "Project Manager", icon: "projectmanager" },
  { name: "Builder", icon: "builder" },
  { name: "Interior Designer", icon: "interiordesigner" },
  { name: "Electrical Engineer", icon: "electricalengineer" },
  { name: "Structural Engineer", icon: "structuralengineer" },
  { name: "Mechanical Engineer", icon: "mechanicalengineer" },
  { name: "Quantity Surveyor", icon: "quantitysurveyor" },
];

const handymanCategories = [
  { name: "Wall Painter", icon: "painter" },
  { name: "Plumber", icon: "plumber" },
  { name: "Carpenter", icon: "carpenter" },
  { name: "Electrician", icon: "electrician" },
  { name: "AC Installer", icon: "hvac" },
  { name: "Tiler", icon: "tiler" },
  { name: "Welder", icon: "welder" },
  { name: "Bricklayer", icon: "mason" },
  { name: "Roof Installer", icon: "roofer" },
  { name: "Furniture Repairs", icon: "furniture" },
  { name: "Industrial Cleaner", icon: "cleaner" },
  { name: "Landscape Expert", icon: "landscaper" },
  { name: "Fumigator", icon: "pest" },
  { name: "General Labourer", icon: "other" },
];

const CustomerHome = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "professionals" | "handymen">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("Newest First");
  const [showAllCategories, setShowAllCategories] = useState(false);
  
  const { professionals, loading, fetchProfessionals } = useProfessionals();

  const currentCategories = activeTab === "professionals" 
    ? professionalCategories 
    : activeTab === "handymen" 
    ? handymanCategories 
    : [...professionalCategories, ...handymanCategories];

  const displayedCategories = showAllCategories ? currentCategories : currentCategories.slice(0, 6);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    const accountType = activeTab === "professionals" ? "professional" : activeTab === "handymen" ? "handyman" : undefined;
    fetchProfessionals({ search: value, accountType });
  };

  const handleCategoryClick = (categoryName: string) => {
    const newCategory = selectedCategory === categoryName ? null : categoryName;
    setSelectedCategory(newCategory);
    const accountType = activeTab === "professionals" ? "professional" : activeTab === "handymen" ? "handyman" : undefined;
    fetchProfessionals({ profession: newCategory || undefined, search: searchQuery, accountType });
  };

  const handleTabChange = (tab: "all" | "professionals" | "handymen") => {
    setActiveTab(tab);
    setSelectedCategory(null);
    const accountType = tab === "professionals" ? "professional" : tab === "handymen" ? "handyman" : undefined;
    fetchProfessionals({ search: searchQuery, accountType });
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
              onClick={() => handleTabChange(tab)}
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
          <h2 className="font-semibold text-foreground mb-3">
            {activeTab === "professionals" ? "Professional Categories" : activeTab === "handymen" ? "Handyman Categories" : "All Categories"}
          </h2>
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
          {currentCategories.length > 6 && (
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="w-full text-center text-primary text-sm font-medium mt-3 hover:underline"
            >
              {showAllCategories ? "Show Less" : `Show All Categories (${currentCategories.length})`}
            </button>
          )}
        </div>

        {/* Professionals List */}
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
