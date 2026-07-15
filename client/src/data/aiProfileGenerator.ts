// ============================================================
// HONEYMOON — AI Profile Generator
// Procedurally combines name/location/bio/interest pools into
// varied AI companion profiles, rather than hand-writing hundreds
// of literal objects. Used by ai-profile.service.ts to bulk-seed
// the aiProfiles Firestore collection from the admin panel.
// ============================================================

import type { AIProfile, Gender, InterestedIn } from "@/types";

const FEMALE_FIRST_NAMES = [
  "Sophia", "Emma", "Amara", "Zainab", "Grace", "Aisha", "Fatima", "Chloe",
  "Naomi", "Layla", "Amelia", "Nia", "Wanjiru", "Adaeze", "Imani", "Freya",
  "Isabella", "Mia", "Camille", "Yara", "Thandiwe", "Priya", "Mei", "Sara",
  "Anastasia", "Valentina", "Keisha", "Nadia", "Rania", "Olamide",
];
const MALE_FIRST_NAMES = [
  "James", "Ethan", "Kwame", "Omar", "Lucas", "David", "Kofi", "Daniel",
  "Ryan", "Mohamed", "Adam", "Brian", "Tendai", "Chinedu", "Noah", "Leo",
  "Victor", "Samuel", "Amir", "Kevin", "Jabari", "Diego", "Marco", "Felix",
  "Ibrahim", "Sipho", "Malik", "Julian", "Xavier", "Elias",
];
const LAST_NAMES = [
  "James", "Brown", "Okafor", "Hassan", "Mwangi", "Smith", "Ndlovu", "Nasser",
  "Achieng", "Kariuki", "Johnson", "Adeyemi", "Osei", "Diallo", "Kimani",
  "Abara", "Baraka", "Chen", "Rossi", "Novak", "Garcia", "Silva", "Haile",
  "Nyong'o", "Musa", "Kone", "Traore", "Botha", "Farah", "Lindqvist",
];

const CITIES: { city: string; country: string }[] = [
  { city: "London", country: "United Kingdom" },
  { city: "Nairobi", country: "Kenya" },
  { city: "Lagos", country: "Nigeria" },
  { city: "Cape Town", country: "South Africa" },
  { city: "Accra", country: "Ghana" },
  { city: "Kampala", country: "Uganda" },
  { city: "Dar es Salaam", country: "Tanzania" },
  { city: "Kigali", country: "Rwanda" },
  { city: "Addis Ababa", country: "Ethiopia" },
  { city: "Dakar", country: "Senegal" },
  { city: "Cairo", country: "Egypt" },
  { city: "Casablanca", country: "Morocco" },
  { city: "New York", country: "United States" },
  { city: "Toronto", country: "Canada" },
  { city: "Paris", country: "France" },
  { city: "Berlin", country: "Germany" },
  { city: "Madrid", country: "Spain" },
  { city: "Rome", country: "Italy" },
  { city: "Amsterdam", country: "Netherlands" },
  { city: "Stockholm", country: "Sweden" },
  { city: "Dubai", country: "United Arab Emirates" },
  { city: "Doha", country: "Qatar" },
  { city: "Mumbai", country: "India" },
  { city: "Manila", country: "Philippines" },
  { city: "Singapore", country: "Singapore" },
  { city: "Sydney", country: "Australia" },
  { city: "Johannesburg", country: "South Africa" },
  { city: "Mombasa", country: "Kenya" },
  { city: "Abuja", country: "Nigeria" },
  { city: "Lusaka", country: "Zambia" },
];

const OCCUPATIONS = [
  "Marketing Manager", "Architect", "Software Engineer", "Nurse", "Teacher",
  "Graphic Designer", "Accountant", "Photographer", "Entrepreneur", "Chef",
  "Doctor", "Lawyer", "Flight Attendant", "Fitness Coach", "Journalist",
  "Data Analyst", "Interior Designer", "Musician", "Pharmacist", "Consultant",
  "UX Designer", "Civil Engineer", "Real Estate Agent", "Videographer",
  "HR Manager", "Product Manager", "Dentist", "Financial Analyst",
  "Social Worker",
];

