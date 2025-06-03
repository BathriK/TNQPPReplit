
import React from 'react';
import { Link } from 'react-router-dom';
import { ReleasePlan } from '../lib/types';
import { getMonthName } from '../lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';

interface ReleasePlanCardProps {
  productId: string;
  latestReleasePlan: ReleasePlan | undefined;
}

const ReleasePlanCard: React.FC<ReleasePlanCardProps> = ({ productId, latestReleasePlan }) => {
  // Format month and year
  const getMonthYear = (month: number, year: number) => {
    return `${getMonthName(month)} ${year}`;
  };

  // Get category color based on category type
  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'Enhancement':
        return 'bg-soft-green text-green-800';
      case 'Bug':
        return 'bg-soft-pink text-red-800';
      case 'Improvement':
        return 'bg-soft-yellow text-yellow-800';
      case 'Clarification':
        return 'bg-soft-blue text-blue-800';
      case 'Training':
        return 'bg-soft-orange text-orange-800';
      default:
        return 'bg-soft-gray text-gray-800';
    }
  };

  // Get the plan data to display - either from nested items or individual properties
  const getPlanData = (plan: ReleasePlan) => {
    if (plan.items && plan.items.length > 0) {
      return plan.items[0]; // Show first item from nested structure
    }
    // Use individual properties
    return {
      title: plan.title,
      category: plan.category || 'Enhancement'
    };
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold text-gray-700">Release Plan</h4>
        <Link 
          to={`/products/${productId}`}
          state={{ activeTab: "plan" }}
          className="text-xs text-tnq-blue hover:text-tnq-navyBlue hover:underline"
        >
          View All
        </Link>
      </div>
      
      {latestReleasePlan ? (
        <div className="bg-gray-50 p-3 rounded-md h-full border border-[#D9E2EC]">
          <div className="flex justify-between items-center mb-3">
            <span className="font-medium text-sm">
              {getMonthYear(latestReleasePlan.month, latestReleasePlan.year)}
            </span>
            <span className="text-xs text-white bg-tnq-blue px-2 py-0.5 rounded-full">
              v{latestReleasePlan.version}
            </span>
          </div>
          
          <div className="rounded-md border border-[#D9E2EC] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-1 px-2 text-xs">Feature Name</TableHead>
                  <TableHead className="py-1 px-2 text-xs">Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  {(() => {
                    const planData = getPlanData(latestReleasePlan);
                    return (
                      <>
                        <TableCell className="py-1 px-2 text-xs">{planData.title}</TableCell>
                        <TableCell className="py-1 px-2 text-xs">
                          <Badge className={`${getCategoryColor(planData.category || 'Enhancement')} font-normal px-2 py-0.5 text-xs`}>
                            {planData.category || 'Enhancement'}
                          </Badge>
                        </TableCell>
                      </>
                    );
                  })()}
                </TableRow>
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-2 text-right">
            <Link
              to={`/products/${productId}`}
              state={{ activeTab: "plan" }}
              className="text-xs text-tnq-blue hover:text-tnq-navyBlue hover:underline"
            >
              View Details
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">No release plans available</p>
      )}
    </div>
  );
};

export default ReleasePlanCard;
