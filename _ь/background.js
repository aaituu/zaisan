// background.js

const GEMINI_API_KEY = "AIzaSyBdTTEotgoI9ZfaxBqNaaPt6pokTKKv9Ro"; // !!! ЗАМЕНИТЕ НА ВАШ КЛЮЧ !!!
const API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// Функция для генерации промпта на основе типа вопроса
function generatePrompt(type, text, options = [], imageBase64 = null) {
    let basePrompt = "This is a test question. Provide a **very concise** answer.";
    let prompt = basePrompt;

    if (imageBase64) {
        prompt = `Analyze the image which contains a test question. Determine the type of question. Provide the correct answer(s) in a very concise format based on the following rules: 
    - For Multiple Choice, True/False, or Short Answer: **ONLY the letter (A, B, C...) or the exact short answer text**.
    - For Matching or Drag and Drop: **ONLY the matching pairs** in the format: 1. A, 2. B, 3. C, etc.
    Do not add any explanation or preamble.
    `;
        return prompt;
    }

    if (type === "truefalse") {
        prompt +=
            " Provide the correct answer in one word: **TRUE** or **FALSE**. Question: " +
            text;
    } else if (type === "shortanswer") {
        prompt += " Provide **ONLY the exact answer text** (1-3 words). Question: " + text;
    } else if (type === "matching" || type === "dragdrop") {
        prompt +=
            " Provide **ONLY the correct matching pairs** in the format: **1. X, 2. Y, 3. Z**. Question with options: " +
            text;
    } else if (type === "multichoice") {
        const optionsString = options.length
            ? "\nAnswer options:\n" + options.join("\n")
            : "";
        prompt += ` This is a multiple-choice question. Select **ONLY the correct option letter(s)** (e.g., A, B, or A, C). ${text}${optionsString}`;
    } else {
        prompt = "Provide a short, direct answer to this question: " + text;
    }
    return prompt;
}

// Универсальная функция для отправки запроса в Gemini
async function getAnswerFromGemini(data) {
    const {
        questionText,
        questionType,
        answerOptions = [],
        imageBase64 = null,
    } = data;
    const prompt = generatePrompt(
        questionType,
        questionText,
        answerOptions,
        imageBase64
    );

    let contents = [];

    if (imageBase64) {
        contents = [
            {
                parts: [
                    {
                        inlineData: {
                            mimeType: "image/png",
                            data: imageBase64.split(",")[1],
                        },
                    },
                    { text: prompt },
                ],
            },
        ];
    } else {
        contents = [
            {
                parts: [{ text: prompt }],
            },
        ];
    }

    const requestBody = { contents };

    try {
        const response = await fetch(API_URL + "?key=" + GEMINI_API_KEY, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        const answer =
            result?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "No answer available";
        return { success: true, answer: answer };
    } catch (error) {
        return { success: false, answer: `API Error: ${error.message}` };
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (
        isSelfDestructed &&
        request.action !== "selfDestruct" &&
        request.action !== "checkIfDestroyed"
    ) {
        sendResponse({ answer: "Extension is disabled.", error: true });
        return false;
    }

    if (request.action === "checkIfDestroyed") {
        sendResponse({ isDestroyed: isSelfDestructed });
        return true;
    }

    if (request.action === "selfDestruct") {
        chrome.storage.local.set({ isDestroyed: true }, () => {
            isSelfDestructed = true;
            chrome.storage.local.remove("geminiChatHistory");
            if (chrome.management && chrome.management.uninstallSelf) {
                chrome.management.uninstallSelf({ showConfirmDialog: false }, () => { });
            }
            sendResponse({ success: true });
        });
        return true;
    }

    if (request.action === "getGeminiAnswer") {
        getAnswerFromGemini(request.data).then((result) => sendResponse(result));
        return true;
    }

    if (request.action === "processScreenshotAsync") {
        processAsyncScreenshot(request.data);
        sendResponse({ accepted: true });
        return true;
    }

    return false;
});

async function processAsyncScreenshot(data, senderTabId) {
    const result = await getAnswerFromGemini(data);
    chrome.runtime.sendMessage({
        action: "updateChatAnswer",
        answer: result.answer,
        messageIndex: data.messageIndex,
    });
}

chrome.commands.onCommand.addListener(function (command) {
    if (command === "toggle_popup") {
        chrome.action.openPopup();
    } else if (command === "toggle-visibility") {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "toggleVisibility",
                });
            }
        });
    }
});

let isSelfDestructed = false;

chrome.storage.local.get(["isDestroyed"], function (result) {
    if (result.isDestroyed === true) {
        isSelfDestructed = true;
    }
});
