const fs = require('fs');
const path = require('path');

const meals = require('../data/defaultMeals');
const webImages = require('../data/mealWebImages.json');
const catalogImages = require('../data/mealCatalogImages.json');

const projectRoot = path.resolve(__dirname, '..', '..');
const outputPath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.join(projectRoot, 'docs', 'complete-meal-catalog.md');

const webImageByKey = new Map(
  (Array.isArray(webImages) ? webImages : []).map(item => [String(item.key), item])
);
const catalogImageByKey = new Map(
  (Array.isArray(catalogImages) ? catalogImages : []).map(item => [String(item.key), item])
);
const imageUsage = new Map();

for (const meal of meals) {
  const mapping = catalogImageByKey.get(String(meal.key)) || webImageByKey.get(String(meal.key));
  const imageUrl = mapping?.imageUrl || `/api/uploads/default-meals/${meal.key}.svg`;
  imageUsage.set(imageUrl, (imageUsage.get(imageUrl) || 0) + 1);
}

function text(value) {
  return String(value ?? '').trim();
}

function markdown(value) {
  return text(value)
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>');
}

function imageInfo(meal) {
  const catalogMapping = catalogImageByKey.get(String(meal.key));
  const webMapping = webImageByKey.get(String(meal.key));
  const mapping = catalogMapping || webMapping;
  const imageUrl = mapping?.imageUrl || `/api/uploads/default-meals/${meal.key}.svg`;
  const relative = imageUrl
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/^\/api\/uploads\//, '')
    .replace(/^\/uploads\//, '');
  const localPath = path.join(projectRoot, 'server', 'uploads', relative);
  return {
    imageUrl,
    localPath,
    exists: fs.existsSync(localPath),
    usage: imageUsage.get(imageUrl) || 0,
    kind: catalogMapping ? '统一生成照片' : webMapping ? '照片' : 'SVG 占位图',
    source: mapping?.sourceLabel || mapping?.foreignLandingUrl || mapping?.originalUrl || '',
    license: mapping?.license
      ? `${mapping.license}${mapping.licenseVersion ? ` ${mapping.licenseVersion}` : ''}`
      : '',
  };
}

function recipeAudit(meal) {
  const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];
  const steps = Array.isArray(meal.steps) ? meal.steps : [];
  const genericIngredient = /基础调味|葱姜蒜|主料|肉类|蔬菜/;
  const genericStep = /食材洗净切配|根据熟成时间|按口味调味|趁热上桌|准备肉类、蔬菜和蘸料|准备面团或主食胚/;
  const allAmountsVague =
    ingredients.length > 0 &&
    ingredients.every(item => /适量|少许/.test(text(item?.amount)));
  const issues = [];

  if (!ingredients.length) issues.push('缺少食材');
  if (!steps.length) issues.push('缺少步骤');
  if (ingredients.some(item => genericIngredient.test(text(item?.name)))) {
    issues.push('食材仍为泛化模板');
  }
  if (steps.some(item => genericStep.test(text(item?.description ?? item)))) {
    issues.push('步骤仍为泛化模板');
  }
  if (allAmountsVague) issues.push('食材用量全部过于笼统');
  if (!text(meal.description)) issues.push('缺少简介');
  if (!text(meal.tips)) issues.push('缺少小技巧');

  return { issues, allAmountsVague };
}

function ingredientLine(item) {
  const name = text(item?.name ?? item);
  const amount = text(item?.amount);
  return amount ? `${name}（${amount}）` : name;
}

function stepLine(item) {
  return text(item?.description ?? item);
}

const records = meals.map((meal, index) => {
  const image = imageInfo(meal);
  const recipe = recipeAudit(meal);
  const issues = [...recipe.issues];
  if (!image.exists) issues.push('图片文件不存在');
  if (image.usage > 1) issues.push(`图片被 ${image.usage} 道菜共用`);
  if (image.kind !== '统一生成照片') issues.push('尚未替换为统一生成照片');
  if (image.kind === 'SVG 占位图') issues.push('尚未替换为真实或统一生成的菜品照片');
  return { index: index + 1, meal, image, issues };
});

const summary = {
  total: records.length,
  unifiedGeneratedImages: records.filter(item => item.image.exists && item.image.usage === 1 && item.image.kind === '统一生成照片').length,
  exactImages: records.filter(item => item.image.exists && item.image.usage === 1 && item.image.kind === '照片').length,
  sharedImages: records.filter(item => item.image.usage > 1).length,
  svgPlaceholders: records.filter(item => item.image.kind === 'SVG 占位图').length,
  missingImageFiles: records.filter(item => !item.image.exists).length,
  genericRecipes: records.filter(item => item.issues.some(issue => issue.includes('泛化模板'))).length,
  vagueAmounts: records.filter(item => item.issues.includes('食材用量全部过于笼统')).length,
  passed: records.filter(item => item.issues.length === 0).length,
};
summary.remainingNonUnifiedImages = summary.total - summary.unifiedGeneratedImages;

