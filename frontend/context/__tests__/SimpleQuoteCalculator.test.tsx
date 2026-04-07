import React from 'react';
import { render } from '@testing-library/react';
import { QuoteCalculator } from '@/components/QuoteCalculator';
import { useData } from '@/context/DataContext';

jest.mock('@/context/DataContext', () => ({
  __esModule: true,
  useData: jest.fn(),
}));

describe('QuoteCalculator basic rendering', () => {
  beforeEach(() => {
    (useData as jest.Mock).mockReturnValue({
      materials: [],
      quotes: [],
      setQuotes: jest.fn(),
      settings: { freightCost: 0, profitMargin: 0, laborCost: 0 },
    });
  });

  test('renders without crashing', () => {
    render(<QuoteCalculator quoteToEdit={null} setQuoteToEdit={jest.fn()} />);
  });
});