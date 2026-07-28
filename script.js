// Reveal on scroll. Sections stay visible unless observer is armed (see .js-ready in CSS).
(function () {
  var items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  function showAll() {
    for (var i = 0; i < items.length; i++) {
      items[i].classList.add("is-visible");
    }
  }

  if (!("IntersectionObserver" in window)) {
    showAll();
    return;
  }

  document.documentElement.classList.add("js-ready");

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -24px 0px" }
  );

  items.forEach(function (item) {
    observer.observe(item);
  });

  // Safety: never leave sections stuck invisible
  window.setTimeout(showAll, 2500);
})();
