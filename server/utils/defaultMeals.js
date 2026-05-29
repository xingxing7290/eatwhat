const fs = require('fs');
const path = require('path');
const Meal = require('../models/mealModel');
const defaultMeals = require('../data/defaultMeals');

const uploadRoot = path.join(__dirname, '..', 'uploads', 'default-meals');

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function imageUrlFor(meal) {
  return `/api/uploads/default-meals/${meal.key}.svg`;
}

function svgFor(meal) {
  const [primary, secondary, accent] = meal.palette || ['#d85f65', '#f09a73', '#fff0df'];
  const title = escapeXml(meal.name);
  const category = escapeXml(meal.category);
  const tags = escapeXml((meal.tags || []).slice(0, 2).join(' / '));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="620" viewBox="0 0 900 620">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="${accent}"/>
      <stop offset="54%" stop-color="#fff6ec"/>
      <stop offset="100%" stop-color="${secondary}" stop-opacity="0.42"/>
    </linearGradient>
    <radialGradient id="plate" cx="50%" cy="42%" r="58%">
      <stop offset="0%" stop-color="#fffaf3"/>
      <stop offset="72%" stop-color="#f8e0cf"/>
      <stop offset="100%" stop-color="#e8b99e"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#6f3d2d" flood-opacity="0.22"/>
    </filter>
  </defs>
  <rect width="900" height="620" rx="42" fill="url(#bg)"/>
  <circle cx="162" cy="110" r="54" fill="#ffffff" opacity="0.28"/>
  <circle cx="760" cy="132" r="74" fill="#ffffff" opacity="0.22"/>
  <circle cx="760" cy="482" r="110" fill="#ffffff" opacity="0.2"/>
  <g filter="url(#shadow)">
    <ellipse cx="450" cy="318" rx="270" ry="160" fill="url(#plate)"/>
    <ellipse cx="450" cy="310" rx="218" ry="112" fill="#fffaf4"/>
    <path d="M265 306 C340 205 552 196 638 300 C590 398 340 405 265 306Z" fill="${primary}" opacity="0.92"/>
    <circle cx="366" cy="288" r="38" fill="${secondary}" opacity="0.95"/>
    <circle cx="468" cy="272" r="44" fill="${accent}" opacity="0.9"/>
    <circle cx="548" cy="325" r="36" fill="${secondary}" opacity="0.88"/>
    <path d="M326 356 C420 398 532 392 603 346" fill="none" stroke="#fff6ec" stroke-width="18" stroke-linecap="round" opacity="0.58"/>
    <path d="M330 250 C414 224 498 222 580 254" fill="none" stroke="#fff6ec" stroke-width="14" stroke-linecap="round" opacity="0.46"/>
  </g>
  <g font-family="PingFang SC, Microsoft YaHei, Noto Sans CJK SC, Arial, sans-serif" text-anchor="middle">
    <text x="450" y="524" font-size="56" font-weight="800" fill="#3d3028">${title}</text>
    <text x="450" y="570" font-size="24" font-weight="600" fill="#7c675a">${category} · ${tags}</text>
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
  imageUrlFor
};
