import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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

export default router 