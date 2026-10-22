// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CookingSessionProvider, useCookingSession } from '../../src/context/CookingSessionContext';
import { PantrySubstitutionModal } from '../../src/components/screens/PantrySubstitutionModal';

const ModalTestHarness: React.FC = () => {
  const { openSubstitutionModal } = useCookingSession();
  return (
    <div>
      <button onClick={openSubstitutionModal}>Trigger Substitution Modal</button>
      <PantrySubstitutionModal />
    </div>
  );
};

describe('UI: PantrySubstitutionModal Component', () => {
  it('opens modal and renders missing heavy cream alert and swap recommendations', () => {
    render(
      <CookingSessionProvider>
        <ModalTestHarness />
      </CookingSessionProvider>
    );

    // Open the modal
    fireEvent.click(screen.getByText('Trigger Substitution Modal'));

    expect(screen.getByText('Missing an ingredient?')).toBeInTheDocument();
    expect(screen.getByText('HEAVY CREAM MISSING')).toBeInTheDocument();
    expect(screen.getByText('Whole Milk + Melted Butter')).toBeInTheDocument();
    expect(screen.getByText('98% FLAVOR MATCH')).toBeInTheDocument();
    expect(screen.getByText('Exact Fat Reconstitution')).toBeInTheDocument();
  });

  it('toggles alternative selector to view other culinary options', () => {
    render(
      <CookingSessionProvider>
        <ModalTestHarness />
      </CookingSessionProvider>
    );

    fireEvent.click(screen.getByText('Trigger Substitution Modal'));

    const chooseOtherBtn = screen.getByRole('button', { name: /Choose Another Option/i });
    fireEvent.click(chooseOtherBtn);

    // Should display alternatives like Evaporated Milk or Greek Yogurt
    expect(screen.getAllByText(/Evaporated Milk/i).length).toBeGreaterThan(0);
  });

  it('applies substitute and closes modal on APPLY SUBSTITUTE & UPDATE PLAN click', async () => {
    render(
      <CookingSessionProvider>
        <ModalTestHarness />
      </CookingSessionProvider>
    );

    fireEvent.click(screen.getByText('Trigger Substitution Modal'));

    const applyBtn = screen.getByRole('button', { name: /APPLY SUBSTITUTE & UPDATE PLAN/i });
    fireEvent.click(applyBtn);

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText('Missing an ingredient?')).not.toBeInTheDocument();
    });
  });

  it('closes modal when cancel button or X is clicked', async () => {
    render(
      <CookingSessionProvider>
        <ModalTestHarness />
      </CookingSessionProvider>
    );

    fireEvent.click(screen.getByText('Trigger Substitution Modal'));

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByText('Missing an ingredient?')).not.toBeInTheDocument();
    });
  });
});
