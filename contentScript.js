/*
 * ChatGPT Conversation Toolkit - Bootstrap and DOM observers
 */
if (!window[TOOLKIT_BOOTSTRAP_FLAG]) {
  window[TOOLKIT_BOOTSTRAP_FLAG] = true;

  timelineState.visible = loadTimelineVisibility();
  timelineState.manualPosition = loadTimelinePosition();
  initI18n();
  observeThemeOnBodyIfNeeded();

  let resizeListenerAdded = false;

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
      if (timelineState.pointerDown || timelineState.dragging) {
        timelineState.refreshPending = true;
      } else {
        updateTimelinePosition();
        scheduleTimelineRefresh();
      }
      closeFolderMenu();
      scheduleFolderRefresh();
    });
  };

  setupThemeSync();
  initFolders();
  initCollapseMemory();
  attachToolbar();
  syncCollapseMemoryForCurrentConversation({ triggerAuto: true, forceAuto: true });
  renderTimeline();
  setupResizeListener();

  let observerRafId = 0;
  let observerNeedsPresenceCheck = false;
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

  const isConversationMutationNode = (node) => {
    const element = getObservedElement(node);
    return element instanceof Element && Boolean(element.closest("main"));
  };

  const isSidebarMutationNode = (node) => {
    const element = getObservedElement(node);
    if (!(element instanceof Element)) {
      return false;
    }
    if (element.id === "history") {
      return true;
    }
    return Boolean(
      element.closest('#history, nav[aria-label], aside, [data-testid*="sidebar"], [class*="sidebar"]'),
    );
  };

  const markObserverWorkFromNode = (node) => {
    if (isToolkitMutationNode(node)) {
      return;
    }

    observerNeedsPresenceCheck = true;

    if (isConversationMutationNode(node)) {
      observerNeedsTimelineRefresh = true;
    }

    if (isSidebarMutationNode(node)) {
      observerNeedsFolderRefresh = true;
    }
  };

  const observerCallback = () => {
    const needsPresenceCheck = observerNeedsPresenceCheck;
    const needsTimelineRefresh = observerNeedsTimelineRefresh;
    const needsFolderRefresh = observerNeedsFolderRefresh;

    observerNeedsPresenceCheck = false;
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

      if (!timeline) {
        ensureTimeline();
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

    if (needsPresenceCheck || needsTimelineRefresh) {
      syncCollapseMemoryForCurrentConversation({ triggerAuto: true });
    }

    if (needsFolderRefresh) {
      scheduleFolderRefresh();
    }

    if (needsTimelineRefresh) {
      if (timelineState.pointerDown || timelineState.dragging) {
        timelineState.refreshPending = true;
      } else {
        scheduleTimelineRefresh();
      }
    }
  };

  const observer = new MutationObserver((mutations) => {
    // 跳过由插件自身渲染触发的 DOM 变更，防止无限循环
    if (window.__toolkitIsRendering) {
      return;
    }

    mutations.forEach((mutation) => {
      markObserverWorkFromNode(mutation.target);
      mutation.addedNodes.forEach((node) => {
        markObserverWorkFromNode(node);
      });
      mutation.removedNodes.forEach((node) => {
        markObserverWorkFromNode(node);
      });
    });

    if (!observerNeedsPresenceCheck && !observerNeedsTimelineRefresh && !observerNeedsFolderRefresh) {
      return;
    }

    // 使用 requestAnimationFrame 节流，避免频繁执行
    if (observerRafId) {
      return;
    }
    observerRafId = requestAnimationFrame(() => {
      observerRafId = 0;
      observerCallback();
    });
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
}
