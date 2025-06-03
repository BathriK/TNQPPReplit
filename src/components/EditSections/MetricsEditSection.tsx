
import React, { useState } from 'react';
import { useProductEdit } from '../../contexts/ProductEditContext';
import { saveProductChanges } from '../../services/productEditService';
import DataImportGrid from '../DataImportGrid';
import MonthYearSelector from '../MonthYearSelector';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { usePermissions } from '../../contexts/AuthContext';
import { Metric } from '../../lib/types';

const MetricsEditSection: React.FC = () => {
  const { canDelete } = usePermissions();
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

  const headers = ["Metric Name", "Value", "Unit", "Monthly Target", "Annual Target", "Status", "Notes"];
  
  const metricsData = metrics.map(metric => [
    metric.name,
    metric.value.toString(),
    metric.unit || "",
    metric.monthlyTarget?.toString() || "",
    metric.annualTarget?.toString() || "",
    metric.status || "on-track",
    metric.notes || ""
  ]);
  
  const handleSaveMetrics = (data: string[][]) => {
    const updatedMetrics: Metric[] = data.map((row, index) => {
      const existingMetric = index < metrics.length ? metrics[index] : null;
      
      return {
        id: existingMetric?.id || `metric-${index}-${Date.now()}`,
        name: row[0] || '',
        value: parseFloat(row[1]) || 0,
        unit: row[2] || '',
        monthlyTarget: row[3] ? parseFloat(row[3]) : undefined,
        annualTarget: row[4] ? parseFloat(row[4]) : undefined,
        month: metricsMonth,
        year: metricsYear,
        status: row[5] as "on-track" | "at-risk" | "off-track" || "on-track",
        notes: row[6] || undefined,
        timestamp: new Date().toISOString(),
        description: existingMetric?.description || ""
      };
    }).filter(metric => metric.name.trim() !== '');
    
    setMetrics(updatedMetrics);
  };

  const handleSave = async () => {
    if (!product) return;
    
    setSaving(true);
    console.log('Saving metrics via MetricsEditSection:', metrics);
    
    try {
      const success = await saveProductChanges(product.id, {
        metrics
      });

      if (success) {
        console.log('Metrics saved successfully, reloading page...');
        window.location.reload();
      } else {
        console.error('Save operation returned false');
        alert('Failed to save metrics. Please try again.');
      }
    } catch (error) {
      console.error('Error saving metrics:', error);
      alert('Error saving metrics. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Metrics</h2>
        <MonthYearSelector
          selectedMonth={metricsMonth}
          selectedYear={metricsYear}
          onChange={handleMetricsMonthYearChange}
          className="compact"
        />
      </div>
      
      <DataImportGrid
        title=""
        description=""
        headers={headers}
        initialData={metricsData}
        onSave={handleSaveMetrics}
        allowDelete={canDelete}
        allowAdd={canDelete}
      />
      
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2"
        >
          <Save size={16} />
          <span>{saving ? 'Saving...' : 'Save Metrics'}</span>
        </Button>
      </div>
    </div>
  );
};

export default MetricsEditSection;
