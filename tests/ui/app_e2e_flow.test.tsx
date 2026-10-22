// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from '../../src/App';

describe('UI: Full End-to-End Application Flow (<App />)', () => {
  it('executes full 7-step user journey from Planning -> Live Cook -> Delay -> Replan -> Substitution -> Landing', async () => {
    render(<App />);

    // Step 1: Initial load on Planning Screen
    expect(screen.getByText("Let's get dinner to the table together.")).toBeInTheDocument();
    expect(screen.getByText('Herb-Crusted Roast Chicken')).toBeInTheDocument();
    expect(screen.getByText('Crispy Smashed Potatoes')).toBeInTheDocument();
    expect(screen.getByText('Sautéed Asparagus & Pan Gravy')).toBeInTheDocument();

    // Open Judge Demo Control Bar
    const demoBarTrigger = screen.getByText('JUDGE DEMO BAR');
    fireEvent.click(demoBarTrigger);
    expect(screen.getByText('JUDGE DEMO HARNESS')).toBeInTheDocument();

    // Step 2: Transition to Live Cooking
    const startCookBtn = screen.getByText('2. Start Cook');
    fireEvent.click(startCookBtn);

    // Should now be on Live Dashboard Screen
    expect(screen.getByText(/DINNER DIRECTORY/i)).toBeInTheDocument();
    expect(screen.getByText(/ACTIVE HANDS · STEP 04 OF 09/i)).toBeInTheDocument();
    expect(screen.getByText('SMASH & SEASON BOILED POTATOES')).toBeInTheDocument();

    // Step 3: Trigger 12-minute delay simulation
    const delayBtn = screen.getByText('3. +12m Delay');
    fireEvent.click(delayBtn);

    // Should now be on Re-Plan Screen
    expect(screen.getByText('A cooking delay was detected')).toBeInTheDocument();
    expect(screen.getByText('DELAY DETECTED')).toBeInTheDocument();
    expect(screen.getByText('+12')).toBeInTheDocument();
    expect(screen.getByText('PROJECTED LANDING')).toBeInTheDocument();
    expect(screen.getByText('7:37')).toBeInTheDocument();

    // Step 4: Accept Proposed Replan
    const acceptReplanBtn = screen.getByRole('button', { name: /ACCEPT & RESUME COOKING/i });
    fireEvent.click(acceptReplanBtn);

    // Returns to Live Dashboard Screen with adjusted schedule
    expect(screen.getByText(/DINNER DIRECTORY/i)).toBeInTheDocument();
    expect(screen.getByText(/ACTIVE HANDS · STEP 04 OF 09/i)).toBeInTheDocument();

    // Step 5: Report Missing Heavy Cream
    const missingCreamBtn = screen.getByText('5. Missing Cream');
    fireEvent.click(missingCreamBtn);

    // Pantry Substitution Modal opens
    await waitFor(() => {
      expect(screen.getByText('Missing an ingredient?')).toBeInTheDocument();
      expect(screen.getByText('HEAVY CREAM MISSING')).toBeInTheDocument();
      expect(screen.getByText('Whole Milk + Melted Butter')).toBeInTheDocument();
    });

    // Step 6: Apply Milk + Butter Substitute
    const applySubBtn = screen.getByText('6. Apply Sub (+2m)');
    fireEvent.click(applySubBtn);

    // Modal closes
    await waitFor(() => {
      expect(screen.queryByText('Missing an ingredient?')).not.toBeInTheDocument();
    });

    // Step 7: Land Dinner and complete Plating
    const landDinnerBtn = screen.getByText('7. Landed & Plating');
    fireEvent.click(landDinnerBtn);

    // Should now be on Dinner Landed Screen
    expect(screen.getByText('SYNCHRONIZED LANDING ACHIEVED')).toBeInTheDocument();
    expect(screen.getByText('Dinner landed. Everything is ready.')).toBeInTheDocument();
    expect(screen.getByText('ORIGINAL TARGET')).toBeInTheDocument();
    expect(screen.getByText('ACTUAL LANDING')).toBeInTheDocument();
    expect(screen.getAllByText('7:37').length).toBeGreaterThan(0);

    // Plating checklist is already marked complete by milestone 7
    expect(screen.getByText('All Plated!')).toBeInTheDocument();

    // Add Heavy Cream to restock list
    const restockBtn = screen.getByText('+ RESTOCK LIST');
    fireEvent.click(restockBtn);
    expect(screen.getByText('ADDED TO RESTOCK')).toBeInTheDocument();

    // Session is completed and archived
    expect(screen.getByText('SESSION ARCHIVED')).toBeInTheDocument();
  });
});
