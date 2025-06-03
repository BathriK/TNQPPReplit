
import React from 'react';
import ReleasePlanTable from '../ReleasePlanTable';
import MonthYearSelector from '../MonthYearSelector';
import VersionHistory from '../VersionHistory';
import { ReleasePlan } from '../../lib/types';
import { Link } from 'react-router-dom';

export interface PlanTabContentProps {
  productId: string;
  selectedMonth: number;
  selectedYear: number;
  releasePlanVersions: any[];
  selectedPlanId: string | null;
  onMonthYearChange: (month: number, year: number) => void;
  onVersionSelect: (id: string) => void;
  isEditMode?: boolean;
}

const PlanTabContent: React.FC<PlanTabContentProps> = ({
  productId,
  selectedMonth,
  selectedYear,
  releasePlanVersions,
  selectedPlanId,
  onMonthYearChange,
  onVersionSelect,
  isEditMode = false
}) => {
  const convertVersionsForHistory = (items: any[]) => {
    return items.map(item => ({
      id: item.id,
      version: typeof item.version === 'string' ? parseFloat(item.version) : item.version,
      createdAt: item.createdAt
    }));
  };

  const getSelectedPlan = () => {
    return releasePlanVersions.find(plan => plan.id === selectedPlanId) || null;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-blue-600">Release Plans</h2>
        
        <div className="flex items-center space-x-4">
          <MonthYearSelector 
            selectedMonth={selectedMonth} 
            selectedYear={selectedYear} 
            onChange={onMonthYearChange} 
            className="compact" 
          />
          <VersionHistory 
            items={convertVersionsForHistory(releasePlanVersions)} 
            onSelect={onVersionSelect} 
            currentId={selectedPlanId || ""} 
            onCreateNew={() => window.location.href = `/products/${productId}/edit?tab=plan`} 
          />
        </div>
      </div>
      
      {getSelectedPlan() && getSelectedPlan()?.items && getSelectedPlan()?.items.length > 0 ? (
        <ReleasePlanTable plans={[getSelectedPlan()]} />
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No release plans available for this period</p>
          {isEditMode && (
            <Link to={`/products/${productId}/edit?tab=plan`} className="text-blue-600 hover:underline">
              Add Release Plans
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default PlanTabContent;
