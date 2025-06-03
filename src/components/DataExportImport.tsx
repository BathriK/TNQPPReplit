
import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { exportAllProductsXML, exportProductXML, importProductXML, populateProductWithDummyData, publishXMLsToSite } from '../lib/xmlUtils';
import { toast } from '../hooks/use-toast';
import { AlertCircle, Download, Upload, Database, Globe } from 'lucide-react';
import { clearPortfolioCache } from '../lib/data';

interface DataExportImportProps {
  productId?: string; // Optional - if provided, enables single product export
}

const DataExportImport: React.FC<DataExportImportProps> = ({ productId }) => {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isPopulating, setIsPopulating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    
    try {
      // Validate file type
      if (file.type !== 'text/xml' && !file.name.endsWith('.xml')) {
        toast({
          title: "Invalid file type",
          description: "Please select an XML file",
          variant: "destructive"
        });
        return;
      }
      
      // Show confirmation dialog
      setIsImportDialogOpen(true);
    } catch (error) {
      console.error("Error preparing import:", error);
      toast({
        title: "Import preparation failed",
        description: "Failed to prepare file for import",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
      // Reset input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const confirmImport = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    
    try {
      await importProductXML(file);
      clearPortfolioCache(); // Clear cache to force reload of new data
      setIsImportDialogOpen(false);
      
      // Reload the page to see changes
      window.location.reload();
    } catch (error) {
      console.error("Error during import confirmation:", error);
    } finally {
      setIsImporting(false);
    }
  };

  const handlePopulateDummyData = async () => {
    if (!productId) {
      toast({
        title: "Product ID required",
        description: "Cannot populate dummy data without a product ID",
        variant: "destructive"
      });
      return;
    }
    
    setIsPopulating(true);
    
    try {
      const success = await populateProductWithDummyData(productId);
      if (success) {
        clearPortfolioCache(); // Clear cache to force reload of new data
        // Reload the page to see changes
        window.location.reload();
      }
    } catch (error) {
      console.error("Error populating dummy data:", error);
      toast({
        title: "Error",
        description: "Failed to populate dummy data",
        variant: "destructive"
      });
    } finally {
      setIsPopulating(false);
    }
  };

  const handlePublishXMLs = async () => {
    setIsPublishing(true);
    
    try {
      await publishXMLsToSite();
      toast({
        title: "XMLs Published",
        description: "XML files have been published to the site successfully",
      });
    } catch (error) {
      console.error("Error publishing XMLs:", error);
      toast({
        title: "Publish Failed",
        description: "Failed to publish XML files to the site",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <Button 
        onClick={() => productId ? exportProductXML(productId) : exportAllProductsXML()}
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
      >
        <Download size={16} />
        <span>Export {productId ? 'Product' : 'All'} XML</span>
      </Button>
      
      <Button
        onClick={handleImportClick}
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
      >
        <Upload size={16} />
        <span>Import XML</span>
      </Button>
      
      <Button
        onClick={handlePublishXMLs}
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
        disabled={isPublishing}
      >
        <Globe size={16} />
        <span>{isPublishing ? 'Publishing...' : 'Publish XMLs to Site'}</span>
      </Button>
      
      {productId && (
        <Button
          onClick={handlePopulateDummyData}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          disabled={isPopulating}
        >
          <Database size={16} />
          <span>{isPopulating ? 'Populating...' : 'Populate Dummy Data'}</span>
        </Button>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xml"
        className="hidden"
      />
      
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <span>Confirm Import</span>
            </DialogTitle>
            <DialogDescription>
              This will replace your current product configuration. 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-gray-700">
            Are you sure you want to import this configuration?
            Make sure you have exported your current data as a backup.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmImport}
              disabled={isImporting}
            >
              {isImporting ? 'Importing...' : 'Confirm Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataExportImport;
