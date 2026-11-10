/** Game-center content for the 31 Dec 2025 final, taken from the public Spengler Cup page. */

const SOURCE_URL =
  "https://www.spenglercup.ch/en/game/spengler-cup/playoff-final/2025-12-31_us-collegiate-selects_hc-davos";

export const logos = {
  home: "https://cdn.spenglercup.ch/sites/default/files/styles/spielplan_logos/public/team/2025-06/SC-NCAA-Wappen-Logo-rot.png.webp?itok=dBbBp2b6",
  away: "https://cdn.spenglercup.ch/sites/default/files/styles/spielplan_logos/public/team/2024-11/HCD_Logo_600x600px.png.webp?itok=EtjHSCdr",
  hero: "https://backend.spenglercup.ch/sites/default/files/styles/bootstrap_fix_greater_xl/public/2024-11/davos.jpg.webp?h=1badefd3&itok=GRqARAih",
};

export const banners = [
  {
    alt: "UBS Key Player",
    src: "https://cdn.spenglercup.ch/sites/default/files/styles/default/public/2025-11/06_UBS_Keyplayer_Banner_GameCenter_600x830_static_E_V1.png.webp?itok=VisKxfr0",
  },
  {
    alt: "Schenker Storen",
    src: "https://cdn.spenglercup.ch/sites/default/files/styles/default/public/2025-12/SSAG_Spengler_VipTickets_WebsiteBanner_EN-2_600x840.jpg.webp?itok=B2Tn47ao",
  },
];

export const game = {
  date: "31.12.2025",
  time: "12:10",
  arena: "zondacrypto-Arena, 7270 Davos-Platz GR",
  home: "U.S. Collegiate Selects",
  away: "HC Davos",
  score: "3:6",
  periods: "(1:2;2:1;0:3)",
  status: "Spielende",
  updated: "07.11.2026 09:36",
};

export const sides = ["home", "away"] as const;

export type Side = (typeof sides)[number];

export const codes: Record<Side, string> = { home: "USC", away: "HCD" };

export type TickerItem = {
  time: string;
  side: Side;
  type: "goal" | "penalty";
  score?: string;
  shooter?: string;
  assist1?: string;
  assist2?: string;
  player?: string;
  foul?: string;
};

export const ticker: TickerItem[] = [
  { time: "57:49", side: "home", type: "penalty", player: "Aiden Fink", foul: "High Sticking" },
  {
    time: "57:49",
    side: "away",
    type: "goal",
    score: "3:6",
    shooter: "Matej Stransky",
    assist1: "Klas Dahlbeck",
    assist2: "Filip Zadina",
  },
  { time: "56:48", side: "home", type: "penalty", foul: "Delaying the game" },
  {
    time: "56:48",
    side: "away",
    type: "goal",
    score: "3:5",
    shooter: "Enzo Corvi",
    assist2: "Sven Jung",
  },
  {
    time: "55:21",
    side: "away",
    type: "goal",
    score: "3:4",
    shooter: "Filip Zadina",
    assist1: "Calle Andersson",
  },
  { time: "39:46", side: "home", type: "penalty", player: "Quinn Finley", foul: "High Sticking" },
  { time: "39:46", side: "home", type: "penalty", player: "Quinn Finley", foul: "High Sticking" },
  {
    time: "33:42",
    side: "home",
    type: "goal",
    score: "3:3",
    shooter: "Jack Musa",
    assist1: "Aiden Fink",
    assist2: "T.J. Hughes",
  },
  { time: "31:03", side: "away", type: "goal", score: "2:3", assist1: "Enzo Corvi" },
  {
    time: "23:56",
    side: "home",
    type: "goal",
    score: "2:2",
    shooter: "Aiden Fink",
    assist1: "Eric Pohlkamp",
    assist2: "Ryan Walsh",
  },
  { time: "15:27", side: "away", type: "penalty", player: "Calle Andersson", foul: "Cross-Check" },
  { time: "14:49", side: "away", type: "goal", score: "1:2", assist1: "Lukas Frick" },
  {
    time: "13:25",
    side: "home",
    type: "goal",
    score: "1:1",
    shooter: "Ryan Walsh",
    assist1: "Cole Knuble",
  },
  {
    time: "11:15",
    side: "away",
    type: "goal",
    score: "0:1",
    shooter: "Rasmus Asplund",
    assist1: "Enzo Corvi",
  },
  { time: "11:12", side: "home", type: "penalty", player: "Aiden Fink", foul: "Slashing" },
];

