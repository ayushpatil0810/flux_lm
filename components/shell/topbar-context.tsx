"use client";

import * as React from "react";

export interface TopbarConfig {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

interface TopbarContextType {
  config: TopbarConfig;
  setTopbar: (config: TopbarConfig) => void;
}

const TopbarContext = React.createContext<TopbarContextType | null>(null);

export function TopbarProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = React.useState<TopbarConfig>({});

  const setTopbar = React.useCallback((next: TopbarConfig) => {
    setConfig((prev) => {
      // Prevent infinite re-render loops by returning prev if content is unchanged
      if (
        prev.title === next.title &&
        prev.description === next.description &&
        (prev.actions === next.actions ||
          (React.isValidElement(prev.actions) &&
            React.isValidElement(next.actions) &&
            prev.actions.type === next.actions.type &&
            prev.actions.key === next.actions.key))
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  return (
    <TopbarContext.Provider value={{ config, setTopbar }}>
      {children}
    </TopbarContext.Provider>
  );
}

export function useTopbar(config?: TopbarConfig) {
  const context = React.useContext(TopbarContext);
  if (!context) {
    throw new Error("useTopbar must be used within a TopbarProvider");
  }

  const { setTopbar } = context;
  const title = config?.title;
  const description = config?.description;
  const actions = config?.actions;

  React.useEffect(() => {
    if (title !== undefined || description !== undefined || actions !== undefined) {
      setTopbar({ title, description, actions });
    }
  }, [title, description, actions, setTopbar]);

  return context;
}
