import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginPage.vue')
    },
    {
      path: '/',
      name: 'calendar',
      component: () => import('../views/CalendarPage.vue')
    },
    {
      path: '/meals',
      name: 'meals',
      component: () => import('../views/MealPage.vue')
    },
    {
      path: '/meals/editor/:id',
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
    }
  ]
})

router.beforeEach((to, from, next) => {
  if (to.name === 'login') return next()
  const token = localStorage.getItem('token')
  if (!token) return next({ name: 'login', query: { redirect: to.fullPath } })
  next()
})

export default router 