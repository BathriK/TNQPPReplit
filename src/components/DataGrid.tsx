
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";

interface DataGridProps {
  headers: string[];
  data: string[][];
  onChange: (data: string[][]) => void;
  placeholder?: string;
  cellRenderers?: Record<number, (value: string) => React.ReactNode>;
  selectOptions?: Record<number, string[]>; 
  columnTypes?: string[];
  readonly?: boolean;
  hideActions?: boolean;
  allowDelete?: boolean;
  allowAdd?: boolean;
}

const DataGrid: React.FC<DataGridProps> = ({ 
  headers, 
  data, 
  onChange, 
  placeholder,
  cellRenderers,
  selectOptions,
  columnTypes,
  readonly = false,
  hideActions = false,
  allowDelete = true,
  allowAdd = true
}) => {
  const [gridData, setGridData] = useState<string[][]>(data);
  const [editing, setEditing] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [clipboardText, setClipboardText] = useState<string>('');
  
  // Update local state when external data changes
  useEffect(() => {
    setGridData(data);
  }, [data]);

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    if (readonly) return;
    
    const newData = [...gridData];
    if (!newData[rowIndex]) {
      newData[rowIndex] = Array(headers.length).fill('');
    }
    newData[rowIndex][colIndex] = value;
    setGridData(newData);
    onChange(newData);
  };

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    if (readonly) return;
    
    setEditing({ row: rowIndex, col: colIndex });
    setEditValue(gridData[rowIndex]?.[colIndex] || '');
  };

  const handleCellBlur = () => {
    if (editing) {
      handleCellChange(editing.row, editing.col, editValue);
      setEditing(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!editing || readonly) return;
    
    if (e.key === 'Enter') {
      handleCellBlur();
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setEditing(null);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleCellBlur();
      const nextCol = (editing.col + 1) % headers.length;
      const nextRow = nextCol === 0 ? editing.row + 1 : editing.row;
      
      // Create a new row if tabbing past the last column of the last row
      if (nextRow >= gridData.length) {
        const newData = [...gridData, Array(headers.length).fill('')];
        setGridData(newData);
        onChange(newData);
      }
      
      setEditing({ row: nextRow, col: nextCol });
      setEditValue(gridData[nextRow]?.[nextCol] || '');
    }
  };

  const addRow = () => {
    if (readonly || !allowAdd) return;
    
    const newData = [...gridData, Array(headers.length).fill('')];
    setGridData(newData);
    onChange(newData);
  };

  const deleteRow = (rowIndex: number) => {
    if (readonly || !allowDelete) return;
    
    const newData = gridData.filter((_, i) => i !== rowIndex);
    setGridData(newData);
    onChange(newData);
  };

  const handlePaste = async () => {
    if (readonly) return;
    
    try {
      const text = await navigator.clipboard.readText();
      setClipboardText(text);
      
      // Process clipboard data
      const rows = text.split('\n').filter(row => row.trim());
      const pasteData = rows.map(row => row.split('\t'));
      
      // Start with the current data
      let updatedData = [...gridData];
      
      // If there's only one row in the current data and it's empty, replace it
      // Otherwise, add the pasted data to the end
      if (updatedData.length === 1 && updatedData[0].every(cell => !cell)) {
        updatedData = [];
      }
      
      // Add all pasted rows
      for (let i = 0; i < pasteData.length; i++) {
        const row = pasteData[i];
        const newRow = Array(headers.length).fill('');
        
        // Fill in the pasted values
        for (let j = 0; j < Math.min(row.length, headers.length); j++) {
          newRow[j] = row[j];
        }
        
        updatedData.push(newRow);
      }
      
      // Update the grid
      setGridData(updatedData);
      onChange(updatedData);
    } catch (error) {
      console.error('Failed to paste:', error);
    }
  };

  const renderCellContent = (value: string, rowIndex: number, colIndex: number) => {
    // If we have a custom renderer for this column, use it
    if (cellRenderers && cellRenderers[colIndex]) {
      return cellRenderers[colIndex](value);
    }
    
    // Default rendering
    return value;
  };

  const renderEditCell = (rowIndex: number, colIndex: number) => {
    // Check if this column is a dropdown type
    const isDropdown = columnTypes && columnTypes[colIndex] === 'select';
    
    // If we have dropdown options for this column, render a dropdown
    if (isDropdown && selectOptions && selectOptions[colIndex]) {
      return (
        <select 
          value={editValue} 
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleCellBlur}
          autoFocus
          className="w-full p-2 border-0 focus:ring-0 focus:outline-none bg-blue-50"
        >
          {selectOptions[colIndex].map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }
    
    // Otherwise render a text input
    return (
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleCellBlur}
        autoFocus
        className="w-full p-2 border-0 focus:ring-0 focus:outline-none bg-blue-50"
      />
    );
  };

  // Determine if a column should be numeric based on its content
  const shouldBeNumeric = (colIndex: number): boolean => {
    // If columnTypes explicitly defines this column as numeric, use that
    if (columnTypes && columnTypes[colIndex] === 'numeric') return true;
    
    // Check if the column has a name that suggests numeric content
    const numericColumnNames = ['value', 'amount', 'qty', 'quantity', 'price', 'cost', 'target'];
    const headerLower = headers[colIndex].toLowerCase();
    if (numericColumnNames.some(name => headerLower.includes(name))) return true;
    
    // Otherwise, check if most values in this column are numeric
    let numericCount = 0;
    for (const row of gridData) {
      if (row[colIndex] && !isNaN(Number(row[colIndex]))) {
        numericCount++;
      }
    }
    
    return numericCount > gridData.length / 2;
  };

  return (
    <div>
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full divide-y divide-gray-200 tnq-table">
          <thead className="bg-tnq-navyBlue text-white">
            <tr>
              {headers.map((header, index) => (
                <th 
                  key={index} 
                  scope="col" 
                  className={`py-3 px-4 text-sm font-semibold tracking-wider ${
                    shouldBeNumeric(index) ? 'text-right' : 'text-left'
                  }`}
                >
                  {header}
                </th>
              ))}
              {!readonly && !hideActions && allowDelete && (
                <th scope="col" className="relative px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#D9E2EC]">
            {gridData.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className={rowIndex % 2 === 0 ? "bg-white" : "bg-[#F7FAFC]"}
              >
                {row.map((cell, colIndex) => (
                  <td 
                    key={`${rowIndex}-${colIndex}`} 
                    className={`py-3 px-4 h-10 ${!readonly ? 'cursor-pointer' : ''} ${
                      shouldBeNumeric(colIndex) ? 'text-right' : 'text-left'
                    }`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    {editing && editing.row === rowIndex && editing.col === colIndex 
                      ? renderEditCell(rowIndex, colIndex)
                      : renderCellContent(cell, rowIndex, colIndex)}
                  </td>
                ))}
                {!readonly && !hideActions && allowDelete && (
                  <td className="px-4 py-3 h-10 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      className="text-red-600 hover:text-red-900"
                      onClick={() => deleteRow(rowIndex)}
                      aria-label={`Delete row ${rowIndex + 1}`}
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {gridData.length === 0 && (
              <tr>
                <td 
                  colSpan={headers.length + (!readonly && !hideActions && allowDelete ? 1 : 0)} 
                  className="px-4 py-4 text-center text-gray-500 h-10"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!readonly && !hideActions && (
        <div className="mt-4 flex flex-wrap gap-4">
          {allowAdd && (
            <Button
              onClick={addRow}
              className="bg-tnq-blue hover:bg-tnq-blue-dark"
            >
              Add Row
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handlePaste}
          >
            Paste Data
          </Button>

          {placeholder && clipboardText === '' && (
            <div className="text-sm text-gray-500 italic flex-1 flex items-center justify-start pl-4">
              {placeholder}
            </div>
          )}
        </div>
      )}
      
      {!readonly && (
        <div className="mt-2">
          <div className="text-xs text-gray-500">
            You can paste data from Excel or similar applications.
          </div>
        </div>
      )}
    </div>
  );
};

export default DataGrid;
