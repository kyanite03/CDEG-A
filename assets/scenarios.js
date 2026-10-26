// Scenarios for the model pages: save and reload every input, export/import them as a file,
// and download results as CSV. Everything stays in the reader's browser; nothing is sent anywhere.
(function () {
  var registry = {};   // page -> {inputName: element}; refreshed whenever an input is rebuilt

  function key(page) { return "cdeg-scenarios-" + page; }
  function readAll(page) {
    try { return JSON.parse(window.localStorage.getItem(key(page))) || {}; } catch (e) { return {}; }
  }
  function writeAll(page, all) {
    try { window.localStorage.setItem(key(page), JSON.stringify(all)); return true; } catch (e) { return false; }
  }
  function download(filename, text, type) {
    var blob = new Blob([text], {type: type || "text/plain"});
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function setValue(el, v) {
    if (!el) return;
    try { el.value = v; el.dispatchEvent(new Event("input", {bubbles: true})); } catch (e) {}
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  window.CDEGScenarios = {
    register: function (page, inputs) { registry[page] = inputs; },
    values: function (page) {
      var out = {}, r = registry[page] || {};
      Object.keys(r).forEach(function (k) { out[k] = r[k].value; });
      return out;
    },
    // Two passes: inputs whose defaults depend on others (e.g. the route or site) are rebuilt after the first
    apply: async function (page, vals) {
      for (var pass = 0; pass < 2; pass++) {
        var r = registry[page] || {};
        Object.keys(vals).forEach(function (k) { if (r[k]) setValue(r[k], vals[k]); });
        await wait(400);
      }
    },
    list: function (page) { return Object.keys(readAll(page)).sort(); },
    save: function (page, name) {
      var all = readAll(page);
      all[name] = {saved: new Date().toISOString(), values: this.values(page)};
      return writeAll(page, all);
    },
    load: function (page, name) {
      var s = readAll(page)[name];
      return s ? this.apply(page, s.values) : Promise.resolve();
    },
    remove: function (page, name) { var all = readAll(page); delete all[name]; writeAll(page, all); },
    exportFile: function (page) {
      var data = {page: page, exported: new Date().toISOString(), current: this.values(page), saved: readAll(page)};
      download("cdeg-" + page + "-scenarios.json", JSON.stringify(data, null, 2), "application/json");
    },
    // Merges saved scenarios from a file and applies the inputs that were current when it was exported
    importFile: function (page, file) {
      var self = this;
      return file.text().then(function (t) {
        var data = JSON.parse(t);
        if (data.page && data.page !== page) throw new Error("This file is for the " + data.page + " model.");
        var all = readAll(page);
        Object.keys(data.saved || {}).forEach(function (k) { all[k] = data.saved[k]; });
        writeAll(page, all);
        return data.current ? self.apply(page, data.current) : null;
      });
    },
    // rows: array of objects; columns: [[header, accessor], ...]
    downloadCSV: function (filename, rows, columns) {
      // Money and tonnes to whole numbers, rates and ratios to four decimals
      var fmt = function (x) { return typeof x === "number" && isFinite(x) ? String(Math.abs(x) >= 100 ? Math.round(x) : Math.round(x * 1e4) / 1e4) : x; };
      var esc = function (x) { var s = x == null ? "" : String(fmt(x)); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
      var lines = [columns.map(function (c) { return esc(c[0]); }).join(",")];
      rows.forEach(function (d) { lines.push(columns.map(function (c) { return esc(c[1](d)); }).join(",")); });
      // BOM so Excel opens Chinese headers correctly
      download(filename, "﻿" + lines.join("\n"), "text/csv;charset=utf-8");
    }
  };
})();
