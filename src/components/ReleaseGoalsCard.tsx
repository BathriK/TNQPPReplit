
import React from 'react';
import { Link } from 'react-router-dom';
import { ReleaseGoal } from '../lib/types';
import { getMonthName } from '../lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface ReleaseGoalsCardProps {
  productId: string;
  latestReleaseGoal: ReleaseGoal | undefined;
}

const ReleaseGoalsCard: React.FC<ReleaseGoalsCardProps> = ({ productId, latestReleaseGoal }) => {
  // Format month and year
  const getMonthYear = (month: number, year: number) => {
    return `${getMonthName(month)} ${year}`;
  };

  // Get the goal data to display - either from nested goals or individual properties
  const getGoalData = (goal: ReleaseGoal) => {
    if (goal.goals && goal.goals.length > 0) {
      return goal.goals[0]; // Show first goal from nested structure
    }
    // Use individual properties
    return {
      description: goal.description,
      currentState: goal.currentState,
      targetState: goal.targetState
    };
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold text-gray-700">Release Goals</h4>
        <Link 
          to={`/products/${productId}`}
          state={{ activeTab: "goals" }}
          className="text-xs text-tnq-blue hover:text-tnq-navyBlue hover:underline"
        >
          View All
        </Link>
      </div>
      
      {latestReleaseGoal ? (
        <div className="bg-gray-50 p-3 rounded-md h-full border border-[#D9E2EC]">
          <div className="flex justify-between items-center mb-3">
            <span className="font-medium text-sm">
              {getMonthYear(latestReleaseGoal.month, latestReleaseGoal.year)}
            </span>
            <span className="text-xs text-white bg-tnq-blue px-2 py-0.5 rounded-full">
              v{latestReleaseGoal.version}
            </span>
          </div>
          
          <div className="rounded-md border border-[#D9E2EC] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-1 px-2 text-xs">Goal Description</TableHead>
                  <TableHead className="py-1 px-2 text-xs">Current State</TableHead>
                  <TableHead className="py-1 px-2 text-xs">Target</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  {(() => {
                    const goalData = getGoalData(latestReleaseGoal);
                    return (
                      <>
                        <TableCell className="py-1 px-2 text-xs">{goalData.description}</TableCell>
                        <TableCell className="py-1 px-2 text-xs">{goalData.currentState}</TableCell>
                        <TableCell className="py-1 px-2 text-xs">{goalData.targetState}</TableCell>
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
              state={{ activeTab: "goals" }}
              className="text-xs text-tnq-blue hover:text-tnq-navyBlue hover:underline"
            >
              View Details
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">No release goals defined</p>
      )}
    </div>
  );
};

export default ReleaseGoalsCard;
