import { render, screen } from '@testing-library/react';
import App from './App';

test('renders main heading', () => {
  render(<App />);
  const headingElement = screen.getByRole('heading', { name: /unity localization editor/i, level: 1 });
  expect(headingElement).toBeInTheDocument();
});