export type Position = "Torhüter" | "Stürmer" | "Verteidiger";

export type Player = {
  first: string;
  last: string;
  number: number;
  position: Position;
};

type Line = {
  title: string;
  players: Player[];
};

const p = (last: string, first: string, number: number, position: Position): Player => ({
  last,
  first,
  number,
  position,
});

const slug = (name: string) => name.toLowerCase().replace(/[^a-z]/g, "");

export const profileUrl = (player: Player) =>
  new URL(`/en/spieler/${player.number}-${slug(player.last)}_${slug(player.first)}`, SOURCE_URL).href;

export const photos: Record<Side, Record<number, string>> = {
  home: {
    30: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/usc/2025/30_Adam_Gajan.png.webp?itok=_4-T2tUg",
    33: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/usc/2025/33_Alex_Tracy.png.webp?itok=A3aDQ3xv",
    13: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/usc/2025/13_TJ_Hughes.png.webp?itok=ZceCVsbV",
    18: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/usc/2025/18_Aiden_Fink.png.webp?itok=ov7h6r51",
    19: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/usc/2025/19_Quinn_Finley.png.webp?itok=qquxIDa3",
    4: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/usc/2025/4_Jake_Livanavage.png.webp?itok=_A0gFLWo",
    2: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/usc/2025/2_Gavin_McCarthy.png.webp?itok=Jz7WTKou",
    15: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/usc/2025/15_Charlie_Cerrato.png.webp?itok=yR3FVG-J",
    14: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/usc/2025/14_Matt_DiMarsico.png.webp?itok=6UPEL5-K",
    86: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/usc/2025/86_JJ_Wiebusch.png.webp?itok=2oC0DE3A",
    23: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/usc/2025/23_Eric_Pohlkamp.png.webp?itok=XTuUpjXX",
    25: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/usc/2025/25_Abram_Wiebe.png.webp?itok=k6VqhO_k",
    8: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/usc/2025/8_Joey_Muldowney.png.webp?itok=Z1h1VEFt",
    9: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/usc/2025/9_Jack_Musa.png.webp?itok=VYgVZ9L9",
    27: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/usc/2025/27_Zam_Plante.png.webp?itok=baU9fZV8",
    5: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/usc/2025/5_Mac_Gadowsky.png.webp?itok=_mEOCz64",
    44: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/usc/2025/44_Vinny_Borgesi.png.webp?itok=6QblgxTP",
    22: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/usc/2025/22_Cole_Knuble.png.webp?itok=MlynIz1A",
    11: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/usc/2025/11_Danny_Nelson.png.webp?itok=wbCh_eIu",
    21: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/usc/2025/21_Ryan_Walsh.png.webp?itok=n0VRsyIJ",
    17: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/usc/2025/17_Larry_Keenan.png.webp?itok=sLMsZu-v",
    6: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/usc/2025/6_Martins_Lavins.png.webp?itok=WduX2V5E",
  },
  away: {
    29: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/hcd/2025/29_Sandro_Aeschlimann.png.webp?itok=ThOLPL6P",
    51: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/hcd/2025/51_Luca_Hollenstein.png.webp?itok=FYmC8FQ0",
    72: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/hcd/2025/72_Tino_Kessler.png.webp?itok=tZtbx790",
    44: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/hcd/2025/44_Matej_Stransky.png.webp?itok=2lwLXMg9",
    74: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/hcd/2025/74_Rasmus_Asplund.png.webp?itok=WFrOxzNV",
    77: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/hcd/2025/77_Nico_Gross.png.webp?itok=Ysv5OE3z",
    6: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/hcd/2025/6_Klas_Dahlbeck.png.webp?itok=0j64ofcB",
    70: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/hcd/2025/70_Enzo_Corvi.png.webp?itok=Ti7Yz7N8",
    93: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/hcd/2025/93_Yannick_Frehner.png.webp?itok=6FwsWB0i",
    19: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/2025-11/19_Adam_Tambellini.png.webp?itok=KfmaSjpt",
    90: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/hcd/2025/90_Sven_Jung.png.webp?itok=iH00iJgo",
    55: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/hcd/2025/55_Calle_Andersson.png.webp?itok=EGqGA7qe",
    15: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/hcd/2025/15_Simon_Ryfors.png.webp?itok=z3150hkK",
    18: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/hcd/2025/18_Filip_Zadina.png.webp?itok=FAH3b7OL",
    22: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/hcd/2025/22_Brendan_Lemieux.png.webp?itok=PGwdBtwo",
    38: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/hcd/2025/38_Lukas_Frick.png.webp?itok=VtGHYHqG",
    57: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/2025-12/57_Davyd_Barandun.png.webp?itok=EWJh4OT1",
    96: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/hcd/2025/96_Chris_Egli.png.webp?itok=iO39-NQ7",
    66: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/hcd/2025/66_Valentin_Nussbaumer.png.webp?itok=sSHzbSkB",
    36: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/hcd/2025/36_Simon_Knak.png.webp?itok=OBAvCcz4",
    12: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/players/hcd/2025/12_Enzo_Guebey.png.webp?itok=X-p1_Ta6",
    47: "https://cdn.spenglercup.ch/sites/default/files/styles/medium/public/2025-12/47_Leo_Komarov.png.webp?itok=me3CkFfr",
  },
};

