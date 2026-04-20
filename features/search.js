/*
 * ChatGPT Conversation Toolkit - Search
 */

const SEARCH_MARK_CLASS = "chatgpt-toolkit-search-text-match";
const SEARCH_MARK_ACTIVE_CLASS = "chatgpt-toolkit-search-text-active";

const updateSearchUI = () => {
  const searchResult = document.getElementById("chatgpt-toolkit-search-result");
  const prevBtn = document.getElementById("chatgpt-toolkit-search-prev");
  const nextBtn = document.getElementById("chatgpt-toolkit-search-next");

  if (!searchResult || !prevBtn || !nextBtn) {
    return;
  }

  if (state.searchMatches.length === 0) {
    searchResult.textContent = state.searchQuery ? t("search.noMatch") : "";
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

  searchResult.textContent = `${state.currentMatchIndex + 1} / ${state.searchMatches.length}`;
  prevBtn.disabled = state.searchMatches.length <= 1;
  nextBtn.disabled = state.searchMatches.length <= 1;
};

const getSearchMatchNode = (match) => {
  if (match instanceof HTMLElement) {
    return match;
  }
  if (typeof resolveCachedMessageNode === "function") {
    return resolveCachedMessageNode(match);
  }
  return match?.node instanceof HTMLElement && match.node.isConnected ? match.node : null;
};

const getSearchMatchLiveNode = (match) => {
  if (match instanceof HTMLElement) {
    return match;
  }
  return match?.node instanceof HTMLElement && match.node.isConnected ? match.node : null;
};

const getSearchMatchText = (match) => {
  if (match instanceof HTMLElement) {
    return extractMessageText(match);
  }
  return match?.text || "";
};

const clearTextHighlights = () => {
  const marks = document.querySelectorAll(`.${SEARCH_MARK_CLASS}`);
  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) {
      return;
    }
    parent.replaceChild(document.createTextNode(mark.textContent || ""), mark);
    parent.normalize();
  });
};

const shouldSkipHighlightTextNode = (node) => {
  const parent = node?.parentElement;
  if (!parent) {
    return true;
  }

  const tag = parent.tagName;
  if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA" || tag === "BUTTON") {
    return true;
  }

  if (parent.classList?.contains(SEARCH_MARK_CLASS)) {
    return true;
  }

  return Boolean(
    parent.closest(
      [
        "button",
        "textarea",
        "input",
        "select",
        `#${TOOLKIT_ID}`,
        `#${MINIMIZED_ID}`,
        `#${TIMELINE_ID}`,
        `#${PROMPT_MODAL_ID}`,
      ].join(", "),
    ),
  );
};

const injectTextHighlights = (containerNode, query) => {
  if (!query || !(containerNode instanceof HTMLElement)) {
    return;
  }

  const walker = document.createTreeWalker(containerNode, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return shouldSkipHighlightTextNode(node)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes = [];
  let current;
  while ((current = walker.nextNode())) {
    textNodes.push(current);
  }

  const lowerQuery = query.toLowerCase();
  const queryLength = query.length;

  textNodes.forEach((textNode) => {
    const text = textNode.textContent || "";
    const lowerText = text.toLowerCase();
    if (!lowerText.includes(lowerQuery)) {
      return;
    }

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let matchIndex = lowerText.indexOf(lowerQuery, lastIndex);

    while (matchIndex !== -1) {
      if (matchIndex > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, matchIndex)));
      }

      const mark = document.createElement("mark");
      mark.className = SEARCH_MARK_CLASS;
      mark.textContent = text.slice(matchIndex, matchIndex + queryLength);
      fragment.appendChild(mark);

      lastIndex = matchIndex + queryLength;
      matchIndex = lowerText.indexOf(lowerQuery, lastIndex);
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    textNode.parentNode?.replaceChild(fragment, textNode);
  });
};

