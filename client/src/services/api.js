import axios from 'axios';
import mockData from './mockData';
import { ElMessage } from 'element-plus';

// 是否使用模拟数据
const USE_MOCK = false;

// API日志历史记录
export const apiLogs = {
	history: [],
	maxEntries: 50, // 最多保存的日志条数
	
	// 添加日志
	add(type, url, data, status, timestamp = new Date()) {
		this.history.unshift({
			type,
			url,
			data,
			status,
			timestamp
		});
		
		// 限制日志数量
		if (this.history.length > this.maxEntries) {
			this.history.pop();
		}
	},
	
	// 清除日志
	clear() {
		this.history = [];
	},
	
	// 获取日志
	getLogs() {
		return this.history;
	}
};

// 日志打印函数
const logAPI = (type, url, data, status) => {
	const timestamp = new Date();
	const timeString = timestamp.toLocaleTimeString();
	const colorMap = {
		request: 'color: #2196F3; font-weight: bold',
		response: 'color: #4CAF50; font-weight: bold',
		error: 'color: #F44336; font-weight: bold'
	};
	
	// 添加到日志历史
	apiLogs.add(type, url, data, status, timestamp);
	
	console.group(`%c${type.toUpperCase()} [${timeString}] ${url}`, colorMap[type]);
	
	if (type === 'request') {
		if (data instanceof FormData) {
			console.log('请求数据 (FormData):');
			for (const [key, value] of data.entries()) {
				if (value instanceof File) {
					console.log(`  ${key}:`, { name: value.name, size: value.size, type: value.type });
				} else {
					console.log(`  ${key}: ${value}`);
				}
			}
		} else {
			console.log('请求数据:', data || '无');
		}
	} else if (type === 'response') {
		console.log('状态码:', status);
		console.log('响应数据:', data);
	} else if (type === 'error') {
		console.log('状态码:', status || '无');
		console.log('错误信息:', data);
	}
	
	console.groupEnd();
};

// 直接使用固定的后端API地址
const computedBaseURL = (import.meta?.env?.VITE_API_BASE_URL) || '/api';

// 创建axios实例
const api = axios.create({
	baseURL: computedBaseURL,
	timeout: 10000
	// 移除默认的 Content-Type, 以便在上传文件时 axios 能自动设置 multipart/form-data
});

// 请求拦截器
api.interceptors.request.use(
	config => {
		// 注入token
		const token = localStorage.getItem('token');
		if (token) {
			config.headers = config.headers || {};
			config.headers.Authorization = `Bearer ${token}`;
		}
		// 打印请求信息
		logAPI('request', `${config.method.toUpperCase()} ${config.url}`, config.data);
		
		// 可在此添加token等认证信息
		return config;
	},
	error => {
		logAPI('error', '请求错误', error.message);
		return Promise.reject(error);
	}
);

// 响应拦截器
api.interceptors.response.use(
	response => {
		// 打印响应信息
		logAPI('response', `${response.config.method.toUpperCase()} ${response.config.url}`, response.data, response.status);
		
		return response.data;
	},
	error => {
		// 统一处理错误
		const { response } = error;
		if (response) {
			// 服务器返回错误信息
			const errorMsg = response.data?.error || response.data?.errors?.[0]?.msg || '服务器错误';
			logAPI('error', `${error.config?.method?.toUpperCase() || 'ERROR'} ${error.config?.url || '未知URL'}`, response.data, response.status);
			
			// 详细打印错误信息，帮助调试
			console.error('API错误详情:', {
				url: error.config?.url,
				method: error.config?.method,
				status: response.status,
				data: response.data,
				requestData: (error.config?.data && typeof error.config.data === 'string') ? JSON.parse(error.config.data) : '非JSON或无数据'
			});
			
			ElMessage.error(errorMsg);
			return Promise.reject(response.data || '服务器错误');
		} else {
			// 网络错误或请求被取消
			logAPI('error', '网络错误', error.message);
			ElMessage.error('网络错误，请检查您的网络连接');
			return Promise.reject('网络错误，请检查您的网络连接');
		}
	}
);

// 模拟API响应
const mockResponse = (data, delay = 300) => {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve(data);
		}, delay);
	});
};

