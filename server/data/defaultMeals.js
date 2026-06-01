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
  },
  // Expanded northern default meal catalog,
  {
    "key": "north-menu-001",
    "name": "\u5317\u4eac\u70e4\u9e2d",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u70e7\u70e4\u706b\u9505",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u5317\u4eac\u70e4\u9e2d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u70e7\u70e4\u706b\u9505",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e2d\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u8089\u7c7b\u3001\u852c\u83dc\u548c\u8638\u6599\uff0c\u98df\u6750\u5207\u6210\u9002\u53e3\u5927\u5c0f\u3002",
      "\u6839\u636e\u719f\u6210\u65f6\u95f4\u70e4\u3001\u6dae\u6216\u716e\u5230\u521a\u719f\u3002",
      "\u642d\u914d\u8638\u6599\u98df\u7528\uff0c\u6309\u4e24\u4e2a\u4eba\u53e3\u5473\u8c03\u6574\u8fa3\u5ea6\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-002",
    "name": "\u70b8\u9171\u9762",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u9762\u98df",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u70b8\u9171\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-003",
    "name": "\u4eac\u9171\u8089\u4e1d",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u4eac\u6d25\u5180",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u4eac\u9171\u8089\u4e1d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-004",
    "name": "\u7206\u809a",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u5c0f\u7092",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u7206\u809a\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-005",
    "name": "\u5364\u716e\u706b\u70e7",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u7096\u83dc",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u5364\u716e\u706b\u70e7\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-006",
    "name": "\u7092\u809d",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u5c0f\u7092",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u7092\u809d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-007",
    "name": "\u95e8\u9489\u8089\u997c",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u997c\u7c7b",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u95e8\u9489\u8089\u997c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u997c\u7c7b",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-008",
    "name": "\u8c4c\u8c46\u9ec4",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u4eac\u6d25\u5180",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u8c4c\u8c46\u9ec4\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u751c\u9999"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-009",
    "name": "\u8c46\u6c41\u7126\u5708",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u4eac\u6d25\u5180",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u8c46\u6c41\u7126\u5708\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-010",
    "name": "\u7099\u5b50\u70e4\u8089",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u70e7\u70e4\u706b\u9505",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u7099\u5b50\u70e4\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u70e7\u70e4\u706b\u9505",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u8089\u7c7b\u3001\u852c\u83dc\u548c\u8638\u6599\uff0c\u98df\u6750\u5207\u6210\u9002\u53e3\u5927\u5c0f\u3002",
      "\u6839\u636e\u719f\u6210\u65f6\u95f4\u70e4\u3001\u6dae\u6216\u716e\u5230\u521a\u719f\u3002",
      "\u642d\u914d\u8638\u6599\u98df\u7528\uff0c\u6309\u4e24\u4e2a\u4eba\u53e3\u5473\u8c03\u6574\u8fa3\u5ea6\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-011",
    "name": "\u82a5\u672b\u58a9",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u4eac\u6d25\u5180",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u82a5\u672b\u58a9\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-012",
    "name": "\u8001\u5317\u4eac\u6dae\u7f8a\u8089",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u70e7\u70e4\u706b\u9505",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u8001\u5317\u4eac\u6dae\u7f8a\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u70e7\u70e4\u706b\u9505",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7f8a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u8089\u7c7b\u3001\u852c\u83dc\u548c\u8638\u6599\uff0c\u98df\u6750\u5207\u6210\u9002\u53e3\u5927\u5c0f\u3002",
      "\u6839\u636e\u719f\u6210\u65f6\u95f4\u70e4\u3001\u6dae\u6216\u716e\u5230\u521a\u719f\u3002",
      "\u642d\u914d\u8638\u6599\u98df\u7528\uff0c\u6309\u4e24\u4e2a\u4eba\u53e3\u5473\u8c03\u6574\u8fa3\u5ea6\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-013",
    "name": "\u7f8a\u874e\u5b50\u706b\u9505",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u70e7\u70e4\u706b\u9505",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u7f8a\u874e\u5b50\u706b\u9505\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u70e7\u70e4\u706b\u9505",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7f8a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u8089\u7c7b\u3001\u852c\u83dc\u548c\u8638\u6599\uff0c\u98df\u6750\u5207\u6210\u9002\u53e3\u5927\u5c0f\u3002",
      "\u6839\u636e\u719f\u6210\u65f6\u95f4\u70e4\u3001\u6dae\u6216\u716e\u5230\u521a\u719f\u3002",
      "\u642d\u914d\u8638\u6599\u98df\u7528\uff0c\u6309\u4e24\u4e2a\u4eba\u53e3\u5473\u8c03\u6574\u8fa3\u5ea6\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 3,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-014",
    "name": "\u4eac\u5473\u6253\u5364\u9762",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u9762\u98df",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u4eac\u5473\u6253\u5364\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-015",
    "name": "\u6241\u8c46\u7116\u9762",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u7096\u83dc",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u6241\u8c46\u7116\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-016",
    "name": "\u8921\u88e2\u706b\u70e7",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u4eac\u6d25\u5180",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u8921\u88e2\u706b\u70e7\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-017",
    "name": "\u5929\u6d25\u714e\u997c\u679c\u5b50",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u997c\u7c7b",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u5929\u6d25\u714e\u997c\u679c\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u997c\u7c7b",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-018",
    "name": "\u9505\u5df4\u83dc",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u4eac\u6d25\u5180",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u9505\u5df4\u83dc\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-019",
    "name": "\u8001\u7206\u4e09",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u5c0f\u7092",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u8001\u7206\u4e09\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-020",
    "name": "\u7f7e\u8e66\u9ca4\u9c7c",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u4eac\u6d25\u5180",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u7f7e\u8e66\u9ca4\u9c7c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9c7c\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-021",
    "name": "\u516b\u73cd\u8c46\u8150",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u4eac\u6d25\u5180",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u516b\u73cd\u8c46\u8150\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u8c46\u8150",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-022",
    "name": "\u8033\u6735\u773c\u70b8\u7cd5",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u70b8\u7269",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u8033\u6735\u773c\u70b8\u7cd5\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u70b8\u7269",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u814c\u5236\u5165\u5473\uff0c\u6302\u7cca\u6216\u62cd\u7c89\u3002",
      "\u6cb9\u6e29\u5347\u8d77\u540e\u5206\u6279\u70b8\u5230\u5b9a\u578b\u3002",
      "\u590d\u70b8\u6216\u56de\u9505\u8c03\u6c41\uff0c\u4fdd\u6301\u5916\u9165\u91cc\u5ae9\u3002"
    ],
    "prepTime": 20,
    "cookTime": 20,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-023",
    "name": "\u6cb3\u5317\u9a74\u8089\u706b\u70e7",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u4eac\u6d25\u5180",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u6cb3\u5317\u9a74\u8089\u706b\u70e7\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-024",
    "name": "\u68cb\u5b50\u70e7\u997c",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u997c\u7c7b",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u68cb\u5b50\u70e7\u997c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u997c\u7c7b",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-025",
    "name": "\u9999\u6cb3\u8089\u997c",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u997c\u7c7b",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u9999\u6cb3\u8089\u997c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u997c\u7c7b",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-026",
    "name": "\u67f4\u6c9f\u5821\u718f\u8089",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u4eac\u6d25\u5180",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u67f4\u6c9f\u5821\u718f\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-027",
    "name": "\u627f\u5fb7\u7897\u5768",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u4eac\u6d25\u5180",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u627f\u5fb7\u7897\u5768\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-028",
    "name": "\u6cb3\u5317\u9978\u9979\u9762",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u9762\u98df",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u6cb3\u5317\u9978\u9979\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-029",
    "name": "\u4fdd\u5b9a\u725b\u8089\u7f69\u997c",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u997c\u7c7b",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u4fdd\u5b9a\u725b\u8089\u7f69\u997c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u997c\u7c7b",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u725b\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-030",
    "name": "\u77f3\u5bb6\u5e84\u7f38\u7089\u70e7\u997c",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u997c\u7c7b",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u77f3\u5bb6\u5e84\u7f38\u7089\u70e7\u997c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u997c\u7c7b",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-031",
    "name": "\u90af\u90f8\u8c46\u6cab",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u4eac\u6d25\u5180",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u90af\u90f8\u8c46\u6cab\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-032",
    "name": "\u8d34\u997d\u997d\u71ac\u5c0f\u9c7c",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u4eac\u6d25\u5180",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u8d34\u997d\u997d\u71ac\u5c0f\u9c7c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9c7c\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-033",
    "name": "\u5929\u6d25\u7d20\u5377\u5708",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u4eac\u6d25\u5180",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u5929\u6d25\u7d20\u5377\u5708\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-034",
    "name": "\u9ec4\u7116\u4e24\u6837",
    "category": "\u5730\u65b9\u7279\u8272",
    "subcategory": "\u7096\u83dc",
    "description": "\u4eac\u6d25\u5180\u5e38\u89c1\u9910\u54c1\u300c\u9ec4\u7116\u4e24\u6837\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4eac\u6d25\u5180",
      "\u5730\u65b9\u7279\u8272",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b66b45",
      "#e09f67",
      "#f8e1c6"
    ]
  },
  {
    "key": "north-menu-035",
    "name": "\u4e5d\u8f6c\u5927\u80a0",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c71\u4e1c\u9c81\u83dc",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u4e5d\u8f6c\u5927\u80a0\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c71\u4e1c\u9c81\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u4e3b\u6599",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-036",
    "name": "\u7cd6\u918b\u9ca4\u9c7c",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c71\u4e1c\u9c81\u83dc",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u7cd6\u918b\u9ca4\u9c7c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c71\u4e1c\u9c81\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9c7c\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u9178\u9999",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-037",
    "name": "\u8471\u70e7\u6d77\u53c2",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c71\u4e1c\u9c81\u83dc",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u8471\u70e7\u6d77\u53c2\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c71\u4e1c\u9c81\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u6d77\u53c2",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-038",
    "name": "\u6cb9\u7206\u53cc\u8106",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c0f\u7092",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u6cb9\u7206\u53cc\u8106\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u4e3b\u6599",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-039",
    "name": "\u7206\u7092\u8170\u82b1",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c0f\u7092",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u7206\u7092\u8170\u82b1\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u4e3b\u6599",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 1,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-040",
    "name": "\u5fb7\u5dde\u6252\u9e21",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c71\u4e1c\u9c81\u83dc",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u5fb7\u5dde\u6252\u9e21\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c71\u4e1c\u9c81\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-041",
    "name": "\u628a\u5b50\u8089",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c71\u4e1c\u9c81\u83dc",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u628a\u5b50\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c71\u4e1c\u9c81\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-042",
    "name": "\u56db\u559c\u4e38\u5b50",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c71\u4e1c\u9c81\u83dc",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u56db\u559c\u4e38\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c71\u4e1c\u9c81\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u4e3b\u6599",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-043",
    "name": "\u7cd6\u918b\u91cc\u810a",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c71\u4e1c\u9c81\u83dc",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u7cd6\u918b\u91cc\u810a\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c71\u4e1c\u9c81\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u4e3b\u6599",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u9178\u9999",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-044",
    "name": "\u98ce\u5473\u8304\u5b50",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c71\u4e1c\u9c81\u83dc",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u98ce\u5473\u8304\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c71\u4e1c\u9c81\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u8304\u5b50",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-045",
    "name": "\u9505\u584c\u8c46\u8150",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c71\u4e1c\u9c81\u83dc",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u9505\u584c\u8c46\u8150\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c71\u4e1c\u9c81\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u8c46\u8150",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-046",
    "name": "\u9505\u584c\u91cc\u810a",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c71\u4e1c\u9c81\u83dc",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u9505\u584c\u91cc\u810a\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c71\u4e1c\u9c81\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u4e3b\u6599",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-047",
    "name": "\u9c85\u9c7c\u6c34\u997a",
    "category": "\u9c81\u83dc",
    "subcategory": "\u997a\u5b50\u9984\u9968",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u9c85\u9c7c\u6c34\u997a\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u997a\u5b50\u9984\u9968",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9c7c\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u997a\u5b50\u76ae",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u8c03\u597d\u9985\u6599\uff0c\u6ce8\u610f\u6c34\u5206\u548c\u54b8\u6de1\u3002",
      "\u5305\u6210\u997a\u5b50\u3001\u9984\u9968\u6216\u9505\u8d34\uff0c\u5c01\u53e3\u538b\u7d27\u3002",
      "\u6c34\u716e\u3001\u84b8\u5236\u6216\u714e\u5236\u5230\u719f\u900f\u3002"
    ],
    "prepTime": 35,
    "cookTime": 15,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-048",
    "name": "\u6d77\u80a0\u635e\u996d",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c71\u4e1c\u9c81\u83dc",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u6d77\u80a0\u635e\u996d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c71\u4e1c\u9c81\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7c73\u996d",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-049",
    "name": "\u8fa3\u7092\u86e4\u870a",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c0f\u7092",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u8fa3\u7092\u86e4\u870a\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u86e4\u870a",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u9999\u8fa3",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 3,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-050",
    "name": "\u6cb9\u7116\u5927\u867e",
    "category": "\u9c81\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u6cb9\u7116\u5927\u867e\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u867e\u4ec1",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-051",
    "name": "\u8471\u7206\u7f8a\u8089",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c0f\u7092",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u8471\u7206\u7f8a\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7f8a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 1,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-052",
    "name": "\u8471\u70e7\u8e44\u7b4b",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c71\u4e1c\u9c81\u83dc",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u8471\u70e7\u8e44\u7b4b\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c71\u4e1c\u9c81\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u4e3b\u6599",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-053",
    "name": "\u9171\u7206\u9e21\u4e01",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c0f\u7092",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u9171\u7206\u9e21\u4e01\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 1,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-054",
    "name": "\u4f89\u7096\u9c7c",
    "category": "\u9c81\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u4f89\u7096\u9c7c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9c7c\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-055",
    "name": "\u6d4e\u5357\u751c\u6cab",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c71\u4e1c\u9c81\u83dc",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u6d4e\u5357\u751c\u6cab\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c71\u4e1c\u9c81\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u4e3b\u6599",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-056",
    "name": "\u6f4d\u574a\u671d\u5929\u9505",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c71\u4e1c\u9c81\u83dc",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u6f4d\u574a\u671d\u5929\u9505\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c71\u4e1c\u9c81\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u4e3b\u6599",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-057",
    "name": "\u5468\u6751\u70e7\u997c",
    "category": "\u9c81\u83dc",
    "subcategory": "\u997c\u7c7b",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u5468\u6751\u70e7\u997c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u997c\u7c7b",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-058",
    "name": "\u5355\u53bf\u7f8a\u8089\u6c64",
    "category": "\u9c81\u83dc",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u5355\u53bf\u7f8a\u8089\u6c64\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7f8a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-059",
    "name": "\u67a3\u5e84\u8fa3\u5b50\u9e21",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c71\u4e1c\u9c81\u83dc",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u67a3\u5e84\u8fa3\u5b50\u9e21\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c71\u4e1c\u9c81\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u9999\u8fa3",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 4,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-060",
    "name": "\u6d4e\u5b81\u750f\u8089\u5e72\u996d",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c71\u4e1c\u9c81\u83dc",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u6d4e\u5b81\u750f\u8089\u5e72\u996d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c71\u4e1c\u9c81\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u7c73\u996d",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-061",
    "name": "\u70df\u53f0\u7116\u5b50",
    "category": "\u9c81\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u70df\u53f0\u7116\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u4e3b\u6599",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-062",
    "name": "\u9ec4\u7116\u9e21\u7c73\u996d",
    "category": "\u9c81\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u9ec4\u7116\u9e21\u7c73\u996d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u7c73\u996d",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-063",
    "name": "\u80f6\u4e1c\u5927\u9992\u5934",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c71\u4e1c\u9c81\u83dc",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u80f6\u4e1c\u5927\u9992\u5934\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c71\u4e1c\u9c81\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-064",
    "name": "\u867e\u4ec1\u7092\u86cb",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c0f\u7092",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u867e\u4ec1\u7092\u86cb\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u867e\u4ec1",
        "\u9002\u91cf"
      ],
      [
        "\u9e21\u86cb",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-065",
    "name": "\u6d77\u9c9c\u7599\u7629\u6c64",
    "category": "\u9c81\u83dc",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u6d77\u9c9c\u7599\u7629\u6c64\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u4e3b\u6599",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-066",
    "name": "\u97ed\u83dc\u7092\u6d77\u80a0",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c0f\u7092",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u97ed\u83dc\u7092\u6d77\u80a0\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u97ed\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-067",
    "name": "\u849c\u84c9\u7c89\u4e1d\u6247\u8d1d",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c71\u4e1c\u9c81\u83dc",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u849c\u84c9\u7c89\u4e1d\u6247\u8d1d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c71\u4e1c\u9c81\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u6247\u8d1d",
        "\u9002\u91cf"
      ],
      [
        "\u7c89\u4e1d",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-068",
    "name": "\u7cd6\u918b\u85d5\u7247",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c71\u4e1c\u9c81\u83dc",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u7cd6\u918b\u85d5\u7247\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c71\u4e1c\u9c81\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u4e3b\u6599",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u9178\u9999",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-069",
    "name": "\u767d\u83dc\u7096\u8c46\u8150",
    "category": "\u9c81\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u767d\u83dc\u7096\u8c46\u8150\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u8c46\u8150",
        "\u9002\u91cf"
      ],
      [
        "\u767d\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-070",
    "name": "\u62d4\u4e1d\u5c71\u836f",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c71\u4e1c\u9c81\u83dc",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u62d4\u4e1d\u5c71\u836f\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c71\u4e1c\u9c81\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u4e3b\u6599",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u751c\u9999"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-071",
    "name": "\u6cb9\u7206\u6d77\u87ba",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c0f\u7092",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u6cb9\u7206\u6d77\u87ba\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u6d77\u87ba",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-072",
    "name": "\u9171\u7116\u9c85\u9c7c",
    "category": "\u9c81\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u9171\u7116\u9c85\u9c7c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9c7c\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-073",
    "name": "\u8471\u6cb9\u6d77\u53c2",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c71\u4e1c\u9c81\u83dc",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u8471\u6cb9\u6d77\u53c2\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c71\u4e1c\u9c81\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u6d77\u53c2",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-074",
    "name": "\u5c71\u4e1c\u9165\u9505",
    "category": "\u9c81\u83dc",
    "subcategory": "\u5c71\u4e1c\u9c81\u83dc",
    "description": "\u5c71\u4e1c\u5e38\u89c1\u9910\u54c1\u300c\u5c71\u4e1c\u9165\u9505\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u4e1c",
      "\u9c81\u83dc",
      "\u5c71\u4e1c\u9c81\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u4e3b\u6599",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b84a36",
      "#e8a05b",
      "#f6d7ad"
    ]
  },
  {
    "key": "north-menu-075",
    "name": "\u9505\u5305\u8089",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u5305\u70b9",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u9505\u5305\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u5305\u70b9",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u9178\u9999",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-076",
    "name": "\u5730\u4e09\u9c9c",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc\u70ed\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u5730\u4e09\u9c9c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc\u70ed\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-077",
    "name": "\u5c0f\u9e21\u7096\u8611\u83c7",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u5c0f\u9e21\u7096\u8611\u83c7\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-078",
    "name": "\u732a\u8089\u7096\u7c89\u6761",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u732a\u8089\u7096\u7c89\u6761\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u7c89\u6761",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-079",
    "name": "\u9178\u83dc\u767d\u8089",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc\u70ed\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u9178\u83dc\u767d\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc\u70ed\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9178\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u9178\u9999",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-080",
    "name": "\u6392\u9aa8\u7096\u8c46\u89d2",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u6392\u9aa8\u7096\u8c46\u89d2\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u6392\u9aa8",
        "\u9002\u91cf"
      ],
      [
        "\u8c46\u89d2",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-081",
    "name": "\u5f97\u83ab\u5229\u7096\u9c7c",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u5f97\u83ab\u5229\u7096\u9c7c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9c7c\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-082",
    "name": "\u6e9c\u8089\u6bb5",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc\u70ed\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u6e9c\u8089\u6bb5\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc\u70ed\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-083",
    "name": "\u5c16\u6912\u5e72\u8c46\u8150",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc\u70ed\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u5c16\u6912\u5e72\u8c46\u8150\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc\u70ed\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u8c46\u8150",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-084",
    "name": "\u4e1c\u5317\u4e71\u7096",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u4e1c\u5317\u4e71\u7096\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-085",
    "name": "\u9178\u83dc\u7096\u51bb\u8c46\u8150",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u9178\u83dc\u7096\u51bb\u8c46\u8150\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u8c46\u8150",
        "\u9002\u91cf"
      ],
      [
        "\u9178\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u9178\u9999",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-086",
    "name": "\u94c1\u9505\u7096\u5927\u9e45",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u94c1\u9505\u7096\u5927\u9e45\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e45\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-087",
    "name": "\u94c1\u9505\u7096\u9c7c",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u94c1\u9505\u7096\u9c7c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9c7c\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-088",
    "name": "\u8304\u5b50\u7096\u571f\u8c46",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u8304\u5b50\u7096\u571f\u8c46\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u571f\u8c46",
        "\u9002\u91cf"
      ],
      [
        "\u8304\u5b50",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-089",
    "name": "\u62d4\u4e1d\u5730\u74dc",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc\u70ed\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u62d4\u4e1d\u5730\u74dc\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc\u70ed\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u751c\u9999"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-090",
    "name": "\u4e1c\u5317\u5927\u62c9\u76ae",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc\u70ed\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u4e1c\u5317\u5927\u62c9\u76ae\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc\u70ed\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-091",
    "name": "\u8001\u864e\u83dc",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc\u70ed\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u8001\u864e\u83dc\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc\u70ed\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-092",
    "name": "\u8638\u9171\u83dc",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc\u70ed\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u8638\u9171\u83dc\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc\u70ed\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-093",
    "name": "\u6c88\u9633\u9e21\u67b6",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc\u70ed\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u6c88\u9633\u9e21\u67b6\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc\u70ed\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-094",
    "name": "\u718f\u8089\u5927\u997c",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u997c\u7c7b",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u718f\u8089\u5927\u997c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u997c\u7c7b",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-095",
    "name": "\u54c8\u5c14\u6ee8\u7ea2\u80a0",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc\u70ed\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u54c8\u5c14\u6ee8\u7ea2\u80a0\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc\u70ed\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-096",
    "name": "\u4fc4\u5f0f\u7ea2\u83dc\u6c64",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u4fc4\u5f0f\u7ea2\u83dc\u6c64\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-097",
    "name": "\u9171\u5927\u9aa8",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc\u70ed\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u9171\u5927\u9aa8\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc\u70ed\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-098",
    "name": "\u5bb6\u5e38\u51c9\u83dc",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u51c9\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u5bb6\u5e38\u51c9\u83dc\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u51c9\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u712f\u6c34\u6216\u5207\u914d\uff0c\u6ca5\u5e72\u6c34\u5206\u3002",
      "\u8c03\u597d\u849c\u3001\u918b\u3001\u9171\u6cb9\u3001\u9999\u6cb9\u7b49\u6599\u6c41\u3002",
      "\u62cc\u5300\u540e\u9759\u7f6e\u51e0\u5206\u949f\uff0c\u66f4\u5165\u5473\u518d\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u6e05\u723d",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-099",
    "name": "\u571f\u8c46\u7096\u725b\u8089",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u571f\u8c46\u7096\u725b\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u725b\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u571f\u8c46",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-100",
    "name": "\u8c46\u89d2\u7116\u9762",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u8c46\u89d2\u7116\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u8c46\u89d2",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-101",
    "name": "\u9178\u83dc\u9985\u997a\u5b50",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u997a\u5b50\u9984\u9968",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u9178\u83dc\u9985\u997a\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u997a\u5b50\u9984\u9968",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9178\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u997a\u5b50\u76ae",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u8c03\u597d\u9985\u6599\uff0c\u6ce8\u610f\u6c34\u5206\u548c\u54b8\u6de1\u3002",
      "\u5305\u6210\u997a\u5b50\u3001\u9984\u9968\u6216\u9505\u8d34\uff0c\u5c01\u53e3\u538b\u7d27\u3002",
      "\u6c34\u716e\u3001\u84b8\u5236\u6216\u714e\u5236\u5230\u719f\u900f\u3002"
    ],
    "prepTime": 35,
    "cookTime": 15,
    "difficulty": "medium",
    "taste": [
      "\u9178\u9999",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-102",
    "name": "\u732a\u8089\u767d\u83dc\u997a\u5b50",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u997a\u5b50\u9984\u9968",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u732a\u8089\u767d\u83dc\u997a\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u997a\u5b50\u9984\u9968",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u767d\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u997a\u5b50\u76ae",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u8c03\u597d\u9985\u6599\uff0c\u6ce8\u610f\u6c34\u5206\u548c\u54b8\u6de1\u3002",
      "\u5305\u6210\u997a\u5b50\u3001\u9984\u9968\u6216\u9505\u8d34\uff0c\u5c01\u53e3\u538b\u7d27\u3002",
      "\u6c34\u716e\u3001\u84b8\u5236\u6216\u714e\u5236\u5230\u719f\u900f\u3002"
    ],
    "prepTime": 35,
    "cookTime": 15,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-103",
    "name": "\u7c98\u8c46\u5305",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u5305\u70b9",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u7c98\u8c46\u5305\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u5305\u70b9",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u751c\u9999"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-104",
    "name": "\u7389\u7c73\u9762\u5927\u997c\u5b50",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u9762\u98df",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u7389\u7c73\u9762\u5927\u997c\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u7389\u7c73",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-105",
    "name": "\u97ed\u83dc\u76d2\u5b50",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc\u70ed\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u97ed\u83dc\u76d2\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc\u70ed\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u97ed\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-106",
    "name": "\u7092\u7b28\u9e21\u86cb",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u5c0f\u7092",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u7092\u7b28\u9e21\u86cb\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9e21\u86cb",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-107",
    "name": "\u9e21\u86cb\u9171\u62cc\u83dc",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u51c9\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u9e21\u86cb\u9171\u62cc\u83dc\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u51c9\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9e21\u86cb",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u712f\u6c34\u6216\u5207\u914d\uff0c\u6ca5\u5e72\u6c34\u5206\u3002",
      "\u8c03\u597d\u849c\u3001\u918b\u3001\u9171\u6cb9\u3001\u9999\u6cb9\u7b49\u6599\u6c41\u3002",
      "\u62cc\u5300\u540e\u9759\u7f6e\u51e0\u5206\u949f\uff0c\u66f4\u5165\u5473\u518d\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u6e05\u723d",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-108",
    "name": "\u9178\u83dc\u4e94\u82b1\u8089\u706b\u9505",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u70e7\u70e4\u706b\u9505",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u9178\u83dc\u4e94\u82b1\u8089\u706b\u9505\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u70e7\u70e4\u706b\u9505",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u4e94\u82b1\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9178\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u8089\u7c7b\u3001\u852c\u83dc\u548c\u8638\u6599\uff0c\u98df\u6750\u5207\u6210\u9002\u53e3\u5927\u5c0f\u3002",
      "\u6839\u636e\u719f\u6210\u65f6\u95f4\u70e4\u3001\u6dae\u6216\u716e\u5230\u521a\u719f\u3002",
      "\u642d\u914d\u8638\u6599\u98df\u7528\uff0c\u6309\u4e24\u4e2a\u4eba\u53e3\u5473\u8c03\u6574\u8fa3\u5ea6\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u9178\u9999",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-109",
    "name": "\u4e1c\u5317\u996d\u5305",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u5305\u70b9",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u4e1c\u5317\u996d\u5305\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u5305\u70b9",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u7c73\u996d",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-110",
    "name": "\u9505\u51fa\u6e9c",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc\u70ed\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u9505\u51fa\u6e9c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc\u70ed\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-111",
    "name": "\u6740\u732a\u83dc",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc\u70ed\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u6740\u732a\u83dc\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc\u70ed\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-112",
    "name": "\u5c16\u6912\u571f\u8c46\u7247",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc\u70ed\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u5c16\u6912\u571f\u8c46\u7247\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc\u70ed\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u571f\u8c46",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-113",
    "name": "\u849c\u6ce5\u8840\u80a0",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc\u70ed\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u849c\u6ce5\u8840\u80a0\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc\u70ed\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-114",
    "name": "\u9178\u83dc\u7c89\u4e1d\u6c46\u767d\u8089",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc\u70ed\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u9178\u83dc\u7c89\u4e1d\u6c46\u767d\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc\u70ed\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u7c89\u4e1d",
        "\u9002\u91cf"
      ],
      [
        "\u9178\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u9178\u9999",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-115",
    "name": "\u8304\u76d2",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc\u70ed\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u8304\u76d2\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc\u70ed\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-116",
    "name": "\u5e72\u7178\u8695\u86f9",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc\u70ed\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u5e72\u7178\u8695\u86f9\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc\u70ed\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-117",
    "name": "\u8471\u70e7\u6728\u8033",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc\u70ed\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u8471\u70e7\u6728\u8033\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc\u70ed\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u6728\u8033",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-118",
    "name": "\u9171\u7116\u560e\u9c7c",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u9171\u7116\u560e\u9c7c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9c7c\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-119",
    "name": "\u8089\u6bb5\u70e7\u8304\u5b50",
    "category": "\u4e1c\u5317\u83dc",
    "subcategory": "\u7096\u83dc\u70ed\u83dc",
    "description": "\u4e1c\u5317\u5e38\u89c1\u9910\u54c1\u300c\u8089\u6bb5\u70e7\u8304\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u4e1c\u5317",
      "\u4e1c\u5317\u83dc",
      "\u7096\u83dc\u70ed\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8304\u5b50",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#8e4f37",
      "#d08b4f",
      "#f3d7b5"
    ]
  },
  {
    "key": "north-menu-120",
    "name": "\u5200\u524a\u9762",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u9762\u98df",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u5200\u524a\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-121",
    "name": "\u5927\u540c\u5200\u524a\u9762",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u9762\u98df",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u5927\u540c\u5200\u524a\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-122",
    "name": "\u5254\u5c16",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u5c71\u897f\u9762\u98df",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u5254\u5c16\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u5c71\u897f\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-123",
    "name": "\u732b\u8033\u6735",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u5c71\u897f\u9762\u98df",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u732b\u8033\u6735\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u5c71\u897f\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-124",
    "name": "\u839c\u9762\u6832\u6833\u6833",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u9762\u98df",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u839c\u9762\u6832\u6833\u6833\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-125",
    "name": "\u5c71\u897f\u8fc7\u6cb9\u8089",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u5c71\u897f\u9762\u98df",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u5c71\u897f\u8fc7\u6cb9\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u5c71\u897f\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-126",
    "name": "\u5c71\u897f\u6253\u5364\u9762",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u9762\u98df",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u5c71\u897f\u6253\u5364\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-127",
    "name": "\u7092\u4e0d\u70c2\u5b50",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u5c0f\u7092",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u7092\u4e0d\u70c2\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-128",
    "name": "\u62e8\u70c2\u5b50",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u5c71\u897f\u9762\u98df",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u62e8\u70c2\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u5c71\u897f\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-129",
    "name": "\u7f8a\u6742\u5272",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u5c71\u897f\u9762\u98df",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u7f8a\u6742\u5272\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u5c71\u897f\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7f8a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-130",
    "name": "\u592a\u539f\u5934\u8111",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u5c71\u897f\u9762\u98df",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u592a\u539f\u5934\u8111\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u5c71\u897f\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-131",
    "name": "\u5e73\u9065\u725b\u8089",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u5c71\u897f\u9762\u98df",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u5e73\u9065\u725b\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u5c71\u897f\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u725b\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-132",
    "name": "\u5927\u540c\u9ec4\u7cd5",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u5c71\u897f\u9762\u98df",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u5927\u540c\u9ec4\u7cd5\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u5c71\u897f\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-133",
    "name": "\u6d51\u6e90\u51c9\u7c89",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u51c9\u83dc",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u6d51\u6e90\u51c9\u7c89\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u51c9\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u712f\u6c34\u6216\u5207\u914d\uff0c\u6ca5\u5e72\u6c34\u5206\u3002",
      "\u8c03\u597d\u849c\u3001\u918b\u3001\u9171\u6cb9\u3001\u9999\u6cb9\u7b49\u6599\u6c41\u3002",
      "\u62cc\u5300\u540e\u9759\u7f6e\u51e0\u5206\u949f\uff0c\u66f4\u5165\u5473\u518d\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u6e05\u723d",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-134",
    "name": "\u8001\u9648\u918b\u7116\u8089",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u7096\u83dc",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u8001\u9648\u918b\u7116\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u9178\u9999",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-135",
    "name": "\u7802\u9505\u5200\u524a\u9762",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u9762\u98df",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u7802\u9505\u5200\u524a\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-136",
    "name": "\u7f8a\u8089\u81ca\u5b50\u9762",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u9762\u98df",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u7f8a\u8089\u81ca\u5b50\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7f8a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-137",
    "name": "\u63ea\u7247",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u5c71\u897f\u9762\u98df",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u63ea\u7247\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u5c71\u897f\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-138",
    "name": "\u6cb3\u635e\u9762",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u9762\u98df",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u6cb3\u635e\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-139",
    "name": "\u64e6\u5c16\u9762",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u9762\u98df",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u64e6\u5c16\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-140",
    "name": "\u7092\u997c\u4e1d",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997c\u7c7b",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u7092\u997c\u4e1d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u997c\u7c7b",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-141",
    "name": "\u70d9\u997c\u5377\u571f\u8c46\u4e1d",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997c\u7c7b",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u70d9\u997c\u5377\u571f\u8c46\u4e1d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u997c\u7c7b",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u571f\u8c46",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-142",
    "name": "\u7cd6\u918b\u4e38\u5b50",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u5c71\u897f\u9762\u98df",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u7cd6\u918b\u4e38\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u5c71\u897f\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u9178\u9999",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-143",
    "name": "\u5c71\u897f\u6cb9\u7cd5",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u5c71\u897f\u9762\u98df",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u5c71\u897f\u6cb9\u7cd5\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u5c71\u897f\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-144",
    "name": "\u67f3\u6797\u7897\u56e2",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u5c71\u897f\u9762\u98df",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u67f3\u6797\u7897\u56e2\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u5c71\u897f\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-145",
    "name": "\u664b\u4e2d\u6cb9\u8336",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u5c71\u897f\u9762\u98df",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u664b\u4e2d\u6cb9\u8336\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u5c71\u897f\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-146",
    "name": "\u95fb\u559c\u716e\u997c",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u7096\u83dc",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u95fb\u559c\u716e\u997c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u751c\u9999"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-147",
    "name": "\u592a\u8c37\u997c",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997c\u7c7b",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u592a\u8c37\u997c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u997c\u7c7b",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u751c\u9999"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-148",
    "name": "\u82b1\u998d",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u9762\u98df",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u82b1\u998d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-149",
    "name": "\u5c71\u897f\u7092\u9762",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u9762\u98df",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u5c71\u897f\u7092\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-150",
    "name": "\u839c\u9762\u9c7c\u9c7c",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u9762\u98df",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u839c\u9762\u9c7c\u9c7c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9c7c\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-151",
    "name": "\u6832\u6833\u6833\u8638\u7f8a\u8089\u6c64",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u6832\u6833\u6833\u8638\u7f8a\u8089\u6c64\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7f8a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-152",
    "name": "\u5c71\u897f\u70e9\u83dc",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u7096\u83dc",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u5c71\u897f\u70e9\u83dc\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-153",
    "name": "\u839c\u9762\u7a9d\u7a9d",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u9762\u98df",
    "description": "\u5c71\u897f\u5e38\u89c1\u9910\u54c1\u300c\u839c\u9762\u7a9d\u7a9d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5c71\u897f",
      "\u9762\u98df\u4e3b\u98df",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-154",
    "name": "\u8089\u5939\u998d",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u8089\u5939\u998d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-155",
    "name": "\u7f8a\u8089\u6ce1\u998d",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u7f8a\u8089\u6ce1\u998d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7f8a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-156",
    "name": "\u9655\u897f\u51c9\u76ae",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u51c9\u83dc",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u9655\u897f\u51c9\u76ae\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u51c9\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u712f\u6c34\u6216\u5207\u914d\uff0c\u6ca5\u5e72\u6c34\u5206\u3002",
      "\u8c03\u597d\u849c\u3001\u918b\u3001\u9171\u6cb9\u3001\u9999\u6cb9\u7b49\u6599\u6c41\u3002",
      "\u62cc\u5300\u540e\u9759\u7f6e\u51e0\u5206\u949f\uff0c\u66f4\u5165\u5473\u518d\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u6e05\u723d",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-157",
    "name": "\u81ca\u5b50\u9762",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u81ca\u5b50\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-158",
    "name": "biangbiang\u9762",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300cbiangbiang\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-159",
    "name": "\u6cb9\u6cfc\u9762",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u6cb9\u6cfc\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-160",
    "name": "\u5c90\u5c71\u81ca\u5b50\u9762",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u5c90\u5c71\u81ca\u5b50\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-161",
    "name": "\u846b\u82a6\u9e21",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df\u5c0f\u5403",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u846b\u82a6\u9e21\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-162",
    "name": "\u6c34\u76c6\u7f8a\u8089",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df\u5c0f\u5403",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u6c34\u76c6\u7f8a\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7f8a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-163",
    "name": "\u7511\u7cd5",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df\u5c0f\u5403",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u7511\u7cd5\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u751c\u9999"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-164",
    "name": "\u9ebb\u98df",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df\u5c0f\u5403",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u9ebb\u98df\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-165",
    "name": "\u6405\u56e2",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df\u5c0f\u5403",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u6405\u56e2\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-166",
    "name": "\u6d46\u6c34\u9762",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u6d46\u6c34\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u9178\u9999",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-167",
    "name": "\u7f8a\u8089\u81ca\u5b50\u9978\u9979",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df\u5c0f\u5403",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u7f8a\u8089\u81ca\u5b50\u9978\u9979\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7f8a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-168",
    "name": "\u5170\u5dde\u725b\u8089\u9762",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u5170\u5dde\u725b\u8089\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u725b\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-169",
    "name": "\u624b\u6293\u7f8a\u8089",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df\u5c0f\u5403",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u624b\u6293\u7f8a\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7f8a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-170",
    "name": "\u5927\u76d8\u9e21",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df\u5c0f\u5403",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u5927\u76d8\u9e21\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 4,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-171",
    "name": "\u70e4\u7f8a\u8089\u4e32",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u70e7\u70e4\u706b\u9505",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u70e4\u7f8a\u8089\u4e32\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u70e7\u70e4\u706b\u9505",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7f8a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u8089\u7c7b\u3001\u852c\u83dc\u548c\u8638\u6599\uff0c\u98df\u6750\u5207\u6210\u9002\u53e3\u5927\u5c0f\u3002",
      "\u6839\u636e\u719f\u6210\u65f6\u95f4\u70e4\u3001\u6dae\u6216\u716e\u5230\u521a\u719f\u3002",
      "\u642d\u914d\u8638\u6599\u98df\u7528\uff0c\u6309\u4e24\u4e2a\u4eba\u53e3\u5473\u8c03\u6574\u8fa3\u5ea6\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-172",
    "name": "\u5b5c\u7136\u7f8a\u8089",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df\u5c0f\u5403",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u5b5c\u7136\u7f8a\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7f8a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 3,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-173",
    "name": "\u9995\u5305\u8089",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u5305\u70b9",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u9995\u5305\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u5305\u70b9",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-174",
    "name": "\u7092\u62c9\u6761\u5b50",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u5c0f\u7092",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u7092\u62c9\u6761\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-175",
    "name": "\u7f8a\u8089\u63ea\u7247\u5b50",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df\u5c0f\u5403",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u7f8a\u8089\u63ea\u7247\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7f8a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-176",
    "name": "\u70e4\u5305\u5b50",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u5305\u70b9",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u70e4\u5305\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u5305\u70b9",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-177",
    "name": "\u80e1\u8fa3\u7f8a\u8e44",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df\u5c0f\u5403",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u80e1\u8fa3\u7f8a\u8e44\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7f8a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u9999\u8fa3",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 4,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-178",
    "name": "\u8fc7\u6cb9\u8089\u62cc\u9762",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u8fc7\u6cb9\u8089\u62cc\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u6e05\u723d",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-179",
    "name": "\u5976\u8336\u624b\u6252\u8089",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df\u5c0f\u5403",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u5976\u8336\u624b\u6252\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-180",
    "name": "\u8499\u53e4\u70e4\u7f8a\u6392",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u70e7\u70e4\u706b\u9505",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u8499\u53e4\u70e4\u7f8a\u6392\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u70e7\u70e4\u706b\u9505",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7f8a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u8089\u7c7b\u3001\u852c\u83dc\u548c\u8638\u6599\uff0c\u98df\u6750\u5207\u6210\u9002\u53e3\u5927\u5c0f\u3002",
      "\u6839\u636e\u719f\u6210\u65f6\u95f4\u70e4\u3001\u6dae\u6216\u716e\u5230\u521a\u719f\u3002",
      "\u642d\u914d\u8638\u6599\u98df\u7528\uff0c\u6309\u4e24\u4e2a\u4eba\u53e3\u5473\u8c03\u6574\u8fa3\u5ea6\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-181",
    "name": "\u624b\u628a\u8089",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df\u5c0f\u5403",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u624b\u628a\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-182",
    "name": "\u98ce\u5e72\u725b\u8089\u7092\u82b9\u83dc",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u5c0f\u7092",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u98ce\u5e72\u725b\u8089\u7092\u82b9\u83dc\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u725b\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u82b9\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-183",
    "name": "\u7f8a\u6742\u6c64",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u7f8a\u6742\u6c64\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7f8a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-184",
    "name": "\u9178\u6c64\u6c34\u997a",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u9178\u6c64\u6c34\u997a\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u997a\u5b50\u76ae",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u9178\u9999",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-185",
    "name": "\u725b\u8089\u5c0f\u996d",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df\u5c0f\u5403",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u725b\u8089\u5c0f\u996d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u725b\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u7c73\u996d",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-186",
    "name": "\u9655\u897f\u6d46\u6c34\u9c7c\u9c7c",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df\u5c0f\u5403",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u9655\u897f\u6d46\u6c34\u9c7c\u9c7c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9c7c\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u9178\u9999",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-187",
    "name": "\u6d0b\u828b\u64e6\u64e6",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df\u5c0f\u5403",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u6d0b\u828b\u64e6\u64e6\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-188",
    "name": "\u9655\u5317\u7f8a\u8089\u9762",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u9655\u5317\u7f8a\u8089\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7f8a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-189",
    "name": "\u6986\u6797\u62fc\u4e09\u9c9c",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df\u5c0f\u5403",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u6986\u6797\u62fc\u4e09\u9c9c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-190",
    "name": "\u9505\u76d4",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df\u5c0f\u5403",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u9505\u76d4\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-191",
    "name": "\u7c89\u6c64\u7f8a\u8840",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u7c89\u6c64\u7f8a\u8840\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7f8a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-192",
    "name": "\u6c49\u4e2d\u70ed\u7c73\u76ae",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df\u5c0f\u5403",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u6c49\u4e2d\u70ed\u7c73\u76ae\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-193",
    "name": "\u814a\u725b\u7f8a\u8089\u5939\u998d",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u814a\u725b\u7f8a\u8089\u5939\u998d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7f8a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u725b\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-194",
    "name": "\u91d1\u7ebf\u6cb9\u5854",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df\u5c0f\u5403",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u91d1\u7ebf\u6cb9\u5854\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-195",
    "name": "\u65b0\u7586\u62cc\u9762",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u65b0\u7586\u62cc\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u6e05\u723d",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-196",
    "name": "\u7092\u7c73\u7c89",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u5c0f\u7092",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u7092\u7c73\u7c89\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 4,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-197",
    "name": "\u6912\u9ebb\u9e21",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df\u5c0f\u5403",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u6912\u9ebb\u9e21\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u9999\u8fa3",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 4,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-198",
    "name": "\u6293\u996d",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df\u5c0f\u5403",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u6293\u996d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u7c73\u996d",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-199",
    "name": "\u70e4\u9995",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u70e7\u70e4\u706b\u9505",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u70e4\u9995\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u70e7\u70e4\u706b\u9505",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u8089\u7c7b\u3001\u852c\u83dc\u548c\u8638\u6599\uff0c\u98df\u6750\u5207\u6210\u9002\u53e3\u5927\u5c0f\u3002",
      "\u6839\u636e\u719f\u6210\u65f6\u95f4\u70e4\u3001\u6dae\u6216\u716e\u5230\u521a\u719f\u3002",
      "\u642d\u914d\u8638\u6599\u98df\u7528\uff0c\u6309\u4e24\u4e2a\u4eba\u53e3\u5473\u8c03\u6574\u8fa3\u5ea6\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-200",
    "name": "\u70e9\u5c0f\u5403",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u70e9\u5c0f\u5403\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-201",
    "name": "\u725b\u8089\u4e38\u5b50\u80e1\u8fa3\u6c64",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u725b\u8089\u4e38\u5b50\u80e1\u8fa3\u6c64\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u725b\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u9999\u8fa3",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 4,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-202",
    "name": "\u7f8a\u8089\u70e9\u9ebb\u98df",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u7f8a\u8089\u70e9\u9ebb\u98df\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7f8a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-203",
    "name": "\u6cb9\u65cb",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df\u5c0f\u5403",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u6cb9\u65cb\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-204",
    "name": "\u97ed\u53f6\u9762",
    "category": "\u897f\u5317\u83dc",
    "subcategory": "\u9762\u98df",
    "description": "\u9655\u897f\u897f\u5317\u5e38\u89c1\u9910\u54c1\u300c\u97ed\u53f6\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u9655\u897f\u897f\u5317",
      "\u897f\u5317\u83dc",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#b65f2f",
      "#e6a24f",
      "#f6d28a"
    ]
  },
  {
    "key": "north-menu-205",
    "name": "\u6cb3\u5357\u70e9\u9762",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u6cb3\u5357\u70e9\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-206",
    "name": "\u80e1\u8fa3\u6c64",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u80e1\u8fa3\u6c64\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u9999\u8fa3",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 4,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-207",
    "name": "\u6c34\u714e\u5305",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u5305\u70b9",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u6c34\u714e\u5305\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u5305\u70b9",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-208",
    "name": "\u6d1b\u9633\u6c34\u5e2d\u7261\u4e39\u71d5\u83dc",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u6c64\u9762\u5c0f\u5403",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u6d1b\u9633\u6c34\u5e2d\u7261\u4e39\u71d5\u83dc\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u6c64\u9762\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-209",
    "name": "\u9053\u53e3\u70e7\u9e21",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u6c64\u9762\u5c0f\u5403",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u9053\u53e3\u70e7\u9e21\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u6c64\u9762\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-210",
    "name": "\u5f00\u5c01\u704c\u6c64\u5305",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u5f00\u5c01\u704c\u6c64\u5305\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-211",
    "name": "\u70b8\u516b\u5757",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u70b8\u7269",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u70b8\u516b\u5757\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u70b8\u7269",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u814c\u5236\u5165\u5473\uff0c\u6302\u7cca\u6216\u62cd\u7c89\u3002",
      "\u6cb9\u6e29\u5347\u8d77\u540e\u5206\u6279\u70b8\u5230\u5b9a\u578b\u3002",
      "\u590d\u70b8\u6216\u56de\u9505\u8c03\u6c41\uff0c\u4fdd\u6301\u5916\u9165\u91cc\u5ae9\u3002"
    ],
    "prepTime": 20,
    "cookTime": 20,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-212",
    "name": "\u9ca4\u9c7c\u7119\u9762",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u9762\u98df",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u9ca4\u9c7c\u7119\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9c7c\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-213",
    "name": "\u535a\u7231\u6742\u62cc",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u51c9\u83dc",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u535a\u7231\u6742\u62cc\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u51c9\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u712f\u6c34\u6216\u5207\u914d\uff0c\u6ca5\u5e72\u6c34\u5206\u3002",
      "\u8c03\u597d\u849c\u3001\u918b\u3001\u9171\u6cb9\u3001\u9999\u6cb9\u7b49\u6599\u6c41\u3002",
      "\u62cc\u5300\u540e\u9759\u7f6e\u51e0\u5206\u949f\uff0c\u66f4\u5165\u5473\u518d\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u6e05\u723d",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-214",
    "name": "\u900d\u9065\u9547\u80e1\u8fa3\u6c64",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u900d\u9065\u9547\u80e1\u8fa3\u6c64\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u9999\u8fa3",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 4,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-215",
    "name": "\u5b89\u9633\u6241\u7c89\u83dc",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u6c64\u9762\u5c0f\u5403",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u5b89\u9633\u6241\u7c89\u83dc\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u6c64\u9762\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-216",
    "name": "\u4e94\u9999\u70e7\u997c",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u997c\u7c7b",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u4e94\u9999\u70e7\u997c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u997c\u7c7b",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-217",
    "name": "\u7126\u4f5c\u95f9\u6c64\u9a74\u8089",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u7126\u4f5c\u95f9\u6c64\u9a74\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-218",
    "name": "\u6d1b\u9633\u725b\u8089\u6c64",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u6d1b\u9633\u725b\u8089\u6c64\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u725b\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-219",
    "name": "\u6d1b\u9633\u4e0d\u7ffb\u6c64",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u6d1b\u9633\u4e0d\u7ffb\u6c64\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-220",
    "name": "\u7f8a\u8089\u6c64\u70e9\u997c",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u7f8a\u8089\u6c64\u70e9\u997c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7f8a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-221",
    "name": "\u5f00\u5c01\u6876\u5b50\u9e21",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u6c64\u9762\u5c0f\u5403",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u5f00\u5c01\u6876\u5b50\u9e21\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u6c64\u9762\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-222",
    "name": "\u6c74\u4eac\u70e4\u9e2d",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u70e7\u70e4\u706b\u9505",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u6c74\u4eac\u70e4\u9e2d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u70e7\u70e4\u706b\u9505",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e2d\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u8089\u7c7b\u3001\u852c\u83dc\u548c\u8638\u6599\uff0c\u98df\u6750\u5207\u6210\u9002\u53e3\u5927\u5c0f\u3002",
      "\u6839\u636e\u719f\u6210\u65f6\u95f4\u70e4\u3001\u6dae\u6216\u716e\u5230\u521a\u719f\u3002",
      "\u642d\u914d\u8638\u6599\u98df\u7528\uff0c\u6309\u4e24\u4e2a\u4eba\u53e3\u5473\u8c03\u6574\u8fa3\u5ea6\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-223",
    "name": "\u70b8\u7d2b\u9165\u8089",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u70b8\u7269",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u70b8\u7d2b\u9165\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u70b8\u7269",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u814c\u5236\u5165\u5473\uff0c\u6302\u7cca\u6216\u62cd\u7c89\u3002",
      "\u6cb9\u6e29\u5347\u8d77\u540e\u5206\u6279\u70b8\u5230\u5b9a\u578b\u3002",
      "\u590d\u70b8\u6216\u56de\u9505\u8c03\u6c41\uff0c\u4fdd\u6301\u5916\u9165\u91cc\u5ae9\u3002"
    ],
    "prepTime": 20,
    "cookTime": 20,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-224",
    "name": "\u6252\u5e7f\u809a",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u6c64\u9762\u5c0f\u5403",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u6252\u5e7f\u809a\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u6c64\u9762\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-225",
    "name": "\u714e\u6252\u9752\u9c7c\u5934\u5c3e",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u714e\u70d9",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u714e\u6252\u9752\u9c7c\u5934\u5c3e\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u714e\u70d9",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9c7c\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-226",
    "name": "\u70e9\u7f8a\u8089",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u70e9\u7f8a\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7f8a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-227",
    "name": "\u9e21\u86cb\u5e03\u888b",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u6c64\u9762\u5c0f\u5403",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u9e21\u86cb\u5e03\u888b\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u6c64\u9762\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9e21\u86cb",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-228",
    "name": "\u7c89\u6d46\u9762\u6761",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u9762\u98df",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u7c89\u6d46\u9762\u6761\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-229",
    "name": "\u829d\u9ebb\u53f6\u9762\u6761",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u9762\u98df",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u829d\u9ebb\u53f6\u9762\u6761\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-230",
    "name": "\u83dc\u89d2",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u6c64\u9762\u5c0f\u5403",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u83dc\u89d2\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u6c64\u9762\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-231",
    "name": "\u6cb9\u998d\u5934",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u9762\u98df",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u6cb9\u998d\u5934\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-232",
    "name": "\u70d9\u998d\u5377\u83dc",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u9762\u98df",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u70d9\u998d\u5377\u83dc\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-233",
    "name": "\u53d8\u86cb\u62cc\u8c46\u8150",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u51c9\u83dc",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u53d8\u86cb\u62cc\u8c46\u8150\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u51c9\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u9e21\u86cb",
        "\u9002\u91cf"
      ],
      [
        "\u8c46\u8150",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u712f\u6c34\u6216\u5207\u914d\uff0c\u6ca5\u5e72\u6c34\u5206\u3002",
      "\u8c03\u597d\u849c\u3001\u918b\u3001\u9171\u6cb9\u3001\u9999\u6cb9\u7b49\u6599\u6c41\u3002",
      "\u62cc\u5300\u540e\u9759\u7f6e\u51e0\u5206\u949f\uff0c\u66f4\u5165\u5473\u518d\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u6e05\u723d",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-234",
    "name": "\u84b8\u5364\u9762",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u9762\u98df",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u84b8\u5364\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-235",
    "name": "\u6263\u7897\u9165\u8089",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u84b8\u83dc",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u6263\u7897\u9165\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u84b8\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-236",
    "name": "\u6263\u7897\u5c0f\u9165\u8089",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u84b8\u83dc",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u6263\u7897\u5c0f\u9165\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u84b8\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-237",
    "name": "\u5357\u9633\u84b8\u83dc",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u84b8\u83dc",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u5357\u9633\u84b8\u83dc\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u84b8\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-238",
    "name": "\u4fe1\u9633\u7096\u83dc",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u4fe1\u9633\u7096\u83dc\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-239",
    "name": "\u7f8a\u8089\u7095\u998d",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u9762\u98df",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u7f8a\u8089\u7095\u998d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7f8a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-240",
    "name": "\u80e1\u8fa3\u6c64\u914d\u6cb9\u998d\u5934",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u80e1\u8fa3\u6c64\u914d\u6cb9\u998d\u5934\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u9999\u8fa3",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 4,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-241",
    "name": "\u6d46\u9762\u6761",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u9762\u98df",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u6d46\u9762\u6761\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-242",
    "name": "\u8c46\u8150\u8111\u54b8\u6c64",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u8c46\u8150\u8111\u54b8\u6c64\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u8c46\u8150",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-243",
    "name": "\u70eb\u9762\u89d2",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u9762\u98df",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u70eb\u9762\u89d2\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-244",
    "name": "\u725b\u8089\u76d2\u5b50",
    "category": "\u4e2d\u539f\u83dc",
    "subcategory": "\u6c64\u9762\u5c0f\u5403",
    "description": "\u6cb3\u5357\u4e2d\u539f\u5e38\u89c1\u9910\u54c1\u300c\u725b\u8089\u76d2\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u6cb3\u5357\u4e2d\u539f",
      "\u4e2d\u539f\u83dc",
      "\u6c64\u9762\u5c0f\u5403",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u725b\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#a85e3c",
      "#d9955f",
      "#f4ddbd"
    ]
  },
  {
    "key": "north-menu-245",
    "name": "\u9178\u8fa3\u571f\u8c46\u4e1d",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u9178\u8fa3\u571f\u8c46\u4e1d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u571f\u8c46",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u9999\u8fa3",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 3,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-246",
    "name": "\u918b\u6e9c\u767d\u83dc",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u918b\u6e9c\u767d\u83dc\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u767d\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u9178\u9999",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-247",
    "name": "\u6728\u987b\u8089",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u6728\u987b\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-248",
    "name": "\u849c\u82d4\u7092\u8089",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u849c\u82d4\u7092\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-249",
    "name": "\u9752\u6912\u7092\u8089",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u9752\u6912\u7092\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-250",
    "name": "\u97ed\u83dc\u7092\u9e21\u86cb",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u97ed\u83dc\u7092\u9e21\u86cb\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9e21\u86cb",
        "\u9002\u91cf"
      ],
      [
        "\u97ed\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-251",
    "name": "\u9ec4\u74dc\u7092\u9e21\u86cb",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u9ec4\u74dc\u7092\u9e21\u86cb\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9e21\u86cb",
        "\u9002\u91cf"
      ],
      [
        "\u9ec4\u74dc",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-252",
    "name": "\u83e0\u83dc\u7092\u9e21\u86cb",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u83e0\u83dc\u7092\u9e21\u86cb\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9e21\u86cb",
        "\u9002\u91cf"
      ],
      [
        "\u83e0\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-253",
    "name": "\u82b9\u83dc\u7092\u8089",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u82b9\u83dc\u7092\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u82b9\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-254",
    "name": "\u6d0b\u8471\u7092\u725b\u8089",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u6d0b\u8471\u7092\u725b\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u725b\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-255",
    "name": "\u5706\u767d\u83dc\u7092\u7c89\u4e1d",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u5706\u767d\u83dc\u7092\u7c89\u4e1d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u767d\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u7c89\u4e1d",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-256",
    "name": "\u8089\u672b\u8c46\u89d2",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u8089\u672b\u8c46\u89d2\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8c46\u89d2",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-257",
    "name": "\u5e72\u7178\u8c46\u89d2",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u5e72\u7178\u8c46\u89d2\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u8c46\u89d2",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-258",
    "name": "\u7ea2\u70e7\u8304\u5b50",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u7ea2\u70e7\u8304\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u8304\u5b50",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-259",
    "name": "\u7ea2\u70e7\u6392\u9aa8",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u7ea2\u70e7\u6392\u9aa8\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u6392\u9aa8",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-260",
    "name": "\u7cd6\u918b\u6392\u9aa8",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u7cd6\u918b\u6392\u9aa8\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u6392\u9aa8",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u9178\u9999",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-261",
    "name": "\u53ef\u4e50\u9e21\u7fc5",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u53ef\u4e50\u9e21\u7fc5\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-262",
    "name": "\u7ea2\u70e7\u9e21\u7fc5",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u7ea2\u70e7\u9e21\u7fc5\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-263",
    "name": "\u571f\u8c46\u7096\u9e21\u5757",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u571f\u8c46\u7096\u9e21\u5757\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u571f\u8c46",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-264",
    "name": "\u571f\u8c46\u7096\u725b\u8169",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u571f\u8c46\u7096\u725b\u8169\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u725b\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u571f\u8c46",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-265",
    "name": "\u756a\u8304\u725b\u8169",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u756a\u8304\u725b\u8169\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u725b\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u756a\u8304",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-266",
    "name": "\u51ac\u74dc\u4e38\u5b50\u6c64",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u51ac\u74dc\u4e38\u5b50\u6c64\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-267",
    "name": "\u7d2b\u83dc\u86cb\u82b1\u6c64",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u7d2b\u83dc\u86cb\u82b1\u6c64\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9e21\u86cb",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-268",
    "name": "\u5c0f\u767d\u83dc\u8c46\u8150\u6c64",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u5c0f\u767d\u83dc\u8c46\u8150\u6c64\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u8c46\u8150",
        "\u9002\u91cf"
      ],
      [
        "\u767d\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-269",
    "name": "\u6392\u9aa8\u7389\u7c73\u6c64",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u6392\u9aa8\u7389\u7c73\u6c64\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u6392\u9aa8",
        "\u9002\u91cf"
      ],
      [
        "\u7389\u7c73",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-270",
    "name": "\u9178\u83dc\u9c7c\u7247",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u9178\u83dc\u9c7c\u7247\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9c7c\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9178\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u9178\u9999",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-271",
    "name": "\u849c\u84c9\u6cb9\u9ea6\u83dc",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u849c\u84c9\u6cb9\u9ea6\u83dc\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u6cb9\u9ea6\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-272",
    "name": "\u869d\u6cb9\u751f\u83dc",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u869d\u6cb9\u751f\u83dc\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-273",
    "name": "\u5730\u9505\u9e21",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u5730\u9505\u9e21\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-274",
    "name": "\u571f\u8c46\u70e7\u8304\u5b50",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u571f\u8c46\u70e7\u8304\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u571f\u8c46",
        "\u9002\u91cf"
      ],
      [
        "\u8304\u5b50",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-275",
    "name": "\u767d\u83dc\u7c89\u6761\u7096\u8c46\u8150",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u767d\u83dc\u7c89\u6761\u7096\u8c46\u8150\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u8c46\u8150",
        "\u9002\u91cf"
      ],
      [
        "\u767d\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u7c89\u6761",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-276",
    "name": "\u8089\u672b\u84b8\u86cb",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u84b8\u83dc",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u8089\u672b\u84b8\u86cb\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u84b8\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9e21\u86cb",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-277",
    "name": "\u849c\u6ce5\u767d\u8089",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u849c\u6ce5\u767d\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-278",
    "name": "\u5e72\u70b8\u4e38\u5b50",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70b8\u7269",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u5e72\u70b8\u4e38\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70b8\u7269",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u814c\u5236\u5165\u5473\uff0c\u6302\u7cca\u6216\u62cd\u7c89\u3002",
      "\u6cb9\u6e29\u5347\u8d77\u540e\u5206\u6279\u70b8\u5230\u5b9a\u578b\u3002",
      "\u590d\u70b8\u6216\u56de\u9505\u8c03\u6c41\uff0c\u4fdd\u6301\u5916\u9165\u91cc\u5ae9\u3002"
    ],
    "prepTime": 20,
    "cookTime": 20,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-279",
    "name": "\u70b8\u85d5\u76d2",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70b8\u7269",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u70b8\u85d5\u76d2\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70b8\u7269",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u814c\u5236\u5165\u5473\uff0c\u6302\u7cca\u6216\u62cd\u7c89\u3002",
      "\u6cb9\u6e29\u5347\u8d77\u540e\u5206\u6279\u70b8\u5230\u5b9a\u578b\u3002",
      "\u590d\u70b8\u6216\u56de\u9505\u8c03\u6c41\uff0c\u4fdd\u6301\u5916\u9165\u91cc\u5ae9\u3002"
    ],
    "prepTime": 20,
    "cookTime": 20,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-280",
    "name": "\u9171\u9999\u9e21\u817f",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u9171\u9999\u9e21\u817f\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-281",
    "name": "\u5bb6\u5e38\u8c46\u8150",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u5bb6\u5e38\u8c46\u8150\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u8c46\u8150",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-282",
    "name": "\u8089\u672b\u8304\u5b50",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u8089\u672b\u8304\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8304\u5b50",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-283",
    "name": "\u9752\u6912\u571f\u8c46\u7247",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u9752\u6912\u571f\u8c46\u7247\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u571f\u8c46",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-284",
    "name": "\u897f\u846b\u82a6\u7092\u9e21\u86cb",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u897f\u846b\u82a6\u7092\u9e21\u86cb\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9e21\u86cb",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-285",
    "name": "\u841d\u535c\u7096\u725b\u8169",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u841d\u535c\u7096\u725b\u8169\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u725b\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u841d\u535c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-286",
    "name": "\u841d\u535c\u4e38\u5b50\u6c64",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u841d\u535c\u4e38\u5b50\u6c64\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u841d\u535c",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-287",
    "name": "\u9999\u83c7\u6cb9\u83dc",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u9999\u83c7\u6cb9\u83dc\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9999\u83c7",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-288",
    "name": "\u9e21\u86cb\u7092\u6728\u8033",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u9e21\u86cb\u7092\u6728\u8033\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9e21\u86cb",
        "\u9002\u91cf"
      ],
      [
        "\u6728\u8033",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-289",
    "name": "\u9ec4\u8c46\u7096\u732a\u8e44",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u7096\u83dc",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u9ec4\u8c46\u7096\u732a\u8e44\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u7096\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u732a\u8e44",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 20,
    "cookTime": 45,
    "difficulty": "medium",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-290",
    "name": "\u9999\u5e72\u7092\u8089",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u9999\u5e72\u7092\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-291",
    "name": "\u9752\u6912\u7092\u9e21\u86cb",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u9752\u6912\u7092\u9e21\u86cb\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9e21\u86cb",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-292",
    "name": "\u97ed\u83dc\u7092\u8c46\u82bd",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u97ed\u83dc\u7092\u8c46\u82bd\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u97ed\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-293",
    "name": "\u849c\u82d7\u56de\u9505\u8089",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u849c\u82d7\u56de\u9505\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-294",
    "name": "\u8471\u7206\u725b\u8089",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u8471\u7206\u725b\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u725b\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 1,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-295",
    "name": "\u8471\u82b1\u644a\u9e21\u86cb",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u8471\u82b1\u644a\u9e21\u86cb\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9e21\u86cb",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-296",
    "name": "\u5c0f\u7092\u9ec4\u725b\u8089",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u5c0f\u7092\u9ec4\u725b\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u725b\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-297",
    "name": "\u5e72\u9505\u82b1\u83dc",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u5e72\u9505\u82b1\u83dc\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u82b1\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-298",
    "name": "\u5e72\u9505\u571f\u8c46\u7247",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u5e72\u9505\u571f\u8c46\u7247\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u571f\u8c46",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-299",
    "name": "\u9505\u584c\u767d\u83dc",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u9505\u584c\u767d\u83dc\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u767d\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-300",
    "name": "\u7c89\u84b8\u8089",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u84b8\u83dc",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u7c89\u84b8\u8089\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u84b8\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u5207\u914d\u540e\u712f\u6c34\u6216\u7178\u9999\uff0c\u53bb\u8165\u589e\u9999\u3002",
      "\u52a0\u5165\u8c03\u5473\u548c\u9002\u91cf\u6c64\u6c41\uff0c\u5c0f\u706b\u7096\u716e\u6216\u84b8\u5236\u3002",
      "\u719f\u900f\u540e\u8bd5\u5473\uff0c\u5fc5\u8981\u65f6\u6536\u6c41\u6216\u6492\u8471\u82b1\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-301",
    "name": "\u8089\u672b\u7c89\u6761",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u8089\u672b\u7c89\u6761\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u7c89\u6761",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-302",
    "name": "\u9171\u7206\u8304\u5b50",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u9171\u7206\u8304\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u8304\u5b50",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 1,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-303",
    "name": "\u8001\u918b\u82b1\u751f",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u8001\u918b\u82b1\u751f\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u9178\u9999",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-304",
    "name": "\u62cd\u9ec4\u74dc",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u62cd\u9ec4\u74dc\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u9ec4\u74dc",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u6e05\u723d",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-305",
    "name": "\u51c9\u62cc\u8150\u7af9",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u51c9\u83dc",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u51c9\u62cc\u8150\u7af9\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u51c9\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u712f\u6c34\u6216\u5207\u914d\uff0c\u6ca5\u5e72\u6c34\u5206\u3002",
      "\u8c03\u597d\u849c\u3001\u918b\u3001\u9171\u6cb9\u3001\u9999\u6cb9\u7b49\u6599\u6c41\u3002",
      "\u62cc\u5300\u540e\u9759\u7f6e\u51e0\u5206\u949f\uff0c\u66f4\u5165\u5473\u518d\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u6e05\u723d",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-306",
    "name": "\u51c9\u62cc\u4e09\u4e1d",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u51c9\u83dc",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u51c9\u62cc\u4e09\u4e1d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u51c9\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u712f\u6c34\u6216\u5207\u914d\uff0c\u6ca5\u5e72\u6c34\u5206\u3002",
      "\u8c03\u597d\u849c\u3001\u918b\u3001\u9171\u6cb9\u3001\u9999\u6cb9\u7b49\u6599\u6c41\u3002",
      "\u62cc\u5300\u540e\u9759\u7f6e\u51e0\u5206\u949f\uff0c\u66f4\u5165\u5473\u518d\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u6e05\u723d",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-307",
    "name": "\u76ae\u86cb\u8c46\u8150",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u76ae\u86cb\u8c46\u8150\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u9e21\u86cb",
        "\u9002\u91cf"
      ],
      [
        "\u8c46\u8150",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-308",
    "name": "\u709d\u62cc\u571f\u8c46\u4e1d",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u51c9\u83dc",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u709d\u62cc\u571f\u8c46\u4e1d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u51c9\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u571f\u8c46",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u712f\u6c34\u6216\u5207\u914d\uff0c\u6ca5\u5e72\u6c34\u5206\u3002",
      "\u8c03\u597d\u849c\u3001\u918b\u3001\u9171\u6cb9\u3001\u9999\u6cb9\u7b49\u6599\u6c41\u3002",
      "\u62cc\u5300\u540e\u9759\u7f6e\u51e0\u5206\u949f\uff0c\u66f4\u5165\u5473\u518d\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u6e05\u723d",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-309",
    "name": "\u62cc\u6d77\u5e26\u4e1d",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u51c9\u83dc",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u62cc\u6d77\u5e26\u4e1d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u51c9\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u6d77\u5e26",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u712f\u6c34\u6216\u5207\u914d\uff0c\u6ca5\u5e72\u6c34\u5206\u3002",
      "\u8c03\u597d\u849c\u3001\u918b\u3001\u9171\u6cb9\u3001\u9999\u6cb9\u7b49\u6599\u6c41\u3002",
      "\u62cc\u5300\u540e\u9759\u7f6e\u51e0\u5206\u949f\uff0c\u66f4\u5165\u5473\u518d\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u6e05\u723d",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-310",
    "name": "\u9ebb\u9171\u83e0\u83dc",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u9ebb\u9171\u83e0\u83dc\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u83e0\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-311",
    "name": "\u51c9\u62cc\u8c46\u76ae",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u51c9\u83dc",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u51c9\u62cc\u8c46\u76ae\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u51c9\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u65f6\u4ee4\u98df\u6750",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u712f\u6c34\u6216\u5207\u914d\uff0c\u6ca5\u5e72\u6c34\u5206\u3002",
      "\u8c03\u597d\u849c\u3001\u918b\u3001\u9171\u6cb9\u3001\u9999\u6cb9\u7b49\u6599\u6c41\u3002",
      "\u62cc\u5300\u540e\u9759\u7f6e\u51e0\u5206\u949f\uff0c\u66f4\u5165\u5473\u518d\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u6e05\u723d",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-312",
    "name": "\u849c\u6ce5\u8304\u5b50",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u70ed\u83dc\u5c0f\u7092",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u849c\u6ce5\u8304\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u70ed\u83dc\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u8304\u5b50",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u54b8\u9c9c",
      "\u5bb6\u5e38"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-313",
    "name": "\u709d\u62cc\u5706\u767d\u83dc",
    "category": "\u5bb6\u5e38\u83dc",
    "subcategory": "\u51c9\u83dc",
    "description": "\u5317\u65b9\u5bb6\u5e38\u5e38\u89c1\u9910\u54c1\u300c\u709d\u62cc\u5706\u767d\u83dc\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u5317\u65b9\u5bb6\u5e38",
      "\u5bb6\u5e38\u83dc",
      "\u51c9\u83dc",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u767d\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u712f\u6c34\u6216\u5207\u914d\uff0c\u6ca5\u5e72\u6c34\u5206\u3002",
      "\u8c03\u597d\u849c\u3001\u918b\u3001\u9171\u6cb9\u3001\u9999\u6cb9\u7b49\u6599\u6c41\u3002",
      "\u62cc\u5300\u540e\u9759\u7f6e\u51e0\u5206\u949f\uff0c\u66f4\u5165\u5473\u518d\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u6e05\u723d",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c76b51",
      "#f0a37a",
      "#f9dfcf"
    ]
  },
  {
    "key": "north-menu-314",
    "name": "\u732a\u8089\u5927\u8471\u997a\u5b50",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997a\u5b50\u9984\u9968",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u732a\u8089\u5927\u8471\u997a\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u997a\u5b50\u76ae",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u8c03\u597d\u9985\u6599\uff0c\u6ce8\u610f\u6c34\u5206\u548c\u54b8\u6de1\u3002",
      "\u5305\u6210\u997a\u5b50\u3001\u9984\u9968\u6216\u9505\u8d34\uff0c\u5c01\u53e3\u538b\u7d27\u3002",
      "\u6c34\u716e\u3001\u84b8\u5236\u6216\u714e\u5236\u5230\u719f\u900f\u3002"
    ],
    "prepTime": 35,
    "cookTime": 15,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-315",
    "name": "\u97ed\u83dc\u9e21\u86cb\u997a\u5b50",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997a\u5b50\u9984\u9968",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u97ed\u83dc\u9e21\u86cb\u997a\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9e21\u86cb",
        "\u9002\u91cf"
      ],
      [
        "\u97ed\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u997a\u5b50\u76ae",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u8c03\u597d\u9985\u6599\uff0c\u6ce8\u610f\u6c34\u5206\u548c\u54b8\u6de1\u3002",
      "\u5305\u6210\u997a\u5b50\u3001\u9984\u9968\u6216\u9505\u8d34\uff0c\u5c01\u53e3\u538b\u7d27\u3002",
      "\u6c34\u716e\u3001\u84b8\u5236\u6216\u714e\u5236\u5230\u719f\u900f\u3002"
    ],
    "prepTime": 35,
    "cookTime": 15,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-316",
    "name": "\u725b\u8089\u841d\u535c\u997a\u5b50",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997a\u5b50\u9984\u9968",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u725b\u8089\u841d\u535c\u997a\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u725b\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u841d\u535c",
        "\u9002\u91cf"
      ],
      [
        "\u997a\u5b50\u76ae",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u8c03\u597d\u9985\u6599\uff0c\u6ce8\u610f\u6c34\u5206\u548c\u54b8\u6de1\u3002",
      "\u5305\u6210\u997a\u5b50\u3001\u9984\u9968\u6216\u9505\u8d34\uff0c\u5c01\u53e3\u538b\u7d27\u3002",
      "\u6c34\u716e\u3001\u84b8\u5236\u6216\u714e\u5236\u5230\u719f\u900f\u3002"
    ],
    "prepTime": 35,
    "cookTime": 15,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-317",
    "name": "\u7f8a\u8089\u80e1\u841d\u535c\u997a\u5b50",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997a\u5b50\u9984\u9968",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u7f8a\u8089\u80e1\u841d\u535c\u997a\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7f8a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u841d\u535c",
        "\u9002\u91cf"
      ],
      [
        "\u997a\u5b50\u76ae",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u8c03\u597d\u9985\u6599\uff0c\u6ce8\u610f\u6c34\u5206\u548c\u54b8\u6de1\u3002",
      "\u5305\u6210\u997a\u5b50\u3001\u9984\u9968\u6216\u9505\u8d34\uff0c\u5c01\u53e3\u538b\u7d27\u3002",
      "\u6c34\u716e\u3001\u84b8\u5236\u6216\u714e\u5236\u5230\u719f\u900f\u3002"
    ],
    "prepTime": 35,
    "cookTime": 15,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-318",
    "name": "\u4e09\u9c9c\u997a\u5b50",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997a\u5b50\u9984\u9968",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u4e09\u9c9c\u997a\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u997a\u5b50\u76ae",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u8c03\u597d\u9985\u6599\uff0c\u6ce8\u610f\u6c34\u5206\u548c\u54b8\u6de1\u3002",
      "\u5305\u6210\u997a\u5b50\u3001\u9984\u9968\u6216\u9505\u8d34\uff0c\u5c01\u53e3\u538b\u7d27\u3002",
      "\u6c34\u716e\u3001\u84b8\u5236\u6216\u714e\u5236\u5230\u719f\u900f\u3002"
    ],
    "prepTime": 35,
    "cookTime": 15,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-319",
    "name": "\u767d\u83dc\u732a\u8089\u997a\u5b50",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997a\u5b50\u9984\u9968",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u767d\u83dc\u732a\u8089\u997a\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u767d\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u997a\u5b50\u76ae",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u8c03\u597d\u9985\u6599\uff0c\u6ce8\u610f\u6c34\u5206\u548c\u54b8\u6de1\u3002",
      "\u5305\u6210\u997a\u5b50\u3001\u9984\u9968\u6216\u9505\u8d34\uff0c\u5c01\u53e3\u538b\u7d27\u3002",
      "\u6c34\u716e\u3001\u84b8\u5236\u6216\u714e\u5236\u5230\u719f\u900f\u3002"
    ],
    "prepTime": 35,
    "cookTime": 15,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-320",
    "name": "\u82b9\u83dc\u732a\u8089\u997a\u5b50",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997a\u5b50\u9984\u9968",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u82b9\u83dc\u732a\u8089\u997a\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u82b9\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u997a\u5b50\u76ae",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u8c03\u597d\u9985\u6599\uff0c\u6ce8\u610f\u6c34\u5206\u548c\u54b8\u6de1\u3002",
      "\u5305\u6210\u997a\u5b50\u3001\u9984\u9968\u6216\u9505\u8d34\uff0c\u5c01\u53e3\u538b\u7d27\u3002",
      "\u6c34\u716e\u3001\u84b8\u5236\u6216\u714e\u5236\u5230\u719f\u900f\u3002"
    ],
    "prepTime": 35,
    "cookTime": 15,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-321",
    "name": "\u9999\u83c7\u9e21\u8089\u997a\u5b50",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997a\u5b50\u9984\u9968",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u9999\u83c7\u9e21\u8089\u997a\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9999\u83c7",
        "\u9002\u91cf"
      ],
      [
        "\u997a\u5b50\u76ae",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u8c03\u597d\u9985\u6599\uff0c\u6ce8\u610f\u6c34\u5206\u548c\u54b8\u6de1\u3002",
      "\u5305\u6210\u997a\u5b50\u3001\u9984\u9968\u6216\u9505\u8d34\uff0c\u5c01\u53e3\u538b\u7d27\u3002",
      "\u6c34\u716e\u3001\u84b8\u5236\u6216\u714e\u5236\u5230\u719f\u900f\u3002"
    ],
    "prepTime": 35,
    "cookTime": 15,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-322",
    "name": "\u9178\u83dc\u732a\u8089\u997a\u5b50",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997a\u5b50\u9984\u9968",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u9178\u83dc\u732a\u8089\u997a\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9178\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u997a\u5b50\u76ae",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u8c03\u597d\u9985\u6599\uff0c\u6ce8\u610f\u6c34\u5206\u548c\u54b8\u6de1\u3002",
      "\u5305\u6210\u997a\u5b50\u3001\u9984\u9968\u6216\u9505\u8d34\uff0c\u5c01\u53e3\u538b\u7d27\u3002",
      "\u6c34\u716e\u3001\u84b8\u5236\u6216\u714e\u5236\u5230\u719f\u900f\u3002"
    ],
    "prepTime": 35,
    "cookTime": 15,
    "difficulty": "medium",
    "taste": [
      "\u9178\u9999",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-323",
    "name": "\u9c85\u9c7c\u997a\u5b50",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997a\u5b50\u9984\u9968",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u9c85\u9c7c\u997a\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9c7c\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u997a\u5b50\u76ae",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u8c03\u597d\u9985\u6599\uff0c\u6ce8\u610f\u6c34\u5206\u548c\u54b8\u6de1\u3002",
      "\u5305\u6210\u997a\u5b50\u3001\u9984\u9968\u6216\u9505\u8d34\uff0c\u5c01\u53e3\u538b\u7d27\u3002",
      "\u6c34\u716e\u3001\u84b8\u5236\u6216\u714e\u5236\u5230\u719f\u900f\u3002"
    ],
    "prepTime": 35,
    "cookTime": 15,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-324",
    "name": "\u8334\u9999\u732a\u8089\u997a\u5b50",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997a\u5b50\u9984\u9968",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u8334\u9999\u732a\u8089\u997a\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u997a\u5b50\u76ae",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u8c03\u597d\u9985\u6599\uff0c\u6ce8\u610f\u6c34\u5206\u548c\u54b8\u6de1\u3002",
      "\u5305\u6210\u997a\u5b50\u3001\u9984\u9968\u6216\u9505\u8d34\uff0c\u5c01\u53e3\u538b\u7d27\u3002",
      "\u6c34\u716e\u3001\u84b8\u5236\u6216\u714e\u5236\u5230\u719f\u900f\u3002"
    ],
    "prepTime": 35,
    "cookTime": 15,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-325",
    "name": "\u897f\u846b\u82a6\u9e21\u86cb\u997a\u5b50",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997a\u5b50\u9984\u9968",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u897f\u846b\u82a6\u9e21\u86cb\u997a\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9e21\u86cb",
        "\u9002\u91cf"
      ],
      [
        "\u997a\u5b50\u76ae",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u8c03\u597d\u9985\u6599\uff0c\u6ce8\u610f\u6c34\u5206\u548c\u54b8\u6de1\u3002",
      "\u5305\u6210\u997a\u5b50\u3001\u9984\u9968\u6216\u9505\u8d34\uff0c\u5c01\u53e3\u538b\u7d27\u3002",
      "\u6c34\u716e\u3001\u84b8\u5236\u6216\u714e\u5236\u5230\u719f\u900f\u3002"
    ],
    "prepTime": 35,
    "cookTime": 15,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-326",
    "name": "\u867e\u4ec1\u7389\u7c73\u997a\u5b50",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997a\u5b50\u9984\u9968",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u867e\u4ec1\u7389\u7c73\u997a\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u867e\u4ec1",
        "\u9002\u91cf"
      ],
      [
        "\u7389\u7c73",
        "\u9002\u91cf"
      ],
      [
        "\u997a\u5b50\u76ae",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u8c03\u597d\u9985\u6599\uff0c\u6ce8\u610f\u6c34\u5206\u548c\u54b8\u6de1\u3002",
      "\u5305\u6210\u997a\u5b50\u3001\u9984\u9968\u6216\u9505\u8d34\uff0c\u5c01\u53e3\u538b\u7d27\u3002",
      "\u6c34\u716e\u3001\u84b8\u5236\u6216\u714e\u5236\u5230\u719f\u900f\u3002"
    ],
    "prepTime": 35,
    "cookTime": 15,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-327",
    "name": "\u725b\u8089\u9984\u9968",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997a\u5b50\u9984\u9968",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u725b\u8089\u9984\u9968\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u725b\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9984\u9968\u76ae",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u8c03\u597d\u9985\u6599\uff0c\u6ce8\u610f\u6c34\u5206\u548c\u54b8\u6de1\u3002",
      "\u5305\u6210\u997a\u5b50\u3001\u9984\u9968\u6216\u9505\u8d34\uff0c\u5c01\u53e3\u538b\u7d27\u3002",
      "\u6c34\u716e\u3001\u84b8\u5236\u6216\u714e\u5236\u5230\u719f\u900f\u3002"
    ],
    "prepTime": 35,
    "cookTime": 15,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-328",
    "name": "\u9c9c\u8089\u5c0f\u9984\u9968",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997a\u5b50\u9984\u9968",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u9c9c\u8089\u5c0f\u9984\u9968\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9984\u9968\u76ae",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u8c03\u597d\u9985\u6599\uff0c\u6ce8\u610f\u6c34\u5206\u548c\u54b8\u6de1\u3002",
      "\u5305\u6210\u997a\u5b50\u3001\u9984\u9968\u6216\u9505\u8d34\uff0c\u5c01\u53e3\u538b\u7d27\u3002",
      "\u6c34\u716e\u3001\u84b8\u5236\u6216\u714e\u5236\u5230\u719f\u900f\u3002"
    ],
    "prepTime": 35,
    "cookTime": 15,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-329",
    "name": "\u8360\u83dc\u9984\u9968",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997a\u5b50\u9984\u9968",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u8360\u83dc\u9984\u9968\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9984\u9968\u76ae",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u8c03\u597d\u9985\u6599\uff0c\u6ce8\u610f\u6c34\u5206\u548c\u54b8\u6de1\u3002",
      "\u5305\u6210\u997a\u5b50\u3001\u9984\u9968\u6216\u9505\u8d34\uff0c\u5c01\u53e3\u538b\u7d27\u3002",
      "\u6c34\u716e\u3001\u84b8\u5236\u6216\u714e\u5236\u5230\u719f\u900f\u3002"
    ],
    "prepTime": 35,
    "cookTime": 15,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-330",
    "name": "\u714e\u997a",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997a\u5b50\u9984\u9968",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u714e\u997a\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u997a\u5b50\u76ae",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u8c03\u597d\u9985\u6599\uff0c\u6ce8\u610f\u6c34\u5206\u548c\u54b8\u6de1\u3002",
      "\u5305\u6210\u997a\u5b50\u3001\u9984\u9968\u6216\u9505\u8d34\uff0c\u5c01\u53e3\u538b\u7d27\u3002",
      "\u6c34\u716e\u3001\u84b8\u5236\u6216\u714e\u5236\u5230\u719f\u900f\u3002"
    ],
    "prepTime": 35,
    "cookTime": 15,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-331",
    "name": "\u9505\u8d34",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997a\u5b50\u9984\u9968",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u9505\u8d34\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u8c03\u597d\u9985\u6599\uff0c\u6ce8\u610f\u6c34\u5206\u548c\u54b8\u6de1\u3002",
      "\u5305\u6210\u997a\u5b50\u3001\u9984\u9968\u6216\u9505\u8d34\uff0c\u5c01\u53e3\u538b\u7d27\u3002",
      "\u6c34\u716e\u3001\u84b8\u5236\u6216\u714e\u5236\u5230\u719f\u900f\u3002"
    ],
    "prepTime": 35,
    "cookTime": 15,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-332",
    "name": "\u84b8\u997a",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997a\u5b50\u9984\u9968",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u84b8\u997a\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u997a\u5b50\u76ae",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u8c03\u597d\u9985\u6599\uff0c\u6ce8\u610f\u6c34\u5206\u548c\u54b8\u6de1\u3002",
      "\u5305\u6210\u997a\u5b50\u3001\u9984\u9968\u6216\u9505\u8d34\uff0c\u5c01\u53e3\u538b\u7d27\u3002",
      "\u6c34\u716e\u3001\u84b8\u5236\u6216\u714e\u5236\u5230\u719f\u900f\u3002"
    ],
    "prepTime": 35,
    "cookTime": 15,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-333",
    "name": "\u7f8a\u8089\u70e7\u9ea6",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997a\u5b50\u9984\u9968",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u7f8a\u8089\u70e7\u9ea6\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7f8a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u8c03\u597d\u9985\u6599\uff0c\u6ce8\u610f\u6c34\u5206\u548c\u54b8\u6de1\u3002",
      "\u5305\u6210\u997a\u5b50\u3001\u9984\u9968\u6216\u9505\u8d34\uff0c\u5c01\u53e3\u538b\u7d27\u3002",
      "\u6c34\u716e\u3001\u84b8\u5236\u6216\u714e\u5236\u5230\u719f\u900f\u3002"
    ],
    "prepTime": 35,
    "cookTime": 15,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-334",
    "name": "\u732a\u8089\u70e7\u9ea6",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997a\u5b50\u9984\u9968",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u732a\u8089\u70e7\u9ea6\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u8c03\u597d\u9985\u6599\uff0c\u6ce8\u610f\u6c34\u5206\u548c\u54b8\u6de1\u3002",
      "\u5305\u6210\u997a\u5b50\u3001\u9984\u9968\u6216\u9505\u8d34\uff0c\u5c01\u53e3\u538b\u7d27\u3002",
      "\u6c34\u716e\u3001\u84b8\u5236\u6216\u714e\u5236\u5230\u719f\u900f\u3002"
    ],
    "prepTime": 35,
    "cookTime": 15,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-335",
    "name": "\u7d20\u4e09\u9c9c\u9505\u8d34",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997a\u5b50\u9984\u9968",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u7d20\u4e09\u9c9c\u9505\u8d34\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u8c03\u597d\u9985\u6599\uff0c\u6ce8\u610f\u6c34\u5206\u548c\u54b8\u6de1\u3002",
      "\u5305\u6210\u997a\u5b50\u3001\u9984\u9968\u6216\u9505\u8d34\uff0c\u5c01\u53e3\u538b\u7d27\u3002",
      "\u6c34\u716e\u3001\u84b8\u5236\u6216\u714e\u5236\u5230\u719f\u900f\u3002"
    ],
    "prepTime": 35,
    "cookTime": 15,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-336",
    "name": "\u841d\u535c\u4e1d\u997c",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997c\u7c7b",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u841d\u535c\u4e1d\u997c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u997c\u7c7b",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u841d\u535c",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-337",
    "name": "\u725b\u8089\u9985\u997c",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997c\u7c7b",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u725b\u8089\u9985\u997c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u997c\u7c7b",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u725b\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-338",
    "name": "\u732a\u8089\u767d\u83dc\u5305\u5b50",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u5305\u70b9",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u732a\u8089\u767d\u83dc\u5305\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u5305\u70b9",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u767d\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-339",
    "name": "\u97ed\u83dc\u9e21\u86cb\u5305\u5b50",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u5305\u70b9",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u97ed\u83dc\u9e21\u86cb\u5305\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u5305\u70b9",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9e21\u86cb",
        "\u9002\u91cf"
      ],
      [
        "\u97ed\u83dc",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-340",
    "name": "\u8c46\u8150\u7c89\u6761\u5305\u5b50",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u5305\u70b9",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u8c46\u8150\u7c89\u6761\u5305\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u5305\u70b9",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u8c46\u8150",
        "\u9002\u91cf"
      ],
      [
        "\u7c89\u6761",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-341",
    "name": "\u725b\u8089\u5305\u5b50",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u5305\u70b9",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u725b\u8089\u5305\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u5305\u70b9",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u725b\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-342",
    "name": "\u9171\u8089\u5305\u5b50",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u5305\u70b9",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u9171\u8089\u5305\u5b50\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u5305\u70b9",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-343",
    "name": "\u8471\u6cb9\u997c",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997c\u7c7b",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u8471\u6cb9\u997c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u997c\u7c7b",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-344",
    "name": "\u5343\u5c42\u997c",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997c\u7c7b",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u5343\u5c42\u997c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u997c\u7c7b",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-345",
    "name": "\u9e21\u86cb\u704c\u997c",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997c\u7c7b",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u9e21\u86cb\u704c\u997c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u997c\u7c7b",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9e21\u86cb",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-346",
    "name": "\u9171\u9999\u997c",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997c\u7c7b",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u9171\u9999\u997c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u997c\u7c7b",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-347",
    "name": "\u624b\u6293\u997c",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997c\u7c7b",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u624b\u6293\u997c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u997c\u7c7b",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-348",
    "name": "\u5bb6\u5e38\u70d9\u997c",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997c\u7c7b",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u5bb6\u5e38\u70d9\u997c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u997c\u7c7b",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-349",
    "name": "\u53d1\u9762\u997c",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u9762\u98df",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u53d1\u9762\u997c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-350",
    "name": "\u8089\u9f99",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997a\u5b50\u9984\u9968",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u8089\u9f99\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u8c03\u597d\u9985\u6599\uff0c\u6ce8\u610f\u6c34\u5206\u548c\u54b8\u6de1\u3002",
      "\u5305\u6210\u997a\u5b50\u3001\u9984\u9968\u6216\u9505\u8d34\uff0c\u5c01\u53e3\u538b\u7d27\u3002",
      "\u6c34\u716e\u3001\u84b8\u5236\u6216\u714e\u5236\u5230\u719f\u900f\u3002"
    ],
    "prepTime": 35,
    "cookTime": 15,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-351",
    "name": "\u82b1\u5377",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997a\u5b50\u9984\u9968",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u82b1\u5377\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u8c03\u597d\u9985\u6599\uff0c\u6ce8\u610f\u6c34\u5206\u548c\u54b8\u6de1\u3002",
      "\u5305\u6210\u997a\u5b50\u3001\u9984\u9968\u6216\u9505\u8d34\uff0c\u5c01\u53e3\u538b\u7d27\u3002",
      "\u6c34\u716e\u3001\u84b8\u5236\u6216\u714e\u5236\u5230\u719f\u900f\u3002"
    ],
    "prepTime": 35,
    "cookTime": 15,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-352",
    "name": "\u9992\u5934",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u997a\u5b50\u9984\u9968",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u9992\u5934\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u8c03\u597d\u9985\u6599\uff0c\u6ce8\u610f\u6c34\u5206\u548c\u54b8\u6de1\u3002",
      "\u5305\u6210\u997a\u5b50\u3001\u9984\u9968\u6216\u9505\u8d34\uff0c\u5c01\u53e3\u538b\u7d27\u3002",
      "\u6c34\u716e\u3001\u84b8\u5236\u6216\u714e\u5236\u5230\u719f\u900f\u3002"
    ],
    "prepTime": 35,
    "cookTime": 15,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-353",
    "name": "\u7389\u7c73\u9762\u7a9d\u5934",
    "category": "\u9762\u98df\u4e3b\u98df",
    "subcategory": "\u9762\u98df",
    "description": "\u997a\u5b50\u9984\u9968\u5e38\u89c1\u9910\u54c1\u300c\u7389\u7c73\u9762\u7a9d\u5934\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u997a\u5b50\u9984\u9968",
      "\u9762\u98df\u4e3b\u98df",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u7389\u7c73",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#c89b58",
      "#ead0a0",
      "#fff0d3"
    ]
  },
  {
    "key": "north-menu-354",
    "name": "\u8c46\u8150\u8111",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u65e9\u9910\u7ca5\u7c89",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u8c46\u8150\u8111\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u65e9\u9910\u7ca5\u7c89",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u8c46\u8150",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-355",
    "name": "\u54b8\u8c46\u6d46",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u65e9\u9910\u7ca5\u7c89",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u54b8\u8c46\u6d46\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u65e9\u9910\u7ca5\u7c89",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-356",
    "name": "\u6cb9\u6761",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u65e9\u9910\u7ca5\u7c89",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u6cb9\u6761\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u65e9\u9910\u7ca5\u7c89",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-357",
    "name": "\u7cd6\u6cb9\u997c",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u997c\u7c7b",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u7cd6\u6cb9\u997c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u997c\u7c7b",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-358",
    "name": "\u714e\u997c\u5377\u5927\u8471",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u997c\u7c7b",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u714e\u997c\u5377\u5927\u8471\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u997c\u7c7b",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-359",
    "name": "\u9e21\u86cb\u997c",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u997c\u7c7b",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u9e21\u86cb\u997c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u997c\u7c7b",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9e21\u86cb",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-360",
    "name": "\u5c0f\u7c73\u7ca5",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u5c0f\u7c73\u7ca5\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u5c0f\u7c73",
        "\u9002\u91cf"
      ],
      [
        "\u7c73",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-361",
    "name": "\u7389\u7c73\u7cca\u7cca",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u65e9\u9910\u7ca5\u7c89",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u7389\u7c73\u7cca\u7cca\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u65e9\u9910\u7ca5\u7c89",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u7389\u7c73",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-362",
    "name": "\u516b\u5b9d\u7ca5",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u516b\u5b9d\u7ca5\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u7c73",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-363",
    "name": "\u76ae\u86cb\u7626\u8089\u7ca5",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u76ae\u86cb\u7626\u8089\u7ca5\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9e21\u86cb",
        "\u9002\u91cf"
      ],
      [
        "\u7c73",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-364",
    "name": "\u5357\u74dc\u7ca5",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u5357\u74dc\u7ca5\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u7c73",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-365",
    "name": "\u7eff\u8c46\u7ca5",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u7eff\u8c46\u7ca5\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u7c73",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-366",
    "name": "\u7f8a\u6c64",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u7f8a\u6c64\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7f8a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-367",
    "name": "\u725b\u8089\u6c64",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u725b\u8089\u6c64\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u725b\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-368",
    "name": "\u4e38\u5b50\u6c64",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u4e38\u5b50\u6c64\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-369",
    "name": "\u7599\u7629\u6c64",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u7599\u7629\u6c64\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-370",
    "name": "\u70ed\u6c64\u9762",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u70ed\u6c64\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-371",
    "name": "\u9e21\u86cb\u9762",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u9762\u98df",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u9e21\u86cb\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9e21\u86cb",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-372",
    "name": "\u9633\u6625\u9762",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u9762\u98df",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u9633\u6625\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-373",
    "name": "\u6253\u5364\u9762",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u9762\u98df",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u6253\u5364\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-374",
    "name": "\u8304\u4e01\u9762",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u9762\u98df",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u8304\u4e01\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-375",
    "name": "\u9ebb\u9171\u9762",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u9762\u98df",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u9ebb\u9171\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-376",
    "name": "\u8471\u6cb9\u62cc\u9762",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u9762\u98df",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u8471\u6cb9\u62cc\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u7d20\u83dc\u53ef\u9009"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u6e05\u723d",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-377",
    "name": "\u897f\u7ea2\u67ff\u9e21\u86cb\u9762",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u9762\u98df",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u897f\u7ea2\u67ff\u9e21\u86cb\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9e21\u86cb",
        "\u9002\u91cf"
      ],
      [
        "\u897f\u7ea2\u67ff",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-378",
    "name": "\u69a8\u83dc\u8089\u4e1d\u9762",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u9762\u98df",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u69a8\u83dc\u8089\u4e1d\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-379",
    "name": "\u725b\u8089\u9762",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u9762\u98df",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u725b\u8089\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u725b\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-380",
    "name": "\u7f8a\u8089\u9762\u7247",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u9762\u98df",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u7f8a\u8089\u9762\u7247\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u7f8a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-381",
    "name": "\u9178\u6c64\u9762",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u6c64\u7ca5",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u9178\u6c64\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u6c64\u7ca5",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u4e3b\u6599\u63d0\u524d\u5904\u7406\u5e72\u51c0\uff0c\u6c64\u5e95\u6216\u7c73\u7ca5\u5148\u716e\u5f00\u3002",
      "\u6309\u719f\u6210\u65f6\u95f4\u52a0\u5165\u914d\u6599\uff0c\u5c0f\u706b\u716e\u5230\u5165\u5473\u3002",
      "\u51fa\u9505\u524d\u8c03\u5473\uff0c\u4fdd\u6301\u70ed\u4e4e\u53e3\u611f\u3002"
    ],
    "prepTime": 10,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u9178\u9999",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-382",
    "name": "\u7092\u9762",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u9762\u98df",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u7092\u9762\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u9762\u98df",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-383",
    "name": "\u7092\u6cb3\u7c89",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u5c0f\u7092",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u7092\u6cb3\u7c89\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-384",
    "name": "\u7092\u997c",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u997c\u7c7b",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u7092\u997c\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u997c\u7c7b",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u51c6\u5907\u9762\u56e2\u6216\u4e3b\u98df\u80da\uff0c\u9192\u53d1\u6216\u9759\u7f6e\u5230\u9002\u5408\u64cd\u4f5c\u3002",
      "\u5904\u7406\u9985\u6599\u6216\u6d47\u5934\uff0c\u6309\u53e3\u5473\u8c03\u597d\u54b8\u6de1\u3002",
      "\u716e\u3001\u84b8\u3001\u70d9\u6216\u62cc\u5230\u719f\u900f\uff0c\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 25,
    "cookTime": 25,
    "difficulty": "medium",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-385",
    "name": "\u7092\u9992\u5934",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u5c0f\u7092",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u7092\u9992\u5934\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1"
    ],
    "ingredients": [
      [
        "\u9762\u7c89",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-386",
    "name": "\u7092\u7c73\u996d",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u5c0f\u7092",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u7092\u7c73\u996d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u7c73\u996d",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-387",
    "name": "\u86cb\u7092\u996d",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u5c0f\u7092",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u86cb\u7092\u996d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u5c0f\u7092",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u9e21\u86cb",
        "\u9002\u91cf"
      ],
      [
        "\u7c73\u996d",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 12,
    "cookTime": 12,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-388",
    "name": "\u76d6\u6d47\u996d",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u65e9\u9910\u7ca5\u7c89",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u76d6\u6d47\u996d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u65e9\u9910\u7ca5\u7c89",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df"
    ],
    "ingredients": [
      [
        "\u7c73\u996d",
        "\u9002\u91cf"
      ],
      [
        "\u8471\u59dc\u849c",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-389",
    "name": "\u5364\u8089\u996d",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u65e9\u9910\u7ca5\u7c89",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u5364\u8089\u996d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u65e9\u9910\u7ca5\u7c89",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u7c73\u996d",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-390",
    "name": "\u9e21\u817f\u996d",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u65e9\u9910\u7ca5\u7c89",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u9e21\u817f\u996d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u65e9\u9910\u7ca5\u7c89",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u7c73\u996d",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-391",
    "name": "\u6392\u9aa8\u996d",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u65e9\u9910\u7ca5\u7c89",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u6392\u9aa8\u996d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u65e9\u9910\u7ca5\u7c89",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u6392\u9aa8",
        "\u9002\u91cf"
      ],
      [
        "\u7c73\u996d",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-392",
    "name": "\u725b\u8089\u76d6\u996d",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u65e9\u9910\u7ca5\u7c89",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u725b\u8089\u76d6\u996d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u65e9\u9910\u7ca5\u7c89",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u725b\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u732a\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u7c73\u996d",
        "\u9002\u91cf"
      ],
      [
        "\u57fa\u7840\u8c03\u5473",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
  },
  {
    "key": "north-menu-393",
    "name": "\u756a\u8304\u9e21\u86cb\u76d6\u996d",
    "category": "\u65e9\u9910\u591c\u5bb5",
    "subcategory": "\u65e9\u9910\u7ca5\u7c89",
    "description": "\u65e9\u9910\u591c\u5bb5\u5e38\u89c1\u9910\u54c1\u300c\u756a\u8304\u9e21\u86cb\u76d6\u996d\u300d\uff0c\u9002\u5408\u4f5c\u4e3a\u60c5\u4fa3/\u592b\u59bb\u65e5\u5e38\u70b9\u83dc\u3001\u505a\u996d\u548c\u6392\u9910\u7684\u9ed8\u8ba4\u9009\u62e9\u3002",
    "tags": [
      "\u65e9\u9910\u591c\u5bb5",
      "\u65e9\u9910\u7ca5\u7c89",
      "\u9ed8\u8ba4\u83dc\u54c1",
      "\u4e3b\u98df",
      "\u8364\u83dc"
    ],
    "ingredients": [
      [
        "\u9e21\u8089",
        "\u9002\u91cf"
      ],
      [
        "\u9e21\u86cb",
        "\u9002\u91cf"
      ],
      [
        "\u756a\u8304",
        "\u9002\u91cf"
      ],
      [
        "\u7c73\u996d",
        "\u9002\u91cf"
      ]
    ],
    "steps": [
      "\u98df\u6750\u6d17\u51c0\u5207\u914d\uff0c\u63d0\u524d\u5907\u597d\u8c03\u5473\u3002",
      "\u70ed\u9505\u7206\u9999\u8471\u59dc\u849c\uff0c\u653e\u5165\u4e3b\u6599\u7ffb\u7092\u3002",
      "\u6309\u53e3\u5473\u8c03\u5473\uff0c\u7092\u719f\u540e\u8d81\u70ed\u4e0a\u684c\u3002"
    ],
    "prepTime": 15,
    "cookTime": 25,
    "difficulty": "easy",
    "taste": [
      "\u5bb6\u5e38",
      "\u54b8\u9c9c"
    ],
    "spiceLevel": 0,
    "palette": [
      "#be7c4d",
      "#e5b26d",
      "#f7e5c5"
    ]
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
  source: '\u7cfb\u7edf\u9ed8\u8ba4\u83dc\u54c1\uff08\u5317\u65b9\u5e38\u89c1\u9910\u54c1\u5e93\uff09',
  favorite: false,
  rating: 4,
  isDefault: true,
  palette: meal.palette
}));
