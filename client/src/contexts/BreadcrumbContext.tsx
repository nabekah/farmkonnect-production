import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbContextType {
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  addBreadcrumb: (item: BreadcrumbItem) => void;
  clearBreadcrumbs: () => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { label: "Home", href: "/" },
  ]);

  const addBreadcrumb = useCallback((item: BreadcrumbItem) => {
    setBreadcrumbs((prev) => [...prev, item]);
  }, []);

  const clearBreadcrumbs = useCallback(() => {
    setBreadcrumbs([{ label: "Home", href: "/" }]);
  }, []);

  return (
    <BreadcrumbContext.Provider
      value={{ breadcrumbs, setBreadcrumbs, addBreadcrumb, clearBreadcrumbs }}
    >
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbs() {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error("useBreadcrumbs must be used within BreadcrumbProvider");
  }
  return context;
}
