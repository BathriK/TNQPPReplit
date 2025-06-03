
import { createEmbedding } from './embeddings';
import { Portfolio, Product, SearchResult } from './types';
import { generateId } from './utils';

// In-memory vector store for embeddings
interface VectorEntry {
  id: string;
  type: 'portfolio' | 'product' | 'goal' | 'plan' | 'note' | 'metric';
  text: string;
  embedding: number[];
  metadata: {
    portfolioId?: string;
    portfolioName?: string;
    productId?: string;
    productName?: string;
    field?: string;
    originalText?: string;
  };
}

let vectorStore: VectorEntry[] = [];
let isVectorStoreInitialized = false;

// Compute cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same dimensions');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Initialize the vector store with portfolio data
export async function initializeVectorStore(portfolios: Portfolio[]): Promise<void> {
  try {
    console.log("Initializing vector store with portfolios data...");
    
    // Clear existing store
    vectorStore = [];
    
    // Process portfolios
    for (const portfolio of portfolios) {
      // Add portfolio name
      const portfolioText = `Portfolio: ${portfolio.name}`;
      const portfolioEmbedding = await createEmbedding(portfolioText);
      
      vectorStore.push({
        id: `portfolio-${portfolio.id}`,
        type: 'portfolio',
        text: portfolioText,
        embedding: portfolioEmbedding,
        metadata: {
          portfolioId: portfolio.id,
          portfolioName: portfolio.name,
          field: 'name',
          originalText: portfolio.name
        }
      });
      
      // Process products
      for (const product of portfolio.products) {
        // Add product name
        const productNameText = `Product: ${product.name}`;
        const productNameEmbedding = await createEmbedding(productNameText);
        
        vectorStore.push({
          id: `product-${product.id}-name`,
          type: 'product',
          text: productNameText,
          embedding: productNameEmbedding,
          metadata: {
            portfolioId: portfolio.id,
            portfolioName: portfolio.name,
            productId: product.id,
            productName: product.name,
            field: 'name',
            originalText: product.name
          }
        });
        
        // Add product description
        if (product.description) {
          const productDescText = `Product description: ${product.description}`;
          const productDescEmbedding = await createEmbedding(productDescText);
          
          vectorStore.push({
            id: `product-${product.id}-description`,
            type: 'product',
            text: productDescText,
            embedding: productDescEmbedding,
            metadata: {
              portfolioId: portfolio.id,
              portfolioName: portfolio.name,
              productId: product.id,
              productName: product.name,
              field: 'description',
              originalText: product.description
            }
          });
        }
        
        // Add release goals
        for (const goal of product.releaseGoals) {
          // Add individual goal items
          if (goal.goals && goal.goals.length > 0) {
            for (const item of goal.goals) {
              const goalText = `Goal for ${product.name} (${goal.month}/${goal.year}): ${item.description}. Current state: ${item.currentState}. Target state: ${item.targetState}`;
              const goalEmbedding = await createEmbedding(goalText);
              
              vectorStore.push({
                id: `goal-${item.id}`,
                type: 'goal',
                text: goalText,
                embedding: goalEmbedding,
                metadata: {
                  portfolioId: portfolio.id,
                  portfolioName: portfolio.name,
                  productId: product.id,
                  productName: product.name,
                  field: 'goals',
                  originalText: item.description
                }
              });
            }
          } 
          // Handle legacy format
          else if (goal.goal) {
            const goalText = `Goal for ${product.name} (${goal.month}/${goal.year}): ${goal.goal}. Current state: ${goal.currentState || ''}. Future state: ${goal.futureState || ''}`;
            const goalEmbedding = await createEmbedding(goalText);
            
            vectorStore.push({
              id: `goal-${goal.id}`,
              type: 'goal',
              text: goalText,
              embedding: goalEmbedding,
              metadata: {
                portfolioId: portfolio.id,
                portfolioName: portfolio.name,
                productId: product.id,
                productName: product.name,
                field: 'goal',
                originalText: goal.goal
              }
            });
          }
        }
        
        // Add release plans
        for (const plan of product.releasePlans) {
          if (plan.items && plan.items.length > 0) {
            for (const item of plan.items) {
              const planOwner = item.owner ? `Owner: ${item.owner}` : '';
              const planText = `Plan for ${product.name} (${plan.month}/${plan.year}): ${item.title}. ${item.description}. Status: ${item.status}. ${planOwner}`;
              const planEmbedding = await createEmbedding(planText);
              
              vectorStore.push({
                id: `plan-${item.id}`,
                type: 'plan',
                text: planText,
                embedding: planEmbedding,
                metadata: {
                  portfolioId: portfolio.id,
                  portfolioName: portfolio.name,
                  productId: product.id,
                  productName: product.name,
                  field: 'plan',
                  originalText: item.title
                }
              });
            }
          }
        }
        
        // Add metrics (might be useful for questions about performance)
        for (const metric of product.metrics) {
          const metricText = `Metric for ${product.name}: ${metric.name} = ${metric.value} ${metric.unit}. ${metric.description || ''}`;
          const metricEmbedding = await createEmbedding(metricText);
          
          vectorStore.push({
            id: `metric-${metric.id}`,
            type: 'metric',
            text: metricText,
            embedding: metricEmbedding,
            metadata: {
              portfolioId: portfolio.id,
              portfolioName: portfolio.name,
              productId: product.id,
              productName: product.name,
              field: 'metric',
              originalText: metric.name
            }
          });
        }
      }
    }
    
    console.log(`Vector store initialized with ${vectorStore.length} entries.`);
    isVectorStoreInitialized = true;
    
  } catch (error) {
    console.error("Failed to initialize vector store:", error);
    throw error;
  }
}

