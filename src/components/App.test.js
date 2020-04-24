import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('renders heading', () => {
  const { getByText } = render(<App />);
  const heading = getByText(/^diff-text - A web app /i);
  expect(heading).toBeInTheDocument();
});

test('renders option buttons', () => {
  const { getByText } = render(<App />);
  const element = getByText('Chars'); // not the best way
  expect(element).toBeInTheDocument();
});
