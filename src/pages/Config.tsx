import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  exportAllProductsXML,
  importProductXML,
  publishXMLsToSite,
  getPublishedXML,
  listPublishedXMLs
} from "@/lib/xmlUtils";
import { getPortfolios, updatePortfolios } from "@/lib/data";
import DataExportImport from "../components/DataExportImport";
import XMLPublishingWorkflow from '../components/XMLPublishingWorkflow';

const Config = () => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedFiles, setPublishedFiles] = useState<string[]>([]);
  const { toast } = useToast();

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await publishXMLsToSite();
      toast({
        title: "Publishing Successful",
        description: "Successfully published XML files to the site.",
      });
      loadPublishedFiles();
    } catch (error) {
      toast({
        title: "Publishing Failed",
        description: "Failed to publish XML files to the site.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const loadPublishedFiles = () => {
    const files = listPublishedXMLs();
    setPublishedFiles(files);
  };

  useEffect(() => {
    loadPublishedFiles();
  }, []);

  return (
    <div className="min-h-screen bg-tnq-lightgray">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-tnq-navy mb-6">Application Configuration</h1>
        
        <div className="grid gap-6">
          {/* XML Publishing Workflow */}
          <XMLPublishingWorkflow />
          
          {/* Data Export and Import */}
          <DataExportImport />
        </div>
      </main>
    </div>
  );
};

export default Config;
