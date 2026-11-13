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
        return;
      }
      var power = a / Math.pow(1 + r / 100, y);
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

  // Simulador de gasto duplo (lição 3.3).
  var sim = document.getElementById("sim");
  if (sim) {
    var ledger = document.getElementById("sim-ledger");
    var spent = false;
    var log = [];
    var show = function () { ledger.textContent = log.join("\n"); };
    var reset = function () { spent = false; log = ["Registo público: a Ana tem 1 bitcoin."]; show(); };
    var send = function (to) {
      if (!spent) {
        spent = true;
        log.push("Transação 1: Ana → " + to + " (1 bitcoin). ACEITE.");
        log.push("Agora o 1 bitcoin pertence a " + to + ".");
      } else {
        log.push("Transação 2: Ana → " + to + " (1 bitcoin). REJEITADA: a Ana já gastou este bitcoin.");
      }
      show();
    };
    document.getElementById("sim-bob").addEventListener("click", function () { send("Bruno"); });
    document.getElementById("sim-carla").addEventListener("click", function () { send("Carla"); });
    document.getElementById("sim-reset").addEventListener("click", reset);
    reset();
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

  // Calculadora de comissão (Curso 2, lição 3.5).
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
      feeOut.textContent = "Comissão: " + pt(sats, 0) + " satoshis, cerca de " + pt(eur, 2) + " € (com o preço do exemplo).";
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
        "Investe-se no total <strong>" + pt(invested, 0) + " €</strong>.",
        "<strong>DCA:</strong> preço médio de compra " + pt(invested / btcDca, 0) + " €. Valor no fim: <strong>" + pt(btcDca * last, 0) + " €</strong>.",
        "<strong>Compra única no mês 1:</strong> preço " + pt(prices[0] * 1000, 0) + " €. Valor no fim: <strong>" + pt(btcLump * last, 0) + " €</strong>."
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
})();
