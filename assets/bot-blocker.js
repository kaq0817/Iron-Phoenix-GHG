// Bot/spam blocker for all forms
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    var forms = document.querySelectorAll('form');
    forms.forEach(function(form) {
      // Honeypot
      var honeypot = document.createElement('input');
      honeypot.type = 'text';
      honeypot.name = 'website';
      honeypot.style.display = 'none';
      honeypot.tabIndex = -1;
      form.appendChild(honeypot);

      // Checkbox
      var checkboxWrapper = document.createElement('div');
      checkboxWrapper.style.margin = '10px 0';
      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.required = true;
      checkbox.id = 'not-robot-' + Math.random().toString(36).substr(2, 9);
      var label = document.createElement('label');
      label.htmlFor = checkbox.id;
      label.textContent = 'I am not a robot';
      checkboxWrapper.appendChild(checkbox);
      checkboxWrapper.appendChild(label);
      // Insert before submit button
      var submit = form.querySelector('[type="submit"]');
      if (submit) {
        form.insertBefore(checkboxWrapper, submit);
      } else {
        form.appendChild(checkboxWrapper);
      }

      // Block submission if honeypot is filled
      form.addEventListener('submit', function(e) {
        if (honeypot.value) {
          e.preventDefault();
        }
      });
    });
  });
})();
