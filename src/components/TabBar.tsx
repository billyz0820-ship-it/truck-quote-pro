import { useTab } from "@/contexts/TabContext";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useEffect, useState } from "react";

export const TabBar = () => {
  const { tabs, activeTabId, switchTab, closeTab } = useTab();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Check scroll position to show/hide arrows
  const checkScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 1);
  };

  // Scroll to active tab when it changes
  useEffect(() => {
    if (activeTabRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const tab = activeTabRef.current;
      const containerRect = container.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      
      if (tabRect.left < containerRect.left) {
        container.scrollBy({ left: tabRect.left - containerRect.left - 8, behavior: 'smooth' });
      } else if (tabRect.right > containerRect.right) {
        container.scrollBy({ left: tabRect.right - containerRect.right + 8, behavior: 'smooth' });
      }
    }
    checkScrollButtons();
  }, [activeTabId, tabs]);

  // Check on mount and when tabs change
  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [tabs]);

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  };

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center">
      {/* Left scroll button */}
      {showLeftArrow && (
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-8 flex-shrink-0 rounded-none border-r"
          onClick={scrollLeft}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
      
      {/* Scrollable tab container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex items-center h-10 px-2 gap-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTabId;
            
            return (
              <div
                key={tab.id}
                ref={isActive ? activeTabRef : null}
                className={`
                  flex items-center gap-2 px-3 h-8 rounded-t-md cursor-pointer
                  transition-all duration-200 hover-scale flex-shrink-0
                  ${isActive 
                    ? "bg-background text-foreground border-b-2 border-primary" 
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }
                `}
                onClick={() => switchTab(tab.id)}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm whitespace-nowrap max-w-[120px] truncate">{tab.title}</span>
                {tab.closable && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-destructive/20 hover:text-destructive flex-shrink-0"
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
      </div>

      {/* Right scroll button */}
      {showRightArrow && (
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-8 flex-shrink-0 rounded-none border-l"
          onClick={scrollRight}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
