// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CookingSessionProvider } from '../../src/context/CookingSessionContext';
import { PlanningScreen } from '../../src/components/screens/PlanningScreen';

describe('UI: PlanningScreen Component', () => {
  it('renders the planning header, badge, and intro text', () => {
    render(
      <CookingSessionProvider>
        <PlanningScreen />
      </CookingSessionProvider>
    );

    expect(screen.getByText("Let's get dinner to the table together.")).toBeInTheDocument();
    expect(screen.getByText(/PLANNING MODE/i)).toBeInTheDocument();
    expect(screen.getByText(/SESSION #/i)).toBeInTheDocument();
  });

  it('renders the 3 default selected dishes', () => {
    render(
      <CookingSessionProvider>
        <PlanningScreen />
      </CookingSessionProvider>
    );

    expect(screen.getByText('Herb-Crusted Roast Chicken')).toBeInTheDocument();
    expect(screen.getByText('Crispy Smashed Potatoes')).toBeInTheDocument();
    expect(screen.getByText('Sautéed Asparagus & Pan Gravy')).toBeInTheDocument();
  });

  it('displays target serving time and computed prep trigger countdown', () => {
    render(
      <CookingSessionProvider>
        <PlanningScreen />
      </CookingSessionProvider>
    );

    // Target serving time displays 07:30 PM
    expect(screen.getByText('07')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'PM' })).toBeInTheDocument();

    // Lead time and prep start
    expect(screen.getByText(/TOTAL ESTIMATE 70M/i)).toBeInTheDocument();
    expect(screen.getAllByText(/6:20 PM/i).length).toBeGreaterThan(0);
  });

  it('adjusts target time using preset buttons (7:00, 7:30)', () => {
    render(
      <CookingSessionProvider>
        <PlanningScreen />
      </CookingSessionProvider>
    );

    const btn700 = screen.getByRole('button', { name: '7:00' });
    fireEvent.click(btn700);

    // Should update minute to 00
    expect(screen.getByText('00')).toBeInTheDocument();
  });

  it('allows incrementing and decrementing target minutes with stepper buttons', () => {
    render(
      <CookingSessionProvider>
        <PlanningScreen />
      </CookingSessionProvider>
    );

    // Click Increase time by 15 minutes
    const plusBtn = screen.getByRole('button', { name: /Increase time by 15 minutes/i });
    fireEvent.click(plusBtn);

    // 7:30 + 15m -> 7:45
    expect(screen.getByText('45')).toBeInTheDocument();

    // Click Decrease time by 15 minutes
    const minusBtn = screen.getByRole('button', { name: /Decrease time by 15 minutes/i });
    fireEvent.click(minusBtn);
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('opens and closes the Add Dish modal', async () => {
    render(
      <CookingSessionProvider>
        <PlanningScreen />
      </CookingSessionProvider>
    );

    // Find and click "+ ADD ANOTHER DISH" button
    const addDishBtn = screen.getByRole('button', { name: /\+ ADD ANOTHER DISH/i });
    fireEvent.click(addDishBtn);

    // Modal should be visible with catalog
    await waitFor(() => {
      expect(screen.getByText('Add Dish to Synchronized Menu')).toBeInTheDocument();
    });

    // Close button
    const closeBtn = screen.getByRole('button', { name: 'Close dialog' });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText('Add Dish to Synchronized Menu')).not.toBeInTheDocument();
    });
  });

  it('allows removing a dish from the menu', () => {
    render(
      <CookingSessionProvider>
        <PlanningScreen />
      </CookingSessionProvider>
    );

    const deleteBtn = screen.getByRole('button', { name: /Remove Sautéed Asparagus & Pan Gravy/i });
    fireEvent.click(deleteBtn);

    // Asparagus dish should be removed
    expect(screen.queryByText('Sautéed Asparagus & Pan Gravy')).not.toBeInTheDocument();
    expect(screen.getByText(/2 DISHES SELECTED/i)).toBeInTheDocument();
  });

  it('triggers kitchen verification modal on START LIVE COOK-ALONG click', async () => {
    render(
      <CookingSessionProvider>
        <PlanningScreen />
      </CookingSessionProvider>
    );

    const ctaButton = screen.getByRole('button', { name: /START LIVE COOK-ALONG/i });
    fireEvent.click(ctaButton);

    // Verification modal should open
    await waitFor(() => {
      expect(screen.getByText('Aligning Cooking Trajectories')).toBeInTheDocument();
      expect(screen.getByText(/SEQUENCE VERIFICATION/i)).toBeInTheDocument();
    });
  });
});
