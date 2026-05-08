import React from 'react';

interface NavItemProps {
  view?: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  currentView: string;
  // Accept the React state setter or a simple function
  setCurrentView: React.Dispatch<React.SetStateAction<any>> | ((view: string) => void);
  setQuoteToEdit: (quote: any | null) => void; // Assuming Quote type, adjust if needed
}

export const NavItem: React.FC<NavItemProps> = ({
  view,
  label,
  icon,
  onClick,
  currentView,
  setCurrentView,
  setQuoteToEdit,
}) => {
  return (
    <button
      onClick={() => {
        if (onClick) {
          onClick();
        } else if (view) {
          if (view === 'calculator') setQuoteToEdit(null);
          setCurrentView(view);
        }
      }}
      className={`group relative flex flex-col md:flex-row items-center justify-center md:justify-start w-full px-2 py-3 md:py-2 text-sm font-medium rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 overflow-hidden ${
        currentView === view 
          ? 'bg-gradient-to-r from-ice-400 to-ice-600 text-white shadow-lg shadow-ice-500/30 scale-105' 
          : 'text-ice-100 dark:text-slate-300 hover:bg-sidebar-600 dark:hover:bg-slate-700 hover:text-white dark:hover:text-slate-100 hover:shadow-lg'
      }`}
    >
      {/* Glow effect for active state */}
      {currentView === view && (
        <div className="absolute inset-0 bg-gradient-to-r from-ice-500/20 to-ice-600/20 animate-pulse"></div>
      )}
      
      {/* Icon with animation */}
      <div className={`transition-all duration-300 ease-in-out ${
        currentView === view 
          ? 'text-white transform scale-110' 
          : 'group-hover:scale-110 group-hover:text-ice-200 dark:group-hover:text-blue-400'
      }`}>
        {icon}
      </div>
      
      {/* Label with animation */}
      <span className={`mt-1 md:mt-0 md:ml-3 text-xs md:text-sm transition-all duration-300 ease-in-out ${
        currentView === view 
          ? 'text-white font-semibold' 
          : 'group-hover:text-ice-100 dark:group-hover:text-blue-400 group-hover:font-medium'
      }`}>
        {label}
      </span>
      
      {/* Active indicator */}
      {currentView === view && (
        <div className="absolute right-2 w-2 h-2 bg-white rounded-full animate-ping opacity-75"></div>
      )}
    </button>
  );
};