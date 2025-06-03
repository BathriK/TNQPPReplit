
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Portfolio, Product, GoalItem, ReleasePlanItem, Metric, ReleaseNote } from "../lib/types";

interface ProductEditContextType {
  product: Product | null;
  portfolio: Portfolio | null;
  loading: boolean;
  setProduct: React.Dispatch<React.SetStateAction<Product | null>>;
  setPortfolio: React.Dispatch<React.SetStateAction<Portfolio | null>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Metrics state
  metrics: Metric[];
  setMetrics: React.Dispatch<React.SetStateAction<Metric[]>>;
  metricsMonth: number;
  metricsYear: number;
  setMetricsMonth: React.Dispatch<React.SetStateAction<number>>;
  setMetricsYear: React.Dispatch<React.SetStateAction<number>>;
  
  // Goals state
  goalItems: GoalItem[];
  setGoalItems: React.Dispatch<React.SetStateAction<GoalItem[]>>;
  goalMonth: number;
  goalYear: number;
  setGoalMonth: React.Dispatch<React.SetStateAction<number>>;
  setGoalYear: React.Dispatch<React.SetStateAction<number>>;
  
  // Plan state
  planItems: ReleasePlanItem[];
  setPlanItems: React.Dispatch<React.SetStateAction<ReleasePlanItem[]>>;
  planMonth: number;
  planYear: number;
  setPlanMonth: React.Dispatch<React.SetStateAction<number>>;
  setPlanYear: React.Dispatch<React.SetStateAction<number>>;
  
  // Notes state
  noteLink: string;
  setNoteLink: React.Dispatch<React.SetStateAction<string>>;
  noteMonth: number;
  noteYear: number;
  setNoteMonth: React.Dispatch<React.SetStateAction<number>>;
  setNoteYear: React.Dispatch<React.SetStateAction<number>>;
  noteFile: File | null;
  setNoteFile: React.Dispatch<React.SetStateAction<File | null>>;
  
  // Roadmap state
  selectedYear: number;
  setSelectedYear: React.Dispatch<React.SetStateAction<number>>;
  
  // Functions
  handleMetricsMonthYearChange: (month: number, year: number) => void;
  handleGoalsMonthYearChange: (month: number, year: number) => void;
  handlePlanMonthYearChange: (month: number, year: number) => void;
}

const ProductEditContext = createContext<ProductEditContextType | undefined>(undefined);

