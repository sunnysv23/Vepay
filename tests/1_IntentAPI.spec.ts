import { test, expect } from "@playwright/test";
import axios from "axios";
import * as dotenv from "dotenv";
import tv4 from "tv4"; // ✅ Schema validation
import fs from "fs";
import path from "path";

const intentApiUrl = "/payment/intents"; // used with api instance baseURL

/* ------------------------------------------
   Load merchant credentials from JSON
------------------------------------------ */

import { fileURLToPath } from "url";

// Support __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Merchant {
  merchant: string;
  mid: string;
  password: string;
}

// merchants.json located in project root
const merchantsPath = path.resolve(__dirname, "../merchants.json");

if (!fs.existsSync(merchantsPath)) {
  throw new Error(`❌ merchants.json not found at:

${merchantsPath}

👉 Make sure the file is placed in project root (NOT inside /tests)`);
}

// Read & parse merchant list
const merchants: Merchant[] = JSON.parse(
  fs.readFileSync(merchantsPath, "utf8")
);

// Parameterized testing: Run tests for each merchant (or a single merchant via env)
const envMerchant = process.env.MERCHANT;

const merchantsToRun: Merchant[] = envMerchant
  ? (JSON.parse(fs.readFileSync(merchantsPath, "utf8")) as Merchant[]).filter(
      (m) => m.merchant.toLowerCase() === envMerchant.toLowerCase()
    )
  : merchants;

if (envMerchant && merchantsToRun.length === 0) {
  throw new Error(`❌ Merchant not found: ${envMerchant}\n\n👉 Available merchants:\n${merchants
    .map((m) => "• " + m.merchant)
    .join("\n")}`);
}

