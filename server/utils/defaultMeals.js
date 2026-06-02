const fs = require('fs');
const path = require('path');
const Meal = require('../models/mealModel');
const defaultMeals = require('../data/defaultMeals');
let mealWebImages = [];
try {
  mealWebImages = require('../data/mealWebImages.json');
} catch (_) {
  mealWebImages = [];
}
const mealWebImageByKey = new Map((Array.isArray(mealWebImages) ? mealWebImages : []).map(entry => [String(entry.key), entry]));

const uploadRoot = path.join(__dirname, '..', 'uploads', 'default-meals');
const generatedUploadRoot = path.join(__dirname, '..', 'uploads', 'generated-meals');

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function imageUrlFor(meal) {
  const key = String(meal?.key || meal?.defaultKey || '').trim();
  const webImage = key ? mealWebImageByKey.get(key) : null;
  if (webImage?.imageUrl) return webImage.imageUrl;
  return `/api/uploads/default-meals/${meal.key}.svg`;
}

function generatedImageUrlFor(meal) {
  const id = String(meal?._id || meal?.id || meal?.defaultKey || meal?.key || '').trim();
  if (!id) return '';
  return `/api/uploads/generated-meals/${id}.svg`;
}

function generatedImagePathFor(meal) {
  const url = generatedImageUrlFor(meal);
  if (!url) return '';
  return path.join(generatedUploadRoot, path.basename(url));
}

function ensureGeneratedMealImage(meal) {
  const filePath = generatedImagePathFor(meal);
  const url = generatedImageUrlFor(meal);
  if (!filePath || !url) return '';
  fs.mkdirSync(generatedUploadRoot, { recursive: true });
  fs.writeFileSync(filePath, svgFor(meal), 'utf8');
  return url;
}

function localUploadPathFromUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const raw = url.trim();
  let pathname = raw;
  try {
    pathname = new URL(raw, 'http://local.test').pathname;
  } catch (_) {}
  const prefix = pathname.startsWith('/api/uploads/') ? '/api/uploads/' : pathname.startsWith('/uploads/') ? '/uploads/' : '';
  if (!prefix) return '';
  const rel = pathname.slice(prefix.length).replace(/^\/+/, '');
  if (!rel || rel.includes('..')) return '';
  return path.join(__dirname, '..', 'uploads', rel);
}

