/*
 * ChatGPT Conversation Toolkit - Bootstrap and DOM observers
 */
if (!window[TOOLKIT_BOOTSTRAP_FLAG]) {
  window[TOOLKIT_BOOTSTRAP_FLAG] = true;

  timelineState.visible = loadTimelineVisibility();
  timelineState.manualPosition = loadTimelinePosition();
  state.isMinimized = loadToolbarMinimizedState();
  initI18n();
  observeThemeOnBodyIfNeeded();

  const TOOLKIT_ROUTE_EVENT = "__chatgptConversationToolkitRouteChange";
  const TOOLKIT_ROUTE_HOOK_FLAG = "__chatgptConversationToolkitRouteHooked";
  const OBSERVER_ROOT_SYNC_DELAY_MS = 260;
  const OBSERVER_ROOT_RETRY_LIMIT = 24;

  let resizeListenerAdded = false;
  let collapseMemorySyncTimer = 0;
  let refreshDispatchRafId = 0;
  let refreshNeedsFolder = false;
  let refreshNeedsTimeline = false;
  let refreshNeedsTimelinePosition = false;
  let refreshNeedsCloseFolderMenu = false;
  const isToolkitPageVisible = () =>
    document.visibilityState !== "hidden" && !document.hidden;

  const queueUiRefreshDispatch = ({
    folderRefresh = false,
    timelineRefresh = false,
    timelinePosition = false,
    closeFolderMenu: shouldCloseFolderMenu = false,
  } = {}) => {
    if (folderRefresh) {
      refreshNeedsFolder = true;
    }
    if (timelineRefresh && timelineState.visible) {
      refreshNeedsTimeline = true;
    }
    if (timelinePosition && timelineState.visible) {
      refreshNeedsTimelinePosition = true;
    }
    if (shouldCloseFolderMenu) {
      refreshNeedsCloseFolderMenu = true;
    }

    if (!isToolkitPageVisible()) {
      return;
    }

    if (refreshDispatchRafId) {
      return;
    }

    refreshDispatchRafId = requestAnimationFrame(() => {
      refreshDispatchRafId = 0;
      if (!isToolkitPageVisible()) {
        return;
      }

      const needsFolder = refreshNeedsFolder;
      const needsTimeline = refreshNeedsTimeline;
      const needsTimelinePosition = refreshNeedsTimelinePosition;
      const needsCloseFolderMenu = refreshNeedsCloseFolderMenu;

      refreshNeedsFolder = false;
      refreshNeedsTimeline = false;
      refreshNeedsTimelinePosition = false;
      refreshNeedsCloseFolderMenu = false;

      if (needsCloseFolderMenu) {
        closeFolderMenu();
      }

      if (needsTimelinePosition && timelineState.visible) {
        if (timelineState.pointerDown || timelineState.dragging) {
          timelineState.refreshPending = true;
        } else {
          updateTimelinePosition();
        }
      }

      if (needsFolder) {
        scheduleFolderRefresh();
      }

      if (needsTimeline && timelineState.visible) {
        if (timelineState.pointerDown || timelineState.dragging) {
          timelineState.refreshPending = true;
        } else {
          scheduleTimelineRefresh();
        }
      }
    });
  };

  const setupResizeListener = () => {
    if (resizeListenerAdded) {
      return;
    }
    resizeListenerAdded = true;

    window.addEventListener("resize", () => {
      const btn = document.getElementById(MINIMIZED_ID);
      if (
        btn &&
        btn.classList.contains("is-visible") &&
        !minimizedButtonState.pointerDown &&
        !minimizedButtonState.dragging
      ) {
        ensureButtonVisible(btn);
      }
      queueUiRefreshDispatch({
        timelinePosition: true,
        timelineRefresh: true,
        closeFolderMenu: true,
        folderRefresh: true,
      });
    });
  };

  setupThemeSync();
  initFolders();
  initCollapseMemory();
  attachToolbar();
  initLatexCopy();
  syncCollapseMemoryForCurrentConversation({ triggerAuto: true, forceAuto: true });
  renderTimeline();
  setupResizeListener();

  let observerRafId = 0;
  let observerRootSyncTimer = 0;
  let conversationObserver = null;
  let sidebarObserver = null;
  let observedConversationRoot = null;
  let observedSidebarRoot = null;
  let observerNeedsPresenceCheck = false;
  let observerNeedsConversationSync = false;
  let observerNeedsTimelineRefresh = false;
  let observerNeedsFolderRefresh = false;

  const getObservedElement = (node) => {
    if (node instanceof Element) {
      return node;
    }
    if (node instanceof Text) {
      return node.parentElement;
    }
    return null;
  };

  const isToolkitMutationNode = (node) => {
    const element = getObservedElement(node);
    if (!(element instanceof Element)) {
      return false;
    }
    return Boolean(
      element.closest(
        [
          `#${TOOLKIT_ID}`,
          `#${MINIMIZED_ID}`,
          `#${TIMELINE_ID}`,
          `#${PROMPT_MODAL_ID}`,
          `#${FOLDER_MANAGER_ID}`,
          `#${FOLDER_MENU_ID}`,
        ].join(", "),
      ),
    );
  };

  const hasRelevantNonToolkitMutation = (mutations) =>
    mutations.some((mutation) => {
      if (!isToolkitMutationNode(mutation.target)) {
        return true;
      }
      return (
        Array.from(mutation.addedNodes).some((node) => !isToolkitMutationNode(node)) ||
        Array.from(mutation.removedNodes).some((node) => !isToolkitMutationNode(node))
      );
    });

  const queueObserverCallback = () => {
    if (!isToolkitPageVisible()) {
      return;
    }
    if (observerRafId) {
      return;
    }
    observerRafId = requestAnimationFrame(() => {
      observerRafId = 0;
      if (!isToolkitPageVisible()) {
        return;
      }

      const needsPresenceCheck = observerNeedsPresenceCheck;
      const needsConversationSync = observerNeedsConversationSync;
      const needsTimelineRefresh = observerNeedsTimelineRefresh;
      const needsFolderRefresh = observerNeedsFolderRefresh;

      observerNeedsPresenceCheck = false;
      observerNeedsConversationSync = false;
      observerNeedsTimelineRefresh = false;
      observerNeedsFolderRefresh = false;

      if (needsPresenceCheck) {
        const toolbar = document.getElementById(TOOLKIT_ID);
        const minimizedButton = document.getElementById(MINIMIZED_ID);
        const timeline = document.getElementById(TIMELINE_ID);
        const promptModal = document.getElementById(PROMPT_MODAL_ID);

        if (!toolbar) {
          attachToolbar();
        }

        if (!minimizedButton) {
          ensureMinimizedButton();
        }

        if (timelineState.visible) {
          if (!timeline) {
            renderTimeline();
          }
        } else if (timeline) {
          destroyTimeline();
        }

        if (promptState.isOpen && !promptModal) {
          const restoredModal = ensurePromptModal();
          if (restoredModal) {
            restoredModal.classList.add("is-visible");
            renderPromptList();
          }
        }

        observeThemeOnBodyIfNeeded();
      }

      if (needsConversationSync) {
        if (!collapseMemorySyncTimer) {
          collapseMemorySyncTimer = setTimeout(() => {
            collapseMemorySyncTimer = 0;
            syncCollapseMemoryForCurrentConversation({ triggerAuto: true });
          }, 220);
        }
      }
      queueUiRefreshDispatch({
        folderRefresh: needsFolderRefresh,
        timelineRefresh: needsTimelineRefresh,
      });
    });
  };

  const markObserverWork = ({
    presenceCheck = false,
    conversationSync = false,
    timelineRefresh = false,
    folderRefresh = false,
  } = {}) => {
    if (presenceCheck) {
      observerNeedsPresenceCheck = true;
    }
    if (conversationSync) {
      observerNeedsConversationSync = true;
    }
    if (timelineRefresh && timelineState.visible) {
      observerNeedsTimelineRefresh = true;
    }
    if (folderRefresh) {
      observerNeedsFolderRefresh = true;
    }
    queueObserverCallback();
  };

  const getConversationMessageNodes = () =>
    Array.from(document.querySelectorAll('main [data-message-author-role]')).filter(
      (node) => node instanceof HTMLElement,
    );

  const resolveConversationObserverRoot = () => {
    const scrollRoot = document.querySelector("[data-scroll-root]");
    const messageNodes = getConversationMessageNodes();
    const firstMessage = messageNodes[0];
    const lastMessage = messageNodes[messageNodes.length - 1];

    if (firstMessage instanceof HTMLElement && lastMessage instanceof HTMLElement) {
      let container = firstMessage;
      while (container instanceof HTMLElement && !container.contains(lastMessage)) {
        container = container.parentElement;
      }

      if (container instanceof HTMLElement) {
        if (
          container.matches('[data-message-author-role]') &&
          container.parentElement instanceof HTMLElement
        ) {
          container = container.parentElement;
        }

        if (container !== document.body && container !== document.documentElement) {
          return container;
        }
      }
    }

    if (firstMessage instanceof HTMLElement) {
      const parent = firstMessage.parentElement;
      if (parent instanceof HTMLElement && parent !== document.body) {
        return parent;
      }
      return firstMessage;
    }

    if (scrollRoot instanceof HTMLElement) {
      const mainInsideRoot = scrollRoot.querySelector("main");
      return mainInsideRoot instanceof HTMLElement ? mainInsideRoot : scrollRoot;
    }

    return document.querySelector("main");
  };

  const resolveSidebarObserverRoot = () => {
    const history = document.querySelector("#history");
    if (history instanceof HTMLElement) {
      const navRoot = history.closest("nav[aria-label]");
      return navRoot instanceof HTMLElement ? navRoot : history;
    }

    const sidebarStage = document.getElementById("stage-slideover-sidebar");
    if (sidebarStage instanceof HTMLElement) {
      return sidebarStage;
    }

    return document.querySelector(
      'nav[aria-label], aside, [id*="sidebar"], [data-testid*="sidebar"], [class*="sidebar"]',
    );
  };

  const disconnectConversationObserver = () => {
    if (conversationObserver) {
      conversationObserver.disconnect();
      conversationObserver = null;
    }
    observedConversationRoot = null;
  };

  const disconnectSidebarObserver = () => {
    if (sidebarObserver) {
      sidebarObserver.disconnect();
      sidebarObserver = null;
    }
    observedSidebarRoot = null;
  };

  const pauseScopedObserversForHidden = () => {
    if (observerRootSyncTimer) {
      clearTimeout(observerRootSyncTimer);
      observerRootSyncTimer = 0;
    }
    if (observerRafId) {
      cancelAnimationFrame(observerRafId);
      observerRafId = 0;
    }
    disconnectConversationObserver();
    disconnectSidebarObserver();
  };

  const getConversationMutationElements = (mutation) => {
    const elements = [];
    const targetElement = getObservedElement(mutation?.target);
    if (targetElement instanceof Element) {
      elements.push(targetElement);
    }

    mutation?.addedNodes?.forEach((node) => {
      const element = getObservedElement(node);
      if (element instanceof Element) {
        elements.push(element);
      }
    });

    mutation?.removedNodes?.forEach((node) => {
      const element = getObservedElement(node);
      if (element instanceof Element) {
        elements.push(element);
      }
    });

    return elements;
  };

  const mutationTouchesUserMessage = (mutation) =>
    getConversationMutationElements(mutation).some((element) =>
      Boolean(
        element.matches?.('[data-message-author-role="user"]') ||
        element.closest?.('[data-message-author-role="user"]') ||
        element.querySelector?.('[data-message-author-role="user"]'),
      ),
    );

  const handleConversationMutations = (mutations) => {
    if (!isToolkitPageVisible()) {
      return;
    }
    if (window.__toolkitIsRendering || !hasRelevantNonToolkitMutation(mutations)) {
      return;
    }

    if (!mutations.some((mutation) => mutationTouchesUserMessage(mutation))) {
      return;
    }

    markObserverWork({
      conversationSync: true,
      timelineRefresh: true,
    });
  };

  const getSidebarMutationElements = (mutation) => {
    const elements = [];
    const targetElement = getObservedElement(mutation?.target);
    if (targetElement instanceof Element) {
      elements.push(targetElement);
    }

    mutation?.addedNodes?.forEach((node) => {
      const element = getObservedElement(node);
      if (element instanceof Element) {
        elements.push(element);
      }
    });

    mutation?.removedNodes?.forEach((node) => {
      const element = getObservedElement(node);
      if (element instanceof Element) {
        elements.push(element);
      }
    });

    return elements;
  };

  const hasConversationNodeSignature = (element) =>
    Boolean(
      element.matches?.('a[data-sidebar-item="true"][href*="/c/"]') ||
      element.querySelector?.('a[data-sidebar-item="true"][href*="/c/"]') ||
      element.matches?.("[data-conversation-options-trigger]") ||
      element.querySelector?.("[data-conversation-options-trigger]"),
    );

  const hasChatSectionSignature = (element) =>
    Boolean(
      element.id === "history" ||
      element.closest?.("#history") ||
      element.matches?.(".group\\/sidebar-expando-section") ||
      element.closest?.(".group\\/sidebar-expando-section") ||
      element.matches?.("h2.__menu-label") ||
      element.querySelector?.("h2.__menu-label"),
    );

  const mutationTouchesFolderSidebarArea = (mutation) =>
    getSidebarMutationElements(mutation).some(
      (element) => hasConversationNodeSignature(element) || hasChatSectionSignature(element),
    );

  const handleSidebarMutations = (mutations) => {
    if (!isToolkitPageVisible()) {
      return;
    }
    if (window.__toolkitIsRendering || !hasRelevantNonToolkitMutation(mutations)) {
      return;
    }
    if (!mutations.some((mutation) => mutationTouchesFolderSidebarArea(mutation))) {
      return;
    }
    markObserverWork({
      folderRefresh: true,
    });
  };

  const syncScopedObservers = ({ forcePresenceCheck = false, retriesRemaining = 0 } = {}) => {
    if (!isToolkitPageVisible()) {
      pauseScopedObserversForHidden();
      return;
    }

    if (observerRootSyncTimer) {
      clearTimeout(observerRootSyncTimer);
      observerRootSyncTimer = 0;
    }

    const nextConversationRoot = resolveConversationObserverRoot();
    const nextSidebarRoot = resolveSidebarObserverRoot();
    const conversationRootChanged = observedConversationRoot !== nextConversationRoot;
    const sidebarRootChanged = observedSidebarRoot !== nextSidebarRoot;

    if (conversationRootChanged) {
      disconnectConversationObserver();
      if (nextConversationRoot instanceof HTMLElement) {
        conversationObserver = new MutationObserver(handleConversationMutations);
        conversationObserver.observe(nextConversationRoot, {
          childList: true,
          subtree: true,
        });
        observedConversationRoot = nextConversationRoot;
      }
    }

    if (sidebarRootChanged) {
      disconnectSidebarObserver();
      if (nextSidebarRoot instanceof HTMLElement) {
        sidebarObserver = new MutationObserver(handleSidebarMutations);
        sidebarObserver.observe(nextSidebarRoot, {
          childList: true,
          subtree: true,
        });
        observedSidebarRoot = nextSidebarRoot;
      }
    }

    if (forcePresenceCheck || conversationRootChanged || sidebarRootChanged) {
      markObserverWork({
        presenceCheck: true,
        conversationSync: forcePresenceCheck || conversationRootChanged,
        timelineRefresh: forcePresenceCheck || conversationRootChanged,
        folderRefresh: forcePresenceCheck || sidebarRootChanged,
      });
    }

    const missingRoot =
      !(nextConversationRoot instanceof HTMLElement) ||
      !(nextSidebarRoot instanceof HTMLElement);

    if (!missingRoot || retriesRemaining <= 0) {
      return;
    }

    observerRootSyncTimer = setTimeout(() => {
      observerRootSyncTimer = 0;
      syncScopedObservers({
        forcePresenceCheck: true,
        retriesRemaining: retriesRemaining - 1,
      });
    }, OBSERVER_ROOT_SYNC_DELAY_MS);
  };

  const installRouteChangeHooks = () => {
    if (window[TOOLKIT_ROUTE_HOOK_FLAG]) {
      return;
    }
    window[TOOLKIT_ROUTE_HOOK_FLAG] = true;

    const emitRouteChange = () => {
      window.dispatchEvent(new Event(TOOLKIT_ROUTE_EVENT));
    };

    const patchHistoryMethod = (methodName) => {
      const originalMethod = history[methodName];
      if (typeof originalMethod !== "function") {
        return;
      }
      history[methodName] = function patchedHistoryMethod(...args) {
        const result = originalMethod.apply(this, args);
        emitRouteChange();
        return result;
      };
    };

    patchHistoryMethod("pushState");
    patchHistoryMethod("replaceState");

    window.addEventListener("popstate", emitRouteChange, { passive: true });
    window.addEventListener("hashchange", emitRouteChange, { passive: true });

    window.addEventListener(TOOLKIT_ROUTE_EVENT, () => {
      syncScopedObservers({
        forcePresenceCheck: true,
        retriesRemaining: OBSERVER_ROOT_RETRY_LIMIT,
      });
    });

    window.addEventListener("focus", () => {
      syncScopedObservers({
        forcePresenceCheck: true,
        retriesRemaining: 4,
      });
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        pauseScopedObserversForHidden();
        if (typeof setTimelineScrollListenerEnabled === "function") {
          setTimelineScrollListenerEnabled(false);
        }
        if (typeof clearTimelineRefreshTimer === "function") {
          clearTimelineRefreshTimer();
        }
        return;
      }

      syncScopedObservers({
        forcePresenceCheck: true,
        retriesRemaining: 4,
      });
      queueObserverCallback();
      queueUiRefreshDispatch({
        timelinePosition: true,
        timelineRefresh: true,
        closeFolderMenu: true,
        folderRefresh: true,
      });
    });
  };

  installRouteChangeHooks();
  syncScopedObservers({
    forcePresenceCheck: true,
    retriesRemaining: OBSERVER_ROOT_RETRY_LIMIT,
  });
}
