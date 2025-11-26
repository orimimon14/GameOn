import { GamerProfile, Message } from './types';

export const gamerProfiles: GamerProfile[] = [
  {
    id: 1,
    name: 'אורן',
    age: 22,
    image: 'https://images.unsplash.com/photo-1555952517-2e8e729e0b44?q=80&w=1964&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    bio: 'מחפש סקוואד רגוע לערב. בעיקר משחק Warzone אבל זורם גם על דברים אחרים.',
    games: [
      { name: 'Call of Duty: Warzone', icon: 'fa-crosshairs', lookingFor: 'מחפש סקוואד רגוע לערב, בעיקר Rebirth. לא מחפש לנצח בכל מחיר, רק להנות.' },
      { name: 'FIFA', icon: 'fa-futbol', lookingFor: 'מחפש יריבים למשחקי Pro Clubs, משחק בעמדת CAM. רמה גבוהה.' },
      { name: 'GTA V', icon: 'fa-car-side', lookingFor: 'מישהו למשימות Heists? נמאס לי לשחק עם רנדומליים שיוצאים באמצע.' },
    ],
    platforms: ['PlayStation 5', 'PC'],
    skillLevel: 'תחרותי',
  },
  {
    id: 2,
    name: 'יעל',
    age: 25,
    image: 'https://images.unsplash.com/photo-1593104547489-5cfb3839a3b5?q=80&w=2053&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    bio: 'גיימרית קז\'ואל שאוהבת משחקי אינדי ו-co-op. לא מחפשת משהו תחרותי מדי, רק להעביר את הזמן בכיף.',
    games: [
      { name: 'Minecraft', icon: 'fa-cube', lookingFor: 'מחפשת שותפים לבניית עולם Survival ארוך טווח, אוהבת פרויקטים גדולים.' },
      { name: 'Fortnite', icon: 'fa-person-rifle', lookingFor: 'משחקת רק Zero Build, מחפשת חבר\'ה לצחוק איתם.' },
      { name: 'Mario Kart 8', icon: 'fa-flag-checkered', lookingFor: 'רוצה להשלים את כל הגביעים ב-200cc, מחפשת מישהו שיעזור לי.' },
    ],
    platforms: ['PC', 'Nintendo Switch'],
    skillLevel: 'קז\'ואל',
  },
  {
    id: 3,
    name: 'דני',
    age: 19,
    image: 'https://images.unsplash.com/photo-1614283995733-1ac055981122?q=80&w=1974&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    bio: 'טוחן Valorant ו-CS2. מחפש חבר חמישי לקבוצה שלנו לטורנירים. רק רציניים בבקשה.',
    games: [
      { name: 'Valorant', icon: 'fa-bomb', lookingFor: 'מחפש חבר חמישי לקבוצה שלנו לטורנירים. Ascendant+ בלבד.' },
      { name: 'CS:GO 2', icon: 'fa-crosshairs', lookingFor: 'מחפש שחקן AWP רציני לקבוצה. 3000+ ELO בפייסית.' },
    ],
    platforms: ['PC'],
    skillLevel: 'מקצוען',
  },
  {
    id: 4,
    name: 'מאיה',
    age: 28,
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    bio: 'אוהבת משחקי RPG ו-MMORPG. מחפשת אנשים להצטרף לגילדה שלי ב-WoW או לשחק Baldur\'s Gate 3 ביחד.',
    games: [
      { name: 'World of Warcraft', icon: 'fa-dragon', lookingFor: 'מחפשת אנשים להצטרף לגילדה שלי ל-Mythic+. דרושים Healer ו-Tank.' },
      { name: 'Red Dead Redemption 2', icon: 'fa-hat-cowboy', lookingFor: 'רוצה לעשות Roleplay ב-RDR Online. מחפשת אנשים יצירתיים.' },
      { name: 'The Witcher 3', icon: 'fa-wand-magic-sparkles', lookingFor: 'סתם להשוויץ שאני משחקת במשחק הכי טוב אי פעם.' },
    ],
    platforms: ['PC'],
    skillLevel: 'תחרותי',
  },
   {
    id: 5,
    name: 'תומר',
    age: 31,
    image: 'https://images.unsplash.com/photo-1607957154248-8c659553b3b4?q=80&w=1974&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    bio: 'אבא גיימר, משחק בעיקר בסופ"שים. אוהב קמפיינים וסיפור טוב. פחות בקטע של אונליין תחרותי.',
    games: [
      { name: 'God of War', icon: 'fa-shield-halved', lookingFor: 'מחפש מישהו לדבר איתו על העלילה המטורפת של המשחק.' },
      { name: 'The Last of Us', icon: 'fa-person-rifle', lookingFor: 'משחק כרגע בחלק השני. בלי ספוילרים! מחפש חברים לדון בתיאוריות.' },
    ],
    platforms: ['PlayStation 5'],
    skillLevel: 'קז\'ואל',
  },
];

