import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginPage.vue'),
      meta: { title: '登录' }
    },
    {
      path: '/apply-account',
      name: 'accountApply',
      component: () => import('../views/AccountApply.vue'),
      meta: { title: '申请账号' }
    },
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardPage.vue'),
      meta: { title: '小家仪表盘' }
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: () => import('../views/CalendarPage.vue'),
      meta: { title: '日历' }
    },
    {
      path: '/weekly-plan',
      name: 'weeklyPlan',
      component: () => import('../views/WeeklyPlanPage.vue'),
      meta: { title: '周计划' }
    },
    {
      path: '/shopping-list',
      name: 'shoppingList',
      component: () => import('../views/ShoppingListPage.vue'),
      meta: { title: '购物清单' }
    },
    {
      path: '/meals',
      name: 'meals',
      component: () => import('../views/MealPage.vue')
    },
    {
      path: '/meals/detail/:id',
      name: 'MealDetail',
      component: () => import('../views/MealDetail.vue'),
      props: true
    },
    {
      path: '/meals/editor/:id?',
      name: 'MealEditor',
      component: () => import('../views/MealEditor.vue'),
      props: true
    },
    {
      path: '/selection',
      name: 'MealSelection',
      component: () => import('../views/MealSelection.vue'),
      props: route => ({
        date: route.query.date,
        mealType: route.query.mealType
      })
    },
    {
      path: '/memories',
      name: 'memories',
      component: () => import('../views/MemoryTimeline.vue')
    },
    {
      path: '/photo-album',
      name: 'photoAlbum',
      component: () => import('../views/PhotoAlbumPage.vue'),
      meta: { title: '饭桌相册' }
    },
    {
      path: '/wishlist',
      name: 'wishlist',
      component: () => import('../views/WishlistPage.vue')
    },
    {
      path: '/anniversaries',
      name: 'anniversaries',
      component: () => import('../views/AnniversaryPage.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/UserSettings.vue')
    }
  ]
})

router.beforeEach((to, from, next) => {
  if (to.name === 'login' || to.name === 'accountApply') return next()
  const token = localStorage.getItem('token')
  if (!token) return next({ name: 'login', query: { redirect: to.fullPath } })
  next()
})

export default router 