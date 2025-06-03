
import React, { useState } from "react";
import { useProductEdit } from "../../contexts/ProductEditContext";
import AddRoadmapForm from "../AddRoadmapForm";
import RoadmapTable from "../RoadmapTable";
import { Button } from "../ui/button";

interface RoadmapEditSectionProps {
  productId: string;
}

const RoadmapEditSection: React.FC<RoadmapEditSectionProps> = ({ productId }) => {
  const { product, selectedYear, setSelectedYear } = useProductEdit();
  const [isAddingRoadmap, setIsAddingRoadmap] = useState(false);

  const roadmaps = product?.roadmap?.filter((r: any) => r.year === selectedYear) || [];

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Roadmap</h2>
        <div className="flex items-center gap-4">
          <select 
            value={selectedYear}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className="px-3 py-1.5 border rounded-md text-sm"
          >
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          
          {!isAddingRoadmap && (
            <Button onClick={() => setIsAddingRoadmap(true)}>
              Add Roadmap
            </Button>
          )}
        </div>
      </div>

      {isAddingRoadmap ? (
        <AddRoadmapForm 
          productId={productId} 
          onRoadmapAdded={() => setIsAddingRoadmap(false)} 
          selectedYear={selectedYear}
        />
      ) : (
        <RoadmapTable roadmaps={roadmaps} productId={productId} />
      )}
    </div>
  );
};

export default RoadmapEditSection;
