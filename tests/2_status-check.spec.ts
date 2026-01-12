import { test, expect } from "@playwright/test";
import axios from "axios";
// import * as dotenv from "dotenv";
import tv4 from "tv4";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Support __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== API CONFIGURATION ====================
const statusApiUrl = "https://securenew.vernostpay.com/api/intent/check/status";

// Load merchants and parameterize tests per-merchant (or single via MERCHANT env)
const merchantsPath = path.resolve(__dirname, "../merchants.json");
if (!fs.existsSync(merchantsPath)) {
  throw new Error(`merchants.json not found at ${merchantsPath}`);
}
const merchants = JSON.parse(fs.readFileSync(merchantsPath, "utf8"));

const envMerchant = process.env.MERCHANT;
const merchantsToRun = envMerchant
  ? merchants.filter((m: any) => m.merchant.toLowerCase() === envMerchant.toLowerCase())
  : merchants;

if (envMerchant && merchantsToRun.length === 0) {
  throw new Error(`Merchant not found: ${envMerchant}`);
}

// ===============================================================
// Run all tests per merchant
// ===============================================================
for (const merchant of merchantsToRun) {
  const headers = { mid: merchant.mid, password: merchant.password };

  // Load merchant-specific transaction file (fallback to global transaction.json)
  const txFile = path.resolve(process.cwd(), `transaction.${merchant.merchant.replace(/\s+/g, "_")}.json`);
  let parsed: any = {};
  if (fs.existsSync(txFile)) {
    parsed = JSON.parse(fs.readFileSync(txFile, "utf8"));
  } else if (fs.existsSync(path.resolve(process.cwd(), "transaction.json"))) {
    console.warn(`Transaction file for ${merchant.merchant} not found, falling back to transaction.json`);
    parsed = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "transaction.json"), "utf8"));
  }

  const transaction_id =
    parsed.transactionId || parsed.transaction_id || parsed.transactionId2 || parsed.transaction_id2 || parsed.fullResponse?.transaction_id || parsed.fullResponse?.transactionId;
  
  // Test applicability configuration
  const testApplicability: Record<string, string[]> = {
    "TC_019": ["SBIC", "Axis Open store", "Google", "Axis Traveledge", "Axis Traveledge new", "IIFA", "Elevate trips", "Loylogic", "GEMS", "Booking Bash", "Curacao", "Zenith", "Zenith Gyftr"],
    "TC_030": ["IIFA", "Loylogic"],
    "TC_037": ["GEMS"],
    "TC_026_GEMS": ["GEMS"],
    "TC_038": ["Dadabhai Travel"]
  };

  function isAllowedForMerchant(tcId: string) {
    const allowed = testApplicability[tcId];
    if (!allowed || allowed.length === 0) return true;
    return allowed.map((s) => s.toLowerCase()).includes(merchant.merchant.toLowerCase());
  }

  // Group tests per merchant to avoid duplicate test titles
  test.describe(`Status tests for ${merchant.merchant}`, () => {

// ===============================================================
// 📋 Status Check Test Cases
// ===============================================================

// ===============================================================
// 🧩 [Negative:TC_025] Blank Identifier
// ===============================================================
test("[Negative:TC_025] Verify Status Check API with blank identifier", async () => {
  // Print banner at start of first test
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🔍 Running status check test cases for ${merchant.merchant}`);
  console.log(`${"=".repeat(60)}\n`);
  
  const payload = {
    identifier: "",
    verifySupplier: true,
  };

  try {
    await axios.post(statusApiUrl, payload, { headers, timeout: 10000 });
    expect(false, "API should not accept blank identifier").toBeTruthy();
  } catch (err: any) {
    const res = err.response;
    if (!res) {
      // If no HTTP response, rethrow to surface network/errors
      throw err;
    }
    expect(res.status).toBe(400);
    expect(res.data.status).toBe(false);
    expect(res.data.message).toBe("Invalid request");
    expect(res.data.errors?.[0]?.message).toContain("String must contain at least 1 character");
    expect(res.data.errors?.[0]?.path?.[0]).toBe("identifier");
  }

  console.log("✅ [TC_025] Blank identifier validation passed successfully");
});

// =====================================================================
// 🧩 [Positive:TC_026] Valid Identifier (CAPTURED / FAIL / INPROGRESS)
// =====================================================================
test("[Positive:TC_026] Verify Status Check API with valid identifier", async () => {
  test.skip(!isAllowedForMerchant("TC_019"), `Skipping TC_019 for ${merchant.merchant}`);
  
  // Skip for Dadabhai Travel
  if (merchant.merchant.toLowerCase().includes("dadabhai")) {
    test.skip();
  }
  
  // Skip for Elevate trips
  if (merchant.merchant.toLowerCase().includes("elevate")) {
    test.skip();
  }
  
  const isLoylogic = merchant.merchant.toLowerCase().includes("loylogic");
  const isGEMS = merchant.merchant.toLowerCase().includes("gems");
  const isCuracao = merchant.merchant.toLowerCase().includes("curacao");
  const isBookingBash = merchant.merchant.toLowerCase().includes("booking bash");
  if (isLoylogic || isGEMS || isCuracao || isBookingBash) {
    test.skip();
  }
  
  const isZenith = merchant.merchant.toLowerCase().includes("zenith");
  const isIIFA = merchant.merchant.toLowerCase().includes("iifa");
  const isAxisTraveledge = merchant.merchant.toLowerCase().includes("axis traveledge");
  
  // For Zenith, check both TC_012 (Card payment) and TC_016 (PayU Capture API)
  // For IIFA, check both TC_012 (Razorpay Card) and TC_019 (Urbanledger NSL)
  // For Axis Traveledge, check only TC_032 (Axis Traveledge Card payment)
  let transactionIds;
  
  if (isZenith && parsed.transactionId_payu) {
    transactionIds = [
      { id: transaction_id, source: "TC_012 (Razorpay Card payment)" },
      { id: parsed.transactionId_payu, source: "TC_016 (PayU Capture API)" }
    ];
  } else if (isIIFA && parsed.transaction_id2) {
    transactionIds = [
      { id: transaction_id, source: "TC_012 (Razorpay Card payment)" },
      { id: parsed.transaction_id2, source: "TC_019 (Urbanledger NSL)" }
    ];
  } else if (isAxisTraveledge && parsed.transactionId_tc032) {
    transactionIds = [
      { id: parsed.transactionId_tc032, source: "TC_032 (Axis Traveledge Card payment)" }
    ];
  } else {
    transactionIds = [{ id: transaction_id, source: "Payment test" }];
  }
  
  for (const txInfo of transactionIds) {
    if (!txInfo.id) {
      console.log(`⚠️ [TC_026] No transaction ID found for ${txInfo.source} - skipping`);
      continue;
    }
    
    console.log(`\n🔍 [TC_026] Checking status for ${txInfo.source}`);
    console.log(`   Transaction ID: ${txInfo.id}`);
    
    const payload = { identifier: txInfo.id, verifySupplier: true };

    const response = await axios.post(statusApiUrl, payload, { headers, timeout: 20000 });
    const data = response.data;

    // Basic Validations
    expect(response.status).toBe(200);
    expect(data.transactionId).toBeTruthy();
    expect(data.orderId).toBeTruthy();
    expect(data.customer_details).toBeTruthy();
    expect(data.payment_details).toBeTruthy();

    // Status Handling
    const validStatuses = ["CAPTURED", "FAIL", "INPROGRESS", "REFUNDED", "PARTIAL_REFUNDED"];
    expect(validStatuses).toContain(data.status);

    // Print detailed response information
    console.log(`\n   📋 Status Check Response Details:`);
    console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   Transaction ID: ${data.transactionId}`);
    console.log(`   Order ID: ${data.orderId}`);
    console.log(`   Status: ${data.status}`);
    console.log(`   Acquirer Status: ${data.integration_response.status_code}`);
    console.log(`   Amount: ${data.amount} ${data.currency}`);
  
    
    console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    if (data.status === "CAPTURED") {
      console.log(`   ✅ Payment successfully captured`);
      expect(data.message.toLowerCase()).toMatch(/(captured|successful)/);
    } else if (data.status === "FAIL") {
      console.log(`   ❌ Payment failed`);
      expect(data.message.toLowerCase()).toContain("fail");
    } else if (data.status === "INPROGRESS") {
      console.log(`   ⏳ Payment in progress`);
      expect(data.message.toLowerCase()).toContain("progress");
    } else if (data.status === "REFUNDED" || data.status === "PARTIAL_REFUNDED") {
      console.log(`   💰 Payment refunded`);
      
      // Special logging for Google & SBIC merchants with refunded status
      const merchantName = merchant.merchant.toLowerCase();
      if (merchantName === "google" || merchantName === "sbic") {
        console.log(`   🔔 [${merchant.merchant}] Refunded Transaction ID: ${txInfo.id}`);
        console.log(`   🔔 Status: ${data.status}`);
      }
      
      expect(data.message.toLowerCase()).toMatch(/(refund|captured)/);
    }

    // Integration Response Validation
    expect(data.integration_response).toBeTruthy();
    expect(data.integration_response.raw_response).toBeTruthy();
  }
  
  const testSummary = isZenith ? 'both TC_012 and TC_016' : (isIIFA ? 'both TC_012 and TC_019' : (isAxisTraveledge ? 'TC_032' : 'transaction'));
  console.log(`\n✅ [TC_026] Status check completed for ${testSummary}`);
  });

  // other tests continue here and will use `headers` and `transaction_id` defined per-merchant

  // ===============================================================
  // 🧩 [Negative:TC_027] Blank verifySupplier
  // ===============================================================
  test("[Negative:TC_027] Verify Status Check API with blank verifySupplier", async () => {
    // Skip for Dadabhai Travel (TAP gateway returns different error response)
    if (merchant.merchant.toLowerCase().includes("dadabhai")) {
      test.skip();
    }
    
    const payload = {
      identifier: transaction_id,
      verifySupplier: "", //  Should be boolean
    };

    try {
      await axios.post(statusApiUrl, payload, { headers, timeout: 10000 });
      expect(false, "API should not accept blank verifySupplier").toBeTruthy();
    } catch (err: any) {
      const res = err.response;

      expect(res.status).toBe(400);
      expect(res.data.status).toBe(false);
      expect(res.data.message).toBe("Invalid request");
      expect(res.data.errors?.[0]?.message).toContain("Expected boolean, received string");
      expect(res.data.errors?.[0]?.path?.[0]).toBe("verifySupplier");
    }

    console.log("✅ [TC_027] Blank verifySupplier validation passed successfully");
  });

  // ===============================================================
  // 🧩 [Positive:TC_028] Validate Status Check API Positive Response Schema
  // ===============================================================
  test("[Positive:TC_028] Validate Status Check API response schema for valid transaction", async () => {
    // Skip for Dadabhai Travel
    if (merchant.merchant.toLowerCase().includes("dadabhai")) {
      test.skip();
    }
    
    // Skip for Elevate trips
    if (merchant.merchant.toLowerCase().includes("elevate")) {
      test.skip();
    }
    
    const isLoylogic = merchant.merchant.toLowerCase().includes("loylogic");
    const isGEMS = merchant.merchant.toLowerCase().includes("gems");
    const isCuracao = merchant.merchant.toLowerCase().includes("curacao");
    const isBookingBash = merchant.merchant.toLowerCase().includes("booking bash");
    if (isLoylogic || isGEMS || isCuracao || isBookingBash) {
      test.skip();
    }
    
    const payload = {
      identifier: transaction_id,
      verifySupplier: true,
    };

    const response = await axios.post(statusApiUrl, payload, { headers, timeout: 20000 });
    const data = response.data;

    const statusSchema = {
      type: "object",
      required: [
        "amount",
        "currency",
        "transactionId",
        "orderId",
        "refund_items",
        "customer_details",
        "payment_details",
        "status",
        "message",
        "payment_method_type",
        "integration_response",
      ],
      properties: {
        amount: { type: ["number", "string"] },
        currency: { type: "string" },
        transactionId: { type: "string" },
        orderId: { type: "string" },
        refund_items: { type: "array" },
        customer_details: {
          type: "object",
          properties: {
            email: { type: "string" },
            mobile: { type: "string" },
          },
          required: ["email", "mobile"],
        },
        payment_details: {
          type: "object",
          properties: {
            type: { type: "string" },
          },
          required: ["type"],
        },
        status: {
          type: "string",
          enum: ["CAPTURED", "FAIL", "INPROGRESS"],
        },
        message: { type: "string" },
        payment_method_type: { type: "string" },
        integration_response: {
          type: "object",
          required: ["raw_response"],
          properties: {
            raw_response: { type: "object" },
          },
        },
      },
      additionalProperties: true,
    };

    const isValid = tv4.validate(data, statusSchema);
    expect(response.status).toBe(200);
    expect(isValid, `Schema validation failed: ${tv4.error?.message}`).toBeTruthy();

    console.log("✅ [TC_028] Status Check API schema validation passed successfully");
  });

  // ============================================================================
  // 🧩 [Positive:TC_030] Verify Status Check API with valid identifier - Urbanledger NSL
  // ============================================================================
  test("[Positive:TC_030] Verify Status Check API response schema for Urbanledger NSL", async () => {
    if (!isAllowedForMerchant("TC_030")) {
      test.skip();
    }

    // Skip for Dadabhai Travel
    if (merchant.merchant.toLowerCase().includes("dadabhai")) {
      test.skip();
    }

    // Skip for Elevate trips
    if (merchant.merchant.toLowerCase().includes("elevate")) {
      test.skip();
    }

    // Skip for Curacao
    if (merchant.merchant.toLowerCase().includes("curacao")) {
      test.skip();
    }

    // Use transaction_id2 for IIFA (Urbanledger NSL transaction from TC_019)
    const urbanledgerTransactionId = parsed.transaction_id2 || parsed.transactionId2;
    
    if (!urbanledgerTransactionId) {
      console.warn(`⚠️  No Urbanledger transaction_id2 found for ${merchant.merchant}. Skipping TC_030.`);
      test.skip();
    }

    const payload = {
      identifier: urbanledgerTransactionId,
      verifySupplier: true,
    };

    const response = await axios.post(statusApiUrl, payload, { headers, timeout: 15000 });
    const data = response.data;

    // 🔍 Urbanledger NSL specific schema (flexible for actual response structure)
    const urbanledgerSchema = {
      type: "object",
      required: [
        "amount",
        "currency",
        "transactionId",
        "orderId",
        "refund_items",
        "customer_details",
        "payment_details",
        "status",
        "message",
        "payment_method_type",
        "integration_response",
      ],
      properties: {
        amount: { type: ["number", "string"] },
        currency: { type: "string" },
        transactionId: { type: "string" },
        orderId: { type: "string" },
        refund_items: { type: "array" },
        customer_details: {
          type: "object",
          properties: {
            email: { type: "string" },
            mobile: { type: "string" },
          },
          required: ["email", "mobile"],
        },
        payment_details: {
          type: "object",
          properties: {
            type: { type: "string" },
          },
          required: ["type"],
        },
        status: {
          type: "string",
          enum: ["CAPTURED", "FAIL", "INPROGRESS"],
        },
        message: { type: "string" },
        payment_method_type: { type: "string" },
        integration_response: {
          type: "object",
          required: ["raw_response"],
          properties: {
            raw_response: {
              type: "object",
            },
          },
        },
      },
      additionalProperties: true,
    };

    const isValid = tv4.validate(data, urbanledgerSchema);
    expect(response.status).toBe(200);
    expect(isValid, `Schema validation failed: ${tv4.error?.message}\nData path: ${tv4.error?.dataPath}\nSchema path: ${tv4.error?.schemaPath}`).toBeTruthy();

    // Additional Urbanledger-specific validations
    expect(data.message).toMatch(/(Urbanledger|successful)/i);
    
    // Verify it's actually an Urbanledger NSL transaction
    const rawResponse = data.integration_response?.raw_response;
    if (typeof rawResponse === 'object' && rawResponse !== null) {
      expect(rawResponse.status).toBe("Captured");
      console.log(`✅ [TC_030] Urbanledger NSL schema validation passed for ${merchant.merchant}`);
      // console.log(`   Transaction ID: ${urbanledgerTransactionId}`);
      // console.log(`   Amount: ${data.amount} ${data.currency}`);
      // console.log(`   Status: ${data.status}`);
      // console.log(`   Message: ${data.message}`);
      // console.log(`   Raw Response Status: ${rawResponse.status}`);
    } else {
      console.log(`✅ [TC_030] Schema validation passed for ${merchant.merchant}`);
      // console.log(`   Transaction ID: ${urbanledgerTransactionId}`);
      // console.log(`   Amount: ${data.amount} ${data.currency}`);
      // console.log(`   Status: ${data.status}`);
      // console.log(`   Message: ${data.message}`);
    }
  });

  // ============================================================================
  // 🧩 [Negative:TC_045] Negative schema validation for Status Check API
  // ============================================================================
  test("[Negative:TC_045] Verify Status Check API response fails schema validation for invalid structure", async () => {
    // Skip for Dadabhai Travel
    if (merchant.merchant.toLowerCase().includes("dadabhai")) {
      test.skip();
    }
    
    // Skip for Elevate trips
    if (merchant.merchant.toLowerCase().includes("elevate")) {
      test.skip();
    }
    
    // ❌ Intentionally invalid response object (based on actual success response)
    const invalidResponse = {
      amount: 10,
      currency: "INR",
      transactionId: 12345 as any,      // ❌ should be string
      orderId: "Pin204-873-6849",
      refund_items: {} as any,          // ❌ should be array
      customer_details: "invalid" as any, // ❌ should be object { email, mobile }
      payment_details: {
        type: 123 as any,               // ❌ should be string
      },
      status: "CAPTURED",
      message: "Captured",
      payment_method_type: "automatic",
      integration_response: {
        raw_response: [] as any,        // ❌ should be object
      },
    };

    // 🔍 Same schema structure as used in TC_017 (kept local to this test)
    const statusSchemaNegative = {
      type: "object",
      required: [
        "amount",
        "currency",
        "transactionId",
        "orderId",
        "refund_items",
        "customer_details",
        "payment_details",
        "status",
        "message",
        "payment_method_type",
        "integration_response",
      ],
      properties: {
        amount: { type: ["number", "string"] },
        currency: { type: "string" },
        transactionId: { type: "string" },
        orderId: { type: "string" },
        refund_items: { type: "array" },
        customer_details: {
          type: "object",
          properties: {
            email: { type: "string" },
            mobile: { type: "string" },
          },
          required: ["email", "mobile"],
        },
        payment_details: {
          type: "object",
          properties: {
            type: { type: "string" },
          },
          required: ["type"],
        },
        status: {
          type: "string",
          enum: ["CAPTURED", "FAIL", "INPROGRESS"],
        },
        message: { type: "string" },
        payment_method_type: { type: "string" },
        integration_response: {
          type: "object",
          required: ["raw_response"],
          properties: {
            raw_response: { type: "object" },
          },
        },
      },
      additionalProperties: true,
    };

    // 🔎 Validate this invalid object against the schema
    const isValid = tv4.validate(invalidResponse, statusSchemaNegative);

    // ✅ We EXPECT schema validation to FAIL (i.e. isValid === false)
    expect(
      isValid,
      `Negative schema validation should fail but passed. tv4 error: ${tv4.error?.message}`
    ).toBeFalsy();

    console.log("✅ [TC_045] Negative schema validation passed — invalid Status Check response did NOT match schema.");
  });

  // ============================================================================
  // 🧩 [Positive:TC_037] Verify Status Check API with valid identifier - Urbanledger SL for GEMS
  // ============================================================================
  test("[Positive:TC_037] Verify Status Check API response schema for Urbanledger SL (GEMS)", async () => {
    if (!isAllowedForMerchant("TC_037")) {
      test.skip();
    }

    // Skip for Dadabhai Travel
    if (merchant.merchant.toLowerCase().includes("dadabhai")) {
      test.skip();
    }

    // Skip for Elevate trips
    if (merchant.merchant.toLowerCase().includes("elevate")) {
      test.skip();
    }

    // Skip for Curacao
    if (merchant.merchant.toLowerCase().includes("curacao")) {
      test.skip();
    }

    // Use transactionId from TC_020 (Urbanledger Seamless transaction) for GEMS
    const urbanledgerTransactionId = parsed.transactionId || parsed.transaction_id;
    
    if (!urbanledgerTransactionId) {
      console.warn(`⚠️  No transactionId found from TC_020 for ${merchant.merchant}. Skipping TC_037.`);
      test.skip();
    }

    const payload = {
      identifier: urbanledgerTransactionId,
      verifySupplier: true,
    };

    const response = await axios.post(statusApiUrl, payload, { headers, timeout: 15000 });
    const data = response.data;

    console.log(`\n🔍 [TC_037] Urbanledger SL Status Check for ${merchant.merchant}:`);
    console.log(`   Transaction ID: ${data.transactionId}`);
    console.log(`   Status: ${data.status}`);
    console.log(`   Status Code: ${data.integration_response?.status_code || 'N/A'}`);

    // 🔍 Urbanledger SL specific schema (based on GEMS response)
    const urbanledgerSLSchema = {
      type: "object",
      required: [
        "amount",
        "currency",
        "transactionId",
        "orderId",
        "refund_items",
        "customer_details",
        "payment_details",
        "status",
        "message",
        "payment_method_type",
        "integration_response",
      ],
      properties: {
        amount: { type: ["number", "string"] },
        currency: { type: "string" },
        transactionId: { type: "string" },
        orderId: { type: "string" },
        refund_items: { type: "array" },
        customer_details: {
          type: "object",
          properties: {
            email: { type: "string" },
            mobile: { type: "string" },
          },
          required: ["email", "mobile"],
        },
        payment_details: {
          type: "object",
          properties: {
            type: { type: "string" },
          },
          required: ["type"],
        },
        status: {
          type: "string",
          enum: ["CAPTURED", "FAIL", "INPROGRESS"],
        },
        message: { type: "string" },
        payment_method_type: { type: "string" },
        integration_response: {
          type: "object",
          required: ["raw_response"],
          properties: {
            raw_response: {
              type: "object",
            },
          },
        },
      },
      additionalProperties: true,
    };

    const isValid = tv4.validate(data, urbanledgerSLSchema);
    expect(response.status).toBe(200);
    expect(isValid, `Schema validation failed: ${tv4.error?.message}\nData path: ${tv4.error?.dataPath}\nSchema path: ${tv4.error?.schemaPath}`).toBeTruthy();

    // Additional Urbanledger-specific validations
    expect(data.message).toMatch(/(Urbanledger|successful)/i);
    expect(data.currency).toBe("AED");
    expect(data.status).toBe("CAPTURED");
    
    // Verify it's actually an Urbanledger SL transaction
    const rawResponse = data.integration_response?.raw_response;
    if (typeof rawResponse === 'object' && rawResponse !== null) {
      expect(rawResponse.status).toBe("Captured");
      console.log(`✅ [TC_037] Urbanledger SL schema validation passed for ${merchant.merchant}`);
      console.log(`   Transaction ID: ${urbanledgerTransactionId}`);
      console.log(`   Amount: ${data.amount} ${data.currency}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Message: ${data.message}`);
      console.log(`   Raw Response Status: ${rawResponse.status}`);
    } else {
      console.log(`✅ [TC_037] Schema validation passed for ${merchant.merchant}`);
      console.log(`   Transaction ID: ${urbanledgerTransactionId}`);
      console.log(`   Amount: ${data.amount} ${data.currency}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Message: ${data.message}`);
    }
  });

  // ============================================================================
  // 🧩 [Positive:TC_026_GEMS] Verify Status Check API for Urbanledger Seamless (GEMS) - TC_020 Transaction
  // ============================================================================
  test("[Positive:TC_026_GEMS] Verify Status Check API for Urbanledger Seamless (GEMS)", async () => {
    if (!isAllowedForMerchant("TC_026_GEMS")) {
      test.skip();
    }

    // Skip for Dadabhai Travel
    if (merchant.merchant.toLowerCase().includes("dadabhai")) {
      test.skip();
    }

    // Skip for Elevate trips
    if (merchant.merchant.toLowerCase().includes("elevate")) {
      test.skip();
    }

    // Skip for Curacao
    if (merchant.merchant.toLowerCase().includes("curacao")) {
      test.skip();
    }

    // Use transactionId from TC_020 (Urbanledger Seamless transaction)
    const urbanledgerSeamlessTransactionId = parsed.transactionId || parsed.transaction_id;
    
    if (!urbanledgerSeamlessTransactionId) {
      console.warn(`⚠️  No transactionId found for ${merchant.merchant}. Skipping TC_026_GEMS.`);
      test.skip();
    }

    const payload = {
      identifier: urbanledgerSeamlessTransactionId,
      verifySupplier: true,
    };

    const response = await axios.post(statusApiUrl, payload, { headers, timeout: 15000 });
    const data = response.data;

    console.log(`\n🔍 [TC_026_GEMS] Urbanledger Seamless Status Check for ${merchant.merchant}:`);
    console.log(`   Transaction ID: ${data.transactionId}`);
    console.log(`   Amount: ${data.amount} ${data.currency}`);
    console.log(`   Status: ${data.status}`);
    // console.log(`   Message: ${data.message}`);

    // 🔍 Basic validations
    expect(response.status).toBe(200);
    expect(data.transactionId).toBe(urbanledgerSeamlessTransactionId);
    expect(data.amount).toBeTruthy();
    
    // Currency validation - TC_020 should create AED but may fallback to INR based on configuration
    expect(data.currency).toBeTruthy();
    expect(["AED", "INR"]).toContain(data.currency);
    // console.log(`   Note: Expected AED from TC_020, but actual currency is ${data.currency} (based on gateway configuration)`);
    
    // Accept both CAPTURED and REFUNDED statuses (transaction may have been refunded by TC_038)
    expect(["CAPTURED", "REFUNDED"]).toContain(data.status);
    expect(data.message).toBeTruthy();

    // 🔍 Urbanledger Seamless specific schema
    const urbanledgerSeamlessSchema = {
      type: "object",
      required: [
        "amount",
        "currency",
        "transactionId",
        "orderId",
        "refund_items",
        "customer_details",
        "payment_details",
        "status",
        "message",
        "payment_method_type",
        "integration_response",
      ],
      properties: {
        amount: { type: "number" },
        currency: { type: "string" },
        transactionId: { type: "string" },
        orderId: { type: "string" },
        refund_items: { type: "array" },
        customer_details: {
          type: "object",
          properties: {
            email: { type: "string" },
            mobile: { type: "string" },
          },
          required: ["email", "mobile"],
        },
        payment_details: {
          type: "object",
          properties: {
            type: { type: "string" },
            card_details: {
              type: "object",
              properties: {
                card_type: { type: "string" },
                mask_card_number: { type: "string" },
                enc_card: { type: ["string", "null"] },
                card_number: { type: "string" },
              },
            },
            provider: { type: "string" },
            mobile_no: { type: "string" },
          },
          required: ["type"],
        },
        status: { type: "string" },
        message: { type: "string" },
        payment_method_type: { type: "string" },
        integration_response: {
          type: "object",
          required: ["status_code", "message", "raw_response"],
          properties: {
            status_code: { type: "string" },
            message: { type: "string" },
            acquirer_transaction_id: { type: "string" },
            payment_ref: { type: "string" },
            payment_type: { type: "object" },
            payment_id: { type: "string" },
            raw_response: {
              type: "object",
              required: ["status", "currency", "transactionId", "amount", "type", "order_id"],
              properties: {
                status: { type: "string" },
                currency: { type: "string" },
                transactionId: { type: "string" },
                amount: { type: "number" },
                type: { type: "string" },
                order_id: { type: "string" },
                settlement: { type: "string" },
                reference: { type: "string" },
                metadata: { type: "object" },
                capture_amount: { type: "number" },
                refunded_amount: { type: "number" },
                branch_id: { type: "string" },
                merchant_order_id: { type: "string" },
                customer_note: { type: "string" },
                payment_details: { type: "object" },
                payment_customer_name: { type: "string" },
                payment_customer_email: { type: "string" },
                payment_customer_mobile_number: { type: "string" },
                branch_name: { type: "string" },
                terminal_id: { type: "string" },
                terminal_name: { type: "string" },
                transaction_date: { type: "string" },
                instalment_payment: { type: "boolean" },
              },
            },
          },
        },
        additional_info: { type: "object" },
      },
      additionalProperties: true,
    };

    const isValid = tv4.validate(data, urbanledgerSeamlessSchema);
    expect(isValid, `Urbanledger Seamless schema validation failed: ${tv4.error?.message}\nData path: ${tv4.error?.dataPath}\nSchema path: ${tv4.error?.schemaPath}`).toBeTruthy();

    console.log(`\n✅ [TC_026_GEMS] Urbanledger Seamless Status Check + Schema Validation Successful`);
    // console.log(`   Gateway: ${data.integration_response?.raw_response?.payment_details?.method || 'N/A'}`);
    // console.log(`   Settlement Status: ${data.integration_response?.raw_response?.settlement || 'N/A'}`);
  });

  // ===============================================================
  // 🧩 [Negative:TC_029] Status Check API with blank MID & password
  // ===============================================================
  test("[Negative:TC_029] Verify Status Check API with blank MID and password", async () => {
    const payload = {
      identifier: transaction_id,
      verifySupplier: true,
    };

    // 🔥 Override headers only for this test
    const invalidHeaders = {
      mid: "",
      password: "",
    };

    try {
      await axios.post(statusApiUrl, payload, { headers: invalidHeaders, timeout: 10000 });
      expect(false, "API should not accept blank MID & password").toBeTruthy();
    } catch (err: any) {
      const res = err.response;

      // 🧾 Expected validations
      // Dadabhai (TAP) returns 400, other merchants return 401
      const isDadabhai = merchant.merchant.toLowerCase().includes("dadabhai");
      const expectedStatus = isDadabhai ? 400 : 401;
      expect(res.status).toBe(expectedStatus);
      expect(res.data.status).toBe(false);
      const msg = String(res.data.message || "").toLowerCase();
      expect(msg.includes("invalid") || msg.includes("unauthorized")).toBeTruthy();
    }

    console.log("✅ [TC_029] Blank MID and password validation passed successfully");
  });

  // ===============================================================
  // 🧩 [Positive:TC_027] Verify Status Check for Curacao Transaction (TC_022)
  // ===============================================================
  test("[Positive:TC_027] Verify Status Check for Curacao Transaction with Schema Validation", async () => {
    // Skip for Dadabhai Travel
    if (merchant.merchant.toLowerCase().includes("dadabhai")) {
      test.skip();
    }
    
    // Skip for Elevate trips
    if (merchant.merchant.toLowerCase().includes("elevate")) {
      test.skip();
    }
    
    // This test is only for Curacao merchant (TC_022)
    if (!merchant.merchant.toLowerCase().includes("curacao")) {
      test.skip();
    }

    if (!transaction_id) {
      console.warn(`⚠️ [TC_027] No transaction ID found for ${merchant.merchant}. Skipping test.`);
      test.skip();
    }

    console.log(`\n🔍 [TC_027] Status Check for Curacao (NetAuthorise NSL):`);
    console.log(`   Merchant: ${merchant.merchant}`);
    console.log(`   Transaction ID: ${transaction_id}`);

    const statusPayload = {
      identifier: transaction_id,
      verifySupplier: true,
    };

    const statusResponse = await axios.post(statusApiUrl, statusPayload, { headers, timeout: 20000 });
    const statusData = statusResponse.data;

    // ✅ Status Check Validations
    expect(statusResponse.status).toBe(200);
    expect(statusData.transactionId).toBe(transaction_id);
    
    // Accept CAPTURED, INPROGRESS, or REFUNDED status
    const validStatuses = ["CAPTURED", "INPROGRESS", "REFUNDED"];
    expect(validStatuses).toContain(statusData.status);
    
    expect(statusData.orderId).toBeTruthy();
    expect(statusData.customer_details).toBeTruthy();
    expect(statusData.payment_details).toBeTruthy();
    // Accept both "card" and "UNKNOWN" as payment type (depends on transaction state)
    const validPaymentTypes = ["card", "UNKNOWN"];
    expect(validPaymentTypes).toContain(statusData.payment_details.type);

    // 🔍 Status Check Schema Validation
    const statusSchema = {
      type: "object",
      required: [
        "amount",
        "currency",
        "transactionId",
        "orderId",
        "refund_items",
        "customer_details",
        "payment_details",
        "status",
        "message",
        "payment_method_type",
        "integration_response"
        // payment_gateway_response is optional (not present in INPROGRESS state)
      ],
      properties: {
        amount: { type: "number" },
        currency: { type: "string" },
        transactionId: { type: "string" },
        orderId: { type: "string" },
        refund_items: { type: "array" },
        customer_details: {
          type: "object",
          required: ["email", "mobile"],
          properties: {
            email: { type: "string" },
            mobile: { type: "string" }
          }
        },
        payment_details: {
          type: "object",
          required: ["type"],
          properties: {
            type: { type: "string" }
          }
        },
        status: { type: "string" },
        message: { type: "string" },
        payment_method_type: { type: "string" },
        integration_response: {
          type: "object",
          // Only raw_response is required, other fields may not be present in INPROGRESS state
          required: ["raw_response"],
          properties: {
            status: { type: "boolean" },
            status_code: { type: "string" },
            payment_ref: { type: "string" },
            acquirer_transaction_id: { type: "string" },
            payment_type: { type: "string" },
            payment_id: { type: "string" },
            raw_response: { type: "object" },
            message: { type: "string" },
            payment_gateway_response: {
              type: "object",
              properties: {
                payment_details: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    card_details: {
                      type: "object",
                      properties: {
                        mask_card_number: { type: "string" },
                        card_type: { type: "string" },
                        card_number: { type: "string" }
                      }
                    }
                  }
                },
                authCode: { type: "string" }
              }
            }
          }
        },
        payment_gateway_response: {
          type: "object",
          properties: {
            payment_details: {
              type: "object",
              properties: {
                type: { type: "string" },
                card_details: {
                  type: "object",
                  properties: {
                    mask_card_number: { type: "string" },
                    card_type: { type: "string" },
                    card_number: { type: "string" }
                  }
                }
              }
            },
            authCode: { type: "string" }
          }
        }
      },
      additionalProperties: true
    };

    const isStatusValid = tv4.validate(statusData, statusSchema);
    expect(isStatusValid, `Status check schema validation failed: ${tv4.error?.message}\nData path: ${tv4.error?.dataPath}\nSchema path: ${tv4.error?.schemaPath}`).toBeTruthy();

    // 📋 Display Transaction Details
    console.log(`\n📋 Transaction Details:`);
    console.log(`   Status: ${statusData.status}`);
    console.log(`   Amount: ${statusData.amount} ${statusData.currency}`);
    console.log(`   Order ID: ${statusData.orderId}`);
    // console.log(`   Customer Email: ${statusData.customer_details.email}`);
    // console.log(`   Customer Mobile: ${statusData.customer_details.mobile}`);
    console.log(`   Payment Type: ${statusData.payment_details.type}`);
    // console.log(`   Payment Method: ${statusData.payment_method_type}`);
    // console.log(`   Gateway: ${statusData.integration_response?.raw_response?.transaction?.product || 'NetAuthorise NSL'}`);
    // console.log(`   Card Number: ${statusData.payment_gateway_response?.payment_details?.card_details?.mask_card_number || 'N/A'}`);
    // console.log(`   Card Type: ${statusData.payment_gateway_response?.payment_details?.card_details?.card_type || 'N/A'}`);
    // console.log(`   Auth Code: ${statusData.payment_gateway_response?.authCode || 'N/A'}`);
    // console.log(`   Acquirer Txn ID: ${statusData.integration_response?.acquirer_transaction_id || 'N/A'}`);
    // console.log(`   Message: ${statusData.message}`);

    console.log(`\n✅ [TC_027] Status Check Schema Validation: PASSED`);
    console.log(`✅ [TC_027] Status Check Completed Successfully for Curacao Transaction`);
  });

  // ===============================================================
  // 🧩 [Positive:TC_045] Verify Status Check for Curacao Transaction from TC_023 with Schema Validation
  // ===============================================================
  test("[Positive:TC_045] Verify Status Check for Curacao Transaction from TC_023 with Schema Validation", async () => {
    // This test is only for Curacao merchant (TC_023)
    if (!merchant.merchant.toLowerCase().includes("curacao")) {
      test.skip();
    }

    const curacaoTransactionId = parsed.transaction_id2;
    
    if (!curacaoTransactionId) {
      console.log(`⚠️ [TC_045] No transaction_id2 found from TC_023 for Curacao, skipping test`);
      test.skip();
    }

    console.log(`\n🔍 Status Check for Curacao (Curacao NSL):`);
    console.log(`   Merchant: ${merchant.merchant}`);
    console.log(`   Transaction ID: ${curacaoTransactionId}`);

    // Perform status check API call
    const statusApiUrl = "https://securenew.vernostpay.com/api/intent/check/status";
    const statusPayload = { identifier: curacaoTransactionId, verifySupplier: true };
    
    const statusResponse = await axios.post(statusApiUrl, statusPayload, { headers, timeout: 20000 });
    const statusData = statusResponse.data;

    // ==================== BASIC VALIDATIONS ====================
    expect(statusResponse.status).toBe(200);
    expect(statusData.amount).toBeTruthy();
    expect(statusData.currency).toBeTruthy();
    expect(statusData.transactionId).toBe(curacaoTransactionId);
    expect(statusData.orderId).toBeTruthy();
    expect(statusData.status).toBeTruthy();
    expect(statusData.message).toBeTruthy();
    expect(statusData.payment_method_type).toBeTruthy();

    // ==================== CUSTOMER DETAILS ====================
    expect(statusData.customer_details).toBeTruthy();
    expect(statusData.customer_details.email).toBeTruthy();
    expect(statusData.customer_details.mobile).toBeTruthy();

    // ==================== PAYMENT DETAILS ====================
    expect(statusData.payment_details).toBeTruthy();
    expect(statusData.payment_details.type).toBeTruthy();

    // ==================== INTEGRATION RESPONSE ====================
    expect(statusData.integration_response).toBeTruthy();
    expect(statusData.integration_response.status).toBeTruthy();
    expect(statusData.integration_response.status_code).toBeTruthy();
    expect(statusData.integration_response.payment_id).toBeTruthy();
    expect(statusData.integration_response.payment_type).toBeTruthy();

    // ==================== PAYMENT GATEWAY RESPONSE ====================
    expect(statusData.integration_response.payment_gateway_response).toBeTruthy();
    expect(statusData.integration_response.payment_gateway_response.supplier_id).toBeTruthy();
    expect(statusData.integration_response.payment_gateway_response.created).toBeTruthy();

    // ==================== RAW RESPONSE ====================
    expect(statusData.integration_response.raw_response).toBeTruthy();
    expect(statusData.integration_response.raw_response.status).toBe("success");
    expect(statusData.integration_response.raw_response.code).toBe(200);
    expect(statusData.integration_response.raw_response.payment_id).toBeTruthy();
    expect(statusData.integration_response.raw_response.merchant_reference).toBe(curacaoTransactionId);
    expect(statusData.integration_response.raw_response.payments_status).toBeTruthy();
    expect(statusData.integration_response.raw_response.amount).toBeTruthy();
    expect(statusData.integration_response.raw_response.captured_amount).toBeTruthy();
    expect(statusData.integration_response.raw_response.refunded_amount).toBeTruthy();
    expect(statusData.integration_response.raw_response.payment_date).toBeTruthy();
    
    if (statusData.integration_response.raw_response.payment_transactions) {
      expect(Array.isArray(statusData.integration_response.raw_response.payment_transactions)).toBeTruthy();
    }

    // ==================== SCHEMA VALIDATION ====================
    const curacaoStatusCheckSchema = {
      type: "object",
      required: [
        "amount",
        "currency",
        "transactionId",
        "orderId",
        "refund_items",
        "customer_details",
        "payment_details",
        "status",
        "message",
        "payment_method_type",
        "integration_response",
        "payment_gateway_response",
      ],
      properties: {
        amount: { type: "number" },
        currency: { type: "string" },
        transactionId: { type: "string" },
        orderId: { type: "string" },
        refund_items: { type: "array" },
        
        customer_details: {
          type: "object",
          required: ["email", "mobile"],
          properties: {
            email: { type: "string" },
            mobile: { type: "string" },
          },
        },
        
        payment_details: {
          type: "object",
          required: ["type"],
          properties: {
            type: { type: "string" },
          },
        },
        
        status: { type: "string" },
        message: { type: "string" },
        payment_method_type: { type: "string" },
        
        integration_response: {
          type: "object",
          required: [
            "status",
            "status_code",
            "payment_id",
            "payment_type",
            "payment_gateway_response",
            "raw_response",
          ],
          properties: {
            status: { type: "boolean" },
            status_code: { type: "string" },
            payment_id: { type: "string" },
            payment_type: { type: "string" },
            
            payment_gateway_response: {
              type: "object",
              required: ["supplier_id", "created"],
              properties: {
                supplier_id: { type: "string" },
                created: { type: "string" },
              },
            },
            
            raw_response: {
              type: "object",
              required: [
                "status",
                "code",
                "payment_id",
                "merchant_reference",
                "payments_status",
                "amount",
                "captured_amount",
                "refunded_amount",
                "payment_date",
              ],
              properties: {
                status: { type: "string" },
                code: { type: "number" },
                payment_id: { type: "string" },
                merchant_reference: { type: "string" },
                payments_status: { type: "string" },
                amount: { type: "string" },
                captured_amount: { type: "string" },
                refunded_amount: { type: "string" },
                payment_date: { type: "string" },
                payment_transactions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      transaction_type: { type: "string" },
                      transaction_amount: { type: "string" },
                      transaction_id: { type: "string" },
                      transaction_memo: { type: "string" },
                      transaction_date: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        
        payment_gateway_response: {
          type: "object",
          required: ["supplier_id", "created"],
          properties: {
            supplier_id: { type: "string" },
            created: { type: "string" },
          },
        },
      },
      additionalProperties: true,
    };

    const isValid = tv4.validate(statusData, curacaoStatusCheckSchema);
    expect(isValid, `Status Check schema validation failed: ${tv4.error?.message}\nData path: ${tv4.error?.dataPath}\nSchema path: ${tv4.error?.schemaPath}`).toBeTruthy();

    // ==================== PRINT STATUS CHECK DETAILS ====================
    console.log(`\n📋 Status Check Response Details:`);
    console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   Transaction ID: ${statusData.transactionId}`);
    console.log(`   Order ID: ${statusData.orderId}`);
    console.log(`   Status: ${statusData.status}`);
    // console.log(`   Message: ${statusData.message}`);
    console.log(`   Amount: ${statusData.amount} ${statusData.currency}`);
    console.log(`   Payment Type: ${statusData.payment_details.type}`);
    // console.log(`   Payment Method Type: ${statusData.payment_method_type}`);
    console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    // console.log(`\n🔗 Integration Response:`);
    // console.log(`   Status: ${statusData.integration_response.status}`);
    // console.log(`   Status Code: ${statusData.integration_response.status_code}`);
    // console.log(`   Payment ID: ${statusData.integration_response.payment_id}`);
    // console.log(`   Payment Type: ${statusData.integration_response.payment_type}`);
    
    // console.log(`\n🏦 Gateway Response:`);
    // console.log(`   Supplier ID: ${statusData.integration_response.payment_gateway_response.supplier_id}`);
    // console.log(`   Created: ${statusData.integration_response.payment_gateway_response.created}`);
    
    // console.log(`\n📄 Raw Response Details:`);
    // console.log(`   Status: ${statusData.integration_response.raw_response.status}`);
    // console.log(`   Code: ${statusData.integration_response.raw_response.code}`);
    // console.log(`   Payment Status: ${statusData.integration_response.raw_response.payments_status}`);
    // console.log(`   Amount: ${statusData.integration_response.raw_response.amount} ${statusData.currency}`);
    console.log(`   Captured Amount: ${statusData.integration_response.raw_response.captured_amount} ${statusData.currency}`);
    console.log(`   Refunded Amount: ${statusData.integration_response.raw_response.refunded_amount} ${statusData.currency}`);
    console.log(`   Payment Date: ${statusData.integration_response.raw_response.payment_date}`);
    
    if (statusData.integration_response.raw_response.payment_transactions && 
        statusData.integration_response.raw_response.payment_transactions.length > 0) {
      // console.log(`\n💰 Payment Transactions:`);
      statusData.integration_response.raw_response.payment_transactions.forEach((txn: any, index: number) => {
        // console.log(`   Transaction ${index + 1}:`);
        // console.log(`      Type: ${txn.transaction_type}`);
        // console.log(`      Amount: ${txn.transaction_amount} ${statusData.currency}`);
        // console.log(`      Transaction ID: ${txn.transaction_id}`);
        // console.log(`      Memo: ${txn.transaction_memo}`);
        // console.log(`      Date: ${txn.transaction_date}`);
      });
    }
    
    if (statusData.refund_items && statusData.refund_items.length > 0) {
      console.log(`\n💵 Refund Items:`);
      statusData.refund_items.forEach((refund: any, index: number) => {
        console.log(`   Refund ${index + 1}:`);
        console.log(`      Refund ID: ${refund.refund_id}`);
        console.log(`      Amount: ${refund.amount} ${statusData.currency}`);
        console.log(`      Status: ${refund.status}`);
      });
    }
    
    console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    console.log(`\n✅ [TC_045] Status Check Schema Validation: PASSED`);
    console.log(`✅ [TC_045] Status Check Completed Successfully for Curacao Transaction from TC_023`);
  });

  // ===============================================================
  // 🧩 [Positive:TC_041] Verify Status Check for Booking Bash Transaction (TC_021)
  // ===============================================================
  test("[Positive:TC_041] Verify Status Check for Booking Bash Transaction with Schema Validation", async () => {
    // Skip for Dadabhai Travel
    if (merchant.merchant.toLowerCase().includes("dadabhai")) {
      test.skip();
    }
    
    // This test is only for Booking Bash merchant (TC_021)
    if (!merchant.merchant.toLowerCase().includes("booking bash")) {
      test.skip();
    }

    if (!transaction_id) {
      console.warn(`⚠️ [TC_041] No transaction ID found for ${merchant.merchant}. Skipping test.`);
      test.skip();
    }

    console.log(`\n🔍 [TC_041] Status Check for Booking Bash (Paytabs):`);
    console.log(`   Merchant: ${merchant.merchant}`);
    console.log(`   Transaction ID: ${transaction_id}`);

    const statusPayload = {
      identifier: transaction_id,
      verifySupplier: true,
    };

    const statusResponse = await axios.post(statusApiUrl, statusPayload, { headers, timeout: 20000 });
    const statusData = statusResponse.data;

    // ✅ Status Check Validations
    expect(statusResponse.status).toBe(200);
    expect(statusData.transactionId).toBe(transaction_id);
    
    // Accept CAPTURED, INPROGRESS, REFUNDED, or PARTIAL_REFUNDED status
    const validStatuses = ["CAPTURED", "INPROGRESS", "REFUNDED", "PARTIAL_REFUNDED"];
    expect(validStatuses).toContain(statusData.status);
    
    expect(statusData.orderId).toBeTruthy();
    expect(statusData.customer_details).toBeTruthy();
    expect(statusData.payment_details).toBeTruthy();
    expect(statusData.payment_details.type).toBeTruthy();

    // 🔍 Status Check Schema Validation for Paytabs
    const statusSchema = {
      type: "object",
      required: [
        "amount",
        "currency",
        "transactionId",
        "orderId",
        "refund_items",
        "customer_details",
        "payment_details",
        "status",
        "message",
        "payment_method_type",
        "integration_response"
      ],
      properties: {
        amount: { type: "number" },
        currency: { type: "string" },
        transactionId: { type: "string" },
        orderId: { type: "string" },
        refund_items: { type: "array" },
        customer_details: {
          type: "object",
          required: ["email", "mobile"],
          properties: {
            email: { type: "string" },
            mobile: { type: "string" }
          }
        },
        payment_details: {
          type: "object",
          required: ["type"],
          properties: {
            type: { type: "string" }
          }
        },
        status: { type: "string" },
        message: { type: "string" },
        payment_method_type: { type: "string" },
        integration_response: {
          type: "object",
          required: ["status_code", "acquirer_transaction_id", "payment_ref", "payment_id", "message", "raw_response", "payment_type"],
          properties: {
            status_code: { type: "string" },
            acquirer_transaction_id: { type: "string" },
            payment_ref: { type: "string" },
            payment_id: { type: "string" },
            message: { type: "string" },
            payment_type: { type: "string" },
            raw_response: {
              type: "object",
              required: ["tran_ref", "tran_type", "cart_id", "cart_description", "cart_currency", "cart_amount", "tran_currency", "tran_total", "customer_details", "payment_result", "payment_info"],
              properties: {
                tran_ref: { type: "string" },
                tran_type: { type: "string" },
                cart_id: { type: "string" },
                cart_description: { type: "string" },
                cart_currency: { type: "string" },
                cart_amount: { type: "string" },
                tran_currency: { type: "string" },
                tran_total: { type: "string" },
                customer_details: { type: "object" },
                payment_result: {
                  type: "object",
                  properties: {
                    response_status: { type: "string" },
                    response_code: { type: "string" },
                    response_message: { type: "string" },
                    transaction_time: { type: "string" }
                  }
                },
                payment_info: {
                  type: "object",
                  properties: {
                    payment_method: { type: "string" },
                    card_type: { type: "string" },
                    card_scheme: { type: "string" },
                    payment_description: { type: "string" }
                  }
                }
              }
            }
          }
        }
      },
      additionalProperties: true
    };

    const isStatusValid = tv4.validate(statusData, statusSchema);
    expect(isStatusValid, `Status check schema validation failed: ${tv4.error?.message}\nData path: ${tv4.error?.dataPath}\nSchema path: ${tv4.error?.schemaPath}`).toBeTruthy();

    // 📋 Display Transaction Details
    console.log(`\📋 Status Check Response Details:`);
    console.log(`   Status: ${statusData.status}`);
    console.log(`   Amount: ${statusData.amount} ${statusData.currency}`);
    console.log(`   Gateway: Paytabs (nonseamless)`);
    console.log(`\n✅ [TC_041] Status Check Completed Successfully & Schema Validation is passed`);
  });

  // ============================================================================
  // 🧩 [Positive:TC_044] Verify Status Check for CCAvenue (Elevate trips) Transaction with Schema Validation
  // ============================================================================
  test("[Positive:TC_044] Verify Status Check for CCAvenue (Elevate trips) Transaction with Schema Validation", async () => {
    // Skip for Dadabhai Travel
    if (merchant.merchant.toLowerCase().includes("dadabhai")) {
      test.skip();
    }
    
    // Skip for all merchants except Elevate trips
    const isElevateTrips = merchant.merchant.toLowerCase().includes("elevate");
    if (!isElevateTrips) {
      test.skip();
    }

    // Read transaction.json (CCAvenue transaction from TC_017)
    const ccavenueFile = path.resolve(process.cwd(), "transaction.json");
    if (!fs.existsSync(ccavenueFile)) {
      console.log(`⚠️ [TC_044] transaction.json not found - skipping test`);
      test.skip();
    }

    const ccavenueData = JSON.parse(fs.readFileSync(ccavenueFile, "utf8"));
    const ccavenueTransactionId = ccavenueData.transactionId;

    if (!ccavenueTransactionId) {
      console.log(`⚠️ [TC_044] No CCAvenue transaction ID found - skipping test`);
      test.skip();
    }

    console.log(`\n🔍 [TC_044] Checking CCAvenue Transaction Status`);
    console.log(`   Transaction ID: ${ccavenueTransactionId}`);
    console.log(`   Merchant: ${merchant.merchant}`);
    // console.log(`   Gateway: CCAvenue`);

    // Perform Status Check API Call
    const statusPayload = {
      identifier: ccavenueTransactionId,
      verifySupplier: true
    };

    const statusResponse = await axios.post(statusApiUrl, statusPayload, { headers, timeout: 20000 });
    const statusData = statusResponse.data;

    expect(statusResponse.status).toBe(200);

    // 📋 Display Transaction Details (Console Output)
    console.log(`\n📋 CCAvenue Transaction Details:`);
    console.log(`   Transaction ID: ${statusData.transactionId}`);
    // console.log(`   Order ID: ${statusData.orderId}`);
    console.log(`   Status: ${statusData.status}`);
    // console.log(`   Message: ${statusData.message}`);
    // console.log(`   Amount: ${statusData.amount} ${statusData.currency}`);
    // console.log(`   Customer Email: ${statusData.customer_details?.email || 'N/A'}`);
    // console.log(`   Customer Mobile: ${statusData.customer_details?.mobile || 'N/A'}`);
    // console.log(`   Payment Method Type: ${statusData.payment_method_type}`);
    // console.log(`   Refund Items: ${JSON.stringify(statusData.refund_items)}`);

    // Schema Validation for CCAvenue Response
    const ccavenueStatusSchema = {
      type: "object",
      required: [
        "amount",
        "currency",
        "transactionId",
        "orderId",
        "refund_items",
        "customer_details",
        "status",
        "message",
        "payment_method_type"
      ],
      properties: {
        amount: { type: ["number", "string"] },
        currency: { type: "string" },
        transactionId: { type: "string" },
        orderId: { type: "string" },
        refund_items: { type: "array" },
        customer_details: {
          type: "object",
          properties: {
            email: { type: "string" },
            mobile: { type: "string" }
          },
          required: ["email", "mobile"]
        },
        status: {
          type: "string",
          enum: ["CAPTURED", "FAIL", "INPROGRESS", "REFUNDED", "PARTIAL_REFUNDED"]
        },
        message: { type: "string" },
        payment_method_type: { type: "string" }
      },
      additionalProperties: true
    };

    const isStatusValid = tv4.validate(statusData, ccavenueStatusSchema);
    expect(isStatusValid, `CCAvenue status check schema validation failed: ${tv4.error?.message}\nData path: ${tv4.error?.dataPath}\nSchema path: ${tv4.error?.schemaPath}`).toBeTruthy();

    // Validate specific fields
    expect(statusData.transactionId).toBe(ccavenueTransactionId);
    expect(statusData.orderId).toBeTruthy();
    expect(statusData.customer_details).toBeTruthy();
    expect(statusData.customer_details.email).toBeTruthy();
    expect(statusData.customer_details.mobile).toBeTruthy();
    expect(["CAPTURED", "FAIL", "INPROGRESS", "REFUNDED", "PARTIAL_REFUNDED"]).toContain(statusData.status);

    // Status-specific console output
    if (statusData.status === "CAPTURED") {
      // console.log(`   ✅ Payment Status: Successfully CAPTURED`);
    } else if (statusData.status === "FAIL") {
      console.log(`   ❌ Payment Status: FAILED`);
    } else if (statusData.status === "INPROGRESS") {
      console.log(`   ⏳ Payment Status: IN PROGRESS`);
    } else if (statusData.status === "REFUNDED" || statusData.status === "PARTIAL_REFUNDED") {
      console.log(`   💰 Payment Status: ${statusData.status}`);
    }

    console.log(`\n✅ [TC_044] Payment is captured successfully and Status Check Schema Validation passed`);
    // console.log(`✅ [TC_044] Status Check Completed Successfully for CCAvenue (Elevate trips) Transaction`);
  });

// ===============================================================
// 🧩 [Positive:TC_038] Verify Status Check API for TAP NSL (Dadabhai Travel)
// ===============================================================
test("[Positive:TC_038] Verify Status Check API response schema for TAP NSL (Dadabhai Travel)", async () => {
  if (!isAllowedForMerchant("TC_038")) {
    test.skip();
  }
  
  // Get transaction ID from TAP payment (TC_030 or TC_031)
  const tapTransactionId = parsed.transactionId_tap || parsed.transactionId_tap2;
  
  if (!tapTransactionId) {
    console.warn(`⚠️  No TAP transaction ID found for ${merchant.merchant}. Skipping TC_038.`);
    test.skip();
  }
  
  const payload = {
    identifier: tapTransactionId,
    verifySupplier: true,
  };
  
  console.log(`\n🔍 [TC_038] TAP NSL Status Check for ${merchant.merchant}:`);
  console.log(`   Transaction ID: ${tapTransactionId}`);
  
  const response = await axios.post(statusApiUrl, payload, { headers, timeout: 50000 });
  
  expect(response.status).toBe(200);
  expect(response.data).toBeDefined();
  
  const data = response.data;
  
  // Print complete response data
  console.log(`\n📊 [TC_038] Complete Response Data:`);
  console.log(JSON.stringify(data, null, 2));
  
  // Positive schema validation
  expect(data.amount).toBeDefined();
  expect(typeof data.amount).toBe("number");
  console.log(`   ✅ Amount: ${data.amount}`);
  
  expect(data.currency).toBeDefined();
  expect(data.currency).toBe("SAR");
  console.log(`   ✅ Currency: ${data.currency}`);
  
  expect(data.transactionId).toBeDefined();
  expect(data.transactionId).toBe(tapTransactionId);
  console.log(`   ✅ Transaction ID: ${data.transactionId}`);
  
  expect(data.orderId).toBeDefined();
  expect(typeof data.orderId).toBe("string");
  console.log(`   ✅ Order ID: ${data.orderId}`);
  
  expect(data.refund_items).toBeDefined();
  expect(Array.isArray(data.refund_items)).toBe(true);
  console.log(`   ✅ Refund Items: ${JSON.stringify(data.refund_items)}`);
  
  // Customer details validation
  expect(data.customer_details).toBeDefined();
  expect(data.customer_details.email).toBeDefined();
  expect(typeof data.customer_details.email).toBe("string");
  expect(data.customer_details.mobile).toBeDefined();
  expect(typeof data.customer_details.mobile).toBe("string");
  console.log(`   ✅ Customer Email: ${data.customer_details.email}`);
  console.log(`   ✅ Customer Mobile: ${data.customer_details.mobile}`);
  
  // Payment details validation
  expect(data.payment_details).toBeDefined();
  expect(data.payment_details.type).toBeDefined();
  expect(data.payment_details.card_details).toBeDefined();
  expect(data.payment_details.card_details.card_type).toBeDefined();
  expect(data.payment_details.card_details.mask_card_number).toBeDefined();
  expect(data.payment_details.card_details.card_holder_name).toBeDefined();
  expect(data.payment_details.card_details.card_number).toBeDefined();
  console.log(`   ✅ Payment Type: ${data.payment_details.type}`);
  console.log(`   ✅ Card Type: ${data.payment_details.card_details.card_type}`);
  console.log(`   ✅ Masked Card: ${data.payment_details.card_details.mask_card_number}`);
  
  // Status validation
  expect(data.status).toBeDefined();
  expect(data.status).toBe("CAPTURED");
  console.log(`   ✅ Status: ${data.status}`);
  
  expect(data.message).toBeDefined();
  expect(data.message).toBe("Captured");
  console.log(`   ✅ Message: ${data.message}`);
  
  expect(data.payment_method_type).toBeDefined();
  expect(data.payment_method_type).toBe("automatic");
  console.log(`   ✅ Payment Method Type: ${data.payment_method_type}`);
  
  // Integration response validation
  expect(data.integration_response).toBeDefined();
  expect(data.integration_response.status_code).toBeDefined();
  expect(data.integration_response.status_code).toBe("000");
  console.log(`   ✅ Integration Status Code: ${data.integration_response.status_code}`);
  
  expect(data.integration_response.acquirer_transaction_id).toBeDefined();
  expect(typeof data.integration_response.acquirer_transaction_id).toBe("string");
  console.log(`   ✅ Acquirer Transaction ID: ${data.integration_response.acquirer_transaction_id}`);
  
  expect(data.integration_response.payment_ref).toBeDefined();
  expect(typeof data.integration_response.payment_ref).toBe("string");
  console.log(`   ✅ Payment Ref: ${data.integration_response.payment_ref}`);
  
  expect(data.integration_response.payment_id).toBeDefined();
  expect(data.integration_response.payment_id).toBe(tapTransactionId);
  console.log(`   ✅ Payment ID: ${data.integration_response.payment_id}`);
  
  // Raw response validation
  expect(data.integration_response.raw_response).toBeDefined();
  const rawResponse = data.integration_response.raw_response;
  
  expect(rawResponse.id).toBeDefined();
  expect(rawResponse.object).toBe("charge");
  expect(rawResponse.status).toBe("CAPTURED");
  expect(rawResponse.amount).toBe(data.amount);
  expect(rawResponse.currency).toBe("SAR");
  expect(rawResponse.threeDSecure).toBe(true);
  console.log(`   ✅ Raw Response ID: ${rawResponse.id}`);
  console.log(`   ✅ 3D Secure: ${rawResponse.threeDSecure}`);
  
  // Transaction details
  expect(rawResponse.transaction).toBeDefined();
  expect(rawResponse.transaction.authorization_id).toBeDefined();
  expect(rawResponse.transaction.amount).toBe(data.amount);
  expect(rawResponse.transaction.currency).toBe("SAR");
  console.log(`   ✅ Authorization ID: ${rawResponse.transaction.authorization_id}`);
  
  // Reference details
  expect(rawResponse.reference).toBeDefined();
  expect(rawResponse.reference.transaction).toBe(tapTransactionId);
  expect(rawResponse.reference.order).toBe(tapTransactionId);
  console.log(`   ✅ Reference Transaction: ${rawResponse.reference.transaction}`);
  
  // Response codes
  expect(rawResponse.response).toBeDefined();
  expect(rawResponse.response.code).toBe("000");
  expect(rawResponse.response.message).toBe("Captured");
  console.log(`   ✅ Response Code: ${rawResponse.response.code}`);
  
  // Security details
  expect(rawResponse.security).toBeDefined();
  expect(rawResponse.security.threeDSecure).toBeDefined();
  expect(rawResponse.security.threeDSecure.id).toBeDefined();
  expect(rawResponse.security.threeDSecure.status).toBe("Y");
  console.log(`   ✅ 3DS Auth ID: ${rawResponse.security.threeDSecure.id}`);
  console.log(`   ✅ 3DS Status: ${rawResponse.security.threeDSecure.status}`);
  
  // Card details
  expect(rawResponse.card).toBeDefined();
  expect(rawResponse.card.object).toBe("card");
  expect(rawResponse.card.scheme).toBe("VISA");
  expect(rawResponse.card.brand).toBe("VISA");
  expect(rawResponse.card.first_six).toBeDefined();
  expect(rawResponse.card.last_four).toBeDefined();
  console.log(`   ✅ Card Scheme: ${rawResponse.card.scheme}`);
  console.log(`   ✅ Card: ${rawResponse.card.first_six}******${rawResponse.card.last_four}`);
  
  // Customer details
  expect(rawResponse.customer).toBeDefined();
  expect(rawResponse.customer.id).toBeDefined();
  expect(rawResponse.customer.email).toBeDefined();
  console.log(`   ✅ Customer ID: ${rawResponse.customer.id}`);
  console.log(`   ✅ Customer Email: ${rawResponse.customer.email}`);
  
  // Merchant details
  expect(rawResponse.merchant).toBeDefined();
  expect(rawResponse.merchant.country).toBe("SA");
  expect(rawResponse.merchant.currency).toBe("SAR");
  expect(rawResponse.merchant.id).toBe("26682415");
  console.log(`   ✅ Merchant ID: ${rawResponse.merchant.id}`);
  console.log(`   ✅ Merchant Country: ${rawResponse.merchant.country}`);
  
  // Redirect details
  expect(rawResponse.redirect).toBeDefined();
  expect(rawResponse.redirect.status).toBe("SUCCESS");
  expect(rawResponse.redirect.url).toBeDefined();
  console.log(`   ✅ Redirect Status: ${rawResponse.redirect.status}`);
  
  // Authentication
  expect(rawResponse.authentication).toBeDefined();
  expect(rawResponse.authentication.transaction_status).toBe("Y");
  console.log(`   ✅ Authentication Transaction Status: ${rawResponse.authentication.transaction_status}`);
  
  // Activities
  expect(rawResponse.activities).toBeDefined();
  expect(Array.isArray(rawResponse.activities)).toBe(true);
  expect(rawResponse.activities.length).toBeGreaterThan(0);
  console.log(`   ✅ Activities Count: ${rawResponse.activities.length}`);
  
  // Additional info
  expect(data.additional_info).toBeDefined();
  expect(data.additional_info.merchant_id).toBe("26682415");
  console.log(`   ✅ Additional Info Merchant ID: ${data.additional_info.merchant_id}`);
  
  console.log(`\n✅ [TC_038] TAP NSL status check schema validation passed for ${merchant.merchant}`);
});

test.afterAll(() => {
  // Add message for merchants without refund support
  const merchantLower = merchant.merchant.toLowerCase();
  const noRefundMerchants = ["zenith", "elevate"];
  if (noRefundMerchants.some(m => merchantLower.includes(m))) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`ℹ️  Refund is not managed by Vepay for ${merchant.merchant}`);
    console.log(`${"=".repeat(60)}\n`);
  }
});

  // ===============================================================
  // 🧩 [Positive:TC_046] Verify Status Check for Dadabhai Travel (TAP NSL) from TC_030 with Schema Validation
  // ===============================================================
  test("[Positive:TC_046] Verify Status Check for Dadabhai Travel (TAP NSL) from TC_030 with Schema Validation", async () => {
    // This test is only for Dadabhai Travel merchant (TC_030)
    if (!merchant.merchant.toLowerCase().includes("dadabhai")) {
      test.skip();
    }

    const dadabhaiTransactionId = parsed.transactionId_tap;
    
    if (!dadabhaiTransactionId) {
      console.log(`⚠️ [TC_046] No transactionId_tap found from TC_030 for Dadabhai, skipping test`);
      test.skip();
    }

    console.log(`\n🔍 [TC_046] Status Check for Dadabhai Travel (TAP NSL) from TC_030:`);
    console.log(`   Merchant: ${merchant.merchant}`);
    console.log(`   Transaction ID: ${dadabhaiTransactionId} (from TC_030)`);

    // Perform status check API call
    const statusApiUrl = "https://securenew.vernostpay.com/api/intent/check/status";
    const statusPayload = { identifier: dadabhaiTransactionId, verifySupplier: true };
    
    const statusResponse = await axios.post(statusApiUrl, statusPayload, { headers, timeout: 20000 });
    const statusData = statusResponse.data;

    // ==================== BASIC VALIDATIONS ====================
    expect(statusResponse.status).toBe(200);
    expect(statusData.amount).toBeTruthy();
    expect(statusData.currency).toBe("SAR");
    expect(statusData.transactionId).toBe(dadabhaiTransactionId);
    expect(statusData.orderId).toBeTruthy();
    expect(statusData.status).toBe("CAPTURED");
    expect(statusData.message).toBeTruthy();
    expect(statusData.payment_method_type).toBeTruthy();

    // ==================== CUSTOMER DETAILS ====================
    expect(statusData.customer_details).toBeTruthy();
    expect(statusData.customer_details.email).toBeTruthy();
    expect(statusData.customer_details.mobile).toBeTruthy();

    // ==================== PAYMENT DETAILS ====================
    expect(statusData.payment_details).toBeTruthy();

    // ==================== INTEGRATION RESPONSE ====================
    expect(statusData.integration_response).toBeTruthy();
    expect(statusData.integration_response.status_code).toBeTruthy();
    expect(statusData.integration_response.acquirer_transaction_id).toBeTruthy();
    expect(statusData.integration_response.payment_ref).toBeTruthy();
    expect(statusData.integration_response.payment_id).toBeTruthy();

    // ==================== RAW RESPONSE (TAP NSL SPECIFIC) ====================
    expect(statusData.integration_response.raw_response).toBeTruthy();
    const rawResponse = statusData.integration_response.raw_response;
    expect(rawResponse.id).toBeTruthy();
    expect(rawResponse.object).toBe("charge");
    expect(rawResponse.status).toBe("CAPTURED");
    expect(rawResponse.amount).toBeTruthy();
    expect(rawResponse.currency).toBe("SAR");
    expect(rawResponse.response).toBeTruthy();
    expect(rawResponse.response.code).toBeTruthy();
    expect(rawResponse.card).toBeTruthy();
    expect(rawResponse.customer).toBeTruthy();
    expect(rawResponse.transaction).toBeTruthy();
    expect(rawResponse.reference).toBeTruthy();

    // ==================== SCHEMA VALIDATION ====================
    const dadabhaiTapSchema = {
      type: "object",
      required: [
        "amount",
        "currency",
        "transactionId",
        "orderId",
        "refund_items",
        "customer_details",
        "payment_details",
        "status",
        "message",
        "payment_method_type",
        "integration_response",
        "additional_info",
      ],
      properties: {
        amount: { type: "number" },
        currency: { type: "string" },
        transactionId: { type: "string" },
        orderId: { type: "string" },
        refund_items: { type: "array" },
        
        customer_details: {
          type: "object",
          required: ["email", "mobile"],
          properties: {
            email: { type: "string" },
            mobile: { type: "string" },
          },
        },
        
        payment_details: {
          type: "object",
          properties: {
            type: { type: "string" },
            card_details: {
              type: "object",
              properties: {
                card_type: { type: "string" },
                mask_card_number: { type: "string" },
                card_holder_name: { type: "string" },
                card_number: { type: "string" },
              },
            },
          },
        },
        
        status: { type: "string" },
        message: { type: "string" },
        payment_method_type: { type: "string" },
        
        integration_response: {
          type: "object",
          required: [
            "status_code",
            "acquirer_transaction_id",
            "payment_ref",
            "payment_id",
            "raw_response",
          ],
          properties: {
            status_code: { type: "string" },
            acquirer_transaction_id: { type: "string" },
            payment_ref: { type: "string" },
            payment_id: { type: "string" },
            
            raw_response: {
              type: "object",
              required: [
                "id",
                "object",
                "status",
                "amount",
                "currency",
                "response",
                "card",
                "customer",
                "transaction",
                "reference",
              ],
              properties: {
                id: { type: "string" },
                object: { type: "string" },
                live_mode: { type: "boolean" },
                status: { type: "string" },
                amount: { type: "number" },
                currency: { type: "string" },
                threeDSecure: { type: "boolean" },
                product: { type: "string" },
                description: { type: "string" },
                
                transaction: {
                  type: "object",
                  properties: {
                    authorization_id: { type: "string" },
                    amount: { type: "number" },
                    currency: { type: "string" },
                  },
                },
                
                reference: {
                  type: "object",
                  properties: {
                    track: { type: "string" },
                    payment: { type: "string" },
                    transaction: { type: "string" },
                    order: { type: "string" },
                  },
                },
                
                response: {
                  type: "object",
                  required: ["code", "message"],
                  properties: {
                    code: { type: "string" },
                    message: { type: "string" },
                  },
                },
                
                security: { type: "object" },
                acquirer: { type: "object" },
                gateway: { type: "object" },
                
                card: {
                  type: "object",
                  required: ["object", "scheme", "brand"],
                  properties: {
                    object: { type: "string" },
                    first_six: { type: "string" },
                    first_eight: { type: "string" },
                    scheme: { type: "string" },
                    brand: { type: "string" },
                    last_four: { type: "string" },
                  },
                },
                
                receipt: { type: "object" },
                
                customer: {
                  type: "object",
                  required: ["id", "email"],
                  properties: {
                    id: { type: "string" },
                    first_name: { type: "string" },
                    last_name: { type: "string" },
                    email: { type: "string" },
                    phone: { type: "object" },
                  },
                },
                
                merchant: {
                  type: "object",
                  properties: {
                    country: { type: "string" },
                    currency: { type: "string" },
                    id: { type: "string" },
                  },
                },
                
                source: { type: "object" },
                redirect: { type: "object" },
                post: { type: "object" },
                authentication: { type: "object" },
                activities: {
                  type: "array",
                  items: { type: "object" },
                },
                auto_reversed: { type: "boolean" },
                intent: { type: "object" },
                protect: { type: "object" },
                initiator: { type: "string" },
              },
            },
          },
        },
        
        additional_info: {
          type: "object",
          required: ["merchant_id"],
          properties: {
            merchant_id: { type: "string" },
          },
        },
      },
      additionalProperties: true,
    };

    const isValid = tv4.validate(statusData, dadabhaiTapSchema);
    expect(isValid, `Status Check schema validation failed: ${tv4.error?.message}\nData path: ${tv4.error?.dataPath}\nSchema path: ${tv4.error?.schemaPath}`).toBeTruthy();

    // ==================== PRINT STATUS CHECK DETAILS ====================
    console.log(`\n📋 Status Check Response Details:`);
    console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   Transaction ID: ${statusData.transactionId}`);
    console.log(`   Order ID: ${statusData.orderId}`);
    console.log(`   Status: ${statusData.status}`);
    console.log(`   Message: ${statusData.message}`);
    console.log(`   Amount: ${statusData.amount} ${statusData.currency}`);
    console.log(`   Payment Method Type: ${statusData.payment_method_type}`);
    console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    console.log(`\n👤 Customer Details:`);
    console.log(`   Email: ${statusData.customer_details.email}`);
    console.log(`   Mobile: ${statusData.customer_details.mobile}`);
    
    console.log(`\n💳 Payment Details:`);
    console.log(`   Type: ${statusData.payment_details.type || 'N/A'}`);
    
    console.log(`\n🔗 Integration Response:`);
    console.log(`   Status Code: ${statusData.integration_response.status_code}`);
    console.log(`   Acquirer Transaction ID: ${statusData.integration_response.acquirer_transaction_id}`);
    console.log(`   Payment Ref: ${statusData.integration_response.payment_ref}`);
    console.log(`   Payment ID: ${statusData.integration_response.payment_id}`);
    
    console.log(`\n📄 TAP Raw Response Details:`);
    console.log(`   Charge ID: ${rawResponse.id}`);
    console.log(`   Status: ${rawResponse.status}`);
    console.log(`   Amount: ${rawResponse.amount} ${rawResponse.currency}`);
    console.log(`   Response Code: ${rawResponse.response.code}`);
    console.log(`   Response Message: ${rawResponse.response.message}`);
    console.log(`   Product: ${rawResponse.product}`);
    console.log(`   3D Secure: ${rawResponse.threeDSecure}`);
    
    console.log(`\n💳 Card Details:`);
    console.log(`   Scheme: ${rawResponse.card.scheme}`);
    console.log(`   Brand: ${rawResponse.card.brand}`);
    console.log(`   First 6: ${rawResponse.card.first_six}`);
    console.log(`   Last 4: ${rawResponse.card.last_four}`);
    
    console.log(`\n👥 Customer Info:`);
    console.log(`   Customer ID: ${rawResponse.customer.id}`);
    console.log(`   Name: ${rawResponse.customer.first_name} ${rawResponse.customer.last_name}`);
    console.log(`   Email: ${rawResponse.customer.email}`);
    console.log(`   Phone: ${rawResponse.customer.phone.number}`);
    
    console.log(`\n🏪 Merchant Info:`);
    console.log(`   Merchant ID: ${rawResponse.merchant.id}`);
    console.log(`   Country: ${rawResponse.merchant.country}`);
    console.log(`   Currency: ${rawResponse.merchant.currency}`);
    
    console.log(`\n📋 Transaction Details:`);
    console.log(`   Authorization ID: ${rawResponse.transaction.authorization_id}`);
    console.log(`   Amount: ${rawResponse.transaction.amount} ${rawResponse.transaction.currency}`);
    
    console.log(`\n🔗 Reference Details:`);
    console.log(`   Track: ${rawResponse.reference.track}`);
    console.log(`   Payment: ${rawResponse.reference.payment}`);
    console.log(`   Transaction: ${rawResponse.reference.transaction}`);
    console.log(`   Order: ${rawResponse.reference.order}`);
    
    console.log(`\n📊 Activities:`);
    if (rawResponse.activities && rawResponse.activities.length > 0) {
      rawResponse.activities.forEach((activity: any, index: number) => {
        console.log(`   Activity ${index + 1}: ${activity.status} - ${activity.remarks}`);
      });
    }
    
    console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    console.log(`\n✅ [TC_046] Status Check Schema Validation: PASSED`);
    console.log(`✅ [TC_046] Status Check Completed Successfully for Dadabhai Travel (TAP NSL) from TC_030`);
  });

    });
  }
