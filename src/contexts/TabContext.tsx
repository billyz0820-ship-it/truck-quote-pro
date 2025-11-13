import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  const openTab = useCallback((newTab: Omit<Tab, "id" | "closable">) => {
    const tabId = newTab.path.replace(/\//g, "-");
    
    setTabs((prevTabs) => {
      const existingTab = prevTabs.find((t) => t.path === newTab.path);
      if (existingTab) {
        setActiveTabId(existingTab.id);
        navigate(newTab.path);
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
      navigate(newTab.path);
      return [...prevTabs, tab];
    });
  }, [navigate]);

  const closeTab = useCallback((tabId: string) => {
    setTabs((prevTabs) => {
      const closingTab = prevTabs.find((t) => t.id === tabId);
      if (!closingTab?.closable) return prevTabs;

      const newTabs = prevTabs.filter((t) => t.id !== tabId);
      
      if (activeTabId === tabId) {
        const closingIndex = prevTabs.findIndex((t) => t.id === tabId);
        const newActiveTab = newTabs[closingIndex - 1] || newTabs[0];
        setActiveTabId(newActiveTab.id);
        navigate(newActiveTab.path);
      }

      return newTabs;
    });
  }, [activeTabId, navigate]);

  const switchTab = useCallback((tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab) {
      setActiveTabId(tabId);
      navigate(tab.path);
    }
  }, [tabs, navigate]);

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
