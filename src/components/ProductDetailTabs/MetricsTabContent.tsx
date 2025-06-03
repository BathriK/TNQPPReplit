
import React from 'react';
import MetricsDisplay from '../MetricsDisplay';
import MonthYearSelector from '../MonthYearSelector';
import { Metric } from '../../lib/types';

export interface MetricsTabContentProps {
  selectedMonth: number;
  selectedYear: number;
  metrics: Metric[];
  onMonthYearChange: (month: number, year: number) => void;
  isEditMode?: boolean;
}

const MetricsTabContent: React.FC<MetricsTabContentProps> = ({
  selectedMonth,
  selectedYear,
  metrics,
  onMonthYearChange,
  isEditMode = false
}) => {
  console.log('MetricsTabContent: Rendering with:', {
    selectedMonth,
    selectedYear,
    totalMetrics: metrics.length,
    filteredMetrics: metrics.filter(m => m.month === selectedMonth && m.year === selectedYear).length,
    isEditMode
  });

  const filteredMetrics = metrics.filter(m => m.month === selectedMonth && m.year === selectedYear);
  
  console.log('MetricsTabContent: Filtered metrics for display:', filteredMetrics);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-blue-600">Product Metrics</h2>
        
        <div className="flex items-center">
          <MonthYearSelector 
            selectedMonth={selectedMonth} 
            selectedYear={selectedYear} 
            onChange={onMonthYearChange} 
            className="compact" 
          />
        </div>
      </div>
      
      {filteredMetrics.length > 0 ? (
        <>
          <p className="text-sm text-gray-600 mb-4">
            Showing {filteredMetrics.length} metrics for {selectedMonth}/{selectedYear}
          </p>
          <MetricsDisplay 
            metrics={filteredMetrics} 
            detailed={true} 
          />
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">No metrics found for {selectedMonth}/{selectedYear}</p>
          <p className="text-sm text-gray-400">
            Total metrics available: {metrics.length}
          </p>
          {metrics.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-400">Available periods:</p>
              <ul className="text-sm text-gray-400">
                {Array.from(new Set(metrics.map(m => `${m.month}/${m.year}`))).map(period => (
                  <li key={period}>{period}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MetricsTabContent;