export const lineup: Record<Side, Line[]> = {
  home: [
    {
      title: "Goalkeeper",
      players: [p("Gajan", "Adam", 30, "Torhüter"), p("Tracy", "Alex", 33, "Torhüter")],
    },
    {
      title: "Line 1",
      players: [
        p("Hughes", "T.J.", 13, "Stürmer"),
        p("Fink", "Aiden", 18, "Stürmer"),
        p("Finley", "Quinn", 19, "Stürmer"),
        p("Livanavage", "Jake", 4, "Verteidiger"),
        p("McCartthy", "Gavin", 2, "Verteidiger"),
      ],
    },
    {
      title: "Line 2",
      players: [
        p("Cerrato", "Charlie", 15, "Stürmer"),
        p("Dimarsico", "Matt", 14, "Stürmer"),
        p("Wiebusch", "JJ", 86, "Stürmer"),
        p("Pohlkamp", "Eric", 23, "Verteidiger"),
        p("Wiebe", "Abram", 25, "Verteidiger"),
      ],
    },
    {
      title: "Line 3",
      players: [
        p("Muldowney", "Joey", 8, "Stürmer"),
        p("Musa", "Jack", 9, "Stürmer"),
        p("Plante", "Zam", 27, "Stürmer"),
        p("Gadowsky", "Mac", 5, "Verteidiger"),
        p("Borgesi", "Vincent", 44, "Verteidiger"),
      ],
    },
    {
      title: "Line 4",
      players: [
        p("Knuble", "Cole", 22, "Stürmer"),
        p("Nelson", "Danny", 11, "Stürmer"),
        p("Walsh", "Ryan", 21, "Stürmer"),
        p("Keenan", "Larry", 17, "Verteidiger"),
      ],
    },
    {
      title: "Line 5",
      players: [p("Lavins", "Martins", 6, "Stürmer")],
    },
  ],
  away: [
    {
      title: "Goalkeeper",
      players: [p("Aeschlimann", "Sandro", 29, "Torhüter"), p("Hollenstein", "Luca", 51, "Torhüter")],
    },
    {
      title: "Line 1",
      players: [
        p("Kessler", "Tino", 72, "Stürmer"),
        p("Stransky", "Matej", 44, "Stürmer"),
        p("Asplund", "Rasmus", 74, "Stürmer"),
        p("Gross", "Nico", 77, "Verteidiger"),
        p("Dahlbeck", "Klas", 6, "Verteidiger"),
      ],
    },
    {
      title: "Line 2",
      players: [
        p("Corvi", "Enzo", 70, "Stürmer"),
        p("Frehner", "Yannick", 93, "Stürmer"),
        p("Tambellini", "Adam", 19, "Stürmer"),
        p("Jung", "Sven", 90, "Verteidiger"),
        p("Andersson", "Calle", 55, "Verteidiger"),
      ],
    },
    {
      title: "Line 3",
      players: [
        p("Ryfors", "Simon", 15, "Stürmer"),
        p("Zadina", "Filip", 18, "Stürmer"),
        p("Lemieux", "Brendan", 22, "Stürmer"),
        p("Frick", "Lukas", 38, "Verteidiger"),
        p("Barandun", "Davyd", 57, "Verteidiger"),
      ],
    },
    {
      title: "Line 4",
      players: [
        p("Egli", "Chris", 96, "Stürmer"),
        p("Nussbaumer", "Valentin", 66, "Stürmer"),
        p("Knak", "Simon", 36, "Stürmer"),
        p("Guebey", "Enzo", 12, "Verteidiger"),
      ],
    },
    {
      title: "Line 5",
      players: [p("Komarov", "Leonid", 47, "Stürmer")],
    },
  ],
};

