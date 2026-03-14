import { useState, useRef } from "react";
import { Search, SlidersHorizontal, ChevronDown, AlertCircle, Loader2, Check, ChevronRight, Star, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CustomerBottomNav from "@/components/layout/CustomerBottomNav";
import CategoryCard from "@/components/customer/CategoryCard";
import { useNavigate } from "react-router-dom";
import { useProfessionals } from "@/hooks/useProfessionals";
import { motion } from "framer-motion";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { NIGERIAN_STATES } from "@/lib/validation";

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

const sortOptions = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "Name A-Z", value: "name_asc" },
  { label: "Name Z-A", value: "name_desc" },
  { label: "Rate: Low to High", value: "rate_asc" },
  { label: "Rate: High to Low", value: "rate_desc" },
];

// Horizontal scroll card component
const ProScrollCard = ({ professional, onClick }: { professional: any; onClick: () => void }) => {
  const initials = professional.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase();
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      className="flex-shrink-0 w-44 bg-card rounded-2xl border border-border p-4 shadow-sm hover:shadow-lg transition-shadow text-left"
    >
      <div className="flex flex-col items-center">
        <Avatar className="w-16 h-16 mb-3 ring-2 ring-primary/20">
          <AvatarImage src={professional.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">{initials}</AvatarFallback>
        </Avatar>
        <h3 className="font-semibold text-foreground text-sm text-center truncate w-full">{professional.full_name}</h3>
        <p className="text-xs text-muted-foreground text-center truncate w-full">{professional.profession || "Professional"}</p>
        {professional.location && (
          <p className="text-[10px] text-muted-foreground/70 text-center truncate w-full mt-0.5">📍 {professional.location}</p>
        )}
        <div className="flex items-center gap-1 mt-2">
          <Star className="w-3 h-3 fill-warning text-warning" />
          <span className="text-xs font-medium">4.8</span>
        </div>
        {professional.daily_rate && (
          <p className="text-primary font-bold text-sm mt-1">₦{parseInt(professional.daily_rate).toLocaleString()}/day</p>
        )}
      </div>
    </motion.button>
  );
};

