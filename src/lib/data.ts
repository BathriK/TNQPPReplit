import { Product, Portfolio, Metric, ReleaseGoal, ReleasePlan, ReleaseNote, Roadmap } from './types';

// Cache for loaded data
let cachedPortfolios: Portfolio[] | null = null;
let dataLastLoaded: number = 0;
const CACHE_DURATION = 5000; // 5 seconds

export const getPortfolios = async (): Promise<Portfolio[]> => {
  console.log('Data Service: Starting getPortfolios');
  
  // Check cache first
  const now = Date.now();
  if (cachedPortfolios && (now - dataLastLoaded) < CACHE_DURATION) {
    console.log('Data Service: Returning cached portfolios:', cachedPortfolios.length);
    return cachedPortfolios;
  }

  try {
    // Try to load from localStorage first
    const storedData = localStorage.getItem('portfolios');
    if (storedData) {
      console.log('Data Service: Found portfolios in localStorage');
      const portfolios = JSON.parse(storedData) as Portfolio[];
      console.log('Data Service: Loaded portfolios from localStorage:', {
        portfolioCount: portfolios.length,
        totalProducts: portfolios.reduce((acc, p) => acc + p.products.length, 0)
      });
      
      cachedPortfolios = portfolios;
      dataLastLoaded = now;
      return portfolios;
    }

    // Fallback to XML loading
    console.log('Data Service: No localStorage data, loading from XML files');
    const portfolios = await loadFromXMLFiles();
    
    // Save to localStorage for future use
    localStorage.setItem('portfolios', JSON.stringify(portfolios));
    
    cachedPortfolios = portfolios;
    dataLastLoaded = now;
    
    console.log('Data Service: Successfully loaded portfolios from XML:', {
      portfolioCount: portfolios.length,
      totalProducts: portfolios.reduce((acc, p) => acc + p.products.length, 0)
    });
    
    return portfolios;
  } catch (error) {
    console.error('Data Service: Error loading portfolios:', error);
    
    // Return empty portfolio structure to prevent crashes
    const emptyPortfolios: Portfolio[] = [{
      id: 'default',
      name: 'Default Portfolio',
      description: 'Default portfolio created due to loading error',
      products: []
    }];
    
    return emptyPortfolios;
  }
};

const loadFromXMLFiles = async (): Promise<Portfolio[]> => {
  console.log('Data Service: Loading from XML files');
  
  try {
    // Load the main portfolio XML file
    const response = await fetch('/data/PortfolioProduct.xml');
    if (!response.ok) {
      throw new Error('Failed to load portfolio XML');
    }
    
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    const portfolios: Portfolio[] = [];
    const portfolioElements = xmlDoc.querySelectorAll('Portfolio');
    
    console.log('Data Service: Found portfolios in XML:', portfolioElements.length);
    
    for (const portfolioEl of portfolioElements) {
      const portfolioId = portfolioEl.getAttribute('id') || '';
      const portfolioName = portfolioEl.getAttribute('name') || '';
      
      console.log('Data Service: Processing portfolio:', portfolioName);
      
      const portfolio: Portfolio = {
        id: portfolioId,
        name: portfolioName,
        description: '',
        products: []
      };
      
      const productElements = portfolioEl.querySelectorAll('Product');
      console.log('Data Service: Found products in portfolio:', productElements.length);
      
      for (const productEl of productElements) {
        const productId = productEl.getAttribute('id') || '';
        const productName = productEl.getAttribute('name') || '';
        const productDescription = productEl.getAttribute('description') || '';
        const filepath = productEl.getAttribute('filepath') || '';
        
        // Normalize filepath to use forward slashes consistently
        const normalizedFilepath = filepath.replace(/\\/g, '/');
        
        console.log('Data Service: Loading product:', productName, 'from', normalizedFilepath);
        
        let productData: Product = {
          id: productId,
          name: productName,
          description: productDescription,
          metrics: [],
          roadmap: [],
          releaseGoals: [],
          releasePlans: [],
          releaseNotes: []
        };
        
        // Load individual product XML if filepath exists
        if (normalizedFilepath) {
          try {
            // Ensure the filepath starts with a forward slash for proper URL construction
            const fetchPath = normalizedFilepath.startsWith('/') ? normalizedFilepath : `/${normalizedFilepath}`;
            const productResponse = await fetch(fetchPath);
            if (productResponse.ok) {
              const productXml = await productResponse.text();
              const productDoc = parser.parseFromString(productXml, 'text/xml');
              const parsedProduct = parseProductXML(productDoc, productData);
              if (parsedProduct) {
                productData = parsedProduct;
                console.log('Data Service: Successfully loaded product data for:', productName, {
                  metrics: productData.metrics.length,
                  goals: productData.releaseGoals.length,
                  plans: productData.releasePlans.length,
                  notes: productData.releaseNotes.length,
                  roadmaps: productData.roadmap.length
                });
              }
            }
          } catch (productError) {
            console.warn('Data Service: Error loading product XML for:', productName, productError);
          }
        }
        
        portfolio.products.push(productData);
      }
      
      portfolios.push(portfolio);
    }
    
    console.log('Data Service: Successfully loaded all portfolios:', portfolios.length);
    return portfolios;
    
  } catch (error) {
    console.error('Data Service: Error loading from XML files:', error);
    throw error;
  }
};

