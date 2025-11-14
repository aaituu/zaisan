// popup.js
document.getElementById('start').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'start-offscreen' });
});
document.getElementById('stop').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'stop-offscreen' });
});
