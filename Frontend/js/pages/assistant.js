import { ragService } from '../services/ragService.js';
import { showNotification } from '../components/notifications.js';

export function assistantPage() {
  return `
    <section class="assistant-page">
      <div class="assistant-shell">
        <div id="assistant-thread" class="assistant-thread" aria-live="polite">
          <article class="assistant-message assistant-message-bot">
            <div class="assistant-bubble">
              <p>Hi, I can help with product and marketplace questions.</p>
            </div>
          </article>
        </div>

        <form id="assistant-form" class="assistant-form">
          <label for="assistant-question">Ask Bater Assistant</label>
          <div class="assistant-input-row">
            <textarea
              id="assistant-question"
              name="question"
              class="form-control"
              rows="3"
              placeholder="Ask about products, policies, stock, or marketplace help..."
              required
            ></textarea>
            <button type="submit" class="btn btn-primary">Ask</button>
          </div>
        </form>
      </div>
    </section>
  `;
}

export function initAssistantPage() {
  const form = document.getElementById('assistant-form');
  const input = document.getElementById('assistant-question');
  const thread = document.getElementById('assistant-thread');

  if (!form || !input || !thread) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const question = input.value.trim();
    if (!question) {
      showNotification('Please enter a question', 'error');
      return;
    }

    appendMessage(thread, question, 'user');
    input.value = '';

    const pending = appendMessage(thread, 'Thinking...', 'bot', true);
    const button = form.querySelector('button[type="submit"]');
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Asking...';

    try {
      const response = await ragService.ask(question);

      if (!response.success) {
        throw new Error(response.error || 'Assistant request failed');
      }

      pending.replaceWith(buildMessage(response.data?.answer || 'I could not find an answer.', 'bot', response.data?.sources || []));
    } catch (error) {
      pending.replaceWith(buildMessage(error.message || 'Assistant request failed', 'bot'));
      showNotification(error.message || 'Assistant request failed', 'error');
    } finally {
      button.disabled = false;
      button.textContent = originalText;
      thread.scrollTop = thread.scrollHeight;
    }
  });
}

function appendMessage(thread, text, role, pending = false) {
  const node = buildMessage(text, role, [], pending);
  thread.appendChild(node);
  thread.scrollTop = thread.scrollHeight;
  return node;
}

function buildMessage(text, role, sources = [], pending = false) {
  const article = document.createElement('article');
  article.className = `assistant-message assistant-message-${role}${pending ? ' is-pending' : ''}`;

  const sourceList = sources.length
    ? `<div class="assistant-sources">
        <strong>Sources</strong>
        ${sources.map((source) => `
          <span>${escapeHtml(source.source || 'Source')}${source.page ? `, page ${escapeHtml(String(source.page))}` : ''}</span>
        `).join('')}
      </div>`
    : '';

  article.innerHTML = `
    <div class="assistant-bubble">
      <p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>
      ${sourceList}
    </div>
  `;

  return article;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
}