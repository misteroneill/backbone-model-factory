/*!
    Backbone Model Factory 1.0.1

    (c) 2012 Patrick G. O'Neill
    Backbone Model Factory may be freely distributed under the MIT license
    https://github.com/misteroneill/backbone-model-factory
*/(function(e,t){"use strict";typeof exports!="undefined"&&typeof module!="undefined"&&module.exports?(exports=module.exports=require("backbone"),t(exports)):typeof define=="function"&&define.amd?define(["backbone"],t):t(e.Backbone)})(this,function(e){"use strict";function t(e,n){var r=""+n,i=e.idAttribute,s=e.constructor.cache;e.once||e.off("change:"+i,t);if(n){if(s.hasOwnProperty(r))throw new Error("model idAttribute attribute value already exists in cache");s[r]=e}}return e.ModelFactory=function(n,r){function u(e){e=typeof e=="object"?e:null;var n=s.prototype.idAttribute,r=e!==null&&e.hasOwnProperty(n),i=r&&""+e[n],u=i&&o.hasOwnProperty(i),a=u?o[i]:new s(e);return u?a.set(e):o[i]=a,r||a[a.once?"once":"on"]("change:"+n,t),a}r=typeof n=="object"?n:typeof r=="object"?r:null;var i=typeof n=="function"?n.hasOwnProperty("Model")?n.Model:n:e.Model,s=i.extend(r),o={};return u.Model=s,u.Model.cache=o,u},e});