const CustomerHome = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "professionals" | "handymen">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("newest");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [locationFilter, setLocationFilter] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

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
    fetchProfessionals({ search: value, accountType, profession: selectedCategory || undefined, location: locationFilter || undefined });
  };

  const handleCategoryClick = (categoryName: string) => {
    const newCategory = selectedCategory === categoryName ? null : categoryName;
    setSelectedCategory(newCategory);
    const accountType = activeTab === "professionals" ? "professional" : activeTab === "handymen" ? "handyman" : undefined;
    fetchProfessionals({ profession: newCategory || undefined, search: searchQuery, accountType, location: locationFilter || undefined });
  };

  const handleTabChange = (tab: "all" | "professionals" | "handymen") => {
    setActiveTab(tab);
    setSelectedCategory(null);
    const accountType = tab === "professionals" ? "professional" : tab === "handymen" ? "handyman" : undefined;
    fetchProfessionals({ search: searchQuery, accountType, location: locationFilter || undefined });
  };

  const applyFilters = () => {
    const accountType = activeTab === "professionals" ? "professional" : activeTab === "handymen" ? "handyman" : undefined;
    fetchProfessionals({ search: searchQuery, accountType, profession: selectedCategory || undefined, location: locationFilter || undefined });
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setLocationFilter("");
    setVerifiedOnly(false);
    setSelectedCategory(null);
    const accountType = activeTab === "professionals" ? "professional" : activeTab === "handymen" ? "handyman" : undefined;
    fetchProfessionals({ search: searchQuery, accountType });
    setFiltersOpen(false);
  };

  // Sort professionals client-side
  const sortedProfessionals = [...professionals].sort((a, b) => {
    switch (sortBy) {
      case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "name_asc": return a.full_name.localeCompare(b.full_name);
      case "name_desc": return b.full_name.localeCompare(a.full_name);
      case "rate_asc": return (parseInt(a.daily_rate || "0") || 0) - (parseInt(b.daily_rate || "0") || 0);
      case "rate_desc": return (parseInt(b.daily_rate || "0") || 0) - (parseInt(a.daily_rate || "0") || 0);
      default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const filteredProfessionals = verifiedOnly ? sortedProfessionals.filter(p => p.is_verified) : sortedProfessionals;

  // Sections for horizontal scrolling
  const newProfessionals = [...professionals].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);
  const topRated = [...professionals].filter(p => p.is_verified).slice(0, 10);

  const currentSortLabel = sortOptions.find(s => s.value === sortBy)?.label || "Newest First";
  const hasActiveFilters = !!locationFilter || verifiedOnly;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <h1 className="text-2xl font-bold text-foreground">Find a Professional</h1>
          <p className="text-sm text-muted-foreground">Trusted experts across Nigeria 🇳🇬</p>
        </motion.div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search plumber, electrician, architect..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 h-12 bg-muted/50 border-0 rounded-2xl text-sm"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
          {(["all", "professionals", "handymen"] as const).map((tab) => (
            <Button key={tab} variant={activeTab === tab ? "default" : "outline"} size="sm"
              onClick={() => handleTabChange(tab)}
              className={`capitalize rounded-full ${activeTab === tab ? "gradient-primary border-0 text-white" : ""}`}>
              {tab === "all" ? "All" : tab}
            </Button>
          ))}
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-2 mb-5">
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 rounded-full relative">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {hasActiveFilters && <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl">
              <SheetHeader><SheetTitle>Filter Results</SheetTitle></SheetHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Location</label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Select a state..." />
                    </SelectTrigger>
                    <SelectContent>
                      {NIGERIAN_STATES.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-foreground">Verified Only</span>
                    <p className="text-xs text-muted-foreground">Show only verified professionals</p>
                  </div>
                  <Button variant={verifiedOnly ? "default" : "outline"} size="sm"
                    onClick={() => setVerifiedOnly(!verifiedOnly)} className="rounded-full">
                    {verifiedOnly && <Check className="w-3 h-3 mr-1" />}
                    {verifiedOnly ? "On" : "Off"}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={clearFilters}>Clear All</Button>
                  <Button className="flex-1 rounded-xl gradient-primary border-0 text-white" onClick={applyFilters}>Apply Filters</Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 rounded-full">
                {currentSortLabel}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {sortOptions.map((option) => (
                <DropdownMenuItem key={option.value} onClick={() => setSortBy(option.value)}
                  className={sortBy === option.value ? "bg-primary/10 text-primary" : ""}>
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* New Professionals - Horizontal Scroll */}
        {!searchQuery && !selectedCategory && newProfessionals.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-foreground">New Professionals</h2>
              </div>
              <button onClick={() => { setSortBy("newest"); }} className="text-xs text-primary font-medium flex items-center gap-0.5">
                See all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
              {newProfessionals.map((pro, i) => (
                <motion.div key={pro.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <ProScrollCard professional={pro} onClick={() => navigate(`/professional/${pro.id}`)} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Top Rated - Horizontal Scroll */}
        {!searchQuery && !selectedCategory && topRated.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-warning text-warning" />
                <h2 className="font-bold text-foreground">Top Rated</h2>
              </div>
              <button onClick={() => { setVerifiedOnly(true); }} className="text-xs text-primary font-medium flex items-center gap-0.5">
                See all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
              {topRated.map((pro, i) => (
                <motion.div key={pro.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <ProScrollCard professional={pro} onClick={() => navigate(`/professional/${pro.id}`)} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Urgent Help Banner */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-destructive mb-1">Need Urgent Help?</h3>
              <p className="text-sm text-muted-foreground mb-2">Emergency services available 24/7</p>
              <Button variant="outline" size="sm" onClick={() => navigate("/hub?tab=emergency")}
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-full">
                Get Emergency Help
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Categories */}
        <div className="mb-6">
          <h2 className="font-bold text-foreground mb-3">
            {activeTab === "professionals" ? "Professional Categories" : activeTab === "handymen" ? "Handyman Categories" : "All Categories"}
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {displayedCategories.map((category, i) => (
              <motion.div key={category.name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
                <CategoryCard name={category.name} icon={category.icon}
                  isSelected={selectedCategory === category.name} onClick={() => handleCategoryClick(category.name)} />
              </motion.div>
            ))}
          </div>
          {currentCategories.length > 6 && (
            <button onClick={() => setShowAllCategories(!showAllCategories)}
              className="w-full text-center text-primary text-sm font-medium mt-3 hover:underline">
              {showAllCategories ? "Show Less" : `Show All (${currentCategories.length})`}
            </button>
          )}
        </div>

        {/* Professionals List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-foreground">
              {selectedCategory || (sortBy === "newest" ? "Browse All" : "Professionals")}
            </h2>
            <Badge variant="secondary" className="text-xs rounded-full">{filteredProfessionals.length}</Badge>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredProfessionals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No professionals found</p>
              {hasActiveFilters && <Button variant="link" size="sm" onClick={clearFilters} className="mt-2">Clear filters</Button>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProfessionals.map((pro, i) => (
                <motion.button key={pro.id} onClick={() => navigate(`/professional/${pro.id}`)}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                  className="bg-card rounded-2xl border border-border p-4 text-left shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col items-center">
                    <Avatar className="w-14 h-14 mb-2 ring-2 ring-primary/10">
                      <AvatarImage src={pro.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {pro.full_name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-foreground text-xs text-center truncate w-full">{pro.full_name}</h3>
                    <p className="text-[10px] text-muted-foreground text-center truncate w-full">{pro.profession || "Professional"}</p>
                    {pro.location && (
                      <p className="text-[9px] text-muted-foreground/60 truncate w-full text-center">📍 {pro.location}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1.5">
                      <Star className="w-3 h-3 fill-warning text-warning" />
                      <span className="text-[10px] font-medium">4.8</span>
                      {pro.is_verified && (
                        <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5 rounded-full ml-1">✓ Verified</Badge>
                      )}
                    </div>
                    {pro.daily_rate && (
                      <p className="text-primary font-bold text-xs mt-1">₦{parseInt(pro.daily_rate).toLocaleString()}/day</p>
                    )}
                  </div>
                </motion.button>
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
