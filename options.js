document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('api-key');
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  const statusMsg = document.getElementById('status-msg');

  // Load saved API key
  chrome.storage.sync.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
    }
  });

  saveSettingsBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    chrome.storage.sync.set({ geminiApiKey: key }, () => {
      statusMsg.textContent = 'Settings saved successfully!';
      statusMsg.className = 'status-msg success';
      setTimeout(() => {
        statusMsg.className = 'status-msg';
      }, 3000);
    });
  });
});
