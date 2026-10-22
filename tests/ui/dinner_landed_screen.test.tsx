// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CookingSessionProvider } from '../../src/context/CookingSessionContext';
import { DinnerLandedScreen } from '../../src/components/screens/DinnerLandedScreen';

describe('UI: DinnerLandedScreen Component', () => {
  it('renders synchronized landing banner and timing comparison', () => {
    render(
      <CookingSessionProvider>
        <DinnerLandedScreen />
      </CookingSessionProvider>
    );

    expect(screen.getByText('SYNCHRONIZED LANDING ACHIEVED')).toBeInTheDocument();
    expect(screen.getByText('Dinner landed. Everything is ready.')).toBeInTheDocument();
    expect(screen.getByText('ORIGINAL TARGET')).toBeInTheDocument();
    expect(screen.getByText('ACTUAL LANDING')).toBeInTheDocument();
    expect(screen.getAllByText('7:37').length).toBeGreaterThan(0);
    expect(screen.getByText('Finish Spread: 2 min')).toBeInTheDocument();
  });

  it('renders readiness status cards for all 3 dishes', () => {
    render(
      <CookingSessionProvider>
        <DinnerLandedScreen />
      </CookingSessionProvider>
    );

    expect(screen.getAllByText(/Roast Chicken/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Smashed Potatoes/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Asparagus & Pan Gravy/i).length).toBeGreaterThan(0);
  });

  it('interacts with the plating checklist and marks all complete', () => {
    render(
      <CookingSessionProvider>
        <DinnerLandedScreen />
      </CookingSessionProvider>
    );

    expect(screen.getByText('Ready to Plate')).toBeInTheDocument();

    // Click "MARK ALL COMPLETE"
    const markAllBtn = screen.getByRole('button', { name: /MARK ALL COMPLETE/i });
    fireEvent.click(markAllBtn);

    expect(screen.getByText('All Plated!')).toBeInTheDocument();
  });

  it('flags depleted Heavy Cream and adds to grocery restock list', () => {
    render(
      <CookingSessionProvider>
        <DinnerLandedScreen />
      </CookingSessionProvider>
    );

    expect(screen.getByText('Pantry & Restock Check')).toBeInTheDocument();
    expect(screen.getAllByText(/Heavy Cream/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Depleted')).toBeInTheDocument();

    const restockBtn = screen.getByText('+ RESTOCK LIST');
    fireEvent.click(restockBtn);

    // Button updates state
    expect(screen.getByText('ADDED TO RESTOCK')).toBeInTheDocument();
  });

  it('renders footer actions: VIEW COOKING SUMMARY, START ANOTHER MEAL, FINISH SESSION', () => {
    render(
      <CookingSessionProvider>
        <DinnerLandedScreen />
      </CookingSessionProvider>
    );

    expect(screen.getByRole('button', { name: /VIEW COOKING SUMMARY/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /START ANOTHER MEAL/i }).length).toBeGreaterThan(0);

    const finishBtn = screen.getByRole('button', { name: /FINISH SESSION/i });
    expect(finishBtn).toBeInTheDocument();

    fireEvent.click(finishBtn);
    expect(screen.getByText('SESSION ARCHIVED')).toBeInTheDocument();
  });
});
