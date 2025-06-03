
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, List, Trash2, CheckCircle, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { storageService } from '@/services/storageService';
import { xmlApiService } from '@/services/xmlApiService';
import { getPortfolios } from '@/lib/data';
import { useToast } from '@/components/ui/use-toast';

export const XMLPublishingWorkflow: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [publishedFiles, setPublishedFiles] = useState<string[]>([]);
  const [lastPublishResult, setLastPublishResult] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const { toast } = useToast();

  const testConnection = async () => {
    setIsLoading(true);
    try {
      console.log('Testing Supabase storage connection...');
      
      const testContent = `<?xml version="1.0" encoding="UTF-8"?>
<ConnectionTest>
  <Message>Connection test at ${new Date().toISOString()}</Message>
  <Status>Testing storage connectivity</Status>
</ConnectionTest>`;
      
      const testPath = `test/connection-test-${Date.now()}.xml`;
      
      // Test save operation
      console.log('Testing save operation...');
      const saveResult = await storageService.save(testPath, testContent);
      if (!saveResult) {
        throw new Error('Failed to save test file to storage');
      }
      console.log('Save test successful');
      
      // Test load operation
      console.log('Testing load operation...');
      const loadResult = await storageService.load(testPath);
      if (!loadResult) {
        throw new Error('Failed to load test file from storage');
      }
      console.log('Load test successful');
      
      // Test list operation via XML API
      console.log('Testing list operation...');
      const listResult = await xmlApiService.getPublishedXMLs();
      if (!listResult.success) {
        console.warn('List operation failed, but connection is working:', listResult.error);
      } else {
        console.log('List test successful');
      }
      
      // Clean up test file
      try {
        await storageService.delete(testPath);
        console.log('Test file cleanup successful');
      } catch (cleanupError) {
        console.warn('Test file cleanup failed (this is okay):', cleanupError);
      }
      
      setConnectionStatus('connected');
      toast({
        title: "Connection Test Successful",
        description: "Supabase Storage and Edge Functions are working correctly",
      });
      
    } catch (error) {
      console.error('Connection test error:', error);
      setConnectionStatus('disconnected');
      const errorMessage = error instanceof Error ? error.message : "Unknown error during connection test";
      toast({
        title: "Connection Test Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishAll = async () => {
    setIsLoading(true);
    setLastPublishResult(null);
    
    try {
      console.log('Starting enhanced publish workflow...');
      
      // Get all portfolios data
      const portfolios = await getPortfolios();
      console.log('Loaded portfolios:', portfolios.length);

      if (!portfolios || portfolios.length === 0) {
        throw new Error('No portfolios found to publish');
      }

      // Use the enhanced XML API service to publish all portfolios
      const result = await xmlApiService.publishPortfolioXMLs(portfolios);
      
      setLastPublishResult(result);
      
      if (result.success) {
        setConnectionStatus('connected');
        toast({
          title: "Publishing Successful",
          description: `Successfully published ${result.data?.publishedCount || 0} out of ${result.data?.totalCount || 0} XML files`,
        });
        
        // Refresh the published files list
        await loadPublishedFiles();
      } else {
        setConnectionStatus('disconnected');
        toast({
          title: "Publishing Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Publish workflow error:', error);
      setConnectionStatus('disconnected');
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during publishing';
      
      setLastPublishResult({
        success: false,
        error: errorMessage
      });
      
      toast({
        title: "Publishing Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPublishedFiles = async () => {
    setIsRefreshing(true);
    try {
      const result = await xmlApiService.getPublishedXMLs();
      if (result.success) {
        setPublishedFiles(result.data || []);
        setConnectionStatus('connected');
        console.log('Loaded published files:', result.data?.length || 0);
      } else {
        console.error('Error loading published files:', result.error);
        setConnectionStatus('disconnected');
        toast({
          title: "Error loading files",
          description: result.error || "Failed to load published files",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading published files:', error);
      setConnectionStatus('disconnected');
      toast({
        title: "Error loading files",
        description: "Failed to load published files",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDownloadXML = async (filename: string) => {
    try {
      const result = await xmlApiService.getPublishedXML(filename);
      if (result.success && result.data) {
        // Create download link
        const blob = new Blob([result.data], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Download Started",
          description: `Downloading ${filename}`,
        });
      } else {
        toast({
          title: "Download Failed",
          description: result.error || "Failed to download XML file",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download XML file",
        variant: "destructive",
      });
    }
  };

  React.useEffect(() => {
    loadPublishedFiles();
  }, []);

  const ConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="text-green-500" size={16} />;
      case 'disconnected':
        return <WifiOff className="text-red-500" size={16} />;
      default:
        return <RefreshCw className="text-gray-400" size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            XML Publishing Workflow
            <ConnectionStatusIcon />
          </CardTitle>
          <CardDescription>
            Publish product data to Supabase Storage and manage XML files with enhanced error handling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handlePublishAll} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Upload size={16} />
              {isLoading ? 'Publishing...' : 'Publish All Products'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={testConnection}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <CheckCircle size={16} />
              {isLoading ? 'Testing...' : 'Test Connection'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={loadPublishedFiles}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh List
            </Button>
          </div>

          {connectionStatus !== 'unknown' && (
            <div className={`p-3 rounded-lg border ${
              connectionStatus === 'connected' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                <ConnectionStatusIcon />
                <span className="font-medium">
                  Connection Status: {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {connectionStatus === 'disconnected' && (
                <p className="text-sm mt-1">
                  Edge Functions or Storage may be unavailable. Try testing the connection.
                </p>
              )}
            </div>
          )}

          {lastPublishResult && (
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {lastPublishResult.success ? (
                  <CheckCircle className="text-green-500" size={16} />
                ) : (
                  <AlertCircle className="text-red-500" size={16} />
                )}
                <span className="font-medium">
                  Last Publish Result: {lastPublishResult.success ? 'Success' : 'Failed'}
                </span>
              </div>
              {lastPublishResult.success && lastPublishResult.data && (
                <div className="text-sm text-gray-600">
                  <p>Published {lastPublishResult.data.publishedCount} out of {lastPublishResult.data.totalCount} files</p>
                  {lastPublishResult.data.bucket && (
                    <p className="text-xs">Bucket: {lastPublishResult.data.bucket}</p>
                  )}
                  {lastPublishResult.data.timestamp && (
                    <p className="text-xs">Timestamp: {new Date(lastPublishResult.data.timestamp).toLocaleString()}</p>
                  )}
                  {lastPublishResult.data.results && (
                    <div className="mt-2">
                      <p className="font-medium">Details:</p>
                      <ul className="list-disc list-inside ml-2">
                        {lastPublishResult.data.results.map((result: any, index: number) => (
                          <li key={index} className={result.success ? 'text-green-600' : 'text-red-600'}>
                            {result.path}: {result.success ? 'Success' : result.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {!lastPublishResult.success && (
                <p className="text-sm text-red-600">
                  Error: {lastPublishResult.error}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Published XML Files</CardTitle>
          <CardDescription>
            Manage and download published XML files from Supabase Storage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {publishedFiles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No published files found</p>
              <Button variant="outline" onClick={loadPublishedFiles} disabled={isRefreshing}>
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin mr-2' : 'mr-2'} />
                Refresh
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {publishedFiles.map((filename) => (
                <div key={filename} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">XML</Badge>
                    <span className="font-medium">{filename}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadXML(filename)}
                      className="flex items-center gap-1"
                    >
                      <Download size={14} />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default XMLPublishingWorkflow;
