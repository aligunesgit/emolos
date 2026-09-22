(function () {
  const STORAGE_KEY = 'emolos_reviews_lang';
  const LANGUAGES = [
    { code: 'en', label: 'English', short: 'EN', flag: 'gb', title: 'Customer Reviews' },
    { code: 'de', label: 'German', short: 'DE', flag: 'de', title: 'Kundenbewertungen' },
    { code: 'es', label: 'Spanish', short: 'ES', flag: 'es', title: 'Opiniones de clientes' },
    { code: 'fr', label: 'French', short: 'FR', flag: 'fr', title: 'Avis clients' },
    { code: 'nl', label: 'Dutch', short: 'NL', flag: 'nl', title: 'Klantbeoordelingen' },
    { code: 'no', label: 'Norwegian', short: 'NO', flag: 'no', title: 'Kundeanmeldelser' },
    { code: 'sv', label: 'Swedish', short: 'SV', flag: 'se', title: 'Kundrecensioner' }
  ];
  const TEXT_SELECTORS = [
    '[data-testid$="-text"]',
    '.pre-wrap.main-text',
    '.main-text'
  ];
  const htmlCache = new Map();
  const translationCache = new Map();
  let currentLang = readStoredLang();
  let translating = false;
  let observer;

  function readStoredLang() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && LANGUAGES.some((lang) => lang.code === stored)) return stored;
    } catch (e) {}
    return 'en';
  }

  function storeLang(code) {
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch (e) {}
  }

  function langByCode(code) {
    return LANGUAGES.find((lang) => lang.code === code) || LANGUAGES[0];
  }

  function flagUrl(country) {
    return 'https://flagcdn.com/w40/' + country + '.png';
  }

  function findHosts() {
    return Array.from(document.querySelectorAll('#looxReviews.loox-widget, .jdgm-rev-widg')).filter(isUsableHost);
  }

  function isUsableHost(host) {
    if (host.querySelector('iframe')) return true;
    return host.getBoundingClientRect().height > 40;
  }

  function originalIframeSrc(iframe) {
    if (!iframe) return '';
    if (iframe.dataset.emolosOriginalSrc) return iframe.dataset.emolosOriginalSrc;
    const src = iframe.getAttribute('src') || iframe.src || '';
    if (src && src.indexOf('loox.io') !== -1) {
      iframe.dataset.emolosOriginalSrc = src;
      return src;
    }
    return src;
  }

  function buildSelector() {
    const wrap = document.createElement('div');
    wrap.className = 'reviews-lang';
    wrap.dataset.lang = currentLang;
    const current = langByCode(currentLang);
    wrap.innerHTML =
      '<button type="button" class="reviews-lang__btn" aria-haspopup="listbox" aria-expanded="false" aria-label="Review language">' +
      '<img class="reviews-lang__flag" alt="" width="22" height="16" src="' +
      flagUrl(current.flag) +
      '">' +
      '<span class="reviews-lang__code">' +
      current.short +
      '</span>' +
      '<svg class="reviews-lang__chevron" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.2 4.2 6 8l3.8-3.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</button><ul class="reviews-lang__menu" role="listbox" hidden></ul>';

    const menu = wrap.querySelector('.reviews-lang__menu');
    LANGUAGES.forEach((lang) => {
      const item = document.createElement('li');
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'reviews-lang__option' + (lang.code === currentLang ? ' is-active' : '');
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', lang.code === currentLang ? 'true' : 'false');
      option.dataset.lang = lang.code;
      option.innerHTML =
        '<img class="reviews-lang__flag" alt="" width="24" height="18" src="' +
        flagUrl(lang.flag) +
        '">' +
        '<span>' +
        lang.label +
        '</span>';
      item.appendChild(option);
      menu.appendChild(item);
    });
    return wrap;
  }

  function syncSelector(code) {
    const lang = langByCode(code);
    document.querySelectorAll('.reviews-lang').forEach((wrap) => {
      wrap.dataset.lang = code;
      const btnFlag = wrap.querySelector('.reviews-lang__btn .reviews-lang__flag');
      const btnCode = wrap.querySelector('.reviews-lang__code');
      if (btnFlag) btnFlag.src = flagUrl(lang.flag);
      if (btnCode) btnCode.textContent = lang.short;
      wrap.querySelectorAll('.reviews-lang__option').forEach((option) => {
        const active = option.dataset.lang === code;
        option.classList.toggle('is-active', active);
        option.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    });
    document.querySelectorAll('.reviews-lang-bar__title').forEach((title) => {
      title.textContent = lang.title;
    });
  }

  function closeAll(except) {
    document.querySelectorAll('.reviews-lang.is-open').forEach((wrap) => {
      if (wrap === except) return;
      wrap.classList.remove('is-open');
      const btn = wrap.querySelector('.reviews-lang__btn');
      const menu = wrap.querySelector('.reviews-lang__menu');
      if (btn) btn.setAttribute('aria-expanded', 'false');
      if (menu) menu.hidden = true;
    });
  }

  function toggleMenu(wrap, open) {
    const shouldOpen = open !== undefined ? open : !wrap.classList.contains('is-open');
    closeAll(shouldOpen ? wrap : null);
    wrap.classList.toggle('is-open', shouldOpen);
    const btn = wrap.querySelector('.reviews-lang__btn');
    const menu = wrap.querySelector('.reviews-lang__menu');
    if (btn) btn.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    if (menu) menu.hidden = !shouldOpen;
  }

  function collectTextNodes(doc) {
    const nodes = [];
    TEXT_SELECTORS.forEach((selector) => {
      doc.querySelectorAll(selector).forEach((node) => {
        const text = (node.textContent || '').trim();
        if (text && !nodes.includes(node)) nodes.push(node);
      });
    });
    return nodes;
  }

  async function translateText(text, target) {
    const key = target + '::' + text;
    if (translationCache.has(key)) return translationCache.get(key);
    if (!text || target === 'en') return text;

    const encoded = encodeURIComponent(text.slice(0, 900));
    let translated = text;

    try {
      const gtx = await fetch(
        'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=' +
          target +
          '&dt=t&q=' +
          encoded
      );
      if (gtx.ok) {
        const data = await gtx.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
          translated = data[0].map((part) => part[0]).join('');
        }
      }
    } catch (e) {
      try {
        const memory = await fetch(
          'https://api.mymemory.translated.net/get?langpair=en|' + target + '&q=' + encoded
        );
        if (memory.ok) {
          const data = await memory.json();
          if (data && data.responseData && data.responseData.translatedText) {
            translated = data.responseData.translatedText;
          }
        }
      } catch (err) {}
    }

    translationCache.set(key, translated);
    return translated;
  }

  async function fetchWidgetHtml(src) {
    if (htmlCache.has(src)) return htmlCache.get(src);
    try {
      const stored = sessionStorage.getItem('emolos_loox_html:' + src);
      if (stored) {
        htmlCache.set(src, stored);
        return stored;
      }
    } catch (e) {}

    const res = await fetch('https://r.jina.ai/' + src, {
      headers: { 'X-Return-Format': 'html', Accept: 'text/html' }
    });
    if (!res.ok) throw new Error('widget html ' + res.status);
    const html = await res.text();
    if (!html || (html.indexOf('grid-item') === -1 && html.indexOf('main-text') === -1)) {
      throw new Error('widget html empty');
    }
    htmlCache.set(src, html);
    try {
      sessionStorage.setItem('emolos_loox_html:' + src, html);
    } catch (e) {}
    return html;
  }

  function absolutize(root, base) {
    root.querySelectorAll('[src], [href]').forEach((node) => {
      ['src', 'href'].forEach((attr) => {
        const value = node.getAttribute(attr);
        if (!value || value.charAt(0) === '#' || value.indexOf('javascript:') === 0) return;
        if (/^(https?:|data:|mailto:|tel:)/i.test(value)) return;
        try {
          node.setAttribute(attr, new URL(value, base).href);
        } catch (e) {}
      });
    });
  }

  function prepareDocument(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    Array.from(doc.querySelectorAll('script')).forEach((node) => node.remove());
    absolutize(doc, 'https://loox.io/');
    return doc;
  }

  function showOriginalWidget(host) {
    const iframe = host.querySelector('iframe');
    const clone = host.querySelector('.reviews-lang-clone');
    if (clone) clone.remove();
    host.classList.remove('is-cloned', 'is-translating');
    if (host.dataset.emolosHeight) host.style.height = host.dataset.emolosHeight;
    if (!iframe) return;
    if (iframe.hasAttribute('srcdoc')) {
      iframe.removeAttribute('srcdoc');
      const src = originalIframeSrc(iframe);
      if (src) iframe.src = src;
    }
  }

  function bindCloneClicks(clone) {
    clone.addEventListener('click', (event) => {
      const write = event.target.closest('[data-testid="write-review-button"], .write-review, a[href*="write"]');
      if (write && window.LOOX && typeof window.LOOX.showReviewForm === 'function') {
        event.preventDefault();
        window.LOOX.showReviewForm();
      }
    });
  }

  async function renderTranslatedClone(host, code) {
    const iframe = host.querySelector('iframe');
    const src = originalIframeSrc(iframe);
    if (!src) throw new Error('no iframe src');

    const html = await fetchWidgetHtml(src);
    const doc = prepareDocument(html);
    const nodes = collectTextNodes(doc);
    await Promise.all(
      nodes.map(async (node) => {
        const original = (node.textContent || '').trim();
        node.textContent = await translateText(original, code);
      })
    );

    const clone = document.createElement('div');
    clone.className = 'reviews-lang-clone ' + (doc.body.className || '');

    const assets = document.createElement('div');
    assets.className = 'reviews-lang-clone__assets';
    doc.querySelectorAll('head style, head link[rel="stylesheet"], head svg').forEach((node) => {
      assets.appendChild(node.cloneNode(true));
    });
    clone.appendChild(assets);

    const content = document.createElement('div');
    content.className = 'reviews-lang-clone__content';
    content.innerHTML = doc.body.innerHTML;
    clone.appendChild(content);
    bindCloneClicks(clone);

    const old = host.querySelector('.reviews-lang-clone');
    if (old) old.replaceWith(clone);
    else iframe.parentNode.insertBefore(clone, iframe.nextSibling);

    if (!host.dataset.emolosHeight) host.dataset.emolosHeight = host.style.height || '';
    host.style.height = 'auto';
    host.classList.add('is-cloned');
  }

  async function applyLanguage(code) {
    currentLang = code;
    storeLang(code);
    syncSelector(code);

    const hosts = findHosts();
    translating = true;
    if (observer) observer.disconnect();
    document.querySelectorAll('.reviews-lang').forEach((wrap) => wrap.classList.add('is-busy'));

    try {
      for (let i = 0; i < hosts.length; i++) {
        hosts[i].querySelectorAll('iframe').forEach(originalIframeSrc);
        if (code === 'en') showOriginalWidget(hosts[i]);
        else await renderTranslatedClone(hosts[i], code);
      }
    } catch (e) {
      hosts.forEach(showOriginalWidget);
    } finally {
      translating = false;
      document.querySelectorAll('.reviews-lang').forEach((wrap) => wrap.classList.remove('is-busy'));
      if (observer && document.body) observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  function mountHost(host) {
    if (!host || host.querySelector(':scope > .reviews-lang-bar')) return;
    const iframe = host.querySelector('iframe');
    if (iframe) originalIframeSrc(iframe);

    const bar = document.createElement('div');
    bar.className = 'reviews-lang-bar';
    const heading = document.createElement('h2');
    heading.className = 'reviews-lang-bar__title';
    heading.textContent = langByCode(currentLang).title;
    bar.appendChild(heading);
    bar.appendChild(buildSelector());
    host.insertBefore(bar, host.firstChild);
  }

  function mountAll() {
    findHosts().forEach(mountHost);
    if (currentLang !== 'en') applyLanguage(currentLang);
  }

  document.addEventListener('click', (event) => {
    const btn = event.target.closest('.reviews-lang__btn');
    if (btn) {
      event.preventDefault();
      toggleMenu(btn.closest('.reviews-lang'));
      return;
    }

    const option = event.target.closest('.reviews-lang__option');
    if (option) {
      event.preventDefault();
      const wrap = option.closest('.reviews-lang');
      toggleMenu(wrap, false);
      if (option.dataset.lang && option.dataset.lang !== currentLang && !translating) {
        applyLanguage(option.dataset.lang);
      }
      return;
    }

    if (!event.target.closest('.reviews-lang')) closeAll();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAll();
  });

  observer = new MutationObserver(() => {
    if (translating) return;
    window.clearTimeout(observer.emolosTimer);
    observer.emolosTimer = window.setTimeout(() => {
      findHosts().forEach(mountHost);
    }, 200);
  });

  function start() {
    mountAll();
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
