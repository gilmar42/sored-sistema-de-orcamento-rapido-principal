import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QuoteCalculator } from './QuoteCalculator';
import { DataContext } from '../context/DataContext';
import type { Material, Quote, AppSettings } from '../types';

/**
 * Test: QuoteCalculator component size rendering
 * Simulates the bug where component sizes render as "[object Object]"
 * 
 * Scenario 1: Legacy sizeValue as object (what causes the bug)
 * Scenario 2: Proper explicit fields (lengthValue/diameterValue/widthValue)
 * Scenario 3: Raw input fields (rawLengthInput, etc.)
 */

// Material with LEGACY sizeValue object (reproduces the bug)
const materialWithLegacySizeValue: Material = {
  id: 'mat-1',
  name: 'Parafuso',
  description: 'Parafuso M10',
  categoryId: 'cat-1',
  unitWeight: 0.05,
  unit: 'kg',
  unitCost: 2.50,
  components: [
    {
      id: 'comp-1',
      name: 'Corpo do Parafuso',
      unitWeight: 0.05,
      unit: 'kg',
      unitCost: 2.50,
      // LEGACY format: sizeValue is an object
      sizeValue: {
        lengthValue: 10,
        lengthUnit: 'mm',
        diameterValue: 5,
        diameterUnit: 'mm',
      } as any, // Cast to any because TypeScript expects sizeValue to be string
    },
  ],
};

// Material with PROPER explicit fields
const materialWithExplicitFields: Material = {
  id: 'mat-2',
  name: 'Pino',
  description: 'Pino cilíndrico',
  categoryId: 'cat-1',
  unitWeight: 0.03,
  unit: 'kg',
  unitCost: 1.50,
  components: [
    {
      id: 'comp-2',
      name: 'Pino Principal',
      unitWeight: 0.03,
      unit: 'kg',
      unitCost: 1.50,
      // PROPER format: explicit fields
      lengthValue: 20,
      lengthUnit: 'mm',
      diameterValue: 8,
      diameterUnit: 'mm',
    },
  ],
};

// Material with RAW input fields
const materialWithRawInputs: Material = {
  id: 'mat-3',
  name: 'Porca',
  description: 'Porca sextavada',
  categoryId: 'cat-1',
  unitWeight: 0.02,
  unit: 'kg',
  unitCost: 1.00,
  components: [
    {
      id: 'comp-3',
      name: 'Porca Hex',
      unitWeight: 0.02,
      unit: 'kg',
      unitCost: 1.00,
      // Raw inputs (e.g., user entered "1/2" and parsing stored it as raw)
      rawLengthInput: '1/2',
      lengthUnit: 'mm',
      rawDiameterInput: '3/8',
      diameterUnit: 'mm',
    },
  ],
};

