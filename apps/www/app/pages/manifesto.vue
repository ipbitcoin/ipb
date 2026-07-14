<template>
  <main class="px-8">
    <div class="max-w-screen-xl mx-auto flex flex-col mb-12 mt-20 gap-4 px-8">
      <h1 class="text-6xl sm:text-7xl font-light max-w-3xl text-balance">
        {{ $t("nav.manifest") }}
      </h1>
      <p
        v-for="p in locale === 'pt' ? manifestPt : manifestEn"
        class="text-lg max-w-3xl"
        :class="[p.startsWith('*') ? '' : 'py-2']"
      >
        {{ p }}
      </p>
      <div class="flex flex-col">
        <p class="text-lg">Tomás Mamede</p>
        <p class="text-lg">
          {{
            new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-US", {
              dateStyle: "long",
            }).format(new Date("2025-06-28"))
          }}
        </p>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
const { locale, t } = useI18n();

useSeoMeta({
  description:
    locale.value === "pt"
      ? "O compromisso do IPB com a soberania financeira, educação sobre Bitcoin e o futuro digital de Portugal."
      : "The IPB's commitment to financial sovereignty, Bitcoin education and the digital future of Portugal.",
  ogDescription:
    locale.value === "pt"
      ? "O compromisso do IPB com a soberania financeira, educação sobre Bitcoin e o futuro digital de Portugal."
      : "The IPB's commitment to financial sovereignty, Bitcoin education and the digital future of Portugal.",
  ogTitle: locale.value === "pt" ? "Manifesto | IPB" : "Manifest | IPB",
  title: locale.value === "pt" ? "Manifesto" : "Manifest",
  twitterDescription:
    locale.value === "pt"
      ? "O compromisso do IPB com a soberania financeira, educação sobre Bitcoin e o futuro digital de Portugal."
      : "The IPB's commitment to financial sovereignty, Bitcoin education and the digital future of Portugal.",
  twitterTitle: locale.value === "pt" ? "Manifesto | IPB" : "Manifest | IPB",
});

