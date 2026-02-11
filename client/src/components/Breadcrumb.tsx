import { ChevronRight, Home } from "lucide-react";
import { useBreadcrumbs } from "@/contexts/BreadcrumbContext";
import { Link } from "wouter";

export function Breadcrumb() {
  const { breadcrumbs } = useBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav
      className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-lg text-sm"
      aria-label="Breadcrumb"
    >
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          {item.href ? (
            <Link href={item.href} className="text-blue-600 hover:underline hover:text-blue-700 transition-colors">
              {index === 0 ? <Home className="w-4 h-4" /> : item.label}
            </Link>
          ) : item.onClick ? (
            <button
              onClick={item.onClick}
              className="text-blue-600 hover:underline hover:text-blue-700 transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-muted-foreground">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
