
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { findProductById } from '../lib/data';
import { Product, Portfolio } from '../lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import Header from './Header';
import LoadingSpinner from './LoadingSpinner';
import ProductDetailHeader from './ProductDetailHeader';
import RoadmapTabContent from './ProductDetailTabs/RoadmapTabContent';
import GoalsTabContent from './ProductDetailTabs/GoalsTabContent';
import PlanTabContent from './ProductDetailTabs/PlanTabContent';
import MetricsTabContent from './ProductDetailTabs/MetricsTabContent';
import NotesTabContent from './ProductDetailTabs/NotesTabContent';
import { getCurrentMonthYear } from '@/lib/utils';
import Breadcrumbs from './Breadcrumbs';
import { usePermissions } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

const ProductDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { canEdit, isPM, isAdmin } = usePermissions();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [portfolio, setPortfolio] = useState<{ id: string; name: string; } | null>(null);
  const [productLoading, setProductLoading] = useState<boolean>(true);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  
  const initialTab = location.state?.activeTab || "roadmap";
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  
  const [roadmapVersions, setRoadmapVersions] = useState<any[]>([]);
  const [releaseGoalVersions, setReleaseGoalVersions] = useState<any[]>([]);
  const [releasePlanVersions, setReleasePlanVersions] = useState<any[]>([]);

  // Show edit mode toggle only for PM and Admin roles
  const showEditModeToggle = isPM || isAdmin;

  // Function to fetch fresh product data from localStorage
  const fetchFreshProductData = async () => {
    if (!productId) return null;
    
    try {
      // Always fetch fresh data from localStorage
      const result = await findProductById(productId);
      return result;
    } catch (error) {
      console.error("Error fetching fresh product data:", error);
      return null;
    }
  };

  // Initial data load
  useEffect(() => {
    if (!productId) {
      navigate("/");
      return;
    }
    
    setProductLoading(true);
    
    const loadProductData = async () => {
      try {
        const result = await fetchFreshProductData();
        const foundProduct = result?.product;
        const foundPortfolio = result?.portfolio;
        
        if (!foundProduct) {
          navigate("/");
          return;
        }
        
        console.log('ProductDetail: Loaded fresh product data:', foundProduct.name);
        setProduct(foundProduct);
        setPortfolio(foundPortfolio ? { id: foundPortfolio.id, name: foundPortfolio.name } : null);
        loadVersions(foundProduct);
        
      } catch (error) {
        console.error("Error fetching product data:", error);
      } finally {
        setProductLoading(false);
      }
    };
    
    loadProductData();
  }, [productId, navigate]);

  // Listen for storage changes to reload data when other components save
  useEffect(() => {
    const handleStorageChange = async () => {
      console.log('ProductDetail: Storage changed, reloading fresh data');
      if (productId) {
        try {
          const result = await fetchFreshProductData();
          const foundProduct = result?.product;
          
          if (foundProduct) {
            console.log('ProductDetail: Updated with fresh data from storage');
            setProduct(foundProduct);
            loadVersions(foundProduct);
          }
        } catch (error) {
          console.error('ProductDetail: Error reloading on storage change:', error);
        }
      }
    };

    // Listen for both storage events and custom events
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [productId]);

  useEffect(() => {
    if (!product) return;
    loadVersions(product);
  }, [selectedMonth, selectedYear, product]);

  const loadVersions = (product: Product) => {
    const roadmaps = product.roadmap.filter(r => r.year === selectedYear);
    setRoadmapVersions(roadmaps);
    
    const goals = product.releaseGoals.filter(g => g.month === selectedMonth && g.year === selectedYear);
    const plans = product.releasePlans.filter(p => p.month === selectedMonth && p.year === selectedYear);
    
    setReleaseGoalVersions(goals);
    setReleasePlanVersions(plans);
    
    if (roadmaps.length > 0) {
      const latest = [...roadmaps].sort((a, b) => 
        parseFloat(b.version) - parseFloat(a.version)
      )[0];
      setSelectedRoadmapId(latest.id);
    } else {
      setSelectedRoadmapId(null);
    }
    
    if (goals.length > 0) {
      const latest = [...goals].sort((a, b) => b.version - a.version)[0];
      setSelectedGoalId(latest.id);
    } else {
      setSelectedGoalId(null);
    }
    
    if (plans.length > 0) {
      const latest = [...plans].sort((a, b) => b.version - a.version)[0];
      setSelectedPlanId(latest.id);
    } else {
      setSelectedPlanId(null);
    }
  };

  const handleMonthYearChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };
  
  const handleYearChange = (_month: number, year: number) => {
    setSelectedYear(year);
  };

  const breadcrumbItems = [
    { label: "Dashboard", href: "/" },
    { label: portfolio?.name || "Portfolio", href: portfolio?.id ? `/portfolios/${portfolio.id}` : "/" },
    { label: "Comparison and Version Control Details", isCurrent: true }
  ];

  return (
    <div className="min-h-screen bg-tnq-lightgray font-['Pathway']">
      <Header />
      
      <main className="lg:ml-64 px-4 py-8 transition-all duration-200">
        <div className="container mx-auto">
          {productLoading ? (
            <LoadingSpinner />
          ) : product ? (
            <>
              <Breadcrumbs items={breadcrumbItems} />
              
              <div className="flex justify-between items-center mb-6">
                <ProductDetailHeader 
                  productName={product.name} 
                  productId={productId || ''} 
                  portfolioName={portfolio?.name}
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  onMonthYearChange={handleMonthYearChange}
                />
                
                {showEditModeToggle && (
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditMode(!isEditMode)} 
                    className="flex items-center gap-2"
                  >
                    <Edit size={16} />
                    {isEditMode ? 'View Mode' : 'Edit Mode'}
                  </Button>
                )}
              </div>
              
              <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
                <div className="flex justify-center mb-6">
                  <TabsList className="bg-white border border-gray-200 p-1 rounded-lg shadow-sm inline-flex">
                    <TabsTrigger 
                      value="roadmap" 
                      className="px-6 py-2 font-medium text-sm transition-all data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md"
                    >
                      Roadmap
                    </TabsTrigger>
                    <TabsTrigger 
                      value="goals" 
                      className="px-6 py-2 font-medium text-sm transition-all data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md"
                    >
                      Release Goals
                    </TabsTrigger>
                    <TabsTrigger 
                      value="plan" 
                      className="px-6 py-2 font-medium text-sm transition-all data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md"
                    >
                      Release Plans
                    </TabsTrigger>
                    <TabsTrigger 
                      value="metrics" 
                      className="px-6 py-2 font-medium text-sm transition-all data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md"
                    >
                      Product Metrics
                    </TabsTrigger>
                    <TabsTrigger 
                      value="notes" 
                      className="px-6 py-2 font-medium text-sm transition-all data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md"
                    >
                      Release Notes
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
                  <TabsContent value="roadmap">
                    <RoadmapTabContent
                      productId={productId || ''}
                      selectedYear={selectedYear}
                      roadmapVersions={roadmapVersions}
                      selectedRoadmapId={selectedRoadmapId}
                      onYearChange={handleYearChange}
                      onVersionSelect={(id: string) => setSelectedRoadmapId(id)}
                      isEditMode={isEditMode}
                    />
                  </TabsContent>
                  
                  <TabsContent value="goals">
                    <GoalsTabContent
                      productId={productId || ''}
                      selectedMonth={selectedMonth}
                      selectedYear={selectedYear}
                      releaseGoalVersions={releaseGoalVersions}
                      selectedGoalId={selectedGoalId}
                      onMonthYearChange={handleMonthYearChange}
                      onVersionSelect={(id: string) => setSelectedGoalId(id)}
                      isEditMode={isEditMode}
                    />
                  </TabsContent>
                  
                  <TabsContent value="plan">
                    <PlanTabContent
                      productId={productId || ''}
                      selectedMonth={selectedMonth}
                      selectedYear={selectedYear}
                      releasePlanVersions={releasePlanVersions}
                      selectedPlanId={selectedPlanId}
                      onMonthYearChange={handleMonthYearChange}
                      onVersionSelect={(id: string) => setSelectedPlanId(id)}
                      isEditMode={isEditMode}
                    />
                  </TabsContent>
                  
                  <TabsContent value="metrics">
                    <MetricsTabContent
                      selectedMonth={selectedMonth}
                      selectedYear={selectedYear}
                      metrics={product.metrics}
                      onMonthYearChange={handleMonthYearChange}
                      isEditMode={isEditMode}
                    />
                  </TabsContent>

                  <TabsContent value="notes">
                    <NotesTabContent 
                      selectedMonth={selectedMonth}
                      selectedYear={selectedYear}
                      releaseNotes={product.releaseNotes || []}
                      productId={productId || ''}
                      onMonthYearChange={handleMonthYearChange}
                      isEditMode={isEditMode}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </>
          ) : (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-600">Product not found</div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;