const parseProductXML = (xmlDoc: Document, baseProduct: Product): Product | null => {
  try {
    const productEl = xmlDoc.querySelector('Product');
    if (!productEl) {
      console.warn('Data Service: No Product element found in XML');
      return baseProduct;
    }
    
    const product: Product = {
      ...baseProduct,
      metrics: [],
      roadmap: [],
      releaseGoals: [],
      releasePlans: [],
      releaseNotes: []
    };
    
    // Parse metrics
    const metricElements = xmlDoc.querySelectorAll('Metric');
    metricElements.forEach(metricEl => {
      const metric: Metric = {
        id: metricEl.getAttribute('id') || '',
        name: metricEl.getAttribute('name') || '',
        value: parseFloat(metricEl.getAttribute('value') || '0'),
        previousValue: parseFloat(metricEl.getAttribute('previousValue') || '0'),
        unit: metricEl.getAttribute('unit') || '',
        timestamp: metricEl.getAttribute('timestamp') || '',
        description: metricEl.getAttribute('description') || '',
        month: parseInt(metricEl.getAttribute('month') || '4', 10),
        year: parseInt(metricEl.getAttribute('year') || '2025', 10),
        source: metricEl.getAttribute('source') || '',
        category: metricEl.getAttribute('category') || '',
        owner: metricEl.getAttribute('owner') || ''
      };
      product.metrics.push(metric);
    });
    
    // Parse roadmaps
    const roadmapElements = xmlDoc.querySelectorAll('Roadmap');
    roadmapElements.forEach(roadmapEl => {
      const roadmap: Roadmap = {
        id: roadmapEl.getAttribute('id') || '',
        year: parseInt(roadmapEl.getAttribute('year') || '2025', 10),
        quarter: parseInt(roadmapEl.getAttribute('quarter') || '1', 10) as 1 | 2 | 3 | 4,
        title: roadmapEl.getAttribute('title') || '',
        description: roadmapEl.getAttribute('description') || '',
        status: (roadmapEl.getAttribute('status') || 'planned') as 'planned' | 'in-progress' | 'completed' | 'delayed',
        createdAt: roadmapEl.getAttribute('createdAt') || '',
        version: roadmapEl.getAttribute('version') || '1.0',
        link: roadmapEl.getAttribute('link') || ''
      };
      product.roadmap.push(roadmap);
    });
    
    // Parse release goals
    const goalElements = xmlDoc.querySelectorAll('ReleaseGoal');
    goalElements.forEach(goalEl => {
      const goal: ReleaseGoal = {
        id: goalEl.getAttribute('id') || '',
        month: parseInt(goalEl.getAttribute('month') || '4', 10),
        year: parseInt(goalEl.getAttribute('year') || '2025', 10),
        description: goalEl.getAttribute('description') || '',
        currentState: goalEl.getAttribute('currentState') || '',
        targetState: goalEl.getAttribute('targetState') || '',
        status: (goalEl.getAttribute('status') || 'planned') as 'planned' | 'in-progress' | 'completed' | 'delayed',
        owner: goalEl.getAttribute('owner') || '',
        priority: goalEl.getAttribute('priority') || '',
        category: goalEl.getAttribute('category') || '',
        createdAt: goalEl.getAttribute('createdAt') || '',
        version: parseInt(goalEl.getAttribute('version') || '1', 10)
      };
      product.releaseGoals.push(goal);
    });
    
    // Parse release plans
    const planElements = xmlDoc.querySelectorAll('ReleasePlan');
    planElements.forEach(planEl => {
      const plan: ReleasePlan = {
        id: planEl.getAttribute('id') || '',
        month: parseInt(planEl.getAttribute('month') || '4', 10),
        year: parseInt(planEl.getAttribute('year') || '2025', 10),
        title: planEl.getAttribute('title') || '',
        description: planEl.getAttribute('description') || '',
        category: (planEl.getAttribute('category') || 'Enhancement') as 'Enhancement' | 'Bug' | 'Improvement' | 'Clarification' | 'Training',
        priority: (planEl.getAttribute('priority') || 'Medium') as 'High' | 'Medium' | 'Low',
        source: (planEl.getAttribute('source') || 'Internal') as 'Internal' | 'Customer' | 'Market' | 'Regulatory' | 'Other',
        targetDate: planEl.getAttribute('targetDate') || '',
        owner: planEl.getAttribute('owner') || '',
        status: (planEl.getAttribute('status') || 'planned') as 'planned' | 'in-progress' | 'completed' | 'delayed',
        createdAt: planEl.getAttribute('createdAt') || '',
        version: parseInt(planEl.getAttribute('version') || '1', 10)
      };
      product.releasePlans.push(plan);
    });
    
    // Parse release notes
    const noteElements = xmlDoc.querySelectorAll('ReleaseNote');
    noteElements.forEach(noteEl => {
      const note: ReleaseNote = {
        id: noteEl.getAttribute('id') || '',
        month: parseInt(noteEl.getAttribute('month') || '4', 10),
        year: parseInt(noteEl.getAttribute('year') || '2025', 10),
        title: noteEl.getAttribute('title') || '',
        description: noteEl.getAttribute('description') || '',
        type: (noteEl.getAttribute('type') || 'feature') as 'feature' | 'enhancement' | 'fix' | 'other',
        highlights: noteEl.getAttribute('highlights') || '',
        createdAt: noteEl.getAttribute('createdAt') || '',
        version: parseInt(noteEl.getAttribute('version') || '1', 10),
        link: noteEl.getAttribute('link') || ''
      };
      product.releaseNotes.push(note);
    });
    
    return product;
    
  } catch (error) {
    console.error('Data Service: Error parsing product XML:', error);
    return baseProduct;
  }
};

