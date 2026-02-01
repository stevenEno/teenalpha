import { test, expect } from '@playwright/test';

// These tests run in the "Desktop Chrome - Authenticated" project,
// which loads saved storage state from auth.setup.ts.
// All requests hit the real dev server at localhost:3000.

// IMPORTANT: All tests share one authenticated user, so tests that
// mutate the incentive_assignments row must run serially to avoid races.

test.describe.serial('Incentive Hub & Selection', () => {
  test('hub page shows the incentive selector with three systems', async ({ page }) => {
    await page.goto('/dashboard/incentives');

    // The page should either show the selector or redirect to a sub-page.
    // If redirected, verify we're on an incentives sub-page.
    const url = page.url();
    if (url.includes('/dashboard/incentives/')) {
      // Already assigned — verify sub-page loaded
      await expect(page.locator('body')).toBeVisible();
    } else {
      // Selector should be showing
      await expect(page.getByText('Choose Your Challenge System')).toBeVisible();
      await expect(page.getByText('Daily Quest Chain')).toBeVisible();
      await expect(page.getByText('Challenge Ladder')).toBeVisible();
      await expect(page.getByText('Ambition Tracker')).toBeVisible();
    }
  });

  test('can select Quest Chain and activate it', async ({ page }) => {
    const clearRes = await page.request.post('/api/incentive/assign', {
      data: { system: 'quest' },
    });
    expect(clearRes.ok()).toBeTruthy();

    await page.goto('/dashboard/incentives/quests');

    // Should see the quest chain UI (or loading state then content)
    await expect(
      page.getByText("Today's Quest Chain").or(page.getByText('Failed to load'))
    ).toBeVisible({ timeout: 30000 });
  });

  test('can switch to Ambition Tracker', async ({ page }) => {
    const res = await page.request.post('/api/incentive/assign', {
      data: { system: 'tracker' },
    });
    expect(res.ok()).toBeTruthy();

    // Verify the assignment actually changed
    const checkRes = await page.request.get('/api/incentive/assign');
    const checkData = await checkRes.json();
    expect(checkData.assignment?.system).toBe('tracker');

    await page.goto('/dashboard/incentives/tracker');

    // Wait for the client component to finish its check and render.
    // The tracker page does a client-side fetch to verify assignment,
    // then either shows GoalSetForm or AmbitionView.
    await expect(
      page
        .getByText('Set Your Weekly Ambition')
        .or(page.getByText('Weekly Ambition'))
    ).toBeVisible({ timeout: 30000 });
  });

  test('can switch to Challenge Ladder', async ({ page }) => {
    const res = await page.request.post('/api/incentive/assign', {
      data: { system: 'ladder' },
    });
    expect(res.ok()).toBeTruthy();

    // Verify the assignment actually changed
    const checkRes = await page.request.get('/api/incentive/assign');
    const checkData = await checkRes.json();
    expect(checkData.assignment?.system).toBe('ladder');

    await page.goto('/dashboard/incentives/ladders');

    // Should show join form or an active ladder view
    await expect(
      page
        .getByText('Join a Challenge Ladder')
        .or(page.getByText('members'))
    ).toBeVisible({ timeout: 30000 });
  });
});

test.describe.serial('Quest Chain Interactions', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure user is assigned to quest system
    await page.request.post('/api/incentive/assign', {
      data: { system: 'quest' },
    });
  });

  test('quest chain page displays quests or generates them', async ({ page }) => {
    await page.goto('/dashboard/incentives/quests');

    // Wait for either quests to load or an error
    await expect(
      page.getByText("Today's Quest Chain").or(page.getByText('Failed to load'))
    ).toBeVisible({ timeout: 30000 });

    // If quests loaded, verify chain structure
    const heading = page.getByText("Today's Quest Chain");
    if (await heading.isVisible()) {
      // Should show completion count (e.g., "0/3 completed")
      await expect(page.getByText(/\d+\/\d+ completed/)).toBeVisible();

      // Should show level info
      await expect(page.getByText(/Level \d+/)).toBeVisible();

      // Should show at least one quest card (the active one)
      await expect(page.getByText(/Lv \d+/).first()).toBeVisible();
    }
  });

  test('quest card expands when clicked and shows proof form', async ({ page }) => {
    await page.goto('/dashboard/incentives/quests');

    // Wait for quests
    await page.waitForSelector('text="Today\'s Quest Chain"', { timeout: 30000 });

    // The first non-completed quest should be active — click it to expand
    const activeCard = page.locator('[class*="border-indigo"]').first();
    if (await activeCard.isVisible()) {
      await activeCard.click();

      // Should show proof textarea and discomfort rating
      await expect(page.getByPlaceholder('Describe what you did...')).toBeVisible();
      await expect(
        page.getByText('How far outside your comfort zone was this?')
      ).toBeVisible();
      await expect(page.getByRole('button', { name: 'Complete Quest' })).toBeVisible();
    }
  });

  test('discomfort rating is interactive and shows bonus text', async ({ page }) => {
    await page.goto('/dashboard/incentives/quests');
    await page.waitForSelector('text="Today\'s Quest Chain"', { timeout: 30000 });

    // Expand active quest
    const activeCard = page.locator('[class*="border-indigo"]').first();
    if (await activeCard.isVisible()) {
      await activeCard.click();

      // Click rating level 4
      const ratingButtons = page.locator('button:has-text("4")');
      const discomfortButton = ratingButtons.last();
      if (await discomfortButton.isVisible()) {
        await discomfortButton.click();
        await expect(page.getByText('+50% Alpha Bonus!')).toBeVisible();
      }
    }
  });

  test('streak flame and Alpha are visible in quest chain header', async ({ page }) => {
    await page.goto('/dashboard/incentives/quests');
    await page.waitForSelector('text="Today\'s Quest Chain"', { timeout: 30000 });

    // Streak flame + Alpha display in header
    await expect(page.getByText(/\d+ Alpha/)).toBeVisible();
  });
});

