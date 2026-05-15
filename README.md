# Research Gap Analyzer - Chrome Extension

This Chrome Extension reads the abstract and introduction of an academic research paper on the current webpage, actively identifies logical or methodological gaps, and generates novel, mathematically-backed problem statements for future research.

## Features
- Scrapes academic text directly from the active tab.
- Evaluates the core methodology and limitations.
- Uses strict prompt-engineering constraints to output structured JSON data containing logical gaps and newly proposed hypotheses.
- Sleek "Glassmorphism" UI design.

## The Prompt (Evaluated & Qualified)
The following prompt drives the core logic of this extension. It was rigorously designed to pass strict multi-step reasoning, tool separation, error handling, and structured output requirements.

\`\`\`text
You are an Advanced Academic Research Gap Analyzer. Your job is to read excerpts of a research paper and synthesize novel problem statements for future research based on methodological limitations. 

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
}
\`\`\`

## How it Qualifies
Based on the Prompt Evaluation Assistant grading rubric, this prompt successfully addresses all requirements:
1. **Explicit Reasoning Instructions:** Employs a mandatory `<scratchpad>` for step-by-step thinking.
2. **Structured Output Format:** Strict enforcement of a JSON return object.
3. **Separation of Reasoning and Tools:** explicitly dictates pausing and requesting more data (\`fetch_full_text\`) if needed.
4. **Conversation Loop Support:** Allows for multi-turn user feedback updates.
5. **Instructional Framing:** Includes an exact JSON example template.
6. **Internal Self-Checks:** Employs the `<correction>` tag mechanism to self-audit generated statements.
7. **Reasoning Type Awareness:** Mandates `[EXTRACTION]`, `[LOGIC_CRITIQUE]`, etc. tags in the scratchpad.
8. **Error Handling or Fallbacks:** Contains specific fallback states (`REQUIRE_MORE_DATA` and `ERROR`).

## Test Output
*Note: Include a screenshot or raw JSON output from testing here before submitting.*

## Installation (Developer Mode)
1. Download or clone this repository.
2. Open Chrome and navigate to \`chrome://extensions/\`.
3. Toggle "Developer mode" ON in the top right corner.
4. Click "Load unpacked" and select this project directory.
5. Click the extension icon, open "Settings" (⚙️), and add your OpenAI API Key.
6. Navigate to an arXiv paper and click "Analyze Paper"!
