(function () {
  'use strict';

  var EXAMPLE_GLOSSARY = [
    '用户 | 客户',
    '登录 | 登入',
    '确定 | 確認',
    '取消 | 取消',
    '设置 | 設定',
  ].join('\n');

  var EXAMPLE_DOC = [
    '用户登录后可以在设置页面修改个人资料。',
    '点击确定保存修改，点击取消放弃修改。',
    '如果用户忘记密码，可以在登录页面点击"忘记密码"重置。',
  ].join('\n');

  var glossaryInput = document.getElementById('glossaryInput');
  var docInput = document.getElementById('docInput');
  var resultView = document.getElementById('resultView');
  var btnRun = document.getElementById('btnRun');
  var btnExport = document.getElementById('btnExport');
  var btnExample = document.getElementById('btnExample');

  var lastPlainResult = '';

  function parseGlossary(text) {
    var pairs = text.split('\n').map(function (line) {
      var idx = line.indexOf('|');
      if (idx === -1) return null;
      var from = line.slice(0, idx).trim();
      var to = line.slice(idx + 1).trim();
      if (!from) return null;
      return { from: from, to: to };
    }).filter(Boolean);
    // longer terms first so nested/overlapping terms don't get partially replaced
    pairs.sort(function (a, b) { return b.from.length - a.from.length; });
    return pairs;
  }

  function escapeHTML(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function run() {
    var pairs = parseGlossary(glossaryInput.value);
    var doc = docInput.value;

    if (!pairs.length || !doc) {
      resultView.textContent = '请先填写术语表和文档内容。';
      lastPlainResult = '';
      return;
    }

    // build combined regex to replace all terms in one pass (avoids re-matching already-replaced text)
    var pattern = new RegExp(pairs.map(function (p) { return escapeRegExp(p.from); }).join('|'), 'g');
    var map = {};
    pairs.forEach(function (p) { map[p.from] = p.to; });

    var plainParts = [];
    var htmlParts = [];
    var lastIndex = 0;
    var match;
    while ((match = pattern.exec(doc)) !== null) {
      var before = doc.slice(lastIndex, match.index);
      plainParts.push(before);
      htmlParts.push(escapeHTML(before));

      var replacement = map[match[0]];
      plainParts.push(replacement);
      htmlParts.push('<mark>' + escapeHTML(replacement) + '</mark>');

      lastIndex = match.index + match[0].length;
    }
    var tail = doc.slice(lastIndex);
    plainParts.push(tail);
    htmlParts.push(escapeHTML(tail));

    lastPlainResult = plainParts.join('');
    resultView.innerHTML = htmlParts.join('');
  }

  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  btnRun.addEventListener('click', run);
  btnExport.addEventListener('click', function () {
    if (!lastPlainResult) run();
    if (!lastPlainResult) return;
    download(new Blob([lastPlainResult], { type: 'text/plain;charset=utf-8' }), 'result.txt');
  });
  btnExample.addEventListener('click', function () {
    glossaryInput.value = EXAMPLE_GLOSSARY;
    docInput.value = EXAMPLE_DOC;
    run();
  });

  glossaryInput.value = EXAMPLE_GLOSSARY;
  docInput.value = EXAMPLE_DOC;
  run();
})();
