import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, usePermissions } from '../contexts/AuthContext';
import { useProductEdit } from '../contexts/ProductEditContext';
import { Button } from './ui/button';
import { Search } from './Search';
import Logo from './Logo';
import MonthYearSelector from './MonthYearSelector';
import { LogOut, User, Settings, Target, FileText, BarChart3, GitCompare } from 'lucide-react';

const Header = () => {
  const {
    user,
    logout
  } = useAuth();
  const {
    isAdmin
  } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use ProductEditContext for filter state if available (on product edit pages)
  const productEditContext = React.useContext(React.createContext<any>(undefined));
  
  // Initialize with current month or April 2025 if current month is outside range
  const getCurrentMonthYear = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
    const currentYear = now.getFullYear();
    
    // Check if current date is within the April 2025 - March 2026 range
    if ((currentYear === 2025 && currentMonth >= 4) || 
        (currentYear === 2026 && currentMonth <= 3)) {
      // Current date is within range, use it
      return { month: currentMonth, year: currentYear };
    } else if (currentYear < 2025 || (currentYear === 2025 && currentMonth < 4)) {
      // Current date is before range, use April 2025
      return { month: 4, year: 2025 };
    } else {
      // Current date is after range, use March 2026
      return { month: 3, year: 2026 };
    }
  };
  
  const { month, year } = getCurrentMonthYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(month);
  const [selectedYear, setSelectedYear] = useState<number>(year);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const handleMonthYearChange = (newMonth: number, newYear: number) => {
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    
    // If we're on a product edit page and have access to ProductEditContext, update it
    if (productEditContext && location.pathname.includes('/product/')) {
      productEditContext.handleMetricsMonthYearChange?.(newMonth, newYear);
      productEditContext.handleGoalsMonthYearChange?.(newMonth, newYear);
      productEditContext.handlePlanMonthYearChange?.(newMonth, newYear);
    }
    
    // Trigger a custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('monthYearFilterChange', {
      detail: { month: newMonth, year: newYear }
    }));
  };

  return <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 font-['Pathway_Extreme']">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <Logo />
            </Link>
          </div>
          
          <div className="flex-1 max-w-md mx-4">
            <Search />
          </div>

          {/* Month/Year Filter - only show on dashboard */}
          {location.pathname === '/' && (
            <div className="flex items-center space-x-2">
              <MonthYearSelector
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onChange={handleMonthYearChange}
                className="compact month-year-filter tnq-font"
              />
            </div>
          )}
          
          <div className="flex items-center space-x-3">
            <Button variant={isActivePath('/') && location.pathname === '/' ? "default" : "outline"} size="sm" asChild className={`hidden sm:flex items-center gap-2 tnq-font ${isActivePath('/') && location.pathname === '/' ? 'tnq-button' : 'tnq-button-outline'}`}>
              <Link to="/">
                <BarChart3 className="h-4 w-4" />
                Product Dashboard
              </Link>
            </Button>

            <Button variant={isActivePath('/comparison') ? "default" : "outline"} size="icon" asChild className={`hidden sm:flex tnq-font ${isActivePath('/comparison') ? 'tnq-button' : 'tnq-button-outline'}`} title="Comparison">
              <Link to="/comparison">
                <GitCompare className="h-4 w-4" />
              </Link>
            </Button>
            
            <Button variant={isActivePath('/annual-okrs') ? "default" : "outline"} size="icon" asChild className={`hidden sm:flex tnq-font ${isActivePath('/annual-okrs') ? 'tnq-button' : 'tnq-button-outline'}`} title="Annual OKRs">
              <Link to="/annual-okrs">
                <Target className="h-4 w-4" />
              </Link>
            </Button>

            <Button variant={isActivePath('/user-manual') ? "default" : "outline"} size="icon" asChild className={`hidden sm:flex tnq-font ${isActivePath('/user-manual') ? 'tnq-button' : 'tnq-button-outline'}`} title="User Manual">
              <Link to="/user-manual">
                <FileText className="h-4 w-4" />
              </Link>
            </Button>
            
            {user && <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="relative group">
                    <Button variant="ghost" size="sm" className="relative tnq-font">
                      <User className="h-4 w-4" />
                    </Button>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="p-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 tnq-font">{user.name || user.email}</p>
                        <p className="text-xs text-gray-500 capitalize tnq-font">{user.role || 'User'}</p>
                      </div>
                      <div className="p-2">
                        <p className="text-xs text-gray-400 tnq-font">Role: {user.role || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {isAdmin && <Button variant="ghost" size="sm" asChild className={`tnq-font ${isActivePath('/config') ? 'border-b-2 border-blue-500' : ''}`}>
                      <Link to="/config">
                        <Settings className="h-4 w-4" />
                      </Link>
                    </Button>}
                  
                  <Button variant="ghost" size="sm" onClick={handleLogout} title="Logout" className="tnq-font">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>}
          </div>
        </div>
      </div>
    </header>;
};

export default Header;
