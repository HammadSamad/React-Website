/* Centralised, reliability-checked image library (Unsplash).
   Every id below was verified to resolve; SmartImage still falls back
   to a themed gradient if a request ever fails at runtime. */

const U = (id, w = 1200, q = 72) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=${q}`;

export const img = {
  // Hero / atmosphere
  heroPool: (w, q) => U('1582719478250-c89cae4dc85b', w, q),
  exterior: (w, q) => U('1520250497591-112f2f40a3f4', w, q),
  lobby: (w, q) => U('1522771739844-6a9f6d5f14af', w, q),
  lounge: (w, q) => U('1600607687939-ce8a6c25118c', w, q),
  corridor: (w, q) => U('1470337458703-46ad1756a187', w, q),

  // Rooms & suites (one signature image per category)
  room1: (w, q) => U('1611892440504-42a792e24d32', w, q),
  room2: (w, q) => U('1631049307264-da0ec9d70304', w, q),
  room3: (w, q) => U('1590490360182-c33d57733427', w, q),
  room4: (w, q) => U('1631049035182-249067d7618e', w, q),
  room5: (w, q) => U('1566073771259-6a8506099945', w, q),
  room6: (w, q) => U('1571896349842-33c89424de2d', w, q),

  // Extra room / detail shots
  roomA: (w, q) => U('1445019980597-93fa8acb246c', w, q),
  roomB: (w, q) => U('1571003123894-1f0594d2b5d9', w, q),
  roomC: (w, q) => U('1615460549969-36fa19521a4f', w, q),
  roomD: (w, q) => U('1540555700478-4be289fbecef', w, q),
  bath: (w, q) => U('1618773928121-c32242e63f39', w, q),
  suiteView: (w, q) => U('1584132967334-10e028bd69f7', w, q),

  // Experiences
  spa1: (w, q) => U('1591088398332-8a7791972843', w, q),
  spa2: (w, q) => U('1600334089648-b0d9d3028eb2', w, q),
  spa3: (w, q) => U('1544161515-4ab6ce6db874', w, q),
  pool1: (w, q) => U('1578683010236-d716f9a3f461', w, q),
  pool2: (w, q) => U('1540541338287-41700207dee6', w, q),
  dining1: (w, q) => U('1517248135467-4c7edcad34c4', w, q),
  dining2: (w, q) => U('1596394516093-501ba68a0ba6', w, q),
  dining3: (w, q) => U('1600585154340-be6161a56a0c', w, q),
  bar: (w, q) => U('1587985064135-0366536eab42', w, q),
  fitness: (w, q) => U('1571019613454-1cb2f99b2d8b', w, q),
  resort: (w, q) => U('1551882547-ff40c63fe5fa', w, q),
  garden: (w, q) => U('1590381105924-c72589b9ef3f', w, q),
};

// Ordered pools for galleries
export const galleryImages = [
  img.heroPool, img.room5, img.spa1, img.dining1, img.pool1, img.lobby,
  img.room2, img.bar, img.suiteView, img.pool2, img.room3, img.lounge,
  img.dining3, img.room6, img.garden, img.bath,
];
