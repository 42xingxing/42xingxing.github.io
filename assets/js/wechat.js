// Lightweight modal controller for the WeChat QR popup.
// - Click the WeChat icon to open the modal.
// - Click the backdrop, the close button, or press Esc to close.
(function () {
  'use strict';

  function init() {
    var trigger = document.getElementById('wechat-trigger');
    var modal = document.getElementById('wechat-modal');
    if (!trigger || !modal) return;

    var panel = modal.querySelector('.wechat-modal__panel');
    var closeBtn = modal.querySelector('.wechat-modal__close');
    var lastFocused = null;

    function open(e) {
      if (e) e.preventDefault();
      lastFocused = document.activeElement;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    }

    trigger.addEventListener('click', open);

    // Close on backdrop click but not when clicking inside the panel.
    modal.addEventListener('click', function (e) {
      if (panel && panel.contains(e.target)) return;
      close();
    });

    if (closeBtn) closeBtn.addEventListener('click', close);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
