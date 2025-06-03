
import { Product, ReleaseGoal, ReleasePlan, Metric, ReleaseNote, Roadmap } from '../lib/types';
import { xmlApiService } from './xmlApiService';
import { storageService } from './storageService';

export const saveProductChanges = async (
  productId: string,
  updates: {
    metrics?: Metric[];
    releaseGoals?: ReleaseGoal[];
    releasePlans?: ReleasePlan[];
    releaseNotes?: ReleaseNote[];
    roadmap?: Roadmap[];
  }
): Promise<boolean> => {
  try {
    console.log('ProductEditService: Starting save for product:', productId);
    console.log('ProductEditService: Updates to apply:', Object.keys(updates));

    // Get existing data from localStorage first for immediate UI updates
    const storedData = localStorage.getItem('productPortalConfig');
    if (!storedData) {
      throw new Error('No product data found in localStorage');
    }

    const allData = JSON.parse(storedData);
    
    // Find the product to update
    const productIndex = allData.products?.findIndex((p: Product) => p.id === productId);
    if (productIndex === -1 || productIndex === undefined) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    const existingProduct = allData.products[productIndex];
    console.log('ProductEditService: Found existing product:', existingProduct.name);

    // Create updated product by merging changes with existing data
    const updatedProduct: Product = {
      ...existingProduct,
      // Only update the sections that are provided in updates
      ...(updates.metrics !== undefined && { metrics: updates.metrics }),
      ...(updates.releaseGoals !== undefined && { releaseGoals: updates.releaseGoals }),
      ...(updates.releasePlans !== undefined && { releasePlans: updates.releasePlans }),
      ...(updates.releaseNotes !== undefined && { releaseNotes: updates.releaseNotes }),
      ...(updates.roadmap !== undefined && { roadmap: updates.roadmap }),
    };

    console.log('ProductEditService: Created updated product with sections:', {
      metrics: updatedProduct.metrics?.length || 0,
      releaseGoals: updatedProduct.releaseGoals?.length || 0,
      releasePlans: updatedProduct.releasePlans?.length || 0,
      releaseNotes: updatedProduct.releaseNotes?.length || 0,
      roadmap: updatedProduct.roadmap?.length || 0,
    });

    // Update the product in the array for immediate UI feedback
    allData.products[productIndex] = updatedProduct;

    // Save to localStorage for immediate UI updates
    localStorage.setItem('productPortalConfig', JSON.stringify(allData));
    console.log('ProductEditService: Successfully saved updated product to localStorage');

    // Save to remote storage using the XML API service
    try {
      const saveResult = await xmlApiService.publishProductXML(productId, updatedProduct);
      
      if (saveResult.success) {
        console.log('ProductEditService: Successfully saved product to remote storage');
      } else {
        console.warn('ProductEditService: Failed to save to remote storage:', saveResult.error);
        // Don't fail the entire operation if remote save fails - we have localStorage backup
      }
    } catch (xmlError) {
      console.warn('ProductEditService: Remote save failed, continuing with localStorage only:', xmlError);
    }

    // Also try to save using the storage service directly as fallback
    try {
      const xmlContent = generateProductXMLContent(updatedProduct);
      const path = `data/product/${updatedProduct.name.replace(/\s+/g, '-')}-${updatedProduct.id}.xml`;
      
      const directSaveResult = await storageService.save(path, xmlContent);
      if (directSaveResult) {
        console.log('ProductEditService: Successfully saved via direct storage service');
      }
    } catch (directSaveError) {
      console.warn('ProductEditService: Direct storage save also failed:', directSaveError);
    }

    // Dispatch custom event to notify other components
    const updateEvent = new CustomEvent('productDataUpdated', { 
      detail: { productId, updatedProduct } 
    });
    window.dispatchEvent(updateEvent);
    console.log('ProductEditService: Dispatched productDataUpdated event');

    // Also trigger storage event for cross-tab communication
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'productPortalConfig',
      newValue: JSON.stringify(allData),
      storageArea: localStorage
    }));

    return true;

  } catch (error) {
    console.error('ProductEditService: Error saving product changes:', error);
    return false;
  }
};

