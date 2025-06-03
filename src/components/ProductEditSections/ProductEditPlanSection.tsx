import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductEdit } from '../../contexts/ProductEditContext';
import { saveProductChanges } from '../../services/productEditService';
import MonthYearSelector from '../MonthYearSelector';
import { Button } from '@/components/ui/button';
import { Save, Plus, Clipboard, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const ProductEditPlanSection: React.FC = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const {
    product,
    portfolio,
    planItems,
    setPlanItems,
    planMonth,
    planYear,
    handlePlanMonthYearChange
  } = useProductEdit();

  const addNewPlanItem = () => {
    const newPlanItem = {
      id: `plan-item-${Date.now()}`,
      title: '',
      description: '',
      targetDate: new Date().toISOString(),
      status: 'planned' as const,
      owner: ''
    };
    setPlanItems([...planItems, newPlanItem]);
  };

  const updatePlanItem = (index: number, field: string, value: string) => {
    const updatedPlanItems = [...planItems];
    updatedPlanItems[index] = { ...updatedPlanItems[index], [field]: value };
    setPlanItems(updatedPlanItems);
  };

  const removePlanItem = (index: number) => {
    const updatedPlanItems = planItems.filter((_, i) => i !== index);
    setPlanItems(updatedPlanItems);
  };

  const handlePasteData = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const rows = text.split('\n').filter(row => row.trim());
      const pasteData = rows.map(row => row.split('\t'));
      
      const newPlanItems = pasteData.map((row, index) => ({
        id: `plan-item-paste-${Date.now()}-${index}`,
        title: row[0] || '',
        description: row[1] || '',
        targetDate: new Date().toISOString(),
        status: 'planned' as const,
        owner: row[2] || ''
      })).filter(item => item.title.trim() !== '');
      
      setPlanItems([...planItems, ...newPlanItems]);
    } catch (error) {
      console.error('Failed to paste data:', error);
    }
  };

  const handleSave = async () => {
    if (!product) {
      console.error('Missing product data');
      setSaveStatus('error');
      return;
    }
    
    setSaving(true);
    setSaveStatus('idle');
    
    try {
      console.log('Saving plan with params:', {
        productId: product.id,
        planItems: planItems.filter(item => item.title.trim() !== ''),
        planMonth,
        planYear
      });

      // Create a single ReleasePlan with combined info
      const mainItem = planItems[0];
      const combinedTitle = planItems.map(item => item.title).join('; ');
      const combinedDescription = planItems.map(item => item.description).join('; ');

      const releasePlans = [{
        id: `plan-${planMonth}-${planYear}`,
        month: planMonth,
        year: planYear,
        title: combinedTitle || 'No plans defined',
        description: combinedDescription || 'No description available',
        targetDate: mainItem?.targetDate || new Date().toISOString(),
        status: (mainItem?.status || 'planned') as 'planned' | 'in-progress' | 'completed' | 'delayed',
        createdAt: new Date().toISOString(),
        version: 1
      }];

      const success = await saveProductChanges(product.id, {
        releasePlans
      });

      if (success) {
        console.log('Plan saved successfully');
        setSaveStatus('success');
        // Navigate to dashboard after successful save
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        console.error('Failed to save plan');
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const getSaveButtonContent = () => {
    if (saving) {
      return (
        <>
          <Save size={16} className="animate-spin" />
          <span>Saving...</span>
        </>
      );
    }
    
    if (saveStatus === 'success') {
      return (
        <>
          <CheckCircle size={16} />
          <span>Saved!</span>
        </>
      );
    }
    
    if (saveStatus === 'error') {
      return (
        <>
          <XCircle size={16} />
          <span>Save Failed</span>
        </>
      );
    }
    
    return (
      <>
        <Save size={16} />
        <span>Save Plan</span>
      </>
    );
  };
  
  return (
    <div className="space-y-6 font-['Pathway_Extreme']">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-tnq-blue">Release Plan</h2>
        <MonthYearSelector
          selectedMonth={planMonth}
          selectedYear={planYear}
          onChange={handlePlanMonthYearChange}
          className="compact tnq-font"
        />
      </div>
      
      <Card className="p-6">
        {planItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4 tnq-font">No release plan items available</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={addNewPlanItem} className="flex items-center space-x-2 tnq-button">
                <Plus size={16} />
                <span>Add Plan Item</span>
              </Button>
              <Button onClick={handlePasteData} variant="outline" className="flex items-center space-x-2 tnq-button-outline">
                <Clipboard size={16} />
                <span>Paste Data</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Table className="tnq-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="tnq-grid-header">Title</TableHead>
                  <TableHead className="tnq-grid-header">Description</TableHead>
                  <TableHead className="tnq-grid-header">Owner</TableHead>
                  <TableHead className="tnq-grid-header w-20">Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Textarea
                        value={item.title}
                        onChange={(e) => updatePlanItem(index, 'title', e.target.value)}
                        placeholder="Enter title"
                        className="w-full tnq-font min-h-[80px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        value={item.description}
                        onChange={(e) => updatePlanItem(index, 'description', e.target.value)}
                        placeholder="Enter description"
                        className="w-full tnq-font min-h-[80px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        value={item.owner || ''}
                        onChange={(e) => updatePlanItem(index, 'owner', e.target.value)}
                        placeholder="Enter owner"
                        className="w-full tnq-font min-h-[80px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePlanItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="flex justify-between pt-4">
              <div className="flex gap-2">
                <Button onClick={addNewPlanItem} variant="outline" className="flex items-center space-x-2 tnq-button-outline">
                  <Plus size={16} />
                  <span>Add Plan Item</span>
                </Button>
                <Button onClick={handlePasteData} variant="outline" className="flex items-center space-x-2 tnq-button-outline">
                  <Clipboard size={16} />
                  <span>Paste Data</span>
                </Button>
                <Button 
                  onClick={() => setPlanItems([])}
                  variant="outline" 
                  className="flex items-center space-x-2 tnq-button-outline text-red-600 hover:text-red-800"
                >
                  Clear All
                </Button>
              </div>
              
              <Button 
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center space-x-2 tnq-button ${
                  saveStatus === 'success' ? 'bg-green-600 hover:bg-green-700' : 
                  saveStatus === 'error' ? 'bg-red-600 hover:bg-red-700' : ''
                }`}
              >
                {getSaveButtonContent()}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProductEditPlanSection;
