// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CookingSessionProvider } from '../../src/context/CookingSessionContext';
import { DemoControlBar } from '../../src/components/DemoControlBar';

describe('UI: DemoControlBar Component (Judge Harness)', () => {
  it('renders initial floating trigger button when URL is neutral', () => {
    render(
      <CookingSessionProvider>
        <DemoControlBar />
      </CookingSessionProvider>
    );

    const launcherBtn = screen.getByTitle(/Open Judge Demo Harness/i);
    expect(launcherBtn).toBeInTheDocument();
    expect(screen.getByText('JUDGE DEMO BAR')).toBeInTheDocument();
  });

  it('expands full demo bar on click and renders all 7 milestone buttons', () => {
    render(
      <CookingSessionProvider>
        <DemoControlBar />
      </CookingSessionProvider>
    );

    // Click to open
    fireEvent.click(screen.getByText('JUDGE DEMO BAR'));

    expect(screen.getByText('JUDGE DEMO HARNESS')).toBeInTheDocument();
    expect(screen.getByText(/UUID:/i)).toBeInTheDocument();

    // Verify 7 milestone buttons
    expect(screen.getByText('1. Plan (7:30)')).toBeInTheDocument();
    expect(screen.getByText('2. Start Cook')).toBeInTheDocument();
    expect(screen.getByText('3. +12m Delay')).toBeInTheDocument();
    expect(screen.getByText('4. Accept (7:37)')).toBeInTheDocument();
    expect(screen.getByText('5. Missing Cream')).toBeInTheDocument();
    expect(screen.getByText('6. Apply Sub (+2m)')).toBeInTheDocument();
    expect(screen.getByText('7. Landed & Plating')).toBeInTheDocument();
    expect(screen.getByText('Benchmark')).toBeInTheDocument();
  });

  it('measures real CPM latency benchmark on click', () => {
    render(
      <CookingSessionProvider>
        <DemoControlBar />
      </CookingSessionProvider>
    );

    fireEvent.click(screen.getByText('JUDGE DEMO BAR'));

    const benchmarkBtn = screen.getByText('Benchmark');
    fireEvent.click(benchmarkBtn);

    // CPM Latency badge should appear
    expect(screen.getByText(/CPM LATENCY:/i)).toBeInTheDocument();
  });
});