type TeamStat = {
  key: string;
  label: string;
  home: number;
  away: number;
};

export const teamStats: TeamStat[] = [
  { key: "SOG", label: "Shots on Goal", home: 23, away: 32 },
  { key: "FOW", label: "Faceoffs Won", home: 27, away: 28 },
  { key: "PIM", label: "Penalty Minutes", home: 8, away: 2 },
  { key: "PP%", label: "Powerplay Percentage", home: 0, away: 50 },
];

type SkaterStat = {
  name: string;
  number: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  toi: string;
};

type GoalieStat = {
  name: string;
  number: number;
  shotsAgainst: number;
  saves: number;
  goalsAgainst: number;
  savePct: string;
};

const skater = (
  name: string,
  number: number,
  goals: number,
  assists: number,
  points: number,
  plusMinus: number,
  toi: string,
): SkaterStat => ({ name, number, goals, assists, points, plusMinus, toi });

export const skaterStats: Record<Side, SkaterStat[]> = {
  home: [
    skater("Fink Aiden", 18, 1, 1, 2, 1, "15:53"),
    skater("Walsh Ryan", 21, 1, 1, 2, 1, "12:46"),
    skater("Hughes T.J.", 13, 0, 1, 1, -1, "14:52"),
    skater("Knuble Cole", 22, 0, 1, 1, 0, "13:34"),
    skater("Musa Jack", 9, 1, 0, 1, 0, "11:40"),
    skater("Pohlkamp Eric", 23, 0, 1, 1, -1, "24:25"),
    skater("Borgesi Vincent", 44, 0, 0, 0, 1, "16:59"),
    skater("Cerrato Charlie", 15, 0, 0, 0, 0, "15:18"),
    skater("Dimarsico Matt", 14, 0, 0, 0, -1, "16:42"),
    skater("Finley Quinn", 19, 0, 0, 0, -1, "14:48"),
    skater("Gadowsky Mac", 5, 0, 0, 0, 0, "11:48"),
    skater("Keenan Larry", 17, 0, 0, 0, 0, "14:60"),
    skater("Lavins Martins", 6, 0, 0, 0, 0, "09:18"),
    skater("Livanavage Jake", 4, 0, 0, 0, -2, "17:09"),
    skater("McCartthy Gavin", 2, 0, 0, 0, 1, "17:08"),
    skater("Muldowney Joey", 8, 0, 0, 0, -1, "11:42"),
    skater("Nelson Danny", 11, 0, 0, 0, 1, "13:19"),
    skater("Plante Zam", 27, 0, 0, 0, -1, "12:11"),
    skater("Wiebe Abram", 25, 0, 0, 0, -1, "16:37"),
    skater("Wiebusch JJ", 86, 0, 0, 0, -1, "12:55"),
  ],
  away: [
    skater("Corvi Enzo", 70, 1, 2, 3, 2, "15:46"),
    skater("Zadina Filip", 18, 1, 1, 2, 0, "15:40"),
    skater("Andersson Calle", 55, 0, 1, 1, 2, "19:08"),
    skater("Asplund Rasmus", 74, 1, 0, 1, -1, "17:41"),
    skater("Dahlbeck Klas", 6, 0, 1, 1, -1, "21:47"),
    skater("Frick Lukas", 38, 0, 1, 1, 0, "20:27"),
    skater("Jung Sven", 90, 0, 1, 1, 2, "16:39"),
    skater("Stransky Matej", 44, 1, 0, 1, -1, "15:46"),
    skater("Barandun Davyd", 57, 0, 0, 0, 0, "14:43"),
    skater("Egli Chris", 96, 0, 0, 0, 0, "12:01"),
    skater("Frehner Yannick", 93, 0, 0, 0, 3, "13:05"),
    skater("Gross Nico", 77, 0, 0, 0, 0, "17:58"),
    skater("Guebey Enzo", 12, 0, 0, 0, -1, "05:13"),
    skater("Kessler Tino", 72, 0, 0, 0, -1, "16:54"),
    skater("Knak Simon", 36, 0, 0, 0, 0, "12:09"),
    skater("Komarov Leonid", 47, 0, 0, 0, -1, "04:29"),
    skater("Lemieux Brendan", 22, 0, 0, 0, 0, "14:32"),
    skater("Nussbaumer Valentin", 66, 0, 0, 0, 0, "14:22"),
    skater("Ryfors Simon", 15, 0, 0, 0, 0, "14:37"),
  ],
};

export const goalieStats: Record<Side, GoalieStat[]> = {
  home: [
    { name: "Gajan Adam", number: 30, shotsAgainst: 31, saves: 26, goalsAgainst: 5, savePct: "83.9 %" },
    { name: "Tracy Alex", number: 33, shotsAgainst: 0, saves: 0, goalsAgainst: 0, savePct: "100 %" },
  ],
  away: [
    { name: "Aeschlimann Sandro", number: 29, shotsAgainst: 23, saves: 20, goalsAgainst: 3, savePct: "87 %" },
    { name: "Hollenstein Luca", number: 51, shotsAgainst: 0, saves: 0, goalsAgainst: 0, savePct: "100 %" },
  ],
};

export const stories = {
  report: {
    title: "HC Davos crowned record Spengler Cup champion",
    paragraphs: [
      "Davos won the final of the 97th Spengler Cup 6:3 and collected a 17th tournament title.",
      "The game was tied 3:3 after two periods. Filip Zadina, Enzo Corvi and Matej Stransky scored in the closing minutes.",
    ],
    linkLabel: "Read the full report on spenglercup.ch",
    href: `${SOURCE_URL}#report`,
  },
  preview: {
    title: "Youthful energy versus seasoned veterans",
    paragraphs: [
      "The preview set up a New Year’s Eve final between hosts HC Davos and the U.S. Collegiate Selects, in Davos for the first time.",
      "The college team had already beaten Davos 5:3 on 27 December, so the final was a rematch.",
    ],
    linkLabel: "Read the full preview on spenglercup.ch",
    href: `${SOURCE_URL}#preview`,
  },
};