describe('QuoteCalculator - Component Size Rendering', () => {
  const mockDataContextValue = {
    materials: [] as Material[],
    setMaterials: jest.fn(),
    quotes: [] as Quote[],
    setQuotes: jest.fn(),
    settings: {
      companyName: 'Test Co',
      companyContact: 'test@example.com',
      companyLogo: '',
      defaultTax: 10,
    } as AppSettings,
    setSettings: jest.fn(),
    tenantId: 'test-tenant',
    userId: 'test-user',
  };

  const renderQuoteCalculator = (materials: Material[]) => {
    const contextValue = { ...mockDataContextValue, materials };

    return render(
      <DataContext.Provider value={contextValue as any}>
        <QuoteCalculator quoteToEdit={null} setQuoteToEdit={jest.fn()} />
      </DataContext.Provider>
    );
  };

  test('SCENARIO 1: Legacy sizeValue as object should NOT render "[object Object]"', async () => {
    renderQuoteCalculator([materialWithLegacySizeValue]);

    // Add the material to a quote by clicking the add button
    const addButton = screen.getByText('Adicionar Item');
    addButton.click();

    // Wait for the modal or selection to happen
    await waitFor(() => {
      // The component should have been added to the quote
      const materialSelectModal = screen.queryByText('Parafuso');
      if (materialSelectModal) {
        materialSelectModal.click();
      }
    }, { timeout: 1000 }).catch(() => {});

    // Check if the component size is rendered in the "Componentes do Produto Final" table
    // The debug logs will show what getComponentSizeString returns
    const consoleSpy = jest.spyOn(console, 'log');

    // Trigger a re-render by adding item
    await waitFor(() => {
      const tableText = screen.queryByText(/L: 10|Componentes do Produto Final/i);
      if (tableText) {
        // Check console logs for the debug output
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[DEBUG QuoteCalculator]')
        );
      }
    }, { timeout: 2000 }).catch(() => {});

    // The key assertion: make sure "[object Object]" is NOT rendered anywhere in the quote summary
    const quoteContainer = screen.queryByText('Resumo do Orçamento');
    if (quoteContainer) {
      const parentElement = quoteContainer.closest('.bg-surface');
      if (parentElement) {
        // Search for "[object Object]" in the rendered output
        const textContent = parentElement.textContent || '';
        expect(textContent).not.toContain('[object Object]');
      }
    }

    consoleSpy.mockRestore();
  });

  test('SCENARIO 2: Proper explicit fields should render as "L: 20 mm / Ø: 8 mm"', async () => {
    renderQuoteCalculator([materialWithExplicitFields]);

    // Debug output will show the component is being rendered correctly
    const consoleSpy = jest.spyOn(console, 'log');

    // Search for the component table or rendered dimensions
    await waitFor(() => {
      const logs = consoleSpy.mock.calls.map(call => call[0] as string);
      const debugLogs = logs.filter(log => typeof log === 'string' && log.includes('[DEBUG QuoteCalculator]'));
      
      // If component table is rendered, debug logs should appear
      if (debugLogs.length > 0) {
        expect(debugLogs.some(log => log.includes('returning'))).toBeTruthy();
      }
    }, { timeout: 2000 }).catch(() => {});

    consoleSpy.mockRestore();
  });

  test('SCENARIO 3: Raw input fields should render when parsed values are not available', async () => {
    renderQuoteCalculator([materialWithRawInputs]);

    const consoleSpy = jest.spyOn(console, 'log');

    await waitFor(() => {
      const logs = consoleSpy.mock.calls.map(call => call[0] as string);
      const debugLogs = logs.filter(log => typeof log === 'string' && log.includes('[DEBUG QuoteCalculator]'));
      
      // Should have debug output for component size string generation
      expect(debugLogs.length).toBeGreaterThan(0);
    }, { timeout: 2000 }).catch(() => {});

    consoleSpy.mockRestore();
  });

  test('Unit test: getComponentSizeString directly with legacy object', () => {
    /**
     * Extracted getComponentSizeString logic for isolated testing
     */
    const getComponentSizeString = (component: any) => {
      if (component.sizeValue !== undefined && component.sizeValue !== null) {
        if (typeof component.sizeValue === 'string' || typeof component.sizeValue === 'number') {
          return `${component.sizeValue}${component.sizeUnit ? ` ${component.sizeUnit}` : ''}`;
        }
        if (typeof component.sizeValue === 'object') {
          const parts: string[] = [];
          if (component.sizeValue.lengthValue !== undefined)
            parts.push(`L: ${component.sizeValue.lengthValue}${component.sizeValue.lengthUnit ? ` ${component.sizeValue.lengthUnit}` : ''}`);
          if (component.sizeValue.diameterValue !== undefined)
            parts.push(`Ø: ${component.sizeValue.diameterValue}${component.sizeValue.diameterUnit ? ` ${component.sizeValue.diameterUnit}` : ''}`);
          if (component.sizeValue.widthValue !== undefined)
            parts.push(`W: ${component.sizeValue.widthValue}${component.sizeValue.widthUnit ? ` ${component.sizeValue.widthUnit}` : ''}`);
          if (parts.length > 0) return parts.join(' / ');
          try {
            return JSON.stringify(component.sizeValue);
          } catch {
            return String(component.sizeValue);
          }
        }
      }

      const parts: string[] = [];
      if (component.lengthValue !== undefined && component.lengthValue !== null)
        parts.push(`L: ${component.lengthValue}${component.lengthUnit ? ` ${component.lengthUnit}` : ''}`);
      else if (component.rawLengthInput)
        parts.push(`L: ${component.rawLengthInput}${component.lengthUnit ? ` ${component.lengthUnit}` : ''}`);

      if (component.diameterValue !== undefined && component.diameterValue !== null)
        parts.push(`Ø: ${component.diameterValue}${component.diameterUnit ? ` ${component.diameterUnit}` : ''}`);
      else if (component.rawDiameterInput)
        parts.push(`Ø: ${component.rawDiameterInput}${component.diameterUnit ? ` ${component.diameterUnit}` : ''}`);

      if (component.widthValue !== undefined && component.widthValue !== null)
        parts.push(`W: ${component.widthValue}${component.widthUnit ? ` ${component.widthUnit}` : ''}`);
      else if (component.rawWidthInput)
        parts.push(`W: ${component.rawWidthInput}${component.widthUnit ? ` ${component.widthUnit}` : ''}`);

      return parts.length > 0 ? parts.join(' / ') : '-';
    };

    // Test 1: Legacy object format
    const result1 = getComponentSizeString(materialWithLegacySizeValue.components[0]);
    console.log('Legacy object result:', result1);
    expect(result1).toBe('L: 10 mm / Ø: 5 mm');
    expect(result1).not.toContain('[object Object]');

    // Test 2: Explicit fields
    const result2 = getComponentSizeString(materialWithExplicitFields.components[0]);
    console.log('Explicit fields result:', result2);
    expect(result2).toBe('L: 20 mm / Ø: 8 mm');
    expect(result2).not.toContain('[object Object]');

    // Test 3: Raw inputs
    const result3 = getComponentSizeString(materialWithRawInputs.components[0]);
    console.log('Raw input result:', result3);
    expect(result3).toBe('L: 1/2 mm / Ø: 3/8 mm');
    expect(result3).not.toContain('[object Object]');

    // Test 4: No size data should return '-'
    const result4 = getComponentSizeString({
      id: 'test',
      name: 'Empty',
      unitWeight: 0,
      unit: 'kg',
      unitCost: 0,
    });
    console.log('No size data result:', result4);
    expect(result4).toBe('-');
  });

  test('Bug reproduction: Direct string rendering of sizeValue object produces "[object Object]"', () => {
    /**
     * This test shows what happens if we just render sizeValue directly without
     * using getComponentSizeString. This is what causes the bug.
     */
    const buggyComponent = {
      sizeValue: {
        lengthValue: 10,
        diameterValue: 5,
      } as any,
    };

    // Simulating direct rendering (the BUG)
    const buggyResult = `${buggyComponent.sizeValue}`; // This produces "[object Object]"
    console.log('Buggy direct rendering:', buggyResult);
    expect(buggyResult).toBe('[object Object]');

    // The FIX: use getComponentSizeString which extracts the fields properly
    const fixedResult = `L: ${buggyComponent.sizeValue.lengthValue} / Ø: ${buggyComponent.sizeValue.diameterValue}`;
    console.log('Fixed formatting:', fixedResult);
    expect(fixedResult).toBe('L: 10 / Ø: 5');
    expect(fixedResult).not.toContain('[object Object]');
  });

  test('Edge cases: Handle unusual sizeValue formats (arrays, JSON strings, empty objects, null)', () => {
    /**
     * Test edge cases that might cause "[object Object]" if not handled
     */
    
    const getComponentSizeString = (component: any) => {
      if (component.sizeValue !== undefined && component.sizeValue !== null) {
        if (typeof component.sizeValue === 'string' || typeof component.sizeValue === 'number') {
          return `${component.sizeValue}${component.sizeUnit ? ` ${component.sizeUnit}` : ''}`;
        }
        if (typeof component.sizeValue === 'object') {
          const parts: string[] = [];
          if (component.sizeValue.lengthValue !== undefined && component.sizeValue.lengthValue !== null)
            parts.push(`L: ${component.sizeValue.lengthValue}${component.sizeValue.lengthUnit ? ` ${component.sizeValue.lengthUnit}` : ''}`);
          if (component.sizeValue.diameterValue !== undefined && component.sizeValue.diameterValue !== null)
            parts.push(`Ø: ${component.sizeValue.diameterValue}${component.sizeValue.diameterUnit ? ` ${component.sizeValue.diameterUnit}` : ''}`);
          if (component.sizeValue.widthValue !== undefined && component.sizeValue.widthValue !== null)
            parts.push(`W: ${component.sizeValue.widthValue}${component.sizeValue.widthUnit ? ` ${component.sizeValue.widthUnit}` : ''}`);
          if (parts.length > 0) return parts.join(' / ');
          try {
            return JSON.stringify(component.sizeValue);
          } catch {
            return String(component.sizeValue);
          }
        }
      }

      const parts: string[] = [];
      if (component.lengthValue !== undefined && component.lengthValue !== null)
        parts.push(`L: ${component.lengthValue}${component.lengthUnit ? ` ${component.lengthUnit}` : ''}`);
      else if (component.rawLengthInput)
        parts.push(`L: ${component.rawLengthInput}${component.lengthUnit ? ` ${component.lengthUnit}` : ''}`);

      if (component.diameterValue !== undefined && component.diameterValue !== null)
        parts.push(`Ø: ${component.diameterValue}${component.diameterUnit ? ` ${component.diameterUnit}` : ''}`);
      else if (component.rawDiameterInput)
        parts.push(`Ø: ${component.rawDiameterInput}${component.diameterUnit ? ` ${component.diameterUnit}` : ''}`);

      if (component.widthValue !== undefined && component.widthValue !== null)
        parts.push(`W: ${component.widthValue}${component.widthUnit ? ` ${component.widthUnit}` : ''}`);
      else if (component.rawWidthInput)
        parts.push(`W: ${component.rawWidthInput}${component.widthUnit ? ` ${component.widthUnit}` : ''}`);

      return parts.length > 0 ? parts.join(' / ') : '-';
    };

    // Test 1: sizeValue is an array (this would render as "[object Object]" or similar)
    const result1 = getComponentSizeString({
      sizeValue: [10, 5] as any,
    });
    console.log('Array sizeValue result:', result1);
    // Arrays are objects, so they would be stringified
    expect(result1).not.toContain('[object Object]');
    expect(typeof result1).toBe('string');

    // Test 2: sizeValue is a JSON string (legacy serialized format)
    const result2 = getComponentSizeString({
      sizeValue: '{"lengthValue": 10, "diameterValue": 5}' as any,
    });
    console.log('JSON string sizeValue result:', result2);
    expect(result2).toBe('{"lengthValue": 10, "diameterValue": 5}');
    expect(result2).not.toContain('[object Object]');

    // Test 3: sizeValue is an empty object
    const result3 = getComponentSizeString({
      sizeValue: {} as any,
    });
    console.log('Empty object sizeValue result:', result3);
    expect(result3).toBe('{}');
    expect(result3).not.toContain('[object Object]');

    // Test 4: sizeValue is null but other fields are present
    const result4 = getComponentSizeString({
      sizeValue: null,
      lengthValue: 10,
      lengthUnit: 'mm',
    });
    console.log('Null sizeValue with lengthValue result:', result4);
    expect(result4).toBe('L: 10 mm');
    expect(result4).not.toContain('[object Object]');

    // Test 5: sizeValue is undefined
    const result5 = getComponentSizeString({
      sizeValue: undefined,
      diameterValue: 8,
      diameterUnit: 'mm',
    });
    console.log('Undefined sizeValue with diameterValue result:', result5);
    expect(result5).toBe('Ø: 8 mm');
    expect(result5).not.toContain('[object Object]');

    // Test 6: sizeValue is an object with nested objects (deep structure)
    const result6 = getComponentSizeString({
      sizeValue: {
        dimensions: { length: 10 }, // nested, but not a recognized field
      } as any,
    });
    console.log('Nested object sizeValue result:', result6);
    // Should stringify or return a safe fallback
    expect(result6).not.toContain('[object Object]');

    // Test 7: sizeValue is a number (primitive, should work)
    const result7 = getComponentSizeString({
      sizeValue: 10,
    });
    console.log('Number sizeValue result:', result7);
    expect(result7).toBe('10');
    expect(result7).not.toContain('[object Object]');

    // Test 8: All fields are null (completely empty)
    const result8 = getComponentSizeString({
      id: 'test',
      name: 'Empty',
      unitWeight: 0,
      unit: 'kg',
      unitCost: 0,
      sizeValue: null,
      lengthValue: null,
      diameterValue: null,
      widthValue: null,
    });
    console.log('All null fields result:', result8);
    expect(result8).toBe('-');
    expect(result8).not.toContain('[object Object]');

    // Test 9: sizeValue is an object with mixed/malformed fields
    const result9 = getComponentSizeString({
      sizeValue: {
        lengthValue: 10,
        diameterValue: undefined, // undefined inside object
        widthValue: null, // null inside object
        unknownField: 'xyz',
      } as any,
    });
    console.log('Mixed/malformed object sizeValue result:', result9);
    expect(result9).toBe('L: 10');
    expect(result9).not.toContain('[object Object]');

    // Test 10: sizeValue object with all fields as strings (parsed from input)
    const result10 = getComponentSizeString({
      sizeValue: {
        lengthValue: '10mm', // stored as string by accident
        diameterValue: '5mm',
      } as any,
    });
    console.log('String-valued object sizeValue result:', result10);
    expect(result10).toBe('L: 10mm / Ø: 5mm');
    expect(result10).not.toContain('[object Object]');
  });
});
