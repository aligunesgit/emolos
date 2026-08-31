document.addEventListener("DOMContentLoaded", function () {
  const tabs = document.querySelectorAll(".js-drawer-tab");
  const contents = document.querySelectorAll(".js-drawer-tab-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const target = tab.dataset.tab;

      // Tüm tab ve content elementlerinden "active" sınıfını kaldır
      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));

      // Seçilen tab ve içeriğine "active" sınıfını ekle
      tab.classList.add("active");
      const activeContent = document.querySelector(`#drawer-${target}`);
      if (activeContent) {
        activeContent.classList.add("active");
      }
    });
  });
});
