
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { findProductById } from '../../lib/data';
import { Product, Portfolio } from '../../lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from '../Header';
import LoadingSpinner from '../LoadingSpinner';
import ProductDetailHeader from '../ProductDetailHeader';
import { ProductDetailTabs } from './ProductDetailTabs';
import { usePermissions } from '@/contexts/AuthContext';
import Breadcrumbs from '@/components/Breadcrumbs';
import MonthYearSelector from '@/components/MonthYearSelector';

const ProductDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { canEdit } = usePermissions();
  
  console.log('ProductDetail: Component mounted for product:', productId);
  
  const [product, setProduct] = useState<Product | null>(null);
  const [portfolio, setPortfolio] = useState<{ id: string; name: string; } | null>(null);
  const [productLoading, setProductLoading] = useState<boolean>(true);
  
  // Initialize with active tab from location state or default to "roadmap"
  const initialTab = location.state?.activeTab || "roadmap";
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  
  // Initialize with April 2025 where we know data exists
  const [selectedMonth, setSelectedMonth] = useState<number>(4);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  
  console.log('ProductDetail: Initial state - month:', selectedMonth, 'year:', selectedYear, 'tab:', activeTab);
  
  // For release notes and roadmap links
  const [roadmapLink, setRoadmapLink] = useState<string | undefined>(undefined);
  const [roadmapVersion, setRoadmapVersion] = useState<string | undefined>(undefined);
  const [releaseNotesLink, setReleaseNotesLink] = useState<string | undefined>(undefined);
  const [releaseNotesVersion, setReleaseNotesVersion] = useState<string | undefined>(undefined);

  // Function to fetch fresh product data directly from localStorage
  const fetchFreshProductData = async () => {
    if (!productId) return null;
    
    try {
      console.log('ProductDetail: Fetching fresh data for product:', productId);
      
      // Always reload from XML to ensure fresh data
      const result = await findProductById(productId);
      const foundProduct = result?.product;
      const foundPortfolio = result?.portfolio;
      
      if (!foundProduct) {
        console.log('ProductDetail: Product not found');
        return null;
      }
      
      console.log('ProductDetail: Loaded product with full data:', {
        name: foundProduct.name,
        metrics: foundProduct.metrics?.length || 0,
        goals: foundProduct.releaseGoals?.length || 0,
        plans: foundProduct.releasePlans?.length || 0,
        notes: foundProduct.releaseNotes?.length || 0,
        roadmaps: foundProduct.roadmap?.length || 0,
        availableMonths: {
          metrics: foundProduct.metrics?.map(m => `${m.month}/${m.year}`) || [],
          goals: foundProduct.releaseGoals?.map(g => `${g.month}/${g.year}`) || [],
          plans: foundProduct.releasePlans?.map(p => `${p.month}/${p.year}`) || [],
          notes: foundProduct.releaseNotes?.map(n => `${n.month}/${n.year}`) || []
        }
      });
      
      return { product: foundProduct, portfolio: foundPortfolio };
    } catch (error) {
      console.error("ProductDetail: Error fetching fresh product data:", error);
      return null;
    }
  };
  
  const loadProductData = async () => {
    if (!productId) {
      console.log('ProductDetail: No productId, navigating to home');
      navigate("/");
      return;
    }
    
    console.log('ProductDetail: Starting to load product data for:', productId);
    setProductLoading(true);
    
    try {
      const result = await fetchFreshProductData();
      const foundProduct = result?.product;
      const foundPortfolio = result?.portfolio;
      
      if (!foundProduct) {
        console.log('ProductDetail: Product not found, redirecting to home');
        navigate("/");
        return;
      }
      
      console.log('ProductDetail: Successfully loaded product data:', foundProduct.name);
      console.log('ProductDetail: Product data breakdown:', {
        totalMetrics: foundProduct.metrics?.length || 0,
        totalGoals: foundProduct.releaseGoals?.length || 0,
        totalPlans: foundProduct.releasePlans?.length || 0,
        totalNotes: foundProduct.releaseNotes?.length || 0,
        metricsForCurrentFilter: foundProduct.metrics?.filter(m => m.month === selectedMonth && m.year === selectedYear).length || 0,
        goalsForCurrentFilter: foundProduct.releaseGoals?.filter(g => g.month === selectedMonth && g.year === selectedYear).length || 0,
        plansForCurrentFilter: foundProduct.releasePlans?.filter(p => p.month === selectedMonth && p.year === selectedYear).length || 0
      });
      
      setProduct(foundProduct);
      setPortfolio(foundPortfolio ? { id: foundPortfolio.id, name: foundPortfolio.name } : null);
      
      // Set latest roadmap and release notes links
      updateLinksFromProduct(foundProduct);
    } catch (error) {
      console.error("ProductDetail: Error loading product data:", error);
    } finally {
      setProductLoading(false);
      console.log('ProductDetail: Finished loading product data');
    }
  };
  
  // Load data on component mount and when productId changes
  useEffect(() => {
    console.log('ProductDetail: Component mounted or productId changed:', productId);
    loadProductData();
  }, [productId]);

  // Listen for storage changes and route changes to reload data
  useEffect(() => {
    console.log('ProductDetail: Setting up storage listeners');
    
    const handleStorageChange = () => {
      console.log('ProductDetail: Storage changed, reloading data');
      loadProductData();
    };

    const handleFocus = () => {
      console.log('ProductDetail: Window focused, reloading data');
      loadProductData();
    };

    // Listen for localStorage changes
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    
    // Also listen for custom events that might be dispatched when data is saved
    const handleDataUpdate = () => {
      console.log('ProductDetail: Data update event received');
      loadProductData();
    };
    
    window.addEventListener('productDataUpdated', handleDataUpdate);

    return () => {
      console.log('ProductDetail: Cleaning up storage listeners');
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('productDataUpdated', handleDataUpdate);
    };
  }, []);

  // Update links when month/year changes
  useEffect(() => {
    console.log('ProductDetail: Month/year changed to:', selectedMonth, selectedYear);
    if (product) {
      console.log('ProductDetail: Updating links from product for new filter');
      updateLinksFromProduct(product);
    }
  }, [selectedMonth, selectedYear, product]);

  const updateLinksFromProduct = (product: Product) => {
    console.log('ProductDetail: Updating links for product:', product.name);
    
    // Get latest roadmap for selected year
    const roadmaps = product.roadmap.filter(r => r.year === selectedYear);
    console.log('ProductDetail: Found roadmaps for year', selectedYear, ':', roadmaps.length);
    
    if (roadmaps.length > 0) {
      const latestRoadmap = roadmaps.sort((a, b) => parseFloat(b.version) - parseFloat(a.version))[0];
      console.log('ProductDetail: Latest roadmap:', latestRoadmap.version, latestRoadmap.link);
      setRoadmapLink(latestRoadmap.link);
      setRoadmapVersion(latestRoadmap.version);
    } else {
      console.log('ProductDetail: No roadmaps found for year', selectedYear);
      setRoadmapLink(undefined);
      setRoadmapVersion(undefined);
    }
    
    // Get latest release notes for selected month/year
    const notes = product.releaseNotes.filter(n => n.month === selectedMonth && n.year === selectedYear);
    console.log('ProductDetail: Found release notes for', selectedMonth, selectedYear, ':', notes.length);
    
    if (notes.length > 0) {
      const latestNotes = notes.sort((a, b) => b.version - a.version)[0];
      console.log('ProductDetail: Latest release notes:', latestNotes.version, latestNotes.link);
      setReleaseNotesLink(latestNotes.link);
      setReleaseNotesVersion(latestNotes.version.toString());
    } else {
      console.log('ProductDetail: No release notes found for', selectedMonth, selectedYear);
      setReleaseNotesLink(undefined);
      setReleaseNotesVersion(undefined);
    }
  };

  const handleMonthYearChange = (month: number, year: number) => {
    console.log('ProductDetail: Month/year changed to:', month, year);
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  // Breadcrumb items - Updated to show "Comparison and Version Control Details"
  const breadcrumbItems = [
    { label: "Dashboard", href: "/" },
    { label: portfolio?.name || "Portfolio", href: portfolio?.id ? `/portfolios/${portfolio.id}` : "/" },
    { label: "Comparison and Version Control Details", isCurrent: true }
  ];

  console.log('ProductDetail: Rendering with product:', product?.name, 'loading:', productLoading);

  return (
    <div className="min-h-screen bg-tnq-lightgray">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {productLoading ? (
          <LoadingSpinner />
        ) : product ? (
          <>
            <Breadcrumbs items={breadcrumbItems} />
            
            {/* Updated page title */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-tnq-navy mb-2">
                Comparison and Version Control Details
              </h1>
              <p className="text-gray-600">
                Product: {product.name} | Portfolio: {portfolio?.name || 'N/A'}
              </p>
            </div>
            
            {/* Add month/year selector */}
            <div className="mb-4 flex justify-end">
              <div className="w-48">
                <MonthYearSelector
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  onChange={handleMonthYearChange}
                  className="compact"
                />
              </div>
            </div>
            
            <ProductDetailHeader 
              productName={product.name} 
              productId={productId || ''} 
              portfolioName={portfolio?.name}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthYearChange={handleMonthYearChange}
              showEditButton={canEdit}
              roadmapLink={roadmapLink}
              roadmapVersion={roadmapVersion}
              releaseNotesLink={releaseNotesLink}
              releaseNotesVersion={releaseNotesVersion}
            />
            
            <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
              <div className="bg-white mb-4 border-b border-gray-200 w-full overflow-x-auto">
                <TabsList className="bg-transparent w-auto h-auto p-0">
                  <TabsTrigger value="roadmap" className="data-[state=active]:border-b-2 data-[state=active]:border-tnq-navy data-[state=active]:text-tnq-navy">
                    Roadmap
                  </TabsTrigger>
                  <TabsTrigger value="goals" className="data-[state=active]:border-b-2 data-[state=active]:border-tnq-navy data-[state=active]:text-tnq-navy">
                    Release Goals
                  </TabsTrigger>
                  <TabsTrigger value="plan" className="data-[state=active]:border-b-2 data-[state=active]:border-tnq-navy data-[state=active]:text-tnq-navy">
                    Release Plan
                  </TabsTrigger>
                  <TabsTrigger value="metrics" className="data-[state=active]:border-b-2 data-[state=active]:border-tnq-navy data-[state=active]:text-tnq-navy">
                    Metrics
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="data-[state=active]:border-b-2 data-[state=active]:border-tnq-navy data-[state=active]:text-tnq-navy">
                    Release Notes
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <ProductDetailTabs 
                  activeTab={activeTab}
                  productId={productId || ''}
                  product={product}
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  onMonthYearChange={handleMonthYearChange}
                />
              </div>
            </Tabs>
          </>
        ) : (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-600">Product not found</div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductDetail;