const manifestPt = [
  "Uma sociedade próspera, justa e ética tem como base dinheiro honesto. Quando as pessoas, as famílias, as empresas e os países têm a oportunidade de poupar num meio monetário neutro, conservador, descentralizado e cuja emissão não depende de uma autoridade central, adquirem um nível de liberdade e soberania sob o seu próprio destino, que não é possível quando a emissão de dinheiro e a política monetária a ele associada está sob a alçada de governos e bancos centrais.",
  "A história mostra-nos que, sempre que existiu a oportunidade, governos de todo o mundo procuraram exercer controlo sobre o dinheiro e ativos dos seus cidadãos de forma a controlar, coagir e exercer a autoridade necessária para assegurar a sua manutenção no poder. Uma das formas mais eficazes de conquistar a obediência da população é através da ameaça de restrição de acesso à energia monetária que permite fazer face às necessidades básicas de qualquer ser humano: comida, água e abrigo.",
  "Durante milénios, ouro e terras foram usadas como dinheiro. Foi desta forma que muitas dinastias compraram a lealdade e obediência dos seus súbditos e se mantiveram no poder durante várias gerações. A população só detinha o seu poder económico enquanto fosse conveniente para quem estava no poder e detinha o monopólio da força e poder militar. Portanto, durante vários séculos o direito de custódia e a resistência à censura dos meios monetários disponíveis para o ser humano sempre foram fracos.",
  "Com o aparecimento da Internet, que permitiu a digitalização do sistema bancário, e com a hiper-financialização dos mercados de capitais, o dinheiro adquiriu uma velocidade enorme e, atualmente, todas as horas centenas de milhares de milhões de dólares, euros e yuans circulam pela rede bancária mundial. No entanto, a energia económica do mundo inteiro tornou-se cada vez mais centralizada e sob a custódia de alguns grandes bancos centrais e instituições financeiras, que usam esse controlo para coagir e manipular as populações que afirmam proteger. Fazem-no através do controlo de capitais, manipulação artificial das taxas de juro e inflação da quantidade de dinheiro existente na economia, que roubam o poder de compra das populações ano após ano.",
  'Deste modo, não podemos esperar que governos e grandes bancos cedam o controlo do dinheiro voluntariamente. As vantagens e tentações são demasiado grandes para que isso aconteça de livre e espontânea vontade. Como disse F. A. Hayek em 1984: "Não acredito que algum dia teremos novamente um bom dinheiro antes de tirarmos a coisa das mãos do governo, ou seja, não podemos tirá-la violentamente das mãos do governo, tudo o que podemos fazer é, de alguma forma astuta e indireta, introduzir algo que eles não possam impedir.". Atualmente, existe uma alternativa: Bitcoin.',
  "A Bitcoin é uma tecnologia emergente e revolucionária que devolve às pessoas a sua soberania financeira e o direito de transacionar livremente sem depender de uma autoridade ou intermediário que autorize e valide a transação. Para além disso, qualquer pessoa volta a ter a capacidade de custodiar a sua própria energia monetária de uma forma que não pode ser travada, roubada ou confiscada. Tudo isto acontece de uma forma descentralizada e peer-to-peer, através de uma rede de computadores composta por nós soberanos, operacionais 24 horas por dia, 7 dias por semana.  Por sua vez, estes nós implementam um protocolo conservador, que impede a inflação do ativo Bitcoin e que garante um número máximo de 21 milhões de unidades em circulação.",
  "Por isso, é a missão do Instituto Português de Bitcoin (IPB) representar os interesses da rede Bitcoin e dos bitcoiners em Portugal. É o nosso dever defender a ideologia manifestada pelo protocolo da Bitcoin (descentralização, soberania, liberdade, transparência e segurança) e o direito de todos os detentores deste ativo de manterem a custódia das suas bitcoins e respectivas chaves privadas e executarem a implementação do protocolo que bem entenderem no seu próprio hardware.",
  "Em última instância, a Bitcoin é apenas tão forte quanto as pessoas que decidem dedicar o seu tempo e recursos monetários e energéticos à rede. Deste modo, o IPB deverá:",
  "* Ser o rosto da Bitcoin em Portugal;",
  "* Empenhar-se na educação pedagógica do público, das empresas e da classe política;",
  "* Suportar o governo no desenvolvimento de leis e regulações benéficas para a Bitcoin em Portugal e na Europa;",
  "* Desenvolver investigação e partilhar conhecimento fidedigno de modo a combater a desinformação que circula sobre Bitcoin;",
  "* Promover o estabelecimento de uma reserva estratégica de Bitcoin em Portugal;",
  "* Criar condições para que a indústria de Bitcoin, em particular, a mineração floresça em Portugal e atraía empresas e capital para o país.",
  "O IPB acredita que o desenvolvimento e avanço de Portugal enquanto nação depende da forma como o país abraçará tecnologias emergentes como a Bitcoin. O posicionamento correto face a esta tecnologia cria a oportunidade de desenvolvimento económico, tecnológico e assegura a soberania de Portugal enquanto nação independente com quase nove séculos de história.",
  "Reconhecemos que os nossos objetivos são ambiciosos mas, tal como há quinhentos anos, quando Portugal iniciou a época dos descobrimentos, acreditamos que o país deverá estar na vanguarda tecnológica desta inovação sem precedentes na História, e que os seus cidadãos deverão viver numa sociedade livre onde cada indivíduo tem controlo total sobre o seu capital e onde o direito a transacionar livremente se encontra assegurado.",
  "Em suma, o protocolo da Bitcoin assegura um sistema financeiro honesto e justo para milhares de milhões de pessoas em todo o mundo. Por isso, é fundamental defendê-lo e promover o seu crescimento e adoção em Portugal.",
];

const manifestEn = [
  "A prosperous, just, and ethical society is based on honest money. When people, families, companies, and countries have the opportunity to save in a neutral, conservative, decentralized monetary medium whose issuance does not depend on a central authority, they acquire a level of freedom and sovereignty over their own destiny that is not possible when money issuance and the monetary policy associated with it are under the control of governments and central banks.",
  "History shows us that whenever the opportunity has arisen, governments around the world have sought to exercise control over their citizens' money and assets in order to control, coerce, and exert the authority necessary to maintain themselves in power. One of the most effective ways of achieving obedience from the population is through the threat of restricting access to the monetary energy that enables them to meet the basic needs of any human being: food, water, and shelter.",
  "For millennia, gold and land were used as money. It was in this way that many dynasties bought the loyalty and obedience of their subjects and remained in power for several generations. The population only retained its economic power as long as it was convenient for those in power, who held the monopoly on force and military power. Therefore, for several centuries, the rights of custody and resistance to censorship of the monetary means available to human beings were always weak.",
  "With the advent of the Internet, which enabled the digitization of the banking system, and with the hyper-financialization of capital markets, money acquired enormous speed, and today hundreds of billions of dollars, euros, and yuan circulate through the global banking network every hour. However, the world's economic energy has become increasingly centralized and under the custody of a few major central banks and financial institutions, which use this control to coerce and manipulate the very populations they claim to protect. They do so through capital controls, artificial manipulation of interest rates, and inflation of the money supply, which robs populations of purchasing power year after year.",
  `Thus, we cannot expect governments and large banks to give up control of money voluntarily. The advantages and temptations are too great for that to happen freely and willingly. As F. A. Hayek said in 1984: "I don't believe we shall ever have a good money again before we take it out of the hands of government, that is, we can't take it violently out of the hands of government, all we can do is by some sly roundabout way introduce something that they can't stop." Today, there is an alternative: Bitcoin.`,
  "Bitcoin is an emerging and revolutionary technology that gives people back their financial sovereignty and the right to transact freely without depending on an authority or intermediary to authorize and validate the transaction. Moreover, anyone once again has the ability to custody their own monetary energy in a way that cannot be stopped, stolen, or confiscated. All of this happens in a decentralized, peer-to-peer manner, through a network of computers composed of sovereign nodes operating 24 hours a day, 7 days a week. In turn, these nodes implement a conservative protocol that prevents inflation of the Bitcoin asset and guarantees a maximum of 21 million units in circulation.",
  "Therefore, it is the mission of the Portuguese Bitcoin Institute (IPB) to represent the interests of the Bitcoin network and bitcoiners in Portugal. It is our duty to defend the ideology manifested by the Bitcoin protocol (decentralization, sovereignty, freedom, transparency, and security) and the right of all holders of this asset to maintain custody of their bitcoins and respective private keys, and to run the implementation of the protocol they deem appropriate on their own hardware.",
  "Ultimately, Bitcoin is only as strong as the people who decide to dedicate their time, financial, and energy resources to the network. Thus, the IPB shall:",
  "* Be the face of Bitcoin in Portugal;",
  "* Commit to pedagogical education of the public, companies, and the political class;",
  "* Support the government in developing laws and regulations beneficial to Bitcoin in Portugal and Europe;",
  "* Conduct research and share reliable knowledge in order to combat the misinformation circulating about Bitcoin;",
  "* Promote the establishment of a strategic Bitcoin reserve in Portugal;",
  "* Create conditions for the Bitcoin industry, particularly mining, to flourish in Portugal and attract companies and capital to the country.",
  "The IPB believes that Portugal's development and progress as a nation depends on how the country embraces emerging technologies such as Bitcoin. The correct stance toward this technology creates opportunities for economic and technological development and ensures the sovereignty of Portugal as an independent nation with nearly nine centuries of history.",
  "We recognize that our objectives are ambitious but, just as five hundred years ago when Portugal initiated the Age of Discoveries, we believe the country should be at the technological forefront of this unprecedented innovation in History, and that its citizens should live in a free society where each individual has full control over their capital and where the right to transact freely is guaranteed.",
  "In short, the Bitcoin protocol ensures an honest and fair financial system for billions of people around the world. Therefore, it is essential to defend it and promote its growth and adoption in Portugal.",
];
</script>
