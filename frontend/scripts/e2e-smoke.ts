import puppeteer from "puppeteer-core";

const BASE = "http://localhost:3001";
const CHROME = "/usr/bin/google-chrome";
const ITEM = "6a57dfe78b7a66c8b26b56c4";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

const page = await browser.newPage();
const results: string[] = [];

page.on("console", (m) => {
  if (m.type() === "error") console.log("  [browser console.error]", m.text());
});
page.on("pageerror", (e) =>
  console.log("  [browser pageerror]", e instanceof Error ? e.message : String(e)),
);
page.on("requestfailed", (r) =>
  console.log("  [requestfailed]", r.url(), r.failure()?.errorText),
);

try {
  // 1. Login as testuser via the UI.
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('input[name="userName"]');
  await page.type('input[name="userName"]', "testuser");
  await page.type('input[name="password"]', "userpass123");
  await page.click('button[type="submit"]');
  await page.waitForFunction(
    () => location.pathname === "/dashboard",
    { timeout: 8000 },
  );
  results.push("LOGIN -> redirected to /dashboard: OK");

  // 2. /account/sales renders the real sale created during backend verification.
  await page.goto(`${BASE}/account/sales`, { waitUntil: "domcontentloaded" });
  try {
    await page.waitForFunction(
      () => document.body.innerText.includes("CODE1234"),
      { timeout: 12000 },
    );
    results.push("/account/sales shows real sale CODE1234: OK");
  } catch {
    results.push(
      "/account/sales sale NOT found. Body text:\n" +
        (await page.evaluate(() => document.body.innerText)).slice(0, 400),
    );
  }

  // 3. Edit item PATCH succeeds end-to-end (was always 400 before Fix 2).
  await page.goto(`${BASE}/dashboard/items/${ITEM}/edit`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector('input[name="name"]');
  await page.focus('input[name="name"]');
  await page.keyboard.down("Control");
  await page.keyboard.press("KeyA");
  await page.keyboard.up("Control");
  await page.keyboard.type("Widget Verified");
  await page.click('button[type="submit"]');
  await page.waitForFunction(
    () => location.pathname === "/dashboard",
    { timeout: 8000 },
  );
  const nameOk = await page.evaluate(async () => {
    const res = await fetch(
      "http://localhost:3000/api/item/6a57dfe78b7a66c8b26b56c4",
      { credentials: "include" },
    );
    const j = await res.json();
    return j.data?.name === "Widget Verified";
  });
  results.push(`EDIT PATCH persisted new name (Widget Verified): ${nameOk ? "OK" : "FAIL"}`);

  // 4. Role gate: regular user hitting /admin redirects away.
  await page.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 1500));
  const onAdmin = page.url().includes("/admin");
  results.push(`ROLE GATE /admin blocks regular user: ${onAdmin ? "FAIL" : "OK"}`);

  // 5. Buy-now completes a purchase and it appears in /account/sales (Fix 2, Option A).
  // Wait for full load (networkidle0) so the client bundle for this route has
  // hydrated before we click — otherwise the modal (client-rendered) won't open.
  await page.goto(`${BASE}/items/${ITEM}`, { waitUntil: "networkidle0" });
  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll("button")).some((b) =>
        b.textContent?.includes("Buy now"),
      ),
    { timeout: 15000 },
  );
  await new Promise((r) => setTimeout(r, 800)); // let hydration settle
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Buy now"),
    );
    btn?.click();
  });
  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll("button")).some((b) =>
        b.textContent?.includes("Confirm purchase"),
      ),
    { timeout: 15000 },
  );
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Confirm purchase"),
    );
    btn?.click();
  });
  await page.waitForFunction(
    () => document.body.innerText.includes("Purchase recorded"),
    { timeout: 15000 },
  );
  const buyCode = await page.evaluate(() => {
    const m = document.body.innerText.match(/code ([A-Za-z0-9]+)/);
    return m ? m[1] : null;
  });
  await page.goto(`${BASE}/account/sales`, { waitUntil: "domcontentloaded" });
  try {
    await page.waitForFunction(
      (c) => !!c && document.body.innerText.includes(c),
      { timeout: 12000 },
      buyCode,
    );
    results.push(`BUY-NOW purchase appears in /account/sales: OK (code ${buyCode})`);
  } catch {
    results.push(
      `BUY-NOW purchase NOT found in /account/sales. Captured code=${buyCode}`,
    );
  }
} catch (err) {
  results.push(`ERROR: ${(err as Error).message}`);
} finally {
  await browser.close();
}

console.log("\n===== E2E RESULTS =====");
for (const r of results) console.log(r);