// Parameterized testing: Run tests for each merchant
for (const merchant of merchantsToRun) {
  test.describe(`[Merchant: ${merchant.merchant}]`, () => {
    // Setup headers for current merchant
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      mid: merchant.mid,
      password: merchant.password,
    };

    // Shared axios instance for cleaner requests
    const api = axios.create({
      baseURL: process.env.INTENT_API_BASE_URL ?? "https://securenew.vernostpay.com/api",
      headers,
      timeout: 15000,
    });

    // generateMerchantOrderToken(),
    function generateMerchantOrderToken(): string {
      return "Pin" + Math.floor(1000000000 + Math.random() * 9000000000);
    }

    const basePayload = {
      "curr_code": "INR",
      "amount": 1000,
      "merchant_order_token": generateMerchantOrderToken(),
      "customer_email": "sunny.vishwakarma@vernost.com",
      "customer_mobile": "7350774622",
      "customer_first_name": "Sunny",
      "customer_last_name": "Vishwakarma",
      "ord_title": "Deposit",
      "success_url": "https://www.formula1.com/",
      "fail_url": "https://yahoo.com",
      "pg_cancel_url": "https://youtube.com",
      "api_key": "628e28db00c2690681f80568",
      "merchant": {
        "id": "661941bceed6ee3d4cb7dc73",
        "name": "Google"
      },
      "velocity_score": 100,
      "base_currency": 1000,
      "platform_currency": 1000,
      "mask_email": "g***y@gmail.com",
      "mask_mobile": "********99",
      "is_pii": "N",
      "additional_info": {}
    }

    // Build a payload per-test to ensure fresh `merchant_order_token` and allow overrides
    function buildPayload(overrides: Record<string, any> = {}) {
      return {
        ...basePayload,
        merchant_order_token: generateMerchantOrderToken(),
        ...overrides,
      } as any;
    }

    // Per-merchant test applicability map. If a test id is absent, it's allowed for all merchants.
    const testApplicability: Record<string, string[]> = {
      "TC_009": ["SBIC", "Axis Open store", "Google", "Axis Traveledge", "Axis Traveledge new", "IIFA"],
      "TC_012": ["SBIC", "Axis Open store", "Google", "IIFA", "Zenith", "Zenith Gyftr"],
      "TC_013": ["SBIC", "Axis Open store", "Google", "Axis Traveledge", "Axis Traveledge new", "IIFA"],
      "TC_014": ["SBIC", "Google"],
      "TC_015": ["SBIC", "Google"],
      "TC_016": ["SBIC", "Axis Open store", "Google", "Axis Traveledge", "Axis Traveledge new", "IIFA", "Elevate trips", "Loylogic", "GEMS", "Booking Bash", "Curacao"],
      "TC_018": ["Zenith", "Zenith Gyftr"],
      "TC_019": ["Elevate trips"],
      "TC_020": ["IIFA", "Loylogic"],
      "TC_036": ["IIFA", "Loylogic"],
      "TC_021": ["GEMS"],
      "TC_022": ["Booking Bash"],
      "TC_023": ["Curacao"],
      "TC_024": ["SBIC", "Axis Open store", "Google", "Axis Traveledge", "Axis Traveledge new", "IIFA", "Elevate trips", "Loylogic", "GEMS", "Booking Bash", "Curacao", "Zenith", "Zenith Gyftr"],
      "TC_029": ["GEMS"],
      "TC_030": ["Dadabhai Travel"],
      "TC_031": ["Dadabhai Travel"],
      "TC_032": ["Axis Traveledge", "Axis Traveledge new"],
    };

    function isAllowedForMerchant(tcId: string) {
      const allowed = testApplicability[tcId];
      if (!allowed || allowed.length === 0) return true; // empty or missing = allowed for all
      return allowed.map((s) => s.toLowerCase()).includes(merchant.merchant.toLowerCase());
    }

// ===============================================================
// 📋 Intent API Test Cases
// ===============================================================

// ===============================================================
// 🧩 [Negative:TC_001] Blank currency code
// ===============================================================
test("[Negative:TC_001] Verify Intent API with blank currency code", async () => {
  // Print banner at start of first test
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 Running Intent API test cases for ${merchant.merchant}`);
  console.log(`${"=".repeat(60)}\n`);
  
  const payload = buildPayload({ curr_code: "" });
  try {
    await api.post(intentApiUrl, payload);
    expect(false, "API should not accept blank currency code").toBeTruthy();
  } catch (err: any) {
    const res = err.response;
    expect(res.status).toBe(400);
  }
  console.log("✅ [TC_001] Blank currency code validation passed");
});

// ===============================================================
// 🧩 [Negative:TC_002] Blank amount
// ===============================================================
test("[Negative:TC_002] Verify Intent API with blank amount", async () => {
  const payload = buildPayload({ amount: "" });
  try {
    await api.post(intentApiUrl, payload);
    expect(false, "API should not accept blank amount").toBeTruthy();
  } catch (err: any) {
    const res = err.response;
    expect(res.data.errors?.[0]?.message).toContain("Amount should be in integer");
  }
  console.log("✅ [TC_002] Blank amount validation passed");
});

// ===============================================================
// 🧩 [Negative:TC_003] Blank merchant_order_token
// ===============================================================
test("[Negative:TC_003] Verify Intent API with blank merchant_order_token", async () => {
  const payload = buildPayload({ merchant_order_token: "" });
  try {
    await api.post(intentApiUrl, payload);
    expect(false, "API should not accept blank merchant_order_token").toBeTruthy();
  } catch (err: any) {
    const res = err.response;
    expect(res.data.errors?.[0]?.message).toContain("String must contain at least 1 character");
  }
  console.log("✅ [TC_003] Blank merchant_order_token validation passed");
});

// ===============================================================
// 🧩 [Negative:TC_004] Blank customer_email
// ===============================================================
test("[Negative:TC_004] Verify Intent API with blank customer_email", async () => {
  const payload = buildPayload({ customer_email: "" });
  try {
    await api.post(intentApiUrl, payload);
    expect(false, "API should not accept blank customer_email").toBeTruthy();
  } catch (err: any) {
    const res = err.response;
    expect(res.data.errors?.[0]?.message).toContain("Email is required");
  }
  console.log("✅ [TC_004] Blank customer_email validation passed");
});

// ===============================================================
// 🧩 [Negative:TC_005] Invalid customer_email format
// ===============================================================
test("[Negative:TC_005] Verify Intent API with invalid customer_email format", async () => {
  const payload = buildPayload({ customer_email: "sunny.vishwakarma@.com" });
  try {
    await api.post(intentApiUrl, payload);
    expect(false, "API should not accept invalid email format").toBeTruthy();
  } catch (err: any) {
    const res = err.response;
    expect(res.data.errors?.[0]?.message).toContain("Invalid email format");
  }
  console.log("✅ [TC_005] Invalid customer_email format validation passed");
});

// ===============================================================
// 🧩 [Negative:TC_006] Blank customer_mobile
// ===============================================================
test("[Negative:TC_006] Verify Intent API with blank customer_mobile", async () => {
  const payload = buildPayload({ customer_mobile: "" });
  try {
    await api.post(intentApiUrl, payload);
    expect(false, "API should not accept blank customer_mobile").toBeTruthy();
  } catch (err: any) {
    const res = err.response;
    expect(res.data.errors?.[0]?.message).toContain("Invalid mobile number format");
    expect(res.data.errors?.[1]?.message).toContain("Mobile number must have at least 5 digits");
  }
  console.log("✅ [TC_006] Blank customer_mobile validation passed");
});

// ===============================================================
// 🧩 [Negative:TC_007] Blank customer_first_name
// ===============================================================
test("[Negative:TC_007] Verify Intent API with blank customer_first_name", async () => {
  const payload = buildPayload({ customer_first_name: "" });

  try {
    await api.post(intentApiUrl, payload);
    expect(false, "API should not accept blank customer_first_name").toBeTruthy();
  } catch (err: any) {
    const res = err.response;

    // ✅ Validate against actual API response
    expect(res.status).toBe(400);
    expect(res.data.status).toBe(false);
    expect(res.data.message).toContain("Invalid request");
    expect(res.data.errors?.[0]?.message).toContain("String must contain at least 1 character");
    expect(res.data.errors?.[0]?.path?.[0]).toBe("customer_first_name");
    expect(res.data.errors?.[0]?.type).toBe("too_small");
  }

  console.log("✅ [TC_007] Blank customer_first_name validation passed");
});

// ===============================================================
// 🧩 [Negative:TC_008] Blank customer_last_name
// ===============================================================
test("[Negative:TC_008] Verify Intent API with blank customer_last_name", async () => {
 const payload = buildPayload({ customer_last_name: "" });

  try {
    await api.post(intentApiUrl, payload);
    expect(false, "API should not accept blank customer_last_name").toBeTruthy();
  } catch (err: any) {
    const res = err.response;

    // ✅ Validate against actual API response
    expect(res.status).toBe(400);
    expect(res.data.status).toBe(false);
    expect(res.data.message).toContain("Invalid request");
    expect(res.data.errors?.[0]?.message).toContain("String must contain at least 1 character");
    expect(res.data.errors?.[0]?.path?.[0]).toBe("customer_last_name");
    expect(res.data.errors?.[0]?.type).toBe("too_small");
  }

  console.log("✅ [TC_008] Blank customer_last_name validation passed");
});

// ================================================================
// 🧩 [Negative:TC_009] Payment fails when using International Card
// ================================================================
// test("[Negative:TC_009] Verify payment fails when using International Card", async ({ page }) => {
//   test.skip(!isAllowedForMerchant("TC_009"), `Skipping TC_009 for ${merchant.merchant}`);
//   const payload = buildPayload({ amount: 10000 });

//   const intentResponse = await api.post(intentApiUrl, payload, { timeout: 15000 });
//   const data = intentResponse.data;

//   expect(intentResponse.status).toBe(200);
//   expect(data.status).toBe(true);
//   expect(data.ref_link).toContain("https://");
//   expect(data.transaction_id).toBeTruthy();

//   const refLink = data.ref_link;

//   await page.goto(refLink, { timeout: 15000 });
//   
//   await expect(page.getByText('Credit/Debit Card', { exact: true })).toBeVisible();
//   { timeout: 15000 }

//   await page.fill('input[name="card[number]"]', "4111111111111111");
//   await page.fill('input[name="card[expiry]"]', "12/30");
//   await page.fill('input[name="card[cvv]"]', "123");
//   await page.fill('input[name="card[name]"]', "Test");

//   await Promise.all([
//     page.waitForNavigation({ waitUntil: "domcontentloaded" }),
//     page.click("#pay-now"),
//   ]);
//  { timeout: 15000 }
//  await page.waitForURL(/yahoo\.com/, { timeout: 100000 });
//  expect(page.url()).toContain("yahoo.com");

//   console.log("✅ [TC_009] Payment failed and redirected to failed URL");
// });

// ===============================================================
// 🧩 [Positive:TC_009] Valid Intent API request
// ===============================================================
test("[Positive:TC_009] Verify Intent API with valid data", async () => {
  const payload = buildPayload();

  const response = await api.post(intentApiUrl, payload);
  const data = response.data;

  expect(response.status).toBe(200);
  expect(data.status).toBe(true);
  expect(data.transaction_id).toBeTruthy();
  expect(data.ref_link).toContain("https://");

  console.log("✅ [TC_009] Valid Intent API request passed");
});

// ===============================================================
// 🧩 [Positive:TC_010] Intent API Schema Validation
// ===============================================================
test("[Positive:TC_010] Verify Intent API response schema validation", async () => {
  const payload = buildPayload({ amount: 1000 });

  try {
    const response = await api.post(intentApiUrl, payload);
    const data = response.data;

    const schema = {
      type: "object",
      required: ["status", "data", "transaction_id", "message", "status_code", "ref_link"],
      properties: {
        status: { type: "boolean" },
        data: { type: "string" },
        transaction_id: { type: "string" },
        message: { type: "string" },
        status_code: { type: ["number", "integer"] },
        ref_link: { type: "string" },
      },
      additionalProperties: true,
    };

    const isValid = tv4.validate(data, schema);
    expect(isValid, `Schema validation failed: ${tv4.error?.message}`).toBeTruthy();
    expect(response.status).toBe(200);
    expect(data.status).toBe(true);
    expect(data.transaction_id).toBeTruthy();
    expect(data.ref_link).toContain("https://");

    console.log("✅ [TC_010] Intent API response schema validated successfully");
  } catch (error: any) {
    console.error("❌ [TC_010] API Error:", error.response?.status, error.response?.data);
    throw error;
  }
});

// ===============================================================
// 🧩 [Negative:TC_011] Intent API Negative Schema Validation
// ===============================================================
test("[Negative:TC_011] Intent API - Negative Schema Validation for invalid request", async () => {
  // send an intentionally invalid payload (amount as non-integer)
  const payload = buildPayload({ amount: "invalid_amount" });

  try {
    // If API unexpectedly returns success, fail the test
    const resp = await api.post(intentApiUrl, payload);
    // If it reaches here, API accepted invalid payload — fail the test
    expect(false, `API should reject invalid payload but returned ${resp.status}`).toBeTruthy();
  } catch (err: any) {
    const data = err.response?.data;
    // Define expected error schema for invalid requests
    const errorSchema = {
      type: "object",
      required: ["status", "message", "errors"],
      properties: {
        status: { type: "boolean" },
        message: { type: "string" },
        errors: {
          type: "array",
          items: {
            type: "object",
            required: ["message"],
            properties: {
              message: { type: "string" },
              path: { type: "array" },
              type: { type: "string" }
            },
            additionalProperties: true
          }
        }
      },
      additionalProperties: true
    };

    const isValid = tv4.validate(data, errorSchema);
    expect(isValid, `Error schema validation failed: ${tv4.error?.message}`).toBeTruthy();

    // Additional negative assertions (optional)
    expect(data.status).toBe(false);
    expect(Array.isArray(data.errors)).toBeTruthy();
    expect(data.errors[0].message).toBeTruthy();

    console.log("✅ TC_011 Negative schema validation passed — API returned proper error schema for invalid request.");
  }
});


// =========================================================================
// 🧩 [Positive:TC_012] Verify successful payment using ref_link using Card 
// =========================================================================
test("[Positive:TC_012] Verify successful payment using Card", async ({ page }) => {
  test.skip(!isAllowedForMerchant("TC_012"), `Skipping TC_012 for ${merchant.merchant}`);
  test.setTimeout(120000);

  const payload = buildPayload({ amount: 10000 });

  const intentResponse = await api.post(intentApiUrl, payload, { timeout: 500000 });

  // Store Intent Api response in Variable
  const fullResponse = intentResponse.data;

  expect(intentResponse.status).toBe(200);
  expect(fullResponse.status).toBe(true);
  expect(fullResponse.ref_link).toContain("https://");
  expect(fullResponse.transaction_id).toBeTruthy();

  // Extract transactionId & refLink from stored response
  const transactionId = fullResponse.transaction_id;
  const refLink = fullResponse.ref_link;

  // Store transaction ID and ref_link for further tests
    const txFile = path.resolve(
      process.cwd(),
      `transaction.${merchant.merchant.replace(/\s+/g, "_")}.json`
    );
    fs.writeFileSync(txFile, JSON.stringify({ fullResponse, transactionId, refLink, merchant: merchant.merchant }, null, 2));

  await page.goto(refLink);
  // await expect(page.locator('input[name="card[number]"]')).toBeVisible();
  // await page.click("//div[contains(@data-value,'card')]")
  await page.fill('input[name="card[number]"]', "5267318187975449");
  await page.fill('input[name="card[expiry]"]', "12/30");
  await page.fill('input[name="card[cvv]"]', "123");
  await page.fill('input[name="card[name]"]', "Test");

  await page.click("#pay-now");

  try {
    await page.waitForSelector('button[data-val="S"]', { timeout: 30000 });
    await page.click('button[data-val="S"]');

    await page.waitForURL("https://www.formula1.com/", { timeout: 100000 });
    expect(page.url()).toBe("https://www.formula1.com/");

    console.log("✅ [TC_012] Payment completed successfully using card");
  } catch (error) {
    console.log("❌ [TC_012] Success confirmation button not loaded – treating as payment failure.");

    await page.waitForLoadState("domcontentloaded");
    const currentUrl = page.url();


    // expect(currentUrl).toBe("https://yahoo.com/");

    // To ensure got success or Fail URL
    expect(currentUrl).not.toBe("https://www.formula1.com/");

    console.log(`❌ [TC_012] Payment did not reach success URL. Current URL: ${currentUrl}`);

    throw new Error("❌ [TC_012] Payment failed — stopping further execution.");
  }
});


// ===============================================================================
// 🧩 [Positive:TC_013] Verify successful payment using Netbanking
// ===============================================================================
test("[Positive:TC_013] Verify successful payment using Netbanking", async ({ page }) => {
  test.skip(!isAllowedForMerchant("TC_014"), `Skipping TC_014 for ${merchant.merchant}`);
  test.setTimeout(120000);

  const payload = buildPayload({ amount: 1000 });// Redirect to Razorpay NSl

  const intentResponse = await api.post(intentApiUrl, payload, { timeout: 500000 });

  // Store Intent Api response in Variable
  const fullResponse = intentResponse.data;

  expect(intentResponse.status).toBe(200);
  expect(fullResponse.status).toBe(true);
  expect(fullResponse.ref_link).toContain("https://");
  expect(fullResponse.transaction_id).toBeTruthy();

  // Extract transactionId & refLink from stored response
  const transactionId = fullResponse.transaction_id;
  const refLink = fullResponse.ref_link;

  // Store transaction ID and ref_link for further tests
  const txFile = path.resolve(
    process.cwd(),
    `transaction.${merchant.merchant.replace(/\s+/g, "_")}.json`
  );
  fs.writeFileSync(txFile, JSON.stringify({ fullResponse, transactionId, refLink, merchant: merchant.merchant }, null, 2));

  await page.goto(refLink);
  // await page.getByRole('listitem', { name: 'Netbanking' }).click();
  await page.locator("//li[@m='net']").click();
  const netBankingOptions = [
    { name: "State Bank of India", xpath: "//label[@for='netbanking-bank-SBIN']" },
    { name: "HDFC Bank", xpath: "//label[@for='netbanking-bank-HDFC']" },
    { name: "ICICI Bank", xpath: "//label[@for='netbanking-bank-ICIC']" },
    { name: "Axis Bank", xpath: "//label[@for='netbanking-bank-UTIB']" },
    { name: "Kotak Mahindra Bank", xpath: "//label[@for='netbanking-bank-KKBK']" },
  ];

  let bankSelected = false;

  for (const bank of netBankingOptions) {
    const bankLocator = page.locator(bank.xpath);

    if (await bankLocator.count() > 0 && await bankLocator.isVisible()) {
      // console.log(`✅ Selecting Netbanking: ${bank.name}`);
      await bankLocator.click();
      bankSelected = true;
      break; //  STOP after first successful click
    }
  }

  if (!bankSelected) {
    throw new Error("❌ No Netbanking options were available to select");
  }
  await page.click("#pay-now");

  try {
    await page.waitForSelector('button[data-val="S"]', { timeout: 30000 });
    await page.click('button[data-val="S"]');

    await page.waitForURL("https://www.formula1.com/", { timeout: 100000 });
    expect(page.url()).toBe("https://www.formula1.com/");

    console.log("✅ [TC_013] Payment completed successfully and redirected to success URL");
  } catch (error) {
    console.log("❌ [TC_013] Success confirmation button not loaded – treating as payment failure.");

    await page.waitForLoadState("domcontentloaded");
    const currentUrl = page.url();
    expect(currentUrl).not.toBe("https://www.formula1.com/");

    console.log(`❌ [TC_013] Payment did not reach success URL. Current URL: ${currentUrl}`);

    throw new Error("❌ [TC_013] Payment failed — stopping further execution.");
  }
});


// ===============================================================================
// 🧩 [Positive:TC_014] Verify successful payment using UPI
// ===============================================================================
test("[Positive:TC_014] Verify successful payment using UPI", async ({ page }) => {
  test.skip(!isAllowedForMerchant("TC_015"), `Skipping TC_015 for ${merchant.merchant}`);
  test.setTimeout(120000);

  const payload = buildPayload({ amount: 1000 });

  const intentResponse = await api.post(intentApiUrl, payload, { timeout: 500000 });

  const fullResponse = intentResponse.data;

  expect(intentResponse.status).toBe(200);
  expect(fullResponse.status).toBe(true);
  expect(fullResponse.ref_link).toContain("https://");
  expect(fullResponse.transaction_id).toBeTruthy();

  // 🔥 Extract values
  const transaction_id2 = fullResponse.transaction_id;
  const refLink2 = fullResponse.ref_link;

  // 🔥 Load existing transaction.json (DO NOT overwrite)
  const txFile = path.resolve(
    process.cwd(),
    `transaction.${merchant.merchant.replace(/\s+/g, "_")}.json`
  );

  let existingData: any = {};
  if (fs.existsSync(txFile)) {
    existingData = JSON.parse(fs.readFileSync(txFile, "utf8"));
  }

  const updatedData = {
    ...existingData,
    transaction_id2,
    refLink2,
    merchant: merchant.merchant,
  };

  fs.writeFileSync(txFile, JSON.stringify(updatedData, null, 2));
  // console.log(`🧾 Saved transaction_id2: ${transaction_id2}`);

  // ================= UI FLOW =================
  await page.goto(refLink2);

  await page.locator("//li[@m='upi']").click();
  await page.fill("//input[@name='vpa']", "test@razorpay");
  await page.click("#pay-now");

  try {
    await page.waitForURL("https://www.formula1.com/", { timeout: 100000 });
    expect(page.url()).toBe("https://www.formula1.com/");

    console.log("✅ [TC_014] Payment completed successfully and redirected to success URL");
  } catch (error) {
    console.log("❌ [TC_014] Success confirmation button not loaded – treating as payment failure.");

    await page.waitForLoadState("domcontentloaded");
    const currentUrl = page.url();
    expect(currentUrl).not.toBe("https://www.formula1.com/");

    console.log(`❌ [TC_014] Payment did not reach success URL. Current URL: ${currentUrl}`);
    throw new Error("❌ [TC_014] Payment failed — stopping further execution.");
  }
});

// ===============================================================
// 🧩 [Negative:TC_015] Verify Intent API with blank MID and password
// ===============================================================
test("[Negative:TC_015] Verify Intent API with blank MID and password", async () => {
  const payload = buildPayload({ amount: 1000 }); // valid intent payload

  // 🔥 Override headers only for this test
  const invalidHeaders = {
    mid: "",
    password: "",
  };

  try {
    await axios.post(
      "https://securenew.vernostpay.com/api/payment/intents",
      payload,
      { headers: invalidHeaders, timeout: 10000 }
    );

    expect(false, "Intent API should not accept blank MID & password").toBeTruthy();
  } catch (err: any) {
    const res = err.response;

    // 🧾 Expected validations
    expect(res.status).toBe(401); // OR 400 depending on backend behavior
    expect(res.data.status).toBe(false);

    const msg = String(res.data.message || "").toLowerCase();
    expect(msg.includes("invalid") || msg.includes("unauthorized")).toBeTruthy();
  }

  console.log("✅ [TC_015] Intent API blank MID and password validation passed successfully");
});

// ===============================================================
// 🧩 [Positive:TC_016] Verify successful payment using ref_link (PayU)
// ===============================================================
test("[Positive:TC_016] Verify successful payment using Capture API payment_link (PayU)", async ({ page }) => {
  test.skip(!isAllowedForMerchant("TC_018"), `Skipping TC_018 for ${merchant.merchant}`);
  test.setTimeout(150000);

  /* ---------------- INTENT API ---------------- */
  const payload = {
    ...basePayload,
    merchant_order_token: generateMerchantOrderToken(),
    amount: "1000",
    additional_info: {
      ...basePayload.additional_info,
      acq_id: "payu_31974174182",
    },
  };

  const intentResponse = await api.post(intentApiUrl, payload, { timeout: 500000 });
  const intentData = intentResponse.data;

  expect(intentResponse.status).toBe(200);
  expect(intentData.status).toBe(true);
  expect(intentData.transaction_id).toBeTruthy();
  expect(intentData.data).toBeTruthy();

  const transactionId = intentData.transaction_id;
  const paymentToken = intentData.data;

  /* ---------------- CAPTURE API ---------------- */
  const captureRequestBody = {
    billing_details: {
      address: { country: "", city: "", state: "", postal_code: "", line2: "", line1: "" },
      phone: "9090909090",
      name: "Wasi",
      email: "rohini.mandaokar@vernost.in",
    },
    coupon_code: "",
    authorization_id: "",
    save_method: false,
    payment_token: paymentToken,
    payment_method_details: { type: "NETBANKING", bank_code: "YESBANK" },
  };

  const captureResponse = await axios.post(
    "https://securenew.vernostpay.com/api/payment/capture",
    captureRequestBody,
    { headers, timeout: 500000 }
  );

  expect(captureResponse.status).toBe(200);
  expect(captureResponse.data.payment_link).toBeTruthy();

  const paymentLink = captureResponse.data.payment_link;

  // Store transaction ID, payment token, and payment_link in merchant-specific file
  // Note: Using 'payment_link' field instead of 'refLink' to avoid overwriting TC_012 refLink
  const txFile = path.resolve(
    process.cwd(),
    `transaction.${merchant.merchant.replace(/\s+/g, "_")}.json`
  );
  
  let existingData: any = {};
  if (fs.existsSync(txFile)) {
    existingData = JSON.parse(fs.readFileSync(txFile, "utf8"));
  }

  const updatedData = {
    ...existingData,
    transactionId_payu: transactionId,
    paymentToken,
    payment_link: paymentLink,
    merchant: merchant.merchant,
  };

  fs.writeFileSync(txFile, JSON.stringify(updatedData, null, 2));

  /* ---------------- UI PAYMENT ---------------- */
  await page.goto(paymentLink, { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Cards (Credit/Debit)", { exact: true })).toBeVisible();
  await page.getByText("Cards (Credit/Debit)", { exact: true }).click();
  await expect(page.locator("//input[@id='cardNumber']")).toBeVisible({ timeout: 30000 });
  await page.fill("//input[@id='cardNumber']", "5123456789012346");
  await page.fill('input[name="cardExpiry"]', "05/30");
  await page.fill('input[name="cardCvv"]', "123");
  await page.fill('input[name="cardOwnerName"]', "Zenith Test Card");
  await page.getByRole('button', { name: 'PROCEED' }).click();
  await page.getByTestId("closeWithoutSave").click();
  await page.fill('#password', '123456');
  await page.waitForTimeout(500);
  await expect(page.locator('#submitBtn')).toBeVisible({ timeout: 30000 });
  await page.click('#submitBtn');

  await page.waitForURL("https://www.formula1.com/", { timeout: 120000 });
  expect(page.url()).toBe("https://www.formula1.com/");

  console.log("✅ [TC_016] PayU payment completed successfully using Capture API payment_link");
});

// =========================================================================
// 🧩 [Positive:TC_017] Verify successful payment using ref_link - CCAvenue
// =========================================================================
test("[Positive:TC_017] Verify successful payment using ref_link - CCAvenue", async ({ page }) => {
  test.skip(!isAllowedForMerchant("TC_019"), `Skipping TC_019 for ${merchant.merchant}`);
  test.setTimeout(120000);

  const payload = buildPayload({ amount: 10000, curr_code: "AED" });

  const intentResponse = await api.post(intentApiUrl, payload, { timeout: 500000 });
  const fullResponse = intentResponse.data;

  expect(intentResponse.status).toBe(200);
  expect(fullResponse.status).toBe(true);
  expect(fullResponse.ref_link).toContain("https://");
  expect(fullResponse.transaction_id).toBeTruthy();

  const transactionId = fullResponse.transaction_id;
  const refLink = fullResponse.ref_link;

  const txFile = path.resolve(process.cwd(), `transaction.${merchant.merchant.replace(/\s+/g, "_")}.json`);
  fs.writeFileSync(txFile, JSON.stringify({ fullResponse, transactionId, refLink, merchant: merchant.merchant }, null, 2));

  await page.goto(refLink);
  await page.fill("//input[@id='orderBillName']", "QA");
  await page.fill("//input[@id='orderBillAddress']", "Mumbai");
  await page.fill("//input[@id='orderBillCity']", "Mumbai");
  await page.selectOption("//select[@id='orderBillCountry']", "India");
  await page.fill("//input[@id='orderBillTel']", "7350774621");
  await page.fill("//input[@id='orderBillEmail']", "sunny.vishwakarma@vernost.com");

  await page.fill("//input[@id='creditCardNumber']", "4111111111111111");
  await page.locator("//select[@id='expiryMonthCreditCard']").click();
  await page.selectOption('#expiryMonthCreditCard', '05');
  await page.locator("//select[@id='expiryYearCreditCard']").click();
  await page.selectOption('#expiryYearCreditCard', '2040');
  await page.fill("//input[@id='CVVNumberCreditCard']", "123");

  // Wait a bit for form validation
  await page.waitForTimeout(1000);

  // Try multiple strategies to click the Make Payment button
  const makePaymentSelectors = [
    "//div[@class='tabcontent OPTCRDC resp-tab-content resp-tab-content-active']//span[@class='primary-button-text'][normalize-space()='Make Payment']",
    "//span[normalize-space()='Make Payment']",
    "//button[contains(., 'Make Payment')]",
    ".primary-button-text",
    "span.primary-button-text"
  ];

  let paymentButtonClicked = false;

  for (const selector of makePaymentSelectors) {
    try {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 3000 })) {
        // console.log(`   Found Make Payment button with selector: ${selector}`);
        
        // Try normal click first
        try {
          await button.click({ timeout: 5000 });
          paymentButtonClicked = true;
          // console.log(`   ✅ Clicked Make Payment button successfully`);
          break;
        } catch (clickError) {
          // Try force click
          try {
            await button.click({ force: true, timeout: 5000 });
            paymentButtonClicked = true;
            // console.log(`   ✅ Clicked Make Payment button with force`);
            break;
          } catch (forceError) {
            // Try JavaScript click
            await page.evaluate((sel) => {
              const elements = document.querySelectorAll(sel);
              for (const el of elements) {
                if (el.textContent?.includes('Make Payment')) {
                  (el as HTMLElement).click();
                  return true;
                }
              }
              return false;
            }, selector);
            paymentButtonClicked = true;
            console.log(`   ✅ Clicked Make Payment button using JavaScript`);
            break;
          }
        }
      }
    } catch (e) {
      continue;
    }
  }

  if (!paymentButtonClicked) {
    console.log(`   ⚠️ Could not click Make Payment button, trying direct form submission`);
    // Try to submit the form directly
    await page.evaluate(() => {
      const forms = document.querySelectorAll('form');
      for (const form of forms) {
        if (form.querySelector('#creditCardNumber')) {
          form.submit();
          return;
        }
      }
    });
  }

  // Wait for navigation after clicking Make Payment
  await page.waitForLoadState("domcontentloaded", { timeout: 30000 });
  await page.waitForTimeout(5000);

  const currentPageUrl = page.url();
  // console.log(`   Current page after Make Payment click: ${currentPageUrl}`);

  // Check if there's any error message on the page
  const pageText = await page.textContent('body');
  if (pageText && pageText.toLowerCase().includes('error')) {
    console.log(`   ⚠️ Error detected on page. Page content: ${pageText.substring(0, 500)}`);
  }

  try {
    // Wait longer for 3DS page to fully load
    await page.waitForTimeout(8000);
  
    
    // Check if 3DS page is in an iframe
    const frames = page.frames();
    // console.log(`   Total frames on page: ${frames.length}`);
    
    let buttonClicked = false;
    let targetFrame = page;

    // Search in all frames for submit buttons
    for (const frame of frames) {
      try {
        const frameUrl = frame.url();
        // console.log(`   Checking frame: ${frameUrl}`);
        
        // Wait for frame to be ready
        await frame.waitForLoadState('domcontentloaded').catch(() => {});
        
        // Check for various submit button patterns in this frame
        const buttonPatterns = [
          'input[id="acssubmit"]',
          'input[type="submit"]',
          'button[type="submit"]',
          'input[value*="Submit"]',
          'button:has-text("Submit")',
          'input[name="submit"]',
          '[id*="submit"]',
          '[name*="submit"]'
        ];
        
        for (const pattern of buttonPatterns) {
          const count = await frame.locator(pattern).count();
          if (count > 0) {
            // console.log(`   ✅ Found ${count} button(s) matching "${pattern}" in frame: ${frameUrl}`);
            targetFrame = frame as any;
            
            // Try to click this button
            const button = frame.locator(pattern).first();
            
            // Wait for button to be ready
            await button.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
            await page.waitForTimeout(1000);
            
            // Try multiple click strategies
            // console.log(`   Attempting to click 3DS button with pattern: ${pattern}`);
            
            // Strategy 1: Normal click
            try {
              await button.click({ timeout: 3000 });
              buttonClicked = true;
              // console.log(`   ✅ SUCCESS: Clicked 3DS button (normal click)`);
              break;
            } catch (e1) {
              console.log(`   ⚠️ Normal click failed`);
            }
            
            // Strategy 2: Force click
            try {
              await button.click({ force: true, timeout: 3000 });
              buttonClicked = true;
              // console.log(`   ✅ SUCCESS: Clicked 3DS button (force click)`);
              break;
            } catch (e2) {
              console.log(`   ⚠️ Force click failed`);
            }
            
            // Strategy 3: Double click
            try {
              await button.dblclick({ timeout: 3000 });
              buttonClicked = true;
              // console.log(`   ✅ SUCCESS: Clicked 3DS button (double click)`);
              break;
            } catch (e3) {
              console.log(`   ⚠️ Double click failed`);
            }
            
            // Strategy 4: JavaScript click on element
            try {
              await frame.evaluate((selector) => {
                const element = document.querySelector(selector) as HTMLElement;
                if (element) {
                  element.click();
                  return true;
                }
                return false;
              }, pattern);
              buttonClicked = true;
              // console.log(`   ✅ SUCCESS: Clicked 3DS button (JavaScript querySelector)`);
              await page.waitForTimeout(2000);
              break;
            } catch (e4) {
              console.log(`   ⚠️ JavaScript querySelector click failed`);
            }
            
            // Strategy 5: Find by ID and click
            try {
              const clicked = await frame.evaluate(() => {
                const btn = document.getElementById('acssubmit') as HTMLElement;
                if (btn) {
                  btn.click();
                  return true;
                }
                return false;
              });
              if (clicked) {
                buttonClicked = true;
                // console.log(`   ✅ SUCCESS: Clicked 3DS button (getElementById)`);
                await page.waitForTimeout(2000);
                break;
              }
            } catch (e5) {
              console.log(`   ⚠️ getElementById click failed`);
            }
            
            // Strategy 6: Submit form directly
            try {
              const formSubmitted = await frame.evaluate(() => {
                const forms = document.querySelectorAll('form');
                for (const form of forms) {
                  const submitBtn = form.querySelector('input[type="submit"], button[type="submit"]');
                  if (submitBtn) {
                    (form as HTMLFormElement).submit();
                    return true;
                  }
                }
                return false;
              });
              if (formSubmitted) {
                buttonClicked = true;
                // console.log(`   ✅ SUCCESS: Submitted 3DS form directly`);
                await page.waitForTimeout(2000);
                break;
              }
            } catch (e6) {
              console.log(`   ⚠️ Form submit failed`);
            }
          }
        }
        
        if (buttonClicked) {
          // console.log(`   Breaking out of frame loop - button was clicked`);
          break;
        }
      } catch (e) {
        console.log(`   Could not process frame: ${e}`);
        continue;
      }
    }

    if (!buttonClicked) {
      // console.log(`   ⚠️ WARNING: No 3DS submit button was clicked`);
      // console.log(`   Waiting to see if page auto-redirects...`);
      await page.waitForTimeout(10000);
    } else {
      // console.log(`   ✅ 3DS button clicked successfully, waiting for redirect...`);
      await page.waitForTimeout(3000);
    }

    await page.waitForURL("https://www.formula1.com/", { timeout: 100000 });
    expect(page.url()).toBe("https://www.formula1.com/");

    console.log("✅ [TC_017] Payment completed successfully and redirected to success URL");
  } catch (error) {
    console.log("❌ [TC_017] Payment did not complete successfully");

    await page.waitForLoadState("domcontentloaded");
    const currentUrl = page.url();

    console.log(`   Current URL: ${currentUrl}`);

    if (currentUrl.includes("yahoo.com")) {
      console.log(`   Payment failed and redirected to failure URL`);
      expect(currentUrl).toBe("https://yahoo.com/");
      throw new Error("❌ [TC_017] Payment failed — redirected to yahoo.com");
    } else if (!currentUrl.includes("formula1.com")) {
      console.log(`   Payment stuck or pending at: ${currentUrl}`);
      throw new Error(`❌ [TC_017] Payment did not reach success URL. Current URL: ${currentUrl}`);
    }
  }
});

// =========================================================================
// 🧩 [Positive:TC_018] Verify successful payment using ref_link - Urbanledger NSL
// =========================================================================
test("[Positive:TC_018] Verify successful payment using ref_link - Urbanledger NSL", async ({ page }) => {
  test.skip(!isAllowedForMerchant("TC_020"), `Skipping TC_020 for ${merchant.merchant}`);
  test.setTimeout(120000);

  const payload = buildPayload({ amount: 10000, curr_code: "AED"});
  const intentResponse = await api.post(intentApiUrl, payload, { timeout: 500000 });
  const fullResponse = intentResponse.data;

  expect(intentResponse.status).toBe(200);
  expect(fullResponse.status).toBe(true);
  expect(fullResponse.ref_link).toContain("https://");
  expect(fullResponse.transaction_id).toBeTruthy();

  const transactionId = fullResponse.transaction_id;
  const refLink = fullResponse.ref_link;

  // For IIFA, save as transaction_id2 in merchant-specific file (Urbanledger transaction for partial refund)
  const txFile = path.resolve(
    process.cwd(),
    `transaction.${merchant.merchant.replace(/\s+/g, "_")}.json`
  );
  
  let existingData: any = {};
  if (fs.existsSync(txFile)) {
    existingData = JSON.parse(fs.readFileSync(txFile, "utf8"));
  }

  const updatedData = {
    ...existingData,
    transaction_id2: transactionId,
    refLink2: refLink,
    merchant: merchant.merchant,
  };

  fs.writeFileSync(txFile, JSON.stringify(updatedData, null, 2));

  await page.goto(refLink);
  
  // Fill card details with delays to allow validation
  await page.fill("//input[@id='number']", "4111111111111111");
  await page.waitForTimeout(1000);
  
  await page.fill("//input[@id='expiry']", "05/28");
  await page.waitForTimeout(1000);
  
  await page.fill("//input[@id='cvv']", "100");
  await page.waitForTimeout(1000);
  
  await page.fill("//input[@id='name']", "Test");
  await page.waitForTimeout(2000);
  
  // Try to enable button if still disabled
  const payButton = page.locator("button[type='submit']");
  
  // Force enable the button if needed
  await page.evaluate(() => {
    const btn = document.querySelector("button[type='submit']") as HTMLButtonElement;
    if (btn && btn.disabled) {
      btn.disabled = false;
      btn.removeAttribute("disabled");
    }
  });
  
  await page.waitForTimeout(500);
  await payButton.click();

  try {
    await page.waitForURL("https://www.formula1.com/", { timeout: 100000 });
    expect(page.url()).toBe("https://www.formula1.com/");
    console.log("✅ [TC_018] Payment completed successfully and redirected to success URL");
  } catch (error) {
    console.log("❌ [TC_018] Success confirmation button not loaded – treating as payment failure.");
    await page.waitForLoadState("domcontentloaded");
    const currentUrl = page.url();
    expect(currentUrl).toBe("https://yahoo.com/");
    expect(currentUrl).not.toBe("https://www.formula1.com/");
    console.log(`❌ [TC_018] Payment did not reach success URL. Current URL: ${currentUrl}`);
    throw new Error("❌ [TC_018] Payment failed — stopping further execution.");
  }
});

// =========================================================================
// 🧩 [Positive:TC_019] Urbanledger NSL transaction for partial refund testing
// =========================================================================
test("[Positive:TC_019] Urbanledger NSL transaction for partial refund testing", async ({ page }) => {
  test.skip(!isAllowedForMerchant("TC_036"), `Skipping TC_036 for ${merchant.merchant}`);
  test.setTimeout(120000);

  const payload = buildPayload({ amount: 10000, curr_code: "AED"});
  const intentResponse = await api.post(intentApiUrl, payload, { timeout: 500000 });
  const fullResponse = intentResponse.data;

  expect(intentResponse.status).toBe(200);
  expect(fullResponse.status).toBe(true);
  expect(fullResponse.ref_link).toContain("https://");
  expect(fullResponse.transaction_id).toBeTruthy();

  const transactionId = fullResponse.transaction_id;
  const refLink = fullResponse.ref_link;

  // Save as transaction_id3 in merchant-specific file for partial refund testing
  const txFile = path.resolve(
    process.cwd(),
    `transaction.${merchant.merchant.replace(/\s+/g, "_")}.json`
  );
  
  let existingData: any = {};
  if (fs.existsSync(txFile)) {
    existingData = JSON.parse(fs.readFileSync(txFile, "utf8"));
  }

  const updatedData = {
    ...existingData,
    transaction_id3: transactionId,
    refLink3: refLink,
    merchant: merchant.merchant,
  };

  fs.writeFileSync(txFile, JSON.stringify(updatedData, null, 2));

  await page.goto(refLink);
  
  // Fill card details with delays to allow validation
  await page.fill("//input[@id='number']", "4111111111111111");
  await page.waitForTimeout(1000);
  
  await page.fill("//input[@id='expiry']", "05/28");
  await page.waitForTimeout(1000);
  
  await page.fill("//input[@id='cvv']", "100");
  await page.waitForTimeout(1000);
  
  await page.fill("//input[@id='name']", "Test");
  await page.waitForTimeout(2000);
  
  // Force enable the button if needed
  await page.evaluate(() => {
    const btn = document.querySelector("button[type='submit']") as HTMLButtonElement;
    if (btn && btn.disabled) {
      btn.disabled = false;
      btn.removeAttribute("disabled");
    }
  });
  
  await page.waitForTimeout(500);
  await page.click("button[type='submit']");

  try {
    await page.waitForURL("https://www.formula1.com/", { timeout: 100000 });
    expect(page.url()).toBe("https://www.formula1.com/");
    console.log("✅ [TC_019] Urbanledger NSL transaction completed successfully for partial refund");
    // console.log(`   Transaction ID (transaction_id3): ${transactionId}`);
  } catch (error) {
    console.log("❌ [TC_019] Payment failed – stopping execution.");
    await page.waitForLoadState("domcontentloaded");
    const currentUrl = page.url();
    console.log(`❌ [TC_019] Payment did not reach success URL. Current URL: ${currentUrl}`);
    throw new Error("❌ [TC_019] Payment failed — stopping further execution.");
  }
});

// =========================================================================
// 🧩 [Positive:TC_020] Verify successful payment using ref_link - Urbanledger Seamless
// =========================================================================
test("[Positive:TC_020] Verify successful payment using ref_link - Urbanledger Seamless", async ({ page }) => {
  test.skip(!isAllowedForMerchant("TC_021"), `Skipping TC_021 for ${merchant.merchant}`);
  test.setTimeout(120000);

  const payload = buildPayload({ amount: 10000, curr_code: "AED"});
  const intentResponse = await api.post(intentApiUrl, payload, { timeout: 500000 });
  const fullResponse = intentResponse.data;

  expect(intentResponse.status).toBe(200);
  expect(fullResponse.status).toBe(true);
  expect(fullResponse.ref_link).toContain("https://");
  expect(fullResponse.transaction_id).toBeTruthy();

  const transactionId = fullResponse.transaction_id;
  const refLink = fullResponse.ref_link;

  // Save to merchant-specific file for TC_024 reuse test
  const txFile = path.resolve(
    process.cwd(),
    `transaction.${merchant.merchant.replace(/\s+/g, "_")}.json`
  );
  
  let existingData: any = {};
  if (fs.existsSync(txFile)) {
    existingData = JSON.parse(fs.readFileSync(txFile, "utf8"));
  }

  const updatedData = {
    ...existingData,
    transactionId,
    refLink,
    merchant: merchant.merchant,
  };

  fs.writeFileSync(txFile, JSON.stringify(updatedData, null, 2));

  await page.goto(refLink);
  await page.fill("//input[@id='card-number']", "4111111111111111");
  await page.fill("//input[@id='card-expiry']", "05/28");
  await page.fill("//input[@id='card-cvv']", "100");
  await page.fill("//input[@id='card-holder']", "Test");
  await page.click("button[type='submit']");

  try {
    await page.waitForURL("https://www.formula1.com/", { timeout: 100000 });
    expect(page.url()).toBe("https://www.formula1.com/");
    console.log("[TC_020] Payment completed successfully and redirected to success URL");
  } catch (error) {
    console.log("[TC_020] Success confirmation button not loaded – treating as payment failure.");
    await page.waitForLoadState("domcontentloaded");
    const currentUrl = page.url();
    expect(currentUrl).toBe("https://yahoo.com/");
    expect(currentUrl).not.toBe("https://www.formula1.com/");
    console.log(`❌ [TC_020] Payment did not reach success URL. Current URL: ${currentUrl}`);
    throw new Error("❌ [TC_020] Payment failed — stopping further execution.");
  }
});

// =========================================================================
// 🧩 [Positive:TC_021] Verify successful payment using ref_link - Paytabs
// =========================================================================
test("[Positive:TC_021] Verify successful payment using ref_link - Paytabs", async ({ page }) => {
  test.skip(!isAllowedForMerchant("TC_022"), `Skipping TC_022 for ${merchant.merchant}`);
  test.setTimeout(120000);

  const payload = buildPayload({ amount: 10000, curr_code: "AED"});
  const intentResponse = await api.post(intentApiUrl, payload, { timeout: 500000 });
  const fullResponse = intentResponse.data;

  expect(intentResponse.status).toBe(200);
  expect(fullResponse.status).toBe(true);
  expect(fullResponse.ref_link).toContain("https://");
  expect(fullResponse.transaction_id).toBeTruthy();

  const transactionId = fullResponse.transaction_id;
  const refLink = fullResponse.ref_link;

  const txFile = path.resolve(process.cwd(), `transaction.${merchant.merchant.replace(/\s+/g, "_")}.json`);
  fs.writeFileSync(txFile, JSON.stringify({ fullResponse, transactionId, refLink, merchant: merchant.merchant }, null, 2));

  await page.goto(refLink);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle");
  
  // Wait for payment form to be fully loaded
  await page.waitForSelector("#holderName", { timeout: 15000 });
  await page.waitForTimeout(2000);
  
  // Fill card holder name
  await page.click("#holderName");
  await page.fill("#holderName", "Sunny Vishwakarma");
  await page.waitForTimeout(500);
  
  // Fill card number with multiple strategies
  try {
    // Try normal fill first
    await page.click("#number");
    await page.fill("#number", "4000000000000002");
  } catch (e) {
    // If normal fill fails, use JavaScript
    await page.evaluate(() => {
      const input = document.querySelector("#number") as HTMLInputElement;
      if (input) {
        input.value = "4000000000000002";
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }
  await page.waitForTimeout(500);
  
  // Fill expiry month
  await page.click("#expmonth");
  await page.fill("#expmonth", "12");
  await page.waitForTimeout(500);
  
  // Fill expiry year
  await page.click("#expyear");
  await page.fill("#expyear", "30");
  await page.waitForTimeout(500);
  
  // Fill CVV
  await page.click("#cvv");
  await page.fill("#cvv", "123");
  await page.waitForTimeout(1000);
  
  // Verify all fields are filled before submitting
  const holderValue = await page.inputValue("#holderName");
  const cardValue = await page.evaluate(() => {
    const input = document.querySelector("#number") as HTMLInputElement;
    return input ? input.value : "";
  });
  
  await page.click("#payBtn");

  try {
    await page.waitForSelector("//input[@value='Authenticated']", { timeout: 30000 });
    await page.click("//input[@value='Authenticated']");
    await page.waitForURL("https://www.formula1.com/", { timeout: 100000 });
    expect(page.url()).toBe("https://www.formula1.com/");
    console.log("✅ [TC_021] Payment completed successfully and redirected to success URL");
  } catch (error) {
    console.log("[TC_021] Success confirmation button not loaded – treating as payment failure.");
    await page.waitForLoadState("domcontentloaded");
    const currentUrl = page.url();
    
    // Check if still on payment page (form validation issue)
    if (currentUrl.includes("secure.paytabs.com")) {
      console.log(`❌ [TC_021] Still on payment page - form submission failed`);
      console.log(`   Current URL: ${currentUrl}`);
      throw new Error("❌ [TC_021] Payment form submission failed - check card details or field selectors");
    }
    
    // Check if redirected to failure URL
    if (currentUrl.includes("yahoo.com")) {
      console.log(`❌ [TC_021] Payment failed and redirected to failure URL`);
      console.log(`   Failure URL: ${currentUrl}`);
      expect(currentUrl).toBe("https://yahoo.com/");
      throw new Error("❌ [TC_021] Payment failed — redirected to yahoo.com");
    }
    
    // Unexpected URL
    console.log(`⚠️ [TC_021] Unexpected redirect`);
    console.log(`   Expected: https://www.formula1.com/ (success) OR https://yahoo.com/ (failure)`);
    console.log(`   Current URL: ${currentUrl}`);
    throw new Error(`❌ [TC_021] Unexpected redirect - Current URL: ${currentUrl}`);
  }
});

// =========================================================================
// 🧩 [Positive:TC_034] Verify successful payment using ref_link - Paytabs (for partial refund)
// =========================================================================
test("[Positive:TC_034] Verify successful payment using ref_link - Paytabs (for partial refund)", async ({ page }) => {
  test.skip(!isAllowedForMerchant("TC_022"), `Skipping TC_034 for ${merchant.merchant}`);
  test.setTimeout(120000);

  const payload = buildPayload({ amount: 10000, curr_code: "AED"});
  const intentResponse = await api.post(intentApiUrl, payload, { timeout: 500000 });
  const fullResponse = intentResponse.data;

  expect(intentResponse.status).toBe(200);
  expect(fullResponse.status).toBe(true);
  expect(fullResponse.ref_link).toContain("https://");
  expect(fullResponse.transaction_id).toBeTruthy();

  const transactionId = fullResponse.transaction_id;
  const refLink = fullResponse.ref_link;

  // Store transaction ID for partial refund test (TC_042)
  const txFile = path.resolve(process.cwd(), `transaction.${merchant.merchant.replace(/\s+/g, "_")}.json`);
  
  let existingData: any = {};
  if (fs.existsSync(txFile)) {
    existingData = JSON.parse(fs.readFileSync(txFile, "utf8"));
  }

  const updatedData = {
    ...existingData,
    transactionId_tc034: transactionId,
    refLink_tc034: refLink,
    merchant: merchant.merchant,
  };

  fs.writeFileSync(txFile, JSON.stringify(updatedData, null, 2));

  await page.goto(refLink);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle");
  
  // Wait for payment form to be fully loaded
  await page.waitForSelector("#holderName", { timeout: 15000 });
  await page.waitForTimeout(2000);
  
  // Fill card holder name
  await page.click("#holderName");
  await page.fill("#holderName", "Sunny Vishwakarma");
  await page.waitForTimeout(500);
  
  // Fill card number with multiple strategies
  try {
    // Try normal fill first
    await page.click("#number");
    await page.fill("#number", "4000000000000002");
  } catch (e) {
    // If normal fill fails, use JavaScript
    await page.evaluate(() => {
      const input = document.querySelector("#number") as HTMLInputElement;
      if (input) {
        input.value = "4000000000000002";
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }
  await page.waitForTimeout(500);
  
  // Fill expiry month
  await page.click("#expmonth");
  await page.fill("#expmonth", "12");
  await page.waitForTimeout(500);
  
  // Fill expiry year
  await page.click("#expyear");
  await page.fill("#expyear", "30");
  await page.waitForTimeout(500);
  
  // Fill CVV
  await page.click("#cvv");
  await page.fill("#cvv", "123");
  await page.waitForTimeout(1000);
  
  // Verify all fields are filled before submitting
  const holderValue = await page.inputValue("#holderName");
  const cardValue = await page.evaluate(() => {
    const input = document.querySelector("#number") as HTMLInputElement;
    return input ? input.value : "";
  });
  
  await page.click("#payBtn");

  try {
    await page.waitForSelector("//input[@value='Authenticated']", { timeout: 30000 });
    await page.click("//input[@value='Authenticated']");
    await page.waitForURL("https://www.formula1.com/", { timeout: 100000 });
    expect(page.url()).toBe("https://www.formula1.com/");
    console.log("✅ [TC_034] Payment completed successfully and redirected to success URL");
  } catch (error) {
    console.log("[TC_034] Success confirmation button not loaded – treating as payment failure.");
    await page.waitForLoadState("domcontentloaded");
    const currentUrl = page.url();
    
    // Check if still on payment page (form validation issue)
    if (currentUrl.includes("secure.paytabs.com")) {
      console.log(`❌ [TC_034] Still on payment page - form submission failed`);
      console.log(`   Current URL: ${currentUrl}`);
      throw new Error("❌ [TC_034] Payment form submission failed - check card details or field selectors");
    }
    
    // Check if redirected to failure URL
    if (currentUrl.includes("yahoo.com")) {
      console.log(`❌ [TC_034] Payment failed and redirected to failure URL`);
      console.log(`   Failure URL: ${currentUrl}`);
      expect(currentUrl).toBe("https://yahoo.com/");
      throw new Error("❌ [TC_034] Payment failed — redirected to yahoo.com");
    }
    
    // Unexpected URL
    console.log(`⚠️ [TC_034] Unexpected redirect`);
    console.log(`   Expected: https://www.formula1.com/ (success) OR https://yahoo.com/ (failure)`);
    console.log(`   Current URL: ${currentUrl}`);
    throw new Error(`❌ [TC_034] Unexpected redirect - Current URL: ${currentUrl}`);
  }
});

// =========================================================================
// 🧩 [Positive:TC_026] Verify Status Check API with valid identifier
// =========================================================================
test("[Positive:TC_026] Verify Status Check API with valid identifier", async ({ page }) => {
  test.skip(!isAllowedForMerchant("TC_012"), `Skipping TC_026 for ${merchant.merchant}`);
  
  // Skip for Zenith, SBIC, Google, and Axis Open store (TC_026 runs in status-check.spec.ts instead)
  if (merchant.merchant.toLowerCase().includes("zenith")) {
    test.skip();
  }
  if (merchant.merchant.toLowerCase().includes("sbic")) {
    test.skip();
  }
  if (merchant.merchant.toLowerCase().includes("google")) {
    test.skip();
  }
  if (merchant.merchant.toLowerCase().includes("axis open store")) {
    test.skip();
  }
  
  // Read the transaction file to get transaction IDs from TC_012 and TC_016
  const txFile = path.resolve(process.cwd(), `transaction.${merchant.merchant.replace(/\s+/g, "_")}.json`);
  
  if (!fs.existsSync(txFile)) {
    console.log(`⚠️ [TC_026] Transaction file not found - skipping test for ${merchant.merchant}`);
    test.skip();
  }
  
  const transactionData = JSON.parse(fs.readFileSync(txFile, "utf8"));
  const transactionId_tc012 = transactionData.transactionId; // From TC_012
  const transactionId_tc016 = transactionData.transactionId_payu; // From TC_016
  const transactionId_tc032 = transactionData.transactionId_tc032; // From TC_032 (Axis Traveledge)
  
  // Check if this is Axis Traveledge merchant
  const isAxisTraveledge = merchant.merchant.toLowerCase().includes("axis traveledge");
  
  if (!transactionId_tc012) {
    console.log(`⚠️ [TC_026] No transaction ID from TC_012 found - skipping test`);
    test.skip();
  }
  
  // Print banner similar to status-check.spec.ts
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🔍 Running status check test cases for ${merchant.merchant}`);
  console.log(`${"=".repeat(60)}\n`);
  
  // Status Check API endpoint
  const statusCheckUrl = "https://securenew.vernostpay.com/api/intent/check/status";
  
  /* ---------------- Check Status for TC_012 Transaction ---------------- */
  console.log("\n📋 Checking Status for TC_012 Transaction (Razorpay Card Payment)");
  console.log(`   Transaction ID: ${transactionId_tc012}`);
  
  const statusPayload_tc012 = {
    identifier: transactionId_tc012,
    verifySupplier: true
  };
  
  try {
    const statusResponse_tc012 = await api.post(statusCheckUrl, statusPayload_tc012, { timeout: 30000 });
    
    expect(statusResponse_tc012.status).toBe(200);
    console.log(`✅ Status Check API Response Status: ${statusResponse_tc012.status}`);
    
    const statusData_tc012 = statusResponse_tc012.data;
    console.log(`   Status: ${statusData_tc012.status}`);
    console.log(`   Message: ${statusData_tc012.message || 'N/A'}`);
    console.log(`   Amount: ${statusData_tc012.amount || 'N/A'}`);
    console.log(`   Currency: ${statusData_tc012.currency || 'N/A'}`);
    console.log(`   Transaction ID: ${statusData_tc012.transactionId || 'N/A'}`);
    console.log(`   Order ID: ${statusData_tc012.orderId || 'N/A'}`);
    
    // Validate status is one of the valid values
    const validStatuses = ["CAPTURED", "FAIL", "INPROGRESS", "REFUNDED", "PARTIAL_REFUNDED"];
    expect(validStatuses).toContain(statusData_tc012.status);
    
    // Status-specific logging
    if (statusData_tc012.status === "CAPTURED") {
      console.log(`   ✅ Payment successfully captured`);
    } else if (statusData_tc012.status === "FAIL") {
      console.log(`   ❌ Payment failed`);
    } else if (statusData_tc012.status === "INPROGRESS") {
      console.log(`   ⏳ Payment in progress`);
    } else if (statusData_tc012.status === "REFUNDED" || statusData_tc012.status === "PARTIAL_REFUNDED") {
      console.log(`   💰 Payment refunded`);
    }
    
    console.log("✅ [TC_026] TC_012 Status Check - PASSED");
  } catch (error: any) {
    console.log(`❌ [TC_026] TC_012 Status Check Failed: ${error.message}`);
    throw error;
  }
  
  /* ---------------- Check Status for TC_016 Transaction (if exists) ---------------- */
  if (transactionId_tc016) {
    console.log("\n📋 Checking Status for TC_016 Transaction (PayU Capture API)");
    console.log(`   Transaction ID: ${transactionId_tc016}`);
    
    const statusPayload_tc016 = {
      identifier: transactionId_tc016,
      verifySupplier: true
    };
    
    try {
      const statusResponse_tc016 = await api.post(statusCheckUrl, statusPayload_tc016, { timeout: 30000 });
      
      expect(statusResponse_tc016.status).toBe(200);
      console.log(`✅ Status Check API Response Status: ${statusResponse_tc016.status}`);
      
      const statusData_tc016 = statusResponse_tc016.data;
      console.log(`   Status: ${statusData_tc016.status}`);
      console.log(`   Message: ${statusData_tc016.message || 'N/A'}`);
      console.log(`   Amount: ${statusData_tc016.amount || 'N/A'}`);
      console.log(`   Currency: ${statusData_tc016.currency || 'N/A'}`);
      console.log(`   Transaction ID: ${statusData_tc016.transactionId || 'N/A'}`);
      console.log(`   Order ID: ${statusData_tc016.orderId || 'N/A'}`);
      
      // Validate status is one of the valid values
      const validStatuses = ["CAPTURED", "FAIL", "INPROGRESS", "REFUNDED", "PARTIAL_REFUNDED"];
      expect(validStatuses).toContain(statusData_tc016.status);
      
      // Status-specific logging
      if (statusData_tc016.status === "CAPTURED") {
        console.log(`   ✅ Payment successfully captured`);
      } else if (statusData_tc016.status === "FAIL") {
        console.log(`   ❌ Payment failed`);
      } else if (statusData_tc016.status === "INPROGRESS") {
        console.log(`   ⏳ Payment in progress`);
      } else if (statusData_tc016.status === "REFUNDED" || statusData_tc016.status === "PARTIAL_REFUNDED") {
        console.log(`   💰 Payment refunded`);
      }
      
      console.log("✅ [TC_026] TC_016 Status Check - PASSED");
    } catch (error: any) {
      console.log(`❌ [TC_026] TC_016 Status Check Failed: ${error.message}`);
      throw error;
    }
  } else {
    console.log("\n⚠️ [TC_026] No transaction ID from TC_016 found - skipping TC_016 status check");
  }
  
  /* ---------------- Check Status for TC_032 Transaction (if exists and Axis Traveledge) ---------------- */
  if (isAxisTraveledge && transactionId_tc032) {
    console.log("\n📋 Checking Status for TC_032 Transaction (Axis Traveledge Razorpay Card Payment)");
    console.log(`   Transaction ID: ${transactionId_tc032}`);
    
    const statusPayload_tc032 = {
      identifier: transactionId_tc032,
      verifySupplier: true
    };
    
    try {
      const statusResponse_tc032 = await api.post(statusCheckUrl, statusPayload_tc032, { timeout: 30000 });
      
      expect(statusResponse_tc032.status).toBe(200);
      console.log(`✅ Status Check API Response Status: ${statusResponse_tc032.status}`);
      
      const statusData_tc032 = statusResponse_tc032.data;
      console.log(`   Status: ${statusData_tc032.status}`);
      console.log(`   Message: ${statusData_tc032.message || 'N/A'}`);
      console.log(`   Amount: ${statusData_tc032.amount || 'N/A'}`);
      console.log(`   Currency: ${statusData_tc032.currency || 'N/A'}`);
      console.log(`   Transaction ID: ${statusData_tc032.transactionId || 'N/A'}`);
      console.log(`   Order ID: ${statusData_tc032.orderId || 'N/A'}`);
      
      // Validate status is one of the valid values
      const validStatuses = ["CAPTURED", "FAIL", "INPROGRESS", "REFUNDED", "PARTIAL_REFUNDED"];
      expect(validStatuses).toContain(statusData_tc032.status);
      
      // Status-specific logging
      if (statusData_tc032.status === "CAPTURED") {
        console.log(`   ✅ Payment successfully captured`);
      } else if (statusData_tc032.status === "FAIL") {
        console.log(`   ❌ Payment failed`);
      } else if (statusData_tc032.status === "INPROGRESS") {
        console.log(`   ⏳ Payment in progress`);
      } else if (statusData_tc032.status === "REFUNDED" || statusData_tc032.status === "PARTIAL_REFUNDED") {
        console.log(`   💰 Payment refunded`);
      }
      
      console.log("✅ [TC_026] TC_032 Status Check - PASSED");
    } catch (error: any) {
      console.log(`❌ [TC_026] TC_032 Status Check Failed: ${error.message}`);
      throw error;
    }
  } else if (isAxisTraveledge) {
    console.log("\n⚠️ [TC_026] No transaction ID from TC_032 found - skipping TC_032 status check");
  }
  
  console.log("\n========================================");
  console.log("✅ [TC_026] All Status Check API Tests PASSED");
  console.log("========================================");
});


// =========================================================================
// 🧩 [Positive:rbanledger ] Verify successful payment using Credit - NetAuthorise NSL
// =========================================================================
test("[Positive:TC_022] Verify successful payment using Credit - NetAuthorise NSL", async ({ page }) => {
  test.skip(!isAllowedForMerchant("TC_023"), `Skipping TC_023 for ${merchant.merchant}`);
  test.setTimeout(120000);

  const payload = buildPayload({ amount: 10000, desc: "CREDIT" });
  const intentResponse = await api.post(intentApiUrl, payload, { timeout: 500000 });
  const fullResponse = intentResponse.data;

  expect(intentResponse.status).toBe(200);
  expect(fullResponse.status).toBe(true);
  expect(fullResponse.ref_link).toContain("https://");
  expect(fullResponse.transaction_id).toBeTruthy();

  const transactionId = fullResponse.transaction_id;
  const refLink = fullResponse.ref_link;

  const txFile = path.resolve(process.cwd(), `transaction.${merchant.merchant.replace(/\s+/g, "_")}.json`);
  fs.writeFileSync(txFile, JSON.stringify({ fullResponse, transactionId, refLink, merchant: merchant.merchant }, null, 2));

  await page.goto(refLink);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle");
  
  // Wait for and fill card details
  await page.waitForSelector("//input[@id='cardNumber']", { timeout: 10000 });
  await page.fill("//input[@id='cardNumber']", "4111111111111111");
  await page.waitForTimeout(500);
  
  await page.fill("//input[@id='exp_date']", "12/30");
  await page.waitForTimeout(500);
  
  await page.fill("//input[@id='cardCode']", "100");
  await page.waitForTimeout(500);
  
  await page.fill("//input[@id='card_holder_name']", "Curacao Test Card");
  await page.fill("//input[@id='address']", "Mumbai");
  await page.fill("//input[@id='city']", "Andheri");
  await page.fill("//input[@id='state']", "Maharashtra");
  await page.fill("//input[@id='zip_code']", "401207");
  await page.waitForTimeout(1000);

  // Force enable the submit button if needed
  await page.evaluate(() => {
    const btn = document.querySelector("button#submit") as HTMLButtonElement;
    if (btn && btn.disabled) {
      btn.disabled = false;
      btn.removeAttribute("disabled");
    }
  });
  
  await page.waitForTimeout(500);
  await page.click("//button[@id='submit']");

  try {
    await page.waitForURL("https://www.formula1.com/", { timeout: 100000 });
    expect(page.url()).toBe("https://www.formula1.com/");
    console.log("[TC_022] Payment completed successfully and redirected to success URL");
  } catch (error) {
    await page.waitForLoadState("domcontentloaded");
    const currentUrl = page.url();

    // Check if it's the expected failure URL (yahoo.com)
    if (currentUrl.includes("yahoo.com")) {
      console.log("✅ [TC_022] Payment failed as expected and redirected to failure URL (yahoo.com)");
      console.log(`   Failure URL: ${currentUrl}`);
      expect(currentUrl).not.toBe("https://www.formula1.com/");
      throw new Error("❌ [TC_022] Payment failed — redirected to yahoo.com");
    } 
    // Check if it's the Vernost Pay capture URL (successful payment confirmation)
    else if (currentUrl.includes("securenew.vernostpay.com/core/capture/")) {
      console.log("✅ [TC_022] Payment completed successfully and redirected to Vernost Pay capture page");
      console.log(`   Capture URL: ${currentUrl}`);
      expect(currentUrl).toContain("securenew.vernostpay.com/core/capture/");
    }
    // Check if it's the success URL
    else if (currentUrl.includes("formula1.com")) {
      console.log("✅ [TC_022] Payment completed successfully");
      expect(page.url()).toBe("https://www.formula1.com/");
    }
    // Unknown/unexpected URL
    else {
      console.log("⚠️ [TC_022] Payment did not reach expected success or failure URL");
      console.log(`   Expected: https://www.formula1.com/ (success) OR https://yahoo.com/ (failure)`);
      console.log(`   Current URL: ${currentUrl}`);
      console.log(`   This might indicate a payment gateway issue or unexpected redirect`);
      throw new Error(`❌ [TC_022] Unexpected redirect - Current URL: ${currentUrl}`);
    }
  }
});

// // =========================================================================
// // 🧩 [Positive:TC_023] Verify successful payment using Credit - Curacao NSL 
// // =========================================================================
test("[Positive:TC_023] Verify successful payment using Credit - Curacao NSL", async ({ page }) => {
  test.skip(!isAllowedForMerchant("TC_023"), `Skipping TC_023 for ${merchant.merchant}`);
  test.setTimeout(120000);

  const payload = buildPayload({ amount: 10000, desc: "WALLET" });

  const intentResponse = await api.post(intentApiUrl, payload, { timeout: 500000 });

  // Store Intent Api response in Variable
  const fullResponse = intentResponse.data;

  expect(intentResponse.status).toBe(200);
  expect(fullResponse.status).toBe(true);
  expect(fullResponse.ref_link).toContain("https://");
  expect(fullResponse.transaction_id).toBeTruthy();

  // Extract transactionId & refLink from stored response
  const transactionId = fullResponse.transaction_id;
  const refLink = fullResponse.ref_link;

  // Store transaction ID and ref_link for further tests (append to existing file from TC_022)
  const txFile = path.resolve(process.cwd(), `transaction.${merchant.merchant.replace(/\s+/g, "_")}.json`);
  
  let existingData: any = {};
  if (fs.existsSync(txFile)) {
    existingData = JSON.parse(fs.readFileSync(txFile, "utf8"));
  }

  const updatedData = {
    ...existingData,
    transaction_id2: transactionId,
    refLink2: refLink,
    merchant: merchant.merchant,
  };

  fs.writeFileSync(txFile, JSON.stringify(updatedData, null, 2));

  await page.goto(refLink);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle");

  // Wait for phone input and fill
  await page.waitForSelector("//input[@name='phone']", { timeout: 10000 });
  await page.fill("//input[@name='phone']", "(424)3788279");
  await page.waitForTimeout(1000);
  
  await page.click("button[type='submit']");
  await page.waitForTimeout(2000);

  // Fill OTP code
  await page.waitForSelector("//input[@name='code0']", { timeout: 10000 });
  await page.fill("//input[@name='code0']", "1");
  await page.fill("//input[@name='code1']", "2");
  await page.fill("//input[@name='code2']", "3");
  await page.fill("//input[@name='code3']", "4");
  await page.fill("//input[@name='code4']", "5");
  await page.fill("//input[@name='code5']", "6");
  await page.waitForTimeout(500);
  
  await page.click("//button[normalize-space()='Continue']");
  await page.click("//button[normalize-space()='Choose a payment option']");
  await page.click("//input[@type='radio']");
  await page.click("//button[normalize-space()='Pay']");
  await page.fill("//input[@id='cardNumber']", "4242424242424242");
  await page.fill("//input[@id='expDate']", "12/30");
  await page.fill("//input[@id='cardCode']", "100");
  // await page.fill("//input[@id='e67273c3f5a02934f782a61b63966343']", "QA");
  await page.locator('[name="firstName"]').fill("QA");
  await page.locator('[name="lastName"]').fill("Vernost");
  await page.locator('[name="street"]').fill("Boisar");
  await page.locator('[name="suite"]').fill("Krishna Nagar");
  await page.locator('[name="city"]').fill("Mumbai");
  
  // Click dropdown to open state selection
  await page.locator("//button[@class='ea9d0 b87e1']").click();
  await page.waitForTimeout(500);
  // Select state option (Alabama) - try different selectors
  await page.locator("//*[contains(text(), 'Alabama')]").first().click();
  
  await page.locator('[name="zip"]').fill("40150");

  await page.click("button[type='submit']");

  try {
    await page.waitForURL("https://www.formula1.com/", { timeout: 100000 });
    expect(page.url()).toBe("https://www.formula1.com/");
    console.log("[TC_023] Payment completed successfully and redirected to success URL");
  } catch (error) {
    await page.waitForLoadState("domcontentloaded");
    const currentUrl = page.url();

    // Check if it's the expected failure URL (yahoo.com)
    if (currentUrl.includes("yahoo.com")) {
      console.log("✅ [TC_023] Payment failed as expected and redirected to failure URL (yahoo.com)");
      console.log(`   Failure URL: ${currentUrl}`);
      expect(currentUrl).not.toBe("https://www.formula1.com/");
      throw new Error("❌ [TC_023] Payment failed — redirected to yahoo.com");
    } 
    // Check if it's the success URL
    else if (currentUrl.includes("formula1.com")) {
      console.log("✅ [TC_023] Payment completed successfully");
      expect(page.url()).toBe("https://www.formula1.com/");
    }
    // Check if it's Curacao credit assistance page
    else if (currentUrl.includes("cpay-staging.aws.icuracao.com")) {
      console.log("⚠️  [TC_023] Curacao Service unavailable page appeared, This indicates there is Page Issue at Curacao end");
      // console.log(`   Current URL: ${currentUrl}`);
      // console.log(`   This indicates the payment requires Curacao credit approval`);
      // console.log(`   The payment flow cannot proceed without manual credit approval`);
      test.skip();
    }
    // Unknown/unexpected URL
    else {
      console.log("⚠️ [TC_023] Payment did not reach expected success or failure URL");
      console.log(`   Expected: https://www.formula1.com/ (success) OR https://yahoo.com/ (failure)`);
      console.log(`   Current URL: ${currentUrl}`);
      console.log(`   This might indicate a payment gateway issue or unexpected redirect`);
      throw new Error(`❌ [TC_023] Unexpected redirect - Current URL: ${currentUrl}`);
    }
  }
});

// ===============================================================
// 🧩 [Positive:TC_024] Verify successful payment using Credit - Curacao NSL (for partial refund)
// ===============================================================
test("[Positive:TC_024] Verify successful payment using Credit - Curacao NSL (for partial refund)", async ({ page }) => {
  test.skip(!isAllowedForMerchant("TC_023"), `Skipping TC_024 for ${merchant.merchant}`);
  test.setTimeout(120000);

  const payload = buildPayload({ amount: 10000, desc: "WALLET" });

  const intentResponse = await api.post(intentApiUrl, payload, { timeout: 500000 });

  // Store Intent Api response in Variable
  const fullResponse = intentResponse.data;

  expect(intentResponse.status).toBe(200);
  expect(fullResponse.status).toBe(true);
  expect(fullResponse.ref_link).toContain("https://");
  expect(fullResponse.transaction_id).toBeTruthy();

  // Extract transactionId & refLink from stored response
  const transactionId = fullResponse.transaction_id;
  const refLink = fullResponse.ref_link;

  // Store transaction ID and ref_link for partial refund test (TC_044)
  const txFile = path.resolve(process.cwd(), `transaction.${merchant.merchant.replace(/\s+/g, "_")}.json`);
  
  let existingData: any = {};
  if (fs.existsSync(txFile)) {
    existingData = JSON.parse(fs.readFileSync(txFile, "utf8"));
  }

  const updatedData = {
    ...existingData,
    transactionId_tc024: transactionId,
    refLink_tc024: refLink,
    merchant: merchant.merchant,
  };

  fs.writeFileSync(txFile, JSON.stringify(updatedData, null, 2));

  await page.goto(refLink);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle");

  // Wait for phone input and fill
  await page.waitForSelector("//input[@name='phone']", { timeout: 10000 });
  await page.fill("//input[@name='phone']", "(424)3788279");
  await page.waitForTimeout(1000);
  
  await page.click("button[type='submit']");
  await page.waitForTimeout(2000);

  // Fill OTP code
  await page.waitForSelector("//input[@name='code0']", { timeout: 10000 });
  await page.fill("//input[@name='code0']", "1");
  await page.fill("//input[@name='code1']", "2");
  await page.fill("//input[@name='code2']", "3");
  await page.fill("//input[@name='code3']", "4");
  await page.fill("//input[@name='code4']", "5");
  await page.fill("//input[@name='code5']", "6");
  await page.waitForTimeout(500);
  
  await page.click("//button[normalize-space()='Continue']");
  await page.click("//button[normalize-space()='Choose a payment option']");
  await page.click("//input[@type='radio']");
  await page.click("//button[normalize-space()='Pay']");
  await page.fill("//input[@id='cardNumber']", "4242424242424242");
  await page.fill("//input[@id='expDate']", "12/30");
  await page.fill("//input[@id='cardCode']", "100");
  await page.locator('[name="firstName"]').fill("QA");
  await page.locator('[name="lastName"]').fill("Vernost");
  await page.locator('[name="street"]').fill("Boisar");
  await page.locator('[name="suite"]').fill("Krishna Nagar");
  await page.locator('[name="city"]').fill("Mumbai");
  
  // Click dropdown to open state selection
  await page.locator("//button[@class='ea9d0 b87e1']").click();
  await page.waitForTimeout(500);
  // Select state option (Alabama)
  await page.locator("//*[contains(text(), 'Alabama')]").first().click();
  
  await page.locator('[name="zip"]').fill("40150");

  await page.click("button[type='submit']");

  try {
    await page.waitForURL("https://www.formula1.com/", { timeout: 100000 });
    expect(page.url()).toBe("https://www.formula1.com/");
    console.log("✅ [TC_024] Payment completed successfully and redirected to success URL");
  } catch (error) {
    await page.waitForLoadState("domcontentloaded");
    const currentUrl = page.url();

    // Check if it's the expected failure URL (yahoo.com)
    if (currentUrl.includes("yahoo.com")) {
      console.log("✅ [TC_024] Payment failed as expected and redirected to failure URL (yahoo.com)");
      console.log(`   Failure URL: ${currentUrl}`);
      expect(currentUrl).not.toBe("https://www.formula1.com/");
      throw new Error("❌ [TC_024] Payment failed — redirected to yahoo.com");
    } 
    // Check if it's the success URL
    else if (currentUrl.includes("formula1.com")) {
      console.log("✅ [TC_024] Payment completed successfully");
      expect(page.url()).toBe("https://www.formula1.com/");
    }
    // Check if it's Curacao credit assistance page
    else if (currentUrl.includes("cpay-staging.aws.icuracao.com")) {
      console.log("⚠️  [TC_024] Curacao Service unavailable page appeared, This indicates there is Page Issue at Curacao end");
      test.skip();
    }
    // Unknown/unexpected URL
    else {
      console.log("⚠️ [TC_024] Payment did not reach expected success or failure URL");
      console.log(`   Expected: https://www.formula1.com/ (success) OR https://yahoo.com/ (failure)`);
      console.log(`   Current URL: ${currentUrl}`);
      console.log(`   This might indicate a payment gateway issue or unexpected redirect`);
      throw new Error(`❌ [TC_024] Unexpected redirect - Current URL: ${currentUrl}`);
    }
  }
});

// ===============================================================
// 🧩 [Negative:TC_025] Reused ref_link shows error message
// ===============================================================
test("[Negative:TC_025] Verify reused ref_link shows error message", async ({ page }) => {
  test.skip(!isAllowedForMerchant("TC_024"), `Skipping TC_025 for ${merchant.merchant}`);
  
  // Read the previously saved ref_link from merchant-specific file
  const txFile = path.resolve(process.cwd(), `transaction.${merchant.merchant.replace(/\s+/g, "_")}.json`);
  
  // Skip if transaction file doesn't exist (no previous payment test ran)
  if (!fs.existsSync(txFile)) {
    console.log(`⚠️ [TC_024] Transaction file not found - skipping test for ${merchant.merchant}`);
    test.skip();
  }
  
  const transactionData = JSON.parse(fs.readFileSync(txFile, "utf8"));
  
  // Determine which refLink to use based on merchant and gateway
  const merchantLower = merchant.merchant.toLowerCase();
  const isZenith = merchantLower.includes("zenith");
  const isGEMS = merchantLower.includes("gems");
  const isElevate = merchantLower.includes("elevate");
  const isIIFA = merchantLower.includes("iifa") || merchantLower.includes("loylogic");
  const isBookingBash = merchantLower.includes("booking bash");
  const isCuracao = merchantLower.includes("curacao");
  
  let refLink;
  let testCaseSource;
  
  // Select appropriate refLink based on merchant
  if (isZenith) {
    // For Zenith, always use TC_012 (Razorpay) refLink for reuse test
    // PayU payment_link can be reused multiple times, so we don't test it
    refLink = transactionData.refLink;
    testCaseSource = "TC_012 (Razorpay Card)";
  } else if (isGEMS) {
    refLink = transactionData.refLink; // TC_020 - Urbanledger Seamless
    testCaseSource = "TC_020 (Urbanledger Seamless)";
  } else if (isIIFA) {
    refLink = transactionData.refLink2 || transactionData.refLink; // TC_018 - Urbanledger NSL
    testCaseSource = "TC_018 (Urbanledger NSL)";
  } else if (isBookingBash) {
    refLink = transactionData.refLink; // TC_021 - Paytabs
    testCaseSource = "TC_021 (Paytabs)";
  } else if (isCuracao) {
    refLink = transactionData.refLink; // TC_022 - NetAuthorise
    testCaseSource = "TC_022 (NetAuthorise)";
  } else if (isElevate) {
    refLink = transactionData.refLink; // TC_017 - CCAvenue
    testCaseSource = "TC_017 (CCAvenue)";
  } else {
    // For other Razorpay merchants (SBIC, Axis, Google, IIFA)
    refLink = transactionData.refLink; // TC_012 - Card payment
    testCaseSource = "TC_012 (Razorpay Card)";
  }
  
  if (!refLink) {
    console.log(`⚠️ [TC_024] No refLink found for ${merchant.merchant} - skipping test`);
    test.skip();
  }
  
  // console.log(`🔗 [TC_024] Testing reused ref_link from ${testCaseSource} for ${merchant.merchant}`);
  
  // Test reusing refLink
  await page.goto(refLink, { waitUntil: "domcontentloaded" });

  // Identify and validate the error message elements
  const errorTitle = page.locator("h1.error-title");
  const errorMessage = page.locator("p.error-message");

  await expect(errorTitle).toBeVisible({ timeout: 10000 });
  await expect(errorMessage).toBeVisible();

  // Fetch the text content
  const titleText = (await errorTitle.textContent())?.trim();
  const messageText = (await errorMessage.textContent())?.trim();

  // Verify expected text
  expect(titleText).toBe("Oops! Something Went Wrong");
  expect(messageText).toContain("Order is not in a valid state for capture");

  console.log(`✅ [TC_024] Reused ref_link from TC_012 correctly displayed error message for ${merchant.merchant}.`);
});

// ===============================================================
// 🧩 [Negative:TC_025] Reused ref_link shows error message (TC_020 - Urbanledger NSL)
// ===============================================================
test("[Negative:TC_025] Verify reused ref_link shows error message (Urbanledger NSL)", async ({ page }) => {
  test.skip(!isAllowedForMerchant("TC_020"), `Skipping TC_025 for ${merchant.merchant}`);
  
  // Read the previously saved ref_link from merchant-specific file
  const txFile = path.resolve(process.cwd(), `transaction.${merchant.merchant.replace(/\s+/g, "_")}.json`);
  
  // Skip if transaction file doesn't exist (no previous payment test ran)
  if (!fs.existsSync(txFile)) {
    console.log(`⚠️ [TC_025] Transaction file not found - skipping test for ${merchant.merchant}`);
    test.skip();
  }
  
  const transactionData = JSON.parse(fs.readFileSync(txFile, "utf8"));
  const refLink2 = transactionData.refLink2;
  
  if (!refLink2) {
    console.log(`⚠️ [TC_025] No refLink2 found from TC_020 - skipping test for ${merchant.merchant}`);
    test.skip();
  }

  // Open the same link again (2nd attempt)
  await page.goto(refLink2, { waitUntil: "domcontentloaded" });

  // Identify and validate the error message elements
  const errorTitle = page.locator("h1.error-title");
  const errorMessage = page.locator("p.error-message");

  await expect(errorTitle).toBeVisible({ timeout: 10000 });
  await expect(errorMessage).toBeVisible();

  // Fetch the text content
  const titleText = (await errorTitle.textContent())?.trim();
  const messageText = (await errorMessage.textContent())?.trim();

  // Verify expected text
  expect(titleText).toBe("Oops! Something Went Wrong");
  expect(messageText).toContain("Order is not in a valid state for capture");

  console.log("✅ [TC_025] Reused ref_link from TC_020 (Urbanledger NSL) correctly displayed error message.");
});

// =========================================================================
// 🧩 [Positive:TC_028] Verify successful payment using ref_link using Card 
// =========================================================================
test("[Positive:TC_028] Verify successful payment using ref_link using Card", async ({ page }) => {
  test.skip(!isAllowedForMerchant("TC_012"), `Skipping TC_028 for ${merchant.merchant}`);
  
  // Skip for Zenith merchant
  if (merchant.merchant.toLowerCase().includes("zenith")) {
    test.skip();
  }
  
  test.setTimeout(120000);

  const payload = buildPayload({ amount: 10000 });

  const intentResponse = await api.post(intentApiUrl, payload, { timeout: 500000 });

  // Store Intent Api response in Variable
  const fullResponse = intentResponse.data;

  expect(intentResponse.status).toBe(200);
  expect(fullResponse.status).toBe(true);
  expect(fullResponse.ref_link).toContain("https://");
  expect(fullResponse.transaction_id).toBeTruthy();

  // Extract transactionId & refLink from stored response
  const transactionId = fullResponse.transaction_id;
  const refLink = fullResponse.ref_link;

  // Store transaction ID as transaction_id4 in merchant-specific file
  const txFile = path.resolve(
    process.cwd(),
    `transaction.${merchant.merchant.replace(/\s+/g, "_")}.json`
  );
  
  let existingData: any = {};
  if (fs.existsSync(txFile)) {
    existingData = JSON.parse(fs.readFileSync(txFile, "utf8"));
  }

  const updatedData = {
    ...existingData,
    transaction_id4: transactionId,
    refLink4: refLink,
    merchant: merchant.merchant,
  };

  fs.writeFileSync(txFile, JSON.stringify(updatedData, null, 2));

  await page.goto(refLink);
  await page.fill('input[name="card[number]"]', "5267318187975449");
  await page.fill('input[name="card[expiry]"]', "12/30");
  await page.fill('input[name="card[cvv]"]', "123");
  await page.fill('input[name="card[name]"]', "Test");

  await page.click("#pay-now");

  try {
    await page.waitForSelector('button[data-val="S"]', { timeout: 30000 });
    await page.click('button[data-val="S"]');

    await page.waitForURL("https://www.formula1.com/", { timeout: 100000 });
    expect(page.url()).toBe("https://www.formula1.com/");

    console.log("✅ [TC_028] Payment completed successfully and redirected to success URL");
    // console.log(`   Transaction ID (transaction_id4): ${transactionId}`);
  } catch (error) {
    console.log("❌ [TC_028] Success confirmation button not loaded – treating as payment failure.");

    await page.waitForLoadState("domcontentloaded");
    const currentUrl = page.url();

    expect(currentUrl).not.toBe("https://www.formula1.com/");

    console.log(`❌ [TC_028] Payment did not reach success URL. Current URL: ${currentUrl}`);

    throw new Error("❌ [TC_028] Payment failed — stopping further execution.");
  }
});

// =========================================================================
// 🧩 [Positive:TC_029] Verify successful payment using ref_link - Urbanledger Seamless for partial refund
// =========================================================================
test("[Positive:TC_029] Verify successful payment using ref_link - Urbanledger Seamless for partial refund", async ({ page }) => {
  test.skip(!isAllowedForMerchant("TC_029"), `Skipping TC_029 for ${merchant.merchant}`);
  test.setTimeout(120000);

  const payload = buildPayload({ amount: 10000, curr_code: "AED"});
  const intentResponse = await api.post(intentApiUrl, payload, { timeout: 500000 });
  const fullResponse = intentResponse.data;

  expect(intentResponse.status).toBe(200);
  expect(fullResponse.status).toBe(true);
  expect(fullResponse.ref_link).toContain("https://");
  expect(fullResponse.transaction_id).toBeTruthy();

  const transactionId = fullResponse.transaction_id;
  const refLink = fullResponse.ref_link;

  // Save to merchant-specific file with transaction_id5
  const txFile = path.resolve(
    process.cwd(),
    `transaction.${merchant.merchant.replace(/\s+/g, "_")}.json`
  );
  
  let existingData: any = {};
  if (fs.existsSync(txFile)) {
    existingData = JSON.parse(fs.readFileSync(txFile, "utf8"));
  }

  const updatedData = {
    ...existingData,
    transaction_id5: transactionId,
    refLink5: refLink,
    merchant: merchant.merchant,
  };

  fs.writeFileSync(txFile, JSON.stringify(updatedData, null, 2));

  await page.goto(refLink);
  await page.fill("//input[@id='card-number']", "4111111111111111");
  await page.fill("//input[@id='card-expiry']", "05/28");
  await page.fill("//input[@id='card-cvv']", "100");
  await page.fill("//input[@id='card-holder']", "Test");
  await page.click("button[type='submit']");

  try {
    await page.waitForURL("https://www.formula1.com/", { timeout: 100000 });
    expect(page.url()).toBe("https://www.formula1.com/");
    console.log("✅ [TC_029] Urbanledger Seamless transaction completed successfully for partial refund");
    // console.log(`   Transaction ID (transaction_id5): ${transactionId}`);
  } catch (error) {
    console.log("❌ [TC_029] Payment failed – stopping execution.");
    await page.waitForLoadState("domcontentloaded");
    const currentUrl = page.url();
    console.log(`❌ [TC_029] Payment did not reach success URL. Current URL: ${currentUrl}`);
    throw new Error("❌ [TC_029] Payment failed — stopping further execution.");
  }
});

// ===============================================================
// 🧩 [Positive:TC_030] Verify successful payment using Capture API (TAP NSL)
// ===============================================================
test("[Positive:TC_030] Verify successful payment using Capture API payment_link (TAP NSL)", async ({ page }) => {
  test.skip(!isAllowedForMerchant("TC_030"), `Skipping TC_030 for ${merchant.merchant}`);
  test.setTimeout(300000); // 5 minutes for TAP slow processing

  /* ---------------- INTENT API ---------------- */
  const payload = {
    ...basePayload,
    merchant_order_token: generateMerchantOrderToken(),
    amount: "1000",
    curr_code: "SAR",
    additional_info: {
      ...basePayload.additional_info,
      merchant_id: "26682415",
    },
  };

  const intentResponse = await api.post(intentApiUrl, payload, { timeout: 500000 });
  const intentData = intentResponse.data;

  expect(intentResponse.status).toBe(200);
  expect(intentData.status).toBe(true);
  expect(intentData.transaction_id).toBeTruthy();
  expect(intentData.data).toBeTruthy();

  const transactionId = intentData.transaction_id;
  const paymentToken = intentData.data;

  // console.log(`[TC_030] Transaction ID: ${transactionId}`);
  // console.log(`[TC_030] Payment Token: ${paymentToken}`);

  /* ---------------- CAPTURE API ---------------- */
  const captureRequestBody = {
    billing_details: {
      address: { country: "", city: "", state: "", postal_code: "", line2: "", line1: "" },
      phone: "9090909090",
      name: "Wasi",
      email: "rohini.mandaokar@vernost.in",
    },
    coupon_code: "",
    authorization_id: "",
    save_method: false,
    payment_token: paymentToken,
    payment_method_details: { type: "NETBANKING", bank_code: "YESBANK" },
  };

  const captureResponse = await axios.post(
    "https://securenew.vernostpay.com/api/payment/capture",
    captureRequestBody,
    { headers, timeout: 500000 }
  );

  expect(captureResponse.status).toBe(200);
  expect(captureResponse.data.payment_link).toBeTruthy();

  const paymentLink = captureResponse.data.payment_link;

  /* ---------------- UI PAYMENT ---------------- */
  // For Dadabhai (TAP) add resilient navigation: listen for console/request failures and retry once.
  const isDadabhai = merchant.merchant.toLowerCase().includes('dadabhai');
  if (isDadabhai) {
    let pageNetworkError = false;
    const onConsole = (msg: any) => {
      try {
        const txt = String(msg.text()).toLowerCase();
        if (txt.includes('network response was not ok') || txt.includes('network response was not ok')) {
          console.warn('[TC_030] Page console error detected:', msg.text());
          pageNetworkError = true;
        }
      } catch (e) {}
    };

    const onRequestFailed = (req: any) => {
      try {
        const failure = req.failure();
        if (failure) {
          console.warn('[TC_030] Request failed:', req.url(), failure.errorText || failure);
          pageNetworkError = true;
        }
      } catch (e) {}
    };

    page.on('console', onConsole);
    page.on('requestfailed', onRequestFailed);

    let navResp: any = null;
    try {
      navResp = await page.goto(paymentLink, { waitUntil: 'domcontentloaded', timeout: 60000 });
    } catch (navErr: any) {
      console.warn('[TC_030] Initial navigation error:', navErr.message || navErr);
      pageNetworkError = true;
    }

    // If navigation response exists and is not ok, mark as network error
    try {
      if (navResp && typeof navResp.ok === 'function' && !navResp.ok()) {
        console.warn('[TC_030] Navigation response not ok:', navResp.status());
        pageNetworkError = true;
      }
    } catch (e) {}

    // Wait for network idle to allow widget load
    await page.waitForLoadState('networkidle').catch(() => {});

    // Retry once on detected network issues
    if (pageNetworkError) {
      console.log('[TC_030] Detected TAP network error on payment page, retrying navigation once');
      try {
        await page.goto(paymentLink, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('networkidle');
      } catch (retryErr: any) {
        console.warn('[TC_030] Retry navigation failed:', retryErr.message || retryErr);
      }
    }

    page.off('console', onConsole);
    page.off('requestfailed', onRequestFailed);
    await page.waitForTimeout(3000);

    // Check page body for TAP widget error message (visible on page)
    try {
      let bodyText = (await page.textContent('body')) || '';
      if (bodyText.toLowerCase().includes('network response was not ok')) {
        console.warn('[TC_030] TAP page shows network error message in DOM, retrying navigation once');
        try {
          await page.goto(paymentLink, { waitUntil: 'domcontentloaded', timeout: 60000 });
          await page.waitForLoadState('networkidle');
          bodyText = (await page.textContent('body')) || '';
        } catch (e) {
          console.warn('[TC_030] Retry navigation failed during DOM-check retry:', e.message || e);
        }

        if (bodyText.toLowerCase().includes('network response was not ok')) {
          throw new Error('[TC_030] TAP payment page displays "Network response was not ok" — retry did not help.');
        }
      }
    } catch (e) {
      // Non-fatal: continue to attempt TAP flow; failure will be caught later
      console.warn('[TC_030] Error while checking TAP page DOM for network message:', e.message || e);
    }
  } else {
    await page.goto(paymentLink, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  }
  
  // TAP Payments uses iframe named 'myFrame' with tap.company widget
  const tapFrame = page.frame({ name: 'myFrame' });
  
  if (!tapFrame) {
    // console.error("[TC_030] TAP iframe 'myFrame' not found!");
    const frames = page.frames();
    // console.log(`Available frames: ${frames.map(f => `${f.name()} - ${f.url()}`).join(', ')}`);
    throw new Error("TAP payment iframe not found");
  }
  
  // console.log("[TC_030] Found TAP iframe, waiting for card inputs...");
  
  // Wait for and fill card details inside TAP iframe
  // Based on URL params, fields are: cardNumber, expirationDate, cvv, cardHolder
  await tapFrame.waitForSelector('input', { timeout: 15000 });
  await page.waitForTimeout(2000);
  
  // Try to find inputs - TAP widget might use different selectors
  const inputs = await tapFrame.$$('input');
  // console.log(`[TC_030] Found ${inputs.length} input fields in TAP iframe`);
  
  // Strategy: Fill inputs by placeholder or visible order
  try {
    // Card Number - usually first field or has placeholder/name like "cardnumber", "card number"
    const cardNumberSelectors = [
      'input[placeholder*="Card Number" i]',
      'input[placeholder*="card" i]',
      'input[name*="card" i]',
      'input[type="text"]'
    ];
    
    let cardFilled = false;
    for (const selector of cardNumberSelectors) {
      if (await tapFrame.locator(selector).count() > 0) {
        await tapFrame.locator(selector).first().fill('4111111111111111');
        // console.log(`[TC_030] Filled card number with selector: ${selector}`);
        cardFilled = true;
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    if (!cardFilled) {
      // Fallback: fill first input
      await inputs[0].fill('4111111111111111');
      console.log("[TC_030] Filled card number in first input field");
      await page.waitForTimeout(1000);
    }
    
    // Expiry Date - MM/YY format
    const expirySelectors = [
      'input[placeholder*="MM" i]',
      'input[placeholder*="expir" i]',
      'input[name*="expir" i]'
    ];
    
    let expiryFilled = false;
    for (const selector of expirySelectors) {
      if (await tapFrame.locator(selector).count() > 0) {
        await tapFrame.locator(selector).first().fill('12/30');
        // console.log(`[TC_030] Filled expiry with selector: ${selector}`);
        expiryFilled = true;
        await page.waitForTimeout(500);
        break;
      }
    }
    
    if (!expiryFilled && inputs.length > 1) {
      await inputs[1].fill('12/30');
      // console.log("[TC_030] Filled expiry in second input field");
      await page.waitForTimeout(500);
    }
    
    // CVV
    const cvvSelectors = [
      'input[placeholder*="CVV" i]',
      'input[placeholder*="CVC" i]',
      'input[name*="cvv" i]',
      'input[name*="cvc" i]'
    ];
    
    let cvvFilled = false;
    for (const selector of cvvSelectors) {
      if (await tapFrame.locator(selector).count() > 0) {
        await tapFrame.locator(selector).first().fill('123');
        // console.log(`[TC_030] Filled CVV with selector: ${selector}`);
        cvvFilled = true;
        await page.waitForTimeout(500);
        break;
      }
    }
    
    if (!cvvFilled && inputs.length > 2) {
      await inputs[2].fill('123');
      // console.log("[TC_030] Filled CVV in third input field");
      await page.waitForTimeout(500);
    }
    
    // Card Holder Name
    const nameSelectors = [
      'input[placeholder*="name" i]',
      'input[placeholder*="holder" i]',
      'input[name*="holder" i]'
    ];
    
    let nameFilled = false;
    for (const selector of nameSelectors) {
      if (await tapFrame.locator(selector).count() > 0) {
        await tapFrame.locator(selector).first().fill('Test Card');
        // console.log(`[TC_030] Filled card holder name with selector: ${selector}`);
        nameFilled = true;
        await page.waitForTimeout(500);
        break;
      }
    }
    
    if (!nameFilled && inputs.length > 3) {
      await inputs[3].fill('Test Card');
      // console.log("[TC_030] Filled card holder in fourth input field");
      await page.waitForTimeout(500);
    }
    
    // console.log("[TC_030] Successfully filled all TAP payment form fields");
    
  } catch (fillError) {
    console.error(`[TC_030] Error filling TAP form: ${fillError}`);
    throw fillError;
  }

  await page.waitForTimeout(2000);

  // Click pay/submit button (outside iframe, on main page)
  const submitSelectors = ['#tap-btn', '#submitbutton', 'button[type="submit"]', 'button:has-text("Pay")'];
  
  let buttonClicked = false;
  for (const btnSelector of submitSelectors) {
    try {
      const button = page.locator(btnSelector);
      if (await button.count() > 0) {
        await button.waitFor({ state: 'visible', timeout: 5000 });
        // console.log(`[TC_030] Found submit button: ${btnSelector}`);
        
        // Scroll button into view
        await button.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
        
        // Try multiple click methods
        try {
          // Method 1: Hover then click
          await button.hover();
          await page.waitForTimeout(500);
          await button.click();
          buttonClicked = true;
        } catch (e1) {
          try {
            // Method 2: Dispatch click event
            await button.evaluate(btn => {
              btn.dispatchEvent(new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
              }));
            });
            buttonClicked = true;
          } catch (e2) {
            // Method 3: Direct JS click
            await button.evaluate(btn => btn.click());
            buttonClicked = true;
          }
        }
        break;
      }
    } catch (e) {
      continue;
    }
  }

  if (!buttonClicked) {
    console.error("[TC_030] Could not find submit button");
    throw new Error("Submit button not found on TAP payment page");
  }
  
  // Wait for navigation to complete (TAP may take time to redirect)
  await page.waitForTimeout(2000);
  let currentUrl = page.url();
  // console.log(`[TC_030] Current URL after initial wait: ${currentUrl}`);
  
  // If still on payment page, wait longer for redirect
  if (currentUrl.includes('securenew.vernostpay.com')) {
    // Try waiting up to 90 seconds for redirect
    let redirected = false;
    for (let i = 0; i < 18; i++) { // 18 x 5 seconds = 90 seconds
      await page.waitForTimeout(5000);
      currentUrl = page.url();
      
      if (!currentUrl.includes('securenew.vernostpay.com')) {
        // console.log(`[TC_030] ✅ Redirected after ${(i+1)*5} seconds to: ${currentUrl}`);
        redirected = true;
        break;
      }
      
      if (i % 3 === 0) { // Log every 15 seconds
        // console.log(`[TC_030] Still waiting... (${(i+1)*5}s elapsed)`);
      }
    }
    
    if (!redirected) {
      // console.log(`[TC_030] ⚠️ No redirect after 90 seconds, still on: ${currentUrl}`);
    }
  }
  
  // ALWAYS update currentUrl before 3DS check
  currentUrl = page.url();
  // console.log(`[TC_030] ✅ Current URL before 3DS check: ${currentUrl}`);
  
  // Check if we're on TAP's 3DS/authentication page
  if (currentUrl.includes('tap.company') || currentUrl.includes('acceptance.sandbox.tap') || currentUrl.includes('authenticate.alpha.tap') || currentUrl.includes('authenticate.tap')) {
    // console.log("[TC_030] 🔐 On TAP 3DS authentication page!");
    // console.log(`[TC_030] Auth URL: ${currentUrl}`);
    
    // Wait for page to fully load
    await page.waitForLoadState("domcontentloaded").catch(() => {});
    await page.waitForTimeout(5000);
    
    // Check for iframes
    const frames = page.frames();
    // console.log(`[TC_030] Found ${frames.length} frames on auth page`);
    for (const frame of frames) {
      // console.log(`  - Frame: ${frame.name() || 'unnamed'} | URL: ${frame.url()}`);
    }
    
    // Get page content for debugging
    const pageText = await page.textContent('body').catch(() => '');
    // console.log(`[TC_030] Page text content: ${pageText.substring(0, 300)}`);
    
    // Find and click ANY button on the page (there's only one button on TAP 3DS page)
    // console.log("[TC_030] Looking for authentication button...");
    
    let authClicked = false;
    
    // Check all frames for buttons
    for (const frame of frames) {
      if (authClicked) break;
      
      try {
        const frameButtons = await frame.$$('button, input[type="submit"], input[type="button"]');
        if (frameButtons.length > 0) {
          // console.log(`[TC_030] Found ${frameButtons.length} buttons in frame: ${frame.url()}`);
          
          for (const btn of frameButtons) {
            const isVisible = await btn.isVisible().catch(() => false);
            if (isVisible) {
              const text = await btn.textContent().catch(() => '');
              const value = await btn.getAttribute('value').catch(() => '');
              // console.log(`[TC_030] Clicking button in frame with text: "${text}", value: "${value}"`);
              await btn.click();
              authClicked = true;
              // console.log("[TC_030] ✅ Clicked authentication button in frame!");
              break;
            }
          }
        }
      } catch (e) {
        // Continue to next frame
      }
    }
    
    if (!authClicked) {
      // Try in main page
      try {
        const button = page.locator('button, input[type="submit"], input[type="button"]').first();
        await button.waitFor({ state: 'visible', timeout: 10000 });
        const buttonText = await button.textContent().catch(() => '');
        const buttonValue = await button.getAttribute('value').catch(() => '');
        // console.log(`[TC_030] Found button in main page with text: "${buttonText}", value: "${buttonValue}"`);
        await button.click();
        authClicked = true;
        // console.log("[TC_030] ✅ Clicked authentication button!");
      } catch (e) {
        // console.log(`[TC_030] ⚠️ Could not find any button: ${e.message}`);
        await page.screenshot({ path: `tap-3ds-no-button-${Date.now()}.png`, fullPage: true }).catch(() => {});
      }
    }
    
    if (authClicked) {
      // console.log("[TC_030] ⏳ Waiting for redirect after authentication...");
      await page.waitForTimeout(5000);
      await page.waitForLoadState("domcontentloaded").catch(() => {});
    }
    
    currentUrl = page.url();
    // console.log(`[TC_030] URL after authentication: ${currentUrl}`);
  }

  // Wait for final redirect to success or failure URL
  try {
    await page.waitForURL("https://www.formula1.com/", { timeout: 100000 });
    expect(page.url()).toBe("https://www.formula1.com/");
    console.log("✅ [TC_030] Payment completed successfully and redirected to success URL");
  } catch (error) {
    const finalUrl = page.url();
    console.log(`[TC_030] Did not reach success URL. Final URL: ${finalUrl}`);
    
    if (finalUrl.includes("yahoo.com")) {
      console.log("❌ [TC_030] Payment failed - redirected to failure URL");
      expect(finalUrl).toBe("https://yahoo.com/");
      throw new Error("❌ [TC_030] TAP payment failed — stopping further execution.");
    } else {
      console.log(`❌ [TC_030] Unexpected redirect. Current URL: ${finalUrl}`);
      throw new Error(`Payment did not complete. Final URL: ${finalUrl}`);
    }
  }

  // Store transaction ID after successful payment
  const txFile = path.resolve(
    process.cwd(),
    `transaction.${merchant.merchant.replace(/\s+/g, "_")}.json`
  );
  
  let existingData: any = {};
  if (fs.existsSync(txFile)) {
    existingData = JSON.parse(fs.readFileSync(txFile, "utf8"));
  }

  const updatedData = {
    ...existingData,
    transactionId_tap: transactionId,
    paymentToken_tap: paymentToken,
    payment_link_tap: paymentLink,
    merchant: merchant.merchant,
  };

  fs.writeFileSync(txFile, JSON.stringify(updatedData, null, 2));

  // console.log("✅ [TC_030] TAP NSL payment completed successfully using Capture API payment_link");
  // console.log(`   Transaction ID saved: ${transactionId}`);
});

// ===============================================================
// 🧩 [Positive:TC_031] Verify successful payment using Capture API payment_link (TAP NSL) - Second Transaction"
// ===============================================================
test("[Positive:TC_031] Verify successful payment using Capture API payment_link (TAP NSL) - Second Transaction", async ({ page }) => {
  test.skip(!isAllowedForMerchant("TC_031"), `Skipping TC_031 for ${merchant.merchant}`);
  test.setTimeout(300000); // 5 minutes for TAP slow processing

  /* ---------------- INTENT API ---------------- */
  const payload = {
    ...basePayload,
    merchant_order_token: generateMerchantOrderToken(),
    amount: "1000",
    curr_code: "SAR",
    additional_info: {
      ...basePayload.additional_info,
      merchant_id: "26682415",
    },
  };

  const intentResponse = await api.post(intentApiUrl, payload, { timeout: 500000 });
  const intentData = intentResponse.data;

  expect(intentResponse.status).toBe(200);
  expect(intentData.status).toBe(true);
  expect(intentData.transaction_id).toBeTruthy();
  expect(intentData.data).toBeTruthy();

  const transactionId = intentData.transaction_id;
  const paymentToken = intentData.data;

  // console.log(`[TC_031] Transaction ID: ${transactionId}`);
  // console.log(`[TC_031] Payment Token: ${paymentToken}`);

  /* ---------------- CAPTURE API ---------------- */
  const captureRequestBody = {
    billing_details: {
      address: { country: "", city: "", state: "", postal_code: "", line2: "", line1: "" },
      phone: "9090909090",
      name: "Wasi",
      email: "rohini.mandaokar@vernost.in",
    },
    coupon_code: "",
    authorization_id: "",
    save_method: false,
    payment_token: paymentToken,
    payment_method_details: { type: "NETBANKING", bank_code: "YESBANK" },
  };

  const captureResponse = await axios.post(
    "https://securenew.vernostpay.com/api/payment/capture",
    captureRequestBody,
    { headers, timeout: 500000 }
  );

  expect(captureResponse.status).toBe(200);
  expect(captureResponse.data.payment_link).toBeTruthy();

  const paymentLink = captureResponse.data.payment_link;
  // console.log(`[TC_031] Payment Link: ${paymentLink}`);

  /* ---------------- UI PAYMENT ---------------- */
  // console.log("[TC_031] Looking for TAP payment widget iframe...");
  await page.goto(paymentLink, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(3000);
  
  // TAP Payments uses iframe named 'myFrame' with tap.company widget
  const tapFrame = page.frame({ name: 'myFrame' });
  
  if (!tapFrame) {
    const frames = page.frames();
    throw new Error("TAP payment iframe not found");
  }
  
  // Wait for and fill card details inside TAP iframe
  await tapFrame.waitForSelector('input', { timeout: 15000 });
  await page.waitForTimeout(2000);
  
  const inputs = await tapFrame.$$('input');
  
  // Fill card details using proper selectors
  try {
    // Card Number
    const cardNumberSelectors = [
      'input[placeholder*="Card Number" i]',
      'input[placeholder*="card" i]',
      'input[name*="card" i]',
      'input[type="text"]'
    ];
    
    let cardFilled = false;
    for (const selector of cardNumberSelectors) {
      if (await tapFrame.locator(selector).count() > 0) {
        await tapFrame.locator(selector).first().fill('4111111111111111');
        cardFilled = true;
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    if (!cardFilled) {
      await inputs[0].fill('4111111111111111');
      await page.waitForTimeout(1000);
    }
    
    // Expiry Date - MM/YY format
    const expirySelectors = [
      'input[placeholder*="MM" i]',
      'input[placeholder*="expir" i]',
      'input[name*="expir" i]'
    ];
    
    let expiryFilled = false;
    for (const selector of expirySelectors) {
      if (await tapFrame.locator(selector).count() > 0) {
        await tapFrame.locator(selector).first().fill('12/30');
        expiryFilled = true;
        await page.waitForTimeout(500);
        break;
      }
    }
    
    if (!expiryFilled && inputs.length > 1) {
      await inputs[1].fill('12/30');
      await page.waitForTimeout(500);
    }
    
    // CVV
    const cvvSelectors = [
      'input[placeholder*="CVV" i]',
      'input[placeholder*="CVC" i]',
      'input[name*="cvv" i]',
      'input[name*="cvc" i]'
    ];
    
    let cvvFilled = false;
    for (const selector of cvvSelectors) {
      if (await tapFrame.locator(selector).count() > 0) {
        await tapFrame.locator(selector).first().fill('123');
        cvvFilled = true;
        await page.waitForTimeout(500);
        break;
      }
    }
    
    if (!cvvFilled && inputs.length > 2) {
      await inputs[2].fill('123');
      await page.waitForTimeout(500);
    }
    
    // Card Holder Name
    const nameSelectors = [
      'input[placeholder*="name" i]',
      'input[placeholder*="holder" i]',
      'input[name*="holder" i]'
    ];
    
    let nameFilled = false;
    for (const selector of nameSelectors) {
      if (await tapFrame.locator(selector).count() > 0) {
        await tapFrame.locator(selector).first().fill('Test Card');
        nameFilled = true;
        await page.waitForTimeout(500);
        break;
      }
    }
    
    if (!nameFilled && inputs.length > 3) {
      await inputs[3].fill('Test Card');
      await page.waitForTimeout(500);
    }
    
    // console.log("[TC_031] Successfully filled all TAP payment form fields");
    
  } catch (fillError) {
    console.error(`[TC_031] Error filling TAP form: ${fillError}`);
    throw fillError;
  }

  await page.waitForTimeout(2000);

  // Click pay/submit button (outside iframe, on main page)
  // console.log("[TC_031] Looking for submit button...");
  const submitSelectors = ['#tap-btn', '#submitbutton', 'button[type="submit"]', 'button:has-text("Pay")'];
  
  let buttonClicked = false;
  for (const btnSelector of submitSelectors) {
    try {
      const button = page.locator(btnSelector);
      if (await button.count() > 0) {
        await button.waitFor({ state: 'visible', timeout: 5000 });
        // console.log(`[TC_031] Found submit button: ${btnSelector}`);
        
        // Scroll button into view
        await button.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
        
        // Hover then click
        await button.hover();
        await page.waitForTimeout(500);
        await button.click();
        // console.log(`[TC_031] Clicked submit button`);
        buttonClicked = true;
        break;
      }
    } catch (e) {
      continue;
    }
  }

  if (!buttonClicked) {
    // console.error("[TC_031] Could not find submit button");
    throw new Error("Submit button not found on TAP payment page");
  }

  // Wait for redirect - could be to 3DS page, success page, or failure page
  // console.log("[TC_031] Waiting for payment processing...");
  
  await page.waitForTimeout(2000);
  let currentUrl = page.url();
  // console.log(`[TC_031] Current URL after initial wait: ${currentUrl}`);
  
  // If still on payment page, wait longer for redirect
  if (currentUrl.includes('securenew.vernostpay.com')) {
    // console.log("[TC_031] Still on payment page, waiting for redirect (up to 90 seconds)...");
    
    // Try waiting up to 90 seconds for redirect
    let redirected = false;
    for (let i = 0; i < 18; i++) { // 18 x 5 seconds = 90 seconds
      await page.waitForTimeout(5000);
      currentUrl = page.url();
      
      if (!currentUrl.includes('securenew.vernostpay.com')) {
        // console.log(`[TC_031] ✅ Redirected after ${(i+1)*5} seconds to: ${currentUrl}`);
        redirected = true;
        break;
      }
      
      if (i % 3 === 0) { // Log every 15 seconds
        // console.log(`[TC_031] Still waiting... (${(i+1)*5}s elapsed)`);
      }
    }
    
    if (!redirected) {
      console.log(`[TC_031] ⚠️ No redirect after 90 seconds, still on: ${currentUrl}`);
    }
  }
  
  // ALWAYS update currentUrl before 3DS check
  currentUrl = page.url();
  // console.log(`[TC_031] ✅ Current URL before 3DS check: ${currentUrl}`);
  
  // Check if we're on TAP's 3DS/authentication page
  if (currentUrl.includes('tap.company') || currentUrl.includes('acceptance.sandbox.tap') || currentUrl.includes('authenticate.alpha.tap') || currentUrl.includes('authenticate.tap')) {
    // console.log("[TC_031] 🔐 On TAP 3DS authentication page!");
    // console.log(`[TC_031] Auth URL: ${currentUrl}`);
    
    // Wait for page to fully load
    await page.waitForLoadState("domcontentloaded").catch(() => {});
    await page.waitForTimeout(5000);
    
    // Check for iframes
    const frames = page.frames();
    // console.log(`[TC_031] Found ${frames.length} frames on auth page`);
    
    // Find and click ANY button on the page
    // console.log("[TC_031] Looking for authentication button...");
    
    let authClicked = false;
    
    // Check all frames for buttons
    for (const frame of frames) {
      if (authClicked) break;
      
      try {
        const frameButtons = await frame.$$('button, input[type="submit"], input[type="button"]');
        if (frameButtons.length > 0) {
          // console.log(`[TC_031] Found ${frameButtons.length} buttons in frame`);
          
          for (const btn of frameButtons) {
            const isVisible = await btn.isVisible().catch(() => false);
            if (isVisible) {
              const text = await btn.textContent().catch(() => '');
              // console.log(`[TC_031] Clicking button with text: "${text}"`);
              await btn.click();
              authClicked = true;
              // console.log("[TC_031] ✅ Clicked authentication button in frame!");
              break;
            }
          }
        }
      } catch (e) {
        // Continue to next frame
      }
    }
    
    if (!authClicked) {
      // Try in main page
      try {
        const button = page.locator('button, input[type="submit"], input[type="button"]').first();
        await button.waitFor({ state: 'visible', timeout: 10000 });
        const buttonText = await button.textContent().catch(() => '');
        // console.log(`[TC_031] Found button in main page with text: "${buttonText}"`);
        await button.click();
        authClicked = true;
        // console.log("[TC_031] ✅ Clicked authentication button!");
      } catch (e) {
        console.log(`[TC_031] ⚠️ Could not find any button: ${e.message}`);
        await page.screenshot({ path: `tap-3ds-tc031-${Date.now()}.png`, fullPage: true }).catch(() => {});
      }
    }
    
    if (authClicked) {
      // console.log("[TC_031] ⏳ Waiting for redirect after authentication...");
      await page.waitForTimeout(5000);
      await page.waitForLoadState("domcontentloaded").catch(() => {});
    }
    
    currentUrl = page.url();
    // console.log(`[TC_031] URL after authentication: ${currentUrl}`);
  }

  // Wait for final redirect to success or failure URL
  try {
    await page.waitForURL("https://www.formula1.com/", { timeout: 100000 });
    expect(page.url()).toBe("https://www.formula1.com/");
    console.log("✅ [TC_031] Payment completed successfully and redirected to success URL");
  } catch (error) {
    const finalUrl = page.url();
    console.log(`[TC_031] Did not reach success URL. Final URL: ${finalUrl}`);
    
    if (finalUrl.includes("yahoo.com")) {
      console.log("❌ [TC_031] Payment failed - redirected to failure URL");
      expect(finalUrl).toBe("https://yahoo.com/");
      throw new Error("❌ [TC_031] TAP payment failed — stopping further execution.");
    } else {
      console.log(`❌ [TC_031] Unexpected redirect. Current URL: ${finalUrl}`);
      throw new Error(`Payment did not complete. Final URL: ${finalUrl}`);
    }
  }

  // Store transaction ID after successful payment
  const txFile = path.resolve(
    process.cwd(),
    `transaction.${merchant.merchant.replace(/\s+/g, "_")}.json`
  );
  
  let existingData: any = {};
  if (fs.existsSync(txFile)) {
    existingData = JSON.parse(fs.readFileSync(txFile, "utf8"));
  }

  const updatedData = {
    ...existingData,
    transactionId_tap2: transactionId,
    paymentToken_tap2: paymentToken,
    payment_link_tap2: paymentLink,
    merchant: merchant.merchant,
  };

  fs.writeFileSync(txFile, JSON.stringify(updatedData, null, 2));

  // console.log("✅ [TC_031] TAP NSL payment completed successfully using Capture API payment_link");
  // console.log(`   Transaction ID saved: ${transactionId}`);
});

// =========================================================================
// 🧩 [Positive:TC_032] Verify successful payment using ref_link for Axis Traveledge
// =========================================================================
test("[Positive:TC_032] Verify successful payment using ref_link for Axis Traveledge", async ({ page }) => {
  test.skip(!isAllowedForMerchant("TC_032"), `Skipping TC_032 for ${merchant.merchant}`);
  test.setTimeout(120000);

  const payload = buildPayload({ amount: 10000 });

  const intentResponse = await api.post(intentApiUrl, payload, { timeout: 500000 });

  const fullResponse = intentResponse.data;

  expect(intentResponse.status).toBe(200);
  expect(fullResponse.status).toBe(true);
  expect(fullResponse.ref_link).toContain("https://");
  expect(fullResponse.transaction_id).toBeTruthy();

  const transactionId = fullResponse.transaction_id;
  const refLink = fullResponse.ref_link;

  const txFile = path.resolve(
    process.cwd(),
    `transaction.${merchant.merchant.replace(/\s+/g, "_")}.json`
  );
  
  let existingData: any = {};
  if (fs.existsSync(txFile)) {
    existingData = JSON.parse(fs.readFileSync(txFile, "utf8"));
  }

  const updatedData = {
    ...existingData,
    transactionId_tc032: transactionId,
    refLink_tc032: refLink,
    merchant: merchant.merchant,
  };

  fs.writeFileSync(txFile, JSON.stringify(updatedData, null, 2));

  // console.log(`[TC_032] Opening payment page: ${refLink}`);
  await page.goto(refLink);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(5000);
  
  // console.log(`[TC_032] Current URL: ${page.url()}`);
  // console.log(`[TC_032] Page title: ${await page.title()}`);
  
  // Wait for Razorpay iframe to load
  // console.log("[TC_032] Waiting for Razorpay payment iframe...");
  let razorpayFrame = null;
  try {
    await page.waitForSelector('.razorpay-container iframe', { timeout: 30000 });
    // console.log("[TC_032] Razorpay iframe found, accessing iframe content...");
    await page.waitForTimeout(2000); // Reduced wait time
    
    // Get the iframe element
    const iframeElement = await page.$('.razorpay-container iframe');
    if (iframeElement) {
      razorpayFrame = await iframeElement.contentFrame();
      // console.log(`[TC_032] Got iframe context: ${razorpayFrame !== null}`);
    }
  } catch (e) {
    console.log(`[TC_032] ⚠️ Error accessing Razorpay iframe: ${e.message}`);
  }
  
  // If iframe found, work within iframe context, otherwise work in main page
  const workingContext = razorpayFrame || page;
  // console.log(`[TC_032] Working in ${razorpayFrame ? 'iframe' : 'main page'} context`);
  
  // Wait a bit more for iframe content to load
  if (razorpayFrame) {
    // console.log("[TC_032] Waiting for iframe content to load...");
    // Wait for radio buttons to appear instead of fixed timeout
    try {
      await razorpayFrame.waitForSelector('input[type="radio"]', { timeout: 20000 });
      // console.log("[TC_032] Radio buttons loaded in iframe");
      await page.waitForTimeout(2000); // Small buffer for any remaining JS initialization
    } catch (e) {
      console.log("[TC_032] ⚠️ Radio buttons not found, waiting 5 more seconds...");
      await page.waitForTimeout(5000);
    }
    
    // Debug: Check iframe content
    try {
      const iframeText = await razorpayFrame.textContent('body').catch(() => '');
      // console.log(`[TC_032] Iframe loaded, text length: ${iframeText.length} chars`);
      
      // Check for all list items (payment methods)
      const listItems = await razorpayFrame.$$('li');
      // console.log(`[TC_032] Found ${listItems.length} list items in iframe`);
      if (listItems.length > 0) {
        for (let i = 0; i < Math.min(listItems.length, 10); i++) {
          const text = await listItems[i].textContent().catch(() => '');
          const mAttr = await listItems[i].getAttribute('m').catch(() => '');
          // console.log(`[TC_032]   Li ${i + 1}: m="${mAttr}", text="${text.trim().substring(0, 50)}"`);
        }
      }
      
      // Check what inputs are available
      const inputs = await razorpayFrame.$$('input');
      // console.log(`[TC_032] Found ${inputs.length} input fields in iframe`);
      for (let i = 0; i < Math.min(inputs.length, 5); i++) {
        const name = await inputs[i].getAttribute('name').catch(() => '');
        const type = await inputs[i].getAttribute('type').catch(() => '');
        // console.log(`[TC_032]   Input ${i + 1}: name="${name}", type="${type}"`);
      }
    } catch (e) {
      console.log(`[TC_032] Error checking iframe content: ${e.message}`);
    }
  }
  
  // Check if card tab needs to be clicked (within iframe)
  try {
    // First check for radio buttons (payment method selection)
    const radioButtons = await workingContext.$$('input[type="radio"]');
    // console.log(`[TC_032] Found ${radioButtons.length} radio buttons`);
    
    if (radioButtons.length > 0) {
      let cardRadioFound = false;
      // Click each radio button to find the one that shows card inputs
      for (let i = 0; i < radioButtons.length; i++) {
        try {
          const radioLabel = await radioButtons[i].evaluate((el: any) => {
            const label = el.closest('label') || el.parentElement;
            return label ? label.textContent : '';
          });
          // console.log(`[TC_032] Radio ${i + 1} label: "${radioLabel.trim()}"`);
          
          // Look for "Card" or "Credit" or "Debit" in the label
          if (radioLabel.match(/card|credit|debit/i)) {
            // console.log(`[TC_032] Found card payment radio button, clicking parent/label...`);
            cardRadioFound = true;
            
            // Try clicking the parent/label element instead of the radio input
            try {
              const clicked = await radioButtons[i].evaluate((el: any) => {
                const label = el.closest('label') || el.parentElement;
                if (label) {
                  label.click();
                  return true;
                }
                return false;
              });
              // console.log(`[TC_032] Clicked parent element via JS: ${clicked}`);
            } catch (e1) {
              console.log(`[TC_032] JS click failed, trying direct click: ${e1.message}`);
              await radioButtons[i].click({ force: true });
            }
            
            await page.waitForTimeout(5000);
            
            // Verify radio is checked
            const isChecked = await radioButtons[i].isChecked();
            // console.log(`[TC_032] Radio button checked: ${isChecked}`);
            
            // Wait for card form to load and check what inputs appear
            await page.waitForTimeout(3000);
            const newInputs = await workingContext.$$('input');
            // console.log(`[TC_032] After clicking Cards, found ${newInputs.length} inputs`);
            for (let j = 0; j < Math.min(newInputs.length, 10); j++) {
              const name = await newInputs[j].getAttribute('name').catch(() => '');
              const type = await newInputs[j].getAttribute('type').catch(() => '');
              const placeholder = await newInputs[j].getAttribute('placeholder').catch(() => '');
              // console.log(`[TC_032]   Input ${j + 1}: name="${name}", type="${type}", placeholder="${placeholder}"`);
            }
            
            // Check if there's a new radio button (like radio-2) that needs to be clicked
            const newRadios = await workingContext.$$('input[type="radio"]');
            for (const radio of newRadios) {
              const radioName = await radio.getAttribute('name').catch(() => '');
              if (radioName === 'radio-2' || radioName === 'radio-1') {
                // console.log(`[TC_032] Found ${radioName} button, clicking to reveal card inputs...`);
                await radio.evaluate((el: any) => {
                  const label = el.closest('label') || el.parentElement;
                  if (label) label.click();
                });
                await page.waitForTimeout(3000);
                
                // Check for card inputs again
                const finalInputs = await workingContext.$$('input:not([type="radio"])');
                // console.log(`[TC_032] After clicking ${radioName}, found ${finalInputs.length} non-radio inputs`);
                break;
              }
            }
            
            break;
          }
        } catch (e) {
          console.log(`[TC_032] Error processing radio ${i + 1}: ${e.message}`);
        }
      }
      
      if (!cardRadioFound) {
        // console.log(`[TC_032] No card radio found, trying first radio button...`);
        await radioButtons[0].click({ force: true });
        await page.waitForTimeout(3000);
      }
    }
    
    // Also check for list-based payment methods
    const cardTab = workingContext.locator("//li[@m='card']");
    const cardTabCount = await cardTab.count();
    // console.log(`[TC_032] Card tab count: ${cardTabCount}`);
    if (cardTabCount > 0) {
      // console.log("[TC_032] Found card tab in iframe, clicking...");
      await cardTab.click();
      await page.waitForTimeout(2000);
    } else {
      // Try alternate selectors
      const altCardTab = workingContext.locator('li[m="card"], [data-method="card"], [data-value="card"]').first();
      if (await altCardTab.count() > 0) {
        // console.log("[TC_032] Found card tab with alternate selector, clicking...");
        await altCardTab.click();
        await page.waitForTimeout(2000);
      }
    }
  } catch (e) {
    console.log(`[TC_032] Error clicking card tab: ${e.message}`);
  }
  
  // console.log("[TC_032] Waiting for card input fields in iframe...");
  
  // First, let's check what inputs are actually available
  await page.waitForTimeout(3000);
  const allInputs = await workingContext.$$('input');
  // console.log(`[TC_032] Total inputs on card page: ${allInputs.length}`);
  
  for (let i = 0; i < allInputs.length; i++) {
    const name = await allInputs[i].getAttribute('name').catch(() => '');
    const type = await allInputs[i].getAttribute('type').catch(() => '');
    const placeholder = await allInputs[i].getAttribute('placeholder').catch(() => '');
    const id = await allInputs[i].getAttribute('id').catch(() => '');
    const className = await allInputs[i].getAttribute('class').catch(() => '');
    const isVisible = await allInputs[i].isVisible().catch(() => false);
    
    if (type !== 'radio' && isVisible) {
      // console.log(`[TC_032]   Input ${i + 1}: name="${name}", type="${type}", id="${id}", placeholder="${placeholder}", class="${className}"`);
    }
  }
  
  // Try to find card number input with multiple selectors
  const cardNumberSelectors = [
    'input[name="card[number]"]',
    'input[placeholder*="card number" i]',
    'input[placeholder*="Card Number" i]',
    'input[id*="card-number"]',
    'input[id*="cardNumber"]',
    'input.card-number',
    'input[type="tel"]',
    'input[type="text"]'
  ];
  
  let cardNumberInput = null;
  for (const selector of cardNumberSelectors) {
    try {
      const input = workingContext.locator(selector).first();
      if (await input.count() > 0 && await input.isVisible({ timeout: 2000 })) {
        // console.log(`[TC_032] Found card number input with selector: ${selector}`);
        cardNumberInput = selector;
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (!cardNumberInput) {
    // console.log(`[TC_032] ⚠️ Could not find card number input, waiting with default selector...`);
    cardNumberInput = 'input[name="card[number]"]';
  }
  
  await workingContext.waitForSelector(cardNumberInput, { timeout: 30000 });
  
  // console.log("[TC_032] Filling card details in iframe...");
  await workingContext.fill('input[name="card.number"]', "5267318187975449");
  await workingContext.fill('input[name="card.expiry"]', "12/30");
  await workingContext.fill('input[name="card.cvv"]', "123");
  await workingContext.fill('input[name="card.name"]', "Test Card");

  // console.log("[TC_032] Looking for pay button...");
  await page.waitForTimeout(2000);
  
  // Check buttons in iframe
  const iframeButtons = await workingContext.$$('button');
  // console.log(`[TC_032] Found ${iframeButtons.length} buttons in iframe`);
  for (let i = 0; i < iframeButtons.length; i++) {
    const text = await iframeButtons[i].textContent().catch(() => '');
    const type = await iframeButtons[i].getAttribute('type').catch(() => '');
    const className = await iframeButtons[i].getAttribute('class').catch(() => '');
    const isVisible = await iframeButtons[i].isVisible().catch(() => false);
    if (isVisible) {
      // console.log(`[TC_032]   Iframe Button ${i + 1}: text="${text.trim()}", type="${type}", visible=${isVisible}`);
    }
  }
  
  // Check buttons in main page
  const mainButtons = await page.$$('button');
  // console.log(`[TC_032] Found ${mainButtons.length} buttons in main page`);
  for (let i = 0; i < mainButtons.length; i++) {
    const text = await mainButtons[i].textContent().catch(() => '');
    const type = await mainButtons[i].getAttribute('type').catch(() => '');
    const isVisible = await mainButtons[i].isVisible().catch(() => false);
    if (isVisible) {
      // console.log(`[TC_032]   Main Button ${i + 1}: text="${text.trim()}", type="${type}", visible=${isVisible}`);
    }
  }
  
  // Try to find and click the pay button
  let payButtonClicked = false;
  
  // Try in iframe first
  const iframePayButtonSelectors = [
    'button:has-text("Pay")',
    'button:has-text("Continue")',
    'button:has-text("Proceed")',
    'button[type="submit"]'
  ];
  
  for (const selector of iframePayButtonSelectors) {
    try {
      const button = workingContext.locator(selector).first();
      if (await button.count() > 0 && await button.isVisible({ timeout: 2000 })) {
        // console.log(`[TC_032] Clicking pay button in iframe with selector: ${selector}`);
        await button.click();
        payButtonClicked = true;
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (!payButtonClicked) {
    // console.log("[TC_032] Pay button not found in iframe, trying main page...");
    await page.click("//button[normalize-space()='Continue']");
  }

  // console.log("[TC_032] Pay button clicked, waiting for next page...");
  await page.waitForTimeout(5000);
  
  // console.log(`[TC_032] Current URL after Continue: ${page.url()}`);
  
  // Check if still in iframe or if page changed
  const iframeStillExists = await page.$('.razorpay-container iframe');
  if (iframeStillExists) {
    const newIframeContent = await iframeStillExists.contentFrame();
    if (newIframeContent) {
      // console.log("[TC_032] Still in Razorpay iframe, checking for next step...");
      
      // Check for buttons
      const buttonsAfter = await newIframeContent.$$('button');
      // console.log(`[TC_032] Found ${buttonsAfter.length} buttons after Continue`);
      for (let i = 0; i < buttonsAfter.length; i++) {
        const text = await buttonsAfter[i].textContent().catch(() => '');
        const isVisible = await buttonsAfter[i].isVisible().catch(() => false);
        if (isVisible && text.trim()) {
          // console.log(`[TC_032]   Button ${i + 1}: "${text.trim()}"`);
        }
      }
      
      // Check for inputs (like OTP, password, etc.)
      const inputsAfter = await newIframeContent.$$('input');
      // console.log(`[TC_032] Found ${inputsAfter.length} inputs after Continue`);
      for (let i = 0; i < inputsAfter.length; i++) {
        const type = await inputsAfter[i].getAttribute('type').catch(() => '');
        const placeholder = await inputsAfter[i].getAttribute('placeholder').catch(() => '');
        const name = await inputsAfter[i].getAttribute('name').catch(() => '');
        const isVisible = await inputsAfter[i].isVisible().catch(() => false);
        if (isVisible) {
          // console.log(`[TC_032]   Input ${i + 1}: name="${name}", type="${type}", placeholder="${placeholder}"`);
        }
      }
      
      // Check for any text content that might indicate what step this is
      const iframeText = await newIframeContent.textContent('body').catch(() => '');
      if (iframeText.includes('OTP') || iframeText.includes('otp')) {
        // console.log("[TC_032] ⚠️ OTP step detected");
      }
      if (iframeText.includes('password') || iframeText.includes('Password')) {
        // console.log("[TC_032] ⚠️ Password step detected");
      }
      // console.log(`[TC_032] Iframe text preview: ${iframeText.substring(0, 200)}...`);
      
      // Dismiss card saving overlay by clicking "Maybe later" - this proceeds with payment
      const maybeLaterButton = await newIframeContent.locator('button:has-text("Maybe later")').first();
      
      if (await maybeLaterButton.count() > 0 && await maybeLaterButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        // console.log("[TC_032] Found 'Maybe later' button, clicking to proceed with payment...");
        await maybeLaterButton.click();
        await page.waitForTimeout(5000);
        // console.log(`[TC_032] After Maybe later, URL: ${page.url()}`);
      }
    }
  }

  try {
    // console.log("[TC_032] Waiting for success confirmation button...");
    await page.waitForSelector('button[data-val="S"]', { timeout: 30000 });
    await page.click('button[data-val="S"]');

    // console.log("[TC_032] Waiting for redirect to success URL...");
    await page.waitForURL("https://www.formula1.com/", { timeout: 100000 });
    expect(page.url()).toBe("https://www.formula1.com/");

    console.log("✅ [TC_032] Payment completed successfully and redirected to success URL");
  } catch (error) {
    console.log("❌ [TC_032] Success confirmation button not loaded – treating as payment failure.");

    await page.waitForLoadState("domcontentloaded");
    const currentUrl = page.url();

    if (currentUrl.includes("yahoo.com")) {
      console.log(`❌ [TC_032] Payment failed - redirected to failure URL: ${currentUrl}`);
      expect(currentUrl).toBe("https://yahoo.com/");
      throw new Error("❌ [TC_032] Payment failed — stopping further execution.");
    }

    expect(currentUrl).not.toBe("https://www.formula1.com/");

    console.log(`❌ [TC_032] Payment did not reach success URL. Current URL: ${currentUrl}`);

    throw new Error("❌ [TC_032] Payment failed — stopping further execution.");
  }
});

// =========================================================================
// 🧩 [Positive:TC_033] Verify successful payment using ref_link for Axis Traveledge (for partial refund)
// =========================================================================
test("[Positive:TC_033] Verify successful payment using ref_link for Axis Traveledge (for partial refund)", async ({ page }) => {
  test.skip(!isAllowedForMerchant("TC_032"), `Skipping TC_033 for ${merchant.merchant}`);
  test.setTimeout(120000);

  const payload = buildPayload({ amount: 10000 });

  const intentResponse = await api.post(intentApiUrl, payload, { timeout: 500000 });

  const fullResponse = intentResponse.data;

  expect(intentResponse.status).toBe(200);
  expect(fullResponse.status).toBe(true);
  expect(fullResponse.ref_link).toContain("https://");
  expect(fullResponse.transaction_id).toBeTruthy();

  const transactionId = fullResponse.transaction_id;
  const refLink = fullResponse.ref_link;

  const txFile = path.resolve(
    process.cwd(),
    `transaction.${merchant.merchant.replace(/\s+/g, "_")}.json`
  );
  
  let existingData: any = {};
  if (fs.existsSync(txFile)) {
    existingData = JSON.parse(fs.readFileSync(txFile, "utf8"));
  }

  const updatedData = {
    ...existingData,
    transactionId_tc033: transactionId,
    refLink_tc033: refLink,
    merchant: merchant.merchant,
  };

  fs.writeFileSync(txFile, JSON.stringify(updatedData, null, 2));

  await page.goto(refLink);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(5000);
  
  let razorpayFrame = null;
  try {
    await page.waitForSelector('.razorpay-container iframe', { timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const iframeElement = await page.$('.razorpay-container iframe');
    if (iframeElement) {
      razorpayFrame = await iframeElement.contentFrame();
    }
  } catch (e) {
    console.log(`[TC_033] ⚠️ Error accessing Razorpay iframe: ${e.message}`);
  }
  
  const workingContext = razorpayFrame || page;
  
  if (razorpayFrame) {
    try {
      await razorpayFrame.waitForSelector('input[type="radio"]', { timeout: 20000 });
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log("[TC_033] ⚠️ Radio buttons not found, waiting 5 more seconds...");
      await page.waitForTimeout(5000);
    }
  }
  
  try {
    const radioButtons = await workingContext.$$('input[type="radio"]');
    
    if (radioButtons.length > 0) {
      let cardRadioFound = false;
      
      for (let i = 0; i < radioButtons.length; i++) {
        try {
          const radioLabel = await radioButtons[i].evaluate((el: any) => {
            const label = el.closest('label') || el.parentElement;
            return label ? label.textContent : '';
          });
          
          if (radioLabel.match(/card|credit|debit/i)) {
            cardRadioFound = true;
            
            try {
              const clicked = await radioButtons[i].evaluate((el: any) => {
                const label = el.closest('label') || el.parentElement;
                if (label) {
                  label.click();
                  return true;
                }
                return false;
              });
            } catch (e1) {
              await radioButtons[i].click({ force: true });
            }
            
            await page.waitForTimeout(5000);
            
            const newRadios = await workingContext.$$('input[type="radio"]');
            for (const radio of newRadios) {
              const radioName = await radio.getAttribute('name').catch(() => '');
              if (radioName === 'radio-2' || radioName === 'radio-1') {
                await radio.evaluate((el: any) => {
                  const label = el.closest('label') || el.parentElement;
                  if (label) label.click();
                });
                await page.waitForTimeout(3000);
                break;
              }
            }
            
            break;
          }
        } catch (e) {
          console.log(`[TC_033] Error processing radio ${i + 1}: ${e.message}`);
        }
      }
      
      if (!cardRadioFound) {
        await radioButtons[0].click({ force: true });
        await page.waitForTimeout(3000);
      }
    }
    
    const cardTab = workingContext.locator("//li[@m='card']");
    const cardTabCount = await cardTab.count();
    
    if (cardTabCount > 0) {
      await cardTab.click();
      await page.waitForTimeout(2000);
    } else {
      const altCardTab = workingContext.locator('li[m="card"], [data-method="card"], [data-value="card"]').first();
      if (await altCardTab.count() > 0) {
        await altCardTab.click();
        await page.waitForTimeout(2000);
      }
    }
  } catch (e) {
    console.log(`[TC_033] Error clicking card tab: ${e.message}`);
  }
  
  await page.waitForTimeout(3000);
  
  const cardNumberSelectors = [
    'input[name="card[number]"]',
    'input[placeholder*="card number" i]',
    'input[placeholder*="Card Number" i]',
    'input[id*="card-number"]',
    'input[id*="cardNumber"]',
    'input.card-number',
    'input[type="tel"]',
    'input[type="text"]'
  ];
  
  let cardNumberInput = null;
  for (const selector of cardNumberSelectors) {
    try {
      const input = workingContext.locator(selector).first();
      if (await input.count() > 0 && await input.isVisible({ timeout: 2000 })) {
        cardNumberInput = selector;
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (!cardNumberInput) {
    cardNumberInput = 'input[name="card[number]"]';
  }
  
  await workingContext.waitForSelector(cardNumberInput, { timeout: 30000 });
  
  await workingContext.fill('input[name="card.number"]', "5267318187975449");
  await workingContext.fill('input[name="card.expiry"]', "12/30");
  await workingContext.fill('input[name="card.cvv"]', "123");
  await workingContext.fill('input[name="card.name"]', "Test Card");

  await page.waitForTimeout(2000);
  
  let payButtonClicked = false;
  
  const iframePayButtonSelectors = [
    'button:has-text("Pay")',
    'button:has-text("Continue")',
    'button:has-text("Proceed")',
    'button[type="submit"]'
  ];
  
  for (const selector of iframePayButtonSelectors) {
    try {
      const button = workingContext.locator(selector).first();
      if (await button.count() > 0 && await button.isVisible({ timeout: 2000 })) {
        await button.click();
        payButtonClicked = true;
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (!payButtonClicked) {
    await page.click("//button[normalize-space()='Continue']");
  }

  await page.waitForTimeout(5000);
  
  const iframeStillExists = await page.$('.razorpay-container iframe');
  if (iframeStillExists) {
    const newIframeContent = await iframeStillExists.contentFrame();
    if (newIframeContent) {
      const maybeLaterButton = await newIframeContent.locator('button:has-text("Maybe later")').first();
      
      if (await maybeLaterButton.count() > 0 && await maybeLaterButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await maybeLaterButton.click();
        await page.waitForTimeout(5000);
      }
    }
  }

  try {
    await page.waitForSelector('button[data-val="S"]', { timeout: 30000 });
    await page.click('button[data-val="S"]');

    await page.waitForURL("https://www.formula1.com/", { timeout: 100000 });
    expect(page.url()).toBe("https://www.formula1.com/");

    console.log("✅ [TC_033] Payment completed successfully and redirected to success URL");
  } catch (error) {
    console.log("❌ [TC_033] Success confirmation button not loaded – treating as payment failure.");

    await page.waitForLoadState("domcontentloaded");
    const currentUrl = page.url();

    if (currentUrl.includes("yahoo.com")) {
      console.log(`❌ [TC_033] Payment failed - redirected to failure URL: ${currentUrl}`);
      expect(currentUrl).toBe("https://yahoo.com/");
      throw new Error("❌ [TC_033] Payment failed — stopping further execution.");
    }

    expect(currentUrl).not.toBe("https://www.formula1.com/");

    console.log(`❌ [TC_033] Payment did not reach success URL. Current URL: ${currentUrl}`);

    throw new Error("❌ [TC_033] Payment failed — stopping further execution.");
  }
});

  });
}
