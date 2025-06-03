
import { supabase } from '@/integrations/supabase/client';

export interface StorageAdapter {
  saveXML(path: string, content: string): Promise<boolean>;
  loadXML(path: string): Promise<string | null>;
  listXMLs(prefix?: string): Promise<string[]>;
  deleteXML(path: string): Promise<boolean>;
  publishXML(path: string, content: string): Promise<boolean>;
}

export interface StorageConfig {
  type: 'local' | 'supabase';
  supabaseUrl?: string;
  supabaseKey?: string;
  bucketName?: string;
}

// Local storage adapter (fallback behavior)
class LocalStorageAdapter implements StorageAdapter {
  async saveXML(path: string, content: string): Promise<boolean> {
    try {
      // Normalize path to use forward slashes
      const normalizedPath = path.replace(/\\/g, '/');
      localStorage.setItem(normalizedPath, content);
      console.log('LocalStorageAdapter: Successfully saved to:', normalizedPath);
      return true;
    } catch (error) {
      console.error('LocalStorageAdapter: Error saving XML:', error);
      return false;
    }
  }

  async loadXML(path: string): Promise<string | null> {
    try {
      // Normalize path to use forward slashes
      const normalizedPath = path.replace(/\\/g, '/');
      const content = localStorage.getItem(normalizedPath);
      console.log('LocalStorageAdapter: Load result for', normalizedPath, ':', content ? 'found' : 'not found');
      return content;
    } catch (error) {
      console.error('LocalStorageAdapter: Error loading XML:', error);
      return null;
    }
  }

  async listXMLs(prefix?: string): Promise<string[]> {
    try {
      const keys = Object.keys(localStorage);
      const normalizedPrefix = prefix?.replace(/\\/g, '/');
      const filteredKeys = normalizedPrefix ? keys.filter(key => key.startsWith(normalizedPrefix)) : keys;
      console.log('LocalStorageAdapter: Listed', filteredKeys.length, 'files for prefix:', normalizedPrefix);
      return filteredKeys;
    } catch (error) {
      console.error('LocalStorageAdapter: Error listing XMLs:', error);
      return [];
    }
  }

  async deleteXML(path: string): Promise<boolean> {
    try {
      // Normalize path to use forward slashes
      const normalizedPath = path.replace(/\\/g, '/');
      localStorage.removeItem(normalizedPath);
      console.log('LocalStorageAdapter: Successfully deleted:', normalizedPath);
      return true;
    } catch (error) {
      console.error('LocalStorageAdapter: Error deleting XML:', error);
      return false;
    }
  }

  async publishXML(path: string, content: string): Promise<boolean> {
    // For local storage, publishing is the same as saving with a published prefix
    const publishedPath = `published/${path.replace(/\\/g, '/')}`;
    return this.saveXML(publishedPath, content);
  }
}

// Supabase storage adapter with automatic fallback
class SupabaseStorageAdapter implements StorageAdapter {
  private config: StorageConfig;
  private fallbackAdapter: LocalStorageAdapter;

  constructor(config: StorageConfig) {
    this.config = config;
    this.fallbackAdapter = new LocalStorageAdapter();
  }

  private async withFallback<T>(
    operation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    try {
      console.log(`SupabaseStorageAdapter: Attempting ${operationName} via Supabase`);
      return await operation();
    } catch (error) {
      console.warn(`SupabaseStorageAdapter: ${operationName} failed, falling back to localStorage:`, error);
      return await fallbackOperation();
    }
  }

  async saveXML(path: string, content: string): Promise<boolean> {
    // Normalize path to use forward slashes
    const normalizedPath = path.replace(/\\/g, '/');
    
    return this.withFallback(
      async () => {
        const { data, error } = await supabase.functions.invoke('save-xml', {
          body: { 
            path: normalizedPath, 
            content, 
            bucket: this.config.bucketName || 'xml-storage'
          }
        });

        if (error) {
          throw new Error(`Supabase save error: ${error.message}`);
        }

        console.log('SupabaseStorageAdapter: Successfully saved XML via Supabase:', normalizedPath);
        return true;
      },
      () => this.fallbackAdapter.saveXML(normalizedPath, content),
      'saveXML'
    );
  }

