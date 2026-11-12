/* Comportamento partilhado das lições: reflexões, quizzes, conversor de sats
   e marca de lição concluída. O estado fica só neste browser (localStorage). */
(function () {
  "use strict";

  function read(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function write(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* sem armazenamento: a página funciona na mesma */ }
  }

  // Reflexões: o texto guarda-se à medida que se escreve.
  document.querySelectorAll(".reflect textarea").forEach(function (ta) {
    var key = "ipb:" + ta.id;
    var saved = read(key);
    if (saved) ta.value = saved;
    ta.addEventListener("input", function () { write(key, ta.value); });
  });

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
        feedback.textContent = "Escolhe uma opção primeiro.";
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
    var key = "ipb:" + cb.id;
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
        out.textContent = "Escreve valores positivos nos três campos.";
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

  // Revisão: mostra as respostas guardadas na lição 0.2.
  document.querySelectorAll("[data-recall]").forEach(function (el) {
    var v = read("ipb:" + el.getAttribute("data-recall"));
    var target = el.querySelector(".answer");
    target.textContent = v && v.trim() ? v : "(Não escreveste nada neste dispositivo.)";
  });

  // Lição concluída.
  var done = document.getElementById("done");
  if (done) {
    var key = "ipb:done:" + done.getAttribute("data-lesson");
    var set = function (on) {
      done.setAttribute("aria-pressed", on ? "true" : "false");
      done.textContent = on ? "Lição concluída ✓" : "Marcar como concluída";
      done.classList.toggle("secondary", on);
    };
    set(read(key) === "1");
    done.addEventListener("click", function () {
      var on = done.getAttribute("aria-pressed") !== "true";
      write(key, on ? "1" : "0");
      set(on);
    });
  }
})();