const BIO_OPENERS = [
  "Looking for someone genuine to build something meaningful together",
  "Coffee, sunsets and meaningful conversations",
  "Here for real connection, not just small talk",
  "Believer in good food, good company, and spontaneous adventures",
  "Building a life I'm proud of, one day at a time",
  "Passionate about culture, travel, and honest conversations",
  "Optimist, dog lover, and weekend hiker",
  "Big on family, laughter, and trying new restaurants",
  "Ambitious but grounded — looking for the same in someone else",
  "Enjoy deep talks over shallow ones",
];
const BIO_CLOSERS = [
  "Let's see where this goes 🌍",
  "Swipe right if you love good conversation ☕",
  "Always up for a new adventure ✈️",
  "Let's grab coffee and find out 😊",
  "Open to long distance if the connection is real ❤️",
  "Big on honesty and consistency.",
  "Let's build something real.",
  "Looking forward to meeting someone special here.",
];

const INTEREST_POOL = [
  "Travel", "Music", "Cooking", "Fitness", "Movies", "Photography", "Nature",
  "Reading", "Business", "Technology", "Art", "Fashion", "Dancing", "Hiking",
  "Yoga", "Gaming", "Food", "Volunteering", "Languages", "Entrepreneurship",
];
const LANGUAGE_POOL = ["English", "Swahili", "French", "Spanish", "Arabic", "Portuguese"];

const FEMALE_PHOTOS = [
  "photo-1494790108377-be9c29b29330", "photo-1529626455594-4ff0802cfb7e",
  "photo-1438761681033-6461ffad8d80", "photo-1488426862026-3ee34a7d66df",
  "photo-1531123897727-8f129e1688ce", "photo-1517841905240-472988babdf9",
  "photo-1524504388940-b1c1722653e1", "photo-1544005313-94ddf0286df2",
  "photo-1487412720507-e7ab37603c6f", "photo-1502823403499-6ccfcf4fb453",
  "photo-1508214751196-bcfd4ca60f91", "photo-1524250502761-1ac6f2e30d43",
  "photo-1541823709867-1b206113eafd", "photo-1489424731084-a5d8b219a5bb",
  "photo-1517365830460-955ce3ccd263",
];
const MALE_PHOTOS = [
  "photo-1500648767791-00dcc994a43e", "photo-1507003211169-0a1dd7228f2d",
  "photo-1519085360753-af0119f7cbe7", "photo-1506794778202-cad84cf45f1d",
  "photo-1544723795-3fb6469f5b39", "photo-1552058544-f2b08422138a",
  "photo-1560250097-0b93528c311a", "photo-1522075469751-3a6694fb2f61",
  "photo-1492562080023-ab3db95bfbce", "photo-1463453091185-61582044d556",
  "photo-1472099645785-5658abf4ff4e", "photo-1607990281513-2c110a25bd8c",
  "photo-1615109398623-88346a601842", "photo-1618077360395-f3068be8e001",
  "photo-1600180758890-6b94519a8ba6",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function pickMany<T>(arr: T[], count: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, count);
}
function photoUrl(id: string): string {
  return `https://images.unsplash.com/${id}?w=800&h=1000&fit=crop`;
}

/**
 * Generates `count` procedurally varied AI companion profiles.
 * Returns objects without an `id` — the caller (ai-profile.service)
 * assigns the Firestore doc ID on write.
 */
export function generateAIProfiles(count: number): Omit<AIProfile, "id">[] {
  const profiles: Omit<AIProfile, "id">[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    const gender: Gender = i % 2 === 0 ? "female" : "male";
    const firstNamePool = gender === "female" ? FEMALE_FIRST_NAMES : MALE_FIRST_NAMES;
    let firstName = pick(firstNamePool);
    let lastName = pick(LAST_NAMES);
    let key = `${firstName}-${lastName}`;
    let attempts = 0;
    while (usedNames.has(key) && attempts < 10) {
      firstName = pick(firstNamePool);
      lastName = pick(LAST_NAMES);
      key = `${firstName}-${lastName}`;
      attempts++;
    }
    usedNames.add(key);

    const { city, country } = pick(CITIES);
    const interestedIn: InterestedIn = gender === "female" ? "male" : "female";
    const photoPool = gender === "female" ? FEMALE_PHOTOS : MALE_PHOTOS;
    const photoIds = pickMany(photoPool, 2);

    profiles.push({
      firstName,
      lastName,
      gender,
      interestedIn,
      age: 20 + Math.floor(Math.random() * 18),
      city,
      country,
      occupation: pick(OCCUPATIONS),
      bio: `${pick(BIO_OPENERS)}. ${pick(BIO_CLOSERS)}`,
      interests: pickMany(INTEREST_POOL, 4 + Math.floor(Math.random() * 3)),
      languages: pickMany(LANGUAGE_POOL, 1 + Math.floor(Math.random() * 2)),
      photos: photoIds.map(photoUrl),
      online: Math.random() > 0.4,
      verified: Math.random() > 0.2,
      isAi: true,
    });
  }

  return profiles;
}
