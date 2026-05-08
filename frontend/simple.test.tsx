import React from 'react';
import { render, screen } from '@testing-library/react';

describe('Simple Test', () => {
  it('should render a simple div', () => {
    render(<div>Hello World</div>);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});