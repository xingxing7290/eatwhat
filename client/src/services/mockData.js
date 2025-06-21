// 模拟数据生成器
import { format, addDays } from 'date-fns';

// 生成随机ID
const generateId = () => Math.floor(Math.random() * 10000) + 1;

// 模拟菜品数据
const mockMeals = [
  {
    id: generateId(),
    name: '红烧肉',
    description: '经典家常菜，肥而不腻，口感软糯',
    image: 'https://img2.baidu.com/it/u=242948341,360812553&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500', 
    tags: ['肉类', '家常菜', '红烧'],
    ingredients: [
      { name: '五花肉', amount: '500g' },
      { name: '生抽', amount: '2勺' },
      { name: '老抽', amount: '1勺' },
      { name: '冰糖', amount: '30g' }
    ]
  },
  {
    id: generateId(),
    name: '西红柿炒鸡蛋',
    description: '家常快手菜，酸甜可口',
    image: 'https://img1.baidu.com/it/u=1962628561,1169765204&fm=253&fmt=auto&app=120&f=JPEG?w=500&h=500',
    tags: ['家常菜', '快手菜', '素菜'],
    ingredients: [
      { name: '西红柿', amount: '2个' },
      { name: '鸡蛋', amount: '3个' },
      { name: '盐', amount: '少许' }
    ]
  },
  {
    id: generateId(),
    name: '鱼香肉丝',
    description: '川菜经典，香辣开胃',
    image: 'https://img2.baidu.com/it/u=3039064646,2674089292&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=313',
    tags: ['川菜', '辣味', '炒菜'],
    ingredients: [
      { name: '猪里脊', amount: '300g' },
      { name: '胡萝卜', amount: '1根' },
      { name: '木耳', amount: '50g' },
      { name: '豆瓣酱', amount: '1勺' }
    ]
  },
  {
    id: generateId(),
    name: '宫保鸡丁',
    description: '经典川菜，麻辣鲜香',
    image: 'https://img2.baidu.com/it/u=2226222693,298062661&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=333',
    tags: ['川菜', '辣味', '炒菜'],
    ingredients: [
      { name: '鸡胸肉', amount: '300g' },
      { name: '花生米', amount: '50g' },
      { name: '干辣椒', amount: '10个' },
      { name: '黄瓜', amount: '1根' }
    ]
  },
  {
    id: generateId(),
    name: '清蒸鲈鱼',
    description: '鲜美健康，营养丰富',
    image: 'https://img0.baidu.com/it/u=815271418,3559320281&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=333',
    tags: ['蒸菜', '海鲜', '健康'],
    ingredients: [
      { name: '鲈鱼', amount: '1条' },
      { name: '姜', amount: '3片' },
      { name: '葱', amount: '2根' },
      { name: '料酒', amount: '1勺' }
    ]
  },
  {
    id: generateId(),
    name: '麻婆豆腐',
    description: '川菜代表，麻辣鲜香',
    image: 'https://img2.baidu.com/it/u=4179313452,2843000367&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=375',
    tags: ['川菜', '辣味', '素菜'],
    ingredients: [
      { name: '豆腐', amount: '1块' },
      { name: '肉末', amount: '50g' },
      { name: '豆瓣酱', amount: '1勺' },
      { name: '花椒粉', amount: '少许' }
    ]
  }
];

// 生成一个月的餐食安排模拟数据
const generateMonthSchedule = (year, month) => {
  const startDate = new Date(year, month - 1, 1); // month是1-12，而JS的月份是0-11
  const endDay = new Date(year, month, 0).getDate();
  const schedules = [];

  for (let day = 1; day <= endDay; day++) {
    // 只给30%的日期安排餐食
    if (Math.random() < 0.3) {
      const currentDate = new Date(year, month - 1, day);
      const formattedDate = format(currentDate, 'yyyy-MM-dd');
      
      const mealIds = mockMeals.map(meal => meal.id);
      const randomBreakfast = mealIds[Math.floor(Math.random() * mealIds.length)];
      const randomLunch = mealIds[Math.floor(Math.random() * mealIds.length)];
      const randomDinner = mealIds[Math.floor(Math.random() * mealIds.length)];
      
      schedules.push({
        date: formattedDate,
        breakfast: [randomBreakfast],
        lunch: [randomLunch, mealIds[Math.floor(Math.random() * mealIds.length)]],
        dinner: [randomDinner]
      });
    }
  }

  return schedules;
};

export default {
  meals: mockMeals,
  getSchedules: (year, month) => generateMonthSchedule(year, month)
}; 