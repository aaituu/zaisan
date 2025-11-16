// --- ЗАЩИТА ОТ ПОВТОРНОГО ЗАПУСКА ---
if (!window.quizHelperHasRun) {
  window.quizHelperHasRun = true;

  // --- НОВАЯ ФУНКЦИЯ: Генерирует задержку, имитирующую время реакции человека ---
  function getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  // ----------------------------------------------------------------------------

  async function preInitCheck() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "checkIfDestroyed",
      });
      return response?.isDestroyed || false;
    } catch (e) {
      return false;
    }
  }

  let questionsDataCache = [];

  // --- УДАЛЕНО: injectLiftStyles (Удаление вставки CSS стилей)

  function destroyExtension() {
    const style = document.querySelector(
      'style[data-quiz-helper-style="true"]'
    );
    style?.remove();

    // --- УДАЛЕНО: helperElement?.remove(), currentAnswerDisplay?.remove()

    document
      .querySelectorAll(
        "div[id^='q'], section[data-region='question'], .que, form, .quiz-question"
      )
      .forEach((el) => {
        // Удаляем все обработчики, включая старые dblclick и новые click
        if (el.__mouseoverHandler__) {
          el.removeEventListener("mouseover", el.__mouseoverHandler__);
          el.removeEventListener("mouseout", el.__mouseoutHandler__);
          delete el.__mouseoverHandler__;
        }
        // !!! ИЗМЕНЕНИЕ: удаляем старый dblclick и новый click
        if (el.__clickHandler__) {
          el.removeEventListener("click", el.__clickHandler__);
          delete el.__clickHandler__;
        }
      });

    window.extensionIsDestroyed = true;
    questionsDataCache = [];
  }

  async function getAnswerFromGemini(
    questionText,
    questionType,
    isMultipleChoice,
    answerOptions = []
  ) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getGeminiAnswer",
        data: { questionText, questionType, isMultipleChoice, answerOptions },
      });
      return response?.answer || "";
    } catch {
      return "";
    }
  }

  function cleanQuestionHtml(htmlString) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlString;
    tempDiv
      .querySelectorAll("script, style, link, noscript")
      .forEach((el) => el.remove());

    const cleanAttributes = (element) => {
      Array.from(element.attributes).forEach((attr) => {
        if (attr.name !== "src" && attr.name !== "alt")
          element.removeAttribute(attr.name);
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
      const length = cleanQuestionHtml(block.innerHTML).length;
      if (length > maxTextLength) {
        maxTextLength = length;
        bestBlock = block;
      }
    });
    return bestBlock;
  }

  function getQuestionNumber(block) {
    const idMatch = block.id?.match(/q(\d+)/);
    if (idMatch) return idMatch[1];

    const qnumEl = block.querySelector(
      '.qno, .question-number, [class*="number"]'
    );
    if (qnumEl) {
      const numMatch = qnumEl.innerText.match(/\d+/);
      if (numMatch) return numMatch[0];
    }

    return "unknown";
  }

  async function parseQuestions() {
    const questionsData = [];
    const containers = document.querySelectorAll(
      "div[id^='q'], section[data-region='question'], .que, .quiz-question, div.content, div.question, div.test-item"
    );
    const allBlocks = Array.from(containers).filter((block) => {
      if (block.id === "quiz-timer-wrapper") return false;
      if (block.matches("div[id^='q']")) {
        const ancestor = block.parentElement.closest('[id^="q"]');
        return !ancestor || ancestor === block;
      }
      if (block.matches("form, .quiz-question"))
        return !!block.querySelector('.que, div[id^="q"]');
      return true;
    });
    const uniqueBlocks = Array.from(new Set(allBlocks));

    for (const block of uniqueBlocks) {
      let qText = "";
      let qType = "multichoice";
      let isMC = false;
      let options = [];

      const qTextElement = findQuestionTextElement(block);
      if (!qTextElement) continue;

      qText = cleanQuestionHtml(qTextElement.innerHTML);
      const classList = block.classList;

      if (classList.contains("truefalse")) {
        qType = "truefalse";
      } else if (classList.contains("multichoice")) {
        qType = "multichoice";
        if (block.querySelector(".multiple")) isMC = true;
      } else if (block.querySelector('input[type="radio"]')) {
        qType = "multichoice";
      } else if (block.querySelector('input[type="checkbox"]')) {
        qType = "multichoice";
        isMC = true;
      } else {
        continue;
      }

      if (qType === "multichoice" || qType === "truefalse") {
        const labels = block.querySelectorAll(
          'label, [data-region="answer-label"]'
        );
        labels.forEach((label) => {
          const text = label.innerText.trim();
          if (text.length > 1 && !text.toLowerCase().includes("clear my choice")) {
            options.push(text);
          }
        });
        if (options.length) {
          qText +=
            "\n\nAvailable options:\n" +
            options
              .map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`)
              .join("\n");
          qText +=
            "\n\nIMPORTANT: Respond ONLY with the letter(s) of correct answer(s) from the options above. For multiple answers, separate with commas (e.g., 'A, C, D')";
        }
      }

      const shortAnswer = await getAnswerFromGemini(
        qText,
        qType,
        isMC,
        options
      );

      questionsData.push({
        qtext: qText,
        type: qType,
        shortAnswer: (shortAnswer || "").toString().trim(),
        multipleChoice: isMC,
        questionElement: block,
        questionNumber: getQuestionNumber(block),
        mcOptions: options,
      });
    }
    return questionsData;
  }

  // --- УДАЛЕНО: animateElement (удаление анимации подсветки)

  function dispatchInputEvents(el) {
    if (!el) return;
    const evInput = new Event("input", { bubbles: true });
    const evChange = new Event("change", { bubbles: true });
    el.dispatchEvent(evInput);
    el.dispatchEvent(evChange);
  }

  // !!! ИЗМЕНЕНИЕ: Функция переименована и теперь слушает одинарный клик
  function attachClickHandlers(data) {
    data.forEach((item) => {
      const block = item.questionElement;
      if (!block) return;
      if (item.type !== "multichoice" && item.type !== "truefalse") return;

      // !!! ИЗМЕНЕНИЕ: Обработчик одинарного клика с задержкой
      const clickHandler = (ev) => {
        ev.stopPropagation();
        ev.preventDefault(); // Блокируем стандартное действие клика до выполнения скрипта
        if (!item.shortAnswer) {
          return;
        }

        // 1. Устанавливаем случайную задержку (100 - 350 мс)
        const delay = getRandomDelay(100, 350);
        console.log(`[QuizHelper] Answer activation delayed by ${delay}ms`);

        setTimeout(() => {
          const shortAns = item.shortAnswer.toString().trim();

          const inputs = Array.from(
            block.querySelectorAll(
              "input[type='radio'], input[type='checkbox']"
            )
          );

          const answerLetters = shortAns
            .split(",")
            .map((s) => s.trim().toUpperCase());

          answerLetters.forEach((letter) => {
            const letterCode = letter.charCodeAt(0);
            if (letterCode >= 65 && letterCode <= 90) {
              const index = letterCode - 65;
              if (inputs[index]) {
                inputs[index].checked = true;
                dispatchInputEvents(inputs[index]);
                // --- УДАЛЕНО: animateElement(inputs[index]);
              }
            }
          });
        }, delay); // Задержка применяется здесь
      };

      // Очистка старых dblclick/click обработчиков
      if (block.__clickHandler__) {
        block.removeEventListener("click", block.__clickHandler__);
        delete block.__clickHandler__;
      }
      // Привязываем новый обработчик одинарного клика
      block.addEventListener("click", clickHandler);
      block.__clickHandler__ = clickHandler;

      // Удаляем обработчики наведения, если они были привязаны
      if (block.__mouseoverHandler__) {
        block.removeEventListener("mouseover", block.__mouseoverHandler__);
        block.removeEventListener("mouseout", block.__mouseoutHandler__);
        delete block.__mouseoverHandler__;
        delete block.__mouseoutHandler__;
      }
    });
  }


  async function init() {
    // Очищаем все старые обработчики (бывшие dblclick)
    document
      .querySelectorAll(
        "div[id^='q'], section[data-region='question'], .que, form, .quiz-question"
      )
      .forEach((el) => {
        if (el.__mouseoverHandler__) {
          el.removeEventListener("mouseover", el.__mouseoverHandler__);
          el.removeEventListener("mouseout", el.__mouseoutHandler__);
          delete el.__mouseoverHandler__;
          delete el.__mouseoutHandler__;
        }
        // !!! ИЗМЕНЕНИЕ: чистка старого обработчика
        if (el.__clickHandler__) {
          el.removeEventListener("click", el.__clickHandler__);
          delete el.__clickHandler__;
        }
      });

    questionsDataCache = await parseQuestions();
    // !!! ИЗМЕНЕНИЕ: вызов новой функции
    attachClickHandlers(questionsDataCache);
  }

  if (!window.isKeydownListenerAttached) {
    window.addEventListener("keydown", (e) => {
      if (e.altKey && (e.key === "r" || e.key === "R")) {
        e.preventDefault();
        init();
        return;
      }
    });
    window.isKeydownListenerAttached = true;
  }

  // Оставляем самоуничтожение на dblclick с Shift для безопасности
  const selfDestructListener = (e) => {
    if (e.shiftKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      e.stopPropagation();
      destroyExtension();
      chrome.runtime.sendMessage({ action: "selfDestruct" });
      document.removeEventListener("dblclick", selfDestructListener, true);
    }
  };
  if (!window.isDestroyListenerAttached) {
    document.addEventListener("dblclick", selfDestructListener, true);
    window.isDestroyListenerAttached = true;
  }

  async function startScript() {
    const destroyed = await preInitCheck();
    if (!destroyed) {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
      } else {
        init();
      }
    }
  }

  startScript();
}