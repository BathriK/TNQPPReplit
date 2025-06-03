import { supabase } from '@/integrations/supabase/client';
import { Portfolio, Product } from '@/lib/types';

export interface XMLOperationResult {
  success: boolean;
  data?: any;
  error?: string;
}

class XMLApiService {
  private static instance: XMLApiService;

  public static getInstance(): XMLApiService {
    if (!XMLApiService.instance) {
      XMLApiService.instance = new XMLApiService();
    }
    return XMLApiService.instance;
  }

  // Generate XML content for a product
  private generateProductXML(product: Product): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<Product id="${this.escapeXml(product.id)}" name="${this.escapeXml(product.name)}" description="${this.escapeXml(product.description || '')}">\n`;
    
    // Add metrics
    if (product.metrics && product.metrics.length > 0) {
      xml += '  <Metrics>\n';
      product.metrics.forEach((metric) => {
        xml += `    <Metric`;
        xml += ` id="${this.escapeXml(metric.id)}"`;
        xml += ` name="${this.escapeXml(metric.name)}"`;
        xml += ` value="${this.escapeXml(String(metric.value || ''))}"`;
        xml += ` previousValue="${this.escapeXml(String(metric.previousValue || ''))}"`;
        xml += ` unit="${this.escapeXml(metric.unit || '')}"`;
        xml += ` timestamp="${this.escapeXml(metric.timestamp || '')}"`;
        xml += ` description="${this.escapeXml(metric.description || '')}"`;
        xml += ` month="${this.escapeXml(String(metric.month || ''))}"`;
        xml += ` year="${this.escapeXml(String(metric.year || ''))}"`;
        if (metric.source) xml += ` source="${this.escapeXml(metric.source)}"`;
        if (metric.category) xml += ` category="${this.escapeXml(metric.category)}"`;
        if (metric.owner) xml += ` owner="${this.escapeXml(metric.owner)}"`;
        xml += '/>\n';
      });
      xml += '  </Metrics>\n';
    } else {
      console.log(`XMLApiService: No metrics to add to XML for product: ${product.name}`);
    }
    
    // Add roadmap
    if (product.roadmap && product.roadmap.length > 0) {
      xml += '  <Roadmaps>\n';
      product.roadmap.forEach((roadmap) => {
        xml += `    <Roadmap`;
        xml += ` id="${this.escapeXml(roadmap.id)}"`;
        xml += ` year="${this.escapeXml(String(roadmap.year || ''))}"`;
        xml += ` quarter="${this.escapeXml(String(roadmap.quarter || ''))}"`;
        xml += ` title="${this.escapeXml(roadmap.title)}"`;
        xml += ` description="${this.escapeXml(roadmap.description || '')}"`;
        xml += ` status="${this.escapeXml(roadmap.status)}"`;
        xml += ` createdAt="${this.escapeXml(roadmap.createdAt || '')}"`;
        xml += ` version="${this.escapeXml(String(roadmap.version || ''))}"`;
        if (roadmap.link) xml += ` link="${this.escapeXml(roadmap.link)}"`;
        xml += '/>\n';
      });
      xml += '  </Roadmaps>\n';
    }
    
    // Add release goals
    if (product.releaseGoals && product.releaseGoals.length > 0) {
      xml += '  <ReleaseGoals>\n';
      product.releaseGoals.forEach((goal) => {
        xml += `    <ReleaseGoal`;
        xml += ` id="${this.escapeXml(goal.id)}"`;
        xml += ` month="${this.escapeXml(String(goal.month || ''))}"`;
        xml += ` year="${this.escapeXml(String(goal.year || ''))}"`;
        xml += ` description="${this.escapeXml(goal.description || '')}"`;
        xml += ` currentState="${this.escapeXml(goal.currentState || '')}"`;
        xml += ` targetState="${this.escapeXml(goal.targetState || '')}"`;
        xml += ` status="${this.escapeXml(goal.status)}"`;
        xml += ` createdAt="${this.escapeXml(goal.createdAt || '')}"`;
        xml += ` version="${this.escapeXml(String(goal.version || ''))}"`;
        if (goal.owner) xml += ` owner="${this.escapeXml(goal.owner)}"`;
        if (goal.priority) xml += ` priority="${this.escapeXml(goal.priority)}"`;
        if (goal.category) xml += ` category="${this.escapeXml(goal.category)}"`;
        xml += '/>\n';
      });
      xml += '  </ReleaseGoals>\n';
    }
    
    // Add release plans
    if (product.releasePlans && product.releasePlans.length > 0) {
      xml += '  <ReleasePlans>\n';
      product.releasePlans.forEach((plan) => {
        xml += `    <ReleasePlan`;
        xml += ` id="${this.escapeXml(plan.id)}"`;
        xml += ` month="${this.escapeXml(String(plan.month || ''))}"`;
        xml += ` year="${this.escapeXml(String(plan.year || ''))}"`;
        xml += ` title="${this.escapeXml(plan.title)}"`;
        xml += ` description="${this.escapeXml(plan.description || '')}"`;
        xml += ` category="${this.escapeXml(plan.category || '')}"`;
        xml += ` priority="${this.escapeXml(plan.priority || '')}"`;
        xml += ` source="${this.escapeXml(plan.source || '')}"`;
        xml += ` targetDate="${this.escapeXml(plan.targetDate || '')}"`;
        xml += ` owner="${this.escapeXml(plan.owner || '')}"`;
        xml += ` status="${this.escapeXml(plan.status)}"`;
        xml += ` createdAt="${this.escapeXml(plan.createdAt || '')}"`;
        xml += ` version="${this.escapeXml(String(plan.version || ''))}"`;
        xml += '/>\n';
      });
      xml += '  </ReleasePlans>\n';
    }
    
    // Add release notes
    if (product.releaseNotes && product.releaseNotes.length > 0) {
      xml += '  <ReleaseNotes>\n';
      product.releaseNotes.forEach((note) => {
        xml += `    <ReleaseNote`;
        xml += ` id="${this.escapeXml(note.id)}"`;
        xml += ` month="${this.escapeXml(String(note.month || ''))}"`;
        xml += ` year="${this.escapeXml(String(note.year || ''))}"`;
        xml += ` title="${this.escapeXml(note.title)}"`;
        xml += ` description="${this.escapeXml(note.description || '')}"`;
        xml += ` type="${this.escapeXml(note.type)}"`;
        xml += ` highlights="${this.escapeXml(note.highlights || '')}"`;
        xml += ` createdAt="${this.escapeXml(note.createdAt || '')}"`;
        xml += ` version="${this.escapeXml(String(note.version || ''))}"`;
        if (note.link) xml += ` link="${this.escapeXml(note.link)}"`;
        xml += '/>\n';
      });
      xml += '  </ReleaseNotes>\n';
    }
    
    xml += '</Product>';
    return xml;
  }

  // Generate combined XML for multiple portfolios
  private generatePortfolioXML(portfolios: Portfolio[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<PortfolioConfiguration>\n';
    
    portfolios.forEach((portfolio) => {
      xml += `  <Portfolio id="${this.escapeXml(portfolio.id)}" name="${this.escapeXml(portfolio.name)}">\n`;
      
      portfolio.products.forEach((product) => {
        const productXmlLines = this.generateProductXML(product).split('\n');
        // Skip the XML declaration and add proper indentation
        for (let i = 1; i < productXmlLines.length; i++) {
          const line = productXmlLines[i];
          if (line.trim()) {
            xml += `    ${line}\n`;
          }
        }
      });
      
      xml += '  </Portfolio>\n';
    });
    
    xml += '</PortfolioConfiguration>';
    return xml;
  }

  // Escape XML special characters
  private escapeXml(text: string): string {
    if (typeof text !== 'string') return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // Test edge function connectivity
  private async testEdgeFunctionConnectivity(): Promise<boolean> {
    try {
      console.log('XMLApiService: Testing edge function connectivity...');
      
      // Test with a simple request to list-xmls
      const { data, error } = await supabase.functions.invoke('list-xmls', {
        body: { prefix: 'test', bucket: 'xml-storage' }
      });

      if (error) {
        console.error('XMLApiService: Edge function connectivity test failed:', error);
        return false;
      }

      console.log('XMLApiService: Edge function connectivity test passed');
      return true;
    } catch (error) {
      console.error('XMLApiService: Edge function connectivity test exception:', error);
      return false;
    }
  }

  // Enhanced error handling wrapper
  private async callEdgeFunction(functionName: string, payload: any, operation: string): Promise<any> {
    try {
      console.log(`XMLApiService: Calling ${functionName} for ${operation}`);
      console.log(`XMLApiService: Payload size: ${JSON.stringify(payload).length} characters`);

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });

      if (error) {
        console.error(`XMLApiService: ${functionName} error:`, error);
        throw new Error(`Edge Function error (${functionName}): ${error.message}`);
      }

      if (!data) {
        console.error(`XMLApiService: ${functionName} returned no data`);
        throw new Error(`${functionName} returned no data`);
      }

      if (!data.success) {
        const errorMsg = data.error || `Unknown error from ${functionName}`;
        console.error(`XMLApiService: ${functionName} operation failed:`, errorMsg);
        throw new Error(errorMsg);
      }

      console.log(`XMLApiService: ${functionName} completed successfully`);
      return data;

    } catch (error) {
      console.error(`XMLApiService: Exception in ${functionName}:`, error);
      
      // Re-throw with more context
      if (error instanceof Error) {
        throw new Error(`${operation} failed: ${error.message}`);
      } else {
        throw new Error(`${operation} failed: Unknown error`);
      }
    }
  }

  // Publish multiple portfolios as XML files
  async publishPortfolioXMLs(portfolios: Portfolio[]): Promise<XMLOperationResult> {
    try {
      console.log(`XMLApiService: Publishing ${portfolios.length} portfolios`);
      
      // Test connectivity first
      const isConnected = await this.testEdgeFunctionConnectivity();
      if (!isConnected) {
        throw new Error('Edge Functions are not accessible. Please check your Supabase configuration.');
      }
      
      const items = [];
      
      // Add individual product XMLs
      for (const portfolio of portfolios) {
        for (const product of portfolio.products) {
          const productXML = this.generateProductXML(product);
          const filename = `${product.name.replace(/\s+/g, '-').toLowerCase()}-${product.id}.xml`;
          items.push({
            path: filename,
            content: productXML
          });
        }
      }
      
      // Add combined portfolio XML
      const combinedXML = this.generatePortfolioXML(portfolios);
      items.push({
        path: 'all-portfolios.xml',
        content: combinedXML
      });

      console.log(`XMLApiService: Prepared ${items.length} XML files for publishing`);

      // Call edge function with enhanced error handling
      const data = await this.callEdgeFunction('publish-xml', { items }, 'Portfolio publishing');

      console.log(`XMLApiService: Successfully published ${data.publishedCount} out of ${data.totalCount} files`);
      
      return {
        success: true,
        data: {
          publishedCount: data.publishedCount,
          totalCount: data.totalCount,
          results: data.results,
          paths: items.map(item => item.path),
          bucket: data.bucket,
          timestamp: data.timestamp
        }
      };

    } catch (error) {
      console.error('XMLApiService: Error in publishPortfolioXMLs:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during publishing';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Publish a single product XML
  async publishProductXML(productId: string, product: Product): Promise<XMLOperationResult> {
    try {
      console.log(`XMLApiService: Publishing single product: ${product.name}`);
      
      const productXML = this.generateProductXML(product);
      const filename = `${product.name.replace(/\s+/g, '-').toLowerCase()}-${productId}.xml`;
      
      const data = await this.callEdgeFunction('publish-xml', {
        items: [{ 
          path: filename, 
          content: productXML 
        }] 
      }, 'Single product publishing');

      return {
        success: true,
        data: { 
          path: filename,
          bucket: data.bucket,
          timestamp: data.timestamp
        }
      };

    } catch (error) {
      console.error('XMLApiService: Error in publishProductXML:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during publishing'
      };
    }
  }

  // Get list of published XMLs
  async getPublishedXMLs(): Promise<XMLOperationResult> {
    try {
      console.log('XMLApiService: Getting list of published XMLs');
      
      const data = await this.callEdgeFunction('list-xmls', {
        prefix: 'published/',
        bucket: 'xml-storage'
      }, 'List published XMLs');

      console.log(`XMLApiService: Found ${data.files?.length || 0} published XML files`);

      return {
        success: true,
        data: data.files || []
      };

    } catch (error) {
      console.error('XMLApiService: Error in getPublishedXMLs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during listing'
      };
    }
  }

  // Get a published XML file content
  async getPublishedXML(filename: string): Promise<XMLOperationResult> {
    try {
      console.log(`XMLApiService: Getting published XML: ${filename}`);
      
      const data = await this.callEdgeFunction('load-xml', {
        path: `published/${filename}`,
        bucket: 'xml-storage'
      }, 'Load published XML');

      console.log(`XMLApiService: Loaded XML file ${filename} (${data.size} chars)`);

      return {
        success: true,
        data: data.content
      };

    } catch (error) {
      console.error('XMLApiService: Error in getPublishedXML:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during loading'
      };
    }
  }

  // Save XML file
  async saveXML(path: string, content: string): Promise<XMLOperationResult> {
    try {
      console.log(`XMLApiService: Saving XML to: ${path}`);
      
      const data = await this.callEdgeFunction('save-xml', {
        path, 
        content,
        bucket: 'xml-storage'
      }, 'Save XML');

      return {
        success: true,
        data: { 
          path: data.path,
          bucket: data.bucket,
          timestamp: data.timestamp
        }
      };

    } catch (error) {
      console.error('XMLApiService: Error in saveXML:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during saving'
      };
    }
  }

  // Load XML file
  async loadXML(path: string): Promise<XMLOperationResult> {
    try {
      console.log(`XMLApiService: Loading XML from: ${path}`);
      
      const data = await this.callEdgeFunction('load-xml', {
        path,
        bucket: 'xml-storage'
      }, 'Load XML');

      return {
        success: true,
        data: data.content
      };

    } catch (error) {
      console.error('XMLApiService: Error in loadXML:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during loading'
      };
    }
  }

  // Delete XML file
  async deleteXML(path: string): Promise<XMLOperationResult> {
    try {
      console.log(`XMLApiService: Deleting XML: ${path}`);
      
      const data = await this.callEdgeFunction('delete-xml', {
        path,
        bucket: 'xml-storage'
      }, 'Delete XML');

      return {
        success: true
      };

    } catch (error) {
      console.error('XMLApiService: Error in deleteXML:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during deletion'
      };
    }
  }
}

// Export singleton instance
export const xmlApiService = XMLApiService.getInstance();
