import React from 'react';
import GoalsTable from '../GoalsTable';
import { Link } from 'react-router-dom';
import MonthYearSelector from '../MonthYearSelector';
import VersionHistory from '../VersionHistory';
import { GoalItem } from '@/lib/types';

export interface GoalsTabContentProps {
  productId: string;
  selectedMonth: number;
  selectedYear: number;
  releaseGoalVersions: any[];
  selectedGoalId: string | null;
  onMonthYearChange: (month: number, year: number) => void;
  onVersionSelect: (id: string) => void;
  isEditMode?: boolean;
}

const GoalsTabContent: React.FC<GoalsTabContentProps> = ({
  productId,
  selectedMonth,
  selectedYear,
  releaseGoalVersions,
  selectedGoalId,
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

  const getSelectedGoal = () => {
    return releaseGoalVersions.find(goal => goal.id === selectedGoalId) || null;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-blue-600">Release Goals</h2>
        
        <div className="flex items-center space-x-4">
          <MonthYearSelector 
            selectedMonth={selectedMonth} 
            selectedYear={selectedYear} 
            onChange={onMonthYearChange} 
            className="compact" 
          />
          <VersionHistory 
            items={convertVersionsForHistory(releaseGoalVersions)} 
            onSelect={onVersionSelect} 
            currentId={selectedGoalId || ""} 
            onCreateNew={() => window.location.href = `/products/${productId}/edit?tab=goals`} 
          />
        </div>
      </div>
      
      {getSelectedGoal() && getSelectedGoal()?.goals && getSelectedGoal()?.goals.length > 0 ? (
        <GoalsTable goals={getSelectedGoal()?.goals || []} />
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No release goals available for this period</p>
          {isEditMode && (
            <Link to={`/products/${productId}/edit?tab=goals`} className="text-blue-600 hover:underline">
              Add Release Goals
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default GoalsTabContent;
