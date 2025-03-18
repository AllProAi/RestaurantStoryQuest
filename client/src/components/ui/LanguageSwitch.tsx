import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import type { Language } from "@/lib/translations";

interface LanguageSwitchProps {
  language: Language;
  onChange: (language: Language) => void;
}

export function LanguageSwitch({ language, onChange }: LanguageSwitchProps) {
  const { toast } = useToast();
  const [isAnimating, setIsAnimating] = useState(false);
  
  const handleToggle = () => {
    setIsAnimating(true);
    const newLanguage = language === "en" ? "patois" : "en";
    onChange(newLanguage);
    
    toast({
      title: newLanguage === "en" ? "English Selected" : "Patois Selected",
      description: newLanguage === "en" 
        ? "Content will now be displayed in English" 
        : "Content will now be displayed in Patois",
      duration: 3000,
    });
    
    setTimeout(() => setIsAnimating(false), 500);
  };

  return (
    <motion.div 
      className="flex items-center space-x-2 bg-amber-50 p-3 rounded-lg border border-amber-200"
      animate={isAnimating ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.5 }}
    >
      <Switch 
        id="language-toggle"
        checked={language === "patois"}
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-[#009B3A]"
      />
      <Label htmlFor="language-toggle" className="font-medium cursor-pointer">
        {language === "en" ? "English" : "Patois"}
      </Label>
      <span className="text-sm text-gray-500 italic ml-2">
        {language === "en" ? "Switch to Patois" : "Switch to English"}
      </span>
    </motion.div>
  );
} 