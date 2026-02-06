import { cn } from "@/lib/utils";
import { 
  Zap, 
  Droplets, 
  Hammer, 
  Paintbrush, 
  Box,
  Grid3X3, 
  Flame, 
  Wind, 
  Cog, 
  Car, 
  Home, 
  TreePine, 
  Bug, 
  KeyRound, 
  Sparkles, 
  Sofa, 
  PanelTop, 
  CircleDot, 
  Sun, 
  Shield, 
  Wrench, 
  Smartphone, 
  Scissors, 
  ScissorsLineDashed, 
  Palette, 
  Camera, 
  PartyPopper, 
  UtensilsCrossed, 
  CarFront, 
  Bike, 
  MoreHorizontal
} from "lucide-react";

interface CategoryCardProps {
  name: string;
  icon: string;
  onClick?: () => void;
  isSelected?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  electrician: Zap,
  plumber: Droplets,
  carpenter: Hammer,
  painter: Paintbrush,
  mason: Box,
  tiler: Grid3X3,
  welder: Flame,
  hvac: Wind,
  generator: Cog,
  mechanic: Car,
  roofer: Home,
  landscaper: TreePine,
  pest: Bug,
  locksmith: KeyRound,
  cleaner: Sparkles,
  furniture: Sofa,
  aluminium: PanelTop,
  ceiling: CircleDot,
  solar: Sun,
  security: Shield,
  appliance: Wrench,
  phone: Smartphone,
  tailor: Scissors,
  barber: ScissorsLineDashed,
  makeup: Palette,
  photographer: Camera,
  event: PartyPopper,
  caterer: UtensilsCrossed,
  driver: CarFront,
  dispatch: Bike,
  other: MoreHorizontal,
};

const CategoryCard = ({ name, icon, onClick, isSelected }: CategoryCardProps) => {
  const IconComponent = iconMap[icon.toLowerCase()] || MoreHorizontal;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-card transition-all",
        "hover:border-primary hover:bg-primary/5",
        isSelected && "border-primary bg-primary/10"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center mb-2",
        isSelected ? "bg-primary/20" : "bg-muted"
      )}>
        <IconComponent className={cn(
          "w-5 h-5",
          isSelected ? "text-primary" : "text-muted-foreground"
        )} />
      </div>
      <span className="text-xs font-medium text-center text-foreground">{name}</span>
    </button>
  );
};

export default CategoryCard;
