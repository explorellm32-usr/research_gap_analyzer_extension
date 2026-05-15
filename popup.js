const SYSTEM_PROMPT = `You are an Advanced Academic Research Gap Analyzer. Your job is to read excerpts of a research paper and synthesize novel problem statements for future research based on methodological limitations. 

You must strictly follow these instructions:

# 1. Reasoning and Self-Checks
Before generating your final output, you must think step-by-step inside a <scratchpad> block. 
- You must label your reasoning types. Use tags like [EXTRACTION], [LOGIC_CRITIQUE], and [SYNTHESIS].
- Self-Check: Inside your scratchpad, you MUST evaluate your generated problem statements. If your generated problem statement is too similar to the original paper's goal, write <correction> and formulate a new one.

# 2. Tool Separation and Conversation Loop
- This is a multi-turn process. Do not guess information you do not have.
- If the provided text is too short to find limitations, you must output exactly: {"status": "REQUIRE_MORE_DATA", "action": "fetch_full_text"} and STOP. Wait for the user to provide the rest of the text before doing your reasoning.
- If the user provides feedback on your problem statements, update your context and regenerate them.

# 3. Error Handling
If the text provided does not appear to be an academic research paper, immediately stop reasoning and output: {"status": "ERROR", "message": "Input text is not a valid research paper."}

# 4. Structured Output Format
Once your reasoning in the <scratchpad> is complete, your final answer MUST be strictly in JSON format. Do not include any markdown outside of the JSON block.

Follow this exact format:
{
  "status": "SUCCESS",
  "paper_core_claim": "1 sentence summary of what they did",
  "logical_gaps_identified": [
    "Gap 1 based on methodology",
    "Gap 2 based on data size or assumptions"
  ],
  "proposed_problem_statements": [
    {
      "title": "New Problem Statement 1",
      "hypothesis": "If [variable] is changed, then [outcome]",
      "mathematical_or_logical_justification": "Why this addresses Gap 1"
    }
  ]
}`;

document.addEventListener('DOMContentLoaded', () => {
  const mainView = document.getElementById('main-view');
  const settingsBtn = document.getElementById('settings-btn');
  const analyzeBtn = document.getElementById('analyze-btn');
  const btnText = document.querySelector('.btn-text');
  const btnLoader = document.querySelector('.btn-loader');

  const statusContainer = document.getElementById('status-container');
  const statusText = document.getElementById('status-text');
  const resultsContainer = document.getElementById('results-container');

  // Navigation
  settingsBtn.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  });

  // Analysis Logic
  analyzeBtn.addEventListener('click', async () => {
    const apiKey = await getApiKey();
    if (!apiKey) {
      showStatus('Please configure your Google Gemini API Key in settings first.', 'error');
      return;
    }

    setLoading(true);
    hideResults();
    showStatus('Extracting page content...', 'info');

    try {
      // 1. Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // 2. Extract content from page
      chrome.tabs.sendMessage(tab.id, { action: "extractContent" }, async (response) => {
        if (chrome.runtime.lastError) {
          showStatus('Error: Could not read page. Make sure you are on a webpage (not a chrome:// page) and try refreshing.', 'error');
          setLoading(false);
          return;
        }

        if (!response || !response.content) {
          showStatus('Could not extract meaningful text from this page.', 'error');
          setLoading(false);
          return;
        }

        showStatus('Analyzing logic and generating problem statements...', 'info');

        // 3. Call Gemini API
        await callLLM(apiKey, response.title, response.content);
      });
    } catch (error) {
      showStatus('An unexpected error occurred: ' + error.message, 'error');
      setLoading(false);
    }
  });

  async function callLLM(apiKey, title, content) {
    const promptText = `Paper Title: ${title}\n\nExcerpt:\n${content}`;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          contents: [{
            parts: [{ text: promptText }]
          }],
          generationConfig: {
            temperature: 0.7
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'API request failed');
      }

      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;

      // We need to parse the JSON output from the LLM. 
      // It might be wrapped in markdown code blocks or have the scratchpad before it.
      parseAndDisplayResults(rawText);

    } catch (error) {
      showStatus('API Error: ' + error.message, 'error');
      setLoading(false);
    }
  }

  function parseAndDisplayResults(rawText) {
    try {
      // Extract just the JSON part, ignoring the <scratchpad>
      let jsonStr = rawText;
      const jsonStart = rawText.indexOf('{');
      const jsonEnd = rawText.lastIndexOf('}');

      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonStr = rawText.substring(jsonStart, jsonEnd + 1);
      }

      const result = JSON.parse(jsonStr);

      if (result.status === "ERROR") {
        showStatus(result.message, 'error');
        setLoading(false);
        return;
      }

      if (result.status === "REQUIRE_MORE_DATA") {
        showStatus("The text extracted from the page was too short for a full analysis.", 'error');
        setLoading(false);
        return;
      }

      // Populate UI
      document.getElementById('res-claim').textContent = result.paper_core_claim;

      const gapsList = document.getElementById('res-gaps');
      gapsList.innerHTML = '';
      result.logical_gaps_identified.forEach(gap => {
        const li = document.createElement('li');
        li.textContent = gap;
        gapsList.appendChild(li);
      });

      const problemsDiv = document.getElementById('res-problems');
      problemsDiv.innerHTML = '';
      result.proposed_problem_statements.forEach(prob => {
        const pDiv = document.createElement('div');
        pDiv.className = 'problem-statement';
        pDiv.innerHTML = `
          <h4>${prob.title}</h4>
          <p><strong>Hypothesis:</strong> ${prob.hypothesis}</p>
          <p class="justification">${prob.mathematical_or_logical_justification}</p>
        `;
        problemsDiv.appendChild(pDiv);
      });

      statusContainer.style.display = 'none';
      resultsContainer.style.display = 'block';

    } catch (e) {
      console.error("Failed to parse LLM response:", rawText);
      showStatus('Failed to parse the results from the AI.', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Utilities
  function getApiKey() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['geminiApiKey'], (result) => {
        resolve(result.geminiApiKey);
      });
    });
  }

  function setLoading(isLoading) {
    analyzeBtn.disabled = isLoading;
    if (isLoading) {
      btnText.textContent = 'Analyzing...';
      btnLoader.style.display = 'inline-block';
      btnLoader.style.marginLeft = '8px';
    } else {
      btnText.textContent = 'Analyze Paper';
      btnLoader.style.display = 'none';
      btnLoader.style.marginLeft = '0';
    }
  }

  function showStatus(message, type) {
    statusContainer.style.display = 'block';
    statusText.textContent = message;
    statusText.style.color = type === 'error' ? 'var(--danger-color)' :
      (type === 'success' ? 'var(--success-color)' : 'var(--text-primary)');
    statusContainer.style.borderColor = type === 'error' ? 'rgba(239, 68, 68, 0.3)' :
      (type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)');
  }

  function hideResults() {
    resultsContainer.style.display = 'none';
  }
});