// Helper function to generate XML content for a product
function generateProductXMLContent(product: Product): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += `<Product id="${product.id}" name="${product.name}" description="${product.description || ''}">\n`;
  
  // Add metrics
  if (product.metrics && product.metrics.length > 0) {
    xml += '  <Metrics>\n';
    product.metrics.forEach((metric) => {
      xml += `    <Metric id="${metric.id}" name="${metric.name}" value="${metric.value}" previousValue="${metric.previousValue || 0}" unit="${metric.unit}" timestamp="${metric.timestamp}" description="${metric.description || ''}" month="${metric.month}" year="${metric.year}"`;
      if (metric.source) xml += ` source="${metric.source}"`;
      if (metric.category) xml += ` category="${metric.category}"`;
      if (metric.owner) xml += ` owner="${metric.owner}"`;
      xml += '/>\n';
    });
    xml += '  </Metrics>\n';
  }
  
  // Add roadmap
  if (product.roadmap && product.roadmap.length > 0) {
    xml += '  <Roadmaps>\n';
    product.roadmap.forEach((roadmap) => {
      xml += `    <Roadmap id="${roadmap.id}" year="${roadmap.year}" quarter="${roadmap.quarter}" title="${roadmap.title}" description="${roadmap.description}" status="${roadmap.status}" createdAt="${roadmap.createdAt}" version="${roadmap.version}"`;
      if (roadmap.link) xml += ` link="${roadmap.link}"`;
      xml += '/>\n';
    });
    xml += '  </Roadmaps>\n';
  }
  
  // Add release goals
  if (product.releaseGoals && product.releaseGoals.length > 0) {
    xml += '  <ReleaseGoals>\n';
    product.releaseGoals.forEach((goal) => {
      xml += `    <ReleaseGoal id="${goal.id}" month="${goal.month}" year="${goal.year}" description="${goal.description}" currentState="${goal.currentState}" targetState="${goal.targetState}" status="${goal.status || 'planned'}" createdAt="${goal.createdAt}" version="${goal.version}"`;
      if (goal.owner) xml += ` owner="${goal.owner}"`;
      if (goal.priority) xml += ` priority="${goal.priority}"`;
      if (goal.category) xml += ` category="${goal.category}"`;
      xml += '/>\n';
    });
    xml += '  </ReleaseGoals>\n';
  }
  
  // Add release plans
  if (product.releasePlans && product.releasePlans.length > 0) {
    xml += '  <ReleasePlans>\n';
    product.releasePlans.forEach((plan) => {
      xml += `    <ReleasePlan id="${plan.id}" month="${plan.month}" year="${plan.year}" title="${plan.title}" description="${plan.description}" category="${plan.category || 'Enhancement'}" priority="${plan.priority || 'Medium'}" source="${plan.source || 'Internal'}" targetDate="${plan.targetDate}" owner="${plan.owner || ''}" status="${plan.status}" createdAt="${plan.createdAt}" version="${plan.version}"/>\n`;
    });
    xml += '  </ReleasePlans>\n';
  }
  
  // Add release notes
  if (product.releaseNotes && product.releaseNotes.length > 0) {
    xml += '  <ReleaseNotes>\n';
    product.releaseNotes.forEach((note) => {
      xml += `    <ReleaseNote id="${note.id}" month="${note.month}" year="${note.year}" title="${note.title}" description="${note.description}" type="${note.type}" highlights="${note.highlights}" createdAt="${note.createdAt}" version="${note.version}"`;
      if (note.link) xml += ` link="${note.link}"`;
      xml += '/>\n';
    });
    xml += '  </ReleaseNotes>\n';
  }
  
  xml += '</Product>';
  return xml;
}

// Load product from remote storage
export const loadProductFromRemote = async (productId: string): Promise<Product | null> => {
  try {
    console.log('ProductEditService: Loading product from remote storage:', productId);
    
    // Try to get the XML content using the getPublishedXML method
    const filename = `${productId}.xml`;
    const loadResult = await xmlApiService.getPublishedXML(filename);
    
    if (loadResult.success && loadResult.data) {
      console.log('ProductEditService: Successfully loaded product XML from remote storage');
      // Here you would need to parse the XML content back to a Product object
      // For now, returning null as XML parsing is not implemented
      return null;
    } else {
      console.warn('ProductEditService: Failed to load from remote storage:', loadResult.error);
      return null;
    }
  } catch (error) {
    console.error('ProductEditService: Error loading product from remote:', error);
    return null;
  }
};

// Sync product data between local and remote storage
export const syncProductData = async (productId: string): Promise<boolean> => {
  try {
    console.log('ProductEditService: Syncing product data for:', productId);
    
    // Try to load from remote first
    const remoteProduct = await loadProductFromRemote(productId);
    
    if (remoteProduct) {
      // Update localStorage with remote data
      const storedData = localStorage.getItem('productPortalConfig');
      if (storedData) {
        const allData = JSON.parse(storedData);
        const productIndex = allData.products?.findIndex((p: Product) => p.id === productId);
        
        if (productIndex !== -1) {
          allData.products[productIndex] = remoteProduct;
          localStorage.setItem('productPortalConfig', JSON.stringify(allData));
          
          // Dispatch update event
          window.dispatchEvent(new CustomEvent('productDataUpdated', {
            detail: { productId, updatedProduct: remoteProduct }
          }));
          
          console.log('ProductEditService: Successfully synced product data');
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('ProductEditService: Error syncing product data:', error);
    return false;
  }
};