// Check if vector store is initialized
export function isInitialized(): boolean {
  return isVectorStoreInitialized;
}

// Perform semantic search
export async function semanticSearch(query: string, topK: number = 5): Promise<SearchResult[]> {
  try {
    if (vectorStore.length === 0) {
      console.warn("Vector store is empty. Initialize it first.");
      return [];
    }
    
    // Create embedding for the query
    const queryEmbedding = await createEmbedding(query);
    
    // Calculate similarities with all vectors
    const results = vectorStore.map(entry => {
      const similarity = cosineSimilarity(queryEmbedding, entry.embedding);
      return {
        ...entry,
        similarity
      };
    });
    
    // Sort by similarity (descending)
    results.sort((a, b) => b.similarity - a.similarity);
    
    // Take top K results
    const topResults = results.slice(0, topK);
    
    // Convert to SearchResult format
    const searchResults: SearchResult[] = topResults.map(result => {
      // Extract relevant information based on the entry type
      let matchField = result.metadata.field || 'semantic';
      let matchValue = result.metadata.originalText || '';
      
      // Enhanced descriptions for different entry types
      if (result.type === 'goal') {
        matchField = 'Goal';
      } else if (result.type === 'plan') {
        matchField = 'Plan';
      } else if (result.type === 'note') {
        matchField = 'Note';
      } else if (result.type === 'metric') {
        matchField = 'Metric';
      }
      
      return {
        type: (result.type === 'portfolio') ? 'portfolio' : 'product',
        id: (result.type === 'portfolio') ? result.metadata.portfolioId! : result.metadata.productId!,
        name: (result.type === 'portfolio') ? result.metadata.portfolioName! : result.metadata.productName!,
        portfolioId: result.metadata.portfolioId,
        portfolioName: result.metadata.portfolioName,
        matchField,
        matchValue,
        semanticScore: result.similarity,
        semanticText: result.text
      };
    });
    
    return searchResults;
    
  } catch (error) {
    console.error("Semantic search failed:", error);
    return [];
  }
}
