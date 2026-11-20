/* Comportamento partilhado das lições: quizzes, conversor de sats
   e marca de lição concluída. O estado fica só neste browser (localStorage). */
(function () {
  "use strict";

  // Quando a lição é servida pelo site, o curso e o progresso vêm do servidor.
  var COURSE = window.__IPB_COURSE__ || null;
  var NS = COURSE && COURSE.slug ? COURSE.slug + ":" : "";

  function read(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function write(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* sem armazenamento: a página funciona na mesma */ }
  }

  // Quizzes: escolhe-se uma opção, verifica-se e mostra-se a explicação.
  document.querySelectorAll(".quiz").forEach(function (quiz) {
    var answer = Number(quiz.getAttribute("data-answer"));
    var button = quiz.querySelector("[data-check]");
    var feedback = quiz.querySelector(".feedback");
    var options = Array.prototype.slice.call(quiz.querySelectorAll(".opt"));
    var explanation = quiz.querySelector(".explanation");

    button.addEventListener("click", function () {
      var chosen = options.findIndex(function (o) { return o.querySelector("input").checked; });
      if (chosen === -1) {
        feedback.textContent = "Escolher uma opção primeiro.";
        return;
      }
      options.forEach(function (o) { o.classList.remove("is-right", "is-wrong"); });
      options[answer].classList.add("is-right");
      var right = chosen === answer;
      if (!right) options[chosen].classList.add("is-wrong");
      feedback.innerHTML = "";
      var lead = document.createElement("strong");
      lead.className = right ? "ok" : "bad";
      lead.textContent = right ? "Certo. " : "Ainda não. ";
      feedback.appendChild(lead);
      feedback.appendChild(document.createTextNode(explanation.textContent));
    });
  });

  // Conversor entre satoshis e bitcoin (1 BTC = 100 000 000 sats).
  var sats = document.getElementById("sats");
  var btc = document.getElementById("btc");
  if (sats && btc) {
    var fmt = function (n, max) {
      return n.toLocaleString("pt-PT", { maximumFractionDigits: max, useGrouping: false });
    };
    var parse = function (v) { return parseFloat(String(v).replace(/\s/g, "").replace(",", ".")); };
    sats.addEventListener("input", function () {
      var n = parse(sats.value);
      btc.value = isFinite(n) ? fmt(n / 1e8, 8) : "";
    });
    btc.addEventListener("input", function () {
      var n = parse(btc.value);
      sats.value = isFinite(n) ? fmt(Math.round(n * 1e8), 0) : "";
    });
  }

  // Listas de verificação: o estado de cada caixa guarda-se no dispositivo.
  document.querySelectorAll(".checklist input[type=checkbox]").forEach(function (cb) {
    var key = "ipb:" + NS + cb.id;
    cb.checked = read(key) === "1";
    cb.addEventListener("change", function () { write(key, cb.checked ? "1" : "0"); });
  });


  // Gráfico do poder de compra (lição 3.2): acompanha os valores da calculadora.
  var chartState = null;
  var CH = { W0: 84, W1: 356, H0: 44, H1: 252 };
  var fmtE = function (v) { return v.toLocaleString("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }); };
  var fmtN = function (v) { return v.toLocaleString("pt-PT", { maximumFractionDigits: 1 }); };
  var drawCalcChart = function (a, r, y) {
    var g = document.getElementById("calc-chart-dyn");
    if (!g) return;
    var cur = document.getElementById("calc-chart-cur");
    if (cur) cur.innerHTML = "";
    if (!isFinite(a) || !isFinite(r) || !isFinite(y) || a <= 0 || r <= 0 || y <= 0) { chartState = null; g.innerHTML = ""; return; }
    chartState = { a: a, r: r, y: y };
    var W0 = CH.W0, W1 = CH.W1, H0 = CH.H0, H1 = CH.H1, n = 60;
    var px = function (t) { return W0 + (W1 - W0) * (t / y); };
    var py = function (v) { return H1 - (H1 - H0) * (v / a); };
    var path = function (rate) {
      var f = 1 + rate / 100, d = "";
      for (var i = 0; i <= n; i++) {
        var t = y * i / n;
        d += (i ? " L" : "M") + px(t).toFixed(1) + " " + py(a / Math.pow(f, t)).toFixed(1);
      }
      return d;
    };
    var f = 1 + r / 100;
    var curve = path(r);
    var lost = "M" + W0 + " " + H0 + " L" + W1 + " " + H0;
    for (var k = n; k >= 0; k--) {
      var tk = y * k / n;
      lost += " L" + px(tk).toFixed(1) + " " + py(a / Math.pow(f, tk)).toFixed(1);
    }
    lost += " Z";
    var vEnd = a / Math.pow(f, y), half = Math.log(2) / Math.log(f), yh = py(a / 2);
    var s = "";
    s += '<path d="' + lost + '" fill="#fdeeee"/>';
    s += '<line x1="' + W0 + '" y1="' + yh.toFixed(1) + '" x2="' + W1 + '" y2="' + yh.toFixed(1) + '" stroke="#c4c4c4" stroke-width="1.8" stroke-dasharray="5 5"/>';
    s += '<path d="M' + W0 + ' ' + H0 + ' L' + W0 + ' ' + H1 + ' L' + W1 + ' ' + H1 + '" fill="none" stroke="#a3a3a3" stroke-width="1.8" stroke-linecap="round"/>';
    var refs = [2, 3, 6, 10], labels = [{ y: py(vEnd), text: fmtN(r) + "%", strong: true }];
    refs.forEach(function (rr) {
      if (Math.abs(rr - r) < 0.05) return;
      s += '<path d="' + path(rr) + '" fill="none" stroke="#c4c4c4" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>';
      labels.push({ y: py(a / Math.pow(1 + rr / 100, y)), text: rr + "%", strong: false });
    });
    s += '<path d="' + curve + '" fill="none" stroke="#f29500" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>';
    var placed = [];
    labels.sort(function (p, q) { return (q.strong ? 1 : 0) - (p.strong ? 1 : 0); }).forEach(function (l) {
      if (placed.some(function (yy) { return Math.abs(yy - l.y) < 17; })) return;
      placed.push(l.y);
      s += '<text x="' + (W1 + 14) + '" y="' + (l.y + 5).toFixed(1) + '" font-size="15" font-weight="' + (l.strong ? 700 : 400) + '" fill="' + (l.strong ? "#0a0a0a" : "#737373") + '">' + l.text + '</text>';
    });
    s += '<text x="76" y="' + (H0 + 5) + '" text-anchor="end" font-size="15" font-weight="600" fill="#0a0a0a">' + fmtE(a) + '</text>';
    s += '<text x="76" y="' + (yh + 5).toFixed(1) + '" text-anchor="end" font-size="15" fill="#525252">' + fmtE(a / 2) + '</text>';
    s += '<text x="76" y="' + (H1 + 5) + '" text-anchor="end" font-size="15" fill="#525252">0</text>';
    s += '<text x="' + W0 + '" y="' + (H1 + 26) + '" font-size="15" fill="#525252">hoje</text>';
    s += '<text x="' + W1 + '" y="' + (H1 + 26) + '" text-anchor="end" font-size="15" fill="#525252">daqui a ' + fmtN(y) + ' anos</text>';
    if (half <= y) {
      var hx = px(half), left = hx > (W0 + W1) / 2 + 20;
      s += '<line x1="' + hx.toFixed(1) + '" y1="' + yh.toFixed(1) + '" x2="' + hx.toFixed(1) + '" y2="' + H1 + '" stroke="#0a0a0a" stroke-width="1.8" stroke-dasharray="4 4"/>';
      s += '<circle cx="' + hx.toFixed(1) + '" cy="' + yh.toFixed(1) + '" r="6" fill="#0a0a0a" stroke="#fff" stroke-width="2"/>';
      s += '<text x="' + (left ? hx - 10 : hx + 10).toFixed(1) + '" y="' + (H1 - 10) + '" text-anchor="' + (left ? "end" : "start") + '" font-size="15" font-weight="600" fill="#0a0a0a">metade em ' + fmtN(half) + ' anos</text>';
    }
    s += '<circle cx="' + W1 + '" cy="' + py(vEnd).toFixed(1) + '" r="6" fill="#f29500" stroke="#0a0a0a" stroke-width="2.2"/>';
    s += '<text x="' + (W1 - 4) + '" y="' + (py(vEnd) - 12).toFixed(1) + '" text-anchor="end" font-size="16" font-weight="700" fill="#0a0a0a">' + fmtE(vEnd) + '</text>';
    g.innerHTML = s;
  };
  var chartSvg = document.getElementById("calc-chart");
  if (chartSvg) {
    var moveCursor = function (ev) {
      var cur = document.getElementById("calc-chart-cur");
      if (!cur || !chartState) return;
      var rect = chartSvg.getBoundingClientRect();
      var x = (ev.clientX - rect.left) * (chartSvg.viewBox.baseVal.width / rect.width);
      if (x < CH.W0 || x > CH.W1) { cur.innerHTML = ""; return; }
      var a = chartState.a, y = chartState.y, f = 1 + chartState.r / 100;
      var t = (x - CH.W0) / (CH.W1 - CH.W0) * y, v = a / Math.pow(f, t);
      var cy = CH.H1 - (CH.H1 - CH.H0) * (v / a);
      var tx = Math.min(Math.max(x, CH.W0 + 64), CH.W1 - 64);
      cur.innerHTML =
        '<line x1="' + x.toFixed(1) + '" y1="' + CH.H0 + '" x2="' + x.toFixed(1) + '" y2="' + CH.H1 + '" stroke="#0a0a0a" stroke-width="1.5"/>' +
        '<circle cx="' + x.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="6.5" fill="#f29500" stroke="#0a0a0a" stroke-width="2.4"/>' +
        '<rect x="' + (tx - 66).toFixed(1) + '" y="' + (CH.H0 - 2) + '" width="132" height="44" rx="9" fill="#0a0a0a"/>' +
        '<text x="' + tx.toFixed(1) + '" y="' + (CH.H0 + 17) + '" text-anchor="middle" font-size="14" fill="#fff">daqui a ' + fmtN(t) + ' anos</text>' +
        '<text x="' + tx.toFixed(1) + '" y="' + (CH.H0 + 37) + '" text-anchor="middle" font-size="16" font-weight="700" fill="#fff">' + fmtE(v) + '</text>';
    };
    chartSvg.addEventListener("pointermove", moveCursor);
    chartSvg.addEventListener("pointerdown", moveCursor);
    chartSvg.addEventListener("pointerleave", function () { var c = document.getElementById("calc-chart-cur"); if (c) c.innerHTML = ""; });
  }

  // Calculadora de poder de compra (lição 2.2).
  var calc = document.getElementById("calc");
  if (calc) {
    var amount = document.getElementById("calc-amount");
    var rate = document.getElementById("calc-rate");
    var years = document.getElementById("calc-years");
    var out = document.getElementById("calc-out");
    var eur = function (n) { return n.toLocaleString("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }); };
    var num = function (el) { return parseFloat(String(el.value).replace(",", ".")); };
    var run = function () {
      var a = num(amount), r = num(rate), y = num(years);
      if (!isFinite(a) || !isFinite(r) || !isFinite(y) || a < 0 || r <= 0 || y < 0) {
        out.textContent = "Escrever valores positivos nos três campos.";
        drawCalcChart(NaN, NaN, NaN);
        return;
      }
      var power = a / Math.pow(1 + r / 100, y);
      drawCalcChart(a, r, y);
      var half = Math.log(2) / Math.log(1 + r / 100);
      out.innerHTML = "";
      var l1 = document.createElement("p");
      l1.innerHTML = "Daqui a <strong>" + y.toLocaleString("pt-PT") + " anos</strong>, " + eur(a) + " compram o que hoje compram <strong>" + eur(power) + "</strong>.";
      var l2 = document.createElement("p");
      l2.innerHTML = "O poder de compra cai para metade em cerca de <strong>" + half.toLocaleString("pt-PT", { maximumFractionDigits: 1 }) + " anos</strong> (Regra dos 72: " + (72 / r).toLocaleString("pt-PT", { maximumFractionDigits: 1 }) + ").";
      out.appendChild(l1); out.appendChild(l2);
    };
    [amount, rate, years].forEach(function (el) { el.addEventListener("input", run); });
    run();
  }


  // Figuras com estados: os botões de .fig-tabs mostram um grupo do SVG e escondem os outros.
  document.querySelectorAll(".fig-tabs").forEach(function (tabs) {
    var fig = tabs.closest("figure");
    if (!fig) return;
    tabs.hidden = false;
    var btns = tabs.querySelectorAll("button[data-fig-show]");
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        btns.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        fig.querySelectorAll("[data-fig-state]").forEach(function (g) {
          g.style.display = g.id === b.getAttribute("data-fig-show") ? "" : "none";
        });
      });
    });
  });


  // Gráfico de emissão (lição 5.1): cursor com o ano, os bitcoins criados e a recompensa.
  var emSvg = document.getElementById("emission-chart");
  if (emSvg) {
    var EH = [2009.0, 2012.9, 2016.5, 2020.4, 2024.3];
    for (var ek = 1; ek <= 14; ek++) EH.push(2024.3 + 4 * ek);
    var emSupply = function (yr) {
      var s = 0;
      for (var k = 0; k < EH.length - 1; k++) {
        var a = EH[k], b = EH[k + 1], r = 50 / Math.pow(2, k);
        if (yr <= a) break;
        s += r * 210000 * (Math.min(yr, b) - a) / (b - a);
      }
      return s;
    };
    var emReward = function (yr) {
      for (var k = 0; k < EH.length - 1; k++) if (EH[k] <= yr && yr < EH[k + 1]) return 50 / Math.pow(2, k);
      return 50 / Math.pow(2, EH.length - 2);
    };
    var emMove = function (ev) {
      var cur = document.getElementById("emission-cur");
      var rect = emSvg.getBoundingClientRect();
      var x = (ev.clientX - rect.left) * (emSvg.viewBox.baseVal.width / rect.width);
      if (x < 56 || x > 404) { cur.innerHTML = ""; return; }
      var yr = 2009 + (x - 56) / (404 - 56) * (2036 - 2009);
      var sup = emSupply(yr), rw = emReward(yr);
      var cy = 170 - (170 - 44) * (sup / 21e6);
      var tx = Math.min(Math.max(x, 56 + 92), 404 - 92);
      var ty = x < 150 ? 52 : 100;
      var fm = function (v, d) { return v.toLocaleString("pt-PT", { maximumFractionDigits: d }); };
      cur.innerHTML =
        '<line x1="' + x.toFixed(1) + '" y1="44" x2="' + x.toFixed(1) + '" y2="296" stroke="#0a0a0a" stroke-width="1.5"/>' +
        '<circle cx="' + x.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="6" fill="#f29500" stroke="#0a0a0a" stroke-width="2.2"/>' +
        '<rect x="' + (tx - 92).toFixed(1) + '" y="' + ty + '" width="184" height="64" rx="9" fill="#0a0a0a"/>' +
        '<text x="' + tx.toFixed(1) + '" y="' + (ty + 20) + '" text-anchor="middle" font-size="15" font-weight="700" fill="#fff">' + Math.floor(yr) + '</text>' +
        '<text x="' + tx.toFixed(1) + '" y="' + (ty + 39) + '" text-anchor="middle" font-size="16" font-weight="700" fill="#f29500">' + fm(sup / 1e6, 2) + ' milhões criados</text>' +
        '<text x="' + tx.toFixed(1) + '" y="' + (ty + 57) + '" text-anchor="middle" font-size="14" fill="#fff">recompensa ' + fm(rw, 3) + ' BTC</text>';
    };
    var emToday = document.getElementById("emission-today");
    if (emToday) {
      var nowD = new Date();
      var yrNow = nowD.getFullYear() + (nowD.getMonth() + (nowD.getDate() - 1) / 31) / 12;
      if (yrNow > 2009 && yrNow < 2036) {
        var tx0 = 56 + (yrNow - 2009) / (2036 - 2009) * (404 - 56);
        var supNow = emSupply(yrNow), ty0 = 170 - (170 - 44) * (supNow / 21e6);
        var pct = Math.round(supNow / 21e6 * 100);
        emToday.innerHTML =
          '<line x1="' + tx0.toFixed(1) + '" y1="' + (ty0 + 8).toFixed(1) + '" x2="' + tx0.toFixed(1) + '" y2="170" stroke="#0a0a0a" stroke-width="1.8" stroke-dasharray="4 4"/>' +
          '<circle cx="' + tx0.toFixed(1) + '" cy="' + ty0.toFixed(1) + '" r="6.5" fill="#0a0a0a" stroke="#fff" stroke-width="2"/>' +
          '<text x="' + (tx0 - 8).toFixed(1) + '" y="132" text-anchor="end" font-size="15" font-weight="700" fill="#0a0a0a">hoje</text>' +
          '<text x="' + (tx0 - 8).toFixed(1) + '" y="150" text-anchor="end" font-size="15" fill="#525252">' + pct + '% criado</text>';
      }
    }
    emSvg.addEventListener("pointermove", emMove);
    emSvg.addEventListener("pointerdown", emMove);
    emSvg.addEventListener("pointerleave", function () { var c = document.getElementById("emission-cur"); if (c) c.innerHTML = ""; });
  }

  // Lição concluída. No site, o estado vem da conta e guarda-se no servidor.
  var done = document.getElementById("done");
  if (done) {
    var lesson = done.getAttribute("data-lesson");
    var doneKey = "ipb:done:" + NS + lesson;
    var set = function (on) {
      done.setAttribute("aria-pressed", on ? "true" : "false");
      done.textContent = on ? "Lição concluída ✓" : "Marcar como concluída";
      done.classList.toggle("secondary", on);
    };
    if (COURSE) {
      set(Array.isArray(COURSE.completed) && COURSE.completed.indexOf(lesson) !== -1);
    } else {
      set(read(doneKey) === "1");
    }
    done.addEventListener("click", function () {
      var on = done.getAttribute("aria-pressed") !== "true";
      if (!COURSE) {
        write(doneKey, on ? "1" : "0");
        set(on);
        return;
      }
      done.disabled = true;
      fetch("/api/curso/progresso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ course: COURSE.slug, lesson: lesson, done: on })
      })
        .then(function (r) {
          if (!r.ok) throw new Error("http " + r.status);
          set(on);
        })
        .catch(function () {
          done.textContent = "Não foi possível guardar. Convém tentar outra vez.";
          window.setTimeout(function () { set(!on); }, 2500);
        })
        .then(function () { done.disabled = false; });
    });
  }

  // ── Ferramentas dos Cursos 2 e 3 ────────────────────────────────────────
  var pt = function (n, max) {
    return n.toLocaleString("pt-PT", { maximumFractionDigits: max === undefined ? 2 : max });
  };
  var sha256Hex = function (text) {
    if (!(window.crypto && window.crypto.subtle)) return Promise.reject(new Error("sem crypto"));
    return window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) {
        return b.toString(16).padStart(2, "0");
      }).join("");
    });
  };

  // Calculadora de SHA-256 (Curso 2, lição 1.2).
  var hashIn = document.getElementById("hash-in");
  var hashOut = document.getElementById("hash-out");
  if (hashIn && hashOut) {
    var hashRun = function () {
      sha256Hex(hashIn.value).then(function (hex) {
        hashOut.textContent = "SHA-256 (" + hex.length + " caracteres):\n" + hex;
      }).catch(function () {
        hashOut.textContent = "O browser não suporta esta demonstração.";
      });
    };
    hashIn.addEventListener("input", hashRun);
    hashRun();
  }

  // Mineração de brinquedo (Curso 2, lição 1.3).
  var powRun = document.getElementById("pow-run");
  if (powRun) {
    var powData = document.getElementById("pow-data");
    var powDiff = document.getElementById("pow-diff");
    var powOut = document.getElementById("pow-out");
    powOut.textContent = "Carregar em «Minerar» para começar.";
    powRun.addEventListener("click", function () {
      var data = powData.value;
      var target = "0".repeat(parseInt(powDiff.value, 10) || 1);
      var nonce = 0;
      var started = performance.now();
      powRun.disabled = true;
      var step = function () {
        var batch = [];
        for (var i = 0; i < 300; i++) batch.push(sha256Hex(data + ":" + (nonce + i)));
        Promise.all(batch).then(function (hashes) {
          for (var j = 0; j < hashes.length; j++) {
            if (hashes[j].indexOf(target) === 0) {
              var tries = nonce + j + 1;
              var secs = (performance.now() - started) / 1000;
              powOut.textContent = "Bloco encontrado!\nNonce: " + (nonce + j) + "\nHash: " + hashes[j] +
                "\nTentativas: " + pt(tries, 0) + " em " + pt(secs, 1) + " s";
              powRun.disabled = false;
              return;
            }
          }
          nonce += batch.length;
          powOut.textContent = "A minerar… " + pt(nonce, 0) + " tentativas";
          window.setTimeout(step, 0);
        }).catch(function () {
          powOut.textContent = "O browser não suporta esta demonstração.";
          powRun.disabled = false;
        });
      };
      step();
    });
  }

  // Calculadora de taxa (Curso 2, lição 3.5).
  var feeRate = document.getElementById("fee-rate");
  if (feeRate) {
    var feeSize = document.getElementById("fee-size");
    var feePrice = document.getElementById("fee-price");
    var feeOut = document.getElementById("fee-out");
    var feeRun = function () {
      var rate = parseFloat(feeRate.value), size = parseFloat(feeSize.value), price = parseFloat(feePrice.value);
      if (!isFinite(rate) || !isFinite(size) || !isFinite(price) || rate <= 0 || size <= 0 || price <= 0) {
        feeOut.textContent = "Escrever valores positivos nos três campos.";
        return;
      }
      var sats = rate * size;
      var eur = sats / 1e8 * price;
      feeOut.textContent = "Taxa: " + pt(sats, 0) + " satoshis, cerca de " + pt(eur, 2) + "\u00a0€ (com o preço do exemplo).";
    };
    [feeRate, feeSize, feePrice].forEach(function (el) { el.addEventListener("input", feeRun); });
    feeRun();
  }

  // DCA contra compra única (Curso 3, lição 1.2). Preços inventados, em milhares de euros.
  var dcaAmount = document.getElementById("dca-amount");
  if (dcaAmount) {
    var dcaOut = document.getElementById("dca-out");
    var prices = [80, 60, 50, 55, 70, 85, 75, 65, 80, 95, 100, 90];
    var dcaRun = function () {
      var a = parseFloat(dcaAmount.value);
      if (!isFinite(a) || a <= 0) { dcaOut.textContent = "Escrever um valor positivo."; return; }
      var invested = a * prices.length, btcDca = 0;
      prices.forEach(function (p) { btcDca += a / (p * 1000); });
      var btcLump = invested / (prices[0] * 1000);
      var last = prices[prices.length - 1] * 1000;
      dcaOut.innerHTML = "";
      [
        "Investe-se no total <strong>" + pt(invested, 0) + "\u00a0€</strong>.",
        "<strong>DCA:</strong> preço médio de compra " + pt(invested / btcDca, 0) + "\u00a0€. Valor no fim: <strong>" + pt(btcDca * last, 0) + "\u00a0€</strong>.",
        "<strong>Compra única no mês 1:</strong> preço " + pt(prices[0] * 1000, 0) + "\u00a0€. Valor no fim: <strong>" + pt(btcLump * last, 0) + "\u00a0€</strong>."
      ].forEach(function (t) {
        var p = document.createElement("p");
        p.style.margin = "0 0 6px";
        p.innerHTML = t;
        dcaOut.appendChild(p);
      });
    };
    dcaAmount.addEventListener("input", dcaRun);
    dcaRun();
  }

  // Tempo de detenção (Curso 3, lição 2.2).
  var holdFrom = document.getElementById("hold-from");
  if (holdFrom) {
    var holdTo = document.getElementById("hold-to");
    var holdOut = document.getElementById("hold-out");
    var holdRun = function () {
      if (!holdFrom.value || !holdTo.value) { holdOut.textContent = "Escolher as duas datas."; return; }
      var days = Math.round((new Date(holdTo.value) - new Date(holdFrom.value)) / 86400000);
      if (days < 0) { holdOut.textContent = "A data de venda é anterior à de compra."; return; }
      holdOut.textContent = "Detido durante " + days + " dias. " + (days >= 365
        ? "Pelo regime geral descrito nesta lição, a mais-valia está isenta de IRS (mas declara-se)."
        : "Pelo regime geral descrito nesta lição, a mais-valia seria tributada a 28%. Faltam " + (365 - days) + " dias para chegar aos 365.");
    };
    [holdFrom, holdTo].forEach(function (el) { el.addEventListener("input", holdRun); });
  }
  // Preço de um ativo conforme o juro (lição 3.1): o cursor muda o juro e o preço.
  var assetRange = document.getElementById("f31-range");
  if (assetRange) {
    var assetRates = [5, 4, 2.5, 2, 1.25, 1, 0.8, 0.5];
    var assetFmt = function (n) { return String(n).replace(".", ","); };
    var assetPt = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); };
    var assetBar = document.getElementById("f31-bar");
    var assetRun = function () {
      var r = assetRates[parseInt(assetRange.value, 10)];
      var price = 50000 / (r / 100);
      var w = Math.max(price / 10000000 * 404, 10);
      var txt = assetPt(price) + " €";
      assetBar.setAttribute("width", w.toFixed(1));
      var pr = document.getElementById("f31-price");
      pr.textContent = txt;
      if (w > 240) { pr.setAttribute("x", (8 + w - 12).toFixed(1)); pr.setAttribute("text-anchor", "end"); }
      else { pr.setAttribute("x", (8 + w + 12).toFixed(1)); pr.setAttribute("text-anchor", "start"); }
      document.getElementById("f31-rate").textContent = assetFmt(r) + "%";
      document.getElementById("f31-calc").textContent = "50.000 € ÷ " + assetFmt(r) + "% = " + txt;
      assetRange.setAttribute("aria-valuetext", "juro de " + assetFmt(r) + "%, preço de " + txt);
    };
    assetRange.closest(".fig-slider").hidden = false;
    assetRange.addEventListener("input", assetRun);
    assetRun();
  }
  // Poder de compra de 10.000 € ao longo de 20 anos (lição 3.5): o cursor muda a perda de valor por ano.
  var pcRange = document.getElementById("f35-range");
  if (pcRange) {
    var pcFmt = function (n) { return String(n).replace(".", ","); };
    var pcPt = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); };
    var pcRun = function () {
      var r = parseInt(pcRange.value, 10) * 0.5;
      var X0 = 70, X1 = 404, Y0 = 24, Y1 = 196, line = "", ex = 0, ey = 0, end = 0;
      for (var t = 0; t <= 20; t++) {
        var v = 10000 / Math.pow(1 + r / 100, t);
        var x = X0 + (X1 - X0) * t / 20, y = Y1 - (Y1 - Y0) * v / 10000;
        line += (t === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
        ex = x; ey = y; end = v;
      }
      document.getElementById("f35-line").setAttribute("d", line.trim());
      document.getElementById("f35-area").setAttribute("d", line + "L" + X1 + " " + Y1 + " L" + X0 + " " + Y1 + " Z");
      var dot = document.getElementById("f35-dot");
      dot.setAttribute("cx", ex); dot.setAttribute("cy", ey.toFixed(1));
      var lab = document.getElementById("f35-end");
      lab.textContent = pcPt(end) + " €";
      lab.setAttribute("x", ex - 8);
      lab.setAttribute("y", (ey + 30).toFixed(1));
      document.getElementById("f35-rate").textContent = r === 0 ? "Dinheiro estável" : "Perde " + pcFmt(r) + "% ao ano";
      document.getElementById("f35-sum").textContent = r === 0 ? "o mesmo que hoje" : "o que hoje compram cerca de " + pcPt(end) + " €";
      document.getElementById("f35-out").textContent = pcFmt(r) + "%";
      pcRange.setAttribute("aria-valuetext", "perda de " + pcFmt(r) + "% por ano, 10.000 € valem cerca de " + pcPt(end) + " € daqui a 20 anos");
    };
    pcRange.closest(".fig-slider").hidden = false;
    pcRange.addEventListener("input", pcRun);
    pcRun();
  }
  // Rede de participantes (lição 5.4): o cursor muda o número de participantes e de ligações possíveis.
  var netRange = document.getElementById("f54-range");
  if (netRange) {
    var NS = "http://www.w3.org/2000/svg";
    var netG = document.getElementById("f54-net");
    var netRun = function () {
      var n = parseInt(netRange.value, 10), cx = 210, cy = 122, R = 96, pts = [], i, j, e;
      while (netG.firstChild) netG.removeChild(netG.firstChild);
      for (i = 0; i < n; i++) pts.push([cx + R * Math.sin(2 * Math.PI * i / n), cy - R * Math.cos(2 * Math.PI * i / n)]);
      for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) {
        e = document.createElementNS(NS, "line");
        e.setAttribute("x1", pts[i][0].toFixed(1)); e.setAttribute("y1", pts[i][1].toFixed(1));
        e.setAttribute("x2", pts[j][0].toFixed(1)); e.setAttribute("y2", pts[j][1].toFixed(1));
        e.setAttribute("stroke", "#a3a3a3"); e.setAttribute("stroke-width", n < 13 ? "1.6" : "1.1");
        netG.appendChild(e);
      }
      for (i = 0; i < n; i++) {
        e = document.createElementNS(NS, "circle");
        e.setAttribute("cx", pts[i][0].toFixed(1)); e.setAttribute("cy", pts[i][1].toFixed(1));
        e.setAttribute("r", n < 10 ? "9" : (n < 15 ? "8" : "7"));
        e.setAttribute("fill", "#f29500"); e.setAttribute("stroke", "#0a0a0a"); e.setAttribute("stroke-width", "2.2");
        netG.appendChild(e);
      }
      document.getElementById("f54-n").textContent = n;
      document.getElementById("f54-l").textContent = n * (n - 1) / 2;
      document.getElementById("f54-out").textContent = n;
      netRange.setAttribute("aria-valuetext", n + " participantes, " + (n * (n - 1) / 2) + " ligações possíveis");
    };
    netRange.closest(".fig-slider").hidden = false;
    netRange.addEventListener("input", netRun);
    netRun();
  }
  // Tamanho da posição (lição 5.7): o cursor muda a parte das poupanças em bitcoin e o efeito de uma queda de 80%.
  var posRange = document.getElementById("f57b-range");
  if (posRange) {
    var posFmt = function (n) { return String(Math.round(n * 10) / 10).replace(".", ","); };
    var posRun = function () {
      var p = parseInt(posRange.value, 10), W = 404, full = p / 100 * W, rest = full * 0.2;
      document.getElementById("f57b-a").setAttribute("width", full.toFixed(1));
      document.getElementById("f57b-b").setAttribute("width", rest.toFixed(1));
      var lost = document.getElementById("f57b-l");
      lost.setAttribute("x", (8 + rest).toFixed(1));
      lost.setAttribute("width", (full - rest).toFixed(1));
      document.getElementById("f57b-r1").textContent = "Perde " + posFmt(p * 0.8) + "% das poupanças";
      document.getElementById("f57b-r2").textContent = "o resto continua igual";
      document.getElementById("f57b-out").textContent = p + "%";
      posRange.setAttribute("aria-valuetext", p + "% das poupanças em bitcoin, perde " + posFmt(p * 0.8) + "% das poupanças com uma queda de 80%");
    };
    posRange.closest(".fig-slider").hidden = false;
    posRange.addEventListener("input", posRun);
    posRun();
  }
})();
