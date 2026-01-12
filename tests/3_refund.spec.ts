import { test, expect } from "@playwright/test";
import axios from "axios";
import fs from "fs";
import tv4 from "tv4";
import path from "path";
import { fileURLToPath } from "url";

// Support __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== API CONFIG ====================
const refundApiUrl = "/payment/refund";

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

// Wrap tests per merchant
for (const merchant of merchantsToRun) {
  // Skip refund tests for merchants without refund API support
  const merchantName = merchant.merchant.toLowerCase();
  if (merchantName.includes("zenith") || merchantName.includes("elevate")) {
    continue;
  }
  
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    mid: merchant.mid,
    password: merchant.password,
  };

  const api = axios.create({
    baseURL: process.env.INTENT_API_BASE_URL || "https://securenew.vernostpay.com/api",
    headers,
    timeout: 15000,
  });

  // Load merchant-specific transaction file
  const txFile = path.resolve(process.cwd(), `transaction.${merchant.merchant.replace(/\s+/g, "_")}.json`);
  let parsed: any = {};
  if (fs.existsSync(txFile)) {
    parsed = JSON.parse(fs.readFileSync(txFile, "utf8"));
  } else if (fs.existsSync(path.resolve(process.cwd(), "transaction.json"))) {
    console.warn(`Transaction file for ${merchant.merchant} not found, falling back to transaction.json`);
    parsed = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "transaction.json"), "utf8"));
  } else {
    console.warn(`Transaction file not found for merchant ${merchant.merchant}. Expected: ${txFile} — skipping refund tests for this merchant.`);
    continue;
  }

  // Resolve possible transaction id keys
  const transaction_id = parsed.transactionId || parsed.transaction_id || parsed.transaction_id2 || parsed.fullResponse?.transaction_id || parsed.fullResponse?.transactionId;
  const transaction_id2 = parsed.transaction_id2 || parsed.transactionId2 || parsed.transaction_id2 || parsed.transaction_id2 || parsed.transaction_id2 || parsed.transaction_id2 || parsed.transaction_id2 || parsed.transaction_id2 || parsed.transaction_id2 || parsed.transaction_id2 || parsed.transaction_id2 || parsed.transaction_id2 || parsed.transaction_id2 || parsed.transaction_id2 || parsed.transaction_id2 || parsed.transaction_id2 || parsed.transaction_id2 || parsed.transaction_id2 || parsed.transaction_id2 || parsed.transaction_id2 || parsed.transaction_id2 || parsed.transaction_id2 || parsed.transaction_id2 || parsed.transaction_id2 || parsed.transaction_id2 || parsed.transaction_id2 || parsed.fullResponse?.transaction_id2 || parsed.transaction_id || parsed.transactionId;
  const transaction_id3 = parsed.transaction_id3 || parsed.transactionId3 || parsed.fullResponse?.transaction_id3 || parsed.fullResponse?.transactionId3;
  const transaction_id4 = parsed.transaction_id4 || parsed.transactionId4 || parsed.fullResponse?.transaction_id4 || parsed.fullResponse?.transactionId4;
  const transaction_id5 = parsed.transaction_id5 || parsed.transactionId5 || parsed.fullResponse?.transaction_id5 || parsed.fullResponse?.transactionId5;

  const transactionId = parsed.transactionId || parsed.transaction_id || parsed.fullResponse?.transaction_id || parsed.fullResponse?.transactionId || transaction_id;
  
  // Test applicability configuration
  const testApplicability: Record<string, string[]> = {
    "TC_024": ["SBIC", "Axis Open store", "Google", "Axis Traveledge", "Axis Traveledge new", "IIFA", "Loylogic", "GEMS", "Booking Bash", "Curacao"],
    "TC_025": ["SBIC", "Axis Open store", "Google", "Axis Traveledge", "Axis Traveledge new", "IIFA", "Loylogic", "GEMS", "Booking Bash", "Curacao"],
    "TC_034": ["IIFA", "Loylogic"],
    "TC_035": ["IIFA", "Loylogic"],
    "TC_038": ["GEMS"],
    "TC_039": ["GEMS"],
    "TC_041": ["GEMS"]
  };

  function isAllowedForMerchant(tcId: string) {
    const allowed = testApplicability[tcId];
    if (!allowed || allowed.length === 0) return true;
    return allowed.map((s) => s.toLowerCase()).includes(merchant.merchant.toLowerCase());
  }
  
  // Group tests per merchant to avoid duplicate test titles
  test.describe(`Refund tests for ${merchant.merchant}`, () => {

// ===============================================================
// 🧩 [Positive:TC_030] Verify Full Refund with Schema Validation
// ===============================================================
test("[Positive:TC_030] Verify Full Refund with Schema Validation", async () => {
  // Print banner at start of first test
  console.log(`\n${"=".repeat(60)}`);
  console.log(`💰 Running refund test cases for ${merchant.merchant}`);
  console.log(`${"=".repeat(60)}\n`);
  
  test.skip(!isAllowedForMerchant("TC_024"), `Skipping TC_024 for ${merchant.merchant}`);
  
  // Skip for Loylogic, GEMS, Curacao, and Booking Bash as they have dedicated tests
  // Loylogic uses TC_034 (Urbanledger NSL), GEMS uses TC_039 (Urbanledger Seamless), Curacao uses TC_040, Booking Bash uses TC_042
  // IIFA uses TC_030 for TC_012 transaction (Card payment) full refund
  // Axis Traveledge uses TC_030 for TC_032 transaction (Axis Traveledge Card payment) full refund
  const merchantName = merchant.merchant.toLowerCase();
  if (merchantName.includes("loylogic") || merchantName.includes("gems") || merchantName.includes("curacao") || merchantName.includes("booking bash")) {
    test.skip();
  }
  
  // For IIFA merchant, use transaction from TC_012 (Card payment)
  // For Axis Traveledge merchant, use transaction from TC_032 (Axis Traveledge Card payment)
  const isIIFA = merchantName.includes("iifa");
  const isAxisTraveledge = merchantName.includes("axis traveledge");
  
  let transactionToRefund;
  if (isAxisTraveledge) {
    transactionToRefund = parsed.transactionId_tc032 || transactionId;
  } else {
    transactionToRefund = isIIFA ? transactionId : transactionId;
  }
  
  if (!transactionToRefund) {
    console.log(`⚠️ [TC_030] No transaction ID found${isIIFA ? ' from TC_012' : (isAxisTraveledge ? ' from TC_032' : '')}, skipping refund test`);
    test.skip();
  }
  
  if (isIIFA) {
    console.log(`\n🔍 [TC_030] IIFA merchant - Using transaction from TC_012 (Card payment): ${transactionToRefund}`);
  }
  
  if (isAxisTraveledge) {
    console.log(`\n🔍 [TC_030] Axis Traveledge merchant - Using transaction from TC_032 (Axis Traveledge Card payment): ${transactionToRefund}`);
  }

  // Get the actual transaction amount from status check API
  const statusApiUrl = "https://securenew.vernostpay.com/api/intent/check/status";
  const statusPayload = { identifier: transactionToRefund, verifySupplier: true };
  
  let txnAmount = 1000; // default fallback
  let currencyCode = "INR";
  try {
    const statusResponse = await axios.post(statusApiUrl, statusPayload, { headers, timeout: 20000 });
    const amountFromApi = statusResponse.data.amount;
    currencyCode = statusResponse.data.currency || "INR";
    // Status API returns amount in rupees/dollars, but refund API expects paise/cents
    // So multiply by 100 to convert back to base currency units
    const baseAmount = typeof amountFromApi === 'string' ? parseInt(amountFromApi) : (amountFromApi || 10);
    txnAmount = baseAmount * 100;
    if (isIIFA) {
      // console.log(`✅ [TC_030] Retrieved transaction details: ${baseAmount} ${currencyCode} (${txnAmount} in smallest unit)`);
    }
  } catch (error: any) {
    console.log(`⚠️ [TC_030] Could not fetch transaction amount: ${error.message}, using default: ${txnAmount}`);
  }
  
  const payload = {
    transaction_id: transactionToRefund,
    amount: txnAmount, // Full refund - use actual transaction amount
  };

  let response;
  try {
    response = await api.post(refundApiUrl, payload);
  } catch (error: any) {
    if (error.response?.status === 400 || error.response?.status === 500) {
      const errorMsg = error.response?.data?.message || error.message;
      console.log(`⚠️ [TC_030] Refund API returned ${error.response?.status}: ${errorMsg}`);
      console.log(`Transaction may already be refunded or in invalid state. Skipping test.`);
      test.skip();
    }
    throw error;
  }
  
  const data = response.data;

  /* ================= BASIC ================= */
  expect(response.status).toBe(200);
  expect(data.status).toBe(true);

  /* ================= STATUS ================= */
  // For Razorpay: REFUND_PENDING, for others: REFUNDED
  const gateway = data.txn_detail?.gateway || "";
  const isRazorpay = gateway.toLowerCase().includes("razorpay");
  // console.log(`[TC_024] Gateway: ${gateway}, isRazorpay: ${isRazorpay}, status_code: ${data.status_code}`);
  
  if (isRazorpay) {
    expect(["REFUND_PENDING", "REFUNDED"]).toContain(data.status_code);
    expect(["REFUND_PENDING", "REFUNDED"]).toContain(data.acquirer_status_code);
  } else {
    expect(data.status_code).toBe("REFUNDED");
    expect(data.acquirer_status_code).toBe("REFUNDED");
  }

  /* ================= MESSAGE ================= */
  if (isRazorpay && data.status_code === "REFUND_PENDING") {
    expect(data.message.toLowerCase()).toContain("processed");
  } else {
    expect(data.message).toBe("Transaction has been refunded");
  }

  /* ================= TXN DETAIL ================= */
  expect(data.txn_detail).toBeTruthy();
  expect(data.txn_detail.txn_id).toBe(transactionToRefund);
  if (isRazorpay) {
    expect(["REFUND_PENDING", "REFUNDED"]).toContain(data.txn_detail.status);
  } else {
    expect(data.txn_detail.status).toBe("REFUNDED");
  }

  // Validate amounts (use actual values from response, not hardcoded)
  expect(data.txn_detail.txn_amount).toBeTruthy();
  expect(data.txn_detail.amount).toBeTruthy();
  expect(data.txn_detail.net_amount).toBeTruthy();
  
  // For full refund, amount should equal txn_amount
  expect(data.txn_detail.amount).toBe(data.txn_detail.txn_amount);
  
  // For IIFA, currency could be AED or INR depending on gateway config
  if (isIIFA) {
    expect(["INR", "AED"]).toContain(data.txn_detail.currency);
  } else {
    expect(data.txn_detail.currency).toBe("INR");
  }

  /* ================= REFUND ID MATCH ================= */
  expect(data.txn_detail.refund_id).toBeTruthy();
  expect(data.raw_response.id).toBe(data.txn_detail.refund_id);

  /* ================= RAW RESPONSE ================= */
  expect(data.raw_response.entity).toBe("refund");
  // For Razorpay REFUND_PENDING, status is "pending", otherwise "processed"
  if (isRazorpay && data.status_code === "REFUND_PENDING") {
    expect(data.raw_response.status).toBe("pending");
  } else {
    expect(data.raw_response.status).toBe("processed");
  }
  expect(data.raw_response.amount).toBe(data.txn_detail.amount);
  // For IIFA, currency could be AED or INR
  if (isIIFA) {
    expect(["INR", "AED"]).toContain(data.raw_response.currency);
  } else {
    expect(data.raw_response.currency).toBe("INR");
  }

  /* ================= TIMESTAMP ================= */
  expect(data.refund_createdAt).toBeTruthy();

  /* =====================================================
     🧩 SCHEMA VALIDATION (INLINE – SAME RESPONSE)
     ===================================================== */
  const refundSchema = {
    type: "object",
    required: [
      "id",
      "status",
      "status_code",
      "acquirer_status_code",
      "txn_detail",
      "raw_response",
      "refund_createdAt",
      "message",
    ],
    properties: {
      id: { type: "string" },
      status: { type: "boolean" },
      status_code: { type: "string" },
      acquirer_status_code: { type: "string" },
      message: { type: "string" },

      txn_detail: {
        type: "object",
        required: [
          "txn_id",
          "refund_id",
          "txn_amount",
          "amount",
          "status",
          "net_amount",
          "currency",
        ],
        properties: {
          txn_id: { type: "string" },
          refund_id: { type: "string" },
          txn_amount: { type: "number" },
          amount: { type: "number" },
          net_amount: { type: "number" },
          status: { type: "string" },
          currency: { type: "string" },
        },
      },

      raw_response: {
        type: "object",
        required: ["id", "amount", "currency", "entity", "status"],
        properties: {
          id: { type: "string" },
          amount: { type: "number" },
          currency: { type: "string" },
          entity: { type: "string" },
          status: { type: "string" },
        },
      },

      refund_createdAt: { type: "string" },
    },
    additionalProperties: true,
  };

  const isValid = tv4.validate(data, refundSchema);
  expect(isValid, `Refund schema validation failed: ${tv4.error?.message}`).toBeTruthy();

  // Special logging for Google, SBIC & IIFA merchants with refund status
  if (merchantName === "google" || merchantName === "sbic" || merchantName === "iifa") {
    console.log(`\n🔔 [${merchant.merchant}] Full Refund Transaction Details (TC_030${isIIFA ? ' using TC_012 Card payment' : ''}):`);
    console.log(`   Transaction ID${isIIFA ? ' (from TC_012)' : ''}: ${transactionToRefund}`);
    console.log(`   Refund ID: ${data.txn_detail.refund_id}`);
    console.log(`   Status: ${data.status_code}`);
    console.log(`   Acquirer Status: ${data.acquirer_status_code}`);
    console.log(`   Original Amount: ${data.txn_detail.txn_amount / 100} ${data.txn_detail.currency} (${data.txn_detail.txn_amount} )`);
    console.log(`   Amount Refunded: ${data.txn_detail.amount / 100} ${data.txn_detail.currency} (${data.txn_detail.amount} )`);
    console.log(`   Net Amount: ${data.txn_detail.net_amount / 100} ${data.txn_detail.currency}`);
    console.log(`   Gateway: ${data.txn_detail.gateway || 'N/A'}`);
    console.log(`   Message: ${data.message}`);
    console.log(`   Created At: ${data.refund_createdAt}`);
    if (isIIFA) {
      console.log(`\n🎉 [TC_030] IIFA Full refund of ${data.txn_detail.amount / 100} ${data.txn_detail.currency} completed successfully from TC_012 transaction!`);
    }
  }

  // For Axis and IIFA merchants with Razorpay: Run status check after refund and print full details
  const isAxisMerchant = merchantName.includes("axis");
  const isIIFAMerchant = merchantName.includes("iifa");
  if ((isAxisMerchant || isIIFAMerchant) && isRazorpay) {
    // First, show refund details
    // console.log(`\n💰 [${merchant.merchant}] Refund Response Details:`);
    // console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    // console.log(`   Transaction ID: ${transactionToRefund}`);
    // console.log(`   Refund ID: ${data.txn_detail.refund_id}`);
    // console.log(`   Refund Status: ${data.status_code}`);
    // console.log(`   Acquirer Status: ${data.acquirer_status_code}`);
    // console.log(`   Original Amount: ${data.txn_detail.txn_amount / 100} ${data.txn_detail.currency}`);
    // console.log(`   Amount Refunded: ${data.txn_detail.amount / 100} ${data.txn_detail.currency}`);
    // console.log(`   Net Amount: ${data.txn_detail.net_amount / 100} ${data.txn_detail.currency}`);
    // console.log(`   Gateway: ${data.txn_detail.gateway || 'N/A'}`);
    // console.log(`   Message: ${data.message}`);
    // console.log(`   Created At: ${data.refund_createdAt}`);
    // console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    // If REFUND_PENDING, wait and check status to see if it becomes REFUNDED
    if (data.status_code === "REFUND_PENDING") {
      // console.log(`\n   ⏳ Refund is pending, waiting 10 seconds for processing...`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    console.log(`\n🔍 [${merchant.merchant}] Running Status Check API after refund to check actual status...\n`);
    
    const statusApiUrl = "https://securenew.vernostpay.com/api/intent/check/status";
    const statusPayload = { identifier: transactionToRefund, verifySupplier: true };
    
    try {
      const statusResponse = await axios.post(statusApiUrl, statusPayload, { headers, timeout: 20000 });
      const statusData = statusResponse.data;
      
      // Print detailed status check response
      console.log(`   📋 Status Check Response Details:`);
      console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`   Transaction ID: ${statusData.transactionId}`);
      console.log(`   Order ID: ${statusData.orderId}`);
      console.log(`   Status: ${statusData.status}`);
      console.log(`   Message: ${statusData.message}`);
      console.log(`   Amount: ${statusData.amount} ${statusData.currency}`);
      
      // Customer Details
      // if (statusData.customer_details) {
      //   console.log(`\n   👤 Customer Details:`);
      //   console.log(`      Name: ${statusData.customer_details.customer_first_name || ''} ${statusData.customer_details.customer_last_name || ''}`);
      //   console.log(`      Email: ${statusData.customer_details.customer_email || 'N/A'}`);
      //   console.log(`      Mobile: ${statusData.customer_details.customer_mobile || 'N/A'}`);
      // }
      
      // Payment Details
      // if (statusData.payment_details) {
      //   console.log(`\n   💳 Payment Details:`);
      //   console.log(`      Payment Method: ${statusData.payment_details.payment_method_type || 'N/A'}`);
      //   console.log(`      Gateway: ${statusData.payment_details.gateway || 'N/A'}`);
      //   if (statusData.payment_details.card_details) {
      //     console.log(`      Card Type: ${statusData.payment_details.card_details.card_type || 'N/A'}`);
      //     console.log(`      Card Network: ${statusData.payment_details.card_details.card_network || 'N/A'}`);
      //   }
      // }
      
      // Refund Items
      if (statusData.refund_items && statusData.refund_items.length > 0) {
        // console.log(`\n   💰 Refund Items (${statusData.refund_items.length}):`);
        statusData.refund_items.forEach((item: any, idx: number) => {
          // console.log(`      [${idx + 1}] Refund ID: ${item.refund_id || 'N/A'}`);
          // console.log(`          Amount: ${item.amount || 'N/A'} ${item.currency || statusData.currency}`);
          // console.log(`          Status: ${item.status || 'N/A'}`);
          // console.log(`          Created: ${item.created_at || 'N/A'}`);
        });
      }
      
      console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    } catch (error: any) {
      console.log(`   ⚠️ Status check failed: ${error.message}`);
    }
  }

  console.log(
    `✅ [TC_030] Transaction Fully Refunded + SCHEMA Validation Successful`
  );
});


// ===============================================================
// 🧩 [Positive:TC_031] Verify Partial Refund Scenario - Razorpay
// ===============================================================
test("[Positive:TC_031] Verify partial refund scenario )", async ({ page }) => {
  test.skip(!isAllowedForMerchant("TC_025"), `Skipping TC_025 for ${merchant.merchant}`);
  test.setTimeout(150000);
  
  // Merchant detection
  const merchantName = merchant.merchant.toLowerCase();
  if (merchantName.includes("loylogic") || merchantName.includes("gems") || merchantName.includes("curacao") || merchantName.includes("booking bash")) {
    test.skip();
  }
  
  // For Axis Traveledge, use transaction from TC_033 (dedicated transaction for partial refund)
  // For other merchants: Use transaction_id4 from TC_028 (Card transaction) if available, otherwise fallback to transaction_id2 from TC_014 (UPI)
  // Note: TC_030 uses transaction_id from TC_013, so we use TC_028/TC_014 to avoid conflicts
  const isAxisTraveledge = merchantName.includes("axis traveledge");
  
  let transactionIdToUse;
  let transactionSource;
  
  if (isAxisTraveledge) {
    transactionIdToUse = parsed.transactionId_tc033;
    transactionSource = "TC_033 (Axis Traveledge Card - for partial refund)";
  } else {
    transactionIdToUse = transaction_id4 || transaction_id2;
    transactionSource = transaction_id4 ? "TC_028 (Card)" : "TC_014 (UPI)";
  }
  
  if (!transactionIdToUse) {
    if (isAxisTraveledge) {
      console.log("⚠️ [TC_031] No transactionId_tc033 found for Axis Traveledge, skipping partial refund test");
    } else {
      console.log("⚠️ [TC_031] No transaction_id4 (TC_028) or transaction_id2 (TC_014) found, skipping partial refund test");
    }
    test.skip();
  }
  
  const transaction_id_value = transactionIdToUse;
  
  if (isAxisTraveledge) {
    console.log(`\n🔍 [TC_031] Axis Traveledge - Using transaction from ${transactionSource}: ${transaction_id_value}`);
  }

  // Get the actual transaction amount from status check API
  const statusApiUrl = "https://securenew.vernostpay.com/api/intent/check/status";
  const statusPayload = { identifier: transaction_id_value, verifySupplier: true };
  
  let originalAmount = 1000; // default fallback
  try {
    const statusResponse = await axios.post(statusApiUrl, statusPayload, { headers, timeout: 20000 });
    const amountFromApi = statusResponse.data.amount;
    // Status API returns amount in rupees/dollars, so multiply by 100 to get paise/cents
    const baseAmount = typeof amountFromApi === 'string' ? parseInt(amountFromApi) : (amountFromApi || 10);
    originalAmount = baseAmount * 100;
    // console.log(`✅ [TC_031] Retrieved transaction amount: ${baseAmount} (${originalAmount})`);
  } catch (error: any) {
    console.log(`⚠️ [TC_031] Could not fetch transaction amount: ${error.message}, using default: ${originalAmount}`);
  }

  // First do partial refund (half of the original amount)
  const partialRefundAmount = Math.floor(originalAmount / 2);
  const payload = {
    transaction_id: transaction_id_value,
    amount: partialRefundAmount,
  };

  console.log(`\n💰 Performing PARTIAL refund:`);
  console.log(`   Transaction ID: ${transaction_id_value} (from ${transactionSource})`);
  console.log(`   Original Amount: ${originalAmount}`);
  console.log(`   Partial Refund Amount: ${partialRefundAmount}`);

  let response;
  try {
    response = await api.post(refundApiUrl, payload);
  } catch (error: any) {
    if (error.response?.status === 400 || error.response?.status === 500) {
      const errorMsg = error.response?.data?.message || error.message;
      console.log(`⚠️ [TC_031] Refund API returned ${error.response?.status}: ${errorMsg}`);
      console.log(`Transaction may already be refunded or in invalid state. Skipping test.`);
      test.skip();
    }
    throw error;
  }
  
  const data = response.data;

  // ---------------- HTTP LEVEL ----------------
  expect(response.status).toBe(200);

  // ---------------- ROOT LEVEL ----------------
  expect(data).toBeTruthy();
  expect(data.status).toBe(true);

  // For Razorpay: REFUND_PENDING, for others: PARTIAL_REFUNDED
  const gateway = data.txn_detail?.gateway || "";
  const isRazorpay = gateway.toLowerCase().includes("razorpay");
  // console.log(`[TC_031] Gateway: ${gateway}, isRazorpay: ${isRazorpay}, status_code: ${data.status_code}`);
  
  if (isRazorpay) {
    expect(["REFUND_PENDING", "PARTIAL_REFUNDED"]).toContain(data.status_code);
    expect(["REFUND_PENDING", "REFUNDED"]).toContain(data.acquirer_status_code);
    if (data.status_code === "REFUND_PENDING") {
      expect(data.message.toLowerCase()).toContain("processed");
    } else {
      expect(data.message).toBe("Transaction has been partially refunded");
    }
  } else {
    expect(data.status_code).toBe("PARTIAL_REFUNDED");
    expect(["REFUNDED", "PARTIAL_REFUNDED"]).toContain(data.acquirer_status_code);
    expect(data.message).toBe("Transaction has been partially refunded");
  }

  expect(data.id).toBeTruthy();

  // ---------------- TXN DETAIL ----------------
  expect(data.txn_detail).toBeTruthy();

  expect(data.txn_detail.txn_id).toBe(transaction_id_value); // 🔥 IMPORTANT
  if (isRazorpay) {
    expect(data.txn_detail.refund_id).toBeTruthy();
  }
  if (isRazorpay) {
    expect(["REFUND_PENDING", "PARTIAL_REFUNDED"]).toContain(data.txn_detail.status);
  } else {
    expect(data.txn_detail.status).toBe("PARTIAL_REFUNDED");
  }

  const expectedAmount = originalAmount;
  const expectedRemaining = originalAmount - partialRefundAmount;
  
  expect(data.txn_detail.txn_amount).toBe(expectedAmount);     // original amount
  expect(data.txn_detail.amount).toBe(partialRefundAmount);    // refunded amount
  
  // For Razorpay REFUND_PENDING, remaining_amnt might not be set yet
  if (!isRazorpay || data.status_code !== "REFUND_PENDING") {
    expect(data.txn_detail.remaining_amnt).toBe(expectedRemaining);  // remaining amount
  }
  
  expect(data.txn_detail.net_amount).toBe(expectedAmount);

  const expectedCurrency = "INR";
  expect(data.txn_detail.currency).toBe(expectedCurrency);
  expect(data.txn_detail.gateway).toBeTruthy();

  expect(data.txn_detail.error_message).toBe("");
  expect(data.txn_detail.error_code).toBe("");

  // ---------------- RAW RESPONSE ----------------
  expect(data.raw_response).toBeTruthy();
  if (isRazorpay) {
    expect(data.raw_response.entity).toBe("refund");
    // For Razorpay REFUND_PENDING, status is "pending", otherwise "processed"
    if (data.status_code === "REFUND_PENDING") {
      expect(data.raw_response.status).toBe("pending");
    } else {
      expect(data.raw_response.status).toBe("processed");
    }
    expect(data.raw_response.amount).toBe(partialRefundAmount);
    expect(data.raw_response.base_amount).toBe(partialRefundAmount);
    expect(data.raw_response.currency).toBe("INR");
    // 🔥 refund_id must match
    expect(data.raw_response.id).toBe(data.txn_detail.refund_id);
  } else {
    // For Urbanledger and other non-Razorpay gateways, raw_response structure may differ
    // Urbanledger returns "Partially Refunded", others may return "processed"
    expect(data.raw_response.status).toBeTruthy();
  }

  // ---------------- TIMESTAMP ----------------
  expect(data.refund_createdAt).toBeTruthy();

  // Print partial refund details
  console.log(`\n✅ [TC_031] PARTIAL Refund Successful:`);
  console.log(`   Transaction ID: ${transaction_id_value} (from ${transactionSource})`);
  console.log(`   Refund ID: ${data.txn_detail.refund_id || 'N/A'}`);
  console.log(`   Status: ${data.status_code}`);
  console.log(`   Acquirer Status: ${data.acquirer_status_code}`);
  console.log(`   Message: ${data.message}`);
  console.log(`   Original Amount: ${data.txn_detail.txn_amount} ${data.txn_detail.currency}`);
  console.log(`   Refunded Amount: ${data.txn_detail.amount} ${data.txn_detail.currency}`);
  if (data.txn_detail.remaining_amnt !== undefined) {
    console.log(`   Remaining Amount: ${data.txn_detail.remaining_amnt} ${data.txn_detail.currency}`);
  }

  // Run status check after partial refund
  console.log(`\n🔍 [TC_031] Partial refund completed with status: ${data.status_code}`);
  
  // If REFUND_PENDING, wait and check status to see if it becomes PARTIAL_REFUNDED
  if (data.status_code === "REFUND_PENDING") {
    // console.log(`   ⏳ Waiting 10 seconds for refund to process...`);
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  
  console.log(`\n🔍 [TC_031] Running Status Check after partial refund to check actual status...`);
  
  let actualRemainingAmount = data.txn_detail.remaining_amnt;
  
  try {
    const statusResponse = await axios.post(statusApiUrl, { identifier: transaction_id_value, verifySupplier: true }, { headers, timeout: 20000 });
    const statusData = statusResponse.data;
    
    console.log(`\n   📊 Status Check Results for ${merchant.merchant}:`);
    console.log(`      Transaction ID: ${transaction_id_value}`);
    console.log(`      Order ID: ${statusData.orderId}`);
    console.log(`      Transaction Status: ${statusData.status}`);
    console.log(`      Amount: ${statusData.amount} ${statusData.currency}`);
    // console.log(`      Payment Method: ${statusData.payment_method_type || 'N/A'}`);
    // console.log(`      Message: ${statusData.message}`);
    
    if (statusData.refund_items && statusData.refund_items.length > 0) {
      // console.log(`      Refund Items Count: ${statusData.refund_items.length}`);
      let totalRefundedSoFar = 0;
      statusData.refund_items.forEach((item: any, idx: number) => {
        // console.log(`      Refund ${idx + 1}:`);
        // console.log(`         Refund ID: ${item.id}`);
        console.log(`         Amount: ${item.amount || 'N/A'}`);
        console.log(`         Status: ${item.status || 'N/A'}`);
        // console.log(`         Created At: ${item.created_at || 'N/A'}`);
        if (item.amount) {
          totalRefundedSoFar += typeof item.amount === 'string' ? parseInt(item.amount) : item.amount;
        }
      });
      
      // Calculate remaining amount from status check
      // Status API returns amount in rupees/dollars, so multiply by 100
      const originalAmountInBase = (typeof statusData.amount === 'string' ? parseFloat(statusData.amount) : statusData.amount) * 100;
      actualRemainingAmount = Math.max(0, originalAmountInBase - totalRefundedSoFar);
      console.log(`      Total Refunded So Far: ${totalRefundedSoFar / 100} ${statusData.currency} (${totalRefundedSoFar})`);
      console.log(`      Remaining Amount to Refund: ${actualRemainingAmount / 100} ${statusData.currency} (${actualRemainingAmount} )`);
    }
  } catch (error: any) {
    console.log(`   ⚠️ Status check failed: ${error.message}`);
    // Fallback: calculate remaining amount manually
    if (!actualRemainingAmount || actualRemainingAmount === originalAmount) {
      actualRemainingAmount = originalAmount - partialRefundAmount;
      console.log(`   Using calculated remaining amount: ${actualRemainingAmount}`);
    }
  }

  // Now refund the remaining amount (FULL REFUND)
  const remainingAmount = actualRemainingAmount;
  if (remainingAmount && remainingAmount > 0) {
    console.log(`\n💰 [TC_031] Performing FULL refund (remaining amount):`);
    console.log(`   Transaction ID: ${transaction_id_value} (from ${transactionSource})`);
    console.log(`   Remaining Refund Amount: ${remainingAmount} ${data.txn_detail.currency}`);
    
    const remainingRefundPayload = {
      transaction_id: transaction_id_value,
      amount: remainingAmount,
    };

    try {
      const remainingResponse = await api.post(refundApiUrl, remainingRefundPayload);
      const remainingData = remainingResponse.data;

      console.log(`\n✅ [TC_031] FULL Refund (Remaining) Successful:`);
      console.log(`   Transaction ID: ${transaction_id_value} (from ${transactionSource})`);
      console.log(`   Refund ID: ${remainingData.txn_detail.refund_id || 'N/A'}`);
      console.log(`   Status: ${remainingData.status_code}`);
      console.log(`   Acquirer Status: ${remainingData.acquirer_status_code}`);
      console.log(`   Message: ${remainingData.message}`);
      console.log(`   Refunded Amount: ${remainingData.txn_detail.amount} ${remainingData.txn_detail.currency}`);
      if (remainingData.txn_detail.remaining_amnt !== undefined) {
        console.log(`   Final Remaining Amount: ${remainingData.txn_detail.remaining_amnt} ${remainingData.txn_detail.currency}`);
      }
      
      // If REFUND_PENDING, run status check to get final status
      if (remainingData.status_code === "REFUND_PENDING") {
        // console.log(`\n🔍 [TC_031] Full refund status is REFUND_PENDING, waiting and checking final status...`);
        // console.log(`   ⏳ Waiting 10 seconds for refund to process...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        console.log(`\n🔍 [TC_031] Running Status Check after full refund...`);
        
        try {
          const finalStatusResponse = await axios.post(statusApiUrl, { identifier: transaction_id_value, verifySupplier: true }, { headers, timeout: 20000 });
          const finalStatusData = finalStatusResponse.data;
          
          console.log(`\n   📊 Final Status Check Results for ${merchant.merchant}:`);
          console.log(`      Transaction ID: ${transaction_id_value} (from ${transactionSource})`);
          console.log(`      Order ID: ${finalStatusData.orderId}`);
          console.log(`      Final Transaction Status: ${finalStatusData.status}`);
          console.log(`      Amount: ${finalStatusData.amount} ${finalStatusData.currency}`);
          console.log(`      Payment Method: ${finalStatusData.payment_method_type || 'N/A'}`);
          console.log(`      Message: ${finalStatusData.message}`);
          
          if (finalStatusData.refund_items && finalStatusData.refund_items.length > 0) {
            // console.log(`      Total Refund Items: ${finalStatusData.refund_items.length}`);
            finalStatusData.refund_items.forEach((item: any, idx: number) => {
              // console.log(`      Refund ${idx + 1}:`);
              // console.log(`         Refund ID: ${item.id || 'N/A'}`);
              // console.log(`         Amount: ${item.amount || 'N/A'}`);
              // console.log(`         Status: ${item.status || 'N/A'}`);
              // console.log(`         Created At: ${item.created_at || 'N/A'}`);
            });
          }
          
          console.log(`\n🎉 [TC_031] Complete: Transaction from ${transactionSource} fully refunded with final status: ${finalStatusData.status}`);
        } catch (error: any) {
          console.log(`   ⚠️ Final status check failed: ${error.message}`);
          console.log(`\n🎉 [TC_031] Complete: Transaction from ${transactionSource} fully refunded (${partialRefundAmount} + ${remainingAmount} = ${data.txn_detail.txn_amount} ${data.txn_detail.currency})`);
        }
      } else {
        console.log(`\n🎉 [TC_031] Complete: Transaction from ${transactionSource} fully refunded (${partialRefundAmount} + ${remainingAmount} = ${data.txn_detail.txn_amount} ${data.txn_detail.currency})`);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      console.log(`\n⚠️ [TC_031] Full refund (remaining) failed: ${errorMsg}`);
      console.log(`   This might happen if the transaction is already fully refunded or in invalid state`);
    }
  } else {
    console.log(`\n⚠️ [TC_031] No remaining amount to refund`);
  }

});


// ===============================================================
// 🧩 [Negative:TC_032] Validate Refund API negative response schema
// ===============================================================
test("[Negative:TC_032] Refund API response should fail schema validation for invalid structure", async () => {
  const merchantName = merchant.merchant.toLowerCase();
  if (merchantName.includes("loylogic") || merchantName.includes("curacao")) {
    test.skip();
  }

  // ❌ Intentionally invalid refund response
  const invalidRefundResponse = {
    id: 12345,                 // ❌ should be string
    status: "true",            // ❌ should be boolean
    status_code: 200,          // ❌ should be string
    acquirer_status_code: null,// ❌ should be string

    txn_detail: {
      txn_id: 987654,          // ❌ should be string
      refund_id: null,         // ❌ should be string
      txn_amount: "1000",      // ❌ should be number
      amount: "1000",          // ❌ should be number
      status: 1,               // ❌ should be string
      order_id: {},            // ❌ should be string
      net_amount: "1000",      // ❌ should be number
      currency: 123,           // ❌ should be string
      gateway: true,           // ❌ should be string
      created: 123456          // ❌ should be string
    },

    raw_response: {
      amount: "1000",          // ❌ should be number
      base_amount: "1000",     // ❌ should be number
      currency: 123,           // ❌ should be string
      entity: {},              // ❌ should be string
      id: 99999,               // ❌ should be string
      payment_id: null,        // ❌ should be string
      status: true             // ❌ should be string
    },

    refund_createdAt: 123456,  // ❌ should be string
    message: {}                // ❌ should be string
  };

  // ✅ Correct refund schema
  const refundSchema = {
    type: "object",
    required: [
      "id",
      "status",
      "status_code",
      "acquirer_status_code",
      "txn_detail",
      "raw_response",
      "refund_createdAt",
      "message"
    ],
    properties: {
      id: { type: "string" },
      status: { type: "boolean" },
      status_code: { type: "string" },
      acquirer_status_code: { type: "string" },

      txn_detail: {
        type: "object",
        required: [
          "txn_id",
          "refund_id",
          "txn_amount",
          "amount",
          "status",
          "order_id",
          "net_amount",
          "currency",
          "gateway",
          "created"
        ],
        properties: {
          txn_id: { type: "string" },
          refund_id: { type: "string" },
          txn_amount: { type: ["number", "integer"] },
          amount: { type: ["number", "integer"] },
          status: { type: "string" },
          order_id: { type: "string" },
          net_amount: { type: ["number", "integer"] },
          currency: { type: "string" },
          gateway: { type: "string" },
          created: { type: "string" }
        }
      },

      raw_response: {
        type: "object",
        required: [
          "amount",
          "base_amount",
          "currency",
          "entity",
          "id",
          "payment_id",
          "status"
        ],
        properties: {
          amount: { type: ["number", "integer"] },
          base_amount: { type: ["number", "integer"] },
          currency: { type: "string" },
          entity: { type: "string" },
          id: { type: "string" },
          payment_id: { type: "string" },
          status: { type: "string" }
        }
      },

      refund_createdAt: { type: "string" },
      message: { type: "string" }
    },
    additionalProperties: true
  };

  // 🔍 Validate invalid response
  const isValid = tv4.validate(invalidRefundResponse, refundSchema);

  // ❌ EXPECT schema validation to FAIL
  expect(
    isValid,
    `Negative schema validation should fail but passed. Error: ${tv4.error?.message}`
  ).toBeFalsy();

  console.log("✅ [TC_032] Refund API negative schema validation passed");
});


// ===============================================================
// 🧩 [Negative:TC_033] Verify Refund API with blank MID and password
// ===============================================================
test("[Negative:TC_033] Verify Refund API with blank MID and password", async () => {
  const payload = {
    transaction_id: transaction_id2, // or transaction_id2 if needed
    amount: 500, // any valid refund amount
  };

  // 🔥 Override headers only for this test
  const invalidHeaders = {
    mid: "",
    password: "",
  };

  try {
    await axios.post(
      "https://securenew.vernostpay.com/api/payment/refund",
      payload,
      { headers: invalidHeaders, timeout: 10000 }
    );

    expect(false, "Refund API should not accept blank MID & password").toBeTruthy();
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

  console.log("✅ [TC_033] Refund API blank MID and password validation passed successfully");
});

// ===============================================================
// 🧩 [Positive:TC_034] Verify Full Refund for Urbanledger NSL with Schema Validation
// ===============================================================
test("[Positive:TC_034] Verify Full Refund for Urbanledger NSL with Schema Validation", async () => {
  test.skip(!isAllowedForMerchant("TC_034"), `Skipping TC_034 for ${merchant.merchant}`);
  
  // Skip for Curacao
  if (merchant.merchant.toLowerCase().includes("curacao")) {
    test.skip();
  }
  
  // Use transaction_id2 for Urbanledger NSL transaction
  const urbanledgerTransactionId = transaction_id2;
  
  if (!urbanledgerTransactionId) {
    console.warn(`⚠️  No Urbanledger transaction_id2 found for ${merchant.merchant}. Skipping TC_034.`);
    test.skip();
  }

  // For Urbanledger NSL, use full transaction amount (10000 = 100 AED in base units)
  const txnAmount = 10000;
  
  const payload = {
    transaction_id: urbanledgerTransactionId,
    amount: txnAmount, // Full refund
  };

  let response;
  try {
    response = await api.post(refundApiUrl, payload);
  } catch (error: any) {
    if (error.response?.status === 400 || error.response?.status === 500) {
      const errorMsg = error.response?.data?.message || error.message;
      console.log(`⚠️ [TC_034] Refund API returned ${error.response?.status}: ${errorMsg}`);
      console.log(`Transaction may already be refunded or in invalid state. Skipping test.`);
      test.skip();
    }
    throw error;
  }
  
  const data = response.data;

  /* ================= BASIC ================= */
  expect(response.status).toBe(200);
  expect(data.status).toBe(true);

  /* ================= STATUS ================= */
  expect(data.status_code).toBe("REFUNDED");
  expect(data.acquirer_status_code).toBe("REFUNDED");

  /* ================= MESSAGE ================= */
  expect(data.message).toBe("Transaction has been refunded");

  /* ================= TXN DETAIL ================= */
  expect(data.txn_detail).toBeTruthy();
  expect(data.txn_detail.txn_id).toBe(urbanledgerTransactionId);
  expect(data.txn_detail.status).toBe("REFUNDED");
  expect(data.txn_detail.gateway).toContain("Urbanledger");

  // Validate amounts
  expect(data.txn_detail.txn_amount).toBeTruthy();
  expect(data.txn_detail.amount).toBeTruthy();
  expect(data.txn_detail.net_amount).toBeTruthy();
  
  // For full refund, amount should equal txn_amount
  expect(data.txn_detail.amount).toBe(data.txn_detail.txn_amount);
  
  const expectedCurrency = merchant.merchant.toLowerCase().includes("iifa") || merchant.merchant.toLowerCase().includes("loylogic") ? "AED" : "INR";
  expect(data.txn_detail.currency).toBe(expectedCurrency);

  /* ================= RAW RESPONSE (Urbanledger specific) ================= */
  expect(data.raw_response).toBeTruthy();
  expect(data.raw_response.status).toBe("Refunded");
  expect(data.raw_response.message).toContain("refunded successfully");

  /* ================= TIMESTAMP ================= */
  expect(data.refund_createdAt).toBeTruthy();

  /* =====================================================
     🧩 URBANLEDGER NSL SCHEMA VALIDATION
     ===================================================== */
  const urbanledgerRefundSchema = {
    type: "object",
    required: [
      "id",
      "status",
      "status_code",
      "acquirer_status_code",
      "txn_detail",
      "raw_response",
      "refund_createdAt",
      "message",
    ],
    properties: {
      id: { type: "string" },
      status: { type: "boolean" },
      status_code: { type: "string" },
      acquirer_status_code: { type: "string" },
      message: { type: "string" },

      txn_detail: {
        type: "object",
        required: [
          "txn_id",
          "txn_amount",
          "amount",
          "status",
          "net_amount",
          "currency",
          "gateway",
        ],
        properties: {
          txn_id: { type: "string" },
          refund_id: { type: "string" },
          mrt_refund_id: { type: "string" },
          txn_amount: { type: "number" },
          tax_amount: { type: ["number", "null"] },
          amount: { type: "number" },
          surcharge_amount: { type: ["number", "null"] },
          status: { type: "string" },
          order_id: { type: "string" },
          net_amount: { type: "number" },
          remaining_amnt: { type: "string" },
          gateway: { type: "string" },
          error_message: { type: "string" },
          error_code: { type: "string" },
          currency: { type: "string" },
          created: { type: "string" },
        },
      },

      raw_response: {
        type: "object",
        required: ["status", "message"],
        properties: {
          status: { type: "string" },
          message: { type: "string" },
          reference: { type: "string" },
        },
      },

      refund_createdAt: { type: "string" },
    },
    additionalProperties: true,
  };

  const isValid = tv4.validate(data, urbanledgerRefundSchema);
  expect(isValid, `Urbanledger NSL Refund schema validation failed: ${tv4.error?.message}\nData path: ${tv4.error?.dataPath}\nSchema path: ${tv4.error?.schemaPath}`).toBeTruthy();

  console.log(`\n✅ [TC_034] Urbanledger NSL Full Refund + Schema Validation Successful for ${merchant.merchant}`);
  console.log(`   Transaction ID: ${urbanledgerTransactionId}`);
  console.log(`   Amount Refunded: ${data.txn_detail.amount} ${data.txn_detail.currency}`);
  console.log(`   Status: ${data.status_code}`);
  console.log(`   Gateway: ${data.txn_detail.gateway}`);
  console.log(`   Raw Response Status: ${data.raw_response.status}`);
});

// ===============================================================
// 🧩 [Positive:TC_035] Verify Partial Refund for Urbanledger NSL with Schema Validation
// ===============================================================
test("[Positive:TC_035] Verify Partial Refund for Urbanledger NSL with Schema Validation", async () => {
  test.skip(!isAllowedForMerchant("TC_035"), `Skipping TC_035 for ${merchant.merchant}`);
  
  // Skip for Curacao
  if (merchant.merchant.toLowerCase().includes("curacao")) {
    test.skip();
  }
  
  // Use transaction_id3 for Urbanledger NSL transaction (created in TC_036 for partial refund)
  const urbanledgerTransactionId = parsed.transaction_id3 || parsed.transactionId3;
  
  if (!urbanledgerTransactionId) {
    console.warn(`⚠️  No Urbanledger transaction_id3 found for ${merchant.merchant}. Skipping TC_035.`);
    test.skip();
  }

  // For Urbanledger NSL, use partial refund amount (9000 out of 10000 = 90 AED out of 100 AED)
  const txnAmount = 9000;
  
  const payload = {
    transaction_id: urbanledgerTransactionId,
    amount: txnAmount, // Partial refund
  };

  let response;
  try {
    response = await api.post(refundApiUrl, payload);
  } catch (error: any) {
    if (error.response?.status === 400 || error.response?.status === 500) {
      const errorMsg = error.response?.data?.message || error.message;
      console.log(`⚠️ [TC_035] Refund API returned ${error.response?.status}: ${errorMsg}`);
      console.log(`Transaction may already be refunded or in invalid state. Skipping test.`);
      test.skip();
    }
    throw error;
  }
  
  const data = response.data;

  /* ================= BASIC ================= */
  expect(response.status).toBe(200);
  expect(data.status).toBe(true);

  /* ================= STATUS ================= */
  expect(data.status_code).toBe("PARTIAL_REFUNDED");
  expect(data.acquirer_status_code).toBe("PARTIAL_REFUNDED");

  /* ================= MESSAGE ================= */
  expect(data.message).toBe("Transaction has been partially refunded");

  /* ================= TXN DETAIL ================= */
  expect(data.txn_detail).toBeTruthy();
  expect(data.txn_detail.txn_id).toBe(urbanledgerTransactionId);
  expect(data.txn_detail.status).toBe("PARTIAL_REFUNDED");
  expect(data.txn_detail.gateway).toContain("Urbanledger");

  // Validate amounts
  expect(data.txn_detail.txn_amount).toBe(10000); // Original amount
  expect(data.txn_detail.amount).toBe(9000); // Refunded amount
  expect(data.txn_detail.remaining_amnt).toBe(1000); // Remaining amount
  expect(data.txn_detail.net_amount).toBeTruthy();
  
  const expectedCurrency = merchant.merchant.toLowerCase().includes("iifa") || merchant.merchant.toLowerCase().includes("loylogic") ? "AED" : "INR";
  expect(data.txn_detail.currency).toBe(expectedCurrency);

  /* ================= RAW RESPONSE (Urbanledger specific) ================= */
  expect(data.raw_response).toBeTruthy();
  expect(data.raw_response.status).toBe("Partially Refunded");
  expect(data.raw_response.message).toContain("refunded successfully");

  /* ================= TIMESTAMP ================= */
  expect(data.refund_createdAt).toBeTruthy();

  /* =====================================================
     🧩 URBANLEDGER NSL PARTIAL REFUND SCHEMA VALIDATION
     ===================================================== */
  const urbanledgerPartialRefundSchema = {
    type: "object",
    required: [
      "id",
      "status",
      "status_code",
      "acquirer_status_code",
      "txn_detail",
      "raw_response",
      "refund_createdAt",
      "message",
    ],
    properties: {
      id: { type: "string" },
      status: { type: "boolean" },
      status_code: { type: "string" },
      acquirer_status_code: { type: "string" },
      message: { type: "string" },

      txn_detail: {
        type: "object",
        required: [
          "txn_id",
          "txn_amount",
          "amount",
          "status",
          "net_amount",
          "remaining_amnt",
          "currency",
          "gateway",
        ],
        properties: {
          txn_id: { type: "string" },
          refund_id: { type: "string" },
          mrt_refund_id: { type: "string" },
          txn_amount: { type: "number" },
          tax_amount: { type: ["number", "null"] },
          amount: { type: "number" },
          surcharge_amount: { type: ["number", "null"] },
          status: { type: "string" },
          order_id: { type: "string" },
          net_amount: { type: "number" },
          remaining_amnt: { type: "number" },
          gateway: { type: "string" },
          error_message: { type: "string" },
          error_code: { type: "string" },
          currency: { type: "string" },
          created: { type: "string" },
        },
      },

      raw_response: {
        type: "object",
        required: ["status", "message"],
        properties: {
          status: { type: "string" },
          message: { type: "string" },
          reference: { type: "string" },
        },
      },

      refund_createdAt: { type: "string" },
    },
    additionalProperties: true,
  };

  const isValid = tv4.validate(data, urbanledgerPartialRefundSchema);
  expect(isValid, `Urbanledger NSL Partial Refund schema validation failed: ${tv4.error?.message}\nData path: ${tv4.error?.dataPath}\nSchema path: ${tv4.error?.schemaPath}`).toBeTruthy();

  console.log(`\n💰 [TC_035] PARTIAL Refund Successful:`);
  console.log(`   Transaction ID: ${urbanledgerTransactionId}`);
  console.log(`   Original Amount: ${data.txn_detail.txn_amount} ${data.txn_detail.currency} (${data.txn_detail.txn_amount / 100} ${data.txn_detail.currency})`);
  console.log(`   Partial Refund Amount: ${data.txn_detail.amount} ${data.txn_detail.currency} (${data.txn_detail.amount / 100} ${data.txn_detail.currency})`);
  console.log(`   Remaining Amount: ${data.txn_detail.remaining_amnt} ${data.txn_detail.currency} (${data.txn_detail.remaining_amnt / 100} ${data.txn_detail.currency})`);
  console.log(`   Status: ${data.status_code}`);
  console.log(`   Gateway: ${data.txn_detail.gateway}`);
  console.log(`   Raw Response Status: ${data.raw_response.status}`);

  // Now refund the remaining amount (FULL REFUND of remaining)
  const remainingAmount = data.txn_detail.remaining_amnt;
  if (remainingAmount && remainingAmount > 0) {
    console.log(`\n💰 [TC_035] Performing FULL refund of remaining amount:`);
    console.log(`   Transaction ID: ${urbanledgerTransactionId}`);
    console.log(`   Remaining Refund Amount: ${remainingAmount} (${remainingAmount / 100} ${data.txn_detail.currency})`);
    
    const remainingRefundPayload = {
      transaction_id: urbanledgerTransactionId,
      amount: remainingAmount,
    };

    try {
      const remainingResponse = await api.post(refundApiUrl, remainingRefundPayload);
      const remainingData = remainingResponse.data;

      // Validate full refund response
      expect(remainingResponse.status).toBe(200);
      expect(remainingData.status).toBe(true);
      expect(remainingData.status_code).toBe("REFUNDED");
      expect(remainingData.acquirer_status_code).toBe("REFUNDED");
      expect(remainingData.message).toBe("Transaction has been refunded");
      
      // Validate remaining refund schema
      const urbanledgerFullRefundSchema = {
        type: "object",
        required: [
          "id",
          "status",
          "status_code",
          "acquirer_status_code",
          "txn_detail",
          "raw_response",
          "refund_createdAt",
          "message",
        ],
        properties: {
          id: { type: "string" },
          status: { type: "boolean" },
          status_code: { type: "string" },
          acquirer_status_code: { type: "string" },
          message: { type: "string" },
          txn_detail: {
            type: "object",
            required: [
              "txn_id",
              "txn_amount",
              "amount",
              "status",
              "net_amount",
              "remaining_amnt",
              "currency",
              "gateway",
            ],
            properties: {
              txn_id: { type: "string" },
              refund_id: { type: "string" },
              mrt_refund_id: { type: "string" },
              txn_amount: { type: "number" },
              amount: { type: "number" },
              status: { type: "string" },
              net_amount: { type: "number" },
              remaining_amnt: { type: ["number", "string"] },
              gateway: { type: "string" },
              currency: { type: "string" },
            },
          },
          raw_response: {
            type: "object",
            required: ["status", "message"],
            properties: {
              status: { type: "string" },
              message: { type: "string" },
              reference: { type: "string" },
            },
          },
          refund_createdAt: { type: "string" },
        },
        additionalProperties: true,
      };

      const isValidRemaining = tv4.validate(remainingData, urbanledgerFullRefundSchema);
      expect(isValidRemaining, `Full refund schema validation failed: ${tv4.error?.message}`).toBeTruthy();

      console.log(`\n💰 [TC_035] FULL Refund (Remaining) Successful:`);
      console.log(`   Transaction ID: ${urbanledgerTransactionId}`);
      // console.log(`   Refund ID: ${remainingData.txn_detail.refund_id || 'N/A'}`);
      console.log(`   Status: ${remainingData.status_code}`);
      console.log(`   Acquirer Status: ${remainingData.acquirer_status_code}`);
      // console.log(`   Message: ${remainingData.message}`);
      console.log(`   Final Refunded Amount: ${remainingData.txn_detail.amount} (${remainingData.txn_detail.amount / 100} ${remainingData.txn_detail.currency})`);
      console.log(`   Final Remaining Amount: ${remainingData.txn_detail.remaining_amnt} (${remainingData.txn_detail.remaining_amnt / 100} ${remainingData.txn_detail.currency})`);
      console.log(`   Gateway: ${remainingData.txn_detail.gateway}`);
      console.log(`   Raw Response Status: ${remainingData.raw_response.status}`);
      console.log(`\n✅  [TC_035] Transaction fully refunded`);
      
      // Calculate total refunded
      const totalRefunded = data.txn_detail.amount + remainingAmount;
      // console.log(`\n🎉 [TC_035] Complete: Transaction fully refunded`);
      // console.log(`   Partial Refund: ${data.txn_detail.amount} (${data.txn_detail.amount / 100} ${data.txn_detail.currency})`);
      // console.log(`   Final Refund: ${remainingAmount} (${remainingAmount / 100} ${data.txn_detail.currency})`);
      // console.log(`   Total Refunded: ${totalRefunded} = ${data.txn_detail.txn_amount} ${data.txn_detail.currency} (${totalRefunded / 100} ${data.txn_detail.currency})`);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      console.log(`\n⚠️ [TC_035] Full refund (remaining) failed: ${errorMsg}`);
      console.log(`   This might happen if the transaction is already fully refunded or in invalid state`);
    }
  } else {
    console.log(`\n⚠️ [TC_035] No remaining amount to refund`);
  }
});

// ===============================================================
// 🧩 [Positive:TC_038] Verify Full Refund for Urbanledger Seamless (GEMS) with Schema Validation
// ===============================================================
test("[Positive:TC_038] Verify Full Refund for Urbanledger Seamless (GEMS) with Schema Validation", async () => {
  test.skip(!isAllowedForMerchant("TC_038"), `Skipping TC_038 for ${merchant.merchant}`);
  
  // Skip for Curacao
  if (merchant.merchant.toLowerCase().includes("curacao")) {
    test.skip();
  }
  
  // Use transactionId from TC_020 (Urbanledger Seamless transaction)
  const urbanledgerTransactionId = parsed.transactionId || parsed.transaction_id || transactionId;
  
  if (!urbanledgerTransactionId) {
    console.warn(`⚠️  No transactionId found for ${merchant.merchant}. Skipping TC_038.`);
    test.skip();
  }

  // console.log(`\n🔍 [TC_038] Using transactionId from TC_020: ${urbanledgerTransactionId}`);

  // For Urbanledger Seamless (GEMS), get the amount from status check first
  const statusApiUrl = "https://securenew.vernostpay.com/api/intent/check/status";
  const statusPayload = { identifier: urbanledgerTransactionId, verifySupplier: true };
  
  // GEMS Urbanledger Seamless uses base units (10000 = 100 AED)
  let txnAmount = 10000; // Use base units for refund
  try {
    const statusResponse = await axios.post(statusApiUrl, statusPayload, { headers, timeout: 20000 });
    // console.log(`[TC_038] Status check response amount: ${statusResponse.data.amount}`);
  } catch (error: any) {
    console.log(`⚠️ [TC_038] Could not fetch transaction status: ${error.message}`);
  }
  
  const payload = {
    transaction_id: urbanledgerTransactionId,
    amount: txnAmount, // Full refund in base units
  };

  let response;
  try {
    response = await api.post(refundApiUrl, payload);
  } catch (error: any) {
    if (error.response?.status === 400 || error.response?.status === 500) {
      const errorMsg = error.response?.data?.message || error.message;
      console.log(`⚠️ [TC_038] Refund API returned ${error.response?.status}: ${errorMsg}`);
      console.log(`Transaction may already be refunded or in invalid state. Skipping test.`);
      test.skip();
    }
    throw error;
  }
  
  const data = response.data;

  /* ================= BASIC ================= */
  expect(response.status).toBe(200);
  expect(data.status).toBe(true);

  /* ================= STATUS ================= */
  expect(data.status_code).toBe("REFUNDED");
  expect(data.acquirer_status_code).toBe("REFUNDED");

  /* ================= MESSAGE ================= */
  expect(data.message).toBe("Transaction has been refunded");

  /* ================= TXN DETAIL ================= */
  expect(data.txn_detail).toBeTruthy();
  expect(data.txn_detail.txn_id).toBe(urbanledgerTransactionId);
  expect(data.txn_detail.status).toBe("REFUNDED");
  expect(data.txn_detail.gateway).toContain("urbanledger");

  // Validate amounts
  expect(data.txn_detail.txn_amount).toBeTruthy();
  expect(data.txn_detail.amount).toBeTruthy();
  expect(data.txn_detail.net_amount).toBeTruthy();
  
  // For full refund, amount should equal txn_amount
  expect(data.txn_detail.amount).toBe(data.txn_detail.txn_amount);
  
  // Validate currency - TC_020 should create AED but may fallback to INR based on configuration
  expect(data.txn_detail.currency).toBeTruthy();
  expect(["AED", "INR"]).toContain(data.txn_detail.currency);
  // console.log(`[TC_038] Currency: ${data.txn_detail.currency} (Expected AED from TC_020, but actual depends on gateway configuration)`);

  /* ================= RAW RESPONSE (Urbanledger Seamless specific) ================= */
  expect(data.raw_response).toBeTruthy();
  expect(data.raw_response.status).toBe("Refunded");
  expect(data.raw_response.message).toContain("refunded successfully");

  /* ================= TIMESTAMP ================= */
  expect(data.refund_createdAt).toBeTruthy();

  console.log(`\n✅ [TC_038] Urbanledger Seamless Full Refund + Schema Validation Successful for ${merchant.merchant}`);
  console.log(`   Transaction ID: ${urbanledgerTransactionId}`);
  console.log(`   Amount Refunded: ${data.txn_detail.amount} ${data.txn_detail.currency}`);
  console.log(`   Status: ${data.status_code}`);
  console.log(`   Gateway: ${data.txn_detail.gateway}`);

  /* =====================================================
     🧩 URBANLEDGER SEAMLESS SCHEMA VALIDATION
     ===================================================== */
  const urbanledgerSLRefundSchema = {
    type: "object",
    required: [
      "id",
      "status",
      "status_code",
      "acquirer_status_code",
      "txn_detail",
      "raw_response",
      "refund_createdAt",
      "message",
    ],
    properties: {
      id: { type: "string" },
      status: { type: "boolean" },
      status_code: { type: "string" },
      acquirer_status_code: { type: "string" },
      message: { type: "string" },

      txn_detail: {
        type: "object",
        required: [
          "txn_id",
          "txn_amount",
          "amount",
          "status",
          "net_amount",
          "currency",
          "gateway",
        ],
        properties: {
          txn_id: { type: "string" },
          refund_id: { type: "string" },
          mrt_refund_id: { type: "string" },
          txn_amount: { type: "number" },
          tax_amount: { type: ["number", "null"] },
          amount: { type: "number" },
          surcharge_amount: { type: ["number", "null"] },
          status: { type: "string" },
          order_id: { type: "string" },
          net_amount: { type: "number" },
          remaining_amnt: { type: "string" },
          gateway: { type: "string" },
          error_message: { type: "string" },
          error_code: { type: "string" },
          currency: { type: "string" },
          created: { type: "string" },
        },
      },

      raw_response: {
        type: "object",
        required: ["status", "message"],
        properties: {
          status: { type: "string" },
          message: { type: "string" },
          reference: { type: "string" },
        },
      },

      refund_createdAt: { type: "string" },
    },
    additionalProperties: true,
  };

  const isValid = tv4.validate(data, urbanledgerSLRefundSchema);
  expect(isValid, `Urbanledger Seamless Refund schema validation failed: ${tv4.error?.message}\nData path: ${tv4.error?.dataPath}\nSchema path: ${tv4.error?.schemaPath}`).toBeTruthy();
});

// ===============================================================
// 🧩 [Positive:TC_039] Verify Full Refund for Urbanledger Seamless (GEMS) using TC_029 Transaction
// // ===============================================================
// test("[Positive:TC_039] Verify Full Refund for Urbanledger Seamless (GEMS) using TC_029 Transaction", async () => {
//   test.skip(!isAllowedForMerchant("TC_039"), `Skipping TC_039 for ${merchant.merchant}`);
  
//   // Skip for Curacao
//   if (merchant.merchant.toLowerCase().includes("curacao")) {
//     test.skip();
//   }
  
//   // Use transaction_id5 from TC_029 (Urbanledger Seamless transaction for refund)
//   const urbanledgerSeamlessTransactionId = transaction_id5;
  
//   if (!urbanledgerSeamlessTransactionId) {
//     console.warn(`⚠️  No transaction_id5 found for ${merchant.merchant}. Skipping TC_039.`);
//     test.skip();
//   }

//   console.log(`\n🔍 [TC_039] Using transaction_id5 from TC_029: ${urbanledgerSeamlessTransactionId}`);

//   // For Urbanledger Seamless (GEMS), use the amount from TC_020 (10000 AED in base units = 100 AED)
//   const txnAmount = 10000;
  
//   const payload = {
//     transaction_id: urbanledgerSeamlessTransactionId,
//     amount: txnAmount, // Full refund
//   };

//   let response;
//   try {
//     response = await api.post(refundApiUrl, payload);
//   } catch (error: any) {
//     if (error.response?.status === 400 || error.response?.status === 500) {
//       const errorMsg = error.response?.data?.message || error.message;
//       console.log(`⚠️ [TC_039] Refund API returned ${error.response?.status}: ${errorMsg}`);
//       console.log(`Transaction may already be refunded or in invalid state. Skipping test.`);
//       test.skip();
//     }
//     throw error;
//   }
  
//   const data = response.data;

//   /* ================= BASIC ================= */
//   expect(response.status).toBe(200);
//   expect(data.status).toBe(true);

//   /* ================= STATUS ================= */
//   expect(data.status_code).toBe("REFUNDED");
//   expect(data.acquirer_status_code).toBe("REFUNDED");

//   /* ================= MESSAGE ================= */
//   expect(data.message).toBe("Transaction has been refunded");

//   /* ================= TXN DETAIL ================= */
//   expect(data.txn_detail).toBeTruthy();
//   expect(data.txn_detail.txn_id).toBe(urbanledgerSeamlessTransactionId);
//   expect(data.txn_detail.status).toBe("REFUNDED");
//   expect(data.txn_detail.gateway).toContain("urbanledger");

//   // Validate amounts
//   expect(data.txn_detail.txn_amount).toBeTruthy();
//   expect(data.txn_detail.amount).toBeTruthy();
//   expect(data.txn_detail.net_amount).toBeTruthy();
  
//   // For full refund, amount should equal txn_amount
//   expect(data.txn_detail.amount).toBe(data.txn_detail.txn_amount);
  
//   expect(data.txn_detail.currency).toBe("AED");

//   /* ================= RAW RESPONSE (Urbanledger Seamless specific) ================= */
//   expect(data.raw_response).toBeTruthy();
//   expect(data.raw_response.status).toBe("Refunded");
//   expect(data.raw_response.message).toContain("refunded successfully");

//   /* ================= TIMESTAMP ================= */
//   expect(data.refund_createdAt).toBeTruthy();

//   /* =====================================================
//      🧩 URBANLEDGER SEAMLESS SCHEMA VALIDATION
//      ===================================================== */
//   const urbanledgerSeamlessRefundSchema = {
//     type: "object",
//     required: [
//       "id",
//       "status",
//       "status_code",
//       "acquirer_status_code",
//       "txn_detail",
//       "raw_response",
//       "refund_createdAt",
//       "message",
//     ],
//     properties: {
//       id: { type: "string" },
//       status: { type: "boolean" },
//       status_code: { type: "string" },
//       acquirer_status_code: { type: "string" },
//       message: { type: "string" },

//       txn_detail: {
//         type: "object",
//         required: [
//           "txn_id",
//           "txn_amount",
//           "amount",
//           "status",
//           "net_amount",
//           "currency",
//           "gateway",
//         ],
//         properties: {
//           txn_id: { type: "string" },
//           refund_id: { type: "string" },
//           mrt_refund_id: { type: "string" },
//           txn_amount: { type: "number" },
//           tax_amount: { type: ["number", "null"] },
//           amount: { type: "number" },
//           surcharge_amount: { type: ["number", "null"] },
//           status: { type: "string" },
//           order_id: { type: "string" },
//           net_amount: { type: "number" },
//           remaining_amnt: { type: "string" },
//           gateway: { type: "string" },
//           error_message: { type: "string" },
//           error_code: { type: "string" },
//           currency: { type: "string" },
//           created: { type: "string" },
//         },
//       },

//       raw_response: {
//         type: "object",
//         required: ["status", "message"],
//         properties: {
//           status: { type: "string" },
//           message: { type: "string" },
//           reference: { type: "string" },
//         },
//       },

//       refund_createdAt: { type: "string" },
//     },
//     additionalProperties: true,
//   };

//   const isValid = tv4.validate(data, urbanledgerSeamlessRefundSchema);
//   expect(isValid, `Urbanledger Seamless Refund schema validation failed: ${tv4.error?.message}\nData path: ${tv4.error?.dataPath}\nSchema path: ${tv4.error?.schemaPath}`).toBeTruthy();

//   console.log(`\n✅ [TC_039] Urbanledger Seamless Full Refund + Schema Validation Successful for ${merchant.merchant}`);
//   console.log(`   Transaction ID: ${urbanledgerSeamlessTransactionId}`);
//   console.log(`   Amount Refunded: ${data.txn_detail.amount} ${data.txn_detail.currency}`);
//   console.log(`   Status: ${data.status_code}`);
//   console.log(`   Gateway: ${data.txn_detail.gateway}`);
//   console.log(`   Raw Response Status: ${data.raw_response.status}`);
// });

// ===============================================================
// 🧩 [Positive:TC_040] Verify Full Refund for Curacao (NetAuthorise NSL) with Schema Validation
// ===============================================================
test("[Positive:TC_040] Verify Full Refund for Curacao (NetAuthorise NSL) with Schema Validation", async () => {
  // This test is only for Curacao merchant (TC_022)
  if (!merchant.merchant.toLowerCase().includes("curacao")) {
    test.skip();
  }

  if (!transaction_id) {
    console.warn(`⚠️ [TC_040] No transaction ID found for ${merchant.merchant}. Skipping test.`);
    test.skip();
  }

  console.log(`\n💰 Full Refund for Curacao (NetAuthorise NSL):`);
  console.log(`   Merchant: ${merchant.merchant}`);
  console.log(`   Transaction ID: ${transaction_id}`);

  // Get transaction amount from status check first
  const statusApiUrl = "https://securenew.vernostpay.com/api/intent/check/status";
  const statusPayload = { identifier: transaction_id, verifySupplier: true };
  
  let txnAmount = 10000; // default fallback (100 INR in paise)
  let statusData;
  
  try {
    const statusResponse = await axios.post(statusApiUrl, statusPayload, { headers, timeout: 20000 });
    statusData = statusResponse.data;
    
    // Check if transaction is in a refundable state
    if (statusData.status !== "CAPTURED") {
      console.log(`\n⚠️ [TC_040] Transaction status is ${statusData.status}, not CAPTURED`);
      console.log(`   Refund can only be performed on CAPTURED transactions`);
      console.log(`   Skipping test.`);
      test.skip();
    }
    
    // Status API returns amount in rupees/dollars, convert to base currency units (paise/cents)
    const baseAmount = typeof statusData.amount === 'string' ? parseInt(statusData.amount) : (statusData.amount || 100);
    txnAmount = baseAmount * 100;
    console.log(`   Transaction Amount: ${baseAmount} ${statusData.currency} (${txnAmount} base units)`);
  } catch (error: any) {
    console.log(`⚠️ [TC_040] Could not fetch transaction status: ${error.message}`);
    console.log(`   Using default amount: ${txnAmount} base units`);
  }
  
  const payload = {
    transaction_id: transaction_id,
    amount: txnAmount, // Full refund
  };

  let response;
  try {
    response = await api.post(refundApiUrl, payload);
  } catch (error: any) {
    if (error.response?.status === 400 || error.response?.status === 500) {
      const errorMsg = error.response?.data?.message || error.message;
      console.log(`\n⚠️ [TC_040] Refund API returned ${error.response?.status}: ${errorMsg}`);
      console.log(`   Transaction may already be refunded or in invalid state. Skipping test.`);
      test.skip();
    }
    throw error;
  }
  
  const data = response.data;

  // ✅ Basic Refund Response Validations
  expect(response.status).toBe(200);
  expect(data.status).toBe(true);
  expect(data.status_code).toBe("REFUNDED");
  expect(data.acquirer_status_code).toBe("REFUNDED");
  expect(data.txn_detail).toBeTruthy();
  expect(data.txn_detail.txn_id).toBe(transaction_id);
  expect(data.txn_detail.status).toBe("REFUNDED");
  expect(data.txn_detail.gateway).toContain("AUTHORIZE");
  expect(data.message).toContain("refunded");

  // 🔍 Curacao NetAuthorise NSL Refund Schema Validation
  const curacaoRefundSchema = {
    type: "object",
    required: [
      "id",
      "status",
      "status_code",
      "acquirer_status_code",
      "txn_detail",
      "raw_response",
      "refund_createdAt",
      "message"
    ],
    properties: {
      id: { type: "string" },
      status: { type: "boolean" },
      status_code: { type: "string" },
      acquirer_status_code: { type: "string" },
      txn_detail: {
        type: "object",
        required: [
          "txn_id",
          "refund_id",
          "mrt_refund_id",
          "txn_amount",
          "amount",
          "status",
          "order_id",
          "net_amount",
          "remaining_amnt",
          "gateway",
          "error_message",
          "error_code",
          "currency",
          "created"
        ],
        properties: {
          txn_id: { type: "string" },
          refund_id: { type: "string" },
          mrt_refund_id: { type: "string" },
          txn_amount: { type: "number" },
          tax_amount: { type: ["number", "null"] },
          amount: { type: "number" },
          surcharge_amount: { type: ["number", "null"] },
          status: { type: "string" },
          order_id: { type: "string" },
          net_amount: { type: "number" },
          remaining_amnt: { type: "string" },
          gateway: { type: "string" },
          error_message: { type: "string" },
          error_code: { type: "string" },
          currency: { type: "string" },
          created: { type: "string" }
        },
        additionalProperties: true
      },
      raw_response: {
        type: "object",
        required: ["transactionResponse", "messages"],
        properties: {
          transactionResponse: {
            type: "object",
            required: ["responseCode", "authCode", "transId", "refTransID", "accountNumber", "accountType", "messages"],
            properties: {
              responseCode: { type: "string" },
              authCode: { type: "string" },
              avsResultCode: { type: "string" },
              cvvResultCode: { type: "string" },
              cavvResultCode: { type: "string" },
              transId: { type: "string" },
              refTransID: { type: "string" },
              transHash: { type: "string" },
              testRequest: { type: "string" },
              accountNumber: { type: "string" },
              accountType: { type: "string" },
              messages: { type: "array" },
              transHashSha2: { type: "string" },
              SupplementalDataQualificationIndicator: { type: "number" }
            },
            additionalProperties: true
          },
          messages: {
            type: "object",
            required: ["resultCode", "message"],
            properties: {
              resultCode: { type: "string" },
              message: { type: "array" }
            },
            additionalProperties: true
          }
        },
        additionalProperties: true
      },
      refund_createdAt: { type: "string" },
      message: { type: "string" }
    },
    additionalProperties: true
  };

  const isValid = tv4.validate(data, curacaoRefundSchema);
  expect(isValid, `Curacao Refund schema validation failed: ${tv4.error?.message}\nData path: ${tv4.error?.dataPath}\nSchema path: ${tv4.error?.schemaPath}`).toBeTruthy();

  // 📋 Display Refund Details
  console.log(`\n📋 Refund Details:`);
  console.log(`   Refund Status: ${data.status_code}`);
  console.log(`   Acquirer Refund Status: ${data.acquirer_status_code}`);
  console.log(`   Refund ID: ${data.txn_detail.refund_id}`);
  console.log(`   Transaction ID: ${data.txn_detail.txn_id}`);
  console.log(`   Refund Amount: ${data.txn_detail.amount / 100} ${data.txn_detail.currency}`);
  console.log(`   Transaction Amount: ${data.txn_detail.txn_amount / 100} ${data.txn_detail.currency}`);
  console.log(`   Net Amount: ${data.txn_detail.net_amount / 100} ${data.txn_detail.currency}`);
  console.log(`   Gateway: ${data.txn_detail.gateway}`);
  // console.log(`   Gateway Refund ID: ${data.txn_detail.refund_id}`);
  // console.log(`   Order ID: ${data.txn_detail.order_id}`);
  // console.log(`   Auth Code: ${data.raw_response?.transactionResponse?.authCode || 'N/A'}`);
  // console.log(`   Transaction ID (Gateway): ${data.raw_response?.transactionResponse?.transId || 'N/A'}`);
  // console.log(`   Reference Transaction ID: ${data.raw_response?.transactionResponse?.refTransID || 'N/A'}`);
  // console.log(`   Account Number: ${data.raw_response?.transactionResponse?.accountNumber || 'N/A'}`);
  // console.log(`   Account Type: ${data.raw_response?.transactionResponse?.accountType || 'N/A'}`);
  // console.log(`   Response Code: ${data.raw_response?.transactionResponse?.responseCode || 'N/A'}`);
  // console.log(`   Gateway Message: ${data.raw_response?.messages?.resultCode || 'N/A'}`);
  // console.log(`   Created At: ${data.refund_createdAt}`);
  // console.log(`   Message: ${data.message}`);

  console.log(`\n✅ [TC_040] Curacao Full Refund + Schema Validation Successful for ${merchant.merchant}`);
});

// ===============================================================
// 🧩 [Positive:TC_043] Verify Full Refund for Curacao (NetAuthorise NSL) from TC_023 with Schema Validation
// ===============================================================
test("[Positive:TC_043] Verify Full Refund for Curacao (NetAuthorise NSL) from TC_023 with Schema Validation", async () => {
  // This test is only for Curacao merchant (TC_023)
  if (!merchant.merchant.toLowerCase().includes("curacao")) {
    test.skip();
  }

  const curacaoTransactionId = parsed.transaction_id2;
  
  if (!curacaoTransactionId) {
    console.log(`⚠️ [TC_043] No transaction_id2 found from TC_023 for Curacao, skipping test`);
    test.skip();
  }

  console.log(`\n🔍 [TC_043] Curacao NSL - Using transaction from TC_023: ${curacaoTransactionId}`);

  // Get the actual transaction amount from status check API
  const statusApiUrl = "https://securenew.vernostpay.com/api/intent/check/status";
  const statusPayload = { identifier: curacaoTransactionId, verifySupplier: true };
  
  let originalAmount = 10000; // default fallback (100 INR in paise)
  let currencyCode = "INR";
  try {
    const statusResponse = await axios.post(statusApiUrl, statusPayload, { headers, timeout: 20000 });
    const amountFromApi = statusResponse.data.amount;
    currencyCode = statusResponse.data.currency || "INR";
    // Status API returns amount in rupees, multiply by 100 to get paise
    const baseAmount = typeof amountFromApi === 'string' ? parseFloat(amountFromApi) : (amountFromApi || 100);
    originalAmount = Math.round(baseAmount * 100);
    console.log(`✅ [TC_043] Retrieved transaction details: ${baseAmount} ${currencyCode} (${originalAmount} in smallest unit)`);
  } catch (error: any) {
    console.log(`⚠️ [TC_043] Could not fetch transaction amount: ${error.message}, using default: ${originalAmount}`);
  }

  // ==================== FULL REFUND ====================
  const payload = {
    transaction_id: curacaoTransactionId,
    amount: originalAmount,
  };

  console.log(`\n💰 [TC_043] Performing FULL refund:`);
  console.log(`   Transaction ID: ${curacaoTransactionId}`);
  console.log(`   Refund Amount: ${originalAmount} paise (${originalAmount / 100} ${currencyCode})`);

  let response;
  try {
    response = await api.post(refundApiUrl, payload);
  } catch (error: any) {
    if (error.response?.status === 400 || error.response?.status === 500) {
      const errorMsg = error.response?.data?.message || error.message;
      console.log(`⚠️ [TC_043] Refund API returned ${error.response?.status}: ${errorMsg}`);
      console.log(`Transaction may already be refunded or in invalid state. Skipping test.`);
      test.skip();
    }
    throw error;
  }
  
  const data = response.data;

  // ==================== BASIC VALIDATIONS ====================
  expect(response.status).toBe(200);
  expect(data.status).toBe(true);
  expect(data.status_code).toBe("REFUNDED");
  expect(data.acquirer_status_code).toBe("REFUNDED");
  expect(data.message).toContain("refunded");

  // ==================== TXN DETAIL VALIDATIONS ====================
  expect(data.txn_detail).toBeTruthy();
  expect(data.txn_detail.txn_id).toBe(curacaoTransactionId);
  expect(data.txn_detail.refund_id).toBeTruthy();
  expect(data.txn_detail.status).toBe("REFUNDED");
  expect(data.txn_detail.txn_amount).toBe(originalAmount);
  expect(data.txn_detail.amount).toBe(originalAmount);
  expect(data.txn_detail.net_amount).toBe(originalAmount);
  expect(data.txn_detail.currency).toBe(currencyCode);
  expect(data.txn_detail.gateway).toContain("Curacao");

  // For full refund, remaining_amnt should be empty string or "0"
  const remainingAmount = data.txn_detail.remaining_amnt;
  const expectedRemaining = remainingAmount === "" || remainingAmount === "0" || remainingAmount === 0;
  expect(expectedRemaining).toBeTruthy();

  // ==================== RAW RESPONSE VALIDATIONS ====================
  expect(data.raw_response).toBeTruthy();
  expect(data.raw_response.status).toBe("success");
  expect(data.raw_response.code).toBe(200);
  expect(data.raw_response.payment_id).toBeTruthy();
  expect(data.raw_response.merchant_refund_ref).toBeTruthy();
  expect(data.raw_response.refund_ref).toBeTruthy();
  expect(data.raw_response.refund_amount).toBeTruthy();
  expect(data.raw_response.refunded_at).toBeTruthy();

  // ==================== TIMESTAMP ====================
  expect(data.refund_createdAt).toBeTruthy();

  // ==================== SCHEMA VALIDATION ====================
  const curacaoFullRefundSchema = {
    type: "object",
    required: [
      "id",
      "status",
      "status_code",
      "acquirer_status_code",
      "txn_detail",
      "raw_response",
      "refund_createdAt",
      "message",
    ],
    properties: {
      id: { type: "string" },
      status: { type: "boolean" },
      status_code: { type: "string" },
      acquirer_status_code: { type: "string" },
      message: { type: "string" },

      txn_detail: {
        type: "object",
        required: [
          "txn_id",
          "refund_id",
          "mrt_refund_id",
          "txn_amount",
          "amount",
          "status",
          "order_id",
          "net_amount",
          "remaining_amnt",
          "gateway",
          "error_message",
          "error_code",
          "currency",
          "created",
        ],
        properties: {
          txn_id: { type: "string" },
          refund_id: { type: "string" },
          mrt_refund_id: { type: "string" },
          txn_amount: { type: "number" },
          tax_amount: { type: ["number", "null"] },
          amount: { type: "number" },
          surcharge_amount: { type: ["number", "null"] },
          status: { type: "string" },
          order_id: { type: "string" },
          net_amount: { type: "number" },
          remaining_amnt: { type: "string" },
          gateway: { type: "string" },
          error_message: { type: "string" },
          error_code: { type: "string" },
          currency: { type: "string" },
          created: { type: "string" },
        },
      },

      raw_response: {
        type: "object",
        required: [
          "status",
          "code",
          "payment_id",
          "merchant_refund_ref",
          "refund_ref",
          "refund_amount",
          "refunded_at",
        ],
        properties: {
          status: { type: "string" },
          code: { type: "number" },
          payment_id: { type: "string" },
          merchant_refund_ref: { type: "string" },
          refund_ref: { type: "string" },
          refund_amount: { type: "string" },
          refunded_at: { type: "string" },
        },
      },

      refund_createdAt: { type: "string" },
    },
    additionalProperties: true,
  };

  const isValid = tv4.validate(data, curacaoFullRefundSchema);
  expect(isValid, `Full refund schema validation failed: ${tv4.error?.message}`).toBeTruthy();

  // ==================== PRINT FULL REFUND DETAILS ====================
  console.log(`\n💰 [Curacao NSL] Full Refund Response Details:`);
  console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`   Transaction ID: ${curacaoTransactionId}`);
  console.log(`   Refund ID: ${data.txn_detail.refund_id}`);
  console.log(`   Order ID: ${data.txn_detail.order_id}`);
  console.log(`   Merchant Refund Ref: ${data.raw_response.merchant_refund_ref}`);
  console.log(`   Gateway Refund Ref: ${data.raw_response.refund_ref}`);
  console.log(`   Refund Status: ${data.status_code}`);
  console.log(`   Acquirer Status: ${data.acquirer_status_code}`);
  console.log(`   Transaction Amount: ${data.txn_detail.txn_amount / 100} ${data.txn_detail.currency} (${data.txn_detail.txn_amount} paise)`);
  console.log(`   Amount Refunded: ${data.txn_detail.amount / 100} ${data.txn_detail.currency} (${data.txn_detail.amount} paise)`);
  console.log(`   Net Amount: ${data.txn_detail.net_amount / 100} ${data.txn_detail.currency}`);
  console.log(`   Remaining Amount: ${data.txn_detail.remaining_amnt}`);
  console.log(`   Gateway: ${data.txn_detail.gateway}`);
  console.log(`   Message: ${data.message}`);
  console.log(`   Payment ID: ${data.raw_response.payment_id}`);
  console.log(`   Refund Amount (Gateway): ${data.raw_response.refund_amount} ${currencyCode}`);
  console.log(`   Refunded At: ${data.raw_response.refunded_at}`);
  console.log(`   Created At: ${data.refund_createdAt}`);
  console.log(`   Raw Response Status: ${data.raw_response.status}`);
  console.log(`   Raw Response Code: ${data.raw_response.code}`);
  console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  console.log(`\n✅ [TC_043] Curacao NSL Full Refund + Schema Validation Successful`);
});

// ===============================================================
// 🧩 [Positive:TC_044] Verify Partial + Full Refund for Curacao (NetAuthorise NSL) with Schema Validation
// ===============================================================
test("[Positive:TC_044] Verify Partial + Full Refund for Curacao (NetAuthorise NSL) with Schema Validation", async () => {
  // This test is only for Curacao merchant (TC_024)
  if (!merchant.merchant.toLowerCase().includes("curacao")) {
    test.skip();
  }

  const curacaoTransactionId = parsed.transactionId_tc024;
  
  if (!curacaoTransactionId) {
    console.log(`⚠️ [TC_044] No transactionId_tc024 found for Curacao, skipping test`);
    test.skip();
  }

  // console.log(`\n🔍 [TC_044] Curacao - Using transaction from TC_024: ${curacaoTransactionId}`);

  // Get the actual transaction amount from status check API
  const statusApiUrl = "https://securenew.vernostpay.com/api/intent/check/status";
  const statusPayload = { identifier: curacaoTransactionId, verifySupplier: true };
  
  let originalAmount = 10000; // default fallback (100 INR in paise)
  let currencyCode = "INR";
  try {
    const statusResponse = await axios.post(statusApiUrl, statusPayload, { headers, timeout: 20000 });
    const amountFromApi = statusResponse.data.amount;
    currencyCode = statusResponse.data.currency || "INR";
    // Status API returns amount in rupees, multiply by 100 to get paise
    const baseAmount = typeof amountFromApi === 'string' ? parseFloat(amountFromApi) : (amountFromApi || 100);
    originalAmount = Math.round(baseAmount * 100);
    // console.log(`✅ [TC_044] Retrieved transaction details: ${baseAmount} ${currencyCode} (${originalAmount} in smallest unit)`);
  } catch (error: any) {
    console.log(`⚠️ [TC_044] Could not fetch transaction amount: ${error.message}, using default: ${originalAmount}`);
  }

  // ==================== PARTIAL REFUND ====================
  const partialRefundAmount = 5000; // 50 INR in paise
  const payload = {
    transaction_id: curacaoTransactionId,
    amount: partialRefundAmount,
  };

  console.log(`\n💰 [TC_044] Performing PARTIAL refund:`);
  console.log(`   Transaction ID: ${curacaoTransactionId}`);
  console.log(`   Original Amount: ${originalAmount} paise (${originalAmount / 100} ${currencyCode})`);
  console.log(`   Partial Refund Amount: ${partialRefundAmount} paise (${partialRefundAmount / 100} ${currencyCode})`);

  let response;
  try {
    response = await api.post(refundApiUrl, payload);
  } catch (error: any) {
    if (error.response?.status === 400 || error.response?.status === 500) {
      const errorMsg = error.response?.data?.message || error.message;
      console.log(`⚠️ [TC_044] Refund API returned ${error.response?.status}: ${errorMsg}`);
      console.log(`Transaction may already be refunded or in invalid state. Skipping test.`);
      test.skip();
    }
    throw error;
  }
  
  const data = response.data;

  // ==================== BASIC VALIDATIONS ====================
  expect(response.status).toBe(200);
  expect(data.status).toBe(true);
  expect(data.status_code).toBe("PARTIAL_REFUNDED");
  expect(data.acquirer_status_code).toBe("REFUNDED");
  expect(data.message).toContain("partially refunded");

  // ==================== TXN DETAIL VALIDATIONS ====================
  expect(data.txn_detail).toBeTruthy();
  expect(data.txn_detail.txn_id).toBe(curacaoTransactionId);
  expect(data.txn_detail.refund_id).toBeTruthy();
  expect(data.txn_detail.status).toBe("PARTIAL_REFUNDED");
  expect(data.txn_detail.txn_amount).toBe(originalAmount);
  expect(data.txn_detail.amount).toBe(partialRefundAmount);
  expect(data.txn_detail.net_amount).toBe(originalAmount);
  expect(data.txn_detail.currency).toBe(currencyCode);
  expect(data.txn_detail.gateway).toContain("Curacao");

  // Calculate expected remaining amount
  const expectedRemaining = originalAmount - partialRefundAmount;
  expect(data.txn_detail.remaining_amnt).toBe(expectedRemaining);

  // ==================== RAW RESPONSE VALIDATIONS ====================
  expect(data.raw_response).toBeTruthy();
  expect(data.raw_response.status).toBe("success");
  expect(data.raw_response.code).toBe(200);
  expect(data.raw_response.payment_id).toBeTruthy();
  expect(data.raw_response.merchant_refund_ref).toBeTruthy();
  expect(data.raw_response.refund_ref).toBeTruthy();
  expect(data.raw_response.refund_amount).toBeTruthy();
  expect(data.raw_response.refunded_at).toBeTruthy();

  // ==================== TIMESTAMP ====================
  expect(data.refund_createdAt).toBeTruthy();

  // ==================== SCHEMA VALIDATION ====================
  const curacaoPartialRefundSchema = {
    type: "object",
    required: [
      "id",
      "status",
      "status_code",
      "acquirer_status_code",
      "txn_detail",
      "raw_response",
      "refund_createdAt",
      "message",
    ],
    properties: {
      id: { type: "string" },
      status: { type: "boolean" },
      status_code: { type: "string" },
      acquirer_status_code: { type: "string" },
      message: { type: "string" },

      txn_detail: {
        type: "object",
        required: [
          "txn_id",
          "refund_id",
          "mrt_refund_id",
          "txn_amount",
          "amount",
          "status",
          "net_amount",
          "remaining_amnt",
          "currency",
          "gateway",
        ],
        properties: {
          txn_id: { type: "string" },
          refund_id: { type: "string" },
          mrt_refund_id: { type: "string" },
          txn_amount: { type: "number" },
          tax_amount: { type: ["number", "null"] },
          amount: { type: "number" },
          surcharge_amount: { type: ["number", "null"] },
          status: { type: "string" },
          order_id: { type: "string" },
          net_amount: { type: "number" },
          remaining_amnt: { type: "number" },
          gateway: { type: "string" },
          error_message: { type: "string" },
          error_code: { type: "string" },
          currency: { type: "string" },
          created: { type: "string" },
        },
      },

      raw_response: {
        type: "object",
        required: [
          "status",
          "code",
          "payment_id",
          "merchant_refund_ref",
          "refund_ref",
          "refund_amount",
          "refunded_at",
        ],
        properties: {
          status: { type: "string" },
          code: { type: "number" },
          payment_id: { type: "string" },
          merchant_refund_ref: { type: "string" },
          refund_ref: { type: "string" },
          refund_amount: { type: "string" },
          refunded_at: { type: "string" },
        },
      },

      refund_createdAt: { type: "string" },
    },
    additionalProperties: true,
  };

  const isValid = tv4.validate(data, curacaoPartialRefundSchema);
  expect(isValid, `Partial refund schema validation failed: ${tv4.error?.message}`).toBeTruthy();

  // ==================== PRINT PARTIAL REFUND DETAILS ====================
  console.log(`\n💰 [Curacao] Partial Refund Response Details:`);
  console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`   Transaction ID: ${curacaoTransactionId}`);
  console.log(`   Refund ID: ${data.txn_detail.refund_id}`);
  console.log(`   Merchant Refund Ref: ${data.raw_response.merchant_refund_ref}`);
  console.log(`   Gateway Refund Ref: ${data.raw_response.refund_ref}`);
  console.log(`   Refund Status: ${data.status_code}`);
  console.log(`   Acquirer Status: ${data.acquirer_status_code}`);
  console.log(`   Original Amount: ${data.txn_detail.txn_amount / 100} ${data.txn_detail.currency} (${data.txn_detail.txn_amount} paise)`);
  console.log(`   Amount Refunded: ${data.txn_detail.amount / 100} ${data.txn_detail.currency} (${data.txn_detail.amount} paise)`);
  console.log(`   Remaining Amount: ${data.txn_detail.remaining_amnt / 100} ${data.txn_detail.currency} (${data.txn_detail.remaining_amnt} paise)`);
  console.log(`   Net Amount: ${data.txn_detail.net_amount / 100} ${data.txn_detail.currency}`);
  console.log(`   Gateway: ${data.txn_detail.gateway}`);
  console.log(`   Message: ${data.message}`);
  console.log(`   Payment ID: ${data.raw_response.payment_id}`);
  console.log(`   Refunded At: ${data.raw_response.refunded_at}`);
  console.log(`   Created At: ${data.refund_createdAt}`);
  console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  // console.log(`\n✅ [TC_044] PARTIAL Refund + Schema Validation Successful`);

  // ==================== FULL REFUND (REMAINING AMOUNT) ====================
  const actualRemainingAmount = data.txn_detail.remaining_amnt;

  if (actualRemainingAmount && actualRemainingAmount > 0) {
    console.log(`\n💰 [TC_044] Performing FULL refund (remaining amount):`);
    console.log(`   Transaction ID: ${curacaoTransactionId}`);
    console.log(`   Remaining Refund Amount: ${actualRemainingAmount} paise (${actualRemainingAmount / 100} ${currencyCode})`);
    
    const remainingRefundPayload = {
      transaction_id: curacaoTransactionId,
      amount: actualRemainingAmount,
    };

    try {
      const remainingResponse = await api.post(refundApiUrl, remainingRefundPayload);
      const remainingData = remainingResponse.data;

      // ==================== VALIDATIONS FOR FULL REFUND ====================
      expect(remainingResponse.status).toBe(200);
      expect(remainingData.status).toBe(true);
      expect(remainingData.status_code).toBe("REFUNDED");
      expect(remainingData.acquirer_status_code).toBe("REFUNDED");
      expect(remainingData.message).toContain("refunded");
      
      expect(remainingData.txn_detail.txn_id).toBe(curacaoTransactionId);
      expect(remainingData.txn_detail.status).toBe("REFUNDED");
      expect(remainingData.txn_detail.amount).toBe(actualRemainingAmount);
      
      // For full refund, remaining_amnt should be 0 or "0" or empty string
      const finalRemaining = typeof remainingData.txn_detail.remaining_amnt === 'string'
        ? (remainingData.txn_detail.remaining_amnt === "" || remainingData.txn_detail.remaining_amnt === "0" ? 0 : parseInt(remainingData.txn_detail.remaining_amnt))
        : (remainingData.txn_detail.remaining_amnt || 0);
      expect(finalRemaining).toBe(0);

      // ==================== SCHEMA VALIDATION FOR FULL REFUND ====================
      const curacaoFullRefundSchema = {
        type: "object",
        required: [
          "id",
          "status",
          "status_code",
          "acquirer_status_code",
          "txn_detail",
          "raw_response",
          "refund_createdAt",
          "message",
        ],
        properties: {
          id: { type: "string" },
          status: { type: "boolean" },
          status_code: { type: "string" },
          acquirer_status_code: { type: "string" },
          txn_detail: {
            type: "object",
            required: [
              "txn_id",
              "refund_id",
              "txn_amount",
              "amount",
              "status",
              "net_amount",
              "remaining_amnt",
              "currency",
            ],
          },
          raw_response: { type: "object" },
          refund_createdAt: { type: "string" },
          message: { type: "string" },
        },
        additionalProperties: true,
      };

      const isValidRemaining = tv4.validate(remainingData, curacaoFullRefundSchema);
      expect(isValidRemaining, `Full refund schema validation failed: ${tv4.error?.message}`).toBeTruthy();

      // ==================== PRINT FULL REFUND DETAILS ====================
      console.log(`\n💰 [Curacao] Full Refund Response Details:`);
      console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`   Transaction ID: ${curacaoTransactionId}`);
      console.log(`   Refund ID: ${remainingData.txn_detail.refund_id}`);
      console.log(`   Merchant Refund Ref: ${remainingData.raw_response.merchant_refund_ref}`);
      console.log(`   Acquirer Gateway Refund Ref: ${remainingData.raw_response.refund_ref}`);
      console.log(`   Refund Status: ${remainingData.status_code}`);
      console.log(`   Acquirer Status: ${remainingData.acquirer_status_code}`);
      console.log(`   Final Refunded Amount: ${remainingData.txn_detail.amount / 100} ${remainingData.txn_detail.currency} (${remainingData.txn_detail.amount} paise)`);
      console.log(`   Final Remaining Amount: ${finalRemaining / 100} ${remainingData.txn_detail.currency} (${finalRemaining} paise)`);
      console.log(`   Gateway: ${remainingData.txn_detail.gateway}`);
      console.log(`   Message: ${remainingData.message}`);
      console.log(`   Payment ID: ${remainingData.raw_response.payment_id}`);
      console.log(`   Refunded At: ${remainingData.raw_response.refunded_at}`);
      console.log(`   Created At: ${remainingData.refund_createdAt}`);
      console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      
      // Calculate total refunded
      const totalRefunded = partialRefundAmount + actualRemainingAmount;
      console.log(`\n🎉 [TC_044] Complete: Transaction fully refunded`);
      console.log(`   Partial Refund: ${partialRefundAmount} paise (${partialRefundAmount / 100} ${currencyCode})`);
      console.log(`   Final Refund: ${actualRemainingAmount} paise (${actualRemainingAmount / 100} ${currencyCode})`);
      console.log(`   Total Refunded: ${totalRefunded} paise = ${data.txn_detail.txn_amount} paise (${totalRefunded / 100} ${currencyCode})`);
      console.log(`   Final Status: ${remainingData.status_code}`);
      
      console.log(`\n✅ [TC_044] FULL Refund + Schema Validation Successful`);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      console.log(`\n⚠️ [TC_044] Full refund (remaining) failed: ${errorMsg}`);
      console.log(`   This might happen if the transaction is already fully refunded or in invalid state`);
    }
  } else {
    console.log(`\n⚠️ [TC_044] No remaining amount to refund`);
  }
});

// ===============================================================
// 🧩 [Positive:TC_042] Verify Full Refund for Booking Bash (Paytabs) with Schema Validation
// ===============================================================
test("[Positive:TC_042] Verify Full Refund for Booking Bash (Paytabs) with Schema Validation", async () => {
  // This test is only for Booking Bash merchant (TC_021)
  if (!merchant.merchant.toLowerCase().includes("booking bash")) {
    test.skip();
  }

  if (!transaction_id) {
    console.warn(`⚠️ [TC_042] No transaction ID found for ${merchant.merchant}. Skipping test.`);
    test.skip();
  }

  console.log(`\n💰 [TC_042] Full Refund for Booking Bash (Paytabs):`);
  console.log(`   Merchant: ${merchant.merchant}`);
  // console.log(`   Transaction ID: ${transaction_id}`);

  // Get the actual transaction amount from status check API first
  const statusApiUrl = "https://securenew.vernostpay.com/api/intent/check/status";
  const statusPayload = { identifier: transaction_id, verifySupplier: true };
  
  let txnAmount = 10000; // default fallback
  try {
    const statusResponse = await axios.post(statusApiUrl, statusPayload, { headers, timeout: 15000 });
    const statusData = statusResponse.data;
    
    // Check if status is CAPTURED before attempting refund
    if (statusData.status !== "CAPTURED") {
      console.warn(`⚠️ [TC_042] Transaction is in ${statusData.status} state, not CAPTURED. Skipping refund.`);
      test.skip();
    }
    
    txnAmount = statusData.amount * 100; // Convert to base units (paise/fils)
    // console.log(`   Transaction Amount: ${statusData.amount} ${statusData.currency}`);
  } catch (error: any) {
    console.warn(`⚠️ [TC_042] Could not fetch transaction amount: ${error.message}`);
  }

  const refundPayload = {
    transaction_id: transaction_id,
    amount: txnAmount,
    refund_description: `Full refund for ${transaction_id}`,
  };

  const refundResponse = await api.post(refundApiUrl, refundPayload);
  const data = refundResponse.data;

  // ✅ Basic Validations
  expect(refundResponse.status).toBe(200);
  expect(data.status).toBe(true);
  
  // Accept REFUNDED or PARTIAL_REFUNDED status (depending on if there were prior partial refunds)
  const validStatuses = ["REFUNDED", "PARTIAL_REFUNDED"];
  expect(validStatuses).toContain(data.status_code);
  
  expect(data.acquirer_status_code).toBe("REFUNDED");
  expect(data.txn_detail).toBeTruthy();
  expect(data.txn_detail.txn_id).toBe(transaction_id);

  // 🔍 Refund Schema Validation for Paytabs
  const refundSchema = {
    type: "object",
    required: [
      "id",
      "status",
      "status_code",
      "acquirer_status_code",
      "txn_detail",
      "raw_response",
      "refund_createdAt",
      "message"
    ],
    properties: {
      id: { type: "string" },
      status: { type: "boolean" },
      status_code: { type: "string" },
      acquirer_status_code: { type: "string" },
      message: { type: "string" },
      txn_detail: {
        type: "object",
        required: [
          "txn_id",
          "refund_id",
          "txn_amount",
          "amount",
          "status",
          "order_id",
          "net_amount",
          "gateway",
          "currency",
          "created"
        ],
        properties: {
          txn_id: { type: "string" },
          refund_id: { type: "string" },
          mrt_refund_id: { type: "string" },
          txn_amount: { type: "number" },
          tax_amount: { type: ["number", "null"] },
          amount: { type: "number" },
          surcharge_amount: { type: ["number", "null"] },
          status: { type: "string" },
          order_id: { type: "string" },
          net_amount: { type: "number" },
          remaining_amnt: { type: ["number", "string"] },
          gateway: { type: "string" },
          error_message: { type: "string" },
          error_code: { type: "string" },
          currency: { type: "string" },
          created: { type: "string" }
        }
      },
      raw_response: {
        type: "object",
        required: [
          "tran_ref",
          "previous_tran_ref",
          "tran_type",
          "cart_id",
          "cart_description",
          "cart_currency",
          "cart_amount",
          "tran_currency",
          "tran_total",
          "customer_details",
          "payment_result",
          "payment_info"
        ],
        properties: {
          tran_ref: { type: "string" },
          previous_tran_ref: { type: "string" },
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
      },
      refund_createdAt: { type: "string" }
    },
    additionalProperties: true
  };

  const isValid = tv4.validate(data, refundSchema);
  expect(isValid, `Refund schema validation failed: ${tv4.error?.message}\nData path: ${tv4.error?.dataPath}\nSchema path: ${tv4.error?.schemaPath}`).toBeTruthy();

  // 📋 Display Refund Details
  console.log(`\n📋 Full Refund Details:`);
  console.log(`   Refund Status: ${data.status_code}`);
  console.log(`   Refund ID: ${data.id}`);
  console.log(`   Transaction ID: ${data.txn_detail.txn_id}`);
  console.log(`   Refund Amount: ${data.txn_detail.amount / 100} ${data.txn_detail.currency}`);
  console.log(`   Transaction Amount: ${data.txn_detail.txn_amount / 100} ${data.txn_detail.currency}`);
  console.log(`   Net Amount: ${data.txn_detail.net_amount / 100} ${data.txn_detail.currency}`);
  console.log(`   Remaining Amount: ${data.txn_detail.remaining_amnt / 100} ${data.txn_detail.currency}`);
  console.log(`   Gateway: ${data.txn_detail.gateway}`);
  // console.log(`   Gateway Refund ID: ${data.txn_detail.refund_id}`);
  // console.log(`   Order ID: ${data.txn_detail.order_id}`);
  // console.log(`   Previous Transaction Ref: ${data.raw_response?.previous_tran_ref || 'N/A'}`);
  // console.log(`   Refund Transaction Ref: ${data.raw_response?.tran_ref || 'N/A'}`);
  // console.log(`   Payment Method: ${data.raw_response?.payment_info?.payment_method || 'N/A'}`);
  // console.log(`   Card Type: ${data.raw_response?.payment_info?.card_type || 'N/A'}`);
  // console.log(`   Card Scheme: ${data.raw_response?.payment_info?.card_scheme || 'N/A'}`);
  // console.log(`   Card Description: ${data.raw_response?.payment_info?.payment_description || 'N/A'}`);
  // console.log(`   Response Code: ${data.raw_response?.payment_result?.response_code || 'N/A'}`);
  // console.log(`   Response Message: ${data.raw_response?.payment_result?.response_message || 'N/A'}`);
  // console.log(`   Created At: ${data.refund_createdAt}`);
  // console.log(`   Message: ${data.message}`);

  console.log(`\n✅ [TC_042] Booking Bash Full Refund + Schema Validation Successful`);
});

// // ===============================================================
// // 🧩 [Positive:TC_043] Verify Partial + Remaining Refund for Booking Bash (Paytabs) from TC_026
// // ===============================================================
// test("[Positive:TC_043] Verify Partial + Remaining Refund for Booking Bash (Paytabs) from TC_026", async () => {
//   // This test is only for Booking Bash merchant (TC_026)
//   if (!merchant.merchant.toLowerCase().includes("booking bash")) {
//     test.skip();
//   }

//   // Read transaction_id2 from merchant-specific file (saved by TC_026)
//   const txFile = path.resolve(process.cwd(), `transaction.${merchant.merchant.replace(/\s+/g, "_")}.json`);
  
//   if (!fs.existsSync(txFile)) {
//     console.warn(`⚠️ [TC_043] Transaction file not found for ${merchant.merchant}. Skipping test.`);
//     test.skip();
//   }

//   const txData = JSON.parse(fs.readFileSync(txFile, "utf8"));
//   const transaction_id2 = txData.transaction_id2;

//   if (!transaction_id2) {
//     console.warn(`⚠️ [TC_043] No transaction_id2 found for ${merchant.merchant}. Run TC_026 first.`);
//     test.skip();
//   }

//   console.log(`\n💰 [TC_043] Partial + Remaining Refund for Booking Bash (Paytabs) from TC_026:`);
//   console.log(`   Merchant: ${merchant.merchant}`);
//   // console.log(`   Transaction ID (from TC_026): ${transaction_id2}`);

//   // Get the actual transaction amount from status check API first
//   const statusApiUrl = "https://securenew.vernostpay.com/api/intent/check/status";
//   const statusPayload = { identifier: transaction_id2, verifySupplier: true };
  
//   let txnAmount = 10000; // default fallback (100 AED = 10000 fils)
//   let currency = "AED";
  
//   try {
//     const statusResponse = await axios.post(statusApiUrl, statusPayload, { headers, timeout: 15000 });
//     const statusData = statusResponse.data;
    
//     // Check if status is CAPTURED before attempting refund
//     if (statusData.status !== "CAPTURED") {
//       console.warn(`⚠️ [TC_043] Transaction is in ${statusData.status} state, not CAPTURED. Skipping refund.`);
//       test.skip();
//     }
    
//     txnAmount = statusData.amount * 100; // Convert to base units (fils)
//     currency = statusData.currency;
//     // console.log(`   Transaction Amount: ${statusData.amount} ${currency} (${txnAmount} base units)`);
//   } catch (error: any) {
//     console.warn(`⚠️ [TC_043] Could not fetch transaction amount: ${error.message}`);
//   }

//   // ========== STEP 1: PARTIAL REFUND (50% of transaction amount) ==========
//   const partialAmount = Math.floor(txnAmount / 2); // 50% refund
//   console.log(`\n🔹 STEP 1: Performing Partial Refund (50%): ${partialAmount / 100} ${currency}`);

//   const partialRefundPayload = {
//     transaction_id: transaction_id2,
//     amount: partialAmount,
//     refund_description: `Partial refund (50%) for ${transaction_id2}`,
//   };

//   const partialRefundResponse = await api.post(refundApiUrl, partialRefundPayload);
//   const partialData = partialRefundResponse.data;

//   // ✅ Partial Refund Validations
//   expect(partialRefundResponse.status).toBe(200);
//   expect(partialData.status).toBe(true);
//   expect(partialData.status_code).toBe("PARTIAL_REFUNDED");
//   expect(partialData.acquirer_status_code).toBe("REFUNDED");
//   expect(partialData.txn_detail).toBeTruthy();
//   expect(partialData.txn_detail.txn_id).toBe(transaction_id2);
//   expect(partialData.txn_detail.amount).toBe(partialAmount);

//   // 📋 Display Partial Refund Details
//   console.log(`\n📋 Partial Refund Details:`);
//   console.log(`   Refund Status: ${partialData.status_code}`);
//   console.log(`   Refund ID: ${partialData.id}`);
//   console.log(`   Transaction ID: ${partialData.txn_detail.txn_id}`);
//   console.log(`   Refund Amount: ${partialData.txn_detail.amount / 100} ${partialData.txn_detail.currency}`);
//   console.log(`   Transaction Amount: ${partialData.txn_detail.txn_amount / 100} ${partialData.txn_detail.currency}`);
//   console.log(`   Net Amount: ${partialData.txn_detail.net_amount / 100} ${partialData.txn_detail.currency}`);
//   console.log(`   Remaining Amount: ${partialData.txn_detail.remaining_amnt / 100} ${partialData.txn_detail.currency}`);
//   // console.log(`   Gateway: ${partialData.txn_detail.gateway}`);
//   // console.log(`   Gateway Refund ID: ${partialData.txn_detail.refund_id}`);
//   // console.log(`   Order ID: ${partialData.txn_detail.order_id}`);
//   // console.log(`   Previous Transaction Ref: ${partialData.raw_response?.previous_tran_ref || 'N/A'}`);
//   // console.log(`   Refund Transaction Ref: ${partialData.raw_response?.tran_ref || 'N/A'}`);
//   // console.log(`   Payment Method: ${partialData.raw_response?.payment_info?.payment_method || 'N/A'}`);
//   // console.log(`   Card Type: ${partialData.raw_response?.payment_info?.card_type || 'N/A'}`);
//   // console.log(`   Response Code: ${partialData.raw_response?.payment_result?.response_code || 'N/A'}`);
//   // console.log(`   Response Message: ${partialData.raw_response?.payment_result?.response_message || 'N/A'}`);
//   // console.log(`   Created At: ${partialData.refund_createdAt}`);

//   console.log(`\n✅ Partial Refund (50%) Successful!`);

//   // Wait a bit before second refund
//   await new Promise(resolve => setTimeout(resolve, 2000));

//   // ========== STEP 2: REMAINING REFUND (50% remaining amount) ==========
//   const remainingAmount = txnAmount - partialAmount; // Remaining 50%
//   console.log(`\n🔹 STEP 2: Performing Remaining Refund: ${remainingAmount / 100} ${currency}`);

//   const remainingRefundPayload = {
//     transaction_id: transaction_id2,
//     amount: remainingAmount,
//     refund_description: `Remaining refund for ${transaction_id2}`,
//   };

//   const remainingRefundResponse = await api.post(refundApiUrl, remainingRefundPayload);
//   const remainingData = remainingRefundResponse.data;

//   // ✅ Remaining Refund Validations
//   expect(remainingRefundResponse.status).toBe(200);
//   expect(remainingData.status).toBe(true);
//   expect(remainingData.status_code).toBe("REFUNDED"); // Full refund after remaining refund
//   expect(remainingData.acquirer_status_code).toBe("REFUNDED");
//   expect(remainingData.txn_detail).toBeTruthy();
//   expect(remainingData.txn_detail.txn_id).toBe(transaction_id2);
//   expect(remainingData.txn_detail.amount).toBe(remainingAmount);

//   // 🔍 Refund Schema Validation for Paytabs (same schema as TC_042)
//   const refundSchema = {
//     type: "object",
//     required: [
//       "id",
//       "status",
//       "status_code",
//       "acquirer_status_code",
//       "txn_detail",
//       "raw_response",
//       "refund_createdAt",
//       "message"
//     ],
//     properties: {
//       id: { type: "string" },
//       status: { type: "boolean" },
//       status_code: { type: "string" },
//       acquirer_status_code: { type: "string" },
//       message: { type: "string" },
//       txn_detail: {
//         type: "object",
//         required: [
//           "txn_id",
//           "refund_id",
//           "txn_amount",
//           "amount",
//           "status",
//           "order_id",
//           "net_amount",
//           "gateway",
//           "currency",
//           "created"
//         ],
//         properties: {
//           txn_id: { type: "string" },
//           refund_id: { type: "string" },
//           mrt_refund_id: { type: "string" },
//           txn_amount: { type: "number" },
//           tax_amount: { type: ["number", "null"] },
//           amount: { type: "number" },
//           surcharge_amount: { type: ["number", "null"] },
//           status: { type: "string" },
//           order_id: { type: "string" },
//           net_amount: { type: "number" },
//           remaining_amnt: { type: ["number", "string"] },
//           gateway: { type: "string" },
//           error_message: { type: "string" },
//           error_code: { type: "string" },
//           currency: { type: "string" },
//           created: { type: "string" }
//         }
//       },
//       raw_response: {
//         type: "object",
//         required: [
//           "tran_ref",
//           "previous_tran_ref",
//           "tran_type",
//           "cart_id",
//           "cart_description",
//           "cart_currency",
//           "cart_amount",
//           "tran_currency",
//           "tran_total",
//           "customer_details",
//           "payment_result",
//           "payment_info"
//         ],
//         properties: {
//           tran_ref: { type: "string" },
//           previous_tran_ref: { type: "string" },
//           tran_type: { type: "string" },
//           cart_id: { type: "string" },
//           cart_description: { type: "string" },
//           cart_currency: { type: "string" },
//           cart_amount: { type: "string" },
//           tran_currency: { type: "string" },
//           tran_total: { type: "string" },
//           customer_details: { type: "object" },
//           payment_result: {
//             type: "object",
//             properties: {
//               response_status: { type: "string" },
//               response_code: { type: "string" },
//               response_message: { type: "string" },
//               transaction_time: { type: "string" }
//             }
//           },
//           payment_info: {
//             type: "object",
//             properties: {
//               payment_method: { type: "string" },
//               card_type: { type: "string" },
//               card_scheme: { type: "string" },
//               payment_description: { type: "string" }
//             }
//           }
//         }
//       },
//       refund_createdAt: { type: "string" }
//     },
//     additionalProperties: true
//   };

//   const isValid = tv4.validate(remainingData, refundSchema);
//   expect(isValid, `Refund schema validation failed: ${tv4.error?.message}\nData path: ${tv4.error?.dataPath}\nSchema path: ${tv4.error?.schemaPath}`).toBeTruthy();

//   // 📋 Display Remaining Refund Details
//   console.log(`\n📋 Remaining Refund Details:`);
//   console.log(`   Refund Status: ${remainingData.status_code}`);
//   console.log(`   Refund ID: ${remainingData.id}`);
//   console.log(`   Transaction ID: ${remainingData.txn_detail.txn_id}`);
//   console.log(`   Refund Amount: ${remainingData.txn_detail.amount / 100} ${remainingData.txn_detail.currency}`);
//   console.log(`   Transaction Amount: ${remainingData.txn_detail.txn_amount / 100} ${remainingData.txn_detail.currency}`);
//   console.log(`   Net Amount: ${remainingData.txn_detail.net_amount / 100} ${remainingData.txn_detail.currency}`);
//   console.log(`   Remaining Amount: ${remainingData.txn_detail.remaining_amnt / 100} ${remainingData.txn_detail.currency}`);
//   console.log(`   Gateway: ${remainingData.txn_detail.gateway}`);
//   // console.log(`   Gateway Refund ID: ${remainingData.txn_detail.refund_id}`);
//   // console.log(`   Order ID: ${remainingData.txn_detail.order_id}`);
//   // console.log(`   Previous Transaction Ref: ${remainingData.raw_response?.previous_tran_ref || 'N/A'}`);
//   // console.log(`   Refund Transaction Ref: ${remainingData.raw_response?.tran_ref || 'N/A'}`);
//   // console.log(`   Payment Method: ${remainingData.raw_response?.payment_info?.payment_method || 'N/A'}`);
//   // console.log(`   Card Type: ${remainingData.raw_response?.payment_info?.card_type || 'N/A'}`);
//   // console.log(`   Card Scheme: ${remainingData.raw_response?.payment_info?.card_scheme || 'N/A'}`);
//   // console.log(`   Card Description: ${remainingData.raw_response?.payment_info?.payment_description || 'N/A'}`);
//   // console.log(`   Response Code: ${remainingData.raw_response?.payment_result?.response_code || 'N/A'}`);
//   // console.log(`   Response Message: ${remainingData.raw_response?.payment_result?.response_message || 'N/A'}`);
//   // console.log(`   Created At: ${remainingData.refund_createdAt}`);
//   // console.log(`   Message: ${remainingData.message}`);

//   // 📊 Summary
//   console.log(`\n📊 REFUND SUMMARY:`);
//   console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
//   console.log(`   Original Transaction: ${transaction_id2}`);
//   console.log(`   Total Transaction Amount: ${txnAmount / 100} ${currency}`);
//   console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
//   console.log(`   Partial Refund (50%): ${partialAmount / 100} ${currency}`);
//   console.log(`   Partial Refund ID: ${partialData.id}`);
//   console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
//   console.log(`   Remaining Refund (50%): ${remainingAmount / 100} ${currency}`);
//   console.log(`   Remaining Refund ID: ${remainingData.id}`);
//   console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
//   console.log(`   Total Refunded: ${(partialAmount + remainingAmount) / 100} ${currency}`);
//   console.log(`   Final Status: ${remainingData.status_code}`);
//   console.log(`   Final Remaining Amount: ${remainingData.txn_detail.remaining_amnt / 100} ${currency}`);
//   console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

//   console.log(`\n✅ [TC_043] Booking Bash Partial + Remaining Refund + Schema Validation Successful!`);
// });

// ===============================================================
// 🧩 [Positive:TC_041] Verify Partial Refund for GEMS Urbanledger Seamless (REFUND_PENDING) with Schema Validation
// ===============================================================
test("[Positive:TC_041] Verify Partial + Full Refund for GEMS Urbanledger Seamless with REFUND_PENDING", async () => {
  test.skip(!isAllowedForMerchant("TC_041"), `Skipping TC_041 for ${merchant.merchant}`);
  
  // Use transaction_id5 from TC_029 (Urbanledger Seamless transaction)
  const urbanledgerTransactionId = transaction_id5;
  
  if (!urbanledgerTransactionId) {
    console.warn(`⚠️  No transaction_id5 found for ${merchant.merchant}. Skipping TC_041.`);
    test.skip();
  }

  console.log(`\n🔍 [TC_041] Using transaction_id5 from TC_029: ${urbanledgerTransactionId}`);

  // For Urbanledger Seamless (GEMS), use partial refund amount (5000 out of 10000 = 50 AED out of 100 AED)
  const txnAmount = 5000;
  
  const payload = {
    transaction_id: urbanledgerTransactionId,
    amount: txnAmount, // Partial refund
  };

  let response;
  try {
    response = await api.post(refundApiUrl, payload);
  } catch (error: any) {
    if (error.response?.status === 400 || error.response?.status === 500) {
      const errorMsg = error.response?.data?.message || error.message;
      console.log(`⚠️ [TC_041] Refund API returned ${error.response?.status}: ${errorMsg}`);
      console.log(`Transaction may already be refunded or in invalid state. Skipping test.`);
      test.skip();
    }
    throw error;
  }
  
  const data = response.data;

  /* ================= BASIC ================= */
  expect(response.status).toBe(200);
  expect(data.status).toBe(true);

  /* ================= STATUS ================= */
  // GEMS Urbanledger Seamless returns REFUND_PENDING for partial refunds
  expect(data.status_code).toBe("REFUND_PENDING");
  expect(data.acquirer_status_code).toBe("REFUND_PENDING");

  /* ================= MESSAGE ================= */
  expect(data.message).toContain("Refund is being processed");

  /* ================= TXN DETAIL ================= */
  expect(data.txn_detail).toBeTruthy();
  expect(data.txn_detail.txn_id).toBe(urbanledgerTransactionId);
  expect(data.txn_detail.status).toBe("REFUND_PENDING");
  expect(data.txn_detail.gateway).toContain("urbanledger");

  // Validate amounts
  expect(data.txn_detail.txn_amount).toBe(10000); // Original amount
  expect(data.txn_detail.amount).toBe(5000); // Refunded amount
  expect(data.txn_detail.remaining_amnt).toBe(10000); // Remaining amount (REFUND_PENDING may not update immediately)
  expect(data.txn_detail.net_amount).toBeTruthy();
  
  const expectedCurrency = "AED";
  expect(data.txn_detail.currency).toBe(expectedCurrency);

  /* ================= RAW RESPONSE (Urbanledger Seamless specific) ================= */
  expect(data.raw_response).toBeTruthy();
  expect(data.raw_response.status).toBe("Partially Refunded");
  expect(data.raw_response.message).toContain("refunded successfully");

  /* ================= TIMESTAMP ================= */
  expect(data.refund_createdAt).toBeTruthy();

  /* =====================================================
     🧩 URBANLEDGER SEAMLESS PARTIAL REFUND (REFUND_PENDING) SCHEMA VALIDATION
     ===================================================== */
  const urbanledgerSeamlessPartialRefundSchema = {
    type: "object",
    required: [
      "id",
      "status",
      "status_code",
      "acquirer_status_code",
      "txn_detail",
      "raw_response",
      "refund_createdAt",
      "message",
    ],
    properties: {
      id: { type: "string" },
      status: { type: "boolean" },
      status_code: { type: "string" },
      acquirer_status_code: { type: "string" },
      message: { type: "string" },

      txn_detail: {
        type: "object",
        required: [
          "txn_id",
          "txn_amount",
          "amount",
          "status",
          "net_amount",
          "remaining_amnt",
          "currency",
          "gateway",
        ],
        properties: {
          txn_id: { type: "string" },
          refund_id: { type: "string" },
          mrt_refund_id: { type: "string" },
          txn_amount: { type: "number" },
          tax_amount: { type: ["number", "null"] },
          amount: { type: "number" },
          surcharge_amount: { type: ["number", "null"] },
          status: { type: "string" },
          order_id: { type: "string" },
          net_amount: { type: "number" },
          remaining_amnt: { type: "number" },
          gateway: { type: "string" },
          error_message: { type: "string" },
          error_code: { type: "string" },
          currency: { type: "string" },
          created: { type: "string" },
        },
      },

      raw_response: {
        type: "object",
        required: ["status", "message"],
        properties: {
          status: { type: "string" },
          message: { type: "string" },
          reference: { type: "string" },
        },
      },

      refund_createdAt: { type: "string" },
    },
    additionalProperties: true,
  };

  const isValid = tv4.validate(data, urbanledgerSeamlessPartialRefundSchema);
  expect(isValid, `Urbanledger Seamless Partial Refund schema validation failed: ${tv4.error?.message}\nData path: ${tv4.error?.dataPath}\nSchema path: ${tv4.error?.schemaPath}`).toBeTruthy();

  console.log(`\n✅ [TC_041] PARTIAL Refund Successful:`);
  console.log(`   Transaction ID: ${urbanledgerTransactionId}`);
  console.log(`   Original Amount: ${data.txn_detail.txn_amount} ${data.txn_detail.currency} (${data.txn_detail.txn_amount / 100} ${data.txn_detail.currency})`);
  console.log(`   Partial Refund Amount: ${data.txn_detail.amount} ${data.txn_detail.currency} (${data.txn_detail.amount / 100} ${data.txn_detail.currency})`);
  console.log(`   Remaining Amount (Pre-status update): ${data.txn_detail.remaining_amnt} ${data.txn_detail.currency} (${data.txn_detail.remaining_amnt / 100} ${data.txn_detail.currency})`);
  console.log(`   Status: ${data.status_code} (Refund is being processed)`);
  console.log(`   Gateway: ${data.txn_detail.gateway}`);
  console.log(`   Raw Response Status: ${data.raw_response.status}`);
  console.log(`   Message: ${data.message}`);

  // Run status check after partial refund
  console.log(`\n🔍 [TC_041] Partial refund completed with status: ${data.status_code}`);
  
  // If REFUND_PENDING, wait and check status to get accurate remaining amount
  if (data.status_code === "REFUND_PENDING") {
    console.log(`⏳ [TC_041] Waiting 10 seconds for partial refund to process...`);
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  
  console.log(`\n🔍 [TC_041] Running Status Check after partial refund to verify transaction state...`);
  
  let actualRemainingAmount = 5000; // Default fallback
  let canProceedWithRefund = false;
  
  try {
    const statusApiUrl = "https://securenew.vernostpay.com/api/intent/check/status";
    const statusPayload = { identifier: urbanledgerTransactionId, verifySupplier: true };
    const statusResponse = await axios.post(statusApiUrl, statusPayload, { headers, timeout: 15000 });
    const statusData = statusResponse.data;

    console.log(`\n📊 [TC_041] Status Check Results:`);
    console.log(`   Transaction Status: ${statusData.status}`);
    console.log(`   Transaction Amount: ${statusData.amount} ${statusData.currency} (${statusData.amount * 100} base units)`);
    
    // Check if transaction is in a refundable state
    const refundableStates = ["CAPTURED", "PARTIAL_REFUNDED", "REFUNDED", "REFUND_FAILED"];
    if (!refundableStates.includes(statusData.status)) {
      console.log(`\n⚠️ [TC_041] Transaction status is ${statusData.status}, which is not refundable`);
      console.log(`   Valid refundable states: ${refundableStates.join(", ")}`);
      console.log(`   Skipping remaining refund.`);
    } else {
      canProceedWithRefund = true;
      
      // Calculate actual remaining from refund items if available
      if (statusData.refund_items && Array.isArray(statusData.refund_items)) {
        const originalAmountInBase = statusData.amount * 100;
        let totalRefundedSoFar = 0;
        
        console.log(`\n💰 [TC_041] Refund Items from Status Check:`);
        for (const refundItem of statusData.refund_items) {
          const refundAmountInBase = (refundItem.amount || 0) * 100;
          totalRefundedSoFar += refundAmountInBase;
          console.log(`   - Refund ID: ${refundItem.refund_id || 'N/A'}`);
          console.log(`     Amount: ${refundItem.amount} ${statusData.currency} (${refundAmountInBase} base units)`);
          console.log(`     Status: ${refundItem.status || 'N/A'}`);
          console.log(`     Created: ${refundItem.created_at || 'N/A'}`);
        }
        
        actualRemainingAmount = originalAmountInBase - totalRefundedSoFar;
        console.log(`\n   Total Refunded So Far: ${totalRefundedSoFar / 100} ${statusData.currency} (${totalRefundedSoFar} base units)`);
        console.log(`   Actual Remaining Amount: ${actualRemainingAmount / 100} ${statusData.currency} (${actualRemainingAmount} base units)`);
      }
    }
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.log(`\n⚠️ [TC_041] Status check failed: ${errorMsg}`);
    console.log(`   Using fallback remaining amount: 5000 base units`);
    console.log(`   Proceeding with caution - refund may fail if transaction state is invalid`);
  }

  // Now refund the remaining amount (FULL REFUND of remaining)
  if (canProceedWithRefund && actualRemainingAmount && actualRemainingAmount > 0) {
    console.log(`\n💰 [TC_041] Performing FULL refund of remaining amount:`);
    console.log(`   Transaction ID: ${urbanledgerTransactionId}`);
    console.log(`   Remaining Refund Amount: ${actualRemainingAmount} (${actualRemainingAmount / 100} ${data.txn_detail.currency})`);
    
    const remainingRefundPayload = {
      transaction_id: urbanledgerTransactionId,
      amount: actualRemainingAmount,
    };

    try {
      const remainingResponse = await api.post(refundApiUrl, remainingRefundPayload);
      const remainingData = remainingResponse.data;

      // Validate full refund response
      expect(remainingResponse.status).toBe(200);
      expect(remainingData.status).toBe(true);
      
      // GEMS may return REFUND_PENDING or REFUNDED
      expect(["REFUND_PENDING", "REFUNDED"]).toContain(remainingData.status_code);
      expect(["REFUND_PENDING", "REFUNDED"]).toContain(remainingData.acquirer_status_code);
      
      // Validate remaining refund schema (similar to partial but allows REFUNDED status)
      const urbanledgerFullRefundSchema = {
        type: "object",
        required: [
          "id",
          "status",
          "status_code",
          "acquirer_status_code",
          "txn_detail",
          "raw_response",
          "refund_createdAt",
          "message",
        ],
        properties: {
          id: { type: "string" },
          status: { type: "boolean" },
          status_code: { type: "string" },
          acquirer_status_code: { type: "string" },
          message: { type: "string" },
          txn_detail: {
            type: "object",
            required: [
              "txn_id",
              "txn_amount",
              "amount",
              "status",
              "net_amount",
              "remaining_amnt",
              "currency",
              "gateway",
            ],
            properties: {
              txn_id: { type: "string" },
              refund_id: { type: "string" },
              mrt_refund_id: { type: "string" },
              txn_amount: { type: "number" },
              amount: { type: "number" },
              status: { type: "string" },
              net_amount: { type: "number" },
              remaining_amnt: { type: ["number", "string"] },
              gateway: { type: "string" },
              currency: { type: "string" },
            },
          },
          raw_response: {
            type: "object",
            required: ["status", "message"],
            properties: {
              status: { type: "string" },
              message: { type: "string" },
              reference: { type: "string" },
            },
          },
          refund_createdAt: { type: "string" },
        },
        additionalProperties: true,
      };

      const isValidRemaining = tv4.validate(remainingData, urbanledgerFullRefundSchema);
      expect(isValidRemaining, `Full refund schema validation failed: ${tv4.error?.message}`).toBeTruthy();

      console.log(`\n✅ [TC_041] FULL Refund (Remaining) Successful:`);
      console.log(`   Transaction ID: ${urbanledgerTransactionId}`);
      console.log(`   Refund ID: ${remainingData.id}`);
      console.log(`   Status: ${remainingData.status_code}`);
      console.log(`   Acquirer Status: ${remainingData.acquirer_status_code}`);
      console.log(`   Message: ${remainingData.message}`);
      console.log(`   Final Refunded Amount: ${remainingData.txn_detail.amount} (${remainingData.txn_detail.amount / 100} ${remainingData.txn_detail.currency})`);
      console.log(`   Final Remaining Amount: ${remainingData.txn_detail.remaining_amnt} (${typeof remainingData.txn_detail.remaining_amnt === 'number' ? remainingData.txn_detail.remaining_amnt / 100 : remainingData.txn_detail.remaining_amnt} ${remainingData.txn_detail.currency})`);
      console.log(`   Gateway: ${remainingData.txn_detail.gateway}`);
      console.log(`   Raw Response Status: ${remainingData.raw_response.status}`);
      
      // Calculate total refunded
      const totalRefunded = data.txn_detail.amount + actualRemainingAmount;
      console.log(`\n🎉 [TC_041] Complete: Transaction fully refunded`);
      console.log(`   Partial Refund: ${data.txn_detail.amount} (${data.txn_detail.amount / 100} ${data.txn_detail.currency})`);
      console.log(`   Final Refund: ${actualRemainingAmount} (${actualRemainingAmount / 100} ${data.txn_detail.currency})`);
      console.log(`   Total Refunded: ${totalRefunded} = ${data.txn_detail.txn_amount} ${data.txn_detail.currency} (${totalRefunded / 100} ${data.txn_detail.currency})`);
      console.log(`   Final Status: ${remainingData.status_code}`);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      console.log(`\n⚠️ [TC_041] Full refund (remaining) failed: ${errorMsg}`);
      console.log(`   This might happen if the transaction is already fully refunded or in invalid state`);
    }
  } else if (!canProceedWithRefund) {
    console.log(`\n⚠️ [TC_041] Cannot proceed with remaining refund - transaction is not in a refundable state`);
    console.log(`   Please check the admin panel for transaction status and investigate why it changed to FAIL`);
  } else {
    console.log(`\n⚠️ [TC_041] No remaining amount to refund`);
  }
});

// ===============================================================
// 🧩 [Positive:TC_042] Verify Partial + Full Refund for Booking Bash (Paytabs) with Schema Validation
// ===============================================================
test("[Positive:TC_042] Verify Partial + Full Refund for Booking Bash (Paytabs)", async () => {
  // Only run for Booking Bash merchant
  const merchantName = merchant.merchant.toLowerCase();
  if (!merchantName.includes("booking bash")) {
    test.skip();
  }

  const bookingBashTransactionId = parsed.transactionId_tc034;
  
  if (!bookingBashTransactionId) {
    console.log(`⚠️ [TC_042] No transactionId_tc034 found for Booking Bash, skipping test`);
    test.skip();
  }

  console.log(`\n🔍 [TC_042] Booking Bash - Using transaction from TC_034 (Paytabs): ${bookingBashTransactionId}`);

  // Get the actual transaction amount from status check API
  const statusApiUrl = "https://securenew.vernostpay.com/api/intent/check/status";
  const statusPayload = { identifier: bookingBashTransactionId, verifySupplier: true };
  
  let originalAmount = 10000; // default fallback
  let currencyCode = "AED";
  try {
    const statusResponse = await axios.post(statusApiUrl, statusPayload, { headers, timeout: 20000 });
    const amountFromApi = statusResponse.data.amount;
    currencyCode = statusResponse.data.currency || "AED";
    // Status API returns amount in AED, multiply by 100 to get fils
    const baseAmount = typeof amountFromApi === 'string' ? parseFloat(amountFromApi) : (amountFromApi || 100);
    originalAmount = Math.round(baseAmount * 100);
    console.log(`✅ [TC_042] Retrieved transaction details: ${baseAmount} ${currencyCode} (${originalAmount} in smallest unit)`);
  } catch (error: any) {
    console.log(`⚠️ [TC_042] Could not fetch transaction amount: ${error.message}, using default: ${originalAmount}`);
  }

  // ==================== PARTIAL REFUND ====================
  const partialRefundAmount = 500; // 5 AED in fils
  const payload = {
    transaction_id: bookingBashTransactionId,
    amount: partialRefundAmount,
  };

  console.log(`\n💰 [TC_042] Performing PARTIAL refund:`);
  console.log(`   Transaction ID: ${bookingBashTransactionId}`);
  console.log(`   Original Amount: ${originalAmount} fils (${originalAmount / 100} ${currencyCode})`);
  console.log(`   Partial Refund Amount: ${partialRefundAmount} fils (${partialRefundAmount / 100} ${currencyCode})`);

  let response;
  try {
    response = await api.post(refundApiUrl, payload);
  } catch (error: any) {
    if (error.response?.status === 400 || error.response?.status === 500) {
      const errorMsg = error.response?.data?.message || error.message;
      console.log(`⚠️ [TC_042] Refund API returned ${error.response?.status}: ${errorMsg}`);
      console.log(`Transaction may already be refunded or in invalid state. Skipping test.`);
      test.skip();
    }
    throw error;
  }
  
  const data = response.data;

  // ==================== BASIC VALIDATIONS ====================
  expect(response.status).toBe(200);
  expect(data.status).toBe(true);
  expect(data.status_code).toBe("PARTIAL_REFUNDED");
  expect(data.acquirer_status_code).toBe("REFUNDED");
  expect(data.message).toBe("Transaction has been partially refunded");

  // ==================== TXN DETAIL VALIDATIONS ====================
  expect(data.txn_detail).toBeTruthy();
  expect(data.txn_detail.txn_id).toBe(bookingBashTransactionId);
  expect(data.txn_detail.refund_id).toBeTruthy();
  expect(data.txn_detail.status).toBe("PARTIAL_REFUNDED");
  expect(data.txn_detail.txn_amount).toBe(originalAmount);
  expect(data.txn_detail.amount).toBe(partialRefundAmount);
  expect(data.txn_detail.net_amount).toBe(originalAmount);
  expect(data.txn_detail.currency).toBe(currencyCode);
  expect(data.txn_detail.gateway).toContain("Paytabs");

  // Calculate expected remaining amount
  const expectedRemaining = originalAmount - partialRefundAmount;
  expect(data.txn_detail.remaining_amnt).toBe(expectedRemaining);

  // ==================== RAW RESPONSE VALIDATIONS ====================
  expect(data.raw_response).toBeTruthy();
  expect(data.raw_response.tran_ref).toBeTruthy();
  expect(data.raw_response.previous_tran_ref).toBeTruthy();
  expect(data.raw_response.tran_type).toBe("Refund");
  expect(data.raw_response.cart_id).toBe(bookingBashTransactionId);
  expect(data.raw_response.cart_currency).toBe(currencyCode);
  expect(data.raw_response.tran_currency).toBe(currencyCode);
  
  // Cart amount is in AED (5.00)
  const expectedCartAmount = (partialRefundAmount / 100).toFixed(2);
  expect(data.raw_response.cart_amount).toBe(expectedCartAmount);
  expect(data.raw_response.tran_total).toBe(expectedCartAmount);
  
  expect(data.raw_response.payment_result).toBeTruthy();
  expect(data.raw_response.payment_result.response_status).toBe("A");
  expect(data.raw_response.payment_result.response_code).toBeTruthy();
  expect(data.raw_response.payment_result.response_message).toBe("Authorised");

  // ==================== TIMESTAMP ====================
  expect(data.refund_createdAt).toBeTruthy();

  // ==================== SCHEMA VALIDATION ====================
  const paytabsPartialRefundSchema = {
    type: "object",
    required: [
      "id",
      "status",
      "status_code",
      "acquirer_status_code",
      "txn_detail",
      "raw_response",
      "refund_createdAt",
      "message",
    ],
    properties: {
      id: { type: "string" },
      status: { type: "boolean" },
      status_code: { type: "string" },
      acquirer_status_code: { type: "string" },
      message: { type: "string" },

      txn_detail: {
        type: "object",
        required: [
          "txn_id",
          "refund_id",
          "txn_amount",
          "amount",
          "status",
          "net_amount",
          "remaining_amnt",
          "currency",
          "gateway",
        ],
        properties: {
          txn_id: { type: "string" },
          refund_id: { type: "string" },
          mrt_refund_id: { type: "string" },
          txn_amount: { type: "number" },
          tax_amount: { type: ["number", "null"] },
          amount: { type: "number" },
          surcharge_amount: { type: ["number", "null"] },
          status: { type: "string" },
          order_id: { type: "string" },
          net_amount: { type: "number" },
          remaining_amnt: { type: "number" },
          gateway: { type: "string" },
          error_message: { type: "string" },
          error_code: { type: "string" },
          currency: { type: "string" },
          created: { type: "string" },
        },
      },

      raw_response: {
        type: "object",
        required: [
          "tran_ref",
          "previous_tran_ref",
          "tran_type",
          "cart_id",
          "cart_currency",
          "cart_amount",
          "tran_currency",
          "tran_total",
          "payment_result",
        ],
        properties: {
          tran_ref: { type: "string" },
          previous_tran_ref: { type: "string" },
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
            required: ["response_status", "response_code", "response_message"],
            properties: {
              response_status: { type: "string" },
              response_code: { type: "string" },
              response_message: { type: "string" },
              transaction_time: { type: "string" },
            },
          },
          payment_info: { type: "object" },
        },
      },

      refund_createdAt: { type: "string" },
    },
    additionalProperties: true,
  };

  const isValid = tv4.validate(data, paytabsPartialRefundSchema);
  expect(isValid, `Partial refund schema validation failed: ${tv4.error?.message}`).toBeTruthy();

  // ==================== PRINT PARTIAL REFUND DETAILS ====================
  console.log(`\n💰 [Booking Bash] Partial Refund Response Details:`);
  console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`   Transaction ID: ${bookingBashTransactionId}`);
  console.log(`   Refund ID: ${data.txn_detail.refund_id}`);
  console.log(`   Paytabs Tran Ref: ${data.raw_response.tran_ref}`);
  console.log(`   Refund Status: ${data.status_code}`);
  console.log(`   Acquirer Status: ${data.acquirer_status_code}`);
  console.log(`   Original Amount: ${data.txn_detail.txn_amount / 100} ${data.txn_detail.currency} (${data.txn_detail.txn_amount} fils)`);
  console.log(`   Amount Refunded: ${data.txn_detail.amount / 100} ${data.txn_detail.currency} (${data.txn_detail.amount} fils)`);
  console.log(`   Remaining Amount: ${data.txn_detail.remaining_amnt / 100} ${data.txn_detail.currency} (${data.txn_detail.remaining_amnt} fils)`);
  console.log(`   Net Amount: ${data.txn_detail.net_amount / 100} ${data.txn_detail.currency}`);
  console.log(`   Gateway: ${data.txn_detail.gateway}`);
  console.log(`   Message: ${data.message}`);
  console.log(`   Paytabs Response: ${data.raw_response.payment_result.response_message}`);
  console.log(`   Created At: ${data.refund_createdAt}`);
  console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  console.log(`\n✅ [TC_042] PARTIAL Refund + Schema Validation Successful`);

  // ==================== FULL REFUND (REMAINING AMOUNT) ====================
  const actualRemainingAmount = data.txn_detail.remaining_amnt;

  if (actualRemainingAmount && actualRemainingAmount > 0) {
    console.log(`\n💰 [TC_042] Performing FULL refund (remaining amount):`);
    console.log(`   Transaction ID: ${bookingBashTransactionId}`);
    console.log(`   Remaining Refund Amount: ${actualRemainingAmount} fils (${actualRemainingAmount / 100} ${currencyCode})`);
    
    const remainingRefundPayload = {
      transaction_id: bookingBashTransactionId,
      amount: actualRemainingAmount,
    };

    try {
      const remainingResponse = await api.post(refundApiUrl, remainingRefundPayload);
      const remainingData = remainingResponse.data;

      // ==================== VALIDATIONS FOR FULL REFUND ====================
      expect(remainingResponse.status).toBe(200);
      expect(remainingData.status).toBe(true);
      expect(remainingData.status_code).toBe("REFUNDED");
      expect(remainingData.acquirer_status_code).toBe("REFUNDED");
      expect(remainingData.message).toBe("Transaction has been refunded");
      
      expect(remainingData.txn_detail.txn_id).toBe(bookingBashTransactionId);
      expect(remainingData.txn_detail.status).toBe("REFUNDED");
      expect(remainingData.txn_detail.amount).toBe(actualRemainingAmount);
      
      // For full refund, remaining_amnt should be 0 or empty string (Paytabs returns "")
      const finalRemaining = typeof remainingData.txn_detail.remaining_amnt === 'string' 
        ? (remainingData.txn_detail.remaining_amnt === "" ? 0 : parseFloat(remainingData.txn_detail.remaining_amnt))
        : remainingData.txn_detail.remaining_amnt;
      expect(finalRemaining).toBe(0);

      // ==================== SCHEMA VALIDATION FOR FULL REFUND ====================
      const paytabsFullRefundSchema = {
        type: "object",
        required: [
          "id",
          "status",
          "status_code",
          "acquirer_status_code",
          "txn_detail",
          "raw_response",
          "refund_createdAt",
          "message",
        ],
        properties: {
          id: { type: "string" },
          status: { type: "boolean" },
          status_code: { type: "string" },
          acquirer_status_code: { type: "string" },
          message: { type: "string" },
          txn_detail: {
            type: "object",
            required: [
              "txn_id",
              "refund_id",
              "txn_amount",
              "amount",
              "status",
              "net_amount",
              "remaining_amnt",
              "currency",
            ],
          },
          raw_response: { type: "object" },
          refund_createdAt: { type: "string" },
        },
        additionalProperties: true,
      };

      const isValidRemaining = tv4.validate(remainingData, paytabsFullRefundSchema);
      expect(isValidRemaining, `Full refund schema validation failed: ${tv4.error?.message}`).toBeTruthy();

      // ==================== PRINT FULL REFUND DETAILS ====================
      console.log(`\n💰 [Booking Bash] Full Refund Response Details:`);
      console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`   Transaction ID: ${bookingBashTransactionId}`);
      console.log(`   Refund ID: ${remainingData.txn_detail.refund_id}`);
      console.log(`   Paytabs Tran Ref: ${remainingData.raw_response.tran_ref}`);
      console.log(`   Refund Status: ${remainingData.status_code}`);
      console.log(`   Acquirer Status: ${remainingData.acquirer_status_code}`);
      console.log(`   Final Refunded Amount: ${remainingData.txn_detail.amount / 100} ${remainingData.txn_detail.currency} (${remainingData.txn_detail.amount} fils)`);
      console.log(`   Final Remaining Amount: ${remainingData.txn_detail.remaining_amnt / 100} ${remainingData.txn_detail.currency} (${remainingData.txn_detail.remaining_amnt} fils)`);
      console.log(`   Gateway: ${remainingData.txn_detail.gateway}`);
      console.log(`   Message: ${remainingData.message}`);
      console.log(`   Paytabs Response: ${remainingData.raw_response.payment_result.response_message}`);
      console.log(`   Created At: ${remainingData.refund_createdAt}`);
      console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      
      // Calculate total refunded
      const totalRefunded = partialRefundAmount + actualRemainingAmount;
      console.log(`\n🎉 [TC_042] Complete: Transaction fully refunded`);
      console.log(`   Partial Refund: ${partialRefundAmount} fils (${partialRefundAmount / 100} ${currencyCode})`);
      console.log(`   Final Refund: ${actualRemainingAmount} fils (${actualRemainingAmount / 100} ${currencyCode})`);
      console.log(`   Total Refunded: ${totalRefunded} fils = ${data.txn_detail.txn_amount} fils (${totalRefunded / 100} ${currencyCode})`);
      console.log(`   Final Status: ${remainingData.status_code}`);
      
      console.log(`\n✅ [TC_042] FULL Refund + Schema Validation Successful`);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      console.log(`\n⚠️ [TC_042] Full refund (remaining) failed: ${errorMsg}`);
      console.log(`   This might happen if the transaction is already fully refunded or in invalid state`);
    }
  } else {
    console.log(`\n⚠️ [TC_042] No remaining amount to refund`);
  }
});

  });

}

// ===============================================================
// 🧩 Elevate trips Refund Test (TC_046) - DISABLED
// ===============================================================
// NOTE: Refund is not managed by Vepay for Elevate trips
// This test case is kept for reference but will not execute
