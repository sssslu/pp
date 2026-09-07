import type { Translations } from "./ko";

export const en: Translations = {
  tabs: ["About", "Stats!", "Projects", "Hobbies", "Gallery"],

  hero: {
    title: "Profile : Slu Park",
    subtitle: "Caution : This person is bored",
  },

  about: {
    educationTitle: "Education & Career",
    experienceTitle: "Experience",
    edu: {
      line1: { before: "- Graduated from ", between: " / Active in ", after: " — multiple awards" },
      line2: { before: "- Graduated from ", between: " — ", after: "" },
      line3: { before: "- ", after: " — Honorably discharged" },
      line4: { before: "- ", after: " — Researcher" },
      line5: { before: "- Worked at ", between: " in a ", after: " role" },
    },
    exp: {
      line1: { before: "- Used ", mid1: " and automation systems to build and operate a ", mid2: ". ", after: "" },
      line2: "- Designed and deployed mobile apps for iOS and Android.",
      line3: { before: "- Maintained ", mid1: "'s library program ", mid2: " and ", mid3: "'s high-speed scanning program ", after: "." },
      // ko와 슬롯 순서가 뒤집혀 있어(ko: 장소→역할, en: 역할→장소) 같은 인자를 넣으면
      // 의미가 달라졌다. ko 순서에 맞추고 edu.line5의 "Worked at ... in a ... role" 어투를 재사용
      line4: { before: "- Worked at ", mid: " in various ", after: " roles." },
      line5: { before: "- Performed ", mid1: " at a ", mid2: " under ", after: "." },
      line6: { before: "- Worked as a ", after: "!" },
    },
  },

  perk: {
    strengthsTitle: "Strengths",
    strengths: ["Creativity", "Reliability", "Fluent in English / Korean"],
    stackTitle: "Stack",
    dbSkill: "SQL & CRUD (DB)",
  },

  projects: {
    featuredBadge: "FEATURED",
    visit: "Visit",
    featured: [
      {
        title: "FreeHWP",
        description:
          "A free tool to read and edit HWP (Hangul) and PDF files — with various office features built in.",
        url: "https://freehwp.com",
      },
      {
        title: "everLae Note",
        description:
          "A free version of Evernote. No ads, no payments, no limits. Built out of frustration with today's subscription-everything trend.",
        url: "https://everlae.app",
      },
      {
        title: "RallyMaster",
        description:
          "A web app for studying badminton doubles rotation. Also released as a mobile app.",
        url: "https://www.rallymaster.app",
      },
      {
        title: "WinPiano",
        description:
          "A Windows-based, zero-latency piano that makes music production effortless.",
        url: "https://www.youtube.com/@beeeflat",
      },
    ],
    descriptions: {
      "Feed the Black Hole":
        "Feed the black hole to support slu. A beautiful sponsorship page. (sleekmoodkr.com)",
      "nbidiaGLM":
        "A chatbot harness powered by an LLM served through NVIDIA.",
      "TSLAhunter":
        "A CLI program that analyzes market conditions per ticker and gives buy / sell recommendations.",
      "CryptoHunter":
        "A system integrating real-time data collection, GPT-based strategy judgment, and automated order execution — with logging and risk management. Bottom line: didn't get rich.",
      "Andong Jang Clan Namhae Genealogy":
        "An online genealogy program for the Andong Jang clan of Namhae, built with recursive functions, NoSQL DB, and Node.js. The first web app to render genealogy as a tree.",
      "Auto Piano":
        "A highly responsive piano built with an ATMega microprocessor and C. Connect to a computer and play via keyboard input through Putty.",
      "AI Localization PJ":
        "Local deployment of Deepseek 8b/14b using ollama, open-source Deepseek, and an RTX 4080 SUPER GPU.",
      "Trafficjam2":
        "An experimental simulator using Java to precisely model car objects and visualize the causes of traffic congestion in the console.",
      "Everlae Note":
        "An Eisenhower Matrix-based memo/checklist app built with Flutter — designed as a critique of Evernote's complexity. (My parents use it too)",
      "Tactile Transmitter":
        "A project using Arduino, wires, and motors to build a grid that transmits tactile input from one end to the user. Quite innovative at the time...",
      "KakaoTalt":
        "A Flutter app that bypassed KakaoTalk's COVID vaccine-pass verification — a simple visual deception app.",
      "Supports":
        "Designed and built part of the frontend for Supports, a sports platform mobile app. Handled social login using Firebase Auth.",
      "L to L":
        "An LLM-to-LLM debate system. ChatGPT and Gemini debate a new topic every day using each company's API. Interesting debates available to browse.",
      "CarRentService":
        "A simple Flutter-based web app for a car rental business, designed to serve foreign customers.",
      "Project SSS":
        "Slu Sphere Server — personal utility services including basic tools like the page-view counter at the bottom of this page. Built with MongoDB + Node.js.",
      "PP": "Project Portfolio. The Flutter-based static web service you're viewing right now ^^ — Updated 2026/03/01: Not anymore.",
    },
  },

  hobby: {
    freedivingTitle: "Freediving (Certified Instructor & International Judge)",
    freedivingContent: `Around 2022, I got into freediving — a sport that pushes you to your absolute limits.

Earned the following certifications sequentially:
- SNSI Indoor Freediver
- Freediver
- Advanced Freediver
- Deep Freediver

Then obtained instructor certifications:
- Freediver Instructor
- Advanced Freediver Instructor

Working as an affiliated instructor at Onedive Freediving Center,
having certified 100+ Korean and foreign students.

- BLSD First Aid, EFR Life Savior and other lifesaving certifications.
- CMAS International Finswimming Federation — Judge Level 3
- Served as underwater referee at the 2026 KUA National Team Selection Tournament.`,
    artTitle: "Drawing, Artwork & Design",
    artContent: "I have artistic sensibility!! (self-claimed, no formal credentials — see Gallery)",
    diverLabel: "me!",
    whaleLabel: "sperm whale",
    photoAlt: "A freediver (me) swimming alongside a sperm whale — shot underwater",
  },

  contact: {
    title: "Contact",
    copiedPrefix: "Contact Copied! : ",
  },

  gallery: {
    title: "Gallery",
    back: "Back",
    categories: {
      school: "School Days",
      cert: "Certificates",
      military: "Military",
      work: "Work",
      project: "Projects",
      hobby: "Hobbies",
      artwork: "Artwork",
      travel: "Travel",
      misc: "Misc",
    },
    captions: {
      "school-idphoto": "ID photo",
      "school-young": "When I was little",
      "school-steam": "Changwonnam High STEAM national competition",
      "school-seoultech": "Seoul National University of Science and Technology",
      "school-grad": "Graduation",

      "cert-diploma": "Graduation certificate",
      "cert-military": "Certificate of military service",
      "cert-afi": "Advanced Freediver Instructor certification",
      "cert-aida": "AIDA Freediving Instructor certification",
      "cert-blsd": "BLSD Instructor certification",
      "cert-cmas": "Earned CMAS international judge certification",
      "cert-misc-dive": "Other underwater certifications",
      "cert-opic": "OPIc",

      "mil-enlist": "KATUSA - enlisted as Yongsan Military Police",
      "mil-hmmwv": "HMMWV",
      "mil-figuerra": "Sgt Figuerra",
      "mil-pmo": "PMO",
      "mil-m9": "My M9",
      "mil-m4": "Inside the M4",
      "mil-me": "me",
      "mil-almanza": "PVT Almanza",
      "mil-agosto": "PVT Agosto",
      "mil-fierce": "PVT Fierce",

      "work-taehwa-nh": "TaehwaInnovation tablet software development (NongHyup)",
      "work-taehwa": "TaehwaInnovation",
      "work-quit": "Resignation",
      "work-bali1": "BITGET 2023 Bali business trip",
      "work-bali2": "BITGET 2023 Bali business trip 2",
      "work-bali3": "BITGET 2023 Bali business trip 3",
      "work-wdf": "BITGET WDF 2023 business trip",

      "pj-autopiano": "auto piano",
      "pj-trafficjam2": "trafficjam2",
      "pj-trafficlight": "Smart traffic light",
      "pj-everlae": "Everlae Note",
      "pj-genealogy": "Online genealogy",
      "pj-rscorp": "Startup RS corp",
      "pj-cryptohunter": "crypto hunter",
      "pj-ltol": "GPT vs Gemini debate program",
      "pj-supports": "Supports",
      "pj-sss": "Project SSS",

      "hob-talent": "Freediving, an unexpected talent discovered",
      "hob-certs": "Earned countless freediving certifications",
      "hob-guide": "Led countless overseas trips",

      "art-license1": "Artwork - I Don't Wanna Get a Class-1 Driver's License 1",
      "art-license2": "Artwork - I Don't Wanna Get a Class-1 Driver's License 2",
      "art-absolve1": "Artwork - Absolve the Sins",
      "art-absolve2": "Artwork - Absolve the Sins 2",

      "trv-countries": "Travel - countless countries",
      "trv-divetour": "Freediving tours - countless countries",

      "misc-flutter": "This portfolio page is a FLUTTER web app! Updated 2026/03/01 - not Flutter anymore",
      "misc-noai": "Built it myself from start to finish, no references! Updated 2026/03/01 - now the AI...on its own...",
    },
  },
};
