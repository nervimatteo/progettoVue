<template>
  <div class="app">
    <header class="intestazione">
      <div class="logo">
        <span class="logo-pallina"></span>
        <span class="logo-testo">TennisLive</span>
      </div>
      <div class="badge-live">
        <span class="punto-live"></span>
        <span class="testo-live">{{ partite.length }} partite in diretta</span>
      </div>
    </header>

    <div class="filtro-ricerca">
      <input
        v-model="filtroTorneo"
        type="text"
        placeholder="Filtra per torneo (es. Roland Garros...)"
        class="input-filtro"
      />
    </div>

    <div v-if="caricamento" class="msg-stato">Caricamento partite...</div>
    <div v-if="errore" class="msg-stato errore">{{ errore }}</div>

    <p class="etichetta-sezione">Partite in diretta</p>

    <div class="griglia-partite">
      <div
        v-for="partita in partiteFiltrate"
        :key="partita.chiave"
        :class="['scheda-partita', { selezionata: partitaSelezionata && partitaSelezionata.chiave === partita.chiave }]"
        @click="selezionaPartita(partita)"
      >
        <div class="meta-partita">
          <span class="torneo">{{ partita.nomeTorneo }}</span>
          <span class="stato-partita live">{{ partita.stato }}</span>
        </div>
        <div class="giocatori">
          <div class="riga-giocatore">
            <span class="nome-giocatore">{{ partita.primoGiocatore }}</span>
            <div class="punteggi">
              <span
                v-for="(s, i) in partita.set"
                :key="'g1-' + i"
                :class="['punteggio-set', parseInt(s.primoGiocatore) > parseInt(s.secondoGiocatore) ? 'vinto' : '']"
              >{{ s.primoGiocatore }}</span>
              <span class="punteggio-game">{{ getGame(partita, 0) }}</span>
            </div>
          </div>
          <div class="divisore"></div>
          <div class="riga-giocatore">
            <span class="nome-giocatore">{{ partita.secondoGiocatore }}</span>
            <div class="punteggi">
              <span
                v-for="(s, i) in partita.set"
                :key="'g2-' + i"
                :class="['punteggio-set', parseInt(s.secondoGiocatore) > parseInt(s.primoGiocatore) ? 'vinto' : '']"
              >{{ s.secondoGiocatore }}</span>
              <span class="punteggio-game">{{ getGame(partita, 1) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <HelloWorld
      v-if="partitaSelezionata"
      :match="partitaSelezionata"
      :groq-key="GROQ_KEY"
      @close="partitaSelezionata = null"
    />
  </div>
</template>

<script>
import HelloWorld from '@/components/HelloWorld.vue'

const INTESTAZIONI_SOFASCORE = { 'Accept': 'application/json' }

export default {
  name: 'VistaHome',
  components: { HelloWorld },
  data() {
    return {
      partite: [],
      partitaSelezionata: null,
      caricamento: false,
      errore: null,
      filtroTorneo: '',
      intervalloAggiornamento: null,
    }
  },
  computed: {
    partiteFiltrate() {
      if (!this.filtroTorneo.trim()) return this.partite
      return this.partite.filter(p =>
        p.nomeTorneo.toLowerCase().includes(this.filtroTorneo.toLowerCase())
      )
    },
  },
  methods: {
    getGame(partita, indiceGiocatore) {
      const parti = (partita.risultatoGame || '').split(' - ')
      return parti[indiceGiocatore] || '-'
    },
    async caricaPartiteLive() {
      this.caricamento = true
      this.errore = null
      try {
        const risposta = await fetch(
          'https://api.sofascore.com/api/v1/sport/tennis/events/live',
          { headers: INTESTAZIONI_SOFASCORE }
        )
        const dati = await risposta.json()
        const eventi = dati.events || []
        if (eventi.length === 0) {
          this.errore = 'Nessuna partita live al momento.'
          this.partite = []
          return
        }
        this.partite = eventi.map(m => ({
          chiave: m.id,
          primoGiocatore: m.homeTeam?.name || 'Giocatore 1',
          secondoGiocatore: m.awayTeam?.name || 'Giocatore 2',
          risultatoGame: `${m.homeScore?.current ?? '-'} - ${m.awayScore?.current ?? '-'}`,
          stato: m.status?.description || 'In corso',
          nomeTorneo: m.tournament?.uniqueTournament?.name || m.tournament?.name || 'Torneo',
          set: [1, 2, 3, 4, 5]
            .map(i => ({
              primoGiocatore: m.homeScore?.[`period${i}`] ?? null,
              secondoGiocatore: m.awayScore?.[`period${i}`] ?? null,
            }))
            .filter(s => s.primoGiocatore !== null),
        }))
      } catch (e) {
        console.error(e)
        this.errore = 'Errore nel caricamento delle partite.'
      } finally {
        this.caricamento = false
      }
    },
    selezionaPartita(partita) {
      this.partitaSelezionata = partita
    },
  },
  mounted() {
    this.caricaPartiteLive()
    this.intervalloAggiornamento = setInterval(this.caricaPartiteLive, 300000)
  },
  beforeUnmount() {
    clearInterval(this.intervalloAggiornamento)
  },
}
</script>

<style scoped>
* { box-sizing: border-box; }
.app { max-width: 800px; margin: 0 auto; padding: 1.5rem 1rem; font-family: 'Segoe UI', sans-serif; }
.intestazione { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.logo { display: flex; align-items: center; gap: 10px; }
.logo-pallina { width: 10px; height: 10px; border-radius: 50%; background: #c8a84b; display: inline-block; }
.logo-testo { font-size: 22px; font-weight: 600; color: #1a1a1a; }
.badge-live { display: flex; align-items: center; gap: 6px; background: #fff0f0; border: 1px solid #f09595; border-radius: 20px; padding: 4px 12px; }
.punto-live { width: 7px; height: 7px; border-radius: 50%; background: #e24b4a; animation: pulse 1.2s ease-in-out infinite; display: inline-block; }
.testo-live { font-size: 12px; font-weight: 500; color: #a32d2d; }
@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
.filtro-ricerca { margin-bottom: 1rem; }
.input-filtro { width: 100%; padding: 10px 14px; border: 1px solid #ddd; border-radius: 10px; font-size: 14px; outline: none; }
.input-filtro:focus { border-color: #c8a84b; }
.etichetta-sezione { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
.griglia-partite { display: flex; flex-direction: column; gap: 10px; margin-bottom: 1.5rem; }
.msg-stato { padding: 12px; text-align: center; color: #555; font-size: 14px; }
.msg-stato.errore { color: #a32d2d; background: #fff0f0; border-radius: 8px; margin-bottom: 12px; }
.scheda-partita { background: white; border: 1px solid #eee; border-radius: 12px; padding: 14px 16px; cursor: pointer; transition: border-color 0.15s; }
.scheda-partita:hover { border-color: #ccc; }
.scheda-partita.selezionata { border: 2px solid #c8a84b; }
.meta-partita { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.torneo { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.4px; }
.stato-partita { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 500; }
.stato-partita.live { color: #0f6e56; background: #e1f5ee; }
.giocatori { display: flex; flex-direction: column; gap: 8px; }
.riga-giocatore { display: flex; align-items: center; justify-content: space-between; }
.nome-giocatore { font-size: 14px; font-weight: 500; color: #1a1a1a; }
.punteggi { display: flex; gap: 5px; align-items: center; }
.punteggio-set { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 500; border-radius: 4px; color: #777; background: #f5f5f5; }
.punteggio-set.vinto { background: #1a1a1a; color: white; }
.punteggio-game { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 600; border: 1px solid #c8a84b; border-radius: 6px; color: #854f0b; background: #faeeda; margin-left: 4px; }
.divisore { height: 1px; background: #f0f0f0; }
</style>