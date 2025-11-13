import { useTab } from "@/contexts/TabContext";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export const TabBar = () => {
  const { tabs, activeTabId, switchTab, closeTab } = useTab();

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <ScrollArea className="w-full">
        <div className="flex items-center h-10 px-2 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTabId;
            
            return (
              <div
                key={tab.id}
                className={`
                  flex items-center gap-2 px-3 h-8 rounded-t-md cursor-pointer
                  transition-all duration-200 hover-scale
                  ${isActive 
                    ? "bg-background text-foreground border-b-2 border-primary" 
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }
                `}
                onClick={() => switchTab(tab.id)}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm whitespace-nowrap">{tab.title}</span>
                {tab.closable && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-destructive/20 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
