
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface EmptyMetricsStateProps {
  onAddMetric: () => void;
}

const EmptyMetricsState: React.FC<EmptyMetricsStateProps> = ({ onAddMetric }) => {
  return (
    <div className="text-center py-8 text-gray-500">
      <p className="mb-4 tnq-font">No metrics available</p>
      <Button onClick={onAddMetric} className="tnq-button">
        <Plus size={16} className="mr-2" />
        Add Metric
      </Button>
    </div>
  );
};

export default EmptyMetricsState;
