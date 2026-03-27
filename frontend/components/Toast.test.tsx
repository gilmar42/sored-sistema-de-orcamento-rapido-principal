import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Toast from './Toast';

describe('Toast', () => {
  const defaultProps: any = {
    id: '1',
    type: 'success',
    title: 'Success!',
    message: 'This is a success message.',
    onClose: jest.fn(),
  };

  it('renders correctly with title and message', () => {
    render(<Toast {...defaultProps} />);

    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('This is a success message.')).toBeInTheDocument();
  });
});