export const findProductById = (productId: string): { product: Product | null; portfolio: Portfolio | null } => {
  console.log('Data Service: Finding product by ID:', productId);
  
  try {
    const storedData = localStorage.getItem('portfolios');
    if (!storedData) {
      console.warn('Data Service: No portfolios data in localStorage');
      return { product: null, portfolio: null };
    }
    
    const portfolios = JSON.parse(storedData) as Portfolio[];
    
    for (const portfolio of portfolios) {
      const product = portfolio.products.find(p => p.id === productId);
      if (product) {
        console.log('Data Service: Found product:', product.name, 'in portfolio:', portfolio.name);
        return { product, portfolio };
      }
    }
    
    console.warn('Data Service: Product not found:', productId);
    return { product: null, portfolio: null };
    
  } catch (error) {
    console.error('Data Service: Error finding product:', error);
    return { product: null, portfolio: null };
  }
};

export const getCurrentMonthData = (product: Product, filterMonth: number = 4, filterYear: number = 2025) => {
  console.log(`Data Service: Getting current month data for ${product.name} with filter: ${filterMonth}/${filterYear}`);
  
  const latestRoadmap = product.roadmap
    .filter(r => r.year === filterYear)
    .sort((a, b) => parseFloat(b.version) - parseFloat(a.version))[0] || null;
  
  const latestReleaseGoal = product.releaseGoals
    .filter(g => g.month === filterMonth && g.year === filterYear)
    .sort((a, b) => b.version - a.version)[0] || null;
  
  const latestReleasePlan = product.releasePlans
    .filter(p => p.month === filterMonth && p.year === filterYear)
    .sort((a, b) => b.version - a.version)[0] || null;
  
  const latestReleaseNote = product.releaseNotes
    .filter(n => n.month === filterMonth && n.year === filterYear)
    .sort((a, b) => b.version - a.version)[0] || null;
  
  console.log(`Data Service: Found roadmap: ${latestRoadmap ? 'yes' : 'none'}, goal: ${latestReleaseGoal ? 'yes' : 'none'}, plan: ${latestReleasePlan ? 'yes' : 'none'}, note: ${latestReleaseNote ? 'yes' : 'none'}`);
  
  return {
    latestRoadmap,
    latestReleaseGoal,
    latestReleasePlan,
    latestReleaseNote
  };
};

export const getPreviousMonthData = (product: Product, filterMonth: number = 5, filterYear: number = 2025) => {
  console.log(`Data Service: Getting previous month data for ${product.name} with filter: ${filterMonth}/${filterYear}`);
  
  let prevMonth = filterMonth - 1;
  let prevYear = filterYear;
  
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear = filterYear - 1;
  }
  
  const latestReleaseNote = product.releaseNotes
    .filter(n => n.month === prevMonth && n.year === prevYear)
    .sort((a, b) => b.version - a.version)[0] || null;
  
  console.log(`Data Service: Found previous month release note: ${latestReleaseNote ? 'yes' : 'none'}`);
  
  return {
    latestReleaseNote
  };
};

