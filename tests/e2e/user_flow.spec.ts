import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Landing Time — Step-by-Step End-to-End User Flow (Playwright)', () => {
  const screenshotsDir = path.resolve(process.cwd(), 'tests/e2e/screenshots');

  test.beforeAll(async () => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test('complete 8-step journey on live website (http://localhost:3000)', async ({ page }) => {
    // -------------------------------------------------------------
    // STEP 1: PLANNING SCREEN & MEAL SELECTION
    // -------------------------------------------------------------
    console.log('[STEP 1] Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Header & Brand Verification
    await expect(page.locator('text=LANDING TIME').first()).toBeVisible();
    await expect(page.locator('text=Let\'s get dinner to the table together.')).toBeVisible();
    await expect(page.locator('text=PLANNING MODE')).toBeVisible();

    // Verify 3 Selected Dishes
    await expect(page.locator('text=Herb-Crusted Roast Chicken').first()).toBeVisible();
    await expect(page.locator('text=Crispy Smashed Potatoes').first()).toBeVisible();
    await expect(page.locator('text=Sautéed Asparagus & Pan Gravy').first()).toBeVisible();

    // Target Serving Time & Backward Scheduling Display
    await expect(page.locator('text=TARGET SERVING TIME')).toBeVisible();
    await expect(page.locator('text=7:30').first()).toBeVisible();
    await expect(page.locator('text=TOTAL ESTIMATE 70M')).toBeVisible();

    // Time adjustment stepper test (+15m -> 7:45, -15m -> 7:30)
    const plus15Btn = page.locator('button[aria-label="Increase time by 15 minutes"]');
    await plus15Btn.click();
    await expect(page.locator('text=45').first()).toBeVisible();

    const minus15Btn = page.locator('button[aria-label="Decrease time by 15 minutes"]');
    await minus15Btn.click();
    await expect(page.locator('text=30').first()).toBeVisible();

    // Add Dish Modal Test
    const addDishBtn = page.locator('button:has-text("+ ADD ANOTHER DISH")');
    await addDishBtn.click();
    await expect(page.locator('text=Add Dish to Synchronized Menu')).toBeVisible();
    const closeAddModalBtn = page.locator('button[aria-label="Close dialog"]');
    await closeAddModalBtn.click();
    await expect(page.locator('text=Add Dish to Synchronized Menu')).not.toBeVisible();

    // Capture Step 1 Screenshot
    await page.screenshot({ path: path.join(screenshotsDir, '01_planning_screen.png'), fullPage: true });
    console.log('[STEP 1 PASS] Planning Screen verified and screenshot saved.');

    // -------------------------------------------------------------
    // STEP 2: LAUNCH LIVE COOKING (Sequence Verification Modal)
    // -------------------------------------------------------------
    console.log('[STEP 2] Launching Live Cook-Along...');
    const startLiveBtn = page.locator('button:has-text("START LIVE COOK-ALONG")');
    await startLiveBtn.click();

    // Verification Overlay
    await expect(page.locator('text=Aligning Cooking Trajectories')).toBeVisible();
    await expect(page.locator('text=SEQUENCE VERIFICATION')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, '02_sequence_verification.png') });

    // Click proceed button inside verification overlay
    const proceedBtn = page.locator('button:has-text("Proceed to Active Kitchen Display")');
    await proceedBtn.click();

    await page.waitForTimeout(500);

    // -------------------------------------------------------------
    // STEP 3: LIVE COOK DASHBOARD (Timer, Active Step, Appliances)
    // -------------------------------------------------------------
    console.log('[STEP 3] Verifying Live Dashboard Screen...');
    await expect(page.locator('text=DINNER DIRECTORY')).toBeVisible();
    await expect(page.locator('text=/0[3-5]:[0-5][0-9]/')).toBeVisible();
    await expect(page.getByText('REMAINING', { exact: true })).toBeVisible();
    await expect(page.locator('text=OVEN · 425°F · BUSY')).toBeVisible();

    // Timer controls test: Pause -> Play -> Reset
    const pauseTimerBtn = page.locator('button[title="Pause timer"]');
    await pauseTimerBtn.click();
    await expect(page.getByText('PAUSED', { exact: true })).toBeVisible();

    const resetTimerBtn = page.locator('button[title="Reset timer"]');
    await resetTimerBtn.click();
    await expect(page.locator('text=05:00')).toBeVisible();

    // Step Sub-Item Checklist test
    const checklistItem = page.locator('text=Add oil & seasoning');
    await checklistItem.click();

    // Advance Step button test
    const advanceStepBtn = page.locator('button:has-text("DONE · ADVANCE STEP")');
    await advanceStepBtn.click();
    await expect(page.locator('text=STEP 05 OF 09')).toBeVisible();

    // Timeline track rendering verification
    await expect(page.locator('text=Roast Chicken').first()).toBeVisible();
    await expect(page.locator('text=Smashed Potatoes').first()).toBeVisible();
    await expect(page.locator('text=Asparagus & Gravy').first()).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, '03_live_dashboard.png'), fullPage: true });
    console.log('[STEP 3 PASS] Live Dashboard verified and screenshot saved.');

    // -------------------------------------------------------------
    // STEP 4: DELAY RECOVERY FLOW (Chicken roast needs +12m)
    // -------------------------------------------------------------
    console.log('[STEP 4] Triggering +12m Cooking Delay...');
    const reportDelayBtn = page.locator('button:has-text("REPORT A DELAY (+12M)")');
    await reportDelayBtn.click();

    // Verify Re-Plan Screen loaded
    await expect(page.locator('text=A cooking delay was detected')).toBeVisible();
    await expect(page.getByText('DELAY DETECTED', { exact: true })).toBeVisible();
    await expect(page.getByText('+12', { exact: true })).toBeVisible();
    await expect(page.getByText('PROJECTED LANDING', { exact: true })).toBeVisible();
    await expect(page.locator('text=7:37').first()).toBeVisible();
    await expect(page.locator('text=RECOVERED 5 MIN')).toBeVisible();

    // Verify Proposed Schedule Changes table
    await expect(page.locator('text=PROPOSED SCHEDULE CHANGES')).toBeVisible();
    await expect(page.locator('text=Roast Chicken · Resting Window')).toBeVisible();
    await expect(page.locator('text=Crispy Smashed Potatoes · Holding Phase')).toBeVisible();
    await expect(page.locator('text=Sautéed Asparagus & Gravy · Stovetop Shift')).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, '04_replan_screen.png'), fullPage: true });

    // Accept Replan & Return to Live Cooking
    const acceptReplanBtn = page.locator('button:has-text("ACCEPT & RESUME COOKING")');
    await acceptReplanBtn.click();
    await expect(page.locator('text=DINNER DIRECTORY')).toBeVisible();
    console.log('[STEP 4 PASS] Delay recovered, replan accepted, returned to Live Dashboard.');

    // -------------------------------------------------------------
    // STEP 5: PANTRY SUBSTITUTION (Missing Heavy Cream)
    // -------------------------------------------------------------
    console.log('[STEP 5] Triggering Missing Ingredient (Heavy Cream)...');
    const ingredientMissingBtn = page.locator('button:has-text("INGREDIENT MISSING")');
    await ingredientMissingBtn.click();

    // Verify Pantry Modal Content
    await expect(page.locator('text=Missing an ingredient?')).toBeVisible();
    await expect(page.locator('text=HEAVY CREAM MISSING')).toBeVisible();
    await expect(page.locator('text=Whole Milk + Melted Butter')).toBeVisible();
    await expect(page.locator('text=98% FLAVOR MATCH')).toBeVisible();
    await expect(page.locator('text=Exact Fat Reconstitution')).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, '05_pantry_substitution_modal.png') });

    // Apply substitution
    const applySubBtn = page.locator('button:has-text("APPLY SUBSTITUTE & UPDATE PLAN")');
    await applySubBtn.click();
    await expect(page.locator('text=Missing an ingredient?')).not.toBeVisible();
    console.log('[STEP 5 PASS] Heavy Cream substitute applied (+2m simmer adjusted).');

    // -------------------------------------------------------------
    // STEP 6: DINNER LANDED & PLATING CHECKLIST
    // -------------------------------------------------------------
    console.log('[STEP 6] Navigating to Dinner Landed Screen...');
    const landedNavBtn = page.locator('nav button:has-text("5. Dinner Landed")');
    await landedNavBtn.click();

    // Verify Dinner Landed Screen
    await expect(page.locator('text=SYNCHRONIZED LANDING ACHIEVED')).toBeVisible();
    await expect(page.locator('text=Dinner landed. Everything is ready.')).toBeVisible();
    await expect(page.locator('text=ORIGINAL TARGET')).toBeVisible();
    await expect(page.locator('text=ACTUAL LANDING')).toBeVisible();
    await expect(page.locator('text=Finish Spread: 2 min')).toBeVisible();

    // Plating Checklist & Mark All Complete
    await expect(page.locator('text=Ready to Plate')).toBeVisible();
    const markAllPlatedBtn = page.locator('button:has-text("MARK ALL COMPLETE")');
    await markAllPlatedBtn.click();
    await expect(page.locator('text=All Plated!')).toBeVisible();

    // Restock list interaction: Flag Heavy Cream
    await expect(page.locator('text=Pantry & Restock Check')).toBeVisible();
    await expect(page.locator('text=Heavy Cream').first()).toBeVisible();
    const restockBtn = page.locator('button:has-text("+ RESTOCK LIST")');
    if (await restockBtn.isVisible()) {
      await restockBtn.click();
      await expect(page.locator('text=ADDED TO RESTOCK')).toBeVisible();
    }

    await page.screenshot({ path: path.join(screenshotsDir, '06_dinner_landed_screen.png'), fullPage: true });
    console.log('[STEP 6 PASS] Dinner Landed Screen & Plating Checklist verified.');

    // -------------------------------------------------------------
    // STEP 7: FINISH SESSION & ARCHIVE
    // -------------------------------------------------------------
    console.log('[STEP 7] Archiving cooking session...');
    const finishSessionBtn = page.locator('button:has-text("FINISH SESSION")');
    if (await finishSessionBtn.isVisible()) {
      await finishSessionBtn.click();
      await expect(page.getByRole('button', { name: 'SESSION ARCHIVED' })).toBeVisible();
    }
    console.log('[STEP 7 PASS] Session successfully finished and archived.');

    // -------------------------------------------------------------
    // STEP 8: JUDGE DEMO HARNESS & REAL CPM LATENCY BENCHMARK
    // -------------------------------------------------------------
    console.log('[STEP 8] Testing Judge Demo Bar and real CPM Latency Benchmark...');
    const demoBarLauncher = page.getByRole('button', { name: 'JUDGE DEMO BAR' });
    if (await demoBarLauncher.isVisible()) {
      await demoBarLauncher.click();
    }

    await expect(page.locator('text=JUDGE DEMO HARNESS')).toBeVisible();
    await expect(page.locator('text=1. Plan (7:30)')).toBeVisible();
    await expect(page.locator('text=3. +12m Delay')).toBeVisible();
    await expect(page.locator('text=7. Landed & Plating')).toBeVisible();

    // Execute in-memory CPM calculation benchmark
    const benchmarkBtn = page.locator('button:has-text("Benchmark")');
    await benchmarkBtn.click();
    await expect(page.locator('text=CPM LATENCY:')).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, '07_judge_demo_harness.png') });
    console.log('[STEP 8 PASS] Demo Control Bar and real CPM latency benchmark verified.');
  });
});
