<template>
  <div>
    <main>
      <div class="max-w-screen-xl mx-auto flex flex-col mb-12 mt-20 gap-4 px-8">
        <span class="uppercase font-medium tracking-wider text-sm">{{
          $t("training.tag")
        }}</span>
        <h1
          class="text-6xl sm:text-7xl font-light max-w-3xl"
          v-if="locale === 'pt'"
        >
          Bitcoin para Todos
        </h1>
        <h1 class="text-6xl sm:text-7xl font-light max-w-3xl" v-else>
          Bitcoin for Everyone
        </h1>
        <p class="max-w-2xl text-balance text-lg" v-if="locale === 'pt'">
          A Bitcoin é o futuro do dinheiro. Quem mais cedo a compreender, mais
          vantagens terá.
        </p>
        <p class="max-w-2xl text-balance text-lg" v-else>
          Bitcoin is the future of money. The sooner you understand it, the
          greater your advantage.
        </p>
        <div
          v-if="locale === 'pt'"
          class="flex flex-col gap-16 text-black text-lg max-w-2xl mt-8"
        >
          <section class="flex flex-col gap-4">
            <h2 class="text-xl sm:text-2xl uppercase font-medium">
              O que vai aprender
            </h2>
            <ul class="flex flex-col gap-2">
              <li class="flex items-baseline gap-2">
                <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                <p>O essencial sobre Bitcoin, de forma simples e prática</p>
              </li>
              <li class="flex items-baseline gap-2">
                <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                <p>Como proteger a sua privacidade e soberania financeira</p>
              </li>
              <li class="flex items-baseline gap-2">
                <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                <p>Como comprar, guardar e utilizar Bitcoin em segurança</p>
              </li>
            </ul>
          </section>
          <section class="flex flex-col gap-4">
            <h2 class="text-xl sm:text-2xl uppercase font-medium">
              Para quem é esta formação?
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div class="flex flex-col gap-3">
                <h3 class="text-xl font-semibold">Particulares</h3>
                <ul class="flex flex-col gap-2">
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>Quer aprender com fontes fiáveis e em serenidade?</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>Deseja evitar esquemas de pirâmide cripto?</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>Procura proteger as suas poupanças de forma soberana?</p>
                  </li>
                </ul>
              </div>
              <div class="flex flex-col gap-3">
                <h3 class="text-xl font-semibold">Empresas & Organizações</h3>
                <ul class="flex flex-col gap-2">
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>Procuram atrair novos clientes com Bitcoin?</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>Querem inovar nos meios de pagamento?</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>
                      Ambicionam unir equipas em torno da inovação financeira?
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <!-- CTA scroll para inscrição -->
          <div
            class="flex flex-col gap-4 bg-black text-white rounded-[3px] p-6 sm:p-8"
          >
            <div class="flex flex-col gap-1">
              <span
                class="text-xs uppercase tracking-widest font-medium text-white/60"
                >Inscrições abertas</span
              >
              <p class="text-2xl sm:text-3xl font-light">
                Garanta o seu lugar no próximo curso.
              </p>
            </div>
            <div class="flex flex-col sm:flex-row sm:items-center gap-4">
              <button
                type="button"
                @click="scrollToEnrollment"
                class="inline-flex items-center gap-2 bg-white text-black font-semibold uppercase text-sm px-8 py-3 rounded-[3px] hover:bg-white/90 transition-colors w-full sm:w-auto justify-center"
              >
                Inscrever-se
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <span class="text-white/60 text-sm"
                >200 € · 8 horas · Presencial</span
              >
            </div>
          </div>

          <!-- Foto do curso -->
          <NuxtImg
            src="/curso.jpeg"
            alt="Curso Bitcoin para Todos"
            class="rounded-lg object-cover w-full max-h-[360px]"
          />

          <!-- Programa -->
          <section class="flex flex-col gap-4">
            <h2 class="text-xl sm:text-2xl uppercase font-medium">Programa</h2>
            <div class="flex flex-col gap-8">
              <div class="flex flex-col gap-2">
                <h3 class="text-xl font-semibold">1. A Génese</h3>
                <ul class="flex flex-col gap-2">
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>Breve História do dinheiro</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>O problema é inflação</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>A solução é Bitcoin</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>A descoberta da escassez digital</p>
                  </li>
                </ul>
                <p class="italic text-base mt-1">
                  Workshop #1 — Don't trust. Verify! — Como comprar Bitcoin com
                  segurança
                </p>
              </div>
              <div class="flex flex-col gap-2">
                <h3 class="text-xl font-semibold">2. A Tecnologia</h3>
                <ul class="flex flex-col gap-2">
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>A blockchain</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>A mineração</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>Bitcoin não é Cripto</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>Carteiras Bitcoin</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>FUD — Medos, incertezas e dúvidas</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>A rede Lightning</p>
                  </li>
                </ul>
                <p class="italic text-base mt-1">
                  Workshop #2 — Not your keys. Not your coins! — Como guardar
                  Bitcoin em auto-custódia
                </p>
              </div>
              <div class="flex flex-col gap-2">
                <h3 class="text-xl font-semibold">3. A Revolução</h3>
                <ul class="flex flex-col gap-2">
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>Instrumento de liberdade</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>Enquadramento regulamentar</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>Oportunidades para indivíduos e empresas</p>
                  </li>
                </ul>
                <p class="italic text-base mt-1">
                  Workshop #3 — Fix the money. Fix the world! — Como usar
                  Bitcoin no dia a dia
                </p>
              </div>
            </div>
          </section>
          <section class="flex flex-col gap-4">
            <h2 class="text-xl sm:text-2xl uppercase font-medium">
              Recursos incluídos
            </h2>
            <p>
              Vai receber um folheto prático com um guia claro para guardar as
              suas palavras-chave com segurança, evitar perdas irreversíveis e
              seguir boas práticas de auto-custódia.
            </p>
            <NuxtImg
              src="/folheto.jpeg"
              alt="Folheto de boas práticas de auto-custódia"
              class="w-full rounded-lg"
            />
          </section>
          <section class="flex flex-col gap-4">
            <h2 class="text-xl sm:text-2xl uppercase font-medium">
              Certificado de Formação
            </h2>
            <p>
              No final do curso receberá um
              <span class="font-bold">certificado de formação</span> emitido
              pelo Instituto Português de Bitcoin.
            </p>
            <NuxtImg
              src="/diploma.jpeg"
              alt="Certificado de formação"
              class="w-full rounded-lg"
            />
          </section>
          <section class="flex flex-col gap-4">
            <h2 class="text-xl sm:text-2xl uppercase font-medium">
              Os Formadores
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div class="flex flex-col gap-3">
                <NuxtImg
                  src="/formador_antonio.jpeg"
                  alt="António Neves da Silva"
                  class="w-full rounded-lg object-cover object-top aspect-square"
                />
                <h3 class="text-xl font-semibold">António Neves da Silva</h3>
                <p>Fundador da MoT Inteligência Energética</p>
                <p>Ex-Diretor e Vice-Presidente da Veolia</p>
                <p>
                  Pós-graduação MIT Portugal e Licenciatura em Eng.ª Mecânica no
                  Instituto Superior Técnico
                </p>
              </div>
              <div class="flex flex-col gap-3">
                <NuxtImg
                  src="/formador_tomas.JPG"
                  alt="Tomás Mamede"
                  class="w-full rounded-lg object-cover object-top aspect-square"
                />
                <h3 class="text-xl font-semibold">Tomás Mamede</h3>
                <p>
                  Presidente da Assembleia Geral do Instituto Português de
                  Bitcoin
                </p>
                <p>Engenheiro de Software na Mindera</p>
                <p>
                  Mestrado em Ciência de Computadores (IA) na Faculdade de
                  Engenharia da Universidade do Porto
                </p>
              </div>
            </div>
          </section>
          <section class="flex flex-col gap-4">
            <h2 class="text-xl sm:text-2xl uppercase font-medium">Logística</h2>
            <ul class="flex flex-col gap-2">
              <li class="flex items-baseline gap-2">
                <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                <p>Presencial exclusivo</p>
              </li>
              <li class="flex items-baseline gap-2">
                <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                <p>Máximo 10 participantes</p>
              </li>
              <li class="flex items-baseline gap-2">
                <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                <p>8 horas (dia inteiro)</p>
              </li>
            </ul>
          </section>
          <section class="flex flex-col gap-4">
            <h2 class="text-xl sm:text-2xl uppercase font-medium">
              Inscrições
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div
                class="flex flex-col gap-2 border border-black p-6 rounded-[3px]"
              >
                <h3 class="text-xl font-semibold">Para particulares</h3>
                <p class="font-bold">Bitcoin para Todos (8h)</p>
                <p>3 workshops práticos</p>
                <p class="text-2xl font-bold mt-2">
                  200 €<span class="text-base font-normal">
                    (IVA incluído)</span
                  >
                </p>
              </div>
              <div
                class="flex flex-col gap-2 border border-black p-6 rounded-[3px]"
              >
                <h3 class="text-xl font-semibold">Para empresas</h3>
                <p class="font-bold">Sob consulta</p>
                <p>Contacte-nos para uma proposta personalizada</p>
              </div>
            </div>
          </section>
          <section class="flex flex-col gap-4">
            <h2 class="text-xl sm:text-2xl uppercase font-medium">
              O verdadeiro objetivo
            </h2>
            <p>Mais do que aprender conceitos, é importante:</p>
            <ul class="flex flex-col gap-2">
              <li class="flex items-baseline gap-2">
                <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                <p>
                  Sentir-se confiante para utilizar Bitcoin de forma autónoma
                </p>
              </li>
              <li class="flex items-baseline gap-2">
                <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                <p>Evitar erros comuns e perdas desnecessárias</p>
              </li>
              <li class="flex items-baseline gap-2">
                <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                <p>Proteger o seu dinheiro com segurança</p>
              </li>
            </ul>
            <p>
              E sobretudo continuar acompanhado pelo IPB através da nossa
              comunidade digital, com acesso contínuo a pessoas, partilha de
              conhecimento, eventos e apoio ao longo do seu percurso.
            </p>
          </section>

          <!-- Formulário de inscrição -->
          <section id="enrollment" class="flex flex-col gap-4 border-t pt-8">
            <h2 class="text-xl sm:text-2xl uppercase font-medium">
              Inscrever-se
            </h2>
            <IPBTrainingEnrollment />
          </section>

          <!-- CTAs -->
          <section class="flex flex-col gap-4 border-t pt-8">
            <h2 class="text-xl sm:text-2xl uppercase font-medium">
              Tem dúvidas?
            </h2>
            <div class="flex flex-col sm:flex-row gap-4">
              <UiButton size="lg" href="mailto:info@institutobitcoin.pt">{{
                $t("training.cta.info")
              }}</UiButton>
              <UiButton
                size="lg"
                variant="outline"
                href="https://calendar.app.google/gyFsbCtUTmZBbgPt8"
                target="_blank"
                >{{ $t("training.cta.schedule") }}</UiButton
              >
            </div>
          </section>
        </div>
        <div
          v-else
          class="flex flex-col gap-16 text-black text-lg max-w-2xl mt-8"
        >
          <section class="flex flex-col gap-4">
            <h2 class="text-xl sm:text-2xl uppercase font-medium">
              What you'll learn
            </h2>
            <ul class="flex flex-col gap-2">
              <li class="flex items-baseline gap-2">
                <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                <p>The essentials of Bitcoin, in a simple and practical way</p>
              </li>
              <li class="flex items-baseline gap-2">
                <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                <p>How to protect your privacy and financial sovereignty</p>
              </li>
              <li class="flex items-baseline gap-2">
                <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                <p>How to buy, store and use Bitcoin safely</p>
              </li>
            </ul>
          </section>
          <section class="flex flex-col gap-4">
            <h2 class="text-xl sm:text-2xl uppercase font-medium">
              Who is this training for?
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div class="flex flex-col gap-3">
                <h3 class="text-xl font-semibold">Individuals</h3>
                <ul class="flex flex-col gap-2">
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>
                      Want to learn from reliable sources with peace of mind?
                    </p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>Want to avoid crypto pyramid schemes?</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>Looking to protect your savings in a sovereign way?</p>
                  </li>
                </ul>
              </div>
              <div class="flex flex-col gap-3">
                <h3 class="text-xl font-semibold">Companies & Organizations</h3>
                <ul class="flex flex-col gap-2">
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>Looking to attract new clients with Bitcoin?</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>Want to innovate in payment methods?</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>Aiming to unite teams around financial innovation?</p>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <!-- CTA scroll to registration -->
          <div
            class="flex flex-col gap-4 bg-black text-white rounded-[3px] p-6 sm:p-8"
          >
            <div class="flex flex-col gap-1">
              <span
                class="text-xs uppercase tracking-widest font-medium text-white/60"
                >Registrations open</span
              >
              <p class="text-2xl sm:text-3xl font-light">
                Secure your spot in the next course.
              </p>
            </div>
            <div class="flex flex-col sm:flex-row sm:items-center gap-4">
              <button
                type="button"
                @click="scrollToEnrollment"
                class="inline-flex items-center gap-2 bg-white text-black font-semibold uppercase text-sm px-8 py-3 rounded-[3px] hover:bg-white/90 transition-colors w-full sm:w-auto justify-center"
              >
                Register now
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <span class="text-white/60 text-sm"
                >€200 · 8 hours · In-person</span
              >
            </div>
          </div>

          <!-- Course photo -->
          <NuxtImg
            src="/curso.jpeg"
            alt="Bitcoin for Everyone course"
            class="rounded-lg object-cover w-full max-h-[360px]"
          />

          <!-- Program -->
          <section class="flex flex-col gap-4">
            <h2 class="text-xl sm:text-2xl uppercase font-medium">Program</h2>
            <div class="flex flex-col gap-8">
              <div class="flex flex-col gap-2">
                <h3 class="text-xl font-semibold">1. The Genesis</h3>
                <ul class="flex flex-col gap-2">
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>A brief history of money</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>The problem is inflation</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>The solution is Bitcoin</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>The discovery of digital scarcity</p>
                  </li>
                </ul>
                <p class="italic text-base mt-1">
                  Workshop #1 — Don't trust. Verify! — How to buy Bitcoin safely
                </p>
              </div>
              <div class="flex flex-col gap-2">
                <h3 class="text-xl font-semibold">2. The Technology</h3>
                <ul class="flex flex-col gap-2">
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>The blockchain</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>Mining</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>Bitcoin is not Crypto</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>Bitcoin wallets</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>FUD — Fear, uncertainty and doubt</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>The Lightning Network</p>
                  </li>
                </ul>
                <p class="italic text-base mt-1">
                  Workshop #2 — Not your keys. Not your coins! — How to store
                  Bitcoin in self-custody
                </p>
              </div>
              <div class="flex flex-col gap-2">
                <h3 class="text-xl font-semibold">3. The Revolution</h3>
                <ul class="flex flex-col gap-2">
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>An instrument of freedom</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>Regulatory framework</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>Opportunities for individuals and companies</p>
                  </li>
                </ul>
                <p class="italic text-base mt-1">
                  Workshop #3 — Fix the money. Fix the world! — How to use
                  Bitcoin in everyday life
                </p>
              </div>
            </div>
          </section>
          <section class="flex flex-col gap-4">
            <h2 class="text-xl sm:text-2xl uppercase font-medium">
              Included Resources
            </h2>
            <p>
              You will receive a practical booklet with a clear guide to
              securely storing your recovery phrase, avoiding irreversible
              losses, and following self-custody best practices.
            </p>
            <NuxtImg
              src="/folheto_en.jpeg"
              alt="Self-custody best practices booklet"
              class="w-full rounded-lg"
            />
          </section>
          <section class="flex flex-col gap-4">
            <h2 class="text-xl sm:text-2xl uppercase font-medium">
              Training Certificate
            </h2>
            <p>
              At the end of the course you will receive a
              <span class="font-bold">training certificate</span> issued by the
              Portuguese Bitcoin Institute.
            </p>
            <NuxtImg
              src="/diploma_en.jpeg"
              alt="Training certificate"
              class="w-full rounded-lg"
            />
          </section>
          <section class="flex flex-col gap-4">
            <h2 class="text-xl sm:text-2xl uppercase font-medium">
              The Trainers
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div class="flex flex-col gap-3">
                <NuxtImg
                  src="/formador_antonio.jpeg"
                  alt="António Neves da Silva"
                  class="w-full rounded-lg object-cover object-top aspect-square"
                />
                <h3 class="text-xl font-semibold">António Neves da Silva</h3>
                <p>Founder of MoT Inteligência Energética</p>
                <p>Former Director and Vice-President at Veolia</p>
                <p>
                  Postgraduate degree from MIT Portugal and Mechanical
                  Engineering degree from Instituto Superior Técnico
                </p>
              </div>
              <div class="flex flex-col gap-3">
                <NuxtImg
                  src="/formador_tomas.JPG"
                  alt="Tomás Mamede"
                  class="w-full rounded-lg object-cover object-top aspect-square"
                />
                <h3 class="text-xl font-semibold">Tomás Mamede</h3>
                <p>
                  Chairman of the General Assembly of the Portuguese Bitcoin
                  Institute
                </p>
                <p>Software Engineer at Mindera</p>
                <p>
                  MSc in Computer Science (AI) from the Faculty of Engineering,
                  University of Porto
                </p>
              </div>
            </div>
          </section>
          <section class="flex flex-col gap-4">
            <h2 class="text-xl sm:text-2xl uppercase font-medium">Logistics</h2>
            <ul class="flex flex-col gap-2">
              <li class="flex items-baseline gap-2">
                <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                <p>In-person only</p>
              </li>
              <li class="flex items-baseline gap-2">
                <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                <p>Maximum 10 participants</p>
              </li>
              <li class="flex items-baseline gap-2">
                <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                <p>8 hours (full day)</p>
              </li>
            </ul>
          </section>
          <section class="flex flex-col gap-4">
            <h2 class="text-xl sm:text-2xl uppercase font-medium">
              Registration
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div
                class="flex flex-col gap-2 border border-black p-6 rounded-[3px]"
              >
                <h3 class="text-xl font-semibold">For individuals</h3>
                <p class="font-bold">Bitcoin for Everyone (8h)</p>
                <p>3 practical workshops</p>
                <p class="text-2xl font-bold mt-2">
                  €200<span class="text-base font-normal"> (VAT included)</span>
                </p>
              </div>
              <div
                class="flex flex-col gap-2 border border-black p-6 rounded-[3px]"
              >
                <h3 class="text-xl font-semibold">For companies</h3>
                <p class="font-bold">Upon request</p>
                <p>Contact us for a tailored proposal</p>
              </div>
            </div>
          </section>
          <section class="flex flex-col gap-4">
            <h2 class="text-xl sm:text-2xl uppercase font-medium">
              The real goal
            </h2>
            <p>More than learning concepts, what matters is:</p>
            <ul class="flex flex-col gap-2">
              <li class="flex items-baseline gap-2">
                <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                <p>Feeling confident to use Bitcoin autonomously</p>
              </li>
              <li class="flex items-baseline gap-2">
                <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                <p>Avoiding common mistakes and unnecessary losses</p>
              </li>
              <li class="flex items-baseline gap-2">
                <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                <p>Protecting your money safely</p>
              </li>
            </ul>
            <p>
              And above all, staying connected with the IPB through our digital
              community, with ongoing access to people, knowledge sharing,
              events, and support throughout your journey.
            </p>
          </section>

          <!-- Registration form -->
          <section id="enrollment" class="flex flex-col gap-4 border-t pt-8">
            <h2 class="text-xl sm:text-2xl uppercase font-medium">Register</h2>
            <IPBTrainingEnrollment />
          </section>

          <!-- CTAs -->
          <section class="flex flex-col gap-4 border-t pt-8">
            <h2 class="text-xl sm:text-2xl uppercase font-medium">
              Have questions?
            </h2>
            <div class="flex flex-col sm:flex-row gap-4">
              <UiButton size="lg" href="mailto:info@institutobitcoin.pt">{{
                $t("training.cta.info")
              }}</UiButton>
              <UiButton
                size="lg"
                variant="outline"
                href="https://calendar.app.google/gyFsbCtUTmZBbgPt8"
                target="_blank"
                >{{ $t("training.cta.schedule") }}</UiButton
              >
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const { locale, t } = useI18n();

