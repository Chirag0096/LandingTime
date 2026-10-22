// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CookingSessionProvider } from '../../src/context/CookingSessionContext';
import { RePlanScreen } from '../../src/components/screens/RePlanScreen';

describe('UI: RePlanScreen Component', () => {
  it('renders delay detected hero banner with 12m chicken roast delay', () => {
    render(
      <CookingSessionProvider>
        <RePlanScreen />
      </CookingSessionProvider>
    );

    expect(screen.getByText('A cooking delay was detected')).toBeInTheDocument();
    expect(screen.getByText(/12 additional minutes/i)).toBeInTheDocument();
    expect(screen.getByText('152°F')).toBeInTheDocument();
    expect(screen.getByText('165°F')).toBeInTheDocument();
  });

  it('renders the 3 metric cards: Delay (+12m), Original (7:30 PM), Projected (7:37 PM)', () => {
    render(
      <CookingSessionProvider>
        <RePlanScreen />
      </CookingSessionProvider>
    );

    expect(screen.getByText('DELAY DETECTED')).toBeInTheDocument();
    expect(screen.getByText('+12')).toBeInTheDocument();

    expect(screen.getByText('ORIGINAL TARGET')).toBeInTheDocument();
    expect(screen.getByText('7:30')).toBeInTheDocument();

    expect(screen.getByText('PROJECTED LANDING')).toBeInTheDocument();
    expect(screen.getByText('7:37')).toBeInTheDocument();
    expect(screen.getByText(/RECOVERED 5 MIN/i)).toBeInTheDocument();
  });

  it('renders proposed adjustments table explaining schedule shifts', () => {
    render(
      <CookingSessionProvider>
        <RePlanScreen />
      </CookingSessionProvider>
    );

    expect(screen.getByText('PROPOSED SCHEDULE CHANGES')).toBeInTheDocument();
    expect(screen.getByText('Roast Chicken · Resting Window')).toBeInTheDocument();
    expect(screen.getByText('Crispy Smashed Potatoes · Holding Phase')).toBeInTheDocument();
    expect(screen.getByText('Sautéed Asparagus & Gravy · Stovetop Shift')).toBeInTheDocument();
  });

  it('opens and adjusts recovery window in Edit Changes modal', async () => {
    render(
      <CookingSessionProvider>
        <RePlanScreen />
      </CookingSessionProvider>
    );

    const editBtn = screen.getByRole('button', { name: /EDIT CHANGES/i });
    fireEvent.click(editBtn);

    expect(screen.getByText('Edit Recovery Allocation')).toBeInTheDocument();

    // Adjust range input
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '6' } });

    // Apply button
    const applyBtn = screen.getByRole('button', { name: /Apply Recovery Settings/i });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(screen.queryByText('Edit Recovery Allocation')).not.toBeInTheDocument();
    });
  });

  it('renders action buttons: ACCEPT & RESUME COOKING and KEEP ORIGINAL PLAN', () => {
    render(
      <CookingSessionProvider>
        <RePlanScreen />
      </CookingSessionProvider>
    );

    expect(screen.getByRole('button', { name: /ACCEPT & RESUME COOKING/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /KEEP ORIGINAL PLAN/i })).toBeInTheDocument();
  });

  it('triggers acceptReplan when clicking ACCEPT & RESUME COOKING', () => {
    render(
      <CookingSessionProvider>
        <RePlanScreen />
      </CookingSessionProvider>
    );

    const acceptBtn = screen.getByRole('button', { name: /ACCEPT & RESUME COOKING/i });
    fireEvent.click(acceptBtn);
  });
});
