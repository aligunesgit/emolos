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
    if (!html || html.indexOf('grid-item') === -1) throw new Error('widget html empty');
    htmlCache.set(src, html);
    return html;
  }

  function formatReviewDate(el) {
    const stamped = el.getAttribute('data-time');
    if (!stamped) return '';
    const date = new Date(Number(stamped));
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return day + '.' + month + '.' + date.getFullYear();
  }

  function absolutize(root) {
    root.querySelectorAll('[src], [href]').forEach(function (node) {
      ['src', 'href'].forEach(function (attr) {
        let value = node.getAttribute(attr);
        if (!value || value.charAt(0) === '#' || value.indexOf('javascript:') === 0) return;
        if (value.indexOf('//') === 0) value = 'https:' + value;
        if (/^(https?:|data:|mailto:|tel:)/i.test(value)) {
          node.setAttribute(attr, value);
          return;
        }
        try {
          node.setAttribute(attr, new URL(value, 'https://loox.io/').href);
        } catch (e) {}
      });
    });
  }

  function masonryScript() {
    return (
      '<script>(function(){function cols(g){var w=g.clientWidth;if(w>=1150)return 5;if(w>=920)return 4;if(w>=480)return 3;if(w>=320)return 2;return 1;}function layout(){var grid=document.getElementById("grid");if(!grid)return;document.body.classList.add("grid-active");document.body.style.visibility="visible";document.documentElement.style.overflow="auto";document.body.style.overflow="auto";var items=[].slice.call(grid.querySelectorAll(".grid-item-wrap"));var n=cols(grid);var colW=grid.clientWidth/n;var heights=Array(n).fill(0);items.forEach(function(item){item.style.position="absolute";item.style.width=colW+"px";item.style.float="none";var i=heights.indexOf(Math.min.apply(null,heights));item.style.left=(i*colW)+"px";item.style.top=heights[i]+"px";heights[i]+=item.offsetHeight;});grid.style.position="relative";grid.style.height=Math.max.apply(null,heights.concat([0]))+"px";try{parent.postMessage({looxEmolosHeight:document.documentElement.scrollHeight},"*")}catch(e){}}document.addEventListener("click",function(e){if(e.target.closest("[data-testid=\\"write-review-button\\"]")){e.preventDefault();try{parent.postMessage({looxEmolosWrite:true},"*")}catch(err){}}});window.addEventListener("load",layout);window.addEventListener("resize",layout);[].slice.call(document.images).forEach(function(img){if(!img.complete)img.addEventListener("load",layout);});setTimeout(layout,40);setTimeout(layout,250);setTimeout(layout,800);})();<\/script>'
    );
  }

  const STAR_FILL =
    'M24 9.425c0 .212-.125.443-.375.693l-5.236 5.105 1.24 7.212c.01.067.015.164.015.289a.85.85 0 0 1-.151.511.51.51 0 0 1-.44.21c-.183 0-.375-.058-.577-.174L12 19.869l-6.476 3.404c-.212.115-.404.173-.577.173-.202 0-.353-.07-.454-.21a.85.85 0 0 1-.152-.511c0-.058.01-.154.03-.289l1.24-7.211-5.25-5.106C.12 9.858 0 9.628 0 9.425c0-.355.27-.577.808-.663l7.24-1.053 3.245-6.562c.183-.395.418-.592.707-.592s.524.197.707.592l3.245 6.562 7.24 1.053c.539.086.808.308.808.663Z';
  function svgEl(doc, name, attrs) {
    const el = doc.createElementNS('http://www.w3.org/2000/svg', name);
    Object.keys(attrs).forEach(function (key) {
      el.setAttribute(key, attrs[key]);
    });
    return el;
  }

  function inlineLooxIcons(doc) {
    doc.querySelectorAll('svg.loox-icon.star, svg[data-lx-fill], .reviews-dist svg, [data-testid="rating-summary-score"] svg').forEach(function (svg) {
      if (svg.id === 'loox-rating-icon-svg-store' || svg.id === 'menu-icon-svg') return;
      const fill = (svg.getAttribute('data-lx-fill') || '').toLowerCase();
      svg.setAttribute('viewBox', svg.getAttribute('viewBox') || '0 0 24 24');
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      if (fill === 'empty') {
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '1.4');
      } else {
        svg.setAttribute('fill', 'currentColor');
        svg.removeAttribute('stroke');
        svg.removeAttribute('stroke-width');
      }
      svg.appendChild(svgEl(doc, 'path', { d: STAR_FILL }));
    });

    const sortBtn =
      doc.querySelector('[data-testid="sorting-menu-dropdown-button"]') ||
      doc.querySelector('.menu-icon.header-btn') ||
      doc.querySelector('.widget-header-actions .menu-icon');
    if (sortBtn) {
      sortBtn.querySelectorAll('svg').forEach(function (node) {
        node.remove();
      });
      const icon = svgEl(doc, 'svg', {
        viewBox: '0 0 24 24',
        width: '18',
        height: '18',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '1.8',
        'stroke-linecap': 'round',
        'aria-hidden': 'true',
        focusable: 'false'
      });
      icon.appendChild(svgEl(doc, 'path', { d: 'M4 8h16' }));
      icon.appendChild(svgEl(doc, 'path', { d: 'M4 16h16' }));
      icon.appendChild(svgEl(doc, 'path', { d: 'M9 5v6' }));
      icon.appendChild(svgEl(doc, 'path', { d: 'M15 13v6' }));
      sortBtn.insertBefore(icon, sortBtn.firstChild);
    }
  }

  function prepareDocument(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    Array.from(doc.querySelectorAll('script')).forEach(function (node) {
      node.remove();
    });
    if (!doc.querySelector('base')) {
      const base = doc.createElement('base');
      base.href = 'https://loox.io/';
      doc.head.insertBefore(base, doc.head.firstChild);
    }
    absolutize(doc);
    inlineLooxIcons(doc);
    doc.body.classList.add('grid-active');
    doc.body.style.visibility = 'visible';
    doc.documentElement.style.overflow = 'auto';
    doc.body.style.overflow = 'auto';

    const force = doc.createElement('style');
    force.textContent =
      'html,body{visibility:visible!important;opacity:1!important;overflow:auto!important;height:auto!important;}body.grid-active{visibility:visible!important;}' +
      'svg.loox-icon.star,svg[data-lx-fill],.reviews-dist svg,[data-testid="rating-summary-score"] svg{display:inline-block;width:1em;height:1em;vertical-align:middle;}' +
      'svg[data-lx-fill="empty"]{fill:none!important;stroke:currentColor;stroke-width:1.4;}' +
      'svg[data-lx-fill="full"],svg[data-lx-fill="half"],[data-testid="rating-summary-score"] svg{fill:currentColor;stroke:none;}' +
      '[data-testid="sorting-menu-dropdown-button"] svg,.menu-icon.header-btn svg{display:block;width:18px;height:18px;margin:auto;color:currentColor;}';
    doc.head.appendChild(force);

    doc.querySelectorAll('[data-time]').forEach(function (el) {
      if (!(el.textContent || '').trim()) el.textContent = formatReviewDate(el);
    });

    return doc;
  }

  async function translateDom(doc, code) {
    const bodies = Array.from(doc.querySelectorAll('[data-testid$="-text"], .pre-wrap.main-text, .main-text'));
    await Promise.all(
      bodies.map(async function (el) {
        const original = (el.textContent || '').trim();
        if (!original) return;
        el.textContent = await translateText(original, code);
      })
    );

    doc.querySelectorAll('.verified-badge-and-text span').forEach(function (el) {
      if (/verified/i.test(el.textContent || '')) el.textContent = t('verified', code);
    });

    const write = doc.querySelector('[data-testid="write-review-button"]');
    if (write) write.textContent = t('write', code);

    const count = doc.querySelector('[data-testid="rating-summary-count"] span') ||
      doc.querySelector('[data-testid="rating-summary-count"]');
    if (count) {
      const n = (count.textContent || '').replace(/\D/g, '');
      if (n) count.textContent = n + ' ' + t('reviews', code);
    }

    doc.querySelectorAll('.metadata .small.text-muted').forEach(function (el) {
      if (/item type/i.test(el.textContent || '')) el.textContent = t('itemType', code);
    });
  }

  function showOriginalWidget(host) {
    host.classList.remove('is-cloned');
    const clone = host.querySelector('.reviews-lang-clone-frame');
    if (clone) clone.remove();
    const overlay = host.querySelector('.reviews-lang-overlay');
    if (overlay) overlay.remove();
    const iframe = looxIframe(host);
    if (iframe && iframe.hasAttribute('srcdoc')) {
      iframe.removeAttribute('srcdoc');
      const src = originalIframeSrc(iframe);
      if (src) iframe.src = src;
    }
    if (host.dataset.emolosHeight) host.style.height = host.dataset.emolosHeight;
  }

  function waitForFrame(frame) {
    return new Promise(function (resolve) {
      const done = function () {
        resolve();
      };
      frame.addEventListener('load', done, { once: true });
      setTimeout(done, 1200);
    });
  }

  async function renderTranslatedClone(host, code) {
    const iframe = looxIframe(host);
    const src = originalIframeSrc(iframe);
    if (!src) throw new Error('no iframe src');

    const html = await fetchWidgetHtml(src);
    const doc = prepareDocument(html);
    await translateDom(doc, code);
    inlineLooxIcons(doc);

    let frame = host.querySelector('.reviews-lang-clone-frame');
    if (!frame) {
      frame = document.createElement('iframe');
      frame.className = 'reviews-lang-clone-frame';
      frame.setAttribute('title', 'Translated reviews');
      frame.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups');
      iframe.parentNode.insertBefore(frame, iframe.nextSibling);
    }

    const htmlOut = '<!DOCTYPE html>' + doc.documentElement.outerHTML.replace('</body>', masonryScript() + '</body>');
    const loaded = waitForFrame(frame);
    frame.srcdoc = htmlOut;
    await loaded;

    const cloneDoc = frame.contentDocument;
    if (!cloneDoc || !cloneDoc.body || (cloneDoc.body.innerText || '').trim().length < 8) {
      throw new Error('empty clone');
    }
    inlineLooxIcons(cloneDoc);

    const height = Math.max(
      cloneDoc.documentElement.scrollHeight || 0,
      cloneDoc.body.scrollHeight || 0,
      iframe.offsetHeight || 400
    );
    frame.style.height = height + 'px';

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
        else await renderTranslatedClone(hosts[i], code);
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

  window.addEventListener('message', function (event) {
    const data = event.data;
    if (!data) return;
    if (data.looxEmolosWrite && window.LOOX && typeof window.LOOX.showReviewForm === 'function') {
      window.LOOX.showReviewForm();
    }
    if (data.looxEmolosHeight) {
      document.querySelectorAll('.reviews-lang-clone-frame').forEach(function (frame) {
        frame.style.height = data.looxEmolosHeight + 'px';
      });
    }
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
