import { cn } from "@/lib/utils";
import { 
  Zap, 
  Droplets, 
  Hammer, 
  Paintbrush, 
  Layers,
  Grid3X3, 
  Flame, 
  Wind, 
  Home, 
  TreePine, 
  Bug, 
  Sparkles, 
  Sofa, 
  Wrench,
  Compass,
  ClipboardList,
  HardHat,
  Palette,
  Cable,
  Building2,
  Cog,
  Calculator,
} from "lucide-react";

interface CategoryCardProps {
  name: string;
  icon: string;
  onClick?: () => void;
  isSelected?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  architect: Compass,
  projectmanager: ClipboardList,
  builder: HardHat,
  interiordesigner: Palette,
  electricalengineer: Cable,
  structuralengineer: Building2,
  mechanicalengineer: Cog,
  quantitysurveyor: Calculator,
  electrician: Zap,
  plumber: Droplets,
  carpenter: Hammer,
  painter: Paintbrush,
  mason: Layers,
  tiler: Grid3X3,
  welder: Flame,
  hvac: Wind,
  roofer: Home,
  landscaper: TreePine,
  pest: Bug,
  cleaner: Sparkles,
  furniture: Sofa,
  other: Wrench,
};

// Each category gets a unique gradient pair (from, to) using HSL
const gradientMap: Record<string, { from: string; to: string; glow: string }> = {
  architect:          { from: "217 91% 60%", to: "230 80% 55%",  glow: "217 91% 60%" },
  projectmanager:     { from: "199 89% 48%", to: "210 78% 55%",  glow: "199 89% 48%" },
  builder:            { from: "25 95% 53%",  to: "15 85% 50%",   glow: "25 95% 53%" },
  interiordesigner:   { from: "326 78% 60%", to: "340 70% 55%",  glow: "326 78% 60%" },
  electricalengineer: { from: "48 96% 53%",  to: "38 92% 50%",   glow: "48 96% 53%" },
  structuralengineer: { from: "220 14% 46%", to: "215 20% 40%",  glow: "220 14% 46%" },
  mechanicalengineer: { from: "174 72% 46%", to: "180 65% 42%",  glow: "174 72% 46%" },
  quantitysurveyor:   { from: "262 83% 58%", to: "271 81% 56%",  glow: "262 83% 58%" },
  electrician:        { from: "48 96% 53%",  to: "38 92% 50%",   glow: "48 96% 53%" },
  plumber:            { from: "199 89% 48%", to: "210 78% 55%",  glow: "199 89% 48%" },
  carpenter:          { from: "25 95% 53%",  to: "35 80% 48%",   glow: "25 95% 53%" },
  painter:            { from: "326 78% 60%", to: "280 70% 55%",  glow: "326 78% 60%" },
  mason:              { from: "220 14% 46%", to: "210 20% 40%",  glow: "220 14% 46%" },
  tiler:              { from: "174 72% 46%", to: "185 65% 42%",  glow: "174 72% 46%" },
  welder:             { from: "15 85% 50%",  to: "0 84% 60%",    glow: "15 85% 50%" },
  hvac:               { from: "199 89% 48%", to: "190 80% 55%",  glow: "199 89% 48%" },
  roofer:             { from: "142 71% 45%", to: "150 60% 40%",  glow: "142 71% 45%" },
  landscaper:         { from: "142 71% 45%", to: "160 60% 40%",  glow: "142 71% 45%" },
  pest:               { from: "0 84% 60%",   to: "15 75% 50%",   glow: "0 84% 60%" },
  cleaner:            { from: "262 83% 58%", to: "280 75% 55%",  glow: "262 83% 58%" },
  furniture:          { from: "25 95% 53%",  to: "30 85% 48%",   glow: "25 95% 53%" },
  other:              { from: "220 14% 46%", to: "230 20% 42%",  glow: "220 14% 46%" },
};

const CategoryCard = ({ name, icon, onClick, isSelected }: CategoryCardProps) => {
  const IconComponent = iconMap[icon.toLowerCase()] || Wrench;
  const gradient = gradientMap[icon.toLowerCase()] || gradientMap.other;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 overflow-hidden",
        "hover:scale-[1.04] hover:shadow-lg active:scale-[0.97]",
        isSelected
          ? "border-primary/40 bg-primary/5 shadow-md"
          : "border-border/60 bg-card shadow-sm hover:border-primary/30 hover:bg-primary/[0.03]"
      )}
    >
      {/* Animated glow ring behind the icon */}
      <div
        className={cn(
          "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500",
          isSelected ? "opacity-20" : "group-hover:opacity-10"
        )}
        style={{
          background: `radial-gradient(circle at 50% 30%, hsl(${gradient.glow} / 0.5), transparent 70%)`,
        }}
      />

      {/* Icon container with gradient background */}
      <div
        className={cn(
          "relative w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-all duration-300",
          "group-hover:shadow-md",
          isSelected && "shadow-md"
        )}
        style={{
          background: `linear-gradient(135deg, hsl(${gradient.from}) 0%, hsl(${gradient.to}) 100%)`,
          boxShadow: isSelected
            ? `0 4px 14px -3px hsl(${gradient.glow} / 0.4)`
            : undefined,
        }}
      >
        {/* Subtle shine overlay */}
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <div
            className={cn(
              "absolute -top-1/2 -left-1/2 w-[200%] h-[200%] transition-transform duration-700",
              "group-hover:translate-x-[10%] group-hover:translate-y-[10%]"
            )}
            style={{
              background: "linear-gradient(135deg, hsla(0, 0%, 100%, 0.25) 0%, transparent 50%)",
            }}
          />
        </div>

        {/* The icon with a gentle float animation */}
        <IconComponent
          className={cn(
            "w-5 h-5 text-white relative z-10 transition-transform duration-500 ease-out",
            "group-hover:animate-[iconBounce_0.6s_ease-in-out]",
            isSelected && "animate-[iconPulse_2s_ease-in-out_infinite]"
          )}
        />
      </div>

      {/* Label */}
      <span className={cn(
        "text-[11px] font-semibold text-center leading-tight transition-colors duration-300",
        isSelected ? "text-primary" : "text-foreground/80 group-hover:text-foreground"
      )}>
        {name}
      </span>
    </button>
  );
};

export default CategoryCard;
