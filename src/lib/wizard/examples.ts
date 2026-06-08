// Exemplos pré-definidos pro botão "Usar exemplo" do wizard.
// 10 variações por campo. O botão cicla pelo array (clique de novo → próximo).
// Conteúdo estático — não bate no banco, não consome quota.

import type { Section } from "./schemas";

// Apenas apelidos carinhosos — sem nomes próprios de pessoas.
export const EXAMPLE_RECIPIENT_NAMES: string[] = [
  "meu amor",
  "minha rainha",
  "meu bem",
  "amor da minha vida",
  "meu mozão",
  "meu anjo",
  "minha princesa",
  "meu tudo",
  "minha vida",
  "meu coração",
];

export const EXAMPLE_TITLES: string[] = [
  "Pra você, meu amor",
  "O amor da minha vida",
  "Tudo começou com você",
  "Pra minha pessoa favorita",
  "Feita com todo meu carinho",
  "Nosso pedacinho de céu",
  "Pra sempre, eu e você",
  "Porque te amo todo dia",
  "Minha sorte foi te encontrar",
  "Pra quem é meu mundo inteiro",
];

export const EXAMPLE_MESSAGES: string[] = [
  "Desde o dia em que te conheci, minha vida ganhou outra cor 🌈 Você é meu lugar favorito, meu sorriso de toda manhã ☀️ e o amor que eu escolho todos os dias. Obrigado por existir 💕",
  "Não importa quantos anos passem, eu sempre vou olhar pra você do mesmo jeito de quando me apaixonei 😍 Você é a melhor parte dos meus dias e o melhor plano dos meus sonhos ✨",
  "Te amar é a coisa mais fácil que eu já fiz 🥰 Com você eu aprendi que lar não é um lugar, é uma pessoa — e a minha é você 🏡 Obrigado por cada abraço, cada risada e cada 'fica mais um pouquinho' 🤗",
  "Você chegou e desarrumou tudo do jeito mais lindo possível 💫 Hoje não sei mais viver sem suas manias, seu cheiro e esse seu jeito que me faz querer ser melhor. Te amo demais ❤️",
  "Se eu pudesse escolher de novo, escolheria você outras mil vezes 💖 Cada momento ao seu lado vale mais que qualquer coisa. Essa página é só um pedacinho do tanto que eu te amo 🥹",
  "Obrigado por ser meu porto seguro nos dias difíceis ⚓ e minha companhia nas melhores risadas 😂 Você é o amor que eu sonhei e nem sabia que existia. Pra sempre é pouco com você 💞",
  "Você é a primeira coisa em que penso quando acordo 🌅 e o último sorriso antes de dormir 🌙 Construir a vida ao seu lado é o presente mais bonito que eu já ganhei 🎁 Te amo, hoje e sempre 💗",
  "Não existem palavras suficientes pra dizer o tamanho do que eu sinto 🫶 Então fiz essa página pra tentar — em cada foto 📸, em cada linha, tem um pedaço do meu amor por você 💌",
  "Com você até o comum vira especial ✨ Um café ☕, uma música 🎶, um silêncio: tudo fica melhor quando é a seu lado. Que sorte a minha de te ter. Que privilégio te amar 🍀",
  "Você é a resposta de oração que eu nem sabia que tinha feito 🙏 Meu amor, minha paz, minha pessoa 💑 Obrigado por escolher caminhar a vida comigo. Eu te amo mais a cada dia 💘",
];

// Datas plausíveis de início (ISO, sempre no passado). Inclui datas marcantes.
export const EXAMPLE_DATES: string[] = [
  "2023-02-14",
  "2022-06-12",
  "2021-12-25",
  "2024-01-01",
  "2023-09-30",
  "2020-10-15",
  "2022-03-08",
  "2023-07-07",
  "2021-05-20",
  "2024-02-14",
];

