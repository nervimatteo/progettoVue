<template>
  <div id="app">
    <nav class="barra-navigazione">
      <router-link to="/" class="collegamento-nav">🎾 Live</router-link>
      <router-link to="/cerca" class="collegamento-nav">🔍 Cerca Giocatore</router-link>
    </nav>
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
}
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #f7f7f5; }
#app { font-family: 'Segoe UI', sans-serif; }
.barra-navigazione {
  display: flex;
  gap: 8px;
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}
.collegamento-nav {
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid #ddd;
  color: #555;
  background: white;
  text-decoration: none;
  transition: all 0.15s;
}
.collegamento-nav.router-link-active {
  background: #1a1a1a;
  color: white;
  border-color: #1a1a1a;
}
</style>