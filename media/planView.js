// Cursor Plan View — Webview Script
// Inline editing for all plan fields. Markdown body uses contenteditable
// with invisible HTML-to-markdown conversion on save.
(function () {
  const vscode = acquireVsCodeApi();

  // ── Scroll position preservation ──────────────────────────────────
  // Restore scroll position after full HTML replacement (checkbox toggle,
  // add/delete task, undo/redo). vscode.getState() survives re-renders.
  const previousState = vscode.getState();
  if (previousState?.scrollTop) {
    document.documentElement.scrollTop = previousState.scrollTop;
  }
  window.addEventListener('scroll', () => {
    vscode.setState({ scrollTop: document.documentElement.scrollTop });
  });

  // ── Copy code block buttons ────────────────────────────────────────
  document.querySelectorAll('.code-copy-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const wrapper = btn.closest('.code-block-wrapper');
      const code = wrapper?.querySelector('code');
      if (!code) { return; }
      navigator.clipboard.writeText(code.textContent || '');
      btn.textContent = '\u2713';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerHTML = btn.dataset.icon;
        btn.classList.remove('copied');
      }, 1500);
    });
    // Store the original SVG for restoration after "copied" feedback
    btn.dataset.icon = btn.innerHTML;
  });

  // ── Delete task buttons ────────────────────────────────────────────
  document.querySelectorAll('.todo-delete-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const todoId = btn.closest('.todo-item')?.dataset.todoId;
      if (todoId) { vscode.postMessage({ type: 'deleteTodo', todoId }); }
    });
  });

  // ── Add new task button ────────────────────────────────────────────
  const addBtn = document.querySelector('.add-todo-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      vscode.postMessage({ type: 'addTodo' });
    });
  }

  // ── Status badge cycling (pending → in-progress → completed) ──────
  const statusCycle = ['pending', 'in-progress', 'completed'];

  document.querySelectorAll('.todo-status-badge').forEach((badge) => {
    badge.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const todoItem = badge.closest('.todo-item');
      const todoId = todoItem?.dataset.todoId;
      if (!todoId) { return; }
      const currentStatus = badge.dataset.status || 'pending';
      const currentIdx = statusCycle.indexOf(currentStatus);
      const nextStatus = statusCycle[(currentIdx + 1) % statusCycle.length];
      vscode.postMessage({ type: 'toggleTodo', todoId, newStatus: nextStatus });
    });
  });

  // ── Keyboard shortcuts ────────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    // Don't fire shortcuts while editing text fields
    const active = document.activeElement;
    if (active?.getAttribute('contenteditable') === 'true') { return; }
    if (active?.tagName === 'TEXTAREA') { return; }
    if (active === searchInput) { return; }

    // Ctrl/Cmd+F → open search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      openSearch();
      return;
    }

    // Enter → add new task (only when input is not an <input>)
    if (active?.tagName === 'INPUT') { return; }
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      vscode.postMessage({ type: 'addTodo' });
    }
  });

  // ── Status filter ──────────────────────────────────────────────────
  document.querySelectorAll('.todo-filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const container = btn.closest('.plan-todos');
      if (!container) { return; }
      container.dataset.filter = btn.dataset.filterValue;
      container.querySelectorAll('.todo-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // ── Drag-and-drop todo reordering ──────────────────────────────────
  let draggedItem = null;

  document.querySelectorAll('.todo-item[draggable]').forEach((item) => {
    item.addEventListener('dragstart', (e) => {
      draggedItem = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      document.querySelectorAll('.todo-item.drag-over').forEach(el => el.classList.remove('drag-over'));
      draggedItem = null;

      // Collect the new order and send to extension
      const orderedIds = [...document.querySelectorAll('.todo-item[data-todo-id]')]
        .map(el => el.dataset.todoId)
        .filter(Boolean);
      vscode.postMessage({ type: 'reorderTodos', orderedIds });
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (draggedItem && item !== draggedItem) {
        item.classList.add('drag-over');
      }
    });

    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over');
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      item.classList.remove('drag-over');
      if (!draggedItem || item === draggedItem) { return; }

      // Insert the dragged item before or after the drop target
      const todosContainer = item.parentElement;
      const items = [...todosContainer.querySelectorAll('.todo-item')];
      const dragIdx = items.indexOf(draggedItem);
      const dropIdx = items.indexOf(item);

      if (dragIdx < dropIdx) {
        item.after(draggedItem);
      } else {
        item.before(draggedItem);
      }
    });
  });

  // ── Checkbox toggles ──────────────────────────────────────────────
  document.querySelectorAll('.todo-checkbox').forEach((checkbox) => {
    checkbox.addEventListener('change', (e) => {
      const todoId = e.target.closest('.todo-item')?.dataset.todoId;
      if (!todoId) { return; }
      vscode.postMessage({
        type: 'toggleTodo', todoId,
        newStatus: e.target.checked ? 'completed' : 'pending',
      });
    });
  });

  // ── Inline field editor (title, overview, todo content) ───────────
  function makeFieldEditable(el, onCommit) {
    if (el.classList.contains('editing')) { return; }
    const original = el.textContent;
    el.setAttribute('contenteditable', 'true');
    el.classList.add('editing');
    el.focus();

    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = globalThis.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    function commit() {
      const newText = el.textContent.trim();
      el.classList.remove('editing');
      if (newText && newText !== original) { onCommit(newText); }
    }
    function cancel() {
      el.textContent = original;
      el.classList.remove('editing');
    }

    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); el.removeEventListener('blur', commit); commit(); }
      else if (e.key === 'Escape') { el.removeEventListener('blur', commit); cancel(); }
    });
    el.addEventListener('blur', commit, { once: true });
  }

  document.querySelectorAll('.editable-field').forEach((el) => {
    el.addEventListener('click', () => {
      makeFieldEditable(el, (newValue) => {
        vscode.postMessage({ type: 'editFrontmatterField', field: el.dataset.field, newValue });
      });
    });
  });

  document.querySelectorAll('.todo-content').forEach((span) => {
    span.addEventListener('click', (e) => {
      if (e.target.closest('.todo-checkbox')) { return; }
      makeFieldEditable(span, (newContent) => {
        const todoId = span.closest('.todo-item')?.dataset.todoId;
        if (todoId) { vscode.postMessage({ type: 'editTodoContent', todoId, newContent }); }
      });
    });
  });

  // ── Markdown body: always editable, save on blur ──────────────────
  const body = document.querySelector('.plan-body');
  if (body) {
    let originalMd = htmlToMarkdown(body).trim();

    // Markdown task list checkboxes: browser swallows clicks inside
    // contenteditable, so we toggle them manually.
    body.addEventListener('click', (e) => {
      const checkbox = e.target.closest('li > input[type="checkbox"]');
      if (checkbox) {
        e.preventDefault();
        checkbox.checked = !checkbox.checked;
      }
    });

    body.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        commitBody();
      }
    });

    body.addEventListener('blur', () => commitBody());

    function commitBody() {
      const md = htmlToMarkdown(body).trim();
      if (md !== originalMd) {
        originalMd = md;
        vscode.postMessage({ type: 'editMarkdownBody', newBody: '\n' + md + '\n' });
      }
    }
  }

  // ── HTML-to-Markdown converter ────────────────────────────────────
  // Recursive tree walker that converts contenteditable HTML back to
  // markdown source. Handles the common elements found in plan files.

  function htmlToMarkdown(container) {
    let md = '';
    for (const node of container.childNodes) {
      md += nodeToMd(node);
    }
    // Collapse triple+ newlines to double
    return md.replaceAll(/\n{3,}/g, '\n\n');
  }

  function nodeToMd(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) { return ''; }

    const tag = node.tagName.toLowerCase();
    const kids = childrenToMd(node);

    switch (tag) {
      case 'h1': return '# ' + kids.trim() + '\n\n';
      case 'h2': return '## ' + kids.trim() + '\n\n';
      case 'h3': return '### ' + kids.trim() + '\n\n';
      case 'h4': return '#### ' + kids.trim() + '\n\n';
      case 'h5': return '##### ' + kids.trim() + '\n\n';
      case 'h6': return '###### ' + kids.trim() + '\n\n';
      case 'p': return kids + '\n\n';
      case 'strong': case 'b': return '**' + kids + '**';
      case 'em': case 'i': return '*' + kids + '*';
      case 'del': case 's': return '~~' + kids + '~~';
      case 'code':
        if (node.parentElement?.tagName === 'PRE') { return node.textContent; }
        return '`' + node.textContent + '`';
      case 'pre': {
        const codeEl = node.querySelector('code');
        const lang = codeEl?.className.match(/language-(\w+)/)?.[1] || '';
        const code = codeEl ? codeEl.textContent : node.textContent;
        return '```' + lang + '\n' + code + '\n```\n\n';
      }
      case 'blockquote':
        return kids.trim().split('\n').map((l) => '> ' + l).join('\n') + '\n\n';
      case 'ul': return listToMd(node, false) + '\n';
      case 'ol': return listToMd(node, true) + '\n';
      case 'li': return kids;
      case 'a': return '[' + kids + '](' + (node.getAttribute('href') || '') + ')';
      case 'hr': return '---\n\n';
      case 'br': return '\n';
      case 'table': return tableToMd(node) + '\n';
      case 'img': return '![' + (node.alt || '') + '](' + (node.src || '') + ')';
      case 'div': return kids + '\n';
      default: return kids;
    }
  }

  function childrenToMd(el) {
    let md = '';
    for (const child of el.childNodes) { md += nodeToMd(child); }
    return md;
  }

  function listToMd(listEl, ordered) {
    let md = '';
    let i = 1;
    for (const li of listEl.children) {
      if (li.tagName !== 'LI') { continue; }
      const prefix = ordered ? i + '. ' : '- ';
      const checkbox = li.querySelector('input[type="checkbox"]');
      let content;
      if (checkbox) {
        const checked = checkbox.checked ? 'x' : ' ';
        const clone = li.cloneNode(true);
        clone.querySelector('input[type="checkbox"]')?.remove();
        content = '[' + checked + '] ' + childrenToMd(clone).trim();
      } else {
        content = childrenToMd(li).trim();
      }
      md += prefix + content + '\n';
      i++;
    }
    return md;
  }

  function tableToMd(table) {
    const rows = table.querySelectorAll('tr');
    if (rows.length === 0) { return ''; }
    let md = '';
    rows.forEach((row, i) => {
      const cells = row.querySelectorAll('th, td');
      const texts = Array.from(cells).map((c) => c.textContent.trim());
      md += '| ' + texts.join(' | ') + ' |\n';
      if (i === 0) {
        md += '| ' + texts.map(() => '---').join(' | ') + ' |\n';
      }
    });
    return md;
  }
  // ── In-webview search (Ctrl/Cmd+F) ───────────────────────────────
  const searchBar = document.getElementById('planSearchBar');
  const searchInput = document.getElementById('planSearchInput');
  const searchCount = document.getElementById('planSearchCount');
  const searchClose = document.getElementById('planSearchClose');

  function openSearch() {
    searchBar.hidden = false;
    searchInput.focus();
    searchInput.select();
  }

  function closeSearch() {
    searchBar.hidden = true;
    clearHighlights();
    searchCount.textContent = '';
    searchInput.value = '';
  }

  function clearHighlights() {
    document.querySelectorAll('.search-match').forEach(el => {
      el.outerHTML = el.textContent;
    });
    document.querySelectorAll('.todo-item').forEach(el => {
      el.classList.remove('search-hidden');
    });
  }

  function runSearch(query) {
    clearHighlights();
    if (!query) { searchCount.textContent = ''; return; }

    const escapedQuery = query.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    let matchCount = 0;

    // Replace text inside an element with highlighted markup, return match count.
    function highlightElement(el) {
      const text = el.textContent || '';
      const matches = [...text.matchAll(regex)];
      if (matches.length > 0) {
        el.innerHTML = text.replaceAll(regex, '<mark class="search-match">$1</mark>');
      }
      return matches.length;
    }

    // Highlight in todo content spans
    document.querySelectorAll('.todo-item').forEach(item => {
      const contentSpan = item.querySelector('.todo-content');
      if (!contentSpan) { return; }
      const hits = highlightElement(contentSpan);
      if (hits > 0) {
        matchCount += hits;
        item.classList.remove('search-hidden');
      } else {
        item.classList.add('search-hidden');
      }
    });

    // Highlight in markdown body text nodes
    const body = document.querySelector('.plan-body');
    if (body) {
      const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      let node;
      while ((node = walker.nextNode())) { textNodes.push(node); }

      for (const tn of textNodes) {
        const text = tn.textContent || '';
        const matches = [...text.matchAll(regex)];
        if (matches.length > 0) {
          matchCount += matches.length;
          const span = document.createElement('span');
          span.innerHTML = text.replaceAll(regex, '<mark class="search-match">$1</mark>');
          tn.parentNode.replaceChild(span, tn);
        }
      }
    }

    const suffix = matchCount === 1 ? 'match' : 'matches';
    searchCount.textContent = matchCount > 0 ? `${matchCount} ${suffix}` : 'No matches';

    // Scroll first match into view
    const first = document.querySelector('.search-match');
    if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }

  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => runSearch(searchInput.value.trim()), 120);
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeSearch(); }
    });
  }

  if (searchClose) {
    searchClose.addEventListener('click', closeSearch);
  }

  // ── Export ────────────────────────────────────────────────────────
  // The extension host posts 'requestExport' via webview.postMessage();
  // the webview replies with the full HTML snapshot for the host to write.
  globalThis.addEventListener('message', (event) => {
    if (event.origin && event.origin !== window.origin) { return; }
    const msg = event.data;
    if (msg?.type === 'requestExport') {
      vscode.postMessage({
        type: 'exportReady',
        format: msg.format,
        title: document.title,
        html: document.documentElement.outerHTML,
      });
    }
  });

})();