  async loadXML(path: string): Promise<string | null> {
    // Normalize path to use forward slashes
    const normalizedPath = path.replace(/\\/g, '/');
    
    return this.withFallback(
      async () => {
        const { data, error } = await supabase.functions.invoke('load-xml', {
          body: { 
            path: normalizedPath, 
            bucket: this.config.bucketName || 'xml-storage'
          }
        });

        if (error) {
          throw new Error(`Supabase load error: ${error.message}`);
        }

        return data?.content || null;
      },
      () => this.fallbackAdapter.loadXML(normalizedPath),
      'loadXML'
    );
  }

  async listXMLs(prefix?: string): Promise<string[]> {
    // Normalize prefix to use forward slashes
    const normalizedPrefix = prefix?.replace(/\\/g, '/');
    
    return this.withFallback(
      async () => {
        const { data, error } = await supabase.functions.invoke('list-xmls', {
          body: { 
            prefix: normalizedPrefix, 
            bucket: this.config.bucketName || 'xml-storage'
          }
        });

        if (error) {
          throw new Error(`Supabase list error: ${error.message}`);
        }

        return data?.files || [];
      },
      () => this.fallbackAdapter.listXMLs(normalizedPrefix),
      'listXMLs'
    );
  }

  async deleteXML(path: string): Promise<boolean> {
    // Normalize path to use forward slashes
    const normalizedPath = path.replace(/\\/g, '/');
    
    return this.withFallback(
      async () => {
        const { data, error } = await supabase.functions.invoke('delete-xml', {
          body: { 
            path: normalizedPath, 
            bucket: this.config.bucketName || 'xml-storage'
          }
        });

        if (error) {
          throw new Error(`Supabase delete error: ${error.message}`);
        }

        return true;
      },
      () => this.fallbackAdapter.deleteXML(normalizedPath),
      'deleteXML'
    );
  }

  async publishXML(path: string, content: string): Promise<boolean> {
    // Normalize path and add published prefix
    const normalizedPath = path.replace(/\\/g, '/');
    const publishedPath = `published/${normalizedPath}`;
    
    return this.saveXML(publishedPath, content);
  }
}

// Storage service factory
class StorageService {
  private adapter: StorageAdapter;
  private config: StorageConfig;

  constructor(config?: StorageConfig) {
    this.config = config || this.getDefaultConfig();
    this.adapter = this.createAdapter();
  }

  private getDefaultConfig(): StorageConfig {
    // Default to Supabase storage since we have it connected
    return {
      type: 'supabase',
      supabaseUrl: 'https://kejfopmmiyhpxgbfarmg.supabase.co',
      supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlamZvcG1taXlocHhnYmZhcm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4Njk1MTIsImV4cCI6MjA2NDQ0NTUxMn0.2YoIY2Uy9ih5Oy-80nZujhD-bDJfFtE7EZS56n7uH5M',
      bucketName: 'xml-storage'
    };
  }

  private createAdapter(): StorageAdapter {
    switch (this.config.type) {
      case 'supabase':
        return new SupabaseStorageAdapter(this.config);
      default:
        return new LocalStorageAdapter();
    }
  }

  async save(path: string, content: string): Promise<boolean> {
    return this.adapter.saveXML(path, content);
  }

  async load(path: string): Promise<string | null> {
    return this.adapter.loadXML(path);
  }

  async list(prefix?: string): Promise<string[]> {
    return this.adapter.listXMLs(prefix);
  }

  async delete(path: string): Promise<boolean> {
    return this.adapter.deleteXML(path);
  }

  async publish(path: string, content: string): Promise<boolean> {
    return this.adapter.publishXML(path, content);
  }

  // Batch operations
  async saveBatch(items: Array<{ path: string; content: string }>): Promise<boolean[]> {
    const results = await Promise.all(
      items.map(item => this.save(item.path, item.content))
    );
    return results;
  }

  async publishBatch(items: Array<{ path: string; content: string }>): Promise<boolean[]> {
    const results = await Promise.all(
      items.map(item => this.publish(item.path, item.content))
    );
    return results;
  }

  getConfig(): StorageConfig {
    return this.config;
  }

  // Switch storage backend
  switchBackend(config: StorageConfig): void {
    this.config = config;
    this.adapter = this.createAdapter();
  }
}

// Export singleton instance
export const storageService = new StorageService();
export default StorageService;