// 餐食计划相关API
export const scheduleApi = {
	// 获取某月餐食计划
	getSchedulesByMonth: (year, month) => {
		if (USE_MOCK) {
			return mockResponse(mockData.getSchedules(year, month));
		}
		// 调用新的后端接口，一次性获取整月数据
		return api.get(`/schedules?year=${year}&month=${month}`);
	},
	
	// 设置某日餐食
	setMeal: (date, mealType, mealIds) => {
		if (USE_MOCK) {
			ElMessage.success('餐食安排已保存（模拟数据）');
			return mockResponse({ success: true });
		}
		return api.put(`/schedules/${date}/${mealType}`, { mealIds }, {
			headers: { 'Content-Type': 'application/json' }
		});
	},
	
	// 删除某日餐食
	deleteMeal: (date, mealType) => {
		if (USE_MOCK) {
			ElMessage.success('餐食安排已删除（模拟数据）');
			return mockResponse({ success: true });
		}
		// 将餐食设置为空数组即为清空该餐
		return api.put(`/schedules/${date}/${mealType}`, { mealIds: [] }, {
			headers: { 'Content-Type': 'application/json' }
		});
	}
};

// 菜品相关API
export const mealApi = {
	// 获取所有菜品
	getAllMeals: (params = {}) => {
		if (USE_MOCK) {
			return mockResponse({
				data: mockData.meals,
				total: mockData.meals.length
			});
		}
		return api.get('/meals')
			.then(data => {
				// 确保data是数组
				const mealsArray = Array.isArray(data) ? data : [];
				console.log('获取到的菜品数据:', mealsArray);
				return {
					data: mealsArray,
					total: mealsArray.length
				};
			});
	},
	getMealCategories: () => {
		if (USE_MOCK) {
			return mockResponse({ data: [] });
		}
		return api.get('/meals/categories')
			.then(data => ({ data: Array.isArray(data) ? data : [] }));
	},
	
	// 获取菜品详情
	getMealById: (id) => {
		if (USE_MOCK) {
			const meal = mockData.meals.find(m => m.id === parseInt(id)) || null;
			return mockResponse(meal);
		}
		return api.get(`/meals/${id}`);
	},
	
	// 创建菜品 - 现在接收 FormData
	createMeal: (formData) => {
		if (USE_MOCK) {
			const newMeal = {
				id: Math.floor(Math.random() * 10000) + 1,
				name: formData.get('name'),
				description: formData.get('description'),
				// 在模拟模式下，我们创建一个临时的 URL
				image: formData.has('image') ? URL.createObjectURL(formData.get('image')) : ''
			};
			mockData.meals.unshift(newMeal);
			return mockResponse(newMeal);
		}
		// 当 data 是 FormData 时, axios 会自动设置 Content-Type 为 multipart/form-data
		return api.post('/meals', formData);
	},
	
	// 更新菜品 - 现在接收 FormData
	updateMeal: (id, formData) => {
		if (USE_MOCK) {
			const index = mockData.meals.findIndex(m => m.id === id);
			if (index !== -1) {
				const existingMeal = mockData.meals[index];
				const updatedMeal = {
					...existingMeal,
					name: formData.get('name'),
					description: formData.get('description'),
					// 如果上传了新图片，则创建临时 URL，否则保留旧图片
					image: formData.has('image') ? URL.createObjectURL(formData.get('image')) : existingMeal.image,
				};
				mockData.meals[index] = updatedMeal;
				return mockResponse(updatedMeal);
			}
			return Promise.reject('菜品不存在');
		}
		return api.put(`/meals/${id}`, formData);
	},
	
	// 删除菜品
	deleteMeal: (id) => {
		if (USE_MOCK) {
			const index = mockData.meals.findIndex(m => m.id === id);
			if (index !== -1) {
				mockData.meals.splice(index, 1);
				return mockResponse({ success: true });
			}
			return Promise.reject('菜品不存在');
		}
		return api.delete(`/meals/${id}`);
	}
};

// 认证相关API
export const authApi = {
	// 登录
	login: (payload) => {
		return api.post('/auth/login', payload);
	},
	// 注册
	register: (payload) => {
		return api.post('/auth/register', payload);
	},
	// 获取当前用户
	me: () => {
		return api.get('/auth/me');
	}
};

export default {
	schedule: scheduleApi,
	meal: mealApi,
	auth: authApi
}; 