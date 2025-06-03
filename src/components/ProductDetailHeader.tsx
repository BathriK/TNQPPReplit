import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import MonthYearSelector from './MonthYearSelector';
import { usePermissions } from '../contexts/AuthContext';
import DataExportImport from './DataExportImport';
import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
interface ProductDetailHeaderProps {
  productName: string;
  productId: string;
  portfolioName?: string;
  selectedMonth?: number;
  selectedYear?: number;
  onMonthYearChange?: (month: number, year: number) => void;
  showEditButton?: boolean;
  roadmapLink?: string;
  roadmapVersion?: string;
  releaseNotesLink?: string;
  releaseNotesVersion?: string;
}
const ProductDetailHeader: React.FC<ProductDetailHeaderProps> = ({
  productName,
  productId,
  portfolioName,
  selectedMonth,
  selectedYear,
  onMonthYearChange,
  showEditButton = true,
  roadmapLink,
  roadmapVersion,
  releaseNotesLink,
  releaseNotesVersion
}) => {
  const {
    canEdit,
    canDownload
  } = usePermissions();
  return <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-2xl font-bold text-tnq-navy mb-2 text-center">Version Control and More Details</h1>
          
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            {canDownload && <DataExportImport productId={productId} />}
            
            {showEditButton && canEdit && <Button asChild>
                <Link to={`/products/${productId}/edit`}>
                  Edit Product
                </Link>
              </Button>}
            
            {releaseNotesLink && <Button variant="outline" asChild>
                <a href={releaseNotesLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLinkIcon className="h-4 w-4" />
                  Release Notes {releaseNotesVersion && `v${releaseNotesVersion}`}
                </a>
              </Button>}
          </div>
        </div>
      </div>
    </div>;
};
export default ProductDetailHeader;