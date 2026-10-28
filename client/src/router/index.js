import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.path === from.path) return false
    return { left: 0, top: 0 }
  },
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
      meta: { title: '创建账号' }
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
      path: '/guest-orders',
      name: 'guestOrders',
      component: () => import('../views/GuestOrdersPage.vue'),
      meta: { title: '宴请点菜' }
    },
    {
      path: '/meals',
      name: 'meals',
      component: () => import('../views/MealPage.vue'),
      meta: { title: '菜谱' }
    },
    {
      path: '/meals/detail/:id',
      name: 'MealDetail',
      component: () => import('../views/MealDetail.vue'),
      props: true,
      meta: { title: '菜谱详情' }
    },
    {
      path: '/meals/editor/:id?',
      name: 'MealEditor',
      component: () => import('../views/MealEditor.vue'),
      props: true,
      meta: { title: '编辑菜谱' }
    },
    {
      path: '/selection',
      name: 'MealSelection',
      component: () => import('../views/MealSelection.vue'),
      props: route => ({
        date: route.query.date,
        mealType: route.query.mealType
      }),
      meta: { title: '选择菜品' }
    },
    {
      path: '/memories',
      name: 'memories',
      component: () => import('../views/MemoryTimeline.vue'),
      meta: { title: '饭后回忆' }
    },
    {
      path: '/photo-album',
      name: 'photoAlbum',
      component: () => import('../views/PhotoAlbumPage.vue'),
      meta: { title: '饭桌相册' }
    },
    {
      path: '/review',
      name: 'review',
      component: () => import('../views/ReviewPage.vue'),
      meta: { title: '饭桌回顾' }
    },
    {
      path: '/wishlist',
      name: 'wishlist',
      component: () => import('../views/WishlistPage.vue'),
      meta: { title: '想吃清单' }
    },
    {
      path: '/anniversaries',
      name: 'anniversaries',
      component: () => import('../views/AnniversaryPage.vue'),
      meta: { title: '纪念日' }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/UserSettings.vue'),
      meta: { title: '设置' }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'notFound',
      component: () => import('../views/NotFoundPage.vue'),
      meta: { title: '页面未找到' }
    }
  ]
})

router.beforeEach((to, from, next) => {
  if (to.name === 'login' || to.name === 'accountApply') return next()
  const token = localStorage.getItem('token')
  if (!token) return next({ name: 'login', query: { redirect: to.fullPath } })
  next()
})

router.afterEach((to, from, failure) => {
  if (!failure) document.title = `${to.meta.title || '安排吃啥'} · 安排吃啥`
})

export default router
