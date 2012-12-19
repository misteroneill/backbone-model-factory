/*!
    Backbone Model Factory 1.0.0

    (c) 2012 Patrick G. O'Neill
    Backbone Model Factory may be freely distributed under the MIT license
    https://github.com/misteroneill/backbone-model-factory
*/(function(e,t){"use strict";var n="undefined",r="backbone";typeof exports!==n&&typeof module!==n&&module.exports?(exports=module.exports=require(r),t(exports)):typeof define=="function"&&define.amd?define([r],t):t(e.Backbone)})(this,function(e){"use strict";function i(e,t){var n=""+t,r=e.idAttribute,s=e.constructor.cache;e.once||e.off("change:"+r,i);if(t){if(s.hasOwnProperty(n))throw new Error("model idAttribute attribute value already exists in cache");s[n]=e}}var t="function",n="object",r=null;return e.ModelFactory=function(s,o){function l(e){e=typeof e===n?e:r;var t=a.prototype.idAttribute,s=e!==r&&e.hasOwnProperty(t),o=s&&""+e[t],u=o&&f.hasOwnProperty(o),l=u?f[o]:new a(e);return u?l.set(e):f[o]=l,s||l[l.once?"once":"on"]("change:"+t,i),l}o=typeof s===n?s:typeof o===n?o:r;var u=typeof s===t?s.hasOwnProperty("Model")?s.Model:s:e.Model,a=u.extend(o),f={};return l.Model=a,l.Model.cache=f,l},e});