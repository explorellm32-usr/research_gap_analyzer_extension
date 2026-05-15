// This script runs in the context of the web page.
// It tries to extract the title, abstract, and introduction of a research paper.

function extractPaperContent() {
  let title = "";
  let bodyText = "";

  // 1. ArXiv specific extraction
  if (window.location.hostname.includes("arxiv.org")) {
    const titleEl = document.querySelector('h1.title');
    if (titleEl) title = titleEl.innerText.replace('Title:', '').trim();
    
    const abstractEl = document.querySelector('blockquote.abstract');
    if (abstractEl) bodyText += "Abstract:\n" + abstractEl.innerText.replace('Abstract:', '').trim() + "\n\n";
  }

  // 2. Generic title extraction
  if (!title) {
    const h1Elements = document.querySelectorAll('h1');
    if (h1Elements.length > 0) {
      title = h1Elements[0].innerText;
    } else {
      title = document.title;
    }
  }

  // 3. Generic abstract extraction
  if (bodyText.length < 50) {
    const abstractHeaders = Array.from(document.querySelectorAll('h2, h3, div, strong, b')).filter(el => 
      el.innerText.toLowerCase().includes('abstract')
    );
    
    if (abstractHeaders.length > 0) {
      let abstractNode = abstractHeaders[0].nextElementSibling;
      if (abstractNode) {
        bodyText += "Abstract:\n" + abstractNode.innerText + "\n\n";
      } else {
        bodyText += "Abstract:\n" + abstractHeaders[0].parentNode.innerText + "\n\n";
      }
    }
  }

  // 4. Fallback to reading paragraph text if specific sections aren't found
  if (bodyText.length < 200) {
    const paragraphs = document.querySelectorAll('p');
    let pText = "";
    for (let i = 0; i < Math.min(paragraphs.length, 25); i++) {
      pText += paragraphs[i].innerText + "\n";
    }
    bodyText += "Extracted Text:\n" + pText;
  }

  // If we still have almost no text, grab body innerText as absolute last resort
  if (bodyText.length < 200 && document.body) {
    bodyText = document.body.innerText.substring(0, 5000);
  }

  return {
    title: title,
    content: bodyText.substring(0, 15000)
  };
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractContent") {
    const data = extractPaperContent();
    sendResponse(data);
  }
  return true; // Keep channel open for async response if needed
});
