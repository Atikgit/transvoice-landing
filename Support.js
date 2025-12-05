// Support.js

// চ্যাটবক্সের এলিমেন্টগুলো ধরা
const chatInput = document.getElementById("chat-input");
const sendButton = document.getElementById("send-btn");
const chatBody = document.getElementById("chat-body");

// আপনার টোকেন সার্ভারের URL (লোকাল টেস্টের জন্য localhost)
// লাইভ করার সময় এটি আপনার লাইভ সার্ভার URL দিয়ে বদলে দেবেন
const API_URL = "https://transvoice-token-bmcydudce2bgfufa.centralus-01.azurewebsites.net/api/SupportChat";
//const API_URL = "http://localhost:7071/api/SupportChat";
// মেসেজ পাঠানোর ফাংশন
async function sendMessage() {
    const userMessage = chatInput.value.trim();
    if (!userMessage) return;

    // ১. ইউজারের মেসেজ চ্যাটবক্সে দেখানো
    appendMessage(userMessage, "user");
    chatInput.value = ""; // ইনপুট খালি করা
    
    // লোডিং দেখানো (অপশনাল)
    const loadingId = appendMessage("Thinking...", "bot", true);

    try {
        // ২. সার্ভারে পাঠানো
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: userMessage }),
        });

        const data = await response.json();
        
        // লোডিং মুছে ফেলা
        removeMessage(loadingId);

        // ৩. বটের উত্তর দেখানো
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

// চ্যাটবক্সে মেসেজ যোগ করার হেল্পার ফাংশন
function appendMessage(text, sender, isTemp = false) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", sender); // CSS ক্লাস যোগ করা
    
    // সিম্পল স্টাইলিং (আপনি CSS ফাইলে আরও সুন্দর করতে পারেন)
    messageDiv.style.margin = "10px 0";
    messageDiv.style.padding = "10px";
    messageDiv.style.borderRadius = "8px";
    messageDiv.style.maxWidth = "80%";
    
    if (sender === "user") {
        messageDiv.style.backgroundColor = "#38bdf8"; // নীল (User)
        messageDiv.style.color = "#0f172a";
        messageDiv.style.marginLeft = "auto"; // ডানদিকে
    } else {
        messageDiv.style.backgroundColor = "#334155"; // ধূসর (Bot)
        messageDiv.style.color = "#ffffff";
        messageDiv.style.marginRight = "auto"; // বামদিকে
    }

    messageDiv.innerText = text;
    
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
sendButton.addEventListener("click", sendMessage);

// এন্টার কি (Enter Key) চাপলে মেসেজ যাবে
chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});




// ইমেইল ফর্ম সাবমিশন লজিক
const form = document.getElementById('emailForm');
const status = document.getElementById('form-status');

// আপনার নতুন Azure Function এর URL
const EMAIL_API_URL = "https://transvoice-token-bmcydudce2bgfufa.centralus-01.azurewebsites.net/api/SendEmail"; 

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // ফর্ম থেকে ডাটা নেওয়া
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    status.innerText = "Sending...";
    status.classList.remove('hidden', 'text-red-400', 'text-green-400');
    status.classList.add('text-gray-400');

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
            status.innerText = "Message sent successfully! We'll reply soon.";
            status.classList.add('text-green-400');
            form.reset();
        } else {
            status.innerText = "Failed: " + (result.error || "Unknown error");
            status.classList.add('text-red-400');
        }
    } catch (error) {
        status.innerText = "Network error. Please try again.";
        status.classList.add('text-red-400');
    }
});