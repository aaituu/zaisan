// ============================================================================
// ПРОВЕРКА ДОСТУПНОСТИ РАСШИРЕНИЯ
// ============================================================================
console.log('[OES Extension] Content script loaded');

function checkServiceWorker() {
    if (!chrome.runtime || !chrome.runtime.id) {
        console.error('[OES Extension] Chrome runtime is not available');
        showError('Extension context invalidated. Please reload the page.');
        return false;
    }
    return true;
}

function safeSendMessage(message, callback) {
    if (!checkServiceWorker()) {
        if (callback) callback({ error: 'Service worker not available' });
        return;
    }
    
    try {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                console.error('[OES Extension] Message error:', chrome.runtime.lastError.message);
                showError('Could not reach helper service.');
                if (callback) callback({ error: chrome.runtime.lastError.message });
            } else {
                if (callback) callback(response);
            }
        });
    } catch (e) {
        console.error('[OES Extension] Exception sending message:', e);
        showError('Could not reach helper service.');
        if (callback) callback({ error: e.message });
    }
}

function showError(message) {
    const errorDiv = document.getElementById('extension-error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    } else {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #f44336;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 999999;
            font-family: Arial, sans-serif;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        notification.textContent = 'Error: ' + message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// ============================================================================
// ЗАЩИТА ОТ ПОВТОРНОГО ЗАПУСКА
// ============================================================================
if (window.quizHelperHasRun) {
    console.log('[OES Extension] Quiz helper already running, skipping initialization');
} else {
    window.quizHelperHasRun = true;

    // ========================================================================
    // ИНИЦИАЛИЗАЦИЯ
    // ========================================================================
    async function preInitCheck() {
        try {
            const response = await new Promise((resolve, reject) => {
                safeSendMessage({ action: "checkIfDestroyed" }, (response) => {
                    if (response && response.error) {
                        reject(new Error(response.error));
                    } else {
                        resolve(response);
                    }
                });
            });

            if (response && response.isDestroyed) {
                return true;
            }
            return false;
        } catch (e) {
            console.error('[OES Extension] Pre-init check failed:', e);
            return false;
        }
    }

    // ========================================================================
    // ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
    // ========================================================================
    let hoverEnabled = true;
    let isDisplayStuck = false;
    let currentAnswerDisplay = null;
    let questionsDataCache = [];

    // Создание индикатора
    let helperElement = document.createElement("div");
    helperElement.id = "exam-helper-btn-indicator";
    helperElement.style.cssText = `
        position: fixed;
        bottom: 0px;
        right: 0px;
        width: 8px;
        height: 8px;
        background-color: #a1a1a1ff;
        border-radius: 50%;
        z-index: 999999999; 
        opacity: 0.2 !important; 
        pointer-events: none;
    `;
    
    if (document.body) {
        document.body.appendChild(helperElement);
    } else {
        window.addEventListener("load", () => {
            if (document.body) {
                document.body.appendChild(helperElement);
            }
        });
    }

    // ========================================================================
    // ФУНКЦИЯ САМОУНИЧТОЖЕНИЯ
    // ========================================================================
    function destroyExtension() {
        console.log('[OES Extension] Destroying extension');
        
        if (helperElement && helperElement.parentNode) {
            helperElement.remove();
        }
        if (currentAnswerDisplay && currentAnswerDisplay.parentNode) {
            currentAnswerDisplay.remove();
        }

        document.querySelectorAll(
            "div[id^='q'], section[data-region='question'], .que, form, .quiz-question"
        ).forEach((el) => {
            if (el.__mouseoverHandler__) {
                el.removeEventListener("mouseover", el.__mouseoverHandler__);
                el.removeEventListener("mouseout", el.__mouseoutHandler__);
                delete el.__mouseoverHandler__;
                delete el.__mouseoutHandler__;
            }
        });

        window.extensionIsDestroyed = true;
        questionsDataCache = [];
    }

    // ========================================================================
    // РАБОТА С GEMINI API
    // ========================================================================
    async function getAnswerFromGemini(questionText, questionType, isMultipleChoice, answerOptions = []) {
        const data = {
            questionText: questionText,
            questionType: questionType,
            isMultipleChoice: isMultipleChoice,
            answerOptions: answerOptions,
        };
        
        try {
            const response = await new Promise((resolve, reject) => {
                safeSendMessage({
                    action: "getGeminiAnswer",
                    data: data
                }, (response) => {
                    if (response && response.error) {
                        reject(new Error(response.error || response.answer));
                    } else {
                        resolve(response);
                    }
                });
            });
            
            return response?.answer || "Error getting answer";
        } catch (error) {
            console.error('[OES Extension] Gemini API error:', error);
            return "Error: Could not reach helper service.";
        }
    }

    // ========================================================================
    // ОБРАБОТКА ВОПРОСОВ
    // ========================================================================
    function cleanQuestionHtml(htmlString) {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlString;

        tempDiv.querySelectorAll("script, style, link, noscript").forEach((el) => el.remove());

        const cleanAttributes = (element) => {
            Array.from(element.attributes).forEach((attr) => {
                if (attr.name !== "src" && attr.name !== "alt") {
                    element.removeAttribute(attr.name);
                }
            });
            Array.from(element.children).forEach(cleanAttributes);
        };
        cleanAttributes(tempDiv);

        return tempDiv.innerText.trim();
    }

    function findQuestionTextElement(element) {
        let qtext = element.querySelector("div.qtext");
        if (qtext) return qtext;

        const allTextBlocks = Array.from(
            element.querySelectorAll("p, div, span, h1, h2, h3, h4, label")
        );

        const relevantBlocks = allTextBlocks.filter((block) => {
            const text = block.innerText.trim();
            return (
                text.length > 10 &&
                !block.closest('[data-region="answer-label"]') &&
                !block.closest('label[for^="q"]') &&
                !block.closest("div.ablock")
            );
        });

        let bestBlock = null;
        let maxTextLength = 0;

        relevantBlocks.forEach((block) => {
            const cleanedText = cleanQuestionHtml(block.innerHTML);
            const length = cleanedText.length;

            if (length > maxTextLength) {
                maxTextLength = length;
                bestBlock = block;
            }
        });

        return bestBlock;
    }

    function formatAnswerText(type, rawAnswer) {
        let answer = rawAnswer.trim();

        answer = answer
            .replace(/^(the correct answer is|correct answer is|correct answer:)\s*/i, "")
            .replace(/^(option|variant)\s*[a-z]\s*[:.]\s*/i, "")
            .replace(/^(the correct option is)\s*/i, "")
            .trim();

        if (type === "truefalse") {
            const lowerAnswer = answer.toLowerCase();
            if (lowerAnswer.includes("true")) return "T";
            if (lowerAnswer.includes("false")) return "F";
            if (answer.length === 1 && /[A-Za-z]/.test(answer))
                return answer.toUpperCase();
        }

        return answer;
    }

    async function parseQuestions() {
        let questionsData = [];

        const possibleQuestionContainers = document.querySelectorAll(
            "div[id^='q'], section[data-region='question'], .que, .quiz-question, div.content, div.question, div.test-item"
        );

        const allQuestionBlocks = Array.from(possibleQuestionContainers).filter((block) => {
            if (block.id === "quiz-timer-wrapper") {
                return false;
            }

            const isQuestionWrapper = block.matches("div[id^='q']");

            if (isQuestionWrapper) {
                const ancestorQuestionBlock = block.parentElement.closest('[id^="q"]');
                if (ancestorQuestionBlock && ancestorQuestionBlock !== block) {
                    return false;
                }
                return true;
            }

            if (block.matches("form, .quiz-question")) {
                if (block.querySelector('.que, div[id^="q"]')) {
                    return true;
                }
                return false;
            }

            return true;
        });

        const uniqueQuestionBlocks = Array.from(new Set(allQuestionBlocks));

        for (const questionBlock of uniqueQuestionBlocks) {
            let questionText = "";
            let questionType = "shortanswer";
            let isMultipleChoice = false;
            let answerOptions = [];

            const questionTextElement = findQuestionTextElement(questionBlock);

            if (!questionTextElement) continue;

            questionText = cleanQuestionHtml(questionTextElement.innerHTML);
            const classList = questionBlock.classList;

            if (classList.contains("truefalse")) {
                questionType = "truefalse";
            } else if (classList.contains("match")) {
                questionType = "matching";
            } else if (classList.contains("shortanswer")) {
                questionType = "shortanswer";
            } else if (classList.contains("multichoice")) {
                questionType = "multichoice";
                const multipleAnswerCheck = questionBlock.querySelector(".multiple");
                if (multipleAnswerCheck) isMultipleChoice = true;
            } else if (questionBlock.querySelector('input[type="radio"]')) {
                questionType = "multichoice";
            } else if (questionBlock.querySelector('input[type="checkbox"]')) {
                questionType = "multichoice";
                isMultipleChoice = true;
            } else if (questionBlock.querySelector(".draganddrop")) {
                questionType = "dragdrop";
            }

            if (questionType === "multichoice" || questionType === "truefalse") {
                const labels = questionBlock.querySelectorAll('label, [data-region="answer-label"]');
                labels.forEach((label) => {
                    const text = label.innerText.trim();
                    if (text.length > 1) {
                        answerOptions.push(text);
                    }
                });
                questionText += answerOptions.length
                    ? "\nPossible options:\n" + answerOptions.join("\n")
                    : "";
            } else if (questionType === "matching" || questionType === "dragdrop") {
                const rowElements = questionBlock.querySelectorAll(
                    "table tr, .match-item, .drag-item"
                );
                let matchData = "";
                rowElements.forEach((row, index) => {
                    const qPart =
                        row.querySelector(".text, .question-part")?.innerText.trim() || "";
                    const aOptions = Array.from(
                        row.querySelectorAll("select option, .drag-source")
                    )
                        .map((opt) => opt.innerText.trim())
                        .filter((t) => t.length > 1);

                    if (qPart) {
                        matchData += `\n ${index + 1}. ${qPart}\n Answers: ${aOptions.join(" / ")}\n`;
                    }
                });
                questionText += matchData;
            }

            const shortAnswer = await getAnswerFromGemini(
                questionText,
                questionType,
                isMultipleChoice,
                answerOptions
            );

            questionsData.push({
                qtext: questionText,
                type: questionType,
                shortAnswer: shortAnswer,
                multipleChoice: isMultipleChoice,
                questionElement: questionBlock,
            });
        }
        return questionsData;
    }

    // ========================================================================
    // UI ФУНКЦИИ
    // ========================================================================
    function toggleHover() {
        hoverEnabled = !hoverEnabled;

        if (helperElement) {
            if (hoverEnabled) {
                helperElement.style.display = "block";
                helperElement.style.backgroundColor = "#a1a1a1ff";
                helperElement.style.opacity = "0.2";
            } else {
                helperElement.style.display = "none";
            }
        }

        if (!hoverEnabled && !isDisplayStuck && currentAnswerDisplay) {
            currentAnswerDisplay.style.display = "none";
            currentAnswerDisplay.style.pointerEvents = "none";
        }
    }

    function toggleDisplayVisibility() {
        if (!currentAnswerDisplay) return;

        if (!currentAnswerDisplay.innerText || currentAnswerDisplay.innerText.trim() === "") {
            return;
        }

        isDisplayStuck = !isDisplayStuck;

        if (isDisplayStuck) {
            currentAnswerDisplay.style.display = "block";
            currentAnswerDisplay.style.pointerEvents = "auto";
            currentAnswerDisplay.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.3)";
        } else {
            currentAnswerDisplay.style.display = "none";
            currentAnswerDisplay.style.pointerEvents = "none";
            currentAnswerDisplay.style.boxShadow = "none";
        }
    }

    function displayAnswerOnHover(answersData) {
        if (!currentAnswerDisplay) {
            currentAnswerDisplay = document.createElement("div");
            currentAnswerDisplay.classList.add("answer-display-single");
            currentAnswerDisplay.style.cssText = `
                position: fixed; 
                bottom: 10px; 
                left: 10px; 
                right: auto; 
                transform: none; 
                color: #525252ff; 
                padding: 4px 10px; 
                font-size: 9px; 
                font-weight: bold; 
                background-color: #ffffffcb; 
                border: 1px solid #ffffff15; 
                border-radius: 4px; 
                display: none; 
                opacity: 0.95;
                z-index: 999999999; 
                max-width: 250px; 
                pointer-events: none; 
                white-space: pre-wrap; 
                text-align: left;
            `;

            if (document.body) {
                document.body.appendChild(currentAnswerDisplay);
            } else {
                return;
            }
        }

        currentAnswerDisplay.style.display = "none";
        currentAnswerDisplay.style.pointerEvents = "none";
        currentAnswerDisplay.style.boxShadow = "none";

        answersData.forEach((data) => {
            const questionBlock = data.questionElement;
            if (!questionBlock) return;

            const finalAnswerText = formatAnswerText(data.type, data.shortAnswer);

            const mouseOverHandler = (event) => {
                event.stopPropagation();

                if (hoverEnabled && currentAnswerDisplay) {
                    currentAnswerDisplay.innerText = finalAnswerText;
                    currentAnswerDisplay.style.display = "block";
                    currentAnswerDisplay.style.pointerEvents = "auto";
                    if (!isDisplayStuck) {
                        currentAnswerDisplay.style.boxShadow = "none";
                    }
                }
            };

            const mouseOutHandler = () => {
                if (currentAnswerDisplay) {
                    if (hoverEnabled && !isDisplayStuck) {
                        currentAnswerDisplay.style.display = "none";
                        currentAnswerDisplay.style.pointerEvents = "none";
                    }
                }
            };

            if (questionBlock.__mouseoverHandler__) {
                questionBlock.removeEventListener("mouseover", questionBlock.__mouseoverHandler__);
                questionBlock.removeEventListener("mouseout", questionBlock.__mouseoutHandler__);
            }

            questionBlock.addEventListener("mouseover", mouseOverHandler);
            questionBlock.addEventListener("mouseout", mouseOutHandler);

            questionBlock.__mouseoverHandler__ = mouseOverHandler;
            questionBlock.__mouseoutHandler__ = mouseOutHandler;
        });
    }

    // ========================================================================
    // ИНИЦИАЛИЗАЦИЯ
    // ========================================================================
    async function init() {
        console.log('[OES Extension] Initializing quiz helper');
        
        hoverEnabled = true;
        isDisplayStuck = false;
        
        if (helperElement) {
            helperElement.style.display = "block";
            helperElement.style.backgroundColor = "#a1a1a1ff";
            helperElement.style.opacity = "0.2";
        }

        if (currentAnswerDisplay) {
            if (currentAnswerDisplay.parentNode) {
                currentAnswerDisplay.remove();
            }
            currentAnswerDisplay = null;

            document.querySelectorAll(
                "div[id^='q'], section[data-region='question'], .que, form, .quiz-question"
            ).forEach((el) => {
                if (el.__mouseoverHandler__) {
                    el.removeEventListener("mouseover", el.__mouseoverHandler__);
                    el.removeEventListener("mouseout", el.__mouseoutHandler__);
                    delete el.__mouseoverHandler__;
                    delete el.__mouseoutHandler__;
                }
            });
        }

        questionsDataCache = await parseQuestions();
        displayAnswerOnHover(questionsDataCache);
        
        console.log('[OES Extension] Quiz helper initialized, found', questionsDataCache.length, 'questions');
    }

    // ========================================================================
    // ОБРАБОТЧИКИ СОБЫТИЙ
    // ========================================================================
    if (!window.isKeydownListenerAttached) {
        window.addEventListener("keydown", (event) => {
            if (event.altKey && (event.key === "x" || event.key === "X")) {
                event.preventDefault();
                toggleHover();
                return;
            }

            if (event.altKey && (event.key === "z" || event.key === "Z")) {
                event.preventDefault();
                toggleDisplayVisibility();
                return;
            }

            if (event.altKey && (event.key === "r" || event.key === "R")) {
                event.preventDefault();
                init();
                return;
            }
        });
        window.isKeydownListenerAttached = true;
    }

    const selfDestructListener = (event) => {
        if (event.shiftKey && !event.ctrlKey && !event.altKey) {
            event.preventDefault();
            event.stopPropagation();
            destroyExtension();
            safeSendMessage({ action: "selfDestruct" }, () => {});
            document.removeEventListener("dblclick", selfDestructListener, true);
        }
    };

    if (!window.isDestroyListenerAttached) {
        document.addEventListener("dblclick", selfDestructListener, true);
        window.isDestroyListenerAttached = true;
    }

    // ========================================================================
    // ЗАПУСК
    // ========================================================================
    async function startScript() {
        const isDestroyed = await preInitCheck();
        if (!isDestroyed) {
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", init);
            } else {
                init();
            }
        } else {
            console.log('[OES Extension] Extension is destroyed, skipping initialization');
        }
    }

    startScript();
}

console.log('[OES Extension] Injector script loaded successfully');