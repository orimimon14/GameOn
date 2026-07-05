import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import App from './App';

describe('App', () => {
  it('renders the main navigation in Hebrew', () => {
    render(<App />);

    expect(screen.getAllByText('משחקים').length).toBeGreaterThan(0);
    expect(screen.getAllByText('חנות').length).toBeGreaterThan(0);
    expect(screen.getAllByText('הגדרות').length).toBeGreaterThan(0);
  });
});
