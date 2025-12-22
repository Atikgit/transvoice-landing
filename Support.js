// Support.js

document.addEventListener("DOMContentLoaded", () => {
    // চ্যাটবক্সের এলিমেন্টগুলো ধরা
    const chatInput = document.getElementById("chat-input");
    const sendButton = document.getElementById("send-btn");
    const chatBody = document.getElementById("chat-body");

    // আপনার টোকেন সার্ভারের URL
    const API_URL = "https://transvoice-token-bmcydudce2bgfufa.centralus-01.azurewebsites.net/api/SupportChat";
    //const API_URL = "http://localhost:7071/api/SupportChat";

    // --- 🤖 KNOWLEDGE BASE (বটের লোকাল ট্রেইনিং ডাটা) ---
    // এই প্রশ্নগুলো করলে বট সার্ভারে কল না করে এখান থেকেই উত্তর দেবে
    const knowledgeBase = [
        {
            keywords: ["latency", "delay", "lag", "slow", "sync", "late", "behind", "buffer", "দেরি", "ল্যাগ", "স্লো"],
            response: "⚙️ **About Latency:** Since TransVoice AI performs complex real-time audio processing, a **natural delay of 1-2 seconds** is expected. This is not a bug.<br><br>💡 **Pro Tip:** If the output voice lags significantly behind the video, please **pause the video for 1-2 seconds** and play again to re-sync. <br><i>Note: This tool is optimized for tutorials & meetings, not fast-paced movies.</i>"
        },
        {
            keywords: ["refund", "money back", "return", "cancel", "payment", "টাকা ফেরত"],
            response: "💸 **Refund Policy:** Generally, payments are **non-refundable** once minutes are used. However, we may consider refunds if:<br>1. Technical error caused a charge.<br>2. Service was completely down.<br>3. Request made within 24h with 0 usage.<br>Email us at <b>support@transvoice.ai</b> for help."
        },
        {
            keywords: ["privacy", "data", "store", "recording", "safe", "secure", "প্রাইভেসি"],
            response: "🔒 **Privacy First:** We DO NOT store your audio permanently. Audio is processed solely for translation and then discarded instantly. We only store your email/name for account management. We never sell your data."
        },
        {
            keywords: ["term", "rules", "allowed", "legal", "movie", "tutorial", "policy"],
            response: "📜 **Terms of Use & Limitations:** This tool is intended for personal or commercial educational use. <br>⚠️ **Disclaimer:** Best for clear speech (tutorials, meetings). Fast-paced content (movies) may result in missed sentences or sync issues."
        },
        {
            keywords: ["price", "cost", "plan", "subscription", "pricing", "dam", "koto"],
            response: "💎 **Pricing:** We have flexible plans starting from **$4.99 for Bronze** (30 mins). Check our <a href='index.html#pricing' style='color:#38bdf8; text-decoration:underline;'>Pricing Page</a> for details on Gold, Platinum, and Diamond plans."
        },
        {
            keywords: ["hello", "hi", "hey", "start", "help", "bot"],
            response: "Hello! 👋 I am the TransVoice AI assistant. I can answer questions about **Latency/Delay**, **Refunds**, **Pricing**, or **Privacy**. How can I help?"
        }
    ];

    // --- ফাংশন: লোকাল উত্তর খোঁজা ---
    function findResponse(text) {
        for (const item of knowledgeBase) {
            if (item.keywords.some(keyword => text.includes(keyword))) {
                return item.response;
            }
        }
        return null; // যদি না মিলে, তবে null ফেরত দেবে
    }

    // --- মেসেজ পাঠানোর ফাংশন ---
    async function sendMessage() {
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        // ১. ইউজারের মেসেজ চ্যাটবক্সে দেখানো
        appendMessage(userMessage, "user");
        chatInput.value = ""; // ইনপুট খালি করা
        
        // [NEW] ২. আগে লোকাল নলেজ বেস চেক করা
        const localReply = findResponse(userMessage.toLowerCase());

        if (localReply) {
            // যদি লোকাল উত্তর পাওয়া যায়, তবে সেটি দেখাবে (একটু দেরি করে ন্যাচারাল ফিলের জন্য)
            setTimeout(() => {
                appendMessage(localReply, "bot");
            }, 600);
            return; // সার্ভারে কল করার দরকার নেই, তাই এখানেই শেষ
        }

        // [EXISTING] ৩. যদি লোকালে না থাকে, তবে সার্ভারে পাঠানো (Fallback)
        const loadingId = appendMessage("Thinking...", "bot", true);

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage }),
            });

            const data = await response.json();
            
            // লোডিং মুছে ফেলা
            removeMessage(loadingId);

            // বটের উত্তর দেখানো
            if (data.reply) {
                appendMessage(data.reply, "bot");
            } else {
                appendMessage("Sorry, I encountered an error.", "bot");
            }

        } catch (error) {
            removeMessage(loadingId);
            appendMessage("Network error. Please try again.", "bot");
            console.error("Chat Error:", error);
        }
    }

    // --- চ্যাটবক্সে মেসেজ যোগ করার হেল্পার ফাংশন ---
    function appendMessage(text, sender, isTemp = false) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", sender); // CSS ক্লাস যোগ করা
        
        // সিম্পল স্টাইলিং
        messageDiv.style.margin = "10px 0";
        messageDiv.style.padding = "10px";
        messageDiv.style.borderRadius = "8px";
        messageDiv.style.maxWidth = "80%";
        messageDiv.style.lineHeight = "1.5"; // পড়ার সুবিধার জন্য
        
        if (sender === "user") {
            messageDiv.style.backgroundColor = "#38bdf8"; // নীল (User)
            messageDiv.style.color = "#0f172a";
            messageDiv.style.marginLeft = "auto"; // ডানদিকে
        } else {
            messageDiv.style.backgroundColor = "#334155"; // ধূসর (Bot)
            messageDiv.style.color = "#ffffff";
            messageDiv.style.marginRight = "auto"; // বামদিকে
        }

        // [UPDATED] innerText এর বদলে innerHTML ব্যবহার করা হয়েছে যাতে বোল্ড/লিংক কাজ করে
        messageDiv.innerHTML = text;
        
        // টেম্পোরারি আইডি (লোডিং এর জন্য)
        const id = Date.now();
        if (isTemp) messageDiv.id = id;

        chatBody.appendChild(messageDiv);
        chatBody.scrollTop = chatBody.scrollHeight; // অটো স্ক্রল
        return id;
    }

    function removeMessage(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    // বাটন ক্লিক ইভেন্ট
    if(sendButton) sendButton.addEventListener("click", sendMessage);

    // এন্টার কি (Enter Key) চাপলে মেসেজ যাবে
    if(chatInput) chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
    });

    // --- ইমেইল ফর্ম সাবমিশন লজিক (আপনার আগের কোড) ---
    const form = document.getElementById('emailForm');
    const status = document.getElementById('form-status');

    // আপনার নতুন Azure Function এর URL
    const EMAIL_API_URL = "https://transvoice-token-bmcydudce2bgfufa.centralus-01.azurewebsites.net/api/SendEmail"; 

    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // ফর্ম থেকে ডাটা নেওয়া
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            if(status) {
                status.innerText = "Sending...";
                status.classList.remove('hidden', 'text-red-400', 'text-green-400');
                status.classList.add('text-gray-400');
            }

            try {
                const response = await fetch(EMAIL_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: data.email,
                        message: data.message,
                        subject: "Support Request via Website"
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    if(status) {
                        status.innerText = "Message sent successfully! We'll reply soon.";
                        status.classList.add('text-green-400');
                    }
                    form.reset();
                } else {
                    if(status) {
                        status.innerText = "Failed: " + (result.error || "Unknown error");
                        status.classList.add('text-red-400');
                    }
                }
            } catch (error) {
                if(status) {
                    status.innerText = "Network error. Please try again.";
                    status.classList.add('text-red-400');
                }
            }
        });
    }
});