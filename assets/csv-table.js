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
      row: function (d) {
        return [bi(esc(d.label_en), esc(d.label_zh || d.label_en)), esc(d.value + " " + d.unit),
          d.low || d.high ? esc(d.low + "–" + d.high) : "—", esc(d.source_id || "—"), esc(d.status), esc(d.notes)];
      }
    },
    sources: {
      head: [bi("ID", "编号"), bi("Title", "标题"), bi("Publisher", "发布方"), bi("Date", "日期"), bi("Type", "类型")],
      row: function (d) {
        return [esc(d.id), d.url ? '<a href="' + esc(d.url) + '">' + esc(d.title) + "</a>" : esc(d.title), esc(d.publisher), esc(d.date), esc(d.type)];
      }
    }
  };
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".csv-table").forEach(function (el) {
      var kind = KINDS[el.dataset.kind];
      fetch(el.dataset.src + "?v=" + encodeURIComponent(document.lastModified))
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
        .then(function (t) {
          var rows = parse(t);
          el.innerHTML = '<table class="table table-sm"><thead><tr>' + kind.head.map(function (h) { return "<th>" + h + "</th>"; }).join("") +
            "</tr></thead><tbody>" + rows.map(function (d) { return "<tr>" + kind.row(d).map(function (c) { return "<td>" + c + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>";
        })
        .catch(function () { el.innerHTML = bi("The data file could not be loaded.", "无法加载数据文件。"); });
    });
  });
})();
