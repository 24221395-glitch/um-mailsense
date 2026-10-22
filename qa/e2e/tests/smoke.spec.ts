import { expect, test } from "@playwright/test";

// Runs against the frontend with VITE_USE_MOCKS=true until the backend is connected (W3-FE-03).

test("login page shows the Siswamail button", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Sign in with Siswamail" })).toBeVisible();
});

test("inbox lists emails and filters by segment", async ({ page }) => {
  await page.goto("/inbox");
  await expect(page.getByRole("heading", { name: "Inbox" })).toBeVisible();
  await page.getByRole("button", { name: /Hackathon & Competition/ }).click();
  await expect(page.locator("article")).toHaveCount(1);
});
