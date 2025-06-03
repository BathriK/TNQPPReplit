
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { usePermissions } from '../contexts/AuthContext';
import { Target, AlertCircle } from 'lucide-react';
import { getPortfolios } from '../lib/data';
import type { Portfolio, ProductObjective } from '../lib/types';
import { ProductSection } from '../components/OKRComponents/ProductSection';
import { ObjectiveEditDialog } from '../components/OKRComponents/ObjectiveEditDialog';
import { loadProductObjectives, saveProductObjectives, updateObjective, deleteObjective } from '../services/okrService';

const AnnualOKRs = () => {
  const { canEdit } = usePermissions();
  const [editingObjective, setEditingObjective] = useState<ProductObjective | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [addingNew, setAddingNew] = useState<string | null>(null);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [productObjectives, setProductObjectives] = useState<ProductObjective[]>([]);
  
  // Load portfolios data
  useEffect(() => {
    const loadPortfolios = async () => {
      try {
        const data = await getPortfolios();
        setPortfolios(data);
        // Initialize all sections as expanded
        const initialExpanded: Record<string, boolean> = {};
        data.forEach(portfolio => {
          portfolio.products.forEach(product => {
            initialExpanded[product.id] = true;
          });
        });
        setExpandedSections(initialExpanded);
      } catch (error) {
        console.error('Error loading portfolios:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadPortfolios();
  }, []);

  // Load OKR objectives from service
  useEffect(() => {
    const loadObjectives = () => {
      const objectives = loadProductObjectives();
      setProductObjectives(objectives);
      console.log('Loaded OKR objectives:', objectives.length);
    };
    
    loadObjectives();
  }, []);

  const [newObjective, setNewObjective] = useState<Partial<ProductObjective>>({
    title: '',
    description: '',
    status: 'Not Started',
    priority: 1,
    initiatives: [],
    expectedBenefits: []
  });

  const handleAddObjective = (productId: string) => {
    if (newObjective.title && newObjective.description) {
      const objective: ProductObjective = {
        id: Date.now().toString(),
        title: newObjective.title,
        description: newObjective.description,
        status: newObjective.status as ProductObjective['status'],
        priority: newObjective.priority || 1,
        productId: productId,
        initiatives: newObjective.initiatives || [],
        expectedBenefits: newObjective.expectedBenefits || []
      };
      
      const updatedObjectives = [...productObjectives, objective];
      setProductObjectives(updatedObjectives);
      saveProductObjectives(updatedObjectives);
      
      setNewObjective({ title: '', description: '', status: 'Not Started', priority: 1, initiatives: [], expectedBenefits: [] });
      setAddingNew(null);
      
      console.log('Added new objective:', objective.title);
    }
  };

  const getObjectivesForProduct = (productId: string) => {
    return productObjectives.filter(obj => obj.productId === productId).sort((a, b) => a.priority - b.priority);
  };

  const toggleSection = (productId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const handleEdit = (objectiveId: string) => {
    console.log('Edit button clicked for objective:', objectiveId);
    const objective = productObjectives.find(obj => obj.id === objectiveId);
    if (objective) {
      setEditingObjective(objective);
      setIsEditDialogOpen(true);
    }
  };

  const handleSaveEdit = (updatedObjective: ProductObjective) => {
    console.log('Saving edited objective:', updatedObjective.title);
    
    // Update the local state immediately
    const updatedObjectives = productObjectives.map(obj => 
      obj.id === updatedObjective.id ? updatedObjective : obj
    );
    
    // Update state first
    setProductObjectives(updatedObjectives);
    
    // Then persist to localStorage
    const success = saveProductObjectives(updatedObjectives);
    
    if (success) {
      console.log('OKR objective saved successfully to localStorage');
      // Close the dialog
      setEditingObjective(null);
      setIsEditDialogOpen(false);
    } else {
      console.error('Failed to save OKR objective');
      // Optionally show an error message to the user
    }
  };

  const handleDeleteObjective = (objectiveId: string) => {
    const updatedObjectives = deleteObjective(productObjectives, objectiveId);
    setProductObjectives(updatedObjectives);
    console.log('Deleted objective:', objectiveId);
  };

  const handleCancelAdd = () => {
    setAddingNew(null);
    setNewObjective({ title: '', description: '', status: 'Not Started', priority: 1, initiatives: [], expectedBenefits: [] });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-tnq-lightgray">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-tnq-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tnq-lightgray">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Target className="h-6 w-6 text-tnq-blue" />
            <h1 className="text-2xl font-semibold text-tnq-navy">Annual OKRs - Product Objectives</h1>
          </div>
          <p className="text-tnq-navy text-sm">Objectives and Key Results for 2025 - Structured for PM Updates</p>
        </div>

        {/* Product Sections */}
        <div className="space-y-6">
          {portfolios.map(portfolio => 
            portfolio.products.map(product => {
              const objectives = getObjectivesForProduct(product.id);
              const isExpanded = expandedSections[product.id];
              
              return (
                <ProductSection
                  key={product.id}
                  product={product}
                  objectives={objectives}
                  isExpanded={isExpanded}
                  canEdit={canEdit}
                  addingNew={addingNew}
                  newObjective={newObjective}
                  setNewObjective={setNewObjective}
                  onToggleSection={toggleSection}
                  onAddNew={setAddingNew}
                  onEdit={handleEdit}
                  onSaveObjective={handleAddObjective}
                  onCancelAdd={handleCancelAdd}
                />
              );
            })
          )}
        </div>

        {!canEdit && (
          <div className="text-center py-6">
            <p className="text-tnq-navy bg-blue-100 rounded-lg p-3 inline-block text-sm">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              You have view-only access. Contact a Product Manager or Administrator to make changes.
            </p>
          </div>
        )}
      </main>

      {/* Edit Dialog */}
      <ObjectiveEditDialog
        objective={editingObjective}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingObjective(null);
        }}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default AnnualOKRs;