// Clear cache function
export const clearDataCache = () => {
  console.log('Data Service: Clearing cache');
  cachedPortfolios = null;
  dataLastLoaded = 0;
};

// Clear portfolio cache function (alias for compatibility)
export const clearPortfolioCache = () => {
  clearDataCache();
};

// Update portfolios function
export const updatePortfolios = async (portfolios: Portfolio[]): Promise<void> => {
  console.log('Data Service: Updating portfolios', portfolios.length);
  try {
    localStorage.setItem('portfolios', JSON.stringify(portfolios));
    cachedPortfolios = portfolios;
    dataLastLoaded = Date.now();
    
    // Dispatch update event
    const event = new CustomEvent('productDataUpdated');
    window.dispatchEvent(event);
    document.dispatchEvent(event);
    
    console.log('Data Service: Portfolios updated successfully');
  } catch (error) {
    console.error('Data Service: Error updating portfolios:', error);
    throw error;
  }
};

// Get all products from all portfolios
export const getAllProducts = async (): Promise<Product[]> => {
  console.log('Data Service: Getting all products');
  try {
    const portfolios = await getPortfolios();
    const allProducts: Product[] = [];
    
    portfolios.forEach(portfolio => {
      allProducts.push(...portfolio.products);
    });
    
    console.log('Data Service: Found total products:', allProducts.length);
    return allProducts;
  } catch (error) {
    console.error('Data Service: Error getting all products:', error);
    return [];
  }
};

// Convert portfolios to XML format
export const portfoliosToXML = (portfolios: Portfolio[]): string => {
  console.log('Data Service: Converting portfolios to XML');
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<Portfolios>\n';
  
  portfolios.forEach(portfolio => {
    xml += `  <Portfolio id="${portfolio.id}" name="${portfolio.name}">\n`;
    
    portfolio.products.forEach(product => {
      // Normalize filepath to use forward slashes consistently
      const normalizedFilepath = `data/product/${product.name.replace(/\s+/g, '-').toLowerCase()}.xml`;
      xml += `    <Product id="${product.id}" name="${product.name}" description="${product.description}" filepath="${normalizedFilepath}">\n`;
      
      // Add metrics
      if (product.metrics && product.metrics.length > 0) {
        product.metrics.forEach(metric => {
          xml += `      <Metric id="${metric.id}" name="${metric.name}" value="${metric.value}" previousValue="${metric.previousValue}" unit="${metric.unit}" timestamp="${metric.timestamp}" description="${metric.description}" month="${metric.month}" year="${metric.year}"`;
          if (metric.source) xml += ` source="${metric.source}"`;
          if (metric.category) xml += ` category="${metric.category}"`;
          if (metric.owner) xml += ` owner="${metric.owner}"`;
          xml += '/>\n';
        });
      }
      
      // Add roadmap
      if (product.roadmap && product.roadmap.length > 0) {
        product.roadmap.forEach(roadmap => {
          xml += `      <Roadmap id="${roadmap.id}" year="${roadmap.year}" quarter="${roadmap.quarter}" title="${roadmap.title}" description="${roadmap.description}" status="${roadmap.status}" createdAt="${roadmap.createdAt}" version="${roadmap.version}"`;
          if (roadmap.link) xml += ` link="${roadmap.link}"`;
          xml += '/>\n';
        });
      }
      
      // Add release goals
      if (product.releaseGoals && product.releaseGoals.length > 0) {
        product.releaseGoals.forEach(goal => {
          xml += `      <ReleaseGoal id="${goal.id}" month="${goal.month}" year="${goal.year}" description="${goal.description}" currentState="${goal.currentState}" targetState="${goal.targetState}" status="${goal.status}" createdAt="${goal.createdAt}" version="${goal.version}"`;
          if (goal.owner) xml += ` owner="${goal.owner}"`;
          if (goal.priority) xml += ` priority="${goal.priority}"`;
          if (goal.category) xml += ` category="${goal.category}"`;
          xml += '/>\n';
        });
      }
      
      // Add release plans
      if (product.releasePlans && product.releasePlans.length > 0) {
        product.releasePlans.forEach(plan => {
          xml += `      <ReleasePlan id="${plan.id}" month="${plan.month}" year="${plan.year}" title="${plan.title}" description="${plan.description}" category="${plan.category}" priority="${plan.priority}" source="${plan.source}" targetDate="${plan.targetDate}" owner="${plan.owner}" status="${plan.status}" createdAt="${plan.createdAt}" version="${plan.version}"/>\n`;
        });
      }
      
      // Add release notes
      if (product.releaseNotes && product.releaseNotes.length > 0) {
        product.releaseNotes.forEach(note => {
          xml += `      <ReleaseNote id="${note.id}" month="${note.month}" year="${note.year}" title="${note.title}" description="${note.description}" type="${note.type}" highlights="${note.highlights}" createdAt="${note.createdAt}" version="${note.version}"`;
          if (note.link) xml += ` link="${note.link}"`;
          xml += '/>\n';
        });
      }
      
      xml += '    </Product>\n';
    });
    
    xml += '  </Portfolio>\n';
  });
  
  xml += '</Portfolios>';
  return xml;
};

