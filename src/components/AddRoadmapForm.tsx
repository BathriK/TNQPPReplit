
import React, { useState } from 'react';
import { getPortfolios, findProductById, updatePortfolios } from '../lib/data';
import { generateId } from '../lib/utils';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { toast } from '../hooks/use-toast';

interface AddRoadmapFormProps {
  productId: string;
  onRoadmapAdded: () => void;
  selectedYear: number;
}

const AddRoadmapForm: React.FC<AddRoadmapFormProps> = ({ productId, onRoadmapAdded, selectedYear }) => {
  const [roadmapLink, setRoadmapLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roadmapLink || !roadmapLink.trim()) {
      toast({ 
        title: "Error",
        description: "Please enter a link to the roadmap",
        variant: "destructive" 
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get the product info
      const result = await findProductById(productId);
      const foundProduct = result.product;
      const foundPortfolio = result.portfolio;
      
      if (!foundProduct || !foundPortfolio) {
        throw new Error('Product or portfolio not found');
      }
      
      // Prepare new roadmap entries for each quarter
      const now = new Date().toISOString();
      
      // Find existing roadmap versions for this year to calculate the new version
      const existingRoadmaps = foundProduct.roadmap.filter(r => r.year === selectedYear);
      const newVersionNumber = existingRoadmaps.length > 0 
        ? Math.max(...existingRoadmaps.map(r => parseFloat(r.version))) + 0.1 
        : 1.0;
      
      const newRoadmapEntries = [
        {
          id: generateId(),
          year: selectedYear,
          quarter: 1 as 1 | 2 | 3 | 4,
          title: "Q1 Roadmap Item",
          description: "Q1 roadmap item from Google Sheets",
          status: "planned" as const,
          createdAt: now,
          version: newVersionNumber.toString(),
          link: roadmapLink.trim()
        },
        {
          id: generateId(),
          year: selectedYear,
          quarter: 2 as 1 | 2 | 3 | 4,
          title: "Q2 Roadmap Item",
          description: "Q2 roadmap item from Google Sheets",
          status: "planned" as const,
          createdAt: now,
          version: newVersionNumber.toString(),
          link: roadmapLink.trim()
        },
        {
          id: generateId(),
          year: selectedYear,
          quarter: 3 as 1 | 2 | 3 | 4,
          title: "Q3 Roadmap Item",
          description: "Q3 roadmap item from Google Sheets",
          status: "planned" as const,
          createdAt: now,
          version: newVersionNumber.toString(),
          link: roadmapLink.trim()
        },
        {
          id: generateId(),
          year: selectedYear,
          quarter: 4 as 1 | 2 | 3 | 4,
          title: "Q4 Roadmap Item",
          description: "Q4 roadmap item from Google Sheets",
          status: "planned" as const,
          createdAt: now,
          version: newVersionNumber.toString(),
          link: roadmapLink.trim()
        }
      ];
      
      // Add the new roadmap entries to the product
      foundProduct.roadmap.unshift(...newRoadmapEntries);
      
      // Get all portfolios and update the current one
      const portfolios = await getPortfolios();
      const portfolioIndex = portfolios.findIndex(p => p.id === foundPortfolio.id);
      
      if (portfolioIndex === -1) {
        throw new Error('Portfolio not found in the portfolio list');
      }
      
      const productIndex = portfolios[portfolioIndex].products.findIndex(p => p.id === productId);
      
      if (productIndex === -1) {
        throw new Error('Product not found in the portfolio');
      }
      
      // Update the product in the portfolios array
      portfolios[portfolioIndex].products[productIndex] = foundProduct;
      
      // Save the updated portfolios
      await updatePortfolios(portfolios);
      
      toast({
        title: "Success",
        description: "Roadmap link added successfully",
      });
      
      // Reset form and notify parent component
      setRoadmapLink('');
      onRoadmapAdded();
    } catch (error) {
      console.error('Error adding roadmap:', error);
      toast({
        title: "Error",
        description: "Failed to add roadmap",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Google Sheet Link
        </label>
        <Input
          type="url"
          value={roadmapLink}
          onChange={(e) => setRoadmapLink(e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          className="w-full"
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          Enter the link to the Google Sheet containing the roadmap information
        </p>
      </div>
      
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add Roadmap'}
        </Button>
      </div>
    </form>
  );
};

export default AddRoadmapForm;
