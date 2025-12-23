const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.gumroadWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const data = req.body;
    
    // ১. ডিবাগিং: আমরা পুরো ডাটা লগে দেখবো যে Gumroad আসলে কী পাঠাচ্ছে
    console.log("📣 FULL PAYLOAD FROM GUMROAD:", JSON.stringify(data));

    // ২. আগের ব্লকারটি বাদ দিলাম (resource_name check removed)
    // সরাসরি ইমেইল খুঁজবো
    const userEmail = data.email; 
    
    // Gumroad অনেক সময় 'product_name' বা 'variants' ভিন্ন ফরম্যাটে পাঠায়, তাই সেফটি চেক
    const productName = data.product_name || "Unknown Product";
    const variant = data.variants ? JSON.stringify(data.variants) : (data.variant || "");

    console.log(`Processing Order for Email: ${userEmail}`);
    console.log(`Product: ${productName}, Variant: ${variant}`);

    if (!userEmail) {
        console.log("❌ No email found in payload!");
        return res.status(200).send("No Email");
    }

    // ৩. প্ল্যান ডিটেকশন লজিক (একটু সহজ করা হয়েছে)
    let minutesToAdd = 0;
    let planName = "Free";
    const fullInfo = (productName + " " + variant).toLowerCase();

    if (fullInfo.includes("bronze")) {
      minutesToAdd = 35; planName = "Bronze Starter";
    } else if (fullInfo.includes("gold")) {
      minutesToAdd = 70; planName = "Gold Lite";
    } else if (fullInfo.includes("platinum")) {
      minutesToAdd = 140; planName = "Platinum Plus";
    } else if (fullInfo.includes("diamond")) {
      minutesToAdd = 210; planName = "Diamond Pro";
    } else {
      // যদি নাম না মেলে, ডিফল্ট হিসেবে কিছু মিনিট অ্যাড করে টেস্ট করবো
      console.log("⚠️ Plan name mismatch, adding default 10 mins for testing.");
      minutesToAdd = 10; 
      planName = "Unknown/Test";
    }

    // ৪. ফায়ারবেস আপডেট
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", userEmail).limit(1).get();

    if (snapshot.empty) {
      console.log("❌ User not found in Firebase database.");
      return res.status(200).send("User Not Found");
    }

    const userDoc = snapshot.docs[0];
    await userDoc.ref.update({
      balance: admin.firestore.FieldValue.increment(minutesToAdd),
      bonusMinutes: admin.firestore.FieldValue.increment(minutesToAdd > 30 ? 5 : 0), // Simple bonus logic
      planName: planName,
      lastPaymentDate: new Date(),
      lastWebhookPayload: JSON.stringify(data) // ডাটাবেসেও সেভ রাখছি দেখার জন্য
    });

    console.log(`✅ SUCCESS! Added ${minutesToAdd} mins to ${userEmail}`);
    return res.status(200).send("Success");

  } catch (error) {
    console.error("🔥 ERROR:", error);
    return res.status(500).send("Error");
  }
});


// ==========================================
// ২. Manual Bonus Helper (Old - Kept)
// ==========================================
exports.addManualBonus = functions.https.onCall(async (data, context) => {
    const { email, minutes } = data;
    
    // ডাটা ভ্যালিডেশন
    if (!email || !minutes) {
        throw new functions.https.HttpsError('invalid-argument', 'Email and minutes are required');
    }

    const userQuery = await db.collection("users").where("email", "==", email).limit(1).get();

    if (userQuery.empty) {
        throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    
    const bonusToAdd = parseFloat(minutes);
    const currentBalance = parseFloat(userData.balance || 0);
    const currentBonus = parseFloat(userData.bonusMinutes || 0);

    await userDoc.ref.update({
        balance: currentBalance + bonusToAdd,
        bonusMinutes: currentBonus + bonusToAdd
    });

    return { success: true, message: `Success! Added ${bonusToAdd} mins to ${email}.` };
});