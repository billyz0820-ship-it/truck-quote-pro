import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
      className="flex items-center gap-2"
    >
      <Globe className="h-4 w-4" />
      {language === "zh" ? "EN" : "中文"}
    </Button>
  );
};