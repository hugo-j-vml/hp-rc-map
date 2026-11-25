// Launch page: slides between the version screens. ES5, works from file://.
(function () {
  var box = document.querySelector("[data-phases]");
  if (!box) return;
  var html = document.documentElement;
  var panels = [].slice.call(box.querySelectorAll("[data-phase-panel]"));
  var latest = panels.length;
  var busy = false;

  function fromHash() {
    var m = /^#version-(\d+)$/.exec(location.hash);
    var n = m ? parseInt(m[1], 10) : latest;
    return n >= 1 && n <= latest ? n : latest;
  }
  function token(name) { return getComputedStyle(html).getPropertyValue(name).trim(); }
  function duration() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return 0;
    var v = token("--index-phase-duration");
    return (/ms$/.test(v) ? parseFloat(v) : parseFloat(v) * 1000) || 0;
  }

  var current = fromHash();
  panels[current - 1].classList.add("is-current");

  // Slide the whole screen to version `to`: an earlier version comes in from the left (the screen leaves to the right).
  function go(to, focusDir) {
    var incoming = panels[to - 1], outgoing = panels[current - 1];
    if (busy || to === current || !incoming || !outgoing) return;
    busy = true;
    var dir = to < current ? 1 : -1;
    window.scrollTo(0, 0);
    outgoing.classList.add("is-leaving");
    incoming.classList.add("is-current");
    current = to;
    history.replaceState(history.state, "", to === latest ? location.pathname + location.search : "#version-" + to);
    function finish() {
      outgoing.classList.remove("is-leaving", "is-current");
      var buttons = [].slice.call(incoming.querySelectorAll(".index-phase-button"));
      var pick = null, i;
      for (i = 0; i < buttons.length; i++) if (String(buttons[i].getAttribute("data-go")) === focusDir && !buttons[i].disabled) pick = buttons[i];
      for (i = 0; !pick && i < buttons.length; i++) if (!buttons[i].disabled) pick = buttons[i];
      if (pick) pick.focus({ preventScroll: true });
      busy = false;
    }
    var d = duration();
    if (!d || !incoming.animate) { finish(); return; }
    var opts = { duration: d, easing: token("--index-phase-easing") || "ease-in-out" };
    var done = 0;
    function one() { if (++done === 2) finish(); }
    var a = outgoing.animate([{ transform: "translateX(0)" }, { transform: "translateX(" + dir * 100 + "%)" }], opts);
    var b = incoming.animate([{ transform: "translateX(" + -dir * 100 + "%)" }, { transform: "translateX(0)" }], opts);
    a.onfinish = one; b.onfinish = one;
  }

  box.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest(".index-phase-button") : null;
    if (!b || b.disabled) return;
    var to = parseInt(b.getAttribute("data-go"), 10);
    go(to, String(to + (to < current ? -1 : 1)));
  });
  // The address changed by hand, or the browser's Back and Forward between #version-1 and none
  window.addEventListener("hashchange", function () { go(fromHash()); });
})();
