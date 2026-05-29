const defaultMeals = [
  {
    key: 'hong-shao-rou', name: '\u7ea2\u70e7\u8089', category: '\u5bb6\u5e38\u83dc', subcategory: '\u70ed\u83dc',
    description: '\u7ecf\u5178\u5bb6\u5e38\u83dc\uff0c\u80a5\u800c\u4e0d\u817b\uff0c\u53e3\u611f\u8f6f\u7cef\uff0c\u9002\u5408\u5468\u672b\u6162\u6162\u7096\u4e00\u9505\u3002',
    tags: ['\u8089\u7c7b', '\u5bb6\u5e38\u83dc', '\u7ea2\u70e7'], ingredients: [['\u4e94\u82b1\u8089', '500g'], ['\u751f\u62bd', '2\u52fa'], ['\u8001\u62bd', '1\u52fa'], ['\u51b0\u7cd6', '30g']],
    steps: ['\u4e94\u82b1\u8089\u7119\u6c34\u540e\u5207\u5757\uff0c\u716e\u51fa\u8840\u6cab\u540e\u6d17\u51c0\u3002', '\u7092\u7cd6\u8272\u540e\u52a0\u5165\u8089\u5757\u7ffb\u7092\uff0c\u52a0\u751f\u62bd\u3001\u8001\u62bd\u548c\u70ed\u6c34\u6162\u7096\u3002', '\u6536\u6c41\u524d\u8bd5\u5473\uff0c\u8f6f\u7cef\u540e\u51fa\u9505\u3002'], prepTime: 15, cookTime: 55, difficulty: 'medium', taste: ['\u54b8\u9c9c', '\u5fae\u751c'], spiceLevel: 0, palette: ['#8f3b2f', '#d66b45', '#f2c28d']
  },
  {
    key: 'tomato-egg', name: '\u897f\u7ea2\u67ff\u7092\u9e21\u86cb', category: '\u5bb6\u5e38\u83dc', subcategory: '\u5feb\u624b\u83dc',
    description: '\u5bb6\u5e38\u5feb\u624b\u83dc\uff0c\u9178\u751c\u53ef\u53e3\uff0c\u5f88\u9002\u5408\u4e24\u4e2a\u4eba\u4e0b\u73ed\u540e\u4e00\u8d77\u505a\u3002',
    tags: ['\u5bb6\u5e38\u83dc', '\u5feb\u624b\u83dc', '\u7d20\u83dc'], ingredients: [['\u897f\u7ea2\u67ff', '2\u4e2a'], ['\u9e21\u86cb', '3\u4e2a'], ['\u76d0', '\u5c11\u8bb8']],
    steps: ['\u9e21\u86cb\u52a0\u76d0\u6253\u6563\uff0c\u897f\u7ea2\u67ff\u5207\u5757\u3002', '\u5148\u7092\u9e21\u86cb\u81f3\u5ae9\u719f\u76db\u51fa\u3002', '\u7092\u897f\u7ea2\u67ff\u51fa\u6c41\u540e\u56de\u9505\u9e21\u86cb\u7ffb\u5300\u3002'], prepTime: 8, cookTime: 12, difficulty: 'easy', taste: ['\u9178\u751c', '\u5bb6\u5e38'], spiceLevel: 0, palette: ['#e34f3f', '#ffd166', '#fff0c8']
  },
  {
    key: 'yu-xiang-rou-si', name: '\u9c7c\u9999\u8089\u4e1d', category: '\u5ddd\u83dc', subcategory: '\u4e0b\u996d\u83dc',
    description: '\u5ddd\u83dc\u7ecf\u5178\uff0c\u9178\u751c\u5fae\u8fa3\uff0c\u8089\u4e1d\u914d\u6728\u8033\u548c\u80e1\u841d\u535c\u5f88\u4e0b\u996d\u3002',
    tags: ['\u5ddd\u83dc', '\u8fa3\u5473', '\u7092\u83dc'], ingredients: [['\u732a\u91cc\u810a', '300g'], ['\u80e1\u841d\u535c', '1\u6839'], ['\u6728\u8033', '50g'], ['\u8c46\u74e3\u9171', '1\u52fa']],
    steps: ['\u8089\u4e1d\u52a0\u6599\u9152\u548c\u6dc0\u7c89\u6293\u5300\u3002', '\u8c03\u597d\u9c7c\u9999\u6c41\uff0c\u914d\u83dc\u5207\u4e1d\u3002', '\u5148\u7092\u8089\u4e1d\uff0c\u518d\u52a0\u914d\u83dc\u548c\u6599\u6c41\u5feb\u901f\u7ffb\u7092\u3002'], prepTime: 15, cookTime: 15, difficulty: 'easy', taste: ['\u9178\u751c', '\u5fae\u8fa3'], spiceLevel: 2, palette: ['#b94a3f', '#f0a35d', '#7a4b2f']
  },
  {
    key: 'kung-pao-chicken', name: '\u5bab\u4fdd\u9e21\u4e01', category: '\u5ddd\u83dc', subcategory: '\u7092\u83dc',
    description: '\u7ecf\u5178\u5ddd\u83dc\uff0c\u9ebb\u8fa3\u9c9c\u9999\uff0c\u82b1\u751f\u548c\u9e21\u8089\u7684\u642d\u914d\u5f88\u8010\u5403\u3002',
    tags: ['\u5ddd\u83dc', '\u8fa3\u5473', '\u7092\u83dc'], ingredients: [['\u9e21\u80f8\u8089', '300g'], ['\u82b1\u751f\u7c73', '50g'], ['\u5e72\u8fa3\u6912', '10\u4e2a'], ['\u9ec4\u74dc', '1\u6839']],
    steps: ['\u9e21\u8089\u5207\u4e01\u814c\u5236\uff0c\u82b1\u751f\u5907\u597d\u3002', '\u8c03\u597d\u9178\u751c\u54b8\u9c9c\u7684\u5bab\u4fdd\u6c41\u3002', '\u7206\u9999\u5e72\u8fa3\u6912\u540e\u5feb\u901f\u7ffb\u7092\u9e21\u4e01\u548c\u914d\u6599\u3002'], prepTime: 15, cookTime: 15, difficulty: 'easy', taste: ['\u9999\u8fa3', '\u9178\u751c'], spiceLevel: 3, palette: ['#c94c3b', '#f7b267', '#835334']
  },
  {
    key: 'steamed-bass', name: '\u6e05\u84b8\u9c88\u9c7c', category: '\u6c34\u4ea7\u6d77\u9c9c', subcategory: '\u84b8\u83dc',
    description: '\u9c9c\u7f8e\u5065\u5eb7\uff0c\u53e3\u5473\u6e05\u723d\uff0c\u9002\u5408\u60f3\u5403\u5f97\u8f7b\u4e00\u70b9\u7684\u665a\u9910\u3002',
    tags: ['\u84b8\u83dc', '\u6d77\u9c9c', '\u5065\u5eb7'], ingredients: [['\u9c88\u9c7c', '1\u6761'], ['\u59dc', '3\u7247'], ['\u8471', '2\u6839'], ['\u6599\u9152', '1\u52fa']],
    steps: ['\u9c88\u9c7c\u5904\u7406\u5e72\u51c0\uff0c\u52a0\u59dc\u8471\u6599\u9152\u53bb\u8165\u3002', '\u6c34\u5f00\u540e\u4e0a\u9505\u84b8\u5236\uff0c\u706b\u5019\u4e0d\u8981\u8fc7\u4e45\u3002', '\u51fa\u9505\u6dcb\u84b8\u9c7c\u8c49\u6cb9\u548c\u70ed\u6cb9\u3002'], prepTime: 12, cookTime: 12, difficulty: 'medium', taste: ['\u6e05\u6de1', '\u9c9c'], spiceLevel: 0, palette: ['#6ba4b8', '#f2f2e8', '#8fc0a9']
  },
  {
    key: 'mapo-tofu', name: '\u9ebb\u5a46\u8c46\u8150', category: '\u5ddd\u83dc', subcategory: '\u4e0b\u996d\u83dc',
    description: '\u5ddd\u83dc\u4ee3\u8868\uff0c\u9ebb\u8fa3\u9c9c\u9999\uff0c\u8c46\u8150\u5ae9\u800c\u5165\u5473\u3002',
    tags: ['\u5ddd\u83dc', '\u8fa3\u5473', '\u8c46\u5236\u54c1'], ingredients: [['\u8c46\u8150', '1\u5757'], ['\u8089\u672b', '50g'], ['\u8c46\u74e3\u9171', '1\u52fa'], ['\u82b1\u6912\u7c89', '\u5c11\u8bb8']],
    steps: ['\u8c46\u8150\u5207\u5757\u7119\u6c34\u53bb\u8c46\u8165\u3002', '\u8089\u672b\u548c\u8c46\u74e3\u9171\u7092\u9999\uff0c\u52a0\u6c64\u6c41\u3002', '\u4e0b\u8c46\u8150\u5c0f\u706b\u5165\u5473\uff0c\u52fe\u8584\u82a1\u6492\u82b1\u6912\u7c89\u3002'], prepTime: 10, cookTime: 15, difficulty: 'easy', taste: ['\u9ebb\u8fa3'], spiceLevel: 4, palette: ['#d63d2e', '#f4d3a1', '#5b2b24']
  },
  {
    key: 'malatang', name: '\u9ebb\u8fa3\u70eb', category: '\u706b\u9505', subcategory: '\u5c0f\u9505',
    description: '\u9ebb\u8fa3\u9c9c\u9999\uff0c\u5404\u79cd\u98df\u6750\u81ea\u7531\u642d\u914d\uff0c\u9002\u5408\u4e24\u4eba\u4e00\u8d77\u9009\u559c\u6b22\u7684\u83dc\u3002',
    tags: ['\u9ebb\u8fa3', '\u706b\u9505', '\u81ea\u9009'], ingredients: [['\u9752\u83dc', '\u9002\u91cf'], ['\u4e38\u5b50', '\u9002\u91cf'], ['\u8c46\u5236\u54c1', '\u9002\u91cf'], ['\u6c64\u5e95', '1\u4efd']],
    steps: ['\u51c6\u5907\u559c\u6b22\u7684\u83dc\u548c\u4e38\u5b50\u3002', '\u6c64\u5e95\u716e\u5f00\u540e\u6309\u719f\u6210\u65f6\u95f4\u5148\u540e\u4e0b\u9505\u3002', '\u51fa\u9505\u540e\u6309\u53e3\u5473\u52a0\u829d\u9ebb\u9171\u6216\u8fa3\u6cb9\u3002'], prepTime: 15, cookTime: 15, difficulty: 'easy', taste: ['\u9ebb\u8fa3'], spiceLevel: 4, palette: ['#cf3f2f', '#f2a65a', '#72a276']
  },
  {
    key: 'shui-zhu-yu', name: '\u6c34\u716e\u9c7c', category: '\u5ddd\u83dc', subcategory: '\u70ed\u83dc',
    description: '\u9ebb\u8fa3\u9c9c\u9999\uff0c\u9c7c\u8089\u5ae9\u6ed1\uff0c\u9002\u5408\u60f3\u5403\u91cd\u53e3\u5473\u7684\u65e5\u5b50\u3002',
    tags: ['\u5ddd\u83dc', '\u9ebb\u8fa3', '\u9c7c'], ingredients: [['\u9c7c\u7247', '400g'], ['\u8c46\u82bd', '200g'], ['\u8c46\u74e3\u9171', '1\u52fa'], ['\u82b1\u6912', '\u9002\u91cf']],
    steps: ['\u9c7c\u7247\u52a0\u76d0\u548c\u6dc0\u7c89\u8f7b\u6293\u814c\u5236\u3002', '\u8c46\u82bd\u7b49\u57ab\u83dc\u7119\u719f\u94fa\u5e95\u3002', '\u6c64\u5e95\u716e\u5f00\u540e\u4e0b\u9c7c\u7247\uff0c\u6700\u540e\u6dcb\u70ed\u6cb9\u6fc0\u9999\u3002'], prepTime: 20, cookTime: 25, difficulty: 'medium', taste: ['\u9ebb\u8fa3', '\u9c9c'], spiceLevel: 5, palette: ['#b7282e', '#f57c48', '#ffcf75']
  },
  {
    key: 'jian-jiao-chao-rou', name: '\u5c16\u6912\u7092\u8089', category: '\u5bb6\u5e38\u83dc', subcategory: '\u4e0b\u996d\u83dc',
    description: '\u5bb6\u5e38\u4e0b\u996d\uff0c\u9c9c\u8fa3\u5f00\u80c3\uff0c\u5f88\u9002\u5408\u914d\u7c73\u996d\u3002',
    tags: ['\u5bb6\u5e38', '\u4e0b\u996d', '\u8fa3'], ingredients: [['\u5c16\u6912', '4\u6839'], ['\u732a\u8089', '250g'], ['\u751f\u62bd', '1\u52fa'], ['\u849c', '2\u74e3']],
    steps: ['\u8089\u7247\u52a0\u751f\u62bd\u548c\u6dc0\u7c89\u6293\u5300\u3002', '\u5c16\u6912\u65ad\u751f\u7092\u51fa\u9999\u6c14\u3002', '\u56de\u9505\u8089\u7247\u5feb\u901f\u7ffb\u7092\u8c03\u5473\u3002'], prepTime: 10, cookTime: 12, difficulty: 'easy', taste: ['\u9c9c\u8fa3'], spiceLevel: 3, palette: ['#4f8f45', '#d86f45', '#f3c56b']
  },
  {
    key: 'tong-guo-shuan-rou', name: '\u94dc\u9505\u6dae\u8089', category: '\u706b\u9505', subcategory: '\u805a\u9910',
    description: '\u4eac\u5473\u706b\u9505\uff0c\u9c9c\u8089\u8584\u5207\u539f\u5473\u6dae\uff0c\u9002\u5408\u6162\u6162\u5403\u8fb9\u804a\u5929\u3002',
    tags: ['\u706b\u9505', '\u5317\u4eac', '\u725b\u7f8a\u8089'], ingredients: [['\u7f8a\u8089\u7247', '300g'], ['\u9ebb\u9171', '\u9002\u91cf'], ['\u767d\u83dc', '\u9002\u91cf'], ['\u7c89\u4e1d', '\u9002\u91cf']],
    steps: ['\u51c6\u5907\u6dae\u8089\u548c\u914d\u83dc\uff0c\u9ebb\u9171\u8c03\u597d\u3002', '\u9505\u5e95\u716e\u5f00\u540e\u5148\u4e0b\u8010\u716e\u98df\u6750\u3002', '\u8089\u7247\u968f\u6dae\u968f\u5403\uff0c\u4fdd\u6301\u9c9c\u5ae9\u3002'], prepTime: 20, cookTime: 30, difficulty: 'easy', taste: ['\u9c9c\u9999', '\u6e05\u6de1'], spiceLevel: 0, palette: ['#b8793a', '#d9a441', '#f6e2b3']
  },
  {
    key: 'haidilao', name: '\u6d77\u5e95\u635e', category: '\u706b\u9505', subcategory: '\u805a\u9910',
    description: '\u8fde\u9501\u706b\u9505\u98ce\u5473\uff0c\u81ea\u9009\u9505\u5e95\u4e0e\u914d\u83dc\uff0c\u9002\u5408\u60f3\u8f7b\u677e\u5403\u706b\u9505\u7684\u65f6\u5019\u3002',
    tags: ['\u706b\u9505', '\u8fde\u9501', '\u5916\u5356\u53ef\u9009'], ingredients: [['\u9505\u5e95', '1\u4efd'], ['\u725b\u7f8a\u8089', '\u9002\u91cf'], ['\u9752\u83dc', '\u9002\u91cf'], ['\u4e38\u6ed1', '\u9002\u91cf']],
    steps: ['\u9009\u597d\u9505\u5e95\u548c\u559c\u6b22\u7684\u914d\u83dc\u3002', '\u6309\u98df\u6750\u719f\u6210\u65f6\u95f4\u4e0b\u9505\u3002', '\u642d\u914d\u6599\u7897\u548c\u5c0f\u98df\uff0c\u8f7b\u677e\u5b8c\u6210\u4e00\u9910\u3002'], prepTime: 15, cookTime: 35, difficulty: 'easy', taste: ['\u9ebb\u8fa3', '\u9c9c\u9999'], spiceLevel: 3, palette: ['#d84339', '#f5a65b', '#734b38']
  },
  {
    key: 'sichuan-hotpot', name: '\u56db\u5ddd\u706b\u9505', category: '\u706b\u9505', subcategory: '\u805a\u9910',
    description: '\u9ebb\u8fa3\u9c9c\u9999\uff0c\u91cd\u53e3\u5473\u9996\u9009\uff0c\u9002\u5408\u5468\u672b\u4e00\u8d77\u89e3\u998b\u3002',
    tags: ['\u706b\u9505', '\u56db\u5ddd', '\u9ebb\u8fa3'], ingredients: [['\u725b\u6cb9\u9505\u5e95', '1\u4efd'], ['\u6bdb\u809a', '\u9002\u91cf'], ['\u9e2d\u8840', '\u9002\u91cf'], ['\u9752\u83dc', '\u9002\u91cf']],
    steps: ['\u9505\u5e95\u716e\u5f00\u540e\u5148\u4e0b\u8010\u716e\u83dc\u3002', '\u6bdb\u809a\u7b49\u98df\u6750\u5feb\u6dae\u5feb\u5403\u3002', '\u51c6\u5907\u4e00\u7897\u6e05\u723d\u996e\u54c1\u5e73\u8861\u8fa3\u5ea6\u3002'], prepTime: 20, cookTime: 35, difficulty: 'easy', taste: ['\u9ebb\u8fa3'], spiceLevel: 5, palette: ['#b91f2e', '#f26d3d', '#ffc857']
  },
  {
    key: 'shaokao', name: '\u70e7\u70e4', category: '\u70e7\u70e4', subcategory: '\u591c\u5bb5',
    description: '\u591c\u5bb5\u5fc5\u5907\uff0c\u591a\u6837\u4e32\u7c7b\u4e0e\u852c\u83dc\uff0c\u9002\u5408\u5468\u672b\u5c0f\u805a\u3002',
    tags: ['\u70e7\u70e4', '\u591c\u5bb5', '\u805a\u4f1a'], ingredients: [['\u8089\u4e32', '\u9002\u91cf'], ['\u97ed\u83dc', '\u9002\u91cf'], ['\u91d1\u9488\u83c7', '\u9002\u91cf'], ['\u70e7\u70e4\u6599', '\u9002\u91cf']],
    steps: ['\u98df\u6750\u4e32\u597d\u6216\u6446\u76d8\uff0c\u8868\u9762\u5237\u6cb9\u3002', '\u70e4\u5230\u8868\u9762\u5fae\u7126\u540e\u6492\u70e7\u70e4\u6599\u3002', '\u6839\u636e\u53e3\u5473\u52a0\u8fa3\u6912\u9762\u548c\u5b5c\u7136\u3002'], prepTime: 20, cookTime: 25, difficulty: 'easy', taste: ['\u9999\u8fa3', '\u70df\u706b\u6c14'], spiceLevel: 3, palette: ['#7a3f2c', '#f28c38', '#f6d186']
  },
  {
    key: 'geda-soup', name: '\u897f\u7ea2\u67ff\u9e21\u86cb\u7599\u7629\u6c64', category: '\u5bb6\u5e38\u83dc', subcategory: '\u6c64',
    description: '\u5bb6\u5e38\u6696\u80c3\u6c64\u54c1\uff0c\u9178\u751c\u9002\u53e3\uff0c\u9002\u5408\u60f3\u5403\u70ed\u4e4e\u4e4e\u7684\u665a\u4e0a\u3002',
    tags: ['\u5bb6\u5e38', '\u6c64', '\u6e05\u6de1'], ingredients: [['\u897f\u7ea2\u67ff', '2\u4e2a'], ['\u9e21\u86cb', '1\u4e2a'], ['\u9762\u7c89', '100g'], ['\u8471\u82b1', '\u5c11\u8bb8']],
    steps: ['\u9762\u7c89\u5c11\u91cf\u591a\u6b21\u52a0\u6c34\u6405\u6210\u5c0f\u7599\u7629\u3002', '\u897f\u7ea2\u67ff\u7092\u51fa\u6c41\u540e\u52a0\u6c34\u716e\u5f00\u3002', '\u4e0b\u7599\u7629\u716e\u719f\uff0c\u6700\u540e\u6dcb\u5165\u86cb\u6db2\u3002'], prepTime: 10, cookTime: 12, difficulty: 'easy', taste: ['\u9178\u751c', '\u6e05\u6de1'], spiceLevel: 0, palette: ['#e85d50', '#f8d56b', '#fff3d6']
  }
];

function ingredients(items) {
  return items.map(([name, amount]) => ({ name, amount }));
}
function steps(items) {
  return items.map(description => ({ description, imageUrl: '' }));
}

module.exports = defaultMeals.map(meal => ({
  key: meal.key,
  name: meal.name,
  category: meal.category,
  subcategory: meal.subcategory,
  description: meal.description,
  tags: meal.tags,
  ingredients: ingredients(meal.ingredients),
  steps: steps(meal.steps),
  tips: '\u9ed8\u8ba4\u83dc\u54c1\u53ef\u4ee5\u6309\u4e24\u4e2a\u4eba\u7684\u53e3\u5473\u5fae\u8c03\u54b8\u6de1\u3001\u8fa3\u5ea6\u548c\u4efd\u91cf\u3002',
  servingSize: '2\u4eba\u4efd',
  prepTime: meal.prepTime,
  cookTime: meal.cookTime,
  difficulty: meal.difficulty,
  taste: meal.taste,
  spiceLevel: meal.spiceLevel,
  source: '\u7cfb\u7edf\u9ed8\u8ba4\u83dc\u54c1',
  favorite: false,
  rating: 4,
  isDefault: true,
  palette: meal.palette
}));
