<template>
  <div class="detail-panel">
    <div class="detail-header">
      <span class="detail-title">{{ match.event_first_player }} vs {{ match.event_second_player }}</span>
      <div class="header-actions">
        <button class="ai-btn" :disabled="aiLoading" @click="generateCommentary">
          <span class="ai-icon">✦</span>
          {{ aiLoading ? 'Generando...' : 'Commento AI' }}
        </button>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
    </div>

    <div class="match-info">
      <div class="info-item">
        <span class="info-label">Torneo</span>
        <span class="info-val">{{ match.league_name }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Superficie</span>
        <span class="info-val">{{ match.league_surface || 'N/D' }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Stato</span>
        <span class="info-val">{{ match.event_status }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Risultato</span>
        <span class="info-val">{{ match.event_final_result }}</span>
      </div>
    </div>

    <div class="sets-table" v-if="match.scores && match.scores.length">
      <table>
        <thead>
          <tr>
            <th>Giocatore</th>
            <th v-for="(s, i) in match.scores" :key="i">Set {{ i + 1 }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{{ match.event_first_player }}</td>
            <td v-for="(s, i) in match.scores" :key="'a' + i"
              :class="{ bold: parseInt(s.score_first) > parseInt(s.score_second) }">
              {{ s.score_first }}
            </td>
          </tr>
          <tr>
            <td>{{ match.event_second_player }}</td>
            <td v-for="(s, i) in match.scores" :key="'b' + i"
              :class="{ bold: parseInt(s.score_second) > parseInt(s.score_first) }">
              {{ s.score_second }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="ai-commentary" v-if="aiCommentary || aiLoading">
      <div class="ai-label">✦ Commento AI</div>
      <div class="ai-text">{{ aiLoading ? 'Sto analizzando il match...' : aiCommentary }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  emits: ['close'],
  props: {
    match: { type: Object, default: null },
    groqKey: { type: String, default: '' },
  },
  data() {
    return {
      aiCommentary: '',
      aiLoading: false,
    }
  },
  watch: {
    match() {
      this.aiCommentary = ''
    }
  },
  methods: {
    async generateCommentary() {
      if (!this.match) return
      this.aiLoading = true
      this.aiCommentary = ''
      const m = this.match
      const prompt = `Sei un telecronista tennis italiano professionista. Genera un commento giornalistico breve (3-4 frasi) e coinvolgente per questo match:
- Partita: ${m.event_first_player} vs ${m.event_second_player}
- Torneo: ${m.league_name}
- Risultato: ${m.event_final_result}
- Stato: ${m.event_status}
Usa un tono appassionato e tecnico, come Sky Sport.`

      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.groqKey}`
          },
          body: JSON.stringify({
            model: 'llama3-8b-8192',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 300,
          }),
        })
        const data = await res.json()
        this.aiCommentary = data.choices?.[0]?.message?.content || 'Errore nella generazione.'
      } catch {
        this.aiCommentary = 'Errore nella chiamata AI.'
      } finally {
        this.aiLoading = false
      }
    },
  },
}
</script>

<style scoped>
.detail-panel { background: white; border: 1px solid #eee; border-radius: 12px; padding: 16px; margin-bottom: 1rem; }
.detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.detail-title { font-size: 14px; font-weight: 600; color: #1a1a1a; flex: 1; margin-right: 10px; }
.header-actions { display: flex; align-items: center; gap: 8px; }
.ai-btn { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border: 1px solid #ddd; border-radius: 20px; font-size: 12px; color: #555; background: white; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
.ai-btn:hover:not(:disabled) { background: #f9f9f9; border-color: #c8a84b; color: #854f0b; }
.ai-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.ai-icon { color: #c8a84b; }
.close-btn { width: 32px; height: 32px; border-radius: 50%; border: 1px solid #eee; background: #f5f5f5; cursor: pointer; font-size: 14px; color: #555; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.close-btn:hover { background: #fee; border-color: #fcc; color: #a32d2d; }
.match-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
.info-item { display: flex; flex-direction: column; gap: 2px; padding: 8px 10px; background: #f9f9f9; border-radius: 8px; }
.info-label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.4px; }
.info-val { font-size: 13px; font-weight: 500; color: #1a1a1a; }
.sets-table { margin-bottom: 14px; overflow-x: auto; }
.sets-table table { width: 100%; border-collapse: collapse; font-size: 13px; }
.sets-table th { text-align: left; padding: 6px 8px; color: #999; font-weight: 500; font-size: 11px; border-bottom: 1px solid #f0f0f0; }
.sets-table td { padding: 6px 8px; color: #333; border-bottom: 1px solid #f0f0f0; }
.sets-table td.bold { font-weight: 700; color: #1a1a1a; }
.ai-commentary { padding: 12px; background: #fffbf0; border-radius: 8px; border-left: 3px solid #c8a84b; }
.ai-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #854f0b; margin-bottom: 4px; font-weight: 600; }
.ai-text { font-size: 13px; color: #444; line-height: 1.6; }
</style>