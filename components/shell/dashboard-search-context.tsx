"use client";

import * as React from "react";

interface DashboardSearchContextValue {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

const DashboardSearchContext =
  React.createContext<DashboardSearchContextValue | null>(null);

export function DashboardSearchProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <DashboardSearchContext.Provider
      value={{ searchQuery, setSearchQuery, searchInputRef }}
    >
      {children}
    </DashboardSearchContext.Provider>
  );
}

export function useDashboardSearch(): DashboardSearchContextValue {
  const context = React.useContext(DashboardSearchContext);
  if (!context) {
    throw new Error(
      "useDashboardSearch must be used within a DashboardSearchProvider",
    );
  }
  return context;
}
