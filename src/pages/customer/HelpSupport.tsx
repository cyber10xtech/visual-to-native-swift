import { useState } from "react";
import { ArrowLeft, Search, MessageCircle, Mail, Phone, HelpCircle, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const contactOptions = [
  { icon: MessageCircle, label: "Live Chat", color: "bg-primary/10 text-primary", action: "chat" },
  { icon: Mail, label: "Email", color: "bg-primary/10 text-primary", action: "email" },
  { icon: Phone, label: "Call", color: "bg-primary/10 text-primary", action: "call" },
];

const faqCategories = [
  {
    title: "Getting Started",
    questions: [
      { q: "How do I book a professional?", a: "Browse professionals on the home page, tap 'View' on any profile, then tap 'Book Now' to submit a booking request." },
      { q: "How do I create an account?", a: "Tap 'Sign Up' on the welcome screen, enter your email, password, and full name. Your account will be created instantly." },
      { q: "What payment methods are accepted?", a: "We currently support bank transfers and cash payments. More options coming soon." },
    ],
  },
  {
    title: "Bookings & Scheduling",
    questions: [
      { q: "Can I reschedule a booking?", a: "Yes, contact the professional through the in-app messaging to arrange a new time." },
      { q: "What if I need to cancel?", a: "You can cancel a pending booking from the Hub tab. Confirmed bookings may require contacting the professional." },
      { q: "How do I track my booking?", a: "Go to the Hub tab to see all your bookings and their current status." },
    ],
  },
  {
    title: "Payments & Pricing",
    questions: [
      { q: "What is the difference between daily and contract rates?", a: "Daily rate is per day of work. Contract rate is for the entire project scope." },
      { q: "When am I charged?", a: "Payment is arranged directly with the professional. Safesight does not process payments." },
      { q: "Are there any hidden fees?", a: "No hidden fees. The rates shown are what professionals charge for their services." },
    ],
  },
  {
    title: "Safety & Trust",
    questions: [
      { q: "Are professionals verified?", a: "Verified professionals have a blue checkmark on their profile, meaning they've submitted their credentials." },
      { q: "What if I'm not satisfied?", a: "Contact us via live chat or email at enquiries@safesight.ng and we'll help resolve the issue." },
      { q: "How do I report a problem?", a: "Use the live chat or email enquiries@safesight.ng to report any issues." },
    ],
  },
];

const HelpSupport = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>("Getting Started");
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const handleContactAction = (action: string) => {
    if (action === "chat") {
      navigate("/live-chat");
    } else if (action === "email") {
      window.open("mailto:enquiries@safesight.ng", "_blank");
    } else if (action === "call") {
      window.open("tel:+2348000000000", "_blank");
    }
  };

  const filteredCategories = searchQuery
    ? faqCategories.map(cat => ({
        ...cat,
        questions: cat.questions.filter(q =>
          q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.a.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(cat => cat.questions.length > 0)
    : faqCategories;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Help & Support</span>
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-muted/50 border border-border rounded-xl"
          />
        </div>

        <h2 className="font-semibold text-foreground mb-3">Contact Us</h2>
        <div className="grid grid-cols-3 gap-3 mb-2">
          {contactOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.label}
                onClick={() => handleContactAction(option.action)}
                className="bg-card rounded-xl p-4 border border-border hover:bg-muted/50 transition-colors flex flex-col items-center gap-2"
              >
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", option.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-foreground">{option.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground text-center mb-6">
          Email: enquiries@safesight.ng
        </p>

        <h2 className="font-semibold text-foreground mb-3">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {filteredCategories.map((category) => (
            <div key={category.title} className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setExpandedCategory(
                  expandedCategory === category.title ? null : category.title
                )}
                className="w-full px-4 py-3 bg-muted/30 flex items-center justify-between"
              >
                <span className="font-medium text-foreground">{category.title}</span>
                <ChevronRight className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform",
                  expandedCategory === category.title && "rotate-90"
                )} />
              </button>
              
              {expandedCategory === category.title && (
                <div className="divide-y divide-border">
                  {category.questions.map((item, index) => (
                    <div key={index}>
                      <button
                        onClick={() => setExpandedQuestion(expandedQuestion === item.q ? null : item.q)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                      >
                        <HelpCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-foreground flex-1">{item.q}</span>
                        <ChevronRight className={cn(
                          "w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform",
                          expandedQuestion === item.q && "rotate-90"
                        )} />
                      </button>
                      {expandedQuestion === item.q && (
                        <div className="px-4 pb-3 pl-11">
                          <p className="text-sm text-muted-foreground">{item.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
