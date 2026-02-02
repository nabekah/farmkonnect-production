import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useLocation } from 'wouter';
import { navigationStructure } from './NavigationStructure';

export interface Breadcrumb {
  label: string;
  path: string;
}

interface BreadcrumbsProps {
  breadcrumbs?: Breadcrumb[];
}

export function Breadcrumbs({ breadcrumbs }: BreadcrumbsProps) {
  const [location, setLocation] = useLocation();

  // Generate breadcrumbs from current path if not provided
  const generateBreadcrumbs = (): Breadcrumb[] => {
    if (breadcrumbs) {
      return breadcrumbs;
    }

    const crumbs: Breadcrumb[] = [{ label: 'Home', path: '/' }];

    // Find the current page in navigation structure
    for (const group of navigationStructure) {
      for (const item of group.items) {
        if (item.path === location) {
          crumbs.push({
            label: group.title,
            path: '#',
          });
          crumbs.push({
            label: item.label,
            path: item.path,
          });
          return crumbs;
        }
      }
    }

    return crumbs;
  };

  const items = generateBreadcrumbs();

  if (items.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground bg-background/50 border-b border-border">
      {items.map((item, index) => (
        <React.Fragment key={item.path}>
          {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
          {index === 0 ? (
            <button
              onClick={() => setLocation('/')}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          ) : index === items.length - 1 ? (
            <span className="font-medium text-foreground">{item.label}</span>
          ) : (
            <button
              onClick={() => setLocation(item.path)}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
