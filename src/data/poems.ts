export interface Poem {
  id: string;
  title: string;
  authors: string;
  mandatoryWords: [string, string, string];
  coverUrl: string;
  audioUrl: string;
  sunoUrl: string;
  genre: string;
  duration: string;
  stanzas: string[];
  pedagogicalNote?: string;
  uploadedAudioName?: string;
  uploadedCoverName?: string;
}

export const POEMS_DATA: Poem[] = [
  {
    id: "1",
    title: "O Voo da Borboleta Estelar",
    authors: "Ana Clara & Pedro Henrique",
    mandatoryWords: ["Borboleta", "Estrela", "Amizade"],
    coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    sunoUrl: "https://suno.com/@turma301/borboleta-estelar",
    genre: "Bossa Nova Infantil Acústica",
    duration: "2:14",
    stanzas: [
      "Uma borboleta de asas de anil,\nVoou pelo céu mais bonito do Brasil.\nBateu asas perto da lua a brilhar,\nCom vontade infinita de dançar e sonhar.",
      "Lá no alto encontrou uma estrela dourada,\nQue piscava contente na noite gelada.\n'Vem cá, minha amiga, me dê sua mão,\nVamos espalhar luz em cada coração!'",
      "E assim nasceu a mais linda amizade,\nQue acende esperança em toda a cidade.\nBorboleta e estrela cantando a sorrir,\nUm laço sincero que nunca vai sumir!"
    ],
    pedagogicalNote: "As palavras 'Borboleta', 'Estrela' e 'Amizade' foram integradas nas rimas finais das estrofes."
  },
  {
    id: "2",
    title: "O Robô Amarelo do Jardim",
    authors: "Lucas Gabriel & Sofia Maria",
    mandatoryWords: ["Robô", "Girassol", "Alegria"],
    coverUrl: "https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&w=800&q=80",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    sunoUrl: "https://suno.com/@turma301/robo-amarelo",
    genre: "Pop Divertido & Xilofone",
    duration: "1:58",
    stanzas: [
      "No meio das flores vivia um robô,\nFeito de latinha que o vento soprou.\nEle tinha botões e antena a piscar,\nE gostava de água para regar.",
      "Todo dia abraçava o belo girassol,\nQue abria pétalas voltadas pro sol.\nGirava e cantava em tom afinado,\nDeixando o jardim todinho encantado.",
      "Sua maior engrenagem era a alegria,\nFuncionava tão bem de noite e de dia.\nQuem passava por perto queria aprender\nQue com carinho é tão bom viver!"
    ],
    pedagogicalNote: "A dupla explorou ritmo ternário e rimas entre elementos tecnológicos e a natureza."
  },
  {
    id: "3",
    title: "A Baleia e o Picolé Mágico",
    authors: "Enzo Gabriel & Valentina Luz",
    mandatoryWords: ["Baleia", "Picolé", "Aventura"],
    coverUrl: "https://images.unsplash.com/photo-1568430462989-44163eb1752f?auto=format&fit=crop&w=800&q=80",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    sunoUrl: "https://suno.com/@turma301/baleia-picole",
    genre: "Reggae Praiano Suave",
    duration: "2:25",
    stanzas: [
      "No fundo do oceano de azul sem igual,\nNadava feliz uma enorme baleia real.\nEla dava saltos, espirrava água no ar,\nConvidando os peixinhos para festejar.",
      "Um dia encontrou em cima do mar\nUm doce picolé que não ia derreter nem queimar.\nEra de morango com sabor de maré,\nE dava cócegas na ponta do pé!",
      "Começou então uma grande aventura,\nNavegando nas ondas cheias de doçura.\nCom risada e mistério em cada cantinho,\nO mar virou festa pra todo bichinho."
    ],
    pedagogicalNote: "Poema com imagens sensoriais vívidas e metáforas sobre o oceano e doces da infância."
  },
  {
    id: "4",
    title: "O Segredo do Livro Encantado",
    authors: "Maria Eduarda & Davi Lucca",
    mandatoryWords: ["Castelo", "Coruja", "Imaginação"],
    coverUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    sunoUrl: "https://suno.com/@turma301/livro-encantado",
    genre: "Balada Fantástica Acústica",
    duration: "2:40",
    stanzas: [
      "Num topo bem alto ergueu-se um castelo,\nCom torres douradas e manto amarelo.\nNas noites de névoa acendia um clarão,\nGuardando as histórias deste meu rincão.",
      "Na janela pousava uma sábia coruja,\nCom olhos redondos que o mistério debruça.\nEla abria os livros de capa enfeitada,\nE lia poemas para a meninada.",
      "Bastava uma gota de imaginação\nPra voar no tapete sem medo do chão.\nQuem lê com carinho descobre o poder\nDe mundos mágicos no peito nascer!"
    ],
    pedagogicalNote: "Trabalho primoroso com estrofes regulares de 4 versos (quadras) valorizando a leitura."
  },
  {
    id: "5",
    title: "A Corrida de Joaninhas",
    authors: "Beatriz Helena & Miguel Arcanjo",
    mandatoryWords: ["Joaninha", "Melancia", "Música"],
    coverUrl: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=800&q=80",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    sunoUrl: "https://suno.com/@turma301/corrida-joaninhas",
    genre: "Samba Lúdico com Flauta",
    duration: "2:05",
    stanzas: [
      "Bem cedo acordou a pequina joaninha,\nCom sete pintinhas na sua roupinha.\nCalçou seus sapatinhos feitos de folhinha,\nE foi correndo ver a vizinha.",
      "No meio do caminho achou melancia,\nFresquinha e vermelha que nem alegria.\nAs formigas tocaram com animação,\nFazendo do lanche um baita bailão.",
      "O bosque inteiro virou só canção,\nCom música boa e vibração no chão.\nQuem dança contente esquece a fadiga,\nE faz da floresta a melhor amiga!"
    ],
    pedagogicalNote: "Musicalidade viva e ritmo acelerado, estimulando aliterações em /j/ e /m/."
  },
  {
    id: "6",
    title: "O Dragão e o Vaga-lume",
    authors: "Laura Beatriz & Bernardo Silva",
    mandatoryWords: ["Dragão", "Vaga-lume", "Coragem"],
    coverUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    sunoUrl: "https://suno.com/@turma301/dragao-vagalume",
    genre: "Pop Orquestrado Suave",
    duration: "2:30",
    stanzas: [
      "Morava na serra um jovem dragão,\nQue tinha escamas mas não soltava vulcão.\nEle tinha vergonha de ter tanto frio,\nE de ter medo da noite no rio.",
      "Chegou pelo ar um amigo brilhante,\nUm doce vaga-lume com luz cintilante.\n'Não tema o escuro, olhe pra mim,\nMeu pisca-pisca ilumina o jardim!'",
      "Descobriu no abraço a linda coragem,\nQue vence qualquer assustadora miragem.\nHoje eles voam sem medo do breu,\nContando histórias pro céu que acolheu."
    ],
    pedagogicalNote: "Poema que trabalha inteligência socioemocional, superação de medos e empatia."
  }
];