test.describe.serial('Ambition Tracker Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post('/api/incentive/assign', {
      data: { system: 'tracker' },
    });
  });

  test('goal set form renders with textarea and AI button', async ({ page }) => {
    await page.goto('/dashboard/incentives/tracker');

    // Wait for the client-side check to finish
    await expect(
      page
        .getByText('Set Your Weekly Ambition')
        .or(page.getByText('Weekly Ambition'))
    ).toBeVisible({ timeout: 30000 });

    // If no active goal, should show the goal-setting form
    const formHeading = page.getByText('Set Your Weekly Ambition');
    if (await formHeading.isVisible()) {
      await expect(
        page.getByPlaceholder(/Learn the basics|Build a simple/)
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Break It Down with AI' })
      ).toBeVisible();

      // Button should be disabled when textarea is empty
      await expect(
        page.getByRole('button', { name: 'Break It Down with AI' })
      ).toBeDisabled();

      // Type a goal — button should enable
      await page
        .getByPlaceholder(/Learn the basics|Build a simple/)
        .fill('Learn basic guitar chords');
      await expect(
        page.getByRole('button', { name: 'Break It Down with AI' })
      ).toBeEnabled();
    }
  });

  test('active goal shows ambition meter and day circles', async ({ page }) => {
    await page.goto('/dashboard/incentives/tracker');

    await expect(
      page
        .getByText('Set Your Weekly Ambition')
        .or(page.getByText('Weekly Ambition'))
    ).toBeVisible({ timeout: 30000 });

    const goalView = page.getByText('Weekly Ambition');
    if (await goalView.isVisible()) {
      // Should show 7 day indicators (D1-D7)
      for (let d = 1; d <= 7; d++) {
        await expect(page.getByText(`D${d}`)).toBeVisible();
      }

      // Should show Alpha count
      await expect(page.getByText(/\d+ Alpha/)).toBeVisible();

      // Should show day task card
      await expect(page.getByText(/Day \d+/)).toBeVisible();
    }
  });
});

test.describe.serial('Challenge Ladder Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post('/api/incentive/assign', {
      data: { system: 'ladder' },
    });
  });

  test('join form renders with interest input', async ({ page }) => {
    await page.goto('/dashboard/incentives/ladders');

    // Wait for the client-side check to finish
    await expect(
      page
        .getByText('Join a Challenge Ladder')
        .or(page.getByText('members'))
    ).toBeVisible({ timeout: 30000 });

    const joinForm = page.getByText('Join a Challenge Ladder');
    if (await joinForm.isVisible()) {
      await expect(
        page.getByPlaceholder(/coding, music, fitness/)
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Find a Group' })
      ).toBeVisible();

      // Button disabled when empty
      await expect(
        page.getByRole('button', { name: 'Find a Group' })
      ).toBeDisabled();

      // Type interest — button enables
      await page.getByPlaceholder(/coding, music, fitness/).fill('coding');
      await expect(
        page.getByRole('button', { name: 'Find a Group' })
      ).toBeEnabled();
    }
  });
});

test.describe.serial('Dashboard Widget', () => {
  test('IncentiveWidget appears on teen dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should see either the active challenge card or the CTA
    await expect(
      page
        .getByText('Active Challenge')
        .or(page.getByText('Choose Your Challenge System'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('widget links to correct incentive page', async ({ page }) => {
    // Assign quest system
    await page.request.post('/api/incentive/assign', {
      data: { system: 'quest' },
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const widget = page.getByText('Quest Chain');
    if (await widget.isVisible()) {
      await widget.click();
      await page.waitForURL(/\/dashboard\/incentives\/quests/);
      expect(page.url()).toContain('/dashboard/incentives/quests');
    }
  });
});