const lines = [
  '# EatWhat 全部菜品完整目录',
  '',
  '> 本文件由 `server/scripts/generate-meal-catalog.js` 从服务器默认菜品源数据自动生成。',
  '> 每次修正菜品资料或图片后应重新生成，用于逐项核验全部菜品，不应手工维护统计值。',
  '',
  `- 生成时间：${new Date().toISOString()}`,
  `- 菜品总数：${summary.total}`,
  `- 已按统一模板生成并验收图片：${summary.unifiedGeneratedImages}`,
  `- 尚未替换为统一生成图片：${summary.remainingNonUnifiedImages}`,
  `- 独立且文件存在的既有照片：${summary.exactImages}`,
  `- 使用复用图片的菜品：${summary.sharedImages}`,
  `- 仍使用 SVG 占位图：${summary.svgPlaceholders}`,
  `- 图片文件不存在：${summary.missingImageFiles}`,
  `- 食材或步骤仍为泛化模板：${summary.genericRecipes}`,
  `- 食材用量全部为“适量/少许”：${summary.vagueAmounts}`,
  `- 当前全部审计项通过：${summary.passed}`,
  '',
  '## 快速索引',
  '',
  '| # | 菜品 | 分类 | 图片状态 | 食谱状态 |',
  '|---:|---|---|---|---|',
];

for (const record of records) {
  const { meal, image, issues, index } = record;
  const imageStatus = !image.exists
    ? '文件缺失'
    : image.usage > 1
      ? `${image.kind}，${image.usage} 道共用`
      : image.kind;
  const recipeStatus = issues.some(issue => /食材|步骤|简介|小技巧/.test(issue))
    ? '待完善'
    : '完整';
  lines.push(
    `| ${index} | [${markdown(meal.name)}](#${index}-${text(meal.key).toLowerCase()}) | ${markdown(meal.category)} / ${markdown(meal.subcategory)} | ${markdown(imageStatus)} | ${recipeStatus} |`
  );
}

lines.push('', '## 菜品详情', '');

for (const record of records) {
  const { meal, image, issues, index } = record;
  const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];
  const steps = Array.isArray(meal.steps) ? meal.steps : [];
  lines.push(
    `### ${index}. ${text(meal.name)} {#${index}-${text(meal.key).toLowerCase()}}`,
    '',
    `- 默认键：\`${text(meal.key)}\``,
    `- 分类：${text(meal.category)} / ${text(meal.subcategory)}`,
    `- 简介：${text(meal.description) || '未填写'}`,
    `- 标签：${(meal.tags || []).map(text).filter(Boolean).join('、') || '未填写'}`,
    `- 口味：${(meal.taste || []).map(text).filter(Boolean).join('、') || '未填写'}`,
    `- 份量：${text(meal.servingSize) || '未填写'}`,
    `- 难度：${text(meal.difficulty) || '未填写'}`,
    `- 准备 / 烹饪时间：${Number(meal.prepTime) || 0} / ${Number(meal.cookTime) || 0} 分钟`,
    `- 辣度：${Number(meal.spiceLevel) || 0} / 5`,
    `- 图片：${image.imageUrl}`,
    `- 图片类型：${image.kind}${image.usage > 1 ? `，共被 ${image.usage} 道菜使用` : ''}${image.exists ? '' : '，文件不存在'}`,
  );
  if (image.source) lines.push(`- 图片来源：${image.source}`);
  if (image.license) lines.push(`- 图片许可：${image.license}`);
  lines.push('', '**食材**', '');
  if (ingredients.length) {
    ingredients.forEach((item, itemIndex) => lines.push(`${itemIndex + 1}. ${ingredientLine(item)}`));
  } else {
    lines.push('1. 未填写');
  }
  lines.push('', '**做法**', '');
  if (steps.length) {
    steps.forEach((item, itemIndex) => lines.push(`${itemIndex + 1}. ${stepLine(item)}`));
  } else {
    lines.push('1. 未填写');
  }
  lines.push(
    '',
    `- 小技巧：${text(meal.tips) || '未填写'}`,
    `- 数据来源：${text(meal.source) || '未填写'}`,
    `- 审计结果：${issues.length ? issues.join('；') : '通过'}`,
    '',
    '---',
    ''
  );
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
console.log(JSON.stringify({ outputPath, ...summary }, null, 2));
