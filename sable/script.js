const nav = document.getElementById("nav");
const burger = document.querySelector(".burger");
const modal = document.getElementById("join");

burger?.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  burger.setAttribute("aria-expanded", String(open));
});

nav?.querySelectorAll("a, button").forEach((el) => {
  el.addEventListener("click", () => {
    nav.classList.remove("is-open");
    burger?.setAttribute("aria-expanded", "false");
  });
});

document.querySelectorAll("[data-open='join']").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    modal.hidden = false;
  });
});

document.querySelectorAll("[data-close]").forEach((el) => {
  el.addEventListener("click", () => {
    modal.hidden = true;
  });
});

modal?.addEventListener("click", (e) => {
  if (e.target === modal) modal.hidden = true;
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") modal.hidden = true;
});
