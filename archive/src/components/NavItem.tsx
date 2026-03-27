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
      className={`flex flex-col md:flex-row items-center justify-center md:justify-start w-full px-2 py-3 md:py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
        currentView === view ? 'bg-primary text-white shadow-md' : 'text-textSecondary hover:bg-surface-light hover:text-textPrimary'
      }`}
    >
      {icon}
      <span className="mt-1 md:mt-0 md:ml-3 text-xs md:text-sm">{label}</span>
    </button>
  );
};