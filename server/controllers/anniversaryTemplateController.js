const templates = [
  { key: 'birthday', title: '生日小餐桌', theme: '生日', description: '一份主菜、一份汤、一道TA喜欢的小甜品。', structure: ['主菜', '汤羹', '甜品', '饮品'] },
  { key: 'love-day', title: '恋爱纪念日', theme: '纪念日', description: '选两道共同喜欢的菜，再加一张合照。', structure: ['共同喜欢', '下饭菜', '甜品'] },
  { key: 'wedding-day', title: '结婚纪念日', theme: '结婚纪念日', description: '慢慢做、慢慢吃，适合偏仪式感的晚餐。', structure: ['主菜', '海鲜/肉菜', '蔬菜', '汤'] },
  { key: 'festival', title: '节日聚餐', theme: '节日', description: '适合节日和家人朋友一起吃的菜单结构。', structure: ['硬菜', '素菜', '主食', '汤羹'] },
  { key: 'weekend-home', title: '周末小家宴', theme: '周末', description: '不赶时间，安排一顿属于两个人的家常饭。', structure: ['慢炖菜', '快手菜', '凉拌菜', '主食'] }
];
exports.list = async (_req, res) => res.json(templates);
