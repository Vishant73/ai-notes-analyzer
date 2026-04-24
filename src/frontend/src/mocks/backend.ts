import type { backendInterface, ProcessingStatus, UserRole } from "../backend.d";

const mockNote1 = {
  id: BigInt(1),
  owner: { toText: () => "aaaaa-aa" } as any,
  content:
    "Machine learning is a subset of artificial intelligence that enables systems to automatically learn and improve from experience without being explicitly programmed. It focuses on the development of computer programs that can access data and use it to learn for themselves. The process begins with observations or data, such as examples, direct experience, or instruction, so that computers can learn to recognize patterns in data and make better decisions in the future.",
  createdAt: BigInt(Date.now() * 1_000_000 - 86400 * 1_000_000_000),
  wordCount: BigInt(72),
};

const mockNote2 = {
  id: BigInt(2),
  owner: { toText: () => "aaaaa-aa" } as any,
  content:
    "The water cycle, also known as the hydrological cycle, describes the continuous movement of water within Earth and its atmosphere. It includes processes such as evaporation, transpiration, condensation, precipitation, and surface runoff. Solar energy drives the evaporation of water from the Earth's surface into the atmosphere. Once in the atmosphere, water vapor condenses to form clouds and eventually falls back to Earth as precipitation.",
  createdAt: BigInt(Date.now() * 1_000_000 - 2 * 86400 * 1_000_000_000),
  wordCount: BigInt(68),
};

const mockNote3 = {
  id: BigInt(3),
  owner: { toText: () => "aaaaa-aa" } as any,
  content:
    "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize nutrients from carbon dioxide and water. Photosynthesis in plants generally involves the green pigment chlorophyll and generates oxygen as a byproduct.",
  createdAt: BigInt(Date.now() * 1_000_000 - 3 * 86400 * 1_000_000_000),
  wordCount: BigInt(41),
};

const mockAiResult1 = {
  noteId: BigInt(1),
  shortSummary:
    "Machine learning is a subset of AI that enables systems to learn from experience automatically.",
  mediumSummary:
    "Machine learning, a subset of AI, enables systems to learn and improve from experience without explicit programming. It focuses on programs that access data and learn to recognize patterns, making better future decisions.",
  detailedSummary:
    "Machine learning (ML) is a branch of artificial intelligence that focuses on building systems capable of automatically learning and improving from experience without being explicitly programmed. The core concept revolves around enabling computer programs to access data, identify patterns, and make informed decisions with minimal human intervention. The learning process is data-driven: systems use historical examples, direct experience, or instruction to build predictive models. This approach allows computers to continuously refine their outputs as they are exposed to more data, making ML especially powerful for complex, dynamic problems where manual rule-writing would be impractical.",
  keywords: [
    "machine learning",
    "artificial intelligence",
    "data patterns",
    "algorithms",
    "predictive models",
    "automation",
    "experience",
  ],
  processedAt: BigInt(Date.now() * 1_000_000 - 80000 * 1_000_000_000),
};

const mockAiResult2 = {
  noteId: BigInt(2),
  shortSummary:
    "The water cycle describes the continuous movement of water within Earth and its atmosphere through evaporation, condensation, and precipitation.",
  mediumSummary:
    "The hydrological cycle (water cycle) describes the continuous movement of water on Earth. Solar energy drives evaporation from the surface into the atmosphere, where vapor condenses into clouds and falls as precipitation, completing the cycle.",
  detailedSummary:
    "The water cycle, or hydrological cycle, is a fundamental Earth system process describing the continuous circulation of water between the surface, atmosphere, and subsurface environments. Driven primarily by solar energy, the cycle begins with evaporation — liquid water from oceans, lakes, and land surfaces converts to water vapor and rises into the atmosphere. Transpiration from plants adds additional moisture. As water vapor rises and cools, it condenses around aerosol particles to form clouds. When condensation reaches sufficient density, precipitation occurs as rain, snow, or hail. Water then flows over land as surface runoff, infiltrates soil, or is absorbed by plants, eventually returning to surface water bodies or groundwater reserves.",
  keywords: [
    "water cycle",
    "hydrological cycle",
    "evaporation",
    "condensation",
    "precipitation",
    "solar energy",
    "atmosphere",
  ],
  processedAt: BigInt(Date.now() * 1_000_000 - 170000 * 1_000_000_000),
};

export const mockBackend: backendInterface = {
  assignCallerUserRole: async () => undefined,

  createNote: async (req) => ({
    id: BigInt(4),
    owner: { toText: () => "aaaaa-aa" } as any,
    content: req.content,
    createdAt: BigInt(Date.now() * 1_000_000),
    wordCount: BigInt(req.content.split(/\s+/).length),
  }),

  deleteNote: async () => true,

  getAiResult: async (noteId) => {
    if (noteId === BigInt(1)) return mockAiResult1;
    if (noteId === BigInt(2)) return mockAiResult2;
    return null;
  },

  getCallerUserRole: async () => "user" as UserRole,

  getDashboardStats: async () => ({
    totalNotes: BigInt(3),
    totalWordsAnalyzed: BigInt(181),
  }),

  getNote: async (id) => {
    if (id === BigInt(1)) return mockNote1;
    if (id === BigInt(2)) return mockNote2;
    if (id === BigInt(3)) return mockNote3;
    return null;
  },

  getProcessingStatus: async (noteId) => {
    if (noteId === BigInt(1)) return "complete" as ProcessingStatus;
    if (noteId === BigInt(2)) return "complete" as ProcessingStatus;
    if (noteId === BigInt(3)) return "pending" as ProcessingStatus;
    return null;
  },

  isCallerAdmin: async () => false,

  listNotes: async () => [mockNote1, mockNote2, mockNote3],

  setOpenAiKey: async () => undefined,

  transform: async (input) => ({
    status: BigInt(200),
    body: input.response.body,
    headers: [],
  }),

  triggerAiAnalysis: async () => undefined,
};
