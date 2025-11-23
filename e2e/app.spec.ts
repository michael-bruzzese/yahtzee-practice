import { test, expect } from "@playwright/test";

test("loads home, rolls dice, and shows scoring prompt", async ({ page }) => {
  await page.route("**/api/scores", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ scores: [{ id: "1", name: "E2E Tester", score: 250 }] }),
    })
  );

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Pass & Play" })).toBeVisible();
  await expect(page.getByText("Roll to see scores")).toBeVisible();

  await page.getByRole("button", { name: "Roll Dice" }).click();
  await expect(page.getByText("Select a category")).toBeVisible();
  await expect(page.getByText("E2E Tester")).toBeVisible();
  await expect(page.getByText("Current turn")).toBeVisible();
});

test("requires auth when hitting password gate", async ({ request, baseURL }) => {
  const unauthenticated = await request.newContext({ baseURL, httpCredentials: undefined });
  const resp = await unauthenticated.get(baseURL!);
  expect(resp.status()).toBe(401);
  await unauthenticated.dispose();
});

test("simulates two players to 100 and persists winner to leaderboard", async ({ request, baseURL }) => {
  const payload = {
    players: [
      { name: "Winner", score: 100 },
      { name: "Challenger", score: 80 },
    ],
  };

  const post = await request.post(`${baseURL}/api/scores`, {
    data: payload,
  });
  expect(post.status()).toBe(200);
  const postData = await post.json();
  expect(postData.scores[0].name).toBe("Winner");

  const get = await request.get(`${baseURL}/api/scores`);
  expect(get.status()).toBe(200);
  const getData = await get.json();
  const names = getData.scores.map((s: any) => s.name);
  expect(names[0]).toBe("Winner");
});
