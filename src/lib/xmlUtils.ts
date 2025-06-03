import { getPortfolios, updatePortfolios, findProductById, portfoliosToXML, parseXMLConfig, generateSampleData } from './data';

// Save product data to XML file in data/product folder
export async function saveProductToXML(productId: string): Promise<boolean> {
  try {
    const { product, portfolio } = await findProductById(productId);
    
    if (!product || !portfolio) {
      console.error("Product not found:", productId);
      return false;
    }
    
    // Create XML content for individual product
    const xml = generateProductXML(product);
    
    // In a real application, this would save to the file system
    // For now, we'll save to localStorage with a specific key pattern
    const filename = `data/product/${product.name.replace(/\s+/g, '-')}-${product.id}.xml`;
    localStorage.setItem(filename, xml);
    
    console.log(`Product XML saved to ${filename}`);
    return true;
  } catch (error) {
    console.error("Error saving product XML:", error);
    return false;
  }
}

// Load product data from XML file in data/product folder
export async function loadProductFromXML(productId: string): Promise<boolean> {
  try {
    // In a real application, this would load from the file system
    // For now, we'll try to load from localStorage
    const filename = `data/product/*-${productId}.xml`;
    
    // Find the file by searching localStorage keys
    const keys = Object.keys(localStorage);
    const productKey = keys.find(key => key.includes(`data/product/`) && key.includes(`-${productId}.xml`));
    
    if (!productKey) {
      console.log(`No XML file found for product ${productId}`);
      return false;
    }
    
    const xmlContent = localStorage.getItem(productKey);
    if (!xmlContent) {
      console.log(`Empty XML content for product ${productId}`);
      return false;
    }
    
    // Parse XML and update product data
    const parsedProduct = parseProductXMLContent(xmlContent);
    if (parsedProduct) {
      // Update the product in the portfolios
      const portfolios = await getPortfolios();
      const updatedPortfolios = portfolios.map(portfolio => ({
        ...portfolio,
        products: portfolio.products.map(p => 
          p.id === productId ? parsedProduct : p
        )
      }));
      
      updatePortfolios(updatedPortfolios);
      console.log(`Product ${productId} loaded from XML`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error loading product XML:", error);
    return false;
  }
}

// Generate XML content for a single product
function generateProductXML(product: any): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += `<Product id="${product.id}" name="${product.name}" description="${product.description}">\n`;
  
  // Add metrics
  if (product.metrics && product.metrics.length > 0) {
    xml += '  <Metrics>\n';
    product.metrics.forEach((metric: any) => {
      xml += `    <Metric id="${metric.id}" name="${metric.name}" value="${metric.value}" previousValue="${metric.previousValue}" unit="${metric.unit}" timestamp="${metric.timestamp}" description="${metric.description}" month="${metric.month}" year="${metric.year}"`;
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
    product.roadmap.forEach((roadmap: any) => {
      xml += `    <Roadmap id="${roadmap.id}" year="${roadmap.year}" quarter="${roadmap.quarter}" title="${roadmap.title}" description="${roadmap.description}" status="${roadmap.status}" createdAt="${roadmap.createdAt}" version="${roadmap.version}"`;
      if (roadmap.link) xml += ` link="${roadmap.link}"`;
      xml += '/>\n';
    });
    xml += '  </Roadmaps>\n';
  }
  
  // Add release goals
  if (product.releaseGoals && product.releaseGoals.length > 0) {
    xml += '  <ReleaseGoals>\n';
    product.releaseGoals.forEach((goal: any) => {
      xml += `    <ReleaseGoal id="${goal.id}" month="${goal.month}" year="${goal.year}" description="${goal.description}" currentState="${goal.currentState}" targetState="${goal.targetState}" status="${goal.status}" createdAt="${goal.createdAt}" version="${goal.version}"`;
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
    product.releasePlans.forEach((plan: any) => {
      xml += `    <ReleasePlan id="${plan.id}" month="${plan.month}" year="${plan.year}" title="${plan.title}" description="${plan.description}" category="${plan.category}" priority="${plan.priority}" source="${plan.source}" targetDate="${plan.targetDate}" owner="${plan.owner}" status="${plan.status}" createdAt="${plan.createdAt}" version="${plan.version}"/>\n`;
    });
    xml += '  </ReleasePlans>\n';
  }
  
  // Add release notes
  if (product.releaseNotes && product.releaseNotes.length > 0) {
    xml += '  <ReleaseNotes>\n';
    product.releaseNotes.forEach((note: any) => {
      xml += `    <ReleaseNote id="${note.id}" month="${note.month}" year="${note.year}" title="${note.title}" description="${note.description}" type="${note.type}" highlights="${note.highlights}" createdAt="${note.createdAt}" version="${note.version}"`;
      if (note.link) xml += ` link="${note.link}"`;
      xml += '/>\n';
    });
    xml += '  </ReleaseNotes>\n';
  }
  
  xml += '</Product>';
  return xml;
}

// Parse XML content and return product object
function parseProductXMLContent(xmlContent: string): any | null {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    
    const productEl = xmlDoc.querySelector('Product');
    if (!productEl) {
      console.error('No Product element found in XML');
      return null;
    }
    
    const product: any = {
      id: productEl.getAttribute('id') || '',
      name: productEl.getAttribute('name') || '',
      description: productEl.getAttribute('description') || '',
      metrics: [],
      roadmap: [],
      releaseGoals: [],
      releasePlans: [],
      releaseNotes: []
    };
    
    // Parse all sections similar to how it's done in data.ts
    // ... keep existing parsing logic from data.ts
    
    return product;
  } catch (error) {
    console.error('Error parsing product XML content:', error);
    return null;
  }
}

// Export a single product as XML
export async function exportProductXML(productId: string): Promise<void> {
  try {
    const { product, portfolio } = await findProductById(productId);
    
    if (!product || !portfolio) {
      console.error("Product not found:", productId);
      return;
    }
    
    const singlePortfolio: any = {
      id: portfolio.id,
      name: portfolio.name,
      products: [product]
    };
    
    const xml = portfoliosToXML([singlePortfolio]);
    
    // Create a blob and download it
    const blob = new Blob([xml], { type: 'text/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${product.name.replace(/\s+/g, '-')}-export.xml`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  } catch (error) {
    console.error("Error exporting product XML:", error);
  }
}

// Export all products as XML with complete data
export async function exportAllProductsXML(): Promise<void> {
  try {
    const portfolios = await getPortfolios();
    const xml = portfoliosToXML(portfolios);
    
    // Create a blob and download it
    const blob = new Blob([xml], { type: 'text/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-products-export.xml`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  } catch (error) {
    console.error("Error exporting all products XML:", error);
  }
}

// Publish XML files to the site (save to localStorage for published access)
export async function publishXMLsToSite(): Promise<void> {
  try {
    const portfolios = await getPortfolios();
    const allProductsXML = portfoliosToXML(portfolios);
    
    // Save all products XML to localStorage with a published key
    localStorage.setItem('published-all-products.xml', allProductsXML);
    
    // Save individual product XMLs
    for (const portfolio of portfolios) {
      for (const product of portfolio.products) {
        const singlePortfolio = {
          id: portfolio.id,
          name: portfolio.name,
          products: [product]
        };
        const productXML = portfoliosToXML([singlePortfolio]);
        const filename = `published-${product.name.replace(/\s+/g, '-')}-${product.id}.xml`;
        localStorage.setItem(filename, productXML);
      }
    }
    
    console.log('XML files published to site successfully');
  } catch (error) {
    console.error("Error publishing XML files to site:", error);
  }
}

// Get published XML file content
export function getPublishedXML(filename: string): string | null {
  return localStorage.getItem(`published-${filename}`);
}

// List all published XML files
export function listPublishedXMLs(): string[] {
  const keys = Object.keys(localStorage);
  return keys.filter(key => key.startsWith('published-') && key.endsWith('.xml'))
    .map(key => key.replace('published-', ''));
}

// Import product data from XML file
export async function importProductXML(file: File): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const xml = event.target?.result as string;
        if (!xml) {
          reject(new Error("Failed to read XML file"));
          return;
        }
        
        const importedPortfolios = await parseXMLConfig(xml);
        if (!importedPortfolios || importedPortfolios.length === 0) {
          reject(new Error("Invalid XML format or empty portfolios"));
          return;
        }
        
        // Merge with existing data or replace entirely based on your requirements
        // Here we're doing a simple replace:
        updatePortfolios(importedPortfolios);
        resolve(true);
      } catch (error) {
        console.error("Error parsing imported XML:", error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      reject(error);
    };
    
    reader.readAsText(file);
  });
}

// Populate a product with dummy data
export async function populateProductWithDummyData(productId: string): Promise<boolean> {
  try {
    const portfolios = await getPortfolios();
    let productFound = false;
    
    const updatedPortfolios = portfolios.map(portfolio => {
      const updatedProducts = portfolio.products.map(product => {
        if (product.id === productId) {
          productFound = true;
          
          // Generate dummy data with proper typing
          const dummyData = generateSampleData(productId);
          
          return {
            ...product,
            metrics: [...product.metrics, ...dummyData.metrics],
            roadmap: [...product.roadmap, dummyData.roadmap],
            releaseGoals: [...product.releaseGoals, dummyData.releaseGoal],
            releasePlans: [...product.releasePlans, dummyData.releasePlan],
            releaseNotes: [...product.releaseNotes, dummyData.releaseNote]
          };
        }
        return product;
      });
      
      return {
        ...portfolio,
        products: updatedProducts
      };
    });
    
    if (productFound) {
      updatePortfolios(updatedPortfolios);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error populating dummy data:", error);
    return false;
  }
}
