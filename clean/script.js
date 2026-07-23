(function () {
  "use strict";

  var nodes = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    nodes.forEach(function (n) {
      io.observe(n);
    });
  } else {
    nodes.forEach(function (n) {
      n.classList.add("is-in");
    });
  }

  var form = document.getElementById("order-form");
  var ok = document.getElementById("form-ok");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (ok) ok.hidden = false;
      form.reset();
    });
  }
})();
