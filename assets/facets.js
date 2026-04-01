document.addEventListener('DOMContentLoaded', function () {
  // Find all forms inside <facet-filters-form>
  const filterForms = document.querySelectorAll('facet-filters-form form');

  filterForms.forEach((form) => {
    form.addEventListener('change', () => {
      const url = new URL(window.location.href);
      const formData = new FormData(form);
      const searchParams = new URLSearchParams(formData);

      url.search = searchParams.toString();
      window.location.href = url.toString();
    });
  });
});
