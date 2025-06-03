
import React from 'react';
import RoadmapTable from '../RoadmapTable';
import MonthYearSelector from '../MonthYearSelector';
import VersionHistory from '../VersionHistory';
import { Roadmap } from '../../lib/types';
import { Link } from 'react-router-dom';

export interface RoadmapTabContentProps {
  productId: string;
  selectedYear: number;
  roadmapVersions: any[];
  selectedRoadmapId: string | null;
  onYearChange: (month: number, year: number) => void;
  onVersionSelect: (id: string) => void;
  isEditMode?: boolean;
}

const RoadmapTabContent: React.FC<RoadmapTabContentProps> = ({
  productId,
  selectedYear,
  roadmapVersions,
  selectedRoadmapId,
  onYearChange,
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-blue-600">Roadmap</h2>
        
        <div className="flex items-center space-x-4">
          <MonthYearSelector 
            selectedMonth={1} 
            selectedYear={selectedYear} 
            onChange={onYearChange} 
            className="compact" 
            yearOnly={true}
          />
          <VersionHistory 
            items={convertVersionsForHistory(roadmapVersions)} 
            onSelect={onVersionSelect} 
            currentId={selectedRoadmapId || ""} 
            onCreateNew={() => window.location.href = `/products/${productId}/edit?tab=roadmap`} 
          />
        </div>
      </div>
      
      {roadmapVersions.length > 0 ? (
        <RoadmapTable 
          roadmaps={roadmapVersions} 
          productId={productId} 
        />
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No roadmaps available for this year</p>
          {isEditMode && (
            <Link to={`/products/${productId}/edit?tab=roadmap`} className="text-blue-600 hover:underline">
              Add Roadmap
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default RoadmapTabContent;
