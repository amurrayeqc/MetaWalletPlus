// src/App.test.js
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders MetaWalletPlus title', () => {
    render(<App />);
    const titleElement = screen.getByText(/MetaWalletPlus/i);
    expect(titleElement).toBeInTheDocument();
});
