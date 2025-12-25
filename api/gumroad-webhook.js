// api/gumroad-webhook.js
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// 1. Firebase Setup
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const data = req.body;
  const oldWebhookUrl = 'https://gumroadwebhook-rh4gqsiata-uc.a.run.app';

  console.log("Received Gumroad Data:", data.email);

  try {
    // --- কাজ ১: ফায়ারবেস আপডেট করা (নতুন সিস্টেম) ---
    const uid = data.url_params?.client_reference_id || data.client_reference_id;
    
    if (uid) {
        await db.collection('users').doc(uid).set({
            plan: 'pro', // বা আপনার লজিক অনুযায়ী প্ল্যান নাম
            subscriptionId: data.subscription_id || 'one_time',
            purchaseDate: new Date().toISOString(),
            gumroadEmail: data.email,
            paymentStatus: 'paid'
        }, { merge: true });
        console.log(`Firebase updated for User: ${uid}`);
    } else {
        console.log("No UID found, skipping Firebase update.");
    }

    // --- কাজ ২: পুরনো লিংকে ডাটা পাঠিয়ে দেয়া (Forwarding) ---
    // আমরা Gumroad থেকে যা পেয়েছি, হুবহু তাই পুরনো লিংকে পাঠিয়ে দিচ্ছি
    const forwardResponse = await fetch(oldWebhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded', // Gumroad সাধারণত এই ফরমেটে পাঠায়
        },
        body: new URLSearchParams(data).toString()
    });

    if (forwardResponse.ok) {
        console.log("Successfully forwarded to old webhook.");
    } else {
        console.error("Failed to forward to old webhook:", await forwardResponse.text());
    }

    // সবকিছু সফল
    return res.status(200).send('Webhook Processed & Forwarded');

  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).send('Internal Server Error');
  }
}
