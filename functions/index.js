// ================= IMPORTS =================
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onCall } = require("firebase-functions/v2/https");
const { getFirestore } = require("firebase-admin/firestore");
const admin = require("firebase-admin");
const path = require("path");
const functions = require("firebase-functions"); // ⭐️ 1. YEH NAYI LINE ADD KI HAI

// ================= INITIALIZE FIREBASE ADMIN =================
const serviceAccount = require(path.join(__dirname, "lpgguard-b501ff145328.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = getFirestore();

// ================= CLOUD FUNCTION 1 (Gas Leak ke liye) =================
exports.onDeviceUpdateSendNotification = onDocumentUpdated("devices/{deviceId}", async (event) => {
  if (!event.data) {
    console.log("⚠️ No event data found.");
    return null;
  }

  const deviceDataAfter = event.data.after.data();
  const deviceDataBefore = event.data.before.data();
  const deviceId = event.params.deviceId;

  if (!deviceDataAfter || !deviceDataBefore) {
    console.log("⚠️ Missing device data in event.");
    return null;
  }
  
  const alertBefore = deviceDataBefore.alert || false;
  const alertAfter = deviceDataAfter.alert || false;

  if (alertBefore === false && alertAfter === true) {
    // --- LEAK ABHI DETECT HUA HAI! ---
    console.log(`🚨 LEAK DETECTED for device: ${deviceId}`);

    const ownerId = deviceDataAfter.ownerId;
    if (!ownerId) {
      console.log("❌ No ownerId found in device document.");
      return null;
    }

    // 1️⃣ Fetch user FCM token
    const userDoc = await db.collection("users").doc(ownerId).get();
    if (!userDoc.exists) {
      console.log("❌ User document not found for:", ownerId);
      return null;
    }

    const fcmToken = userDoc.data().fcmToken;
    if (!fcmToken) {
      console.log("❌ FCM token missing for user:", ownerId);
      return null;
    }

    // 2️⃣ Create Notification Payload
    const payload = {
      notification: {
        title: "🔥 GAS LEAK DETECTED! 🔥",
        body: `Your device '${deviceDataAfter.name || "LPG Sensor"}' has detected a gas leak. The regulator has been auto-cut. Please close the main valve immediately.`,
        // ⭐️ 2. YEH LINE HATA DI HAI (sound: "default")
      },
      android: {
        notification: {
          channel_id: "leak_alerts",
          sound: "default", // Yeh wala sahi hai
          priority: "high",
        },
      },
      token: fcmToken,
    };

    // 3️⃣ Send Notification
    try {
      const response = await admin.messaging().send(payload);
      console.log("✅ Notification sent successfully:", response);
    } catch (error) {
      console.error("❌ Error sending notification:", error);
    }
  } else {
    console.log("ℹ️ Alert status did not change from false to true. No notification sent.");
  }

  return null;
});


// ================= CLOUD FUNCTION 2 (Test Button ke liye) =================
exports.sendTestNotification = onCall(async (request) => {
  if (!request.auth) {
    console.log("Test Error: User logged in nahi hai.");
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required."
    );
  }

  const userId = request.auth.uid;
  console.log(`Test notification request mili user se: ${userId}`);

  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) {
    console.log("Test Error: User document nahi mila.");
    throw new functions.https.HttpsError("not-found", "User not found.");
  }

  const fcmToken = userDoc.data()?.fcmToken;
  if (!fcmToken) {
    console.log("Test Error: FCM token nahi mila.");
    throw new functions.https.HttpsError(
      "not-found",
      "FCM token not found for this user. Please logout and login again."
    );
  }

  const payload = {
    notification: {
      title: "✅ Test Notification",
      body: "Sab sahi kaam kar raha hai! (Your notification setup is working.)",
       // ⭐️ 2. YEH LINE HATA DI HAI (sound: "default")
    },
    android: {
      notification: {
        channel_id: "leak_alerts",
        sound: "default", // Yeh wala sahi hai
        priority: "high",
      },
    },
    token: fcmToken,
  };

  try {
    const response = await admin.messaging().send(payload);
    console.log("✅ Test notification safalta se bheja:", response);
    return { success: true };
  } catch (error) {
    console.error("❌ Test notification bhejte waqt error:", error);
    
    let errorMessage = "An internal error occurred.";
    if (error.code === 'messaging/invalid-registration-token' || error.code === 'messaging/registration-token-not-registered') {
        errorMessage = "The FCM token is invalid or expired. Please logout and login again to refresh the token.";
    } else if (error.message) {
        errorMessage = error.message;
    }
    
    throw new functions.https.HttpsError(
      "internal",
      errorMessage
    );
  }
});