import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('Simple test', () => {
  it('renders a simple div', () => {
    render(<div>Testando ambiente</div>);
    expect(screen.getByText('Testando ambiente')).toBeInTheDocument();
  });
});