const updateActiveTextMark = () => {
  document.querySelectorAll(`.${SEARCH_MARK_ACTIVE_CLASS}`).forEach((element) => {
    element.classList.remove(SEARCH_MARK_ACTIVE_CLASS);
  });

  if (state.currentMatchIndex < 0 || state.currentMatchIndex >= state.searchMatches.length) {
    return;
  }

  const node = getSearchMatchNode(state.searchMatches[state.currentMatchIndex]);
  if (!(node instanceof HTMLElement)) {
    return;
  }

  node.querySelectorAll(`.${SEARCH_MARK_CLASS}`).forEach((mark) => {
    mark.classList.add(SEARCH_MARK_ACTIVE_CLASS);
  });
};

const clearSearchHighlight = () => {
  document.querySelectorAll(".chatgpt-toolkit-search-highlight").forEach((element) => {
    element.classList.remove("chatgpt-toolkit-search-highlight");
  });
};

const highlightCurrentMatch = () => {
  clearSearchHighlight();
  if (state.currentMatchIndex >= 0 && state.currentMatchIndex < state.searchMatches.length) {
    const node = getSearchMatchNode(state.searchMatches[state.currentMatchIndex]);
    if (node instanceof HTMLElement) {
      node.classList.add("chatgpt-toolkit-search-highlight");
    }
  }
  updateActiveTextMark();
};

const getSearchSources = () =>
  typeof getCachedMessageEntries === "function" ? getCachedMessageEntries() : getMessageNodes();

const performSearch = (query) => {
  state.searchQuery = query.trim().toLowerCase();
  state.searchMatches = [];
  state.currentMatchIndex = -1;

  clearTextHighlights();
  clearSearchHighlight();

  if (state.isCollapsed) {
    updateStatusByKey("status.searchRestoreFirst", "info");
    updateSearchUI();
    return;
  }

  if (!state.searchQuery) {
    updateSearchUI();
    return;
  }

  getSearchSources().forEach((source) => {
    const text = getSearchMatchText(source).toLowerCase();
    if (!text.includes(state.searchQuery)) {
      return;
    }

    state.searchMatches.push(source);
    const node = getSearchMatchLiveNode(source);
    if (node instanceof HTMLElement) {
      getMessageTextContainers(node).forEach((container) => {
        injectTextHighlights(container, state.searchQuery);
      });
    }
  });

  if (state.searchMatches.length > 0) {
    state.currentMatchIndex = 0;
    highlightCurrentMatch();
    scrollToCurrentMatch();
  }

  updateSearchUI();
};

const scrollToCurrentMatch = () => {
  if (state.currentMatchIndex < 0 || state.currentMatchIndex >= state.searchMatches.length) {
    return;
  }

  const node = getSearchMatchNode(state.searchMatches[state.currentMatchIndex]);
  if (!(node instanceof HTMLElement)) {
    updateStatusByKey("status.searchMatchNotLoaded", "info");
    return;
  }

  const firstMark = node.querySelector(`.${SEARCH_MARK_CLASS}`);
  const scrollTarget = firstMark || node;
  if (typeof scrollElementIntoConversationView === "function") {
    scrollElementIntoConversationView(scrollTarget, { behavior: "smooth", block: "center" });
  } else {
    scrollTarget.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};

const navigateToPrevMatch = () => {
  if (state.isCollapsed) {
    updateStatusByKey("status.searchRestoreFirst", "info");
    return;
  }
  if (state.searchMatches.length === 0) {
    return;
  }

  state.currentMatchIndex =
    (state.currentMatchIndex - 1 + state.searchMatches.length) % state.searchMatches.length;
  highlightCurrentMatch();
  scrollToCurrentMatch();
  updateSearchUI();
};

const navigateToNextMatch = () => {
  if (state.isCollapsed) {
    updateStatusByKey("status.searchRestoreFirst", "info");
    return;
  }
  if (state.searchMatches.length === 0) {
    return;
  }

  state.currentMatchIndex = (state.currentMatchIndex + 1) % state.searchMatches.length;
  highlightCurrentMatch();
  scrollToCurrentMatch();
  updateSearchUI();
};
