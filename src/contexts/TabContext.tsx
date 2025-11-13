import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LucideIcon, Home } from "lucide-react";

export interface Tab {
  id: string;
  title: string;
  path: string;
  icon: LucideIcon;
  closable: boolean;
}

interface TabContextType {
  tabs: Tab[];
  activeTabId: string;
  openTab: (tab: Omit<Tab, "id" | "closable">) => void;
  closeTab: (tabId: string) => void;
  switchTab: (tabId: string) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

const HOME_TAB: Tab = {
  id: "home",
  title: "首页",
  path: "/dashboard",
  icon: Home,
  closable: false,
};

export const TabProvider = ({ children }: { children: ReactNode }) => {
  const [tabs, setTabs] = useState<Tab[]>([HOME_TAB]);
  const [activeTabId, setActiveTabId] = useState("home");
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle navigation in useEffect to avoid calling navigate during render
  useEffect(() => {
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  }, [pendingNavigation, navigate]);

  // Sync active tab with current route
  useEffect(() => {
    const currentTab = tabs.find((t) => t.path === location.pathname);
    if (currentTab && currentTab.id !== activeTabId) {
      setActiveTabId(currentTab.id);
    }
  }, [location.pathname, tabs, activeTabId]);

  const openTab = useCallback((newTab: Omit<Tab, "id" | "closable">) => {
    const tabId = newTab.path.replace(/\//g, "-");
    
    setTabs((prevTabs) => {
      const existingTab = prevTabs.find((t) => t.path === newTab.path);
      if (existingTab) {
        setActiveTabId(existingTab.id);
        setPendingNavigation(newTab.path);
        return prevTabs;
      }

      if (prevTabs.length >= 10) {
        return prevTabs;
      }

      const tab: Tab = {
        ...newTab,
        id: tabId,
        closable: newTab.path !== "/dashboard",
      };

      setActiveTabId(tabId);
      setPendingNavigation(newTab.path);
      return [...prevTabs, tab];
    });
  }, []);

  const closeTab = useCallback((tabId: string) => {
    const closingTab = tabs.find((t) => t.id === tabId);
    if (!closingTab?.closable) return;

    const newTabs = tabs.filter((t) => t.id !== tabId);
    setTabs(newTabs);
    
    if (activeTabId === tabId) {
      const closingIndex = tabs.findIndex((t) => t.id === tabId);
      const newActiveTab = newTabs[closingIndex - 1] || newTabs[0];
      setActiveTabId(newActiveTab.id);
      setPendingNavigation(newActiveTab.path);
    }
  }, [tabs, activeTabId]);

  const switchTab = useCallback((tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab) {
      setActiveTabId(tabId);
      setPendingNavigation(tab.path);
    }
  }, [tabs]);

  return (
    <TabContext.Provider value={{ tabs, activeTabId, openTab, closeTab, switchTab }}>
      {children}
    </TabContext.Provider>
  );
};

export const useTab = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error("useTab must be used within TabProvider");
  }
  return context;
};
