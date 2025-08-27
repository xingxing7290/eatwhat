const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Meal = require('./models/mealModel');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/whateat';

const meals = [
	{ name: '尖椒炒肉', description: '家常下饭，鲜辣开胃', tags: ['家常', '下饭', '辣'], ingredients: [] },
	{ name: '铜锅涮肉', description: '京味火锅，鲜肉薄切原味涮', tags: ['火锅', '北京', '牛羊肉'], ingredients: [] },
	{ name: '海底捞', description: '连锁火锅风味，自选锅底与配菜', tags: ['火锅', '连锁', '外卖可选'], ingredients: [] },
	{ name: '四川火锅', description: '麻辣鲜香，重口味首选', tags: ['火锅', '四川', '麻辣'], ingredients: [] },
	{ name: '烧烤', description: '夜宵必备，多样串类与蔬菜', tags: ['烧烤', '夜宵', '聚会'], ingredients: [] },
	{ name: '西红柿鸡蛋疙瘩汤', description: '家常暖胃汤品，酸甜适口', tags: ['家常', '汤', '清淡'], ingredients: [] }
];

(async () => {
	try {
		await mongoose.connect(MONGO_URI);
		const results = [];
		for (const m of meals) {
			const updated = await Meal.findOneAndUpdate(
				{ name: m.name },
				{ $setOnInsert: m },
				{ upsert: true, new: true }
			);
			results.push({ id: updated._id, name: updated.name });
		}
		console.log(JSON.stringify({ insertedOrExisting: results }, null, 2));
		await mongoose.connection.close();
		process.exit(0);
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
})(); 