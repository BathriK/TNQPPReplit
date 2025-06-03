import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { findProductById } from '../lib/data';
import { Button } from '@/components/ui/button';
import Header from '../components/Header';
import { ArrowLeft, Download } from 'lucide-react';
import MetricsDisplay from '../components/MetricsDisplay';
import GoalsTable from '../components/GoalsTable';
import VersionHistory from '../components/VersionHistory';
import MonthYearSelector from '../components/MonthYearSelector';
import { Product, Roadmap, ReleaseGoal, ReleasePlan } from '../lib/types';
import { exportProductXML } from '../lib/xmlUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from '@/lib/utils';
import ReleaseNotesTable from '../components/ReleaseNotesTable';
import { usePermissions } from '@/contexts/AuthContext';

const ProductDetail = () => {
  const {
    productId
  } = useParams<{
    productId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    canEdit
  } = usePermissions();

  // Immediately redirect to edit page if that's what we want
  useEffect(() => {
    if (location.state?.editMode) {
      navigate(`/products/${productId}/edit`);
    }
  }, [location.state, productId, navigate]);
  const [product, setProduct] = useState<Product | null>(null);
  const [portfolio, setPortfolio] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [productLoading, setProductLoading] = useState<boolean>(true);

  // Initialize with active tab from URL search param or default to "roadmap"
  const getInitialTab = () => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('tab') || location.state?.activeTab || "roadmap";
  };
  const [activeTab, setActiveTab] = useState<string>(getInitialTab());

  // Current selected time period
  const getCurrentMonthYear = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
    const currentYear = now.getFullYear();

    // Check if current date is within the April 2025 - March 2026 range
    if (currentYear === 2025 && currentMonth >= 4 || currentYear === 2026 && currentMonth <= 3) {
      // Current date is within range, use it
      return {
        month: currentMonth,
        year: currentYear
      };
    } else if (currentYear < 2025 || currentYear === 2025 && currentMonth < 4) {
      // Current date is before range, use April 2025
      return {
        month: 4,
        year: 2025
      };
    } else {
      // Current date is after range, use March 2026
      return {
        month: 3,
        year: 2026
      };
    }
  };
  const {
    month,
    year
  } = getCurrentMonthYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(month);
  const [selectedYear, setSelectedYear] = useState<number>(year);

  // Version data
  const [latestRoadmap, setLatestRoadmap] = useState<Roadmap | null>(null);
  const [latestReleaseGoal, setLatestReleaseGoal] = useState<ReleaseGoal | null>(null);
  const [latestReleasePlan, setLatestReleasePlan] = useState<ReleasePlan | null>(null);

  // Version history data
  const [roadmapVersions, setRoadmapVersions] = useState<Roadmap[]>([]);
  const [releaseGoalVersions, setReleaseGoalVersions] = useState<ReleaseGoal[]>([]);
  const [releasePlanVersions, setReleasePlanVersions] = useState<ReleasePlan[]>([]);

  // Selected version IDs
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Release notes link
  const [releaseNotesLink, setReleaseNotesLink] = useState<string | null>(null);

  // Update URL when tab changes, but prevent stakeholders from accessing notes
  useEffect(() => {
    if (activeTab === 'notes' && !canEdit) {
      setActiveTab('roadmap');
      return;
    }
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', activeTab);
    navigate(`${location.pathname}?${searchParams.toString()}`, {
      replace: true
    });
  }, [activeTab, location.pathname, navigate, canEdit]);
  useEffect(() => {
    if (!productId) {
      navigate("/");
      return;
    }
    setProductLoading(true);
    const fetchProductData = async () => {
      try {
        const result = await findProductById(productId);
        const foundProduct = result.product;
        const foundPortfolio = result.portfolio;
        if (!foundProduct) {
          navigate("/");
          return;
        }
        setProduct(foundProduct);
        setPortfolio(foundPortfolio ? {
          id: foundPortfolio.id,
          name: foundPortfolio.name
        } : null);

        // Load all versions for each data type
        loadVersions(foundProduct);

        // Set release notes link if available in the product data
        const matchingReleaseNotes = foundProduct.releaseNotes.find(note => note.month === selectedMonth && note.year === selectedYear);
        if (matchingReleaseNotes && matchingReleaseNotes.link) {
          setReleaseNotesLink(matchingReleaseNotes.link);
        } else {
          setReleaseNotesLink(null);
        }
      } catch (error) {
        console.error("Error fetching product data:", error);
      } finally {
        setProductLoading(false);
      }
    };
    fetchProductData();
  }, [productId, navigate]);

  // Load versions based on selected month/year
  useEffect(() => {
    if (!product) return;

    // Update versions when month/year changes
    loadVersions(product);
  }, [selectedMonth, selectedYear, product]);
  const loadVersions = (product: Product) => {
    // For roadmap, filter by year only
    const roadmaps = product.roadmap.filter(r => r.year === selectedYear);
    setRoadmapVersions(roadmaps);

    // For other data types, filter by month and year
    const goals = product.releaseGoals.filter(g => g.month === selectedMonth && g.year === selectedYear);
    const plans = product.releasePlans.filter(p => p.month === selectedMonth && p.year === selectedYear);
    setReleaseGoalVersions(goals);
    setReleasePlanVersions(plans);

    // Set latest versions
    if (roadmaps.length > 0) {
      // Sort by version number to get the latest
      const latestRoadmap = [...roadmaps].sort((a, b) => parseFloat(b.version) - parseFloat(a.version))[0];
      setLatestRoadmap(latestRoadmap);
      setSelectedRoadmapId(latestRoadmap.id);
    } else {
      setLatestRoadmap(null);
      setSelectedRoadmapId(null);
    }
    if (goals.length > 0) {
      const latestGoal = [...goals].sort((a, b) => b.version - a.version)[0];
      setLatestReleaseGoal(latestGoal);
      setSelectedGoalId(latestGoal.id);
    } else {
      setLatestReleaseGoal(null);
      setSelectedGoalId(null);
    }
    if (plans.length > 0) {
      const latestPlan = [...plans].sort((a, b) => b.version - a.version)[0];
      setLatestReleasePlan(latestPlan);
      setSelectedPlanId(latestPlan.id);
    } else {
      setLatestReleasePlan(null);
      setSelectedPlanId(null);
    }

    // Update release notes link
    const matchingReleaseNotes = product.releaseNotes.find(note => note.month === selectedMonth && note.year === selectedYear);
    if (matchingReleaseNotes && matchingReleaseNotes.link) {
      setReleaseNotesLink(matchingReleaseNotes.link);
    } else {
      setReleaseNotesLink(null);
    }
  };
  const handleRoadmapVersionSelect = (id: string) => {
    const selected = roadmapVersions.find(r => r.id === id);
    if (selected) {
      setSelectedRoadmapId(id);
    }
  };
  const handleGoalVersionSelect = (id: string) => {
    const selected = releaseGoalVersions.find(g => g.id === id);
    if (selected) {
      setSelectedGoalId(id);
    }
  };
  const handlePlanVersionSelect = (id: string) => {
    const selected = releasePlanVersions.find(p => p.id === id);
    if (selected) {
      setSelectedPlanId(id);
    }
  };
  const handleMonthYearChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };
  const handleRoadmapYearChange = (_month: number, year: number) => {
    setSelectedYear(year);
  };
  const handleDownloadProductXML = () => {
    if (productId) {
      exportProductXML(productId);
    }
  };
  const handleDownloadReleaseNotes = () => {
    if (releaseNotesLink) {
      window.open(releaseNotesLink, "_blank");
    } else {
      console.log("No release notes available to download");
    }
  };

  // Helper function to convert versions to the format expected by VersionHistory
  const convertVersionsForHistory = (items: any[]) => {
    return items.map(item => ({
      id: item.id,
      version: typeof item.version === 'string' ? parseFloat(item.version) : item.version,
      createdAt: item.createdAt
    }));
  };

  // Get the selected goal object from the ID
  const getSelectedGoal = () => {
    return releaseGoalVersions.find(goal => goal.id === selectedGoalId) || null;
  };

  // Get the selected plan object from the ID
  const getSelectedPlan = () => {
    return releasePlanVersions.find(plan => plan.id === selectedPlanId) || null;
  };
  return (
    <div className="min-h-screen bg-tnq-lightgray">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {productLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-tnq-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : product ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="flex items-center space-x-1">
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </Button>
                <h1 className="text-2xl font-semibold text-tnq-navy">{product.name}</h1>
                {portfolio && (
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">
                    {portfolio.name}
                  </span>
                )}
              </div>
              
              <div className="flex space-x-3">
                <Button variant="outline" size="icon" onClick={handleDownloadProductXML} title="Export Product XML">
                  <Download size={16} />
                </Button>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm">
              <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
                <div className="border-b border-gray-200 px-6 pt-6">
                  <div className="flex justify-center">
                    <TabsList className="bg-white border border-gray-200 p-1 rounded-lg shadow-sm inline-flex gap-2">
                      <TabsTrigger 
                        value="roadmap" 
                        className="px-8 py-2 font-medium text-sm transition-all data-[state=active]:bg-tnq-blue data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md min-w-[120px] text-tnq-navy"
                      >
                        Roadmap
                      </TabsTrigger>
                      <TabsTrigger 
                        value="goals" 
                        className="px-8 py-2 font-medium text-sm transition-all data-[state=active]:bg-tnq-blue data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md min-w-[120px] text-tnq-navy"
                      >
                        Release Goals
                      </TabsTrigger>
                      <TabsTrigger 
                        value="plan" 
                        className="px-8 py-2 font-medium text-sm transition-all data-[state=active]:bg-tnq-blue data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md min-w-[120px] text-tnq-navy"
                      >
                        Release Plan
                      </TabsTrigger>
                      <TabsTrigger 
                        value="metrics" 
                        className="px-8 py-2 font-medium text-sm transition-all data-[state=active]:bg-tnq-blue data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md min-w-[120px] text-tnq-navy"
                      >
                        Metrics
                      </TabsTrigger>
                      <TabsTrigger 
                        value="notes" 
                        className="px-8 py-2 font-medium text-sm transition-all data-[state=active]:bg-tnq-blue data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md min-w-[120px] text-tnq-navy"
                      >
                        Release Notes
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </div>
                
                <div className="p-6">
                  {/* Roadmap Tab */}
                  <TabsContent value="roadmap" className="m-0">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-medium text-tnq-navy">Product Roadmap {selectedYear}</h2>
                      
                      <div className="flex items-center space-x-4">
                        <MonthYearSelector selectedMonth={1} selectedYear={selectedYear} onChange={handleRoadmapYearChange} className="compact" yearOnly={true} />
                        <VersionHistory items={convertVersionsForHistory(roadmapVersions)} onSelect={handleRoadmapVersionSelect} currentId={selectedRoadmapId || ""} onCreateNew={() => navigate(`/products/${productId}/edit?tab=roadmap`)} />
                      </div>
                    </div>

                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-tnq-navyBlue">
                            <TableHead className="text-white">Version</TableHead>
                            <TableHead className="text-white">Date</TableHead>
                            <TableHead className="text-white">Link</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {roadmapVersions.length > 0 ? roadmapVersions.sort((a, b) => parseFloat(b.version) - parseFloat(a.version)).map(roadmap => 
                            <TableRow key={roadmap.id}>
                              <TableCell className="font-medium text-tnq-navy">{roadmap.version}</TableCell>
                              <TableCell className="text-tnq-navy">{formatDate(roadmap.createdAt)}</TableCell>
                              <TableCell>
                                <a href={roadmap.link || "#"} target="_blank" rel="noopener noreferrer" className="text-tnq-blue hover:underline flex items-center">
                                  View Roadmap <span className="ml-1">↗</span>
                                </a>
                              </TableCell>
                            </TableRow>
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                                No roadmaps available for {selectedYear}.
                                <Link to={`/products/${productId}/edit?tab=roadmap`} className="ml-2 text-tnq-blue hover:underline">
                                  Add Roadmap
                                </Link>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                  
                  {/* Release Goals Tab */}
                  <TabsContent value="goals" className="m-0">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-medium text-tnq-navy">Release Goals</h2>
                      
                      <div className="flex items-center space-x-4">
                        <MonthYearSelector selectedMonth={selectedMonth} selectedYear={selectedYear} onChange={handleMonthYearChange} className="compact" />
                        <VersionHistory items={convertVersionsForHistory(releaseGoalVersions)} onSelect={handleGoalVersionSelect} currentId={selectedGoalId || ""} onCreateNew={() => navigate(`/products/${productId}/edit?tab=goals`)} />
                      </div>
                    </div>
                    
                    {getSelectedGoal() && getSelectedGoal()?.goals && getSelectedGoal()?.goals.length > 0 ? (
                      <GoalsTable goals={getSelectedGoal()?.goals || []} />
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">No release goals available for this period</p>
                        <Link to={`/products/${productId}/edit?tab=goals`} className="text-tnq-blue hover:underline">
                          Add Release Goals
                        </Link>
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* Release Plan Tab */}
                  <TabsContent value="plan" className="m-0">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-medium text-tnq-navy">Release Plan</h2>
                      
                      <div className="flex items-center space-x-4">
                        <MonthYearSelector selectedMonth={selectedMonth} selectedYear={selectedYear} onChange={handleMonthYearChange} className="compact" />
                        <VersionHistory items={convertVersionsForHistory(releasePlanVersions)} onSelect={handlePlanVersionSelect} currentId={selectedPlanId || ""} onCreateNew={() => navigate(`/products/${productId}/edit?tab=plan`)} />
                      </div>
                    </div>
                    
                    {getSelectedPlan() && getSelectedPlan()?.items && getSelectedPlan()?.items.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-tnq-navyBlue">
                            <tr>
                              <th className="text-left py-3 px-4 font-medium text-white text-sm">Feature Name</th>
                              <th className="text-left py-3 px-4 font-medium text-white text-sm">Category</th>
                              <th className="text-left py-3 px-4 font-medium text-white text-sm">Priority</th>
                              <th className="text-left py-3 px-4 font-medium text-white text-sm">Description</th>
                              <th className="text-left py-3 px-4 font-medium text-white text-sm">Source</th>
                              <th className="text-left py-3 px-4 font-medium text-white text-sm">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {getSelectedPlan()?.items.map((item: any) => (
                              <tr key={item.id}>
                                <td className="py-3 px-4 text-tnq-navy text-sm">{item.title}</td>
                                <td className="py-3 px-4 text-sm">
                                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                    item.category === "Enhancement" ? "bg-green-100 text-green-800" :
                                    item.category === "Bug" ? "bg-red-100 text-red-800" :
                                    item.category === "Improvement" ? "bg-yellow-100 text-yellow-800" :
                                    item.category === "Clarification" ? "bg-blue-100 text-blue-800" :
                                    item.category === "Training" ? "bg-orange-100 text-orange-800" :
                                    "bg-gray-100 text-gray-800"
                                  }`}>
                                    {item.category || "Enhancement"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-tnq-navy text-sm">{item.priority || "Medium"}</td>
                                <td className="py-3 px-4 text-tnq-navy text-sm">{item.description}</td>
                                <td className="py-3 px-4 text-tnq-navy text-sm">{item.source || "Internal"}</td>
                                <td className="py-3 px-4 text-sm">
                                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                    item.status === "completed" ? "bg-green-100 text-green-800" :
                                    item.status === "in-progress" ? "bg-yellow-100 text-yellow-800" :
                                    item.status === "delayed" ? "bg-red-100 text-red-800" :
                                    "bg-gray-100 text-gray-800"
                                  }`}>
                                    {item.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">No release plan available for this period</p>
                        <Link to={`/products/${productId}/edit?tab=plan`} className="text-tnq-blue hover:underline">
                          Add Release Plan
                        </Link>
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* Metrics Tab */}
                  <TabsContent value="metrics" className="m-0">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-medium text-tnq-navy">Product Metrics</h2>
                      
                      <div className="flex items-center">
                        <MonthYearSelector selectedMonth={selectedMonth} selectedYear={selectedYear} onChange={handleMonthYearChange} className="compact" />
                      </div>
                    </div>
                    
                    <MetricsDisplay metrics={product.metrics.filter(m => m.month === selectedMonth && m.year === selectedYear)} detailed={true} />
                  </TabsContent>
                  
                  {/* Release Notes Tab */}
                  <TabsContent value="notes" className="m-0">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-medium text-tnq-navy">Release Notes</h2>
                      
                      <div className="flex items-center space-x-4">
                        <MonthYearSelector 
                          selectedMonth={selectedMonth} 
                          selectedYear={selectedYear} 
                          onChange={handleMonthYearChange} 
                          className="compact" 
                        />
                      </div>
                    </div>
                    
                    {product.releaseNotes && product.releaseNotes.length > 0 ? (
                      <ReleaseNotesTable 
                        releaseNotes={product.releaseNotes} 
                        productId={productId} 
                        showAddButton={false} 
                      />
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">No release notes available for this product.</p>
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </>
        ) : (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-600">Product not found</div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductDetail;
