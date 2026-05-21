import { createRouter, createWebHistory } from 'vue-router'
import VistaHome from '../views/HomeView.vue'
import VistaCerca from '../views/AboutView.vue'

const percorsi = [
  {
    path: '/',
    name: 'home',
    component: VistaHome,
  },
  {
    path: '/cerca',
    name: 'cerca',
    component: VistaCerca,
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: percorsi,
})

export default router