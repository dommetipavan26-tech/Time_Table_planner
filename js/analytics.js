'use strict';

// Vercel Web Analytics is available on production Vercel hostnames only.
if (location.hostname.endsWith('.vercel.app')) {
  window.va = window.va || function () {
    (window.vaq = window.vaq || []).push(arguments);
  };
  const analyticsScript = document.createElement('script');
  analyticsScript.defer = true;
  analyticsScript.src = '/_vercel/insights/script.js';
  document.head.appendChild(analyticsScript);
}
