/*
 * ChatGPT Conversation Toolkit - DOM utilities
 */
const getConversationKey = () => {
  const domConversationId =
    document
      .querySelector("[data-conversation-id]")
      ?.getAttribute("data-conversation-id") ||
    document
      .querySelector("[data-message-id][data-conversation-id]")
      ?.getAttribute("data-conversation-id");
  if (domConversationId) {
    return domConversationId;
  }

  const match = window.location.pathname.match(/\/c\/([^/]+)/);
  if (match) {
    return match[1];
  }
  return `${window.location.pathname}${window.location.search}`;
};

const MESSAGE_ROLE_SELECTOR = [
  "[data-message-author-role]",
  '[data-testid="user-message"]',
  '[data-testid="assistant-message"]',
  '[data-testid^="user-message"]',
  '[data-testid^="assistant-message"]',
].join(", ");

const MESSAGE_ROOT_SELECTOR = [
  '[data-testid^="conversation-turn-"]',
  "[data-message-id]",
  "article",
  MESSAGE_ROLE_SELECTOR,
].join(", ");

const MESSAGE_CONTENT_SELECTOR = [
  MESSAGE_ROLE_SELECTOR,
  '[data-testid="message-content"]',
  '[data-testid^="message-content"]',
  ".markdown",
  ".whitespace-pre-wrap",
].join(", ");

const getConversationMain = () =>
  document.querySelector("main") || document.querySelector('[role="main"]');

const toUniqueOutermostElements = (elements) => {
  const unique = [];
  elements.forEach((element) => {
    if (!(element instanceof HTMLElement)) {
      return;
    }
    if (unique.some((existing) => existing === element || existing.contains(element))) {
      return;
    }
    for (let index = unique.length - 1; index >= 0; index -= 1) {
      if (element.contains(unique[index])) {
        unique.splice(index, 1);
      }
    }
    unique.push(element);
  });
  return unique;
};

const resetConversationState = () => {
  state.isCollapsed = false;
  state.collapsedNodes = [];
  state.anchorNode = null;
  state.anchorParent = null;
  state.searchQuery = '';
  state.searchMatches = [];
  state.currentMatchIndex = -1;

  if (typeof timelineState !== "undefined" && timelineState) {
    timelineState.items = [];
    timelineState.sourceNodes = [];
    timelineState.sourceSignature = "";
    timelineState.totalUserCount = 0;
    timelineState.activeIndex = -1;
    timelineState.hoverIndex = -1;
    timelineState.signature = "";
    timelineState.contentHeight = 0;
    timelineState.rendered = false;
    timelineState.refreshPending = false;
  }
};

const ensureConversationState = () => {
  const nextKey = getConversationKey();
  const changed = state.conversationKey !== nextKey;
  if (changed) {
    state.conversationKey = nextKey;
    resetConversationState();
  }
  return changed;
};

const normalizeMessageNode = (node) => {
  if (!(node instanceof Element)) {
    return null;
  }
  return (
    node.closest('[data-testid^="conversation-turn-"]') ||
    node.closest("article") ||
    node.closest("[data-message-id]") ||
    (node.matches(MESSAGE_ROLE_SELECTOR) ? node : node.closest(MESSAGE_ROLE_SELECTOR)) ||
    node
  );
};

const getNodeConversationId = (node) =>
  node?.getAttribute("data-conversation-id") ||
  node?.dataset?.conversationId ||
  node?.querySelector("[data-conversation-id]")?.getAttribute("data-conversation-id") ||
  null;

const getMessageNodeKey = (node, index) => {
  const messageId =
    node?.getAttribute?.("data-message-id") ||
    node?.querySelector?.("[data-message-id]")?.getAttribute("data-message-id") ||
    "";
  if (messageId) {
    return `mid:${messageId}`;
  }

  const testId =
    node?.getAttribute?.("data-testid") ||
    node?.querySelector?.('[data-testid^="conversation-turn-"]')?.getAttribute("data-testid") ||
    "";
  if (testId) {
    return `tid:${testId}`;
  }

  return node || `message-${index}`;
};