// 10 conjuntos de seções extras (cada um com 2 seções prontas pra editar).
export const EXAMPLE_SECTIONS: Section[][] = [
  [
    { title: "Por que você é especial 🌹", body: "Porque você me entende sem eu precisar explicar 🫶, me apoia nos dias difíceis e comemora comigo cada conquista 🎉 Você é única." },
    { title: "O que mais amo em você 💗", body: "Amo seu jeito de cuidar das pessoas 🤗, seu sorriso que ilumina qualquer ambiente ☀️ e a forma como você me faz sentir em casa 🏡" },
  ],
  [
    { title: "Momento favorito ⭐", body: "Aquele dia comum que virou inesquecível só porque você estava lá 🥰 É nesses pequenos momentos que percebo o tamanho do meu amor 💞" },
    { title: "Nossos sonhos ✨", body: "Quero viajar o mundo com você ✈️, construir um lar cheio de risadas 😂 e envelhecer de mãos dadas 👵👴 Todos os meus planos têm você dentro." },
  ],
  [
    { title: "Por que você é especial 🌹", body: "Porque você me entende sem eu precisar explicar 🫶, me apoia nos dias difíceis e comemora comigo cada conquista 🎉 Você é única." },
    { title: "Nossa história 📖", body: "Tudo começou de um jeito tão simples e hoje é a coisa mais importante da minha vida ❤️ Obrigado por cada capítulo dessa história." },
  ],
  [
    { title: "O que mais amo em você 💗", body: "Seu carinho, sua paciência e esse seu jeitinho que só você tem 🥹 Eu me apaixono por detalhes seus todos os dias 😍" },
    { title: "Nossos sonhos ✨", body: "Sonho com cada manhã ao seu lado 🌅, com as viagens que ainda vamos fazer 🗺️ e com a vida linda que estamos construindo juntos 💑" },
  ],
  [
    { title: "Nossa história 📖", body: "Quem diria que aquele encontro mudaria tudo 💫 Você virou meu melhor amigo, meu amor e minha pessoa favorita no mundo 🌍" },
    { title: "Momento favorito ⭐", body: "Não consigo escolher só um 🤔 — mas todo abraço seu no fim de um dia cansado já vale a vida inteira 🤗" },
  ],
  [
    { title: "Por que você é especial 🌹", body: "Você tem um coração enorme 💛 e um jeito de amar que me faz acreditar em coisas boas 🍀 Sou uma pessoa melhor desde que te conheci." },
    { title: "Nossos sonhos ✨", body: "Quero compartilhar com você todos os planos, grandes e pequenos 💭 O futuro fica bonito quando imagino você nele 🌟" },
  ],
  [
    { title: "Nossa história 📖", body: "Foram tantos momentos até aqui 🕰️, e cada um deles me trouxe mais perto de você. Essa história é a minha favorita de todas 💕" },
    { title: "O que mais amo em você 💗", body: "Amo como você me olha 👀, como você ri das minhas bobagens 😆 e como você transforma qualquer dia ruim em algo melhor 🌈" },
  ],
  [
    { title: "Momento favorito ⭐", body: "Aquela viagem ✈️, aquela música tocando 🎶, você do meu lado. Guardo esse momento no coração 💝 como um dos mais felizes da minha vida." },
    { title: "Por que você é especial 🌹", body: "Porque com você tudo faz sentido 🫶 Você é o tipo de amor que a gente só encontra uma vez e segura pra sempre 🔒❤️" },
  ],
  [
    { title: "Nossos sonhos ✨", body: "Quero uma vida inteira de pequenos planos com você: cafés da manhã ☕, viagens 🧳, e aquele 'a gente conseguiu' lá na frente 🏆" },
    { title: "Nossa história 📖", body: "Cada fase que vivemos me ensinou que vale a pena 💪 Obrigado por construir tudo isso comigo, dia após dia 🧱❤️" },
  ],
  [
    { title: "O que mais amo em você 💗", body: "Amo sua força 💪, sua doçura 🍯 e a maneira como você cuida de tudo o que ama — inclusive de mim. Você é o meu lugar seguro 🫂" },
    { title: "Momento favorito ⭐", body: "O melhor momento é sempre o próximo 🔜, porque sei que será ao seu lado. E isso já me deixa o coração cheio 💖" },
  ],
];