// A dummy profile for the current user for match alert
export const currentUserProfile: GamerProfile = {
    id: 0,
    name: 'ישראל ישראלי',
    age: 26,
    image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1780&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    bannerImage: 'https://images.unsplash.com/photo-1580327344181-c1163234e5a0?q=80&w=2532&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    bio: 'מחפש אנשים רגועים לשחק איתם Warzone בסופ"שים. לא תחרותי מדי, רק בשביל הכיף.',
    games: [
      { name: 'Call of Duty: Warzone', icon: 'fa-crosshairs', lookingFor: 'משחק בעיקר בסופ"שים, מחפש אנשים רגועים ל-Verdansk. רק בשביל הכיף.' },
      { name: 'GTA V', icon: 'fa-car-side', lookingFor: 'מחפש אנשים לעשות משימות ולצחוק, בלי griefing.' },
      { name: 'Minecraft', icon: 'fa-cube', lookingFor: 'יש לי שרת פרטי, מחפש עוד אנשים לבנות איתי עיר מודרנית.' },
    ],
    platforms: ['PC', 'PlayStation 5'],
    skillLevel: 'תחרותי',
};

// Mock data for the "Likes You" screen
export const profilesWhoLikedUser: GamerProfile[] = [
    {
        id: 101,
        name: 'לירון',
        age: 24,
        image: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?q=80&w=1924&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        bio: 'מחפשת מישהו לשחק איתו Apex Legends. בואו נגיע ל-Master ביחד!',
        games: [ 
            { name: 'Apex Legends', icon: 'fa-shield-alt', lookingFor: 'מחפשת סקוואד קבוע ל-Ranked. כרגע Diamond, רוצה להגיע ל-Master.' }, 
            { name: 'Overwatch 2', icon: 'fa-atom', lookingFor: 'משחקת בעיקר Support (Mercy/Ana), מחפשת Tank טוב.' } 
        ],
        platforms: ['PC'],
        skillLevel: 'תחרותי',
    },
    { ...gamerProfiles[3] }, // מאיה
    { ...gamerProfiles[1] }, // יעל
    {
        id: 102,
        name: 'גיא',
        age: 27,
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1974&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        bio: 'זורם על הכל, ממשחקי ספורט עד משחקי אסטרטגיה. מחפש חברים חדשים לשחק איתם.',
        games: [ 
            { name: 'NBA 2K', icon: 'fa-basketball', lookingFor: 'מחפש מישהו לשחק 2v2 ב-Park. אני Playmaking Shot Creator.' }, 
            { name: 'Forza Horizon', icon: 'fa-road', lookingFor: 'מחפש חבר\'ה למרוצי דריפטים וקרוזים במפה.' }, 
            { name: 'The Crew', icon: 'fa-car', lookingFor: 'רוצה להשלים את כל המשימות ב-co-op.' } 
        ],
        platforms: ['PC', 'Xbox'],
        skillLevel: 'קז\'ואל',
    }
];

// Mock data for the Chat view matches
export const matchedProfiles: GamerProfile[] = [
    gamerProfiles[0],
    gamerProfiles[3],
    profilesWhoLikedUser[0],
    profilesWhoLikedUser[3],
    gamerProfiles[1],
];

export const mockConversations: Record<number, Message[]> = {
    [gamerProfiles[0].id]: [
        { id: 1, text: 'היי, ראיתי שאתה משחק Warzone', senderId: gamerProfiles[0].id, timestamp: '10:30' },
        { id: 2, text: 'כן! רוצה לשחק מתישהו?', senderId: currentUserProfile.id, timestamp: '10:31' },
        { id: 3, text: 'ברור, אני פנוי בערב', senderId: gamerProfiles[0].id, timestamp: '10:32' },
    ],
    [gamerProfiles[3].id]: [
        { id: 1, text: 'היי מאיה! אני גם אוהב RPG', senderId: currentUserProfile.id, timestamp: 'אתמול' },
        { id: 2, text: 'היי! מעולה, איזה משחקים?', senderId: gamerProfiles[3].id, timestamp: 'אתמול' },
    ],
    [profilesWhoLikedUser[0].id]: [
        { id: 1, text: 'היי לירון, בואי נגיע ל-Master ביחד!', senderId: currentUserProfile.id, timestamp: 'לפני יומיים' },
    ],
    [profilesWhoLikedUser[3].id]: [
        { id: 1, text: 'היי גיא, מה קורה?', senderId: currentUserProfile.id, timestamp: '09:15' },
        { id: 2, text: 'הכל טוב! רוצה לשחק NBA?', senderId: profilesWhoLikedUser[3].id, timestamp: '09:16' },
        { id: 3, text: 'יאללה בכיף', senderId: currentUserProfile.id, timestamp: '09:17' },
        { id: 4, text: 'סגור, אני מתחבר', senderId: profilesWhoLikedUser[3].id, timestamp: '09:18' },
    ],
     [gamerProfiles[1].id]: [],
};