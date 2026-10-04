const intro = document.getElementById("intro");
const sidebar = document.getElementById("sidebar");

window.addEventListener("load", () => {
  setTimeout(() => intro.classList.add("hide"), 1100);
});

document.querySelector("[data-open-nav]")?.addEventListener("click", () => {
  sidebar.classList.add("open");
});

document.querySelector("[data-close-nav]")?.addEventListener("click", () => {
  sidebar.classList.remove("open");
});

sidebar.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => sidebar.classList.remove("open"));
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

document.querySelectorAll(".reveal").forEach((el, i) => {
  el.style.animationDelay = `${(i % 4) * 80}ms`;
  observer.observe(el);
});