const getMessageNodes = () => {
  const main = getConversationMain();
  if (!main) {
    return [];
  }

  const candidates = Array.from(main.querySelectorAll(MESSAGE_ROOT_SELECTOR));
  const normalized = candidates
    .map((node) => normalizeMessageNode(node))
    .filter((node) => node instanceof HTMLElement);

  const filteredByConversation = (() => {
    if (!state.conversationKey) {
      return normalized;
    }
    const scoped = normalized.filter((node) => {
      const nodeConversationId = getNodeConversationId(node);
      return !nodeConversationId || nodeConversationId === state.conversationKey;
    });
    return scoped.length > 0 ? scoped : normalized;
  })();

  const uniqueNodes = [];
  const seen = new Set();
  filteredByConversation.forEach((node, index) => {
    const key = getMessageNodeKey(node, index);
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    if (detectRole(node) !== "unknown" || extractMessageText(node)) {
      uniqueNodes.push(node);
    }
  });

  return uniqueNodes;
};

const readRoleFromElement = (element) => {
  if (!(element instanceof Element)) {
    return "";
  }

  const explicitRole =
    element.getAttribute("data-message-author-role") ||
    element.getAttribute("data-author-role") ||
    element.dataset?.messageAuthorRole ||
    "";
  if (explicitRole === "user" || explicitRole === "assistant" || explicitRole === "system") {
    return explicitRole;
  }

  const testId = (element.getAttribute("data-testid") || "").toLowerCase();
  if (testId.includes("user-message") || testId.includes("message-user")) {
    return "user";
  }
  if (testId.includes("assistant-message") || testId.includes("message-assistant")) {
    return "assistant";
  }

  return "";
};

const detectRole = (node) => {
  const directRole = readRoleFromElement(node);
  if (directRole) {
    return directRole;
  }

  const roleNodes = Array.from(node?.querySelectorAll?.(MESSAGE_ROLE_SELECTOR) || []);
  for (const roleNode of roleNodes) {
    const role = readRoleFromElement(roleNode);
    if (role) {
      return role;
    }
  }

  if (node?.querySelector('[data-message-author-role="user"], [data-testid="user-message"], [data-testid^="user-message"]')) {
    return "user";
  }
  if (node?.querySelector('[data-message-author-role="assistant"], [data-testid="assistant-message"], [data-testid^="assistant-message"]')) {
    return "assistant";
  }
  if (node?.querySelector('img[alt*="ChatGPT"], svg[aria-label*="ChatGPT"], svg[aria-label*="Assistant"]')) {
    return "assistant";
  }
  if (node?.querySelector('img[alt*="User"], svg[aria-label*="User"]')) {
    return "user";
  }
  return "unknown";
};

const getMessageTextContainers = (node) => {
  if (!(node instanceof HTMLElement)) {
    return [];
  }

  const roleContainers = toUniqueOutermostElements([
    ...(node.matches(MESSAGE_ROLE_SELECTOR) ? [node] : []),
    ...Array.from(node.querySelectorAll(MESSAGE_ROLE_SELECTOR)),
  ]);
  if (roleContainers.length > 0) {
    return roleContainers;
  }

  const contentContainers = toUniqueOutermostElements([
    ...(node.matches(MESSAGE_CONTENT_SELECTOR) ? [node] : []),
    ...Array.from(node.querySelectorAll(MESSAGE_CONTENT_SELECTOR)),
  ]);
  return contentContainers.length > 0 ? contentContainers : [node];
};

const getElementReadableText = (element) => {
  if (!(element instanceof HTMLElement)) {
    return "";
  }
  const clone = element.cloneNode(true);
  clone
    .querySelectorAll(
      [
        "button",
        "script",
        "style",
        "textarea",
        "input",
        "select",
        `#${TOOLKIT_ID}`,
        `#${MINIMIZED_ID}`,
        `#${TIMELINE_ID}`,
        `#${PROMPT_MODAL_ID}`,
      ].join(", "),
    )
    .forEach((child) => child.remove());
  return (clone.textContent || "").trim();
};