const baseUrl = "https://institutobitcoin.pt";
const pageUrl = computed(() =>
  locale.value === "en" ? `${baseUrl}/en/training` : `${baseUrl}/formacoes`
);
const ogImage = `${baseUrl}/curso.jpeg`;

useSeoMeta({
  description: t("training.seo.description"),
  ogDescription: t("training.seo.description"),
  ogImage,
  ogImageHeight: 630,
  ogImageWidth: 1200,
  ogTitle: t("training.seo.title"),
  ogType: "website",
  ogUrl: pageUrl.value,
  title: t("training.seo.title"),
  twitterCard: "summary_large_image",
  twitterDescription: t("training.seo.description"),
  twitterImage: ogImage,
  twitterTitle: t("training.seo.title"),
});

const isPt = computed(() => locale.value === "pt");

useHead({
  script: [
    // Course schema — enables Google rich results for courses (price, duration, provider)
    {
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Course",
        name: isPt.value ? "Bitcoin para Todos" : "Bitcoin for Everyone",
        description: isPt.value
          ? "Formação presencial de 8 horas sobre Bitcoin. Aprenda o essencial de forma simples e prática: história do dinheiro, tecnologia Bitcoin, auto-custódia e utilização no dia a dia."
          : "8-hour in-person Bitcoin training. Learn the essentials in a simple and practical way: history of money, Bitcoin technology, self-custody and everyday use.",
        url: pageUrl.value,
        image: ogImage,
        inLanguage: isPt.value ? "pt-PT" : "en-US",
        provider: {
          "@type": "Organization",
          name: "Instituto Português de Bitcoin",
          url: baseUrl,
        },
        offers: {
          "@type": "Offer",
          price: "200",
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          url: pageUrl.value,
        },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "onsite",
          courseWorkload: "PT8H",
          location: {
            "@type": "Place",
            address: { "@type": "PostalAddress", addressCountry: "PT" },
          },
        },
        teaches: isPt.value
          ? [
              "O essencial sobre Bitcoin",
              "Auto-custódia e segurança",
              "Como comprar e usar Bitcoin",
              "Rede Lightning",
              "Enquadramento regulamentar",
            ]
          : [
              "Bitcoin essentials",
              "Self-custody and security",
              "How to buy and use Bitcoin",
              "Lightning Network",
              "Regulatory framework",
            ],
        instructor: [
          {
            "@type": "Person",
            name: "António Neves da Silva",
            jobTitle: isPt.value
              ? "Fundador da MoT Inteligência Energética"
              : "Founder of MoT Inteligência Energética",
            image: `${baseUrl}/formador_antonio.jpeg`,
            worksFor: {
              "@type": "Organization",
              name: "Instituto Português de Bitcoin",
              url: baseUrl,
            },
          },
          {
            "@type": "Person",
            name: "Tomás Mamede",
            jobTitle: isPt.value
              ? "Presidente da Assembleia Geral do IPB"
              : "Chairman of the General Assembly of IPB",
            image: `${baseUrl}/formador_tomas.JPG`,
            worksFor: {
              "@type": "Organization",
              name: "Instituto Português de Bitcoin",
              url: baseUrl,
            },
          },
        ],
      }),
      type: "application/ld+json",
    },
    // BreadcrumbList
    {
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Instituto Português de Bitcoin",
            item: baseUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: isPt.value ? "Formações" : "Training",
            item: pageUrl.value,
          },
        ],
      }),
      type: "application/ld+json",
    },
    // FAQ schema — common questions answered in the page content
    {
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: isPt.value
          ? [
              {
                "@type": "Question",
                name: "O que vou aprender na formação Bitcoin para Todos?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Vai aprender o essencial sobre Bitcoin de forma simples e prática: como funciona, como comprar, como guardar em auto-custódia e como usar no dia a dia. A formação inclui 3 workshops práticos.",
                },
              },
              {
                "@type": "Question",
                name: "Qual é o preço da formação?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "A formação custa 200 € (IVA incluído) para particulares. Empresas e organizações podem contactar-nos para uma proposta personalizada.",
                },
              },
              {
                "@type": "Question",
                name: "Qual é a duração da formação?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "A formação tem a duração de 8 horas (dia inteiro), em formato presencial exclusivo, com um máximo de 16 participantes.",
                },
              },
              {
                "@type": "Question",
                name: "Recebo certificado no final?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Sim. No final do curso recebe um certificado de formação emitido pelo Instituto Português de Bitcoin.",
                },
              },
            ]
          : [
              {
                "@type": "Question",
                name: "What will I learn in the Bitcoin for Everyone training?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "You will learn the Bitcoin essentials in a simple and practical way: how it works, how to buy it, how to store it in self-custody, and how to use it in everyday life. The training includes 3 practical workshops.",
                },
              },
              {
                "@type": "Question",
                name: "What is the price of the training?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "The training costs €200 (VAT included) for individuals. Companies and organisations can contact us for a tailored proposal.",
                },
              },
              {
                "@type": "Question",
                name: "How long is the training?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "The training lasts 8 hours (full day), in an in-person format only, with a maximum of 16 participants.",
                },
              },
              {
                "@type": "Question",
                name: "Will I receive a certificate at the end?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. At the end of the course you will receive a training certificate issued by the Portuguese Bitcoin Institute.",
                },
              },
            ],
      }),
      type: "application/ld+json",
    },
  ],
});

function scrollToEnrollment() {
  document.querySelector("#enrollment")?.scrollIntoView({ behavior: "smooth" });
}
</script>