// Parse XML configuration
export const parseXMLConfig = async (xmlContent: string): Promise<Portfolio[]> => {
  console.log('Data Service: Parsing XML configuration');
  
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    
    const portfolios: Portfolio[] = [];
    const portfolioElements = xmlDoc.querySelectorAll('Portfolio');
    
    for (const portfolioEl of portfolioElements) {
      const portfolioId = portfolioEl.getAttribute('id') || '';
      const portfolioName = portfolioEl.getAttribute('name') || '';
      
      const portfolio: Portfolio = {
        id: portfolioId,
        name: portfolioName,
        description: '',
        products: []
      };
      
      const productElements = portfolioEl.querySelectorAll('Product');
      
      for (const productEl of productElements) {
        const productId = productEl.getAttribute('id') || '';
        const productName = productEl.getAttribute('name') || '';
        const productDescription = productEl.getAttribute('description') || '';
        
        const product: Product = {
          id: productId,
          name: productName,
          description: productDescription,
          metrics: [],
          roadmap: [],
          releaseGoals: [],
          releasePlans: [],
          releaseNotes: []
        };
        
        // Parse metrics, roadmap, goals, plans, notes similar to existing parsing logic
        const parsedProduct = parseProductXML(xmlDoc, product);
        if (parsedProduct) {
          portfolio.products.push(parsedProduct);
        }
      }
      
      portfolios.push(portfolio);
    }
    
    console.log('Data Service: Successfully parsed XML configuration');
    return portfolios;
  } catch (error) {
    console.error('Data Service: Error parsing XML configuration:', error);
    throw error;
  }
};

// Generate sample data
export const generateSampleData = (productId: string) => {
  console.log('Data Service: Generating sample data for product:', productId);
  
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  return {
    metrics: [
      {
        id: `metric-${Date.now()}-1`,
        name: 'Sample Performance Metric',
        value: 85.5,
        previousValue: 78.2,
        unit: '%',
        timestamp: now.toISOString(),
        description: 'Sample performance indicator',
        month: currentMonth,
        year: currentYear,
        source: 'Auto-generated',
        category: 'Performance',
        owner: 'System'
      }
    ],
    roadmap: {
      id: `roadmap-${Date.now()}`,
      year: currentYear,
      quarter: Math.ceil(currentMonth / 3) as 1 | 2 | 3 | 4,
      title: 'Sample Roadmap Item',
      description: 'Sample roadmap description',
      status: 'planned' as const,
      createdAt: now.toISOString(),
      version: '1.0',
      link: 'https://example.com/roadmap'
    },
    releaseGoal: {
      id: `goal-${Date.now()}`,
      month: currentMonth,
      year: currentYear,
      description: 'Sample release goal',
      currentState: 'Initial state',
      targetState: 'Target state',
      status: 'planned' as const,
      owner: 'System',
      priority: 'Medium',
      category: 'Enhancement',
      createdAt: now.toISOString(),
      version: 1
    },
    releasePlan: {
      id: `plan-${Date.now()}`,
      month: currentMonth,
      year: currentYear,
      title: 'Sample Release Plan',
      description: 'Sample release plan description',
      category: 'Enhancement' as const,
      priority: 'Medium' as const,
      source: 'Internal' as const,
      targetDate: now.toISOString(),
      owner: 'System',
      status: 'planned' as const,
      createdAt: now.toISOString(),
      version: 1
    },
    releaseNote: {
      id: `note-${Date.now()}`,
      month: currentMonth,
      year: currentYear,
      title: 'Sample Release Note',
      description: 'Sample release note description',
      type: 'feature' as const,
      highlights: 'Sample highlights',
      createdAt: now.toISOString(),
      version: 1,
      link: 'https://example.com/release-notes'
    }
  };
};
