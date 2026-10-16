/* ============================================================
   Site-wide interactions:
   mobile navigation, scroll reveals, contact form validation
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Mobile navigation ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var navMenu = document.getElementById("nav-menu");

  function closeMenu() {
    if (!navMenu.classList.contains("open")) return;
    navMenu.classList.remove("open");
    navToggle.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function (event) {
      event.stopPropagation();
      var isOpen = navMenu.classList.toggle("open");
      navToggle.classList.toggle("open", isOpen);
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Close after following a link (useful for same-page anchors).
    navMenu.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu();
    });

    // Close when clicking outside the header.
    document.addEventListener("click", function (event) {
      if (!event.target.closest(".site-header")) closeMenu();
    });

    // Close with Escape.
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu();
    });

    // Reset the menu when jumping to a wider viewport.
    window.addEventListener("resize", function () {
      if (window.innerWidth > 720) closeMenu();
    });
  }

  /* ---------- Reveal-on-scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window && revealEls.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Contact form ---------- */
  var contactForm = document.getElementById("contact-form");

  if (contactForm) {
    var successBox = document.getElementById("form-success");
    var fields = [
      { id: "name", test: function (v) { return v.trim().length > 0; } },
      {
        id: "email",
        test: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
        }
      },
      { id: "subject", test: function (v) { return v.trim().length > 0; } },
      { id: "message", test: function (v) { return v.trim().length > 0; } }
    ];

    fields.forEach(function (field) {
      var input = document.getElementById(field.id);
      if (!input) return;

      input.addEventListener("blur", function () {
        field.wasTouched = true;
        field.wasTouched && validateField(field);
      });
      input.addEventListener("input", function () {
        if (field.wasTouched) validateField(field);
      });
    });

    function validateField(field) {
      var input = document.getElementById(field.id);
      var wrapper = input.closest(".field");
      var isValid = field.test(input.value);
      wrapper.classList.toggle("is-invalid", !isValid);
      return isValid;
    }

    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var allValid = true;
      fields.forEach(function (field) {
        field.wasTouched = true;
        if (!validateField(field)) allValid = false;
      });

      if (!allValid) {
        var firstInvalid = contactForm.querySelector(".field.is-invalid input, .field.is-invalid textarea");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Demo form: no backend is wired up yet.
      contactForm.classList.add("is-hidden");
      successBox.classList.add("is-visible");
    });
  }
})();
