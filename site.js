// ===== Shared site behaviour: nav, language toggle, dropdown menu =====
// Each feature below is wrapped independently so a failure in one
// (an unexpected DOM shape, a missing element on a given page, etc.)
// can never take down the others — the language toggle still works
// even if, say, the header-height sync throws, and vice versa.
document.addEventListener("DOMContentLoaded", function () {

  // ---- Footer year ----
  try {
    var yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  } catch (err) {
    console.error("DigiDocs: footer year failed", err);
  }

  // ---- Keep --header-h in sync with the header's real rendered height ----
  var syncHeaderHeight = function () {};
  try {
    var siteHeader = document.querySelector("header");
    syncHeaderHeight = function () {
      if (siteHeader) {
        document.documentElement.style.setProperty("--header-h", siteHeader.offsetHeight + "px");
      }
    };
    syncHeaderHeight();
    window.addEventListener("resize", syncHeaderHeight);
    window.addEventListener("orientationchange", syncHeaderHeight);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(syncHeaderHeight).catch(function () {});
    }
  } catch (err) {
    console.error("DigiDocs: header height sync failed", err);
  }

  // ---- Mobile nav toggle (hamburger) ----
  // Background scroll-lock: overflow:hidden on <body> alone doesn't
  // reliably stop touch-scrolling the page behind the panel on real
  // mobile browsers (notably iOS Safari), so the body is pinned with
  // position:fixed at its current scroll offset while the panel is
  // open, then restored to that exact offset on close.
  try {
    var hamburgerBtn = document.getElementById("hamburgerBtn");
    var navLinks = document.getElementById("navLinks");
    var lockedScrollY = 0;

    var lockBodyScroll = function () {
      lockedScrollY = window.scrollY || window.pageYOffset || 0;
      document.body.style.position = "fixed";
      document.body.style.top = "-" + lockedScrollY + "px";
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
    };
    var unlockBodyScroll = function () {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      window.scrollTo(0, lockedScrollY);
    };

    if (hamburgerBtn && navLinks) {
      hamburgerBtn.addEventListener("click", function () {
        try {
          syncHeaderHeight();
          var isOpen = navLinks.classList.toggle("open");
          hamburgerBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
          if (isOpen) {
            lockBodyScroll();
          } else {
            unlockBodyScroll();
          }
        } catch (err) {
          console.error("DigiDocs: hamburger toggle failed", err);
        }
      });
      navLinks.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          navLinks.classList.remove("open");
          hamburgerBtn.setAttribute("aria-expanded", "false");
          unlockBodyScroll();
        });
      });
      // Close the panel if the viewport is widened past the mobile
      // breakpoint while it's open (e.g. rotating a tablet).
      window.addEventListener("resize", function () {
        if (window.innerWidth > 1100 && navLinks.classList.contains("open")) {
          navLinks.classList.remove("open");
          hamburgerBtn.setAttribute("aria-expanded", "false");
          unlockBodyScroll();
        }
      });
    }
  } catch (err) {
    console.error("DigiDocs: mobile nav setup failed", err);
  }

  // ---- Services dropdown: hover on desktop (CSS), tap-to-open below 1100px ----
  try {
    var MOBILE_NAV_BREAKPOINT = 1100;
    document.querySelectorAll(".has-dropdown > .dropdown-trigger").forEach(function (trigger) {
      trigger.setAttribute("role", "button");
      trigger.setAttribute("tabindex", trigger.getAttribute("tabindex") || "0");
      var toggle = function (e) {
        if (window.innerWidth <= MOBILE_NAV_BREAKPOINT) {
          e.preventDefault();
          trigger.parentElement.classList.toggle("open");
        }
      };
      trigger.addEventListener("click", toggle);
      trigger.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") toggle(e);
      });
    });
  } catch (err) {
    console.error("DigiDocs: services dropdown setup failed", err);
  }

  // ---- Language toggle (EN/SW) ----
  // Multiple copies of the control may exist on one page (desktop bar +
  // mobile panel). Only "leaf" [data-en] elements are swapped — ones with
  // no [data-en] descendant — so an element that wraps an icon plus a
  // separately-labelled span never has its icon wiped out by a
  // textContent overwrite on the parent.
  try {
    var langButtons = document.querySelectorAll(".lang-toggle button");
    var translatableLeaves = function () {
      return Array.prototype.filter.call(document.querySelectorAll("[data-en]"), function (el) {
        return !el.querySelector("[data-en]");
      });
    };
    langButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var lang = btn.dataset.lang;
          langButtons.forEach(function (b) {
            b.classList.toggle("active", b.dataset.lang === lang);
          });
          document.documentElement.lang = lang;
          translatableLeaves().forEach(function (el) {
            var val = el.dataset[lang];
            if (val !== undefined) el.textContent = val;
          });
          document.querySelectorAll("[data-en-ph]").forEach(function (el) {
            var val = lang === "sw" ? el.dataset.swPh : el.dataset.enPh;
            if (val !== undefined) el.setAttribute("placeholder", val);
          });
        } catch (err) {
          console.error("DigiDocs: language toggle failed", err);
        }
      });
    });
  } catch (err) {
    console.error("DigiDocs: language toggle setup failed", err);
  }
});
