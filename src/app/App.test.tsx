import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { App } from './App';

const renderApp = (initialPath = '/discover') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>,
  );

describe('App', () => {
  it('renders the main navigation in Hebrew', () => {
    renderApp();

    expect(screen.getAllByText('משחקים').length).toBeGreaterThan(0);
    expect(screen.getAllByText('חנות').length).toBeGreaterThan(0);
    expect(screen.getAllByText('הגדרות').length).toBeGreaterThan(0);
  });

  it('redirects unknown routes to discover', () => {
    renderApp('/no-such-route');

    expect(screen.getAllByText('התאמות חדשות').length).toBeGreaterThan(0);
  });

  it('renders the login placeholder outside the shell', () => {
    renderApp('/login');

    expect(screen.getByText('כניסה לאפליקציה')).toBeInTheDocument();
  });
});
