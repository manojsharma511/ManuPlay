import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  url?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const fullItems: BreadcrumbItem[] = [
    { label: 'Home', url: '/' },
    ...items
  ];

  return (
    <nav aria-label="Breadcrumb" className="py-2">
      <ol className="flex items-center flex-wrap gap-1.5 text-xs text-slate-400 font-medium">
        {fullItems.map((item, index) => {
          const isLast = index === fullItems.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5">
              {index === 0 ? (
                <Link
                  to="/"
                  className="inline-flex items-center gap-1 hover:text-cyan-400 transition-colors"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              ) : isLast || !item.url ? (
                <span className="text-slate-200 font-semibold truncate max-w-[200px] sm:max-w-xs" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.url}
                  className="hover:text-cyan-400 transition-colors"
                >
                  {item.label}
                </Link>
              )}

              {!isLast && <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