export function ProductEditProvider({ children }: { children: ReactNode }) {
  // Default to April 2025 where we know data exists
  const defaultMonth = 4;
  const defaultYear = 2025;
  
  // Main state
  const [product, setProduct] = useState<Product | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Metrics state - default to April 2025
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [metricsMonth, setMetricsMonth] = useState(defaultMonth);
  const [metricsYear, setMetricsYear] = useState(defaultYear);
  
  // Goals state - default to April 2025
  const [goalItems, setGoalItems] = useState<GoalItem[]>([]);
  const [goalMonth, setGoalMonth] = useState(defaultMonth);
  const [goalYear, setGoalYear] = useState(defaultYear);
  
  // Plan state - default to April 2025
  const [planItems, setPlanItems] = useState<ReleasePlanItem[]>([]);
  const [planMonth, setPlanMonth] = useState(defaultMonth);
  const [planYear, setPlanYear] = useState(defaultYear);
  
  // Notes state - default to April 2025
  const [noteLink, setNoteLink] = useState("");
  const [noteMonth, setNoteMonth] = useState(defaultMonth);
  const [noteYear, setNoteYear] = useState(defaultYear);
  const [noteFile, setNoteFile] = useState<File | null>(null);
  
  // Roadmap state - default to 2025
  const [selectedYear, setSelectedYear] = useState(defaultYear);

  console.log('ProductEditContext: Initialized with defaults', { defaultMonth, defaultYear });

  // Helper function to reload product data from localStorage
  const reloadProductFromStorage = () => {
    if (!product?.id) return null;
    
    try {
      const portfolios = JSON.parse(localStorage.getItem('portfolios') || '[]');
      console.log('ProductEditContext: Reloading product data from localStorage for product:', product.id);
      
      for (const portfolioData of portfolios) {
        const foundProduct = portfolioData.products?.find((p: any) => p.id === product.id);
        if (foundProduct) {
          console.log('ProductEditContext: Found updated product with data:', {
            name: foundProduct.name,
            metrics: foundProduct.metrics?.length || 0,
            goals: foundProduct.releaseGoals?.length || 0,
            plans: foundProduct.releasePlans?.length || 0,
            notes: foundProduct.releaseNotes?.length || 0
          });
          return foundProduct;
        }
      }
    } catch (error) {
      console.error('ProductEditContext: Error reloading product from storage:', error);
    }
    return null;
  };
  
  // Handle month/year change for metrics
  const handleMetricsMonthYearChange = (month: number, year: number) => {
    console.log('ProductEditContext: Changing metrics month/year to:', month, year);
    setMetricsMonth(month);
    setMetricsYear(year);
    
    // Load fresh metrics from localStorage for selected month/year
    const freshProduct = reloadProductFromStorage();
    if (freshProduct) {
      const filteredMetrics = freshProduct.metrics?.filter(
        (m: any) => (m.month === month && m.year === year)
      ) || [];
      console.log('ProductEditContext: Found fresh metrics for selected period:', filteredMetrics.length);
      setMetrics(filteredMetrics);
    } else {
      console.log('ProductEditContext: No fresh product found, clearing metrics');
      setMetrics([]);
    }
  };

  // Handle month/year change for goals
  const handleGoalsMonthYearChange = (month: number, year: number) => {
    console.log('ProductEditContext: Changing goals month/year to:', month, year);
    setGoalMonth(month);
    setGoalYear(year);
    
    // Load fresh goals from localStorage for selected month/year
    const freshProduct = reloadProductFromStorage();
    if (freshProduct) {
      const currentGoals = freshProduct.releaseGoals
        ?.filter((g: any) => g.month === month && g.year === year)
        .sort((a: any, b: any) => b.version - a.version)[0];
      
      if (currentGoals) {
        console.log('ProductEditContext: Loading fresh goals:', currentGoals.goals?.length || 0);
        setGoalItems(currentGoals.goals || []);
      } else {
        console.log('ProductEditContext: No fresh goals found, initializing empty');
        setGoalItems([]);
      }
    } else {
      console.log('ProductEditContext: No fresh product found, clearing goals');
      setGoalItems([]);
    }
  };

  // Handle month/year change for plan
  const handlePlanMonthYearChange = (month: number, year: number) => {
    console.log('ProductEditContext: Changing plan month/year to:', month, year);
    setPlanMonth(month);
    setPlanYear(year);
    
    // Load fresh plan from localStorage for selected month/year
    const freshProduct = reloadProductFromStorage();
    if (freshProduct) {
      const currentPlan = freshProduct.releasePlans
        ?.filter((p: any) => p.month === month && p.year === year)
        .sort((a: any, b: any) => b.version - a.version)[0];
      
      if (currentPlan) {
        console.log('ProductEditContext: Loading fresh plan:', currentPlan.items?.length || 0);
        setPlanItems(currentPlan.items || []);
      } else {
        console.log('ProductEditContext: No fresh plan found, initializing empty');
        setPlanItems([]);
      }
    } else {
      console.log('ProductEditContext: No fresh product found, clearing plan');
      setPlanItems([]);
    }
  };
  
  // Load data when product changes or when month/year changes
  useEffect(() => {
    if (product) {
      console.log('ProductEditContext: Product changed, reloading data for:', product.name);
      
      // Load metrics for current month/year from fresh localStorage data
      const freshProduct = reloadProductFromStorage() || product;
      const currentMetrics = freshProduct.metrics?.filter(
        (m: any) => m.month === metricsMonth && m.year === metricsYear
      ) || [];
      console.log('ProductEditContext: Loading metrics:', currentMetrics.length, 'for', metricsMonth, metricsYear);
      setMetrics(currentMetrics);
      
      // Load goals for current month/year
      const currentGoals = freshProduct.releaseGoals
        ?.filter((g: any) => g.month === goalMonth && g.year === goalYear)
        .sort((a: any, b: any) => b.version - a.version)[0];
      
      if (currentGoals) {
        console.log('ProductEditContext: Loading existing goals:', currentGoals.goals?.length || 0);
        setGoalItems(currentGoals.goals || []);
      } else {
        console.log('ProductEditContext: No existing goals found');
        setGoalItems([]);
      }
      
      // Load plan for current month/year
      const currentPlan = freshProduct.releasePlans
        ?.filter((p: any) => p.month === planMonth && p.year === planYear)
        .sort((a: any, b: any) => b.version - a.version)[0];
      
      if (currentPlan) {
        console.log('ProductEditContext: Loading existing plan:', currentPlan.items?.length || 0);
        setPlanItems(currentPlan.items || []);
      } else {
        console.log('ProductEditContext: No existing plan found');
        setPlanItems([]);
      }
    }
  }, [product, metricsMonth, metricsYear, goalMonth, goalYear, planMonth, planYear]);
  
  const value = {
    product,
    portfolio,
    loading,
    setProduct,
    setPortfolio,
    setLoading,
    metrics,
    setMetrics,
    metricsMonth,
    metricsYear,
    setMetricsMonth,
    setMetricsYear,
    goalItems,
    setGoalItems,
    goalMonth,
    goalYear,
    setGoalMonth,
    setGoalYear,
    planItems,
    setPlanItems,
    planMonth,
    planYear,
    setPlanMonth,
    setPlanYear,
    noteLink,
    setNoteLink,
    noteMonth,
    noteYear,
    setNoteMonth,
    setNoteYear,
    noteFile,
    setNoteFile,
    selectedYear,
    setSelectedYear,
    handleMetricsMonthYearChange,
    handleGoalsMonthYearChange,
    handlePlanMonthYearChange
  };
  
  return (
    <ProductEditContext.Provider value={value}>
      {children}
    </ProductEditContext.Provider>
  );
}

export function useProductEdit() {
  const context = useContext(ProductEditContext);
  if (context === undefined) {
    throw new Error("useProductEdit must be used within a ProductEditProvider");
  }
  return context;
}
