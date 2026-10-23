// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CookingSessionProvider } from '../../src/context/CookingSessionContext';
import { LiveDashboardScreen } from '../../src/components/screens/LiveDashboardScreen';

describe('UI: LiveDashboardScreen Component', () => {
  it('renders session header, mission control deadline, and hardware status', () => {
    render(
      <CookingSessionProvider>
        <LiveDashboardScreen />
      </CookingSessionProvider>
    );

    expect(screen.getByText(/DINNER DIRECTORY/i)).toBeInTheDocument();
    expect(screen.getByText(/COORDINATED MEAL PLAN/i)).toBeInTheDocument();
    expect(screen.getByText(/DINNER FOR 4/i)).toBeInTheDocument();
    expect(screen.getByText(/LANDING AT/i)).toBeInTheDocument();
    expect(screen.getByText(/OVEN · 425°F · BUSY/i)).toBeInTheDocument();
    expect(screen.getByText(/BURNERS · 2/i)).toBeInTheDocument();
  });

  it('renders the active step card with instruction and circular timer', () => {
    render(
      <CookingSessionProvider>
        <LiveDashboardScreen />
      </CookingSessionProvider>
    );

    // Initial step 4 title and timer (04:18)
    expect(screen.getByText(/ACTIVE HANDS · STEP 04 OF 09/i)).toBeInTheDocument();
    expect(screen.getByText('SMASH & SEASON BOILED POTATOES')).toBeInTheDocument();
    expect(screen.getByText('04:18')).toBeInTheDocument();
    expect(screen.getByText('REMAINING')).toBeInTheDocument();
  });

  it('controls circular timer with pause, play, and reset buttons', () => {
    render(
      <CookingSessionProvider>
        <LiveDashboardScreen />
      </CookingSessionProvider>
    );

    const pauseBtn = screen.getByTitle('Pause timer');
    fireEvent.click(pauseBtn);

    // Timer is now paused
    expect(screen.getByText('PAUSED')).toBeInTheDocument();

    // Reset timer to total duration (5 minutes -> 05:00)
    const resetBtn = screen.getByTitle('Reset timer');
    fireEvent.click(resetBtn);
    expect(screen.getByText('05:00')).toBeInTheDocument();
  });

  it('toggles step checklist sub-items', () => {
    render(
      <CookingSessionProvider>
        <LiveDashboardScreen />
      </CookingSessionProvider>
    );

    // Sub-item for Step 4
    const subItem = screen.getByText('Add oil & seasoning');
    expect(subItem).toBeInTheDocument();

    // Click to toggle
    fireEvent.click(subItem);
    // After click, line-through class is applied
    expect(subItem.className).toContain('line-through');
  });

  it('advances to next cooking step on DONE · ADVANCE STEP click', () => {
    render(
      <CookingSessionProvider>
        <LiveDashboardScreen />
      </CookingSessionProvider>
    );

    const advanceBtn = screen.getByRole('button', { name: /DONE · ADVANCE STEP/i });
    fireEvent.click(advanceBtn);

    // Should advance from step 4 to step 5
    expect(screen.getByText(/ACTIVE HANDS · STEP 05 OF 09/i)).toBeInTheDocument();
  });

  it('allows jumping directly to a step using navigator pills', () => {
    render(
      <CookingSessionProvider>
        <LiveDashboardScreen />
      </CookingSessionProvider>
    );

    const jumpBtn2 = screen.getByRole('button', { name: 'Jump to Step 2' });
    fireEvent.click(jumpBtn2);

    expect(screen.getByText(/ACTIVE HANDS · STEP 02 OF 09/i)).toBeInTheDocument();
  });

  it('renders multi-dish timeline tracks with synchronous landing needles', () => {
    render(
      <CookingSessionProvider>
        <LiveDashboardScreen />
      </CookingSessionProvider>
    );

    expect(screen.getAllByText('Roast Chicken').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Smashed Potatoes').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Asparagus & Gravy').length).toBeGreaterThan(0);
    expect(screen.getByText(/SERVE · 7:3/i)).toBeInTheDocument();
  });

  it('renders quick action chips for delay, missing ingredient, and voice command', () => {
    render(
      <CookingSessionProvider>
        <LiveDashboardScreen />
      </CookingSessionProvider>
    );

    expect(screen.getByRole('button', { name: /WHAT NOW\?/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /REPORT A DELAY \(\+12M\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /INGREDIENT MISSING/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /PAUSE TIMERS/i })).toBeInTheDocument();
  });

  it('dynamically updates simulation clock when clicking timeline scrubber presets', () => {
    render(
      <CookingSessionProvider>
        <LiveDashboardScreen />
      </CookingSessionProvider>
    );

    // Initial clock display
    expect(screen.getByText('6:51 PM')).toBeInTheDocument();

    // Click 6:20 PM Prep preset
    const prepPreset = screen.getByRole('button', { name: /6:20 PM Prep/i });
    fireEvent.click(prepPreset);

    // Now clock and active step 1 should be active
    expect(screen.getAllByText('6:20 PM').length).toBeGreaterThan(0);
    expect(screen.getByText(/ACTIVE HANDS · STEP 01 OF 09/i)).toBeInTheDocument();
  });

  it('jumps to corresponding cooking step when clicking a timeline segment', () => {
    render(
      <CookingSessionProvider>
        <LiveDashboardScreen />
      </CookingSessionProvider>
    );

    // Click Boil yukons segment
    const boilSeg = screen.getByText(/Boil yukons · 15m/i);
    fireEvent.click(boilSeg);

    // Should switch to step 3
    expect(screen.getByText(/ACTIVE HANDS · STEP 03 OF 09/i)).toBeInTheDocument();
  });

  it('jumps to corresponding cooking step when clicking interactive equipment cards', () => {
    render(
      <CookingSessionProvider>
        <LiveDashboardScreen />
      </CookingSessionProvider>
    );

    // Click primary oven roast chicken card
    const chickenCard = screen.getByTitle(/Click to focus on Chicken Roast \(Step 2\)/i);
    fireEvent.click(chickenCard);

    // Active step should become Step 2
    expect(screen.getByText(/ACTIVE HANDS · STEP 02 OF 09/i)).toBeInTheDocument();
  });

  it('adjusts target serving deadline with +/- 5m quick buttons', () => {
    render(
      <CookingSessionProvider>
        <LiveDashboardScreen />
      </CookingSessionProvider>
    );

    const plus5Btn = screen.getByTitle(/Shift dinner 5 minutes later/i);
    fireEvent.click(plus5Btn);

    // Target was 7:30 PM, now 7:35 PM
    expect(screen.getByText(/LANDING AT 7:35 PM/i)).toBeInTheDocument();
  });
});
