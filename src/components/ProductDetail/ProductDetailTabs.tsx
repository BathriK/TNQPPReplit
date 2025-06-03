
import React, { useState, useEffect } from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { Product } from '../../lib/types';
import RoadmapTabContent from '../ProductDetailTabs/RoadmapTabContent';
import GoalsTabContent from '../ProductDetailTabs/GoalsTabContent';
import PlanTabContent from '../ProductDetailTabs/PlanTabContent';
import MetricsTabContent from '../ProductDetailTabs/MetricsTabContent';
import NotesTabContent from '../ProductDetailTabs/NotesTabContent';

interface ProductDetailTabsProps {
  activeTab: string;
  productId: string;
  product: Product;
  selectedMonth: number;
  selectedYear: number;
  onMonthYearChange: (month: number, year: number) => void;
}

export const ProductDetailTabs: React.FC<ProductDetailTabsProps> = ({
  activeTab,
  productId,
  product,
  selectedMonth,
  selectedYear,
  onMonthYearChange,
}) => {
  const [currentProduct, setCurrentProduct] = useState<Product>(product);

  // Update current product when prop changes
  useEffect(() => {
    console.log('ProductDetailTabs: Product data updated:', product.name);
    setCurrentProduct(product);
  }, [product]);

  // Helper function to get fresh product data from localStorage
  const getFreshProductData = (): Product | null => {
    try {
      const storedData = localStorage.getItem('productPortalConfig');
      if (!storedData) return null;
      
      const allData = JSON.parse(storedData);
      const foundProduct = allData.products?.find((p: Product) => p.id === productId);
      
      if (foundProduct) {
        console.log('ProductDetailTabs: Retrieved fresh product data from localStorage');
        return foundProduct;
      }
      
      return null;
    } catch (error) {
      console.error('ProductDetailTabs: Error getting fresh data:', error);
      return null;
    }
  };

  // Listen for storage changes to update data
  useEffect(() => {
    const handleStorageChange = () => {
      const freshProduct = getFreshProductData();
      if (freshProduct) {
        console.log('ProductDetailTabs: Storage changed, updating product data');
        setCurrentProduct(freshProduct);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('productDataUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('productDataUpdated', handleStorageChange);
    };
  }, [productId]);

  const handleYearChange = (_month: number, year: number) => {
    onMonthYearChange(selectedMonth, year);
  };

  return (
    <>
      <TabsContent value="roadmap">
        <RoadmapTabContent
          productId={productId}
          selectedYear={selectedYear}
          roadmapVersions={currentProduct.roadmap.filter(r => r.year === selectedYear)}
          selectedRoadmapId={null}
          onYearChange={handleYearChange}
          onVersionSelect={() => {}}
          isEditMode={false}
        />
      </TabsContent>
      
      <TabsContent value="goals">
        <GoalsTabContent
          productId={productId}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          releaseGoalVersions={currentProduct.releaseGoals.filter(g => g.month === selectedMonth && g.year === selectedYear)}
          selectedGoalId={null}
          onMonthYearChange={onMonthYearChange}
          onVersionSelect={() => {}}
          isEditMode={false}
        />
      </TabsContent>
      
      <TabsContent value="plan">
        <PlanTabContent
          productId={productId}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          releasePlanVersions={currentProduct.releasePlans.filter(p => p.month === selectedMonth && p.year === selectedYear)}
          selectedPlanId={null}
          onMonthYearChange={onMonthYearChange}
          onVersionSelect={() => {}}
          isEditMode={false}
        />
      </TabsContent>
      
      <TabsContent value="metrics">
        <MetricsTabContent
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          metrics={currentProduct.metrics.filter(m => m.month === selectedMonth && m.year === selectedYear)}
          onMonthYearChange={onMonthYearChange}
          isEditMode={false}
        />
      </TabsContent>

      <TabsContent value="notes">
        <NotesTabContent 
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          releaseNotes={currentProduct.releaseNotes || []}
          productId={productId}
          onMonthYearChange={onMonthYearChange}
          isEditMode={false}
        />
      </TabsContent>
    </>
  );
};
