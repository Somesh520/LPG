// ================= IMPORTS =================
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore } = require("firebase-admin/firestore");
const admin = require("firebase-admin");
const path = require("path");
const functions = require("firebase-functions"); 

// ⭐️ NAYA IMPORT (Chatbot ke liye)
const dialogflow = require('@google-cloud/dialogflow');
// ⭐️ NAYA IMPORT (ML ke liye)
const { linearRegression } = require("simple-statistics");


// ================= INITIALIZE FIREBASE ADMIN =================
const serviceAccount = require(path.join(__dirname, "lpgguard-b501ff145328.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = getFirestore();

// ================= NAYA CHATBOT CLIENT SETUP =================
const credentials = {
  client_email: serviceAccount.client_email,
  private_key: serviceAccount.private_key,
};
const sessionClient = new dialogflow.SessionsClient({
  projectId: serviceAccount.project_id,
  credentials,
});

// ================================================================
// === FUNCTIONS (Notifications) ===
// ================================================================

// ================= CLOUD FUNCTION 1 (Gas Leak ke liye) =================
exports.onDeviceUpdateSendNotification = onDocumentUpdated("devices/{deviceId}", async (event) => {
  // (Aapka poora code... bilkul sahi hai)
  if (!event.data) return null;
  const deviceDataAfter = event.data.after.data();
  const deviceDataBefore = event.data.before.data();
  const deviceId = event.params.deviceId;
  if (!deviceDataAfter || !deviceDataBefore) return null;
  const alertBefore = deviceDataBefore.alert || false;
  const alertAfter = deviceDataAfter.alert || false;
  if (alertBefore === false && alertAfter === true) {
    console.log(`🚨 LEAK DETECTED for device: ${deviceId}`);
    const ownerId = deviceDataAfter.ownerId;
    if (!ownerId) return null;
    const userDoc = await db.collection("users").doc(ownerId).get();
    if (!userDoc.exists) return null;
    const fcmToken = userDoc.data().fcmToken;
    if (!fcmToken) return null;
    const payload = {
      notification: {
        title: "🔥 GAS LEAK DETECTED! 🔥",
        body: `Your device '${deviceDataAfter.name || "LPG Sensor"}' has detected a gas leak. The regulator has been auto-cut. Please close the main valve immediately.`,
      },
      android: { notification: { channel_id: "leak_alerts", sound: "default", priority: "high" } },
      token: fcmToken,
    };
    try {
      await admin.messaging().send(payload);
      console.log("✅ Notification sent successfully:");
    } catch (error) {
      console.error("❌ Error sending notification:", error);
    }
  }
  return null;
});


// ================= CLOUD FUNCTION 2 (Test Button ke liye) =================
exports.sendTestNotification = onCall(async (request) => {
  // (Aapka poora code... bilkul sahi hai)
  if (!request.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  }
  const userId = request.auth.uid;
  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError("not-found", "User not found.");
  }
  const fcmToken = userDoc.data()?.fcmToken;
  if (!fcmToken) {
    throw new functions.https.HttpsError("not-found", "FCM token not found.");
  }
  const payload = {
    notification: {
      title: "✅ Test Notification",
      body: "Sab sahi kaam kar raha hai! (Your notification setup is working.)",
    },
    android: { notification: { channel_id: "leak_alerts", sound: "default", priority: "high" } },
    token: fcmToken,
  };
  try {
    await admin.messaging().send(payload);
    return { success: true };
  } catch (error) {
    console.error("❌ Test notification bhejte waqt error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// ================================================================
// === FUNCTIONS (Chatbot) ===
// ================================================================

// ================= CLOUD FUNCTION 3 ('askBot') =================
exports.askBot = onCall(async (request) => {
  // (Aapka poora code... bilkul sahi hai)
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Aapko login karna zaroori hai.');
  }
  const userId = request.auth.uid;
  const text = request.data.text;
  const projectId = serviceAccount.project_id;
  if (!text) {
    throw new functions.https.HttpsError('invalid-argument', 'Text message khaali nahi ho sakta.');
  }
  const sessionPath = sessionClient.projectAgentSessionPath(projectId, userId);
  const dialogflowRequest = {
    session: sessionPath,
    queryInput: {
      text: { text: text, languageCode: 'en-US' },
    },
    queryParams: {
      payload: { fields: { userId: { stringValue: userId, kind: 'stringValue' } } }
    }
  };
  try {
    const responses = await sessionClient.detectIntent(dialogflowRequest);
    const result = responses[0].queryResult;
    return {
      text: result.fulfillmentText || "Sorry, main samajh nahi paaya.",
    };
  } catch (error) {
    console.error("❌ DIALOGFLOW ERROR (askBot):", error);
    throw new functions.https.HttpsError('internal', 'Bot se connect nahi ho paa raha hai.');
  }
});


// ================= CLOUD FUNCTION 4 ('dialogflowWebhook') =================
// (⭐️ Maine isse 'Tare Weight' use karne ke liye update kar diya hai)
exports.dialogflowWebhook = functions.https.onRequest(async (request, response) => {
  
  const intentName = request.body.queryResult.intent.displayName;
  let userId;
  try {
    userId = request.body.originalDetectIntentRequest.payload.userId;
  } catch (e) {
    console.error("Payload se UserID nahi mili:", e);
    response.json({
      fulfillmentText: "Maaf kijiye, main aapke device ko dhoondh nahi paa raha hoon."
    });
    return;
  }

  let fulfillmentText = "Kuch samajh nahi aaya.";

  try {
    const deviceSnap = await db.collection('devices')
                                .where('ownerId', '==', userId)
                                .limit(1)
                                .get();

    if (deviceSnap.empty) {
      fulfillmentText = "Aapka koi device abhi register nahi hai.";
    } else {
      const deviceData = deviceSnap.docs[0].data();
      const weight = deviceData.weight || 0;
      const isLeak = deviceData.alert || false;
      
      // ⭐️ Tare weight ka istemaal
      const tareWeight = deviceData.tareWeight;
      const maxGas = 14.2; // 14.2 KG max gas

      switch (intentName) {
        case 'GetWeight':
          if (!tareWeight) {
            fulfillmentText = `Aapke cylinder ka total weight ${weight.toFixed(2)} KG hai. Gas ka sahi weight jaan-ne ke liye, कृपया Settings mein jaakar 'Empty (Tare) Weight' set karein.`;
          } else {
            const gasLeft = Math.max(0, weight - tareWeight);
            const percentage = ((gasLeft / maxGas) * 100).toFixed(0);
            fulfillmentText = `Aapke cylinder mein abhi lagbhag ${gasLeft.toFixed(2)} kg (${percentage}%) gas bachi hai.`;
          }
          break;
        
        case 'GetLeakStatus':
          if (isLeak) {
            fulfillmentText = "🔴 DANGER! Aapke device ne gas leak detect kiya hai. Turant safety measures lein!";
          } else {
            fulfillmentText = "✅ Sab surakshit hai. Abhi koi gas leak nahi hai.";
          }
          break;
          
        default:
          fulfillmentText = request.body.queryResult.fulfillmentText;
      }
    }
  
  } catch (err) {
    console.error("Firestore error (dialogflowWebhook):", err);
    fulfillmentText = "Sorry, main abhi database se connect nahi kar paa raha hoon.";
  }
  
  response.json({ fulfillmentText });
});


// ================================================================
// === FUNCTIONS (ML Prediction) ===
// ================================================================

// ================= CLOUD FUNCTION 5 ('predictDaysLeft') =================
// (Yeh aapka "Smart" function hai jo "Refill" detect karta hai)
// ================= CLOUD FUNCTION 5 ('predictDaysLeft') =================
// (⭐️ YEH V2 MEIN CONVERT KAR DIYA GAYA HAI)
// ================= CLOUD FUNCTION 5 ('predictDaysLeft') =================
// (⭐️ YEH V2 MEIN CONVERT KAR DIYA GAYA HAI AUR FIX BHI)
exports.predictDaysLeft = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "You must be logged in.");
  
  const deviceId = request.data.deviceId;
  if (!deviceId) throw new HttpsError("invalid-argument", "Missing deviceId.");

  const deviceDoc = await db.collection("devices").doc(deviceId).get();
  if (!deviceDoc.exists) throw new HttpsError("not-found", "Device not found.");

  const deviceData = deviceDoc.data();
  const tareWeight = deviceData.tareWeight;
  if (!tareWeight) return { daysLeft: null, error: "Tare Weight not set in Settings." };

  const currentWeight = deviceData.weight;
  const gasLeft = currentWeight - tareWeight;
  if (gasLeft <= 0) return { daysLeft: 0, error: "Cylinder empty or below tare weight." };

  const historySnapshot = await db.collection("devices").doc(deviceId)
    .collection("history").orderBy("timestamp", "asc").limitToLast(100).get();

  if (historySnapshot.empty || historySnapshot.size < 2)
    return { daysLeft: null, error: "Not enough data to predict." };

  const REFILL_THRESHOLD_KG = 5.0;
  const historyData = historySnapshot.docs.map(d => d.data());

  // 🔍 Find last refill
  let lastRefillIndex = 0;
  for (let i = 1; i < historyData.length; i++) {
    const prev = historyData[i - 1].weight || 0;
    const curr = historyData[i].weight || 0;
    if (curr - prev > REFILL_THRESHOLD_KG) lastRefillIndex = i;
  }

  // Filter valid points
  const dataSinceRefill = historyData
    .slice(lastRefillIndex)
    // ⭐️ FIX 1: Filter ko sahi kiya taaki '0' weight bhi chale
    .filter(d => d.timestamp && d.weight !== null && d.weight !== undefined && !isNaN(d.weight))
    // ⭐️ FIX 2: Data format ko [x, y] array mein badla
    .map(d => ([d.timestamp.toMillis(), d.weight]));

  if (dataSinceRefill.length < 2)
    return { daysLeft: null, error: "Not enough data since last refill." };

  // 🔍 Linear regression
  const { m: slope, b: intercept } = linearRegression(dataSinceRefill);

  // 🔒 NaN protection
  if (!isFinite(slope) || !isFinite(intercept) || slope === 0) {
    console.error("Invalid slope/intercept:", { slope, intercept });
    return { daysLeft: null, error: "Invalid regression data (NaN/Zero slope)." };
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const consumptionRatePerDay = -slope * msPerDay;

  if (!isFinite(consumptionRatePerDay) || consumptionRatePerDay <= 0.01)
    return { daysLeft: null, error: "Consumption rate too low or invalid." };

  const timeWhenEmpty = (tareWeight - intercept) / slope;
  if (!isFinite(timeWhenEmpty))
    return { daysLeft: null, error: "Time calculation failed (NaN)." };

  const now = Date.now();
  if (timeWhenEmpty < now)
    return { daysLeft: 0, error: "Prediction shows cylinder already empty." };

  const msLeft = timeWhenEmpty - now;
  const daysLeft = Math.floor(msLeft / msPerDay);

  // 🔒 Final sanity check before returning
  if (!isFinite(daysLeft) || isNaN(daysLeft))
    return { daysLeft: null, error: "Invalid ML output (NaN detected)." };

  return {
    daysLeft,
    avgConsumptionPerDay: consumptionRatePerDay.toFixed(2),
  };
});