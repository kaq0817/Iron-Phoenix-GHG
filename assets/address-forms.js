/* assets/address-forms.js
   Lightweight Country → Province linker for customer address forms.
   - No external dependencies
   - Works with Dawn-like IDs and data attributes
   - A11y: preserves disabled state, toggles wrapper visibility
*/

(function () {
  'use strict';

  function qs(root, sel) { return (root || document).querySelector(sel); }
  function qsa(root, sel) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function getProvincesFromOption(optionEl) {
    if (!optionEl) return null;
    var raw = optionEl.getAttribute('data-provinces');
    if (!raw) return null;
    try {
      // Expecting a JSON string of [{code:'XX', name:'Province'}, ...]
      var parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) { /* ignore */ }
    return null;
  }

  function getProvincesFromShopifyCountries(countryName) {
    if (window.Shopify && window.Shopify.countries && window.Shopify.countries[countryName]) {
      var entry = window.Shopify.countries[countryName];
      if (entry && Array.isArray(entry.provinces)) {
        // Shopify may expose [{name:'', code:''}] or [{label:'', value:''}]
        return entry.provinces.map(function (p) {
          return {
            code: p.code || p.value || '',
            name: p.name || p.label || ''
          };
        });
      }
    }
    return null;
  }

  function getProvinces(countrySelect) {
    var opt = countrySelect.options[countrySelect.selectedIndex];
    return (
      getProvincesFromOption(opt) ||
      getProvincesFromShopifyCountries(countrySelect.value) ||
      []
    );
  }

  function setSelectOptions(select, items, placeholder) {
    // Clear
    while (select.firstChild) select.removeChild(select.firstChild);
    if (placeholder) {
      var ph = document.createElement('option');
      ph.value = '';
      ph.textContent = placeholder;
      select.appendChild(ph);
    }
    items.forEach(function (p) {
      var o = document.createElement('option');
      o.value = p.code || p.name || '';
      o.textContent = p.name || p.code || '';
      select.appendChild(o);
    });
  }

  function show(el) { if (el) el.hidden = false; }
  function hide(el) { if (el) el.hidden = true; }

  function updateZipLabel(container, countryName) {
    // Optional nicety: some countries prefer "Postcode"
    var label = qs(container, '[data-address-zip-label]');
    if (!label) return;

    var text = 'ZIP / Postal code';
    var n = (countryName || '').toLowerCase();
    if (n === 'united kingdom') text = 'Postcode';
    if (n === 'australia') text = 'Postcode';
    if (n === 'ireland') text = 'Eircode';
    label.textContent = text;
  }

  function bindPair(container, countrySelect, provinceSelect, provinceWrapper) {
    if (!countrySelect || !provinceSelect) return;

    function refresh() {
      var provinces = getProvinces(countrySelect);
      if (provinces && provinces.length) {
        setSelectOptions(provinceSelect, provinces, '— Select —');
        var defaultVal = provinceSelect.getAttribute('data-default') || provinceSelect.dataset.default;
        if (defaultVal) {
          // Try to select by code or name
          var found = Array.prototype.find.call(provinceSelect.options, function (o) {
            return o.value === defaultVal || o.textContent === defaultVal;
          });
          if (found) found.selected = true;
        }
        provinceSelect.disabled = false;
        show(provinceWrapper);
      } else {
        // No provinces—clear and hide
        setSelectOptions(provinceSelect, []);
        provinceSelect.disabled = true;
        hide(provinceWrapper);
      }
      updateZipLabel(container, countrySelect.value);
    }

    countrySelect.addEventListener('change', refresh);
    refresh();
  }

  function findPairIn(container) {
    // Prefer data attributes
    var country = qs(container, '[data-address-country]') ||
                  qs(container, 'select[name="address[country]"]') ||
                  qs(container, '#AddressCountryNew') ||
                  qs(container, container.id ? ('#AddressCountry_' + container.id.replace(/\D/g, '')) : null);

    var province = qs(container, '[data-address-province]') ||
                   qs(container, 'select[name="address[province]"]') ||
                   qs(container, '#AddressProvinceNew') ||
                   qs(container, container.id ? ('#AddressProvince_' + container.id.replace(/\D/g, '')) : null);

    // Wrapper for show/hide province
    var provinceWrap = qs(container, '[data-address-province-wrapper]') ||
                       (province ? province.closest('.field') : null) ||
                       province && province.parentElement;

    if (country && province) {
      // Carry defaults if provided
      var defCountry = country.getAttribute('data-default') || country.dataset.default;
      if (defCountry && !country.value) {
        country.value = defCountry;
      }
      var defProv = province.getAttribute('data-default') || province.dataset.default;
      if (defProv) {
        province.setAttribute('data-default', defProv);
      }
      bindPair(container, country, province, provinceWrap);
    }
  }

  function init(root) {
    // Common containers used by Shopify forms:
    var scopes = qsa(root, '[data-customer-address]', '.address-form, .customer_address');
    // Fallback: look for forms with country/province selects
    if (!scopes.length) {
      scopes = qsa(root, 'form[action*="/account/addresses"], form[id^="AddressNew"], form[id^="EditAddress"]');
    }
    if (!scopes.length) scopes = [document];

    scopes.forEach(findPairIn);
  }

  // Bootstrap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(document); });
  } else {
    init(document);
  }
  // Re-init when sections re-render in the editor
  document.addEventListener('shopify:section:load', function (e) { init(e.target); });
  document.addEventListener('shopify:section:unload', function (e) { /* no-op */ });
})();
