// Renders a data/*.csv file as a bilingual table: <div class="csv-table" data-src="../data/x.csv" data-kind="assumptions|sources"></div>
(function () {
  function parse(text) {
    var rows = [], row = [], cell = "", q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
      else if (c === '"') q = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    var head = rows.shift();
    return rows.filter(function (r) { return r.length > 1; }).map(function (r) {
      var o = {}; head.forEach(function (h, k) { o[h] = r[k] || ""; }); return o;
    });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }
  function bi(en, zh) { return '<span class="en">' + en + '</span><span class="zh">' + zh + "</span>"; }
  var KINDS = {
    assumptions: {
      head: [bi("Input", "参数"), bi("Default", "默认值"), bi("Range", "范围"), bi("Source", "来源"), bi("Status", "状态"), bi("Notes", "备注")],
      // Source column: report reference number(s) linked to the Sources page, then the register ID; none = assumption
      row: function (d, refs) {
        var ids = (d.source_id || "").split(/[;\s]+/).filter(Boolean);
        var src = ids.length ? ids.map(function (id) {
          return refs[id] ? '<a href="sources.html#ref-' + esc(refs[id]) + '">[' + esc(refs[id]) + "]</a> " + esc(id) : esc(id);
        }).join("; ") : bi("Assumption", "假设");
        return [bi(esc(d.label_en), esc(d.label_zh || d.label_en)), esc(d.value + " " + d.unit),
          d.low || d.high ? esc(d.low + "–" + d.high) : "—", src, esc(d.status), esc(d.notes)];
      },
      rowId: function (d) { return "a-" + d.id; }
    },
    sources: {
      head: [bi("ID", "编号"), bi("Ref.", "文献"), bi("Title", "标题"), bi("Publisher", "发布方"), bi("Date", "日期"), bi("Type", "类型")],
      row: function (d) {
        return [esc(d.id), d.ref ? '<a href="#ref-' + esc(d.ref) + '">[' + esc(d.ref) + "]</a>" : "—", d.url ? '<a href="' + esc(d.url) + '">' + esc(d.title) + "</a>" : esc(d.title), esc(d.publisher), esc(d.date), esc(d.type)];
      }
    }
  };
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".csv-table").forEach(function (el) {
      var kind = KINDS[el.dataset.kind], v = "?v=" + encodeURIComponent(document.lastModified);
      var get = function (src) { return fetch(src + v).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }); };
      // The assumptions table also needs the source register to turn source IDs into reference numbers
      var srcPath = el.dataset.src.replace(/[^/]*$/, "sources.csv");
      Promise.all([get(el.dataset.src), el.dataset.kind === "assumptions" ? get(srcPath).catch(function () { return ""; }) : ""])
        .then(function (t) {
          var rows = parse(t[0]), refs = {};
          if (t[1]) parse(t[1]).forEach(function (s) { refs[s.id] = s.ref; });
          el.innerHTML = '<table class="table table-sm"><thead><tr>' + kind.head.map(function (h) { return "<th>" + h + "</th>"; }).join("") +
            "</tr></thead><tbody>" + rows.map(function (d) {
              return "<tr" + (kind.rowId ? ' id="' + esc(kind.rowId(d)) + '"' : "") + ">" + kind.row(d, refs).map(function (c) { return "<td>" + c + "</td>"; }).join("") + "</tr>";
            }).join("") + "</tbody></table>";
          // Rows are added after load, so jump to a #a-... target once they exist
          if (location.hash) { var target = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (target) target.scrollIntoView(); }
        })
        .catch(function () { el.innerHTML = bi("The data file could not be loaded.", "无法加载数据文件。"); });
    });
  });
})();
