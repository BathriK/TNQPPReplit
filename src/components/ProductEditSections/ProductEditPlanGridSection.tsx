
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductEdit } from '../../contexts/ProductEditContext';
import MonthYearSelector from '../MonthYearSelector';
import { Button } from '@/components/ui/button';
import { Save, Plus, Trash2, AlertTriangle, Clipboard } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ProductEditPlanGridSection: React.FC = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  
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
    const newItem = {
      id: `plan-${Date.now()}`,
      title: '',
      description: '',
      category: 'Enhancement' as const,
      priority: 'Medium' as const,
      source: 'Internal' as const,
      targetDate: new Date().toISOString(),
      owner: '',
      status: 'planned' as const
    };
    setPlanItems([...planItems, newItem]);
  };

  const updatePlanItem = (index: number, field: string, value: string) => {
    const updatedItems = [...planItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setPlanItems(updatedItems);
  };

  const removePlanItem = (index: number) => {
    const updatedItems = planItems.filter((_, i) => i !== index);
    setPlanItems(updatedItems);
  };

  const handlePasteData = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const rows = text.split('\n').filter(row => row.trim());
      const pasteData = rows.map(row => row.split('\t'));
      
      const newItems = pasteData.map((row, index) => ({
        id: `plan-paste-${Date.now()}-${index}`,
        title: row[0] || '',
        description: row[1] || '',
        category: (row[2] as any) || 'Enhancement',
        priority: (row[3] as any) || 'Medium',
        source: (row[4] as any) || 'Internal',
        targetDate: new Date().toISOString(),
        owner: row[5] || '',
        status: 'planned' as const
      })).filter(item => item.title.trim() !== '');
      
      setPlanItems([...planItems, ...newItems]);
    } catch (error) {
      console.error('Failed to paste data:', error);
    }
  };

  const handleSave = async () => {
    if (!product || !portfolio) {
      alert('Missing product or portfolio data');
      return;
    }
    
    setSaving(true);
    
    try {
      // Filter out empty items
      const validItems = planItems.filter(item => item.title.trim() !== '');
      
      // Update localStorage directly
      const portfolios = JSON.parse(localStorage.getItem('portfolios') || '[]');
      const portfolioIndex = portfolios.findIndex((p: any) => p.id === portfolio.id);
      
      if (portfolioIndex !== -1) {
        const productIndex = portfolios[portfolioIndex].products.findIndex((p: any) => p.id === product.id);
        
        if (productIndex !== -1) {
          // Remove existing plans for this month/year
          portfolios[portfolioIndex].products[productIndex].releasePlans = 
            portfolios[portfolioIndex].products[productIndex].releasePlans.filter(
              (p: any) => !(p.month === planMonth && p.year === planYear)
            );
          
          // Create new plan
          const newPlan = {
            id: `plans-${planMonth}-${planYear}-v1-${Date.now()}`,
            month: planMonth,
            year: planYear,
            items: validItems,
            createdAt: new Date().toISOString(),
            version: 1
          };
          
          portfolios[portfolioIndex].products[productIndex].releasePlans.push(newPlan);
          
          localStorage.setItem('portfolios', JSON.stringify(portfolios));
          
          alert('Release Plan saved successfully! Redirecting to dashboard...');
          
          // Navigate to dashboard and force refresh
          setTimeout(() => {
            navigate('/', { replace: true });
            window.location.reload();
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Failed to save plan. Please try again.');
    } finally {
      setSaving(false);
    }
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
                <span>Add Item</span>
              </Button>
              <Button onClick={handlePasteData} variant="outline" className="flex items-center space-x-2 tnq-button-outline">
                <Clipboard size={16} />
                <span>Paste Data</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <Table className="tnq-table min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="tnq-grid-header">Title</TableHead>
                    <TableHead className="tnq-grid-header">Description</TableHead>
                    <TableHead className="tnq-grid-header">Category</TableHead>
                    <TableHead className="tnq-grid-header">Priority</TableHead>
                    <TableHead className="tnq-grid-header">Source</TableHead>
                    <TableHead className="tnq-grid-header">Owner</TableHead>
                    <TableHead className="tnq-grid-header">Status</TableHead>
                    <TableHead className="tnq-grid-header w-20">Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planItems.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Input
                          value={item.title}
                          onChange={(e) => updatePlanItem(index, 'title', e.target.value)}
                          placeholder="Enter title"
                          className="w-full tnq-font"
                        />
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={item.description}
                          onChange={(e) => updatePlanItem(index, 'description', e.target.value)}
                          placeholder="Enter description"
                          className="w-full tnq-font min-h-[60px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.category}
                          onValueChange={(value) => updatePlanItem(index, 'category', value)}
                        >
                          <SelectTrigger className="tnq-font">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Enhancement">Enhancement</SelectItem>
                            <SelectItem value="Bug">Bug</SelectItem>
                            <SelectItem value="Improvement">Improvement</SelectItem>
                            <SelectItem value="Clarification">Clarification</SelectItem>
                            <SelectItem value="Training">Training</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.priority}
                          onValueChange={(value) => updatePlanItem(index, 'priority', value)}
                        >
                          <SelectTrigger className="tnq-font">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.source}
                          onValueChange={(value) => updatePlanItem(index, 'source', value)}
                        >
                          <SelectTrigger className="tnq-font">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Internal">Internal</SelectItem>
                            <SelectItem value="Customer">Customer</SelectItem>
                            <SelectItem value="Market">Market</SelectItem>
                            <SelectItem value="Regulatory">Regulatory</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.owner || ''}
                          onChange={(e) => updatePlanItem(index, 'owner', e.target.value)}
                          placeholder="Owner"
                          className="w-full tnq-font"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.status}
                          onValueChange={(value) => updatePlanItem(index, 'status', value)}
                        >
                          <SelectTrigger className="tnq-font">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planned">Planned</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="delayed">Delayed</SelectItem>
                          </SelectContent>
                        </Select>
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
            </div>
            
            <div className="flex justify-between pt-4">
              <div className="flex gap-2">
                <Button onClick={addNewPlanItem} variant="outline" className="flex items-center space-x-2 tnq-button-outline">
                  <Plus size={16} />
                  <span>Add Item</span>
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
                  <AlertTriangle size={16} />
                  <span>Clear All</span>
                </Button>
              </div>
              
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="tnq-button"
              >
                <Save size={16} className="mr-2" />
                {saving ? 'Saving...' : 'Save Plan'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProductEditPlanGridSection;
