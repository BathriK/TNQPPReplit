
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { findProductById } from '../lib/data';
import { Product, Portfolio } from '../lib/types';

export function useProductData(productId: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterMonth, setFilterMonth] = useState<number>(4); // Default to April
  const [filterYear, setFilterYear] = useState<number>(2025); // Default to 2025
  const navigate = useNavigate();

  console.log('useProductData: Hook initialized for product:', productId, 'with filter:', filterMonth, filterYear);

  // Listen for month/year filter changes from header
  useEffect(() => {
    const handleFilterChange = (event: CustomEvent) => {
      const { month, year } = event.detail;
      console.log('useProductData: Received filter change:', month, year);
      setFilterMonth(month);
      setFilterYear(year);
    };

    window.addEventListener('monthYearFilterChange', handleFilterChange as EventListener);
    
    return () => {
      window.removeEventListener('monthYearFilterChange', handleFilterChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!productId) {
      console.log('useProductData: No productId provided');
      setLoading(false);
      return;
    }

    const fetchProductData = async () => {
      try {
        console.log('useProductData: Fetching data for product:', productId);
        setLoading(true);
        
        const result = findProductById(productId);
        const foundProduct = result.product;
        const foundPortfolio = result.portfolio;
        
        if (!foundProduct || !foundPortfolio) {
          console.log('useProductData: Product or portfolio not found, redirecting');
          navigate("/");
          return;
        }

        console.log('useProductData: Found product and portfolio:', {
          productName: foundProduct.name,
          portfolioName: foundPortfolio.name,
          totalMetrics: foundProduct.metrics.length,
          totalGoals: foundProduct.releaseGoals.length,
          totalPlans: foundProduct.releasePlans.length,
          totalNotes: foundProduct.releaseNotes.length,
          totalRoadmaps: foundProduct.roadmap.length,
          metricsForFilter: foundProduct.metrics.filter(m => m.month === filterMonth && m.year === filterYear).length,
          goalsForFilter: foundProduct.releaseGoals.filter(g => g.month === filterMonth && g.year === filterYear).length,
          plansForFilter: foundProduct.releasePlans.filter(p => p.month === filterMonth && p.year === filterYear).length,
          notesForFilter: foundProduct.releaseNotes.filter(n => n.month === filterMonth && n.year === filterYear).length
        });

        setProduct(foundProduct);
        setPortfolio(foundPortfolio);
        
      } catch (error) {
        console.error("useProductData: Error loading product:", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [productId, navigate, filterMonth, filterYear]);

  // Listen for data updates
  useEffect(() => {
    const handleDataUpdate = () => {
      console.log('useProductData: Data update event received for product:', productId);
      if (productId) {
        const result = findProductById(productId);
        if (result.product && result.portfolio) {
          setProduct(result.product);
          setPortfolio(result.portfolio);
        }
      }
    };

    window.addEventListener('productDataUpdated', handleDataUpdate);
    
    return () => {
      window.removeEventListener('productDataUpdated', handleDataUpdate);
    };
  }, [productId]);

  return { product, setProduct, portfolio, setPortfolio, loading, setLoading };
}
