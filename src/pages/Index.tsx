
import React, { useState, useEffect } from "react";
import { getPortfolios } from "../lib/data";
import { Portfolio, Product } from "../lib/types";
import ProductCard from "../components/ProductCard";
import Header from "../components/Header";
import { ChevronDown } from "lucide-react";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger 
} from "../components/ui/collapsible";
import ProductFilter from "@/components/ProductFilter";
import MonthYearSelector from "@/components/MonthYearSelector";

const Index: React.FC = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedPortfolios, setExpandedPortfolios] = useState<Record<string, boolean>>({});
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [filteredPortfolios, setFilteredPortfolios] = useState<Portfolio[]>([]);
  
  // Initialize with April 2025 where we know data exists
  const [selectedMonth, setSelectedMonth] = useState<number>(4);
  const [selectedYear, setSelectedYear] = useState<number>(2025);

  console.log('Index: Component mounted with initial state:', {
    selectedMonth,
    selectedYear,
    selectedProductId
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Index: Starting to fetch portfolios data');
        setLoading(true);
        
        const data = await getPortfolios();
        console.log('Index: Loaded portfolios data:', {
          portfolioCount: data.length,
          totalProducts: data.reduce((acc, p) => acc + p.products.length, 0)
        });
        
        // Log sample data to understand what we have
        if (data.length > 0 && data[0].products.length > 0) {
          const sampleProduct = data[0].products[0];
          console.log('Index: Sample product data:', {
            name: sampleProduct.name,
            metricsCount: sampleProduct.metrics?.length || 0,
            goalsCount: sampleProduct.releaseGoals?.length || 0,
            plansCount: sampleProduct.releasePlans?.length || 0,
            notesCount: sampleProduct.releaseNotes?.length || 0,
            availableMonths: {
              metrics: sampleProduct.metrics?.map(m => `${m.month}/${m.year}`) || [],
              goals: sampleProduct.releaseGoals?.map(g => `${g.month}/${g.year}`) || [],
              plans: sampleProduct.releasePlans?.map(p => `${p.month}/${p.year}`) || [],
              notes: sampleProduct.releaseNotes?.map(n => `${n.month}/${n.year}`) || []
            }
          });
        }
        
        setPortfolios(data);
        setFilteredPortfolios(data);
        
        // Initialize all portfolios as expanded
        const initialExpandedState: Record<string, boolean> = {};
        data.forEach(portfolio => {
          initialExpandedState[portfolio.id] = true;
        });
        setExpandedPortfolios(initialExpandedState);
        
      } catch (error) {
        console.error("Index: Error loading portfolio data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter portfolios based on selected product
  useEffect(() => {
    console.log('Index: Filtering portfolios for product:', selectedProductId);
    if (!selectedProductId) {
      setFilteredPortfolios(portfolios);
      return;
    }

    const filtered = portfolios.map(portfolio => {
      const hasSelectedProduct = portfolio.products.some(
        product => product.id === selectedProductId
      );

      if (hasSelectedProduct) {
        return {
          ...portfolio,
          products: portfolio.products.filter(product => product.id === selectedProductId)
        };
      }
      return null;
    }).filter(Boolean) as Portfolio[];

    console.log('Index: Filtered to portfolios:', filtered.length);
    setFilteredPortfolios(filtered);
  }, [selectedProductId, portfolios]);

  // Dispatch filter change event for ProductCard components
  useEffect(() => {
    console.log(`Index: Dispatching filter change event for ${selectedMonth}/${selectedYear}`);
    const event = new CustomEvent('monthYearFilterChange', {
      detail: { month: selectedMonth, year: selectedYear }
    });
    window.dispatchEvent(event);
  }, [selectedMonth, selectedYear]);

  const handleProductChange = (productId: string) => {
    console.log('Index: Product filter changed to:', productId);
    setSelectedProductId(productId);
  };

  const handleDateChange = (month: number, year: number) => {
    console.log(`Index: Month/year filter changed to ${month}/${year}`);
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const togglePortfolio = (portfolioId: string) => {
    setExpandedPortfolios(prev => ({
      ...prev,
      [portfolioId]: !prev[portfolioId]
    }));
  };

  console.log('Index: Rendering with:', {
    loading,
    portfolioCount: filteredPortfolios.length,
    totalProducts: filteredPortfolios.reduce((acc, p) => acc + p.products.length, 0)
  });

  return (
    <div className="min-h-screen bg-tnq-lightgray">
      <Header />
      
      <main className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-tnq-navy">Product Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="w-48">
              <MonthYearSelector
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onChange={handleDateChange}
                className="compact"
              />
            </div>
            <div className="w-64">
              <ProductFilter 
                selectedProductId={selectedProductId}
                onProductChange={handleProductChange}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-tnq-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading product data...</p>
            </div>
          </div>
        ) : filteredPortfolios.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl text-gray-700 mb-4">No portfolios or products found</h2>
            <p className="text-gray-600 mb-6">
              Data loading failed. Please check the console for errors and ensure XML files are accessible.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPortfolios.map((portfolio) => (
              <div key={portfolio.id} className="bg-white rounded-lg p-4 shadow-sm">
                <Collapsible
                  open={expandedPortfolios[portfolio.id]}
                  onOpenChange={() => togglePortfolio(portfolio.id)}
                  className="w-full"
                >
                  <div className="border-b pb-2 mb-4">
                    <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
                      <h2 className="text-xl font-medium text-gray-800">{portfolio.name}</h2>
                      <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${
                        expandedPortfolios[portfolio.id] ? 'transform rotate-180' : ''
                      }`} />
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent>
                    <div className="space-y-6">
                      {portfolio.products.length === 0 ? (
                        <p className="text-gray-500 italic py-4">No products in this portfolio</p>
                      ) : (
                        portfolio.products.map((product) => (
                          <ProductCard 
                            key={product.id} 
                            product={product} 
                            selectedMonth={selectedMonth}
                            selectedYear={selectedYear}
                          />
                        ))
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
