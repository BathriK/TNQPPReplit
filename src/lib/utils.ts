import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { Product, Portfolio, GoalItem, SearchResult } from "./types";

// Helper function for combining class names (used by shadcn components)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to readable string
export function formatDate(date: string) {
  if (!date) return "";
  return format(new Date(date), "MMM d, yyyy");
}

// Get month name from month number
export function getMonthName(month: number) {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[month - 1] || "";
}

// Get month and year as a formatted string (e.g., "January 2023")
export function getMonthYear(month: number, year: number) {
  return `${getMonthName(month)} ${year}`;
}

// Get current month and year
export function getCurrentMonthYear() {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear()
  };
}

// Get previous month and year
export function getPreviousMonthYear() {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear()
  };
}

// Generate a unique ID
export function generateId() {
  return `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Helper to get a random item from an array
export function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper to get a random integer within a range
export function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to search portfolios and products
export function searchPortfolios(portfolios: Portfolio[], query: string): SearchResult[] {
  if (!query.trim()) return [];
  
  // Convert query to lowercase for case-insensitive matching
  const queryLower = query.toLowerCase();
  const results: SearchResult[] = [];
  
  portfolios.forEach(portfolio => {
    // Search portfolio name
    if (portfolio.name.toLowerCase().includes(queryLower)) {
      results.push({
        type: 'portfolio',
        id: portfolio.id,
        name: portfolio.name,
        portfolioId: portfolio.id,
        portfolioName: portfolio.name,
        matchField: 'name',
        matchValue: portfolio.name
      });
    }
    
    // Search portfolio products
    portfolio.products.forEach(product => {
      // Search product name
      if (product.name.toLowerCase().includes(queryLower)) {
        results.push({
          type: 'product',
          id: product.id,
          name: product.name,
          portfolioId: portfolio.id,
          portfolioName: portfolio.name,
          matchField: 'name',
          matchValue: product.name
        });
      }
      
      // Search product description
      if (product.description && product.description.toLowerCase().includes(queryLower)) {
        results.push({
          type: 'product',
          id: product.id,
          name: product.name,
          portfolioId: portfolio.id,
          portfolioName: portfolio.name,
          matchField: 'description',
          matchValue: product.description
        });
      }
      
      // Search product goals
      product.releaseGoals.forEach(releaseGoal => {
        if (releaseGoal.goals && releaseGoal.goals.length > 0) {
          // New format goals
          releaseGoal.goals.forEach(goal => {
            if (
              (goal.description && goal.description.toLowerCase().includes(queryLower)) ||
              (goal.currentState && goal.currentState.toLowerCase().includes(queryLower)) ||
              (goal.targetState && goal.targetState.toLowerCase().includes(queryLower))
            ) {
              results.push({
                type: 'product',
                id: product.id,
                name: product.name,
                portfolioId: portfolio.id,
                portfolioName: portfolio.name,
                matchField: 'goals',
                matchValue: goal.description || ''
              });
            }
          });
        } else if (releaseGoal.goal) {
          // Legacy format goal
          if (
            releaseGoal.goal.toLowerCase().includes(queryLower) ||
            (releaseGoal.currentState && releaseGoal.currentState.toLowerCase().includes(queryLower)) ||
            (releaseGoal.futureState && releaseGoal.futureState.toLowerCase().includes(queryLower))
          ) {
            results.push({
              type: 'product',
              id: product.id,
              name: product.name,
              portfolioId: portfolio.id,
              portfolioName: portfolio.name,
              matchField: 'goal',
              matchValue: releaseGoal.goal
            });
          }
        }
      });
      
      // Search release plans
      product.releasePlans.forEach(plan => {
        if (plan.items && plan.items.length > 0) {
          plan.items.forEach(item => {
            if (
              (item.title && item.title.toLowerCase().includes(queryLower)) ||
              (item.description && item.description.toLowerCase().includes(queryLower))
            ) {
              results.push({
                type: 'product',
                id: product.id,
                name: product.name,
                portfolioId: portfolio.id,
                portfolioName: portfolio.name,
                matchField: 'plan',
                matchValue: item.title
              });
            }
          });
        }
      });
      
      // Search metrics
      product.metrics.forEach(metric => {
        if (
          (metric.name && metric.name.toLowerCase().includes(queryLower)) ||
          (metric.description && metric.description.toLowerCase().includes(queryLower))
        ) {
          results.push({
            type: 'product',
            id: product.id,
            name: product.name,
            portfolioId: portfolio.id,
            portfolioName: portfolio.name,
            matchField: 'metric',
            matchValue: metric.name
          });
        }
      });
    });
  });
  
  // Remove duplicates by id and type (keep the first occurrence)
  const uniqueResults = results.filter((result, index, self) => 
    index === self.findIndex(r => r.id === result.id && r.type === result.type && r.matchField === result.matchField)
  );
  
  return uniqueResults.slice(0, 15); // Return top 15 results
}

// Check if two arrays have the same elements (order doesn't matter)
export function arraysHaveSameElements<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) return false;
  const set1 = new Set(arr1);
  return arr2.every(item => set1.has(item));
}

// Deep compare two objects for structural equality
export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  if (obj1 === null || obj2 === null) return false;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
}

// Find differences between two metrics arrays
export function findMetricsDifferences(oldMetrics: any[], newMetrics: any[]) {
  const added = newMetrics.filter(newItem => 
    !oldMetrics.some(oldItem => oldItem.id === newItem.id)
  );
  
  const deleted = oldMetrics.filter(oldItem => 
    !newMetrics.some(newItem => newItem.id === oldItem.id)
  );
  
  const changed = newMetrics.filter(newItem => {
    const oldItem = oldMetrics.find(o => o.id === newItem.id);
    return oldItem && !deepEqual(oldItem, newItem);
  });
  
  return { added, deleted, changed };
}

// Find differences between two release goals
export function findGoalsDifferences(oldGoals: GoalItem[], newGoals: GoalItem[]) {
  const added = newGoals.filter(newItem => 
    !oldGoals.some(oldItem => oldItem.id === newItem.id)
  );
  
  const deleted = oldGoals.filter(oldItem => 
    !newGoals.some(newItem => newItem.id === oldItem.id)
  );
  
  const changed = newGoals.filter(newItem => {
    const oldItem = oldGoals.find(o => o.id === newItem.id);
    return oldItem && !deepEqual(oldItem, newItem);
  });
  
  return { added, deleted, changed };
}

// Find differences between two plan items arrays
export function findPlanDifferences(oldPlan: any[], newPlan: any[]) {
  const added = newPlan.filter(newItem => 
    !oldPlan.some(oldItem => oldItem.id === newItem.id)
  );
  
  const deleted = oldPlan.filter(oldItem => 
    !newPlan.some(newItem => newItem.id === oldItem.id)
  );
  
  const changed = newPlan.filter(newItem => {
    const oldItem = oldPlan.find(o => o.id === newItem.id);
    return oldItem && !deepEqual(oldItem, newItem);
  });
  
  return { added, deleted, changed };
}
