
import type { ProductObjective } from '../lib/types';

const OKR_STORAGE_KEY = 'productObjectives';

export const saveProductObjectives = (objectives: ProductObjective[]): boolean => {
  try {
    const dataToSave = JSON.stringify(objectives, null, 2);
    localStorage.setItem(OKR_STORAGE_KEY, dataToSave);
    console.log('OKR objectives saved successfully to localStorage:', objectives.length, 'objectives');
    return true;
  } catch (error) {
    console.error('Error saving OKR objectives to localStorage:', error);
    return false;
  }
};

export const loadProductObjectives = (): ProductObjective[] => {
  try {
    const stored = localStorage.getItem(OKR_STORAGE_KEY);
    if (stored) {
      const objectives = JSON.parse(stored);
      console.log('Loaded OKR objectives from localStorage:', objectives.length, 'objectives');
      return objectives;
    }
    
    // Return sample data if nothing stored
    console.log('No stored objectives found, returning sample data');
    return getSampleObjectives();
  } catch (error) {
    console.error('Error loading OKR objectives from localStorage:', error);
    console.log('Returning sample data due to error');
    return getSampleObjectives();
  }
};

export const updateObjective = (objectives: ProductObjective[], updatedObjective: ProductObjective): ProductObjective[] => {
  console.log('Updating objective:', updatedObjective.id, updatedObjective.title);
  const updatedObjectives = objectives.map(obj => 
    obj.id === updatedObjective.id ? updatedObjective : obj
  );
  
  const saved = saveProductObjectives(updatedObjectives);
  if (saved) {
    console.log('Objective updated and saved successfully');
  } else {
    console.error('Failed to save updated objective');
  }
  
  return updatedObjectives;
};

export const deleteObjective = (objectives: ProductObjective[], objectiveId: string): ProductObjective[] => {
  console.log('Deleting objective:', objectiveId);
  const updatedObjectives = objectives.filter(obj => obj.id !== objectiveId);
  
  const saved = saveProductObjectives(updatedObjectives);
  if (saved) {
    console.log('Objective deleted and saved successfully');
  } else {
    console.error('Failed to save after deleting objective');
  }
  
  return updatedObjectives;
};

export const addObjective = (objectives: ProductObjective[], newObjective: ProductObjective): ProductObjective[] => {
  console.log('Adding new objective:', newObjective.title);
  const updatedObjectives = [...objectives, newObjective];
  
  const saved = saveProductObjectives(updatedObjectives);
  if (saved) {
    console.log('New objective added and saved successfully');
  } else {
    console.error('Failed to save new objective');
  }
  
  return updatedObjectives;
};

const getSampleObjectives = (): ProductObjective[] => [
  {
    id: '1',
    title: 'Make structuring more efficient - TAT, TT and FTR',
    description: 'Improve processing efficiency across all key metrics',
    productId: '1',
    priority: 1,
    status: 'In Progress',
    initiatives: [
      {
        id: '1-1',
        title: 'Rollout to all FTV accounts',
        description: 'Deploy to all FTV customer accounts with systematic approach',
        targetDate: 'Mar 2026',
        status: 'In Progress',
        progress: 65
      },
      {
        id: '1-2', 
        title: 'Efficiency gains',
        description: 'Optimize processing workflows and reduce manual intervention',
        targetDate: 'Dec 2025',
        status: 'In Progress',
        progress: 40
      },
      {
        id: '1-3',
        title: 'Adoption rate',
        description: 'Increase customer adoption of new features',
        targetDate: 'Jun 2025',
        status: 'Not Started',
        progress: 0
      }
    ],
    expectedBenefits: [
      {
        id: '1-b1',
        title: 'LeMans Deployment',
        description: 'Starting with LeMans (01) deployment and stabilization to be completed for all FTV customers by March 2026',
        targetValue: 'March 2026',
        metricType: 'Timeline',
        status: 'In Progress'
      },
      {
        id: '1-b2',
        title: 'TT Benefit',
        description: 'Achieve a minimum TT benefit of 10% upon deployment (baseline: Dec 2024)',
        targetValue: '10% improvement',
        metricType: 'Performance',
        status: 'In Progress'
      },
      {
        id: '1-b3',
        title: 'FTR for FTV accounts',
        description: 'Achieve the 90% FuB FTR for FTV all accounts (baseline: Dec 2024)',
        targetValue: '90% FTR',
        metricType: 'Quality',
        status: 'Not Started'
      },
      {
        id: '1-b4',
        title: 'DOCX Processing',
        description: 'A minimum of 80% (100+60) of DOCX submissions processed via XML',
        targetValue: '80% processing rate',
        metricType: 'Coverage',
        status: 'Not Started'
      }
    ]
  },
  {
    id: '2',
    title: 'Make content distribution and searchability better',
    description: 'Enhance content delivery and discoverability capabilities',
    productId: '2',
    priority: 2,
    status: 'Not Started',
    initiatives: [
      {
        id: '2-1',
        title: 'Content indexing optimization',
        description: 'Improve search algorithms and content categorization',
        targetDate: 'Sep 2025',
        status: 'Not Started',
        progress: 0
      }
    ],
    expectedBenefits: [
      {
        id: '2-b1',
        title: 'Search Performance',
        description: 'Improve content discovery rates by 50%',
        targetValue: '50% improvement',
        metricType: 'Performance',
        status: 'Not Started'
      }
    ]
  }
];
