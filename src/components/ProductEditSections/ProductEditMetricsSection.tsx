
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductEdit } from '../../contexts/ProductEditContext';
import MonthYearSelector from '../MonthYearSelector';
import { Card } from '@/components/ui/card';
import { Metric } from '../../lib/types';
import MetricsTable from './MetricsTable';
import MetricsActions from './MetricsActions';
import EmptyMetricsState from './EmptyMetricsState';

const ProductEditMetricsSection: React.FC = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  
  const {
    product,
    portfolio,
    metrics,
    setMetrics,
    metricsMonth,
    metricsYear,
    handleMetricsMonthYearChange
  } = useProductEdit();

  // Reload metrics from localStorage whenever the component mounts or month/year changes
  useEffect(() => {
    if (product && product.id) {
      console.log('ProductEditMetricsSection: Reloading metrics from localStorage for month/year:', metricsMonth, metricsYear);
      
      try {
        const portfolios = JSON.parse(localStorage.getItem('portfolios') || '[]');
        
        for (const portfolioData of portfolios) {
          const foundProduct = portfolioData.products?.find((p: any) => p.id === product.id);
          if (foundProduct) {
            console.log('ProductEditMetricsSection: Found product with metrics:', foundProduct.metrics?.length || 0);
            
            // Filter metrics for current month/year
            const currentMetrics = foundProduct.metrics?.filter(
              (m: any) => m.month === metricsMonth && m.year === metricsYear
            ) || [];
            
            console.log('ProductEditMetricsSection: Filtered metrics for current period:', currentMetrics.length);
            setMetrics(currentMetrics);
            break;
          }
        }
      } catch (error) {
        console.error('ProductEditMetricsSection: Error reloading metrics from localStorage:', error);
      }
    }
  }, [product?.id, metricsMonth, metricsYear, setMetrics]);

  // Listen for storage changes to reload data when other components save
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('ProductEditMetricsSection: Storage changed, reloading metrics');
      if (product && product.id) {
        try {
          const portfolios = JSON.parse(localStorage.getItem('portfolios') || '[]');
          
          for (const portfolioData of portfolios) {
            const foundProduct = portfolioData.products?.find((p: any) => p.id === product.id);
            if (foundProduct) {
              const currentMetrics = foundProduct.metrics?.filter(
                (m: any) => m.month === metricsMonth && m.year === metricsYear
              ) || [];
              
              setMetrics(currentMetrics);
              break;
            }
          }
        } catch (error) {
          console.error('ProductEditMetricsSection: Error reloading on storage change:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [product?.id, metricsMonth, metricsYear, setMetrics]);

  const addNewMetric = () => {
    const newMetric: Metric = {
      id: `metric-${Date.now()}`,
      name: '',
      value: 0,
      unit: '',
      monthlyTarget: 0,
      annualTarget: 0,
      status: 'on-track' as const,
      notes: '',
      month: metricsMonth,
      year: metricsYear,
      timestamp: new Date().toISOString(),
      description: ''
    };
    setMetrics([...metrics, newMetric]);
  };

  const updateMetric = (index: number, field: string, value: string | number) => {
    const updatedMetrics = [...metrics];
    if (field === 'value' || field === 'monthlyTarget' || field === 'annualTarget') {
      updatedMetrics[index] = { ...updatedMetrics[index], [field]: typeof value === 'string' ? parseFloat(value) || 0 : value };
    } else {
      updatedMetrics[index] = { ...updatedMetrics[index], [field]: value };
    }
    setMetrics(updatedMetrics);
  };

  const removeMetric = (index: number) => {
    const updatedMetrics = metrics.filter((_, i) => i !== index);
    setMetrics(updatedMetrics);
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all metrics data? This action cannot be undone.')) {
      setMetrics([]);
    }
  };

  const handleSave = async () => {
    if (!product || !portfolio) {
      alert('Missing product or portfolio data');
      return;
    }
    
    setSaving(true);
    console.log('ProductEditMetricsSection: Saving metrics for month/year:', metricsMonth, metricsYear);
    console.log('ProductEditMetricsSection: Current metrics to save:', metrics);
    
    try {
      // Filter out empty metrics and ensure proper data types
      const validMetrics = metrics
        .filter(metric => metric.name.trim() !== '')
        .map(metric => ({
          ...metric,
          month: metricsMonth,
          year: metricsYear,
          timestamp: new Date().toISOString(),
          value: typeof metric.value === 'string' ? parseFloat(metric.value) || 0 : metric.value,
          monthlyTarget: typeof metric.monthlyTarget === 'string' ? parseFloat(metric.monthlyTarget) || 0 : metric.monthlyTarget,
          annualTarget: typeof metric.annualTarget === 'string' ? parseFloat(metric.annualTarget) || 0 : metric.annualTarget
        }));
      
      console.log('ProductEditMetricsSection: Valid metrics to save:', validMetrics);
      
      // Update localStorage directly
      const portfolios = JSON.parse(localStorage.getItem('portfolios') || '[]');
      const portfolioIndex = portfolios.findIndex((p: any) => p.id === portfolio.id);
      
      if (portfolioIndex !== -1) {
        const productIndex = portfolios[portfolioIndex].products.findIndex((p: any) => p.id === product.id);
        
        if (productIndex !== -1) {
          // Initialize metrics array if it doesn't exist
          if (!portfolios[portfolioIndex].products[productIndex].metrics) {
            portfolios[portfolioIndex].products[productIndex].metrics = [];
          }
          
          // Remove existing metrics for this month/year
          portfolios[portfolioIndex].products[productIndex].metrics = portfolios[portfolioIndex].products[productIndex].metrics.filter(
            (m: any) => !(m.month === metricsMonth && m.year === metricsYear)
          );
          
          // Add new metrics
          portfolios[portfolioIndex].products[productIndex].metrics.push(...validMetrics);
          
          // Save to localStorage
          localStorage.setItem('portfolios', JSON.stringify(portfolios));
          console.log('ProductEditMetricsSection: Metrics saved to localStorage successfully');
          
          // Trigger storage event to notify other components
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'portfolios',
            newValue: JSON.stringify(portfolios)
          }));
          
          // Update local state with saved data to ensure consistency
          setMetrics(validMetrics);
          
          // Show success message
          alert('Metrics saved successfully!');
        } else {
          throw new Error('Product not found in portfolio');
        }
      } else {
        throw new Error('Portfolio not found');
      }
    } catch (error) {
      console.error('ProductEditMetricsSection: Error saving metrics:', error);
      alert('Failed to save metrics. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="space-y-6 font-['Pathway_Extreme']">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-tnq-blue">Product Metrics</h2>
        <MonthYearSelector
          selectedMonth={metricsMonth}
          selectedYear={metricsYear}
          onChange={handleMetricsMonthYearChange}
          className="compact tnq-font"
        />
      </div>
      
      <Card className="p-6">
        {metrics.length === 0 ? (
          <EmptyMetricsState onAddMetric={addNewMetric} />
        ) : (
          <div className="space-y-4">
            <MetricsTable
              metrics={metrics}
              onUpdateMetric={updateMetric}
              onRemoveMetric={removeMetric}
            />
            
            <MetricsActions
              onAddMetric={addNewMetric}
              onClearAll={handleClearAll}
              onSave={handleSave}
              saving={saving}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProductEditMetricsSection;
