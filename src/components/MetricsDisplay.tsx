
import React from 'react';
import { Metric } from '../lib/types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricsDisplayProps {
  metrics: Metric[];
  detailed?: boolean;
}

const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ metrics, detailed = false }) => {
  if (!metrics || metrics.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No metrics data available for this period.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'on-track': 'bg-green-100 text-green-800',
      'at-risk': 'bg-yellow-100 text-yellow-800', 
      'off-track': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status === 'on-track' ? 'On Track' : status === 'at-risk' ? 'At Risk' : 'Off Track'}
      </span>
    );
  };

  const getTrendIcon = (current: number, previous?: number) => {
    if (!previous) return <Minus size={16} className="text-gray-400" />;
    
    if (current > previous) {
      return <TrendingUp size={16} className="text-green-600" />;
    } else if (current < previous) {
      return <TrendingDown size={16} className="text-red-600" />;
    } else {
      return <Minus size={16} className="text-gray-400" />;
    }
  };

  const formatTarget = (target?: number) => {
    return target ? target.toString() : 'N/A';
  };

  if (detailed) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-tnq-navyBlue">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-white text-sm">Metric Name</th>
              <th className="text-left py-3 px-4 font-medium text-white text-sm">Value</th>
              <th className="text-left py-3 px-4 font-medium text-white text-sm">Unit</th>
              <th className="text-left py-3 px-4 font-medium text-white text-sm">Monthly Target</th>
              <th className="text-left py-3 px-4 font-medium text-white text-sm">Annual Target</th>
              <th className="text-left py-3 px-4 font-medium text-white text-sm">Status</th>
              <th className="text-left py-3 px-4 font-medium text-white text-sm">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {metrics.map((metric) => (
              <tr key={metric.id} title={metric.notes || 'No notes available'}>
                <td className="py-3 px-4 text-tnq-navy text-sm font-medium">{metric.name}</td>
                <td className="py-3 px-4 text-tnq-navy text-sm">{metric.value}</td>
                <td className="py-3 px-4 text-tnq-navy text-sm">{metric.unit}</td>
                <td className="py-3 px-4 text-tnq-navy text-sm">{formatTarget(metric.monthlyTarget)}</td>
                <td className="py-3 px-4 text-tnq-navy text-sm">{formatTarget(metric.annualTarget)}</td>
                <td className="py-3 px-4 text-sm">{getStatusBadge(metric.status || 'on-track')}</td>
                <td className="py-3 px-4">{getTrendIcon(metric.value, metric.previousValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Dashboard view with responsive grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <div key={metric.id} className="bg-white p-4 rounded-lg shadow-sm border" title={metric.notes || 'No notes available'}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-tnq-navy truncate">{metric.name}</h3>
            {getTrendIcon(metric.value, metric.previousValue)}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-bold text-tnq-navy">{metric.value}</span>
              <span className="text-sm text-gray-500">{metric.unit}</span>
            </div>
            
            <div className="text-xs text-gray-600 space-y-1">
              <div>Monthly Target: {formatTarget(metric.monthlyTarget)}</div>
              <div>Annual Target: {formatTarget(metric.annualTarget)}</div>
            </div>
            
            <div className="flex justify-between items-center">
              {getStatusBadge(metric.status || 'on-track')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsDisplay;
