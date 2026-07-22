// Плавное появление секций при скролле. Без JS всё остаётся видимым (см. styles.css).
(function () {
  var items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || !items.length) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  items.forEach(function (item) {
    observer.observe(item);
  });
})();
