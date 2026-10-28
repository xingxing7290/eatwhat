<template>
  <section class="not-found" aria-labelledby="missing-title">
    <div class="missing-card">
      <span class="eyebrow">A LITTLE DETOUR · 页面未找到</span>
      <div class="number" aria-hidden="true">404<span>·</span></div>
      <h1 id="missing-title">这条路，暂时没有通向饭桌</h1>
      <p>链接可能已失效，或页面已经搬家。回到首页继续安排今天的美味吧。</p>
      <div class="actions">
        <RouterLink class="primary-action" to="/dashboard">回到首页 <span aria-hidden="true">→</span></RouterLink>
        <RouterLink class="secondary-action" to="/meals">浏览菜谱</RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.not-found { min-height: min(68vh, 640px); display: grid; place-items: center; padding: clamp(16px, 4vw, 48px) 0; }
.missing-card { width: min(100%, 680px); box-sizing: border-box; padding: clamp(28px, 6vw, 64px); border: 1px solid var(--border-color); border-radius: 28px; background: linear-gradient(145deg, var(--bg-primary), var(--bg-secondary)); box-shadow: 0 14px 40px var(--shadow-color); }
.eyebrow { color: var(--text-primary); font-size: 11px; font-weight: 800; letter-spacing: .12em; }
.number { margin: 18px 0 8px; color: var(--text-primary); font-family: Georgia, serif; font-size: clamp(76px, 15vw, 126px); font-weight: 600; letter-spacing: -.08em; line-height: .9; }
.number span { color: var(--secondary-color); }
h1 { color: var(--text-primary); font-size: clamp(23px, 3vw, 30px); line-height: 1.4; margin: 22px 0 12px; }
p { color: var(--text-primary); line-height: 1.8; margin: 0; }
.actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 28px; }
.actions a { display: inline-flex; align-items: center; justify-content: center; gap: 16px; min-height: 46px; box-sizing: border-box; padding: 10px 18px; border: 1px solid var(--text-primary); border-radius: 12px; color: var(--text-primary); font-weight: 700; text-decoration: none; }
.actions .primary-action { background: var(--text-primary); color: var(--bg-primary); }
.actions a:focus-visible { outline: 3px solid var(--secondary-color); outline-offset: 3px; }
@media (max-width: 480px) { .actions a { flex: 1 1 150px; } }
</style>