const extractMessageText = (node) => {
  if (!node) return "";
  return getMessageTextContainers(node)
    .map((container) => getElementReadableText(container))
    .filter((text) => text.length > 0)
    .join("\n\n");
};

const getUserMessageNodes = () => getMessageNodes().filter((node) => detectRole(node) === "user");

const isConversationMessageElement = (element) => {
  if (!(element instanceof Element)) {
    return false;
  }
  return Boolean(
    element.matches?.(MESSAGE_ROOT_SELECTOR) ||
    element.closest?.(MESSAGE_ROOT_SELECTOR) ||
    element.querySelector?.(MESSAGE_ROOT_SELECTOR),
  );
};

const buildMessagePayload = (nodes) => {
  const seenIds = new Set();
  return nodes
    .map((node) => {
      const roleNode = node.matches(MESSAGE_ROLE_SELECTOR)
        ? node
        : node.querySelector(MESSAGE_ROLE_SELECTOR) || node;
      const messageId =
        roleNode?.getAttribute("data-message-id") ||
        node.getAttribute("data-message-id") ||
        node.querySelector("[data-message-id]")?.getAttribute("data-message-id");
      if (messageId && seenIds.has(messageId)) {
        return null;
      }
      if (messageId) {
        seenIds.add(messageId);
      }

      const role = detectRole(roleNode);
      const text = extractMessageText(node);

      if (!text) {
        return null;
      }

      return { role, text };
    })
    .filter(Boolean)
    .map((message, index) => ({
      index: index + 1,
      role: message.role,
      text: message.text,
    }));
};

const updateStatus = (message, tone = "info") => {
  const status = document.getElementById(STATUS_ID);
  if (!status) {
    return;
  }
  delete status.dataset.i18nKey;
  delete status.dataset.i18nParams;
  status.textContent = message;
  status.dataset.tone = tone;
};

const updateStatusByKey = (key, tone = "info", params = {}) => {
  const status = document.getElementById(STATUS_ID);
  if (!status) {
    return;
  }
  status.dataset.i18nKey = key;
  status.dataset.i18nParams = JSON.stringify(params);
  status.textContent = t(key, params);
  status.dataset.tone = tone;
};

const refreshStatusLocalization = () => {
  const status = document.getElementById(STATUS_ID);
  if (!status) {
    return;
  }

  const key = status.dataset.i18nKey;
  if (!key) {
    return;
  }

  let params = {};
  try {
    params = status.dataset.i18nParams ? JSON.parse(status.dataset.i18nParams) : {};
  } catch (error) {
    params = {};
  }

  status.textContent = t(key, params);
};

const createRafDragController = (applyPosition) => {
  let frameId = 0;
  let pendingPosition = null;

  const flush = () => {
    frameId = 0;
    if (!pendingPosition) {
      return;
    }
    const nextPosition = pendingPosition;
    pendingPosition = null;
    applyPosition(nextPosition);
  };

  return {
    schedule(position) {
      pendingPosition = position;
      if (frameId) {
        return;
      }
      frameId = requestAnimationFrame(flush);
    },
    flush() {
      if (!pendingPosition) {
        return;
      }
      if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
      const nextPosition = pendingPosition;
      pendingPosition = null;
      applyPosition(nextPosition);
    },
    cancel() {
      if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
      pendingPosition = null;
    },
  };
};

const applyDragTransform = (element, translateX, translateY, baseTransform = "") => {
  if (!(element instanceof HTMLElement)) {
    return;
  }
  const translate = `translate3d(${Math.round(translateX)}px, ${Math.round(translateY)}px, 0)`;
  element.style.transform =
    baseTransform && baseTransform !== "none"
      ? `${baseTransform} ${translate}`
      : translate;
};

const resetDragTransform = (element, baseTransform = "") => {
  if (!(element instanceof HTMLElement)) {
    return;
  }
  element.style.transform = baseTransform && baseTransform !== "none" ? baseTransform : "";
};
