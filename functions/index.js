// ================= IMPORTS =================
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { getFirestore } = require("firebase-admin/firestore");
const admin = require("firebase-admin");
const path = require("path");

// ================= INITIALIZE FIREBASE ADMIN WITH JSON FILE =================
// Yahan apne JSON file ka correct naam daalna (jo tu download karke dala tha)
const serviceAccount = require(path.join(__dirname, "lpgguard-b501ff145328.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = getFirestore();


// ================= CLOUD FUNCTION =================
exports.onDeviceUpdateSendNotification = onDocumentUpdated("devices/{deviceId}", async (event) => {
  if (!event.data) {
    console.log("⚠️ No event data found.");
    return null;
  }

  const deviceDataAfter = event.data.after.data();
  const deviceDataBefore = event.data.before.data();
  const deviceId = event.params.deviceId;

  // Safety checks
  if (!deviceDataAfter || !deviceDataBefore) {
    console.log("⚠️ Missing device data in event.");
    return null;
  }

  const gasLevelAfter = Number(deviceDataAfter.gasLevel) || 0;
  const gasLevelBefore = Number(deviceDataBefore.gasLevel) || 0;
  const LEAK_THRESHOLD = 75;

  // --- Detect change from safe → unsafe ---
  if (gasLevelBefore < LEAK_THRESHOLD && gasLevelAfter >= LEAK_THRESHOLD) {
    console.log(`🚨 LEAK DETECTED for device: ${deviceId}`);

    const ownerId = deviceDataAfter.ownerId;
    if (!ownerId) {
      console.log("❌ No ownerId found in device document.");
      return null;
    }

    // 1️⃣ Fetch user FCM token from Firestore
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
        title: "⚠️ GAS LEAK DETECTED!",
        body: `Device '${deviceDataAfter.name || "Your LPG Sensor"}' reported a leak. Please close the main valve immediately!`,
        sound: "default",
      },
      android: {
        notification: {
          channel_id: "leak_alerts",
          sound: "default",
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
    console.log("ℹ️ Gas level did not cross threshold. No notification sent.");
  }

  return null;
});
