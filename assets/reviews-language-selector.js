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
  const I18N = {
    write: {
      en: 'Write a review',
      de: 'Bewertung schreiben',
      es: 'Escribir una reseña',
      fr: 'Écrire un avis',
      nl: 'Schrijf een review',
      no: 'Skriv en anmeldelse',
      sv: 'Skriv en recension'
    },
    verified: {
      en: 'Verified',
      de: 'Verifiziert',
      es: 'Verificado',
      fr: 'Vérifié',
      nl: 'Geverifieerd',
      no: 'Verifisert',
      sv: 'Verifierad'
    },
    itemType: {
      en: 'Item type:',
      de: 'Artikeltyp:',
      es: 'Tipo de artículo:',
      fr: 'Type d’article :',
      nl: 'Artikeltype:',
      no: 'Varetype:',
      sv: 'Artikeltyp:'
    },
    reviews: {
      en: 'Reviews',
      de: 'Bewertungen',
      es: 'Reseñas',
      fr: 'Avis',
      nl: 'Reviews',
      no: 'Anmeldelser',
      sv: 'Recensioner'
    }
  };

  const htmlCache = new Map();
  const translationCache = new Map();
  let currentLang = 'en';
  let translating = false;
  let observer;

  function storeLang(code) {
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch (e) {}
  }

  function langByCode(code) {
    return LANGUAGES.find((lang) => lang.code === code) || LANGUAGES[0];
  }

  function t(key, code) {
    return (I18N[key] && I18N[key][code]) || I18N[key].en;
  }

  function flagUrl(country) {
    return 'https://flagcdn.com/w40/' + country + '.png';
  }

  function esc(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }

  function findHosts() {
    return Array.from(document.querySelectorAll('#looxReviews.loox-widget')).filter(function (host) {
      return host.querySelector('iframe');
    });
  }

  function looxIframe(host) {
    return host.querySelector('iframe#looxReviewsFrame, iframe[src*="loox.io"], iframe[data-emolos-original-src]');
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
    const res = await fetch('https://r.jina.ai/' + src, {
      headers: { 'X-Return-Format': 'html', Accept: 'text/html' }
    });
    if (!res.ok) throw new Error('widget html ' + res.status);
    const html = await res.text();
    if (!html || html.length < 200) throw new Error('widget html empty');
    htmlCache.set(src, html);
    return html;
  }

  function safeImage(src) {
    try {
      const url = new URL(src, 'https://loox.io');
      if (url.protocol !== 'https:') return '';
      if (!/(^|\.)loox\.io$/i.test(url.hostname)) return '';
      return url.href;
    } catch (e) {
      return '';
    }
  }

  function parseWidget(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const avg = ((doc.querySelector('[data-testid="rating-summary-avg"]') || {}).textContent || '').trim() || '0';
    const countLabel = ((doc.querySelector('[data-testid="rating-summary-count"]') || {}).textContent || '').trim();
    const dist = [5, 4, 3, 2, 1].map(function (star) {
      const el = doc.querySelector('[data-testid="rating-filter-button-stars_' + star + '"]');
      return parseInt(((el && el.textContent) || '0').replace(/\D/g, ''), 10) || 0;
    });

    const texts = Array.from(doc.querySelectorAll('[data-testid$="-text"], .pre-wrap.main-text, .main-text'));
    const seen = new Set();
    const reviews = [];

    texts.forEach(function (textEl) {
      const body = (textEl.textContent || '').trim();
      if (!body || seen.has(body)) return;
      seen.add(body);

      const testId = textEl.getAttribute('data-testid') || '';
      const id = testId.replace(/-text$/, '');
      const root =
        textEl.closest('.grid-item-wrap, .grid-item, .box') || textEl.parentElement;
      const titleEl = (id && doc.querySelector('[data-testid="' + id + '-title"]')) ||
        (root && root.querySelector('[data-testid$="-title"], .title, .block.title'));
      const dateEl = (id && doc.querySelector('[data-testid="' + id + '-date"]')) ||
        (root && root.querySelector('[data-testid$="-date"], .time, .block.time'));
      const starRoot = (id && doc.querySelector('[data-testid="' + id + '-stars"]')) || root;
      const stars = starRoot ? starRoot.querySelectorAll('[data-lx-fill="full"], .loox-icon.star').length : 5;
      const images = root
        ? Array.from(root.querySelectorAll('img'))
            .map(function (img) {
              return safeImage(img.getAttribute('src') || img.getAttribute('data-src') || '');
            })
            .filter(Boolean)
        : [];
      const blob = ((root && root.textContent) || '');
      const itemTypeMatch = blob.match(/Item type:\s*([^\n]+)/i);
      reviews.push({
        name: ((titleEl && titleEl.textContent) || '').trim(),
        date: ((dateEl && dateEl.textContent) || '').trim(),
        text: body,
        stars: stars || 5,
        images: images,
        verified: /verified/i.test(blob),
        itemType: itemTypeMatch ? itemTypeMatch[1].trim() : ''
      });
    });

    return { avg: avg, countLabel: countLabel, dist: dist, reviews: reviews };
  }

  function starsHtml(count) {
    let html = '<span class="rlo-stars" aria-hidden="true">';
    for (let i = 1; i <= 5; i++) {
      html += '<span class="rlo-star' + (i <= count ? ' is-on' : '') + '">★</span>';
    }
    return html + '</span>';
  }

  function renderOverlay(data, code) {
    const maxBar = Math.max.apply(null, data.dist.concat([1]));
    const countNumber = parseInt((data.countLabel || '').replace(/\D/g, ''), 10);
    const countText = isNaN(countNumber)
      ? data.countLabel
      : countNumber + ' ' + t('reviews', code);

    let bars = '';
    data.dist.forEach(function (num, index) {
      const star = 5 - index;
      const width = Math.max(2, Math.round((num / maxBar) * 100));
      bars +=
        '<div class="rlo-bar">' +
        starsHtml(star) +
        '<span class="rlo-bar__track"><span class="rlo-bar__fill" style="width:' +
        (num ? width : 0) +
        '%"></span></span>' +
        '<span class="rlo-bar__n">(' +
        num +
        ')</span></div>';
    });

    let cards = '';
    data.reviews.forEach(function (review) {
      const imgs = review.images
        .map(function (src) {
          return '<img class="rlo-card__img" src="' + esc(src) + '" alt="">';
        })
        .join('');
      cards +=
        '<article class="rlo-card' +
        (review.images.length ? ' has-photo' : '') +
        '">' +
        imgs +
        '<div class="rlo-card__body">' +
        '<div class="rlo-card__name">' +
        esc(review.name) +
        (review.verified
          ? ' <span class="rlo-card__verified">✔ ' + esc(t('verified', code)) + '</span>'
          : '') +
        '</div>' +
        (review.date ? '<div class="rlo-card__date">' + esc(review.date) + '</div>' : '') +
        starsHtml(review.stars) +
        '<p class="rlo-card__text">' +
        esc(review.text) +
        '</p>' +
        (review.itemType
          ? '<div class="rlo-card__meta">' +
            esc(t('itemType', code)) +
            ' ' +
            esc(review.itemType) +
            '</div>'
          : '') +
        '</div></article>';
    });

    return (
      '<div class="rlo">' +
      '<div class="rlo-head">' +
      '<div class="rlo-score"><span class="rlo-score__star">★</span><span class="rlo-score__n">' +
      esc(data.avg) +
      '</span><div class="rlo-score__count">' +
      esc(countText) +
      '</div></div>' +
      '<div class="rlo-bars">' +
      bars +
      '</div>' +
      '<button type="button" class="rlo-write">' +
      esc(t('write', code)) +
      '</button></div>' +
      '<div class="rlo-grid">' +
      cards +
      '</div></div>'
    );
  }

  function showOriginalWidget(host) {
    host.classList.remove('is-cloned');
    const overlay = host.querySelector('.reviews-lang-overlay');
    if (overlay) overlay.remove();
    const clone = host.querySelector('.reviews-lang-clone-frame');
    if (clone) clone.remove();
    const iframe = looxIframe(host);
    if (iframe && iframe.hasAttribute('srcdoc')) {
      iframe.removeAttribute('srcdoc');
      const src = originalIframeSrc(iframe);
      if (src) iframe.src = src;
    }
    if (host.dataset.emolosHeight) host.style.height = host.dataset.emolosHeight;
  }

  async function renderTranslatedOverlay(host, code) {
    const iframe = looxIframe(host);
    const src = originalIframeSrc(iframe);
    if (!src) throw new Error('no iframe src');

    const html = await fetchWidgetHtml(src);
    const parsed = parseWidget(html);
    if (!parsed.reviews.length) throw new Error('no reviews');

    await Promise.all(
      parsed.reviews.map(async function (review) {
        review.text = await translateText(review.text, code);
      })
    );

    let overlay = host.querySelector('.reviews-lang-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'reviews-lang-overlay';
      iframe.parentNode.insertBefore(overlay, iframe.nextSibling);
      overlay.addEventListener('click', function (event) {
        if (event.target.closest('.rlo-write') && window.LOOX && window.LOOX.showReviewForm) {
          window.LOOX.showReviewForm();
        }
      });
    }
    overlay.innerHTML = renderOverlay(parsed, code);

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
    document.querySelectorAll('.reviews-lang').forEach(function (wrap) {
      wrap.classList.add('is-busy');
    });

    try {
      for (let i = 0; i < hosts.length; i++) {
        if (code === 'en') showOriginalWidget(hosts[i]);
        else await renderTranslatedOverlay(hosts[i], code);
      }
    } catch (e) {
      hosts.forEach(showOriginalWidget);
    } finally {
      translating = false;
      document.querySelectorAll('.reviews-lang').forEach(function (wrap) {
        wrap.classList.remove('is-busy');
      });
    }
  }

  function mountHost(host) {
    if (!host || host.querySelector(':scope > .reviews-lang-bar')) return;
    const iframe = looxIframe(host);
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
  }

  document.addEventListener('click', function (event) {
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

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeAll();
  });

  observer = new MutationObserver(function () {
    if (translating) return;
    window.clearTimeout(observer.emolosTimer);
    observer.emolosTimer = window.setTimeout(mountAll, 200);
  });

  function start() {
    try {
      storeLang('en');
      currentLang = 'en';
      mountAll();
      if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
