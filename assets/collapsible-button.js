var collapsibleButtons = document.querySelectorAll('.collapsible__button');

collapsibleButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    collapsibleButtons.forEach(function (otherButton) {
      if (otherButton !== button) {
        otherButton.classList.remove('collapsible__button-active');
        var otherContent = otherButton.nextElementSibling;
        otherContent.style.display = 'none';
        otherContent.style.opacity = 0;
        otherContent.style.visibility = 'hidden';
        otherContent.style.height = 0;
      }
    });

    var content = button.nextElementSibling;

    if (content.style.display === 'block') {
      content.style.display = 'none';
      content.style.opacity = 0;
      content.style.visibility = 'hidden';
      content.style.height = 0;
      button.classList.remove('collapsible__button-active');
    } else {
      content.style.display = 'block';
      content.style.opacity = 1;
      content.style.visibility = 'visible';
      content.style.height = 'auto';
      button.classList.add('collapsible__button-active');
    }
  });
});
