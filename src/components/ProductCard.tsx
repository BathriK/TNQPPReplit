
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '../lib/types';
import { getCurrentMonthData, getPreviousMonthData } from '../lib/data';
import { Download, Eye, Pencil, ExternalLink as ExternalLinkIcon, FileText, Target } from 'lucide-react';
import MetricsDisplay from './MetricsDisplay';
import { Card, CardContent } from './ui/card';
import ReleaseGoalsCard from './ReleaseGoalsCard';
import ReleasePlanCard from './ReleasePlanCard';
import ProductMetricsHelper from './ProductMetricsHelper';
import DummyDataHelper from './DummyDataHelper';
import { Button } from './ui/button';
import { exportProductXML } from '../lib/xmlUtils';
import { usePermissions } from '../contexts/AuthContext';

interface ProductCardProps {
  product: Product;
  selectedMonth?: number;
  selectedYear?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  selectedMonth: propSelectedMonth = 4, // Default to April
  selectedYear: propSelectedYear = 2025  // Default to 2025
}) => {
  const navigate = useNavigate();
  const [productState, setProductState] = useState<Product>(product);
  const [filterMonth, setFilterMonth] = useState<number>(propSelectedMonth);
  const [filterYear, setFilterYear] = useState<number>(propSelectedYear);
  const { canEdit, canDownload } = usePermissions();

  console.log('ProductCard: Initializing for product:', product.name, {
    propSelectedMonth,
    propSelectedYear,
    selectedFilterMonth: filterMonth,
    selectedFilterYear: filterYear,
    productMetrics: product.metrics?.length || 0,
    productGoals: product.releaseGoals?.length || 0,
    productPlans: product.releasePlans?.length || 0,
    availableMetricMonths: product.metrics?.map(m => `${m.month}/${m.year}`).join(', ') || 'none'
  });

  // Update filter when props change
  useEffect(() => {
    console.log('ProductCard: Props changed for', product.name, 'to', propSelectedMonth, propSelectedYear);
    setFilterMonth(propSelectedMonth);
    setFilterYear(propSelectedYear);
  }, [propSelectedMonth, propSelectedYear, product.name]);

  // Listen for month/year filter changes from header
  useEffect(() => {
    const handleFilterChange = (event: CustomEvent) => {
      const { month, year } = event.detail;
      console.log('ProductCard: Received filter change event for', product.name, ':', month, year);
      setFilterMonth(month);
      setFilterYear(year);
    };

    window.addEventListener('monthYearFilterChange', handleFilterChange as EventListener);
    
    return () => {
      window.removeEventListener('monthYearFilterChange', handleFilterChange as EventListener);
    };
  }, [product.name]);

  // Reload product data from localStorage when needed
  useEffect(() => {
    const reloadProductData = () => {
      try {
        const portfolios = JSON.parse(localStorage.getItem('portfolios') || '[]');
        console.log('ProductCard: Reloading product data from localStorage for', product.name);
        
        for (const portfolio of portfolios) {
          const foundProduct = portfolio.products?.find((p: Product) => p.id === product.id);
          if (foundProduct) {
            console.log('ProductCard: Found updated product data for', product.name);
            setProductState(foundProduct);
            break;
          }
        }
      } catch (error) {
        console.error('ProductCard: Error reloading product data for', product.name, ':', error);
      }
    };

    reloadProductData();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'portfolios') {
        console.log('ProductCard: Storage changed, reloading data for', product.name);
        reloadProductData();
      }
    };

    const handleCustomStorageChange = () => {
      console.log('ProductCard: Custom storage event received, reloading data for', product.name);
      reloadProductData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('productDataUpdated', handleCustomStorageChange);
    document.addEventListener('productDataUpdated', handleCustomStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('productDataUpdated', handleCustomStorageChange);
      document.removeEventListener('productDataUpdated', handleCustomStorageChange);
    };
  }, [product.id, product.name]);

  // Filter metrics for display
  const metrics = productState.metrics || [];
  let filteredMetrics = metrics.filter(m => 
    m.month === filterMonth && m.year === filterYear
  );
  
  // If no metrics for selected filter, show all metrics as fallback
  if (filteredMetrics.length === 0 && metrics.length > 0) {
    console.log('ProductCard: No metrics for selected filter, displaying all available metrics');
    filteredMetrics = metrics;
  }

  console.log('ProductCard: Filtered metrics for', product.name, 'in', filterMonth, filterYear, ':', filteredMetrics.length);

  // Create filtered product for other components
  const displayProduct = {
    ...productState,
    metrics: filteredMetrics,
    releaseGoals: productState.releaseGoals?.filter(g => 
      g.month === filterMonth && g.year === filterYear
    ) || [],
    releasePlans: productState.releasePlans?.filter(p => 
      p.month === filterMonth && p.year === filterYear
    ) || [],
    releaseNotes: productState.releaseNotes?.filter(n => 
      n.month === filterMonth && n.year === filterYear
    ) || []
  };

  // Get latest data for this product (using filtered data)
  const { latestRoadmap, latestReleaseGoal, latestReleasePlan, latestReleaseNote } = getCurrentMonthData(displayProduct, filterMonth, filterYear);

  // Get previous month data for release notes
  const { latestReleaseNote: previousMonthReleaseNote } = getPreviousMonthData(displayProduct, filterMonth, filterYear);
  const hasReleaseNotes = latestReleaseNote || previousMonthReleaseNote;

  const handleDownloadProductXML = () => {
    exportProductXML(productState.id);
  };

  const handleDownloadReleaseNotes = () => {
    const releaseNote = hasReleaseNotes;
    if (releaseNote && releaseNote.link) {
      const link = document.createElement('a');
      link.href = releaseNote.link;
      link.target = '_blank';
      link.download = `${productState.name}-release-notes-v${releaseNote.version}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.log('No release notes available for download');
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/products/${productState.id}/edit`);
  };

  console.log('ProductCard: Rendering', product.name, 'with filtered data - metrics:', filteredMetrics.length);

  return (
    <>
      <ProductMetricsHelper product={productState} />
      <DummyDataHelper product={productState} latestReleaseGoal={latestReleaseGoal} latestReleasePlan={latestReleasePlan} />
      
      <Card className="animate-fade-in mb-4 w-full">
        <CardContent className="grid-spacing">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <h3 className="font-semibold text-tnq-blue">{productState.name}</h3>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="View product details" asChild>
                  <Link to={`/products/${productState.id}`}>
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View</span>
                  </Link>
                </Button>
                {canDownload && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownloadProductXML} title="Export Product XML" aria-label="Export Product XML">
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Export XML</span>
                  </Button>
                )}
                {hasReleaseNotes && hasReleaseNotes.link && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-tnq-navy hover:text-tnq-navy/80" onClick={handleDownloadReleaseNotes} title="Download Release Notes" aria-label="Download Release Notes">
                    <FileText className="h-4 w-4" />
                    <span className="sr-only">Download Release Notes</span>
                  </Button>
                )}
                {canEdit && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-tnq-green hover:text-tnq-green-dark" onClick={handleEditClick} aria-label="Edit product">
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                )}
              </div>
            </div>
            
            {/* Product links section */}
            <div className="flex flex-col gap-2">
              {latestRoadmap && latestRoadmap.link && (
                <a href={latestRoadmap.link} target="_blank" rel="noopener noreferrer" className="text-sm text-tnq-blue hover:text-tnq-navyBlue hover:underline flex items-center">
                  <Target className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  View Roadmap v{latestRoadmap.version}
                  <ExternalLinkIcon className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
              
              {hasReleaseNotes && hasReleaseNotes.link && (
                <a href={hasReleaseNotes.link} target="_blank" rel="noopener noreferrer" className="text-sm text-tnq-blue hover:text-tnq-navyBlue hover:underline flex items-center">
                  <FileText className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  View Release Notes v{hasReleaseNotes.version}
                  <ExternalLinkIcon className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2 text-left">
              Product Metrics ({filterMonth}/{filterYear})
            </h4>
            {filteredMetrics.length > 0 ? (
              <MetricsDisplay metrics={filteredMetrics} />
            ) : (
              <div className="text-sm text-gray-500 italic py-2">
                No metrics available for {filterMonth}/{filterYear}
                {metrics && metrics.length > 0 && (
                  <div className="mt-1 text-xs">
                    Available periods: {Array.from(new Set(metrics.map(m => `${m.month}/${m.year}`))).join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="grid-container">
            <div className="w-full">
              <ReleaseGoalsCard productId={productState.id} latestReleaseGoal={latestReleaseGoal || displayProduct.releaseGoals?.[0]} />
            </div>
            
            <div className="w-full">
              <ReleasePlanCard productId={productState.id} latestReleasePlan={latestReleasePlan || displayProduct.releasePlans?.[0]} />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default ProductCard;
