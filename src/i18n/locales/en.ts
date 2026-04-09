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
      line4: { before: "- Participated in various ", mid: " at a ", after: "." },
      line5: { before: "- Performed ", mid1: " at a ", mid2: " under ", after: "." },
      line6: { before: "- Worked as a ", after: "!" },
    },
  },

  perk: {
    strengthsTitle: "Strengths",
    strengths: ["Creativity", "Reliability", "Fluent in English / Korean"],
    stackTitle: "Stack",
  },

  projects: {
    descriptions: {
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
  },

  contact: {
    title: "Contact",
    copiedPrefix: "Contact Copied! : ",
  },
};