function hasUsableImage(meal) {
  const imageUrl = String(meal?.imageUrl || '').trim();
  if (!imageUrl) return false;
  if (/^https?:\/\//i.test(imageUrl)) return true;
  const localPath = localUploadPathFromUrl(imageUrl);
  return !!localPath && fs.existsSync(localPath);
}

function ensureMealImage(meal) {
  if (hasUsableImage(meal)) return meal.imageUrl;
  return ensureGeneratedMealImage(meal);
}

function hasAny(text, patterns) {
  return patterns.some(pattern => text.includes(pattern));
}

function visualTypeFor(meal) {
  const text = `${meal.name || ''} ${meal.category || ''} ${meal.subcategory || ''} ${(meal.tags || []).join(' ')}`;
  const rules = [
    { type: 'dumpling', words: ['\u997a', '\u9984\u9968', '\u9505\u8d34', '\u70e7\u9ea6'] },
    { type: 'rice', words: ['\u996d', '\u76d6\u6d47', '\u7092\u7c73', '\u750f\u8089\u5e72\u996d', '\u635e\u996d', '\u6293\u996d'] },
    { type: 'noodle', words: ['\u9762', '\u7c89', '\u51c9\u76ae', '\u5254\u5c16', '\u732b\u8033\u6735', '\u6832\u6833', '\u9ebb\u98df', '\u63ea\u7247', '\u62c9\u6761', '\u5200\u524a'] },
    { type: 'hotpot', words: ['\u706b\u9505', '\u6dae', '\u9ebb\u8fa3\u70eb', '\u7f8a\u874e\u5b50'] },
    { type: 'soup', words: ['\u6c64', '\u7ca5', '\u5934\u8111', '\u8c46\u8150\u8111', '\u7599\u7629', '\u7fb9'] },
    { type: 'grill', words: ['\u70e4', '\u4e32', '\u70e7\u70e4', '\u7f8a\u6392', '\u9995\u5305'] },
    { type: 'pastry', words: ['\u997c', '\u998d', '\u5305', '\u9992\u5934', '\u82b1\u5377', '\u9505\u76d4', '\u6cb9\u6761', '\u70b8\u7cd5', '\u7a9d\u5934'] },
    { type: 'seafood', words: ['\u9c7c', '\u867e', '\u6d77', '\u86e4', '\u87ba', '\u9c85', '\u9ca4', '\u8d1d', '\u87f9'] },
    { type: 'cold', words: ['\u51c9', '\u62cc', '\u62cd', '\u709d', '\u83e0\u83dc', '\u9ec4\u74dc', '\u8150\u7af9', '\u8c46\u76ae', '\u62c9\u76ae'] }
  ];
  const matched = rules.find(rule => hasAny(text, rule.words));
  return matched ? matched.type : 'stirfry';
}

function visualLabel(type) {
  return {
    dumpling: '\u624b\u4f5c\u9762\u70b9',
    noodle: '\u70ed\u4e4e\u9762\u98df',
    rice: '\u6696\u80c3\u76d6\u996d',
    hotpot: '\u56f4\u7089\u70ed\u9505',
    soup: '\u5bb6\u5e38\u6c64\u7ca5',
    grill: '\u70df\u706b\u70e7\u70e4',
    pastry: '\u9762\u9999\u997c\u5305',
    seafood: '\u9c9c\u5473\u6d77\u6cb3',
    cold: '\u6e05\u723d\u51c9\u62cc',
    stirfry: '\u5bb6\u5e38\u5c0f\u7092'
  }[type] || '\u5bb6\u5e38\u597d\u5473';
}

function visualLayers(type, primary, secondary, accent) {
  const commonSteam = `
    <path d="M355 176 C334 142 382 128 362 92" fill="none" stroke="#fff6ec" stroke-width="12" stroke-linecap="round" opacity="0.72"/>
    <path d="M452 166 C430 132 482 114 458 78" fill="none" stroke="#fff6ec" stroke-width="12" stroke-linecap="round" opacity="0.64"/>
    <path d="M548 176 C526 142 574 126 554 92" fill="none" stroke="#fff6ec" stroke-width="12" stroke-linecap="round" opacity="0.58"/>`;

  if (type === 'noodle') {
    return `${commonSteam}
    <ellipse cx="450" cy="354" rx="255" ry="122" fill="#f8d5bd"/>
    <path d="M216 326 C260 456 640 456 684 326 Z" fill="${secondary}" opacity="0.95"/>
    <ellipse cx="450" cy="320" rx="244" ry="94" fill="#fff8ed"/>
    <path d="M272 320 C345 272 555 272 628 320 C558 374 342 374 272 320Z" fill="#f7d58b"/>
    <path d="M308 312 C382 350 506 282 590 326" fill="none" stroke="${primary}" stroke-width="16" stroke-linecap="round" opacity="0.72"/>
    <path d="M314 344 C400 292 498 374 594 322" fill="none" stroke="#e6b85c" stroke-width="13" stroke-linecap="round" opacity="0.82"/>
    <circle cx="376" cy="304" r="24" fill="#7aa874"/><circle cx="512" cy="342" r="20" fill="#d85f65"/><circle cx="558" cy="304" r="18" fill="#fff1d0"/>`;
  }
  if (type === 'dumpling') {
    return `${commonSteam}
    <ellipse cx="450" cy="354" rx="272" ry="128" fill="#f5cfba"/>
    <ellipse cx="450" cy="328" rx="238" ry="94" fill="#fff9ee"/>
    ${[285, 352, 419, 486, 553, 620].map((x, i) => `<path d="M${x - 35} 332 C${x - 18} 286 ${x + 26} 286 ${x + 42} 332 C${x + 20} 360 ${x - 12} 362 ${x - 35} 332Z" fill="#fff1d9" stroke="${i % 2 ? secondary : primary}" stroke-width="5" opacity="0.95"/>`).join('')}
    <path d="M298 392 C392 428 518 428 602 392" fill="none" stroke="${accent}" stroke-width="14" stroke-linecap="round" opacity="0.45"/>`;
  }
  if (type === 'rice') {
    return `<ellipse cx="450" cy="374" rx="268" ry="126" fill="#f0c6ad"/>
    <path d="M218 326 C264 462 636 462 682 326 Z" fill="${secondary}" opacity="0.95"/>
    <ellipse cx="450" cy="318" rx="248" ry="92" fill="#fff8ee"/>
    <path d="M285 316 C350 254 554 252 616 318 C570 372 334 374 285 316Z" fill="#fff3d0"/>
    <circle cx="362" cy="314" r="34" fill="${primary}" opacity="0.88"/><circle cx="452" cy="286" r="30" fill="#ffd166"/><circle cx="536" cy="330" r="34" fill="#7aa874"/><path d="M346 360 C428 392 522 390 596 354" fill="none" stroke="#d68b56" stroke-width="14" stroke-linecap="round" opacity="0.68"/>`;
  }
  if (type === 'hotpot') {
    return `${commonSteam}
    <ellipse cx="450" cy="382" rx="278" ry="116" fill="#d9a06b" opacity="0.5"/>
    <rect x="230" y="264" width="440" height="174" rx="82" fill="${primary}"/>
    <ellipse cx="450" cy="264" rx="220" ry="82" fill="#fff1df"/>
    <ellipse cx="450" cy="270" rx="184" ry="58" fill="#d85f65" opacity="0.9"/>
    <circle cx="346" cy="262" r="24" fill="#7aa874"/><circle cx="426" cy="286" r="22" fill="#f7d58b"/><circle cx="520" cy="260" r="26" fill="#fff6ec"/><circle cx="576" cy="292" r="20" fill="${secondary}"/>
    <rect x="188" y="334" width="78" height="28" rx="14" fill="#8d5a50"/><rect x="634" y="334" width="78" height="28" rx="14" fill="#8d5a50"/>`;
  }
  if (type === 'soup') {
    return `${commonSteam}
    <ellipse cx="450" cy="364" rx="268" ry="126" fill="#f2c5aa"/>
    <path d="M214 326 C260 464 640 464 686 326 Z" fill="${secondary}" opacity="0.95"/>
    <ellipse cx="450" cy="318" rx="246" ry="92" fill="#fff7e8"/>
    <ellipse cx="450" cy="322" rx="198" ry="60" fill="#f6c978" opacity="0.88"/>
    <circle cx="352" cy="318" r="22" fill="#fffaf3"/><circle cx="430" cy="342" r="18" fill="#7aa874"/><circle cx="510" cy="310" r="18" fill="${primary}"/><circle cx="574" cy="338" r="14" fill="#fff1d0"/>`;
  }
  if (type === 'grill') {
    return `<ellipse cx="450" cy="386" rx="282" ry="112" fill="#f2d0b5"/>
    <rect x="216" y="296" width="468" height="118" rx="38" fill="#5f4339" opacity="0.92"/>
    ${[0, 1, 2, 3].map(i => `<line x1="${264 + i * 92}" y1="270" x2="${390 + i * 70}" y2="434" stroke="#f7e1c8" stroke-width="10" stroke-linecap="round"/><circle cx="${304 + i * 78}" cy="320" r="28" fill="${i % 2 ? secondary : primary}"/><circle cx="${350 + i * 72}" cy="374" r="24" fill="${i % 2 ? '#7aa874' : '#f7d58b'}"/>`).join('')}
    <path d="M250 424 C350 454 552 452 650 424" fill="none" stroke="#f29f67" stroke-width="16" stroke-linecap="round" opacity="0.55"/>`;
  }
  if (type === 'pastry') {
    return `<ellipse cx="450" cy="382" rx="284" ry="110" fill="#f1d1b5"/>
    <ellipse cx="450" cy="336" rx="242" ry="120" fill="#fff8ed"/>
    ${[326, 418, 510, 602].map((x, i) => `<ellipse cx="${x}" cy="334" rx="58" ry="42" fill="${i % 2 ? '#f7d58b' : accent}" stroke="${secondary}" stroke-width="6"/><path d="M${x - 32} 328 C${x - 8} 314 ${x + 18} 316 ${x + 34} 330" fill="none" stroke="#fffaf3" stroke-width="8" stroke-linecap="round" opacity="0.7"/>`).join('')}
    <path d="M280 394 C386 436 520 438 624 392" fill="none" stroke="${primary}" stroke-width="12" stroke-linecap="round" opacity="0.36"/>`;
  }
  if (type === 'seafood') {
    return `<ellipse cx="450" cy="370" rx="278" ry="126" fill="#d7e8e7"/>
    <ellipse cx="450" cy="332" rx="240" ry="100" fill="#fff9ef"/>
    <path d="M292 330 C358 254 528 252 606 328 C528 404 360 402 292 330Z" fill="${primary}" opacity="0.9"/>
    <circle cx="548" cy="314" r="10" fill="#3d3028"/><path d="M606 328 L662 286 L656 374 Z" fill="${secondary}"/><path d="M364 286 C410 326 474 324 520 286" fill="none" stroke="#fff6ec" stroke-width="12" stroke-linecap="round" opacity="0.72"/><circle cx="330" cy="374" r="22" fill="#7aa874"/><circle cx="430" cy="388" r="16" fill="#ffd166"/>`;
  }
  if (type === 'cold') {
    return `<ellipse cx="450" cy="370" rx="280" ry="128" fill="#d9ead4"/>
    <ellipse cx="450" cy="324" rx="240" ry="100" fill="#fffdf1"/>
    ${[315, 372, 430, 488, 546, 604].map((x, i) => `<path d="M${x} 378 C${x - 34} 324 ${x - 12} 276 ${x + 28} 294 C${x + 60} 336 ${x + 36} 376 ${x} 378Z" fill="${i % 3 === 0 ? '#7aa874' : i % 3 === 1 ? secondary : '#f7d58b'}" opacity="0.9"/>`).join('')}
    <path d="M296 342 C390 306 510 400 612 330" fill="none" stroke="${primary}" stroke-width="12" stroke-linecap="round" opacity="0.45"/>`;
  }
  return `<ellipse cx="450" cy="370" rx="278" ry="126" fill="#f2cbb4"/>
    <ellipse cx="450" cy="330" rx="238" ry="100" fill="#fff8ee"/>
    <path d="M278 326 C350 244 552 246 622 326 C560 398 340 400 278 326Z" fill="${primary}" opacity="0.9"/>
    <circle cx="360" cy="318" r="28" fill="${secondary}"/><circle cx="456" cy="300" r="30" fill="#fff0d3"/><circle cx="548" cy="340" r="24" fill="#7aa874"/>
    <path d="M318 374 C420 418 524 410 604 366" fill="none" stroke="#fff6ec" stroke-width="15" stroke-linecap="round" opacity="0.5"/>`;
}

function svgFor(meal) {
  const [primary, secondary, accent] = meal.palette || ['#d85f65', '#f09a73', '#fff0df'];
  const title = escapeXml(meal.name);
  const category = escapeXml(meal.category);
  const tags = escapeXml((meal.tags || []).slice(0, 2).join(' / '));
  const type = visualTypeFor(meal);
  const label = escapeXml(visualLabel(type));
  const layers = visualLayers(type, primary, secondary, accent).trim();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="620" viewBox="0 0 900 620">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="${accent}"/>
      <stop offset="52%" stop-color="#fff8ef"/>
      <stop offset="100%" stop-color="${secondary}" stop-opacity="0.5"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#6f3d2d" flood-opacity="0.2"/>
    </filter>
  </defs>
  <rect width="900" height="620" rx="46" fill="url(#bg)"/>
  <circle cx="116" cy="108" r="54" fill="#ffffff" opacity="0.27"/>
  <circle cx="786" cy="128" r="76" fill="#ffffff" opacity="0.22"/>
  <circle cx="770" cy="476" r="102" fill="#ffffff" opacity="0.22"/>
  <rect x="568" y="82" width="126" height="34" rx="17" fill="#ffffff" opacity="0.82" transform="rotate(-4 631 99)"/>
  <g filter="url(#shadow)">
    ${layers}
  </g>
  <g font-family="PingFang SC, Microsoft YaHei, Noto Sans CJK SC, Arial, sans-serif" text-anchor="middle">
    <rect x="80" y="494" width="740" height="84" rx="32" fill="#fffaf3" opacity="0.84"/>
    <text x="450" y="542" font-size="52" font-weight="800" fill="#3d3028">${title}</text>
    <text x="450" y="578" font-size="23" font-weight="600" fill="#7c675a">${category} &#183; ${label} &#183; ${tags}</text>
  </g>
</svg>`;
}

function ensureDefaultMealImages() {
  fs.mkdirSync(uploadRoot, { recursive: true });
  for (const meal of defaultMeals) {
    fs.writeFileSync(path.join(uploadRoot, `${meal.key}.svg`), svgFor(meal), 'utf8');
  }
}

function mealPayload(meal, householdId, createdBy = null) {
  const { palette, key, ...payload } = meal;
  return {
    ...payload,
    defaultKey: key,
    isDefault: true,
    imageUrl: imageUrlFor(meal),
    photos: [imageUrlFor(meal)],
    householdId,
    createdBy: createdBy || null
  };
}

async function seedDefaultMealsForHousehold(householdId, createdBy = null) {
  if (!householdId) return { inserted: 0, updated: 0 };
  ensureDefaultMealImages();
  let inserted = 0;
  let updated = 0;
  for (const meal of defaultMeals) {
    const result = await Meal.updateOne(
      { householdId, name: meal.name },
      { $set: mealPayload(meal, householdId, createdBy) },
      { upsert: true }
    );
    if (result.upsertedCount) inserted += 1;
    else if (result.modifiedCount) updated += 1;
  }
  return { inserted, updated };
}

async function seedDefaultMealsForHouseholds(households) {
  const results = [];
  for (const household of households) {
    const createdBy = Array.isArray(household.members) && household.members.length ? household.members[0] : household.createdBy || null;
    const result = await seedDefaultMealsForHousehold(household._id, createdBy);
    results.push({ householdId: household._id, name: household.name, ...result });
  }
  return results;
}

module.exports = {
  defaultMeals,
  ensureDefaultMealImages,
  seedDefaultMealsForHousehold,
  seedDefaultMealsForHouseholds,
  imageUrlFor,
  generatedImageUrlFor,
  ensureGeneratedMealImage,
  ensureMealImage,
  hasUsableImage
};
