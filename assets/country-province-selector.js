// assets/utils/country-province-selector.js

export class CountryProvinceSelector {
  constructor(country_domid, province_domid, options = {}) {
    this.countryEl = document.getElementById(country_domid);
    this.provinceEl = document.getElementById(province_domid);
    this.provinceContainer = document.getElementById(options['hideElement'] || province_domid);

    this.initCountry();
    this.initProvince();

    this.countryEl.addEventListener('change', this.countryHandler.bind(this));
  }

  initCountry() {
    const defaultValue = this.countryEl.getAttribute('data-default');
    this.setSelectorByValue(this.countryEl, defaultValue);
    this.countryHandler();
  }

  initProvince() {
    const defaultValue = this.provinceEl.getAttribute('data-default');
    if (defaultValue && this.provinceEl.options.length > 0) {
      this.setSelectorByValue(this.provinceEl, defaultValue);
    }
  }

  countryHandler() {
    const selectedOption = this.countryEl.options[this.countryEl.selectedIndex];
    const provinces = JSON.parse(selectedOption.getAttribute('data-provinces'));

    this.clearOptions(this.provinceEl);

    if (!provinces.length) {
      this.provinceContainer.style.display = 'none';
    } else {
      provinces.forEach(([value, text]) => {
        const option = document.createElement('option');
        option.value = value;
        option.innerHTML = text;
        this.provinceEl.appendChild(option);
      });

      this.provinceContainer.style.display = '';
    }
  }

  setSelectorByValue(selector, value) {
    Array.from(selector.options).forEach((option, i) => {
      if (value === option.value || value === option.innerHTML) {
        selector.selectedIndex = i;
      }
    });
  }

  clearOptions(selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  }
}
