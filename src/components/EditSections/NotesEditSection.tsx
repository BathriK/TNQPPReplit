
import React, { useState } from 'react';
import { useProductEdit } from '../../contexts/ProductEditContext';
import ReleaseNotesTable from '../ReleaseNotesTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MonthYearSelector from '../MonthYearSelector';

interface NotesEditSectionProps {
  productId: string;
}

const NotesEditSection: React.FC<NotesEditSectionProps> = ({ productId }) => {
  const { product, noteMonth, noteYear, setNoteMonth, setNoteYear } = useProductEdit();
  const [releaseNotesLink, setReleaseNotesLink] = useState<string>('');

  const existingReleaseNotes = product?.releaseNotes || [];
  const hasReleaseNotesForCurrentPeriod = existingReleaseNotes.some(
    note => note.month === noteMonth && note.year === noteYear
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Release Notes</h2>
        <MonthYearSelector
          selectedMonth={noteMonth}
          selectedYear={noteYear}
          onChange={(month, year) => {
            setNoteMonth(month);
            setNoteYear(year);
          }}
          className="compact"
        />
      </div>

      <div className="bg-white rounded-lg border p-6">
        <ReleaseNotesTable 
          releaseNotes={existingReleaseNotes} 
          productId={productId} 
          showAddButton={!hasReleaseNotesForCurrentPeriod}
        />
      </div>

      {!hasReleaseNotesForCurrentPeriod && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-md font-medium mb-4">Add New Release Notes</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes-link">Release Notes Link</Label>
              <Input
                id="notes-link"
                type="url"
                value={releaseNotesLink}
                onChange={(e) => setReleaseNotesLink(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <Button disabled={!releaseNotesLink.trim()}>
              Add Release Notes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesEditSection;
