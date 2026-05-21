<template>
  <div class="app">
    <header class="intestazione">
      <div class="logo">
        <span class="logo-pallina"></span>
        <span class="logo-testo">TennisLive</span>
      </div>
    </header>

    <div class="tabs-interni">
      <button :class="['tab-interno', { attivo: tabAttiva === 'tornei' }]" @click="tabAttiva = 'tornei'">
        🏆 Tornei in corso
      </button>
      <button :class="['tab-interno', { attivo: tabAttiva === 'giocatore' }]" @click="tabAttiva = 'giocatore'">
        👤 Cerca Giocatore
      </button>
    </div>

    <div v-if="tabAttiva === 'tornei'">
      <div v-if="caricamentoTornei" class="msg-stato">Caricamento tornei...</div>
      <div v-if="erroreTornei" class="msg-stato errore">{{ erroreTornei }}</div>

      <div v-if="!torneoSelezionato">
        <p class="etichetta-sezione">Tornei in corso</p>
        <div class="lista-tornei">
          <div
            v-for="torneo in tornei"
            :key="torneo.id"
            class="scheda-torneo"
            @click="selezionaTorneo(torneo)"
          >
            <div class="torneo-info">
              <span class="torneo-nome">{{ torneo.name }}</span>
              <span class="torneo-categoria">{{ torneo.category?.name || '' }}</span>
            </div>
            <span class="torneo-freccia">›</span>
          </div>
        </div>
      </div>

      <div v-if="torneoSelezionato">
        <button class="btn-indietro" @click="torneoSelezionato = null">
          ← Tutti i tornei
        </button>
        <h2 class="titolo-torneo">{{ torneoSelezionato.name }}</h2>
        <p class="etichetta-sezione">Partite di oggi</p>

        <div v-if="caricamentoMatchTorneo" class="msg-stato">Caricamento partite...</div>
        <div v-if="erroreMatchTorneo" class="msg-stato errore">{{ erroreMatchTorneo }}</div>
        <div v-if="!caricamentoMatchTorneo && matchTorneo.length === 0 && !erroreMatchTorneo" class="msg-stato">
          Nessuna partita oggi per questo torneo.
        </div>

        <div class="griglia-partite">
          <div
            v-for="partita in matchTorneo"
            :key="partita.id"
            class="scheda-partita"
          >
            <div class="meta-partita">
              <span class="orario">{{ formattaOrario(partita.startTimestamp) }}</span>
              <span :class="['stato-partita', partita.status?.type === 'inprogress' ? 'live' : partita.status?.type === 'finished' ? 'finita' : 'programmata']">
                {{ partita.status?.description || 'Programmata' }}
              </span>
            </div>
            <div class="giocatori">
              <div class="riga-giocatore">
                <span :class="['nome-giocatore', partita.winnerCode === 1 ? 'vincitore' : '']">
                  {{ partita.homeTeam?.name || 'Giocatore 1' }}
                  {{ partita.winnerCode === 1 ? '✓' : '' }}
                </span>
                <div class="punteggi">
                  <span v-if="partita.homeScore?.period1 !== undefined" :class="['punteggio-set', partita.homeScore.period1 > partita.awayScore.period1 ? 'vinto' : '']">{{ partita.homeScore.period1 }}</span>
                  <span v-if="partita.homeScore?.period2 !== undefined" :class="['punteggio-set', partita.homeScore.period2 > partita.awayScore.period2 ? 'vinto' : '']">{{ partita.homeScore.period2 }}</span>
                  <span v-if="partita.homeScore?.period3 !== undefined" :class="['punteggio-set', partita.homeScore.period3 > partita.awayScore.period3 ? 'vinto' : '']">{{ partita.homeScore.period3 }}</span>
                  <span v-if="partita.homeScore?.current !== undefined && partita.status?.type === 'inprogress'" class="punteggio-game">{{ partita.homeScore.current }}</span>
                </div>
              </div>
              <div class="divisore"></div>
              <div class="riga-giocatore">
                <span :class="['nome-giocatore', partita.winnerCode === 2 ? 'vincitore' : '']">
                  {{ partita.awayTeam?.name || 'Giocatore 2' }}
                  {{ partita.winnerCode === 2 ? '✓' : '' }}
                </span>
                <div class="punteggi">
                  <span v-if="partita.awayScore?.period1 !== undefined" :class="['punteggio-set', partita.awayScore.period1 > partita.homeScore.period1 ? 'vinto' : '']">{{ partita.awayScore.period1 }}</span>
                  <span v-if="partita.awayScore?.period2 !== undefined" :class="['punteggio-set', partita.awayScore.period2 > partita.homeScore.period2 ? 'vinto' : '']">{{ partita.awayScore.period2 }}</span>
                  <span v-if="partita.awayScore?.period3 !== undefined" :class="['punteggio-set', partita.awayScore.period3 > partita.homeScore.period3 ? 'vinto' : '']">{{ partita.awayScore.period3 }}</span>
                  <span v-if="partita.awayScore?.current !== undefined && partita.status?.type === 'inprogress'" class="punteggio-game">{{ partita.awayScore.current }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="tabAttiva === 'giocatore'">
      <div class="box-ricerca">
        <input
          v-model="queryRicerca"
          type="text"
          placeholder="Cerca un giocatore (es. Sinner, Djokovic...)"
          class="input-ricerca"
          @keyup.enter="cercaGiocatore"
        />
        <button class="btn-cerca" @click="cercaGiocatore" :disabled="caricamentoRicerca">
          {{ caricamentoRicerca ? 'Cercando...' : 'Cerca' }}
        </button>
      </div>

      <div v-if="erroreRicerca" class="msg-stato errore">{{ erroreRicerca }}</div>

      <div v-if="risultatiGiocatori.length > 0" class="lista-giocatori">
        <div
          v-for="giocatore in risultatiGiocatori"
          :key="giocatore.id"
          class="elemento-giocatore"
          @click="selezionaGiocatore(giocatore)"
        >
          <div class="nome-elemento-giocatore">{{ giocatore.name }}</div>
          <div class="meta-elemento-giocatore">{{ giocatore.sport?.name || 'Tennis' }}</div>
        </div>
      </div>

      <div v-if="giocatoreSelezionato" class="dettaglio-giocatore">
        <div class="intestazione-dettaglio">
          <div>
            <h2 class="nome-dettaglio">{{ giocatoreSelezionato.name }}</h2>
            <p class="meta-dettaglio">
              {{ giocatoreSelezionato.country?.name || '' }}
              {{ giocatoreSelezionato.dateOfBirthTimestamp ? '· ' + getEta(giocatoreSelezionato.dateOfBirthTimestamp) + ' anni' : '' }}
            </p>
          </div>
          <div class="classifica-giocatore" v-if="classificaGiocatore">
            <span class="numero-classifica">#{{ classificaGiocatore }}</span>
            <span class="etichetta-classifica">Classifica</span>
          </div>
        </div>

        <p class="etichetta-sezione" style="margin-top: 16px;">Ultime partite</p>
        <div v-if="caricamentoPartiteGiocatore" class="msg-stato">Caricamento partite...</div>

        <div class="griglia-partite">
          <div
            v-for="partita in partiteGiocatore"
            :key="partita.id"
            class="scheda-partita"
          >
            <div class="meta-partita">
              <span class="torneo-nome-small">{{ partita.tournament?.name || 'Torneo' }}</span>
              <span class="stato-partita finita">{{ partita.status?.description || 'Concluso' }}</span>
            </div>
            <div class="giocatori">
              <div class="riga-giocatore">
                <span :class="['nome-giocatore', partita.winnerCode === 1 ? 'vincitore' : '']">
                  {{ partita.homeTeam?.name || 'Giocatore 1' }}
                  {{ partita.winnerCode === 1 ? '✓' : '' }}
                </span>
                <div class="punteggi">
                  <span v-if="partita.homeScore?.period1 !== undefined" :class="['punteggio-set', partita.homeScore.period1 > partita.awayScore.period1 ? 'vinto' : '']">{{ partita.homeScore.period1 }}</span>
                  <span v-if="partita.homeScore?.period2 !== undefined" :class="['punteggio-set', partita.homeScore.period2 > partita.awayScore.period2 ? 'vinto' : '']">{{ partita.homeScore.period2 }}</span>
                  <span v-if="partita.homeScore?.period3 !== undefined" :class="['punteggio-set', partita.homeScore.period3 > partita.awayScore.period3 ? 'vinto' : '']">{{ partita.homeScore.period3 }}</span>
                </div>
              </div>
              <div class="divisore"></div>
              <div class="riga-giocatore">
                <span :class="['nome-giocatore', partita.winnerCode === 2 ? 'vincitore' : '']">
                  {{ partita.awayTeam?.name || 'Giocatore 2' }}
                  {{ partita.winnerCode === 2 ? '✓' : '' }}
                </span>
                <div class="punteggi">
                  <span v-if="partita.awayScore?.period1 !== undefined" :class="['punteggio-set', partita.awayScore.period1 > partita.homeScore.period1 ? 'vinto' : '']">{{ partita.awayScore.period1 }}</span>
                  <span v-if="partita.awayScore?.period2 !== undefined" :class="['punteggio-set', partita.awayScore.period2 > partita.homeScore.period2 ? 'vinto' : '']">{{ partita.awayScore.period2 }}</span>
                  <span v-if="partita.awayScore?.period3 !== undefined" :class="['punteggio-set', partita.awayScore.period3 > partita.homeScore.period3 ? 'vinto' : '']">{{ partita.awayScore.period3 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
const INTESTAZIONI_SOFASCORE = { 'Accept': 'application/json' }

export default {
  name: 'VistaCercaTornei',
  data() {
    return {
      tabAttiva: 'tornei',

      tornei: [],
      caricamentoTornei: false,
      erroreTornei: null,
      torneoSelezionato: null,
      matchTorneo: [],
      caricamentoMatchTorneo: false,
      erroreMatchTorneo: null,

      queryRicerca: '',
      caricamentoRicerca: false,
      erroreRicerca: null,
      risultatiGiocatori: [],
      giocatoreSelezionato: null,
      classificaGiocatore: null,
      partiteGiocatore: [],
      caricamentoPartiteGiocatore: false,
    }
  },
  methods: {

    getEta(timestamp) {
      const nascita = new Date(timestamp * 1000)
      const oggi = new Date()
      return oggi.getFullYear() - nascita.getFullYear()
    },
    formattaOrario(timestamp) {
      if (!timestamp) return ''
      const data = new Date(timestamp * 1000)
      return data.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    },
    dataOggiFormattata() {
      const oggi = new Date()
      const anno = oggi.getFullYear()
      const mese = String(oggi.getMonth() + 1).padStart(2, '0')
      const giorno = String(oggi.getDate()).padStart(2, '0')
      return `${anno}-${mese}-${giorno}`
    },

async caricaTornei() {
  this.caricamentoTornei = true
  this.erroreTornei = null
  try {
    const oggi = this.dataOggiFormattata()
    const risposta = await fetch(
      `https://api.sofascore.com/api/v1/sport/tennis/scheduled-events/${oggi}`,
      { headers: INTESTAZIONI_SOFASCORE }
    )
    const dati = await risposta.json()
    const eventi = dati.events || []

    const torneiMappa = new Map()
    eventi.forEach(e => {
      const t = e.tournament
      if (t && !torneiMappa.has(t.id)) {
        torneiMappa.set(t.id, {
          id: t.id,
          name: t.name,
          category: t.category,
          eventiOggi: []
        })
      }
      if (t) torneiMappa.get(t.id).eventiOggi.push(e)
    })

    this.tornei = Array.from(torneiMappa.values())
    if (this.tornei.length === 0) {
      this.erroreTornei = 'Nessun torneo in programma oggi.'
    }
  } catch (e) {
    console.error(e)
    this.erroreTornei = 'Errore nel caricamento dei tornei.'
  } finally {
    this.caricamentoTornei = false
  }
},

async selezionaTorneo(torneo) {
  this.torneoSelezionato = torneo
  this.matchTorneo = torneo.eventiOggi || []
  this.caricamentoMatchTorneo = false
  this.erroreMatchTorneo = null
},

    async cercaGiocatore() {
      if (!this.queryRicerca.trim()) return
      this.caricamentoRicerca = true
      this.erroreRicerca = null
      this.risultatiGiocatori = []
      this.giocatoreSelezionato = null
      this.partiteGiocatore = []
      this.classificaGiocatore = null
      try {
        const risposta = await fetch(
          `https://api.sofascore.com/api/v1/search/player-team-events/${encodeURIComponent(this.queryRicerca)}/sport/tennis`,
          { headers: INTESTAZIONI_SOFASCORE }
        )
        const dati = await risposta.json()
        const giocatori = dati.players || dati.results?.players || []
        if (giocatori.length > 0) {
          this.risultatiGiocatori = giocatori.slice(0, 5)
        } else {
          this.erroreRicerca = 'Nessun giocatore trovato.'
        }
      } catch {
        this.erroreRicerca = 'Errore nella ricerca.'
      } finally {
        this.caricamentoRicerca = false
      }
    },
    async selezionaGiocatore(giocatore) {
      this.giocatoreSelezionato = giocatore
      this.risultatiGiocatori = []
      this.partiteGiocatore = []
      this.classificaGiocatore = null
      this.caricamentoPartiteGiocatore = true
      try {
        const risposta = await fetch(
          `https://api.sofascore.com/api/v1/player/${giocatore.id}/events/last/0`,
          { headers: INTESTAZIONI_SOFASCORE }
        )
        const dati = await risposta.json()
        this.partiteGiocatore = (dati.events || []).slice(0, 8)
      } catch {
        this.partiteGiocatore = []
      }
      try {
        const risposta2 = await fetch(
          `https://api.sofascore.com/api/v1/player/${giocatore.id}`,
          { headers: INTESTAZIONI_SOFASCORE }
        )
        const dati2 = await risposta2.json()
        this.classificaGiocatore = dati2.player?.ranking || null
        if (dati2.player) {
          this.giocatoreSelezionato = { ...this.giocatoreSelezionato, ...dati2.player }
        }
      } catch {
        this.classificaGiocatore = null
      } finally {
        this.caricamentoPartiteGiocatore = false
      }
    },
  },
  mounted() {
    this.caricaTornei()
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

.tabs-interni { display: flex; gap: 8px; margin-bottom: 1.25rem; }
.tab-interno { padding: 7px 18px; border-radius: 20px; font-size: 13px; cursor: pointer; border: 1px solid #ddd; color: #555; background: white; transition: all 0.15s; }
.tab-interno.attivo { background: #1a1a1a; color: white; border-color: #1a1a1a; }

.msg-stato { padding: 12px; text-align: center; color: #555; font-size: 14px; }
.msg-stato.errore { color: #a32d2d; background: #fff0f0; border-radius: 8px; margin-bottom: 12px; }
.etichetta-sezione { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }

.lista-tornei { display: flex; flex-direction: column; gap: 8px; margin-bottom: 1.5rem; }
.scheda-torneo { background: white; border: 1px solid #eee; border-radius: 12px; padding: 14px 16px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: border-color 0.15s; }
.scheda-torneo:hover { border-color: #c8a84b; }
.torneo-info { display: flex; flex-direction: column; gap: 3px; }
.torneo-nome { font-size: 14px; font-weight: 600; color: #1a1a1a; }
.torneo-categoria { font-size: 12px; color: #999; }
.torneo-freccia { font-size: 20px; color: #ccc; }

.btn-indietro { background: none; border: 1px solid #ddd; border-radius: 8px; padding: 6px 14px; font-size: 13px; cursor: pointer; color: #555; margin-bottom: 12px; transition: border-color 0.15s; }
.btn-indietro:hover { border-color: #999; }
.titolo-torneo { font-size: 18px; font-weight: 600; color: #1a1a1a; margin-bottom: 12px; }

.griglia-partite { display: flex; flex-direction: column; gap: 10px; margin-bottom: 1.5rem; }
.scheda-partita { background: white; border: 1px solid #eee; border-radius: 12px; padding: 14px 16px; }
.meta-partita { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.orario { font-size: 12px; color: #999; font-weight: 500; }
.torneo-nome-small { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.4px; }
.stato-partita { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 500; }
.stato-partita.live { color: #0f6e56; background: #e1f5ee; }
.stato-partita.finita { color: #555; background: #f0f0f0; }
.stato-partita.programmata { color: #1a4fa0; background: #e8effe; }
.giocatori { display: flex; flex-direction: column; gap: 8px; }
.riga-giocatore { display: flex; align-items: center; justify-content: space-between; }
.nome-giocatore { font-size: 14px; font-weight: 500; color: #1a1a1a; }
.nome-giocatore.vincitore { color: #0f6e56; }
.punteggi { display: flex; gap: 5px; align-items: center; }
.punteggio-set { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 500; border-radius: 4px; color: #777; background: #f5f5f5; }
.punteggio-set.vinto { background: #1a1a1a; color: white; }
.punteggio-game { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 600; border: 1px solid #c8a84b; border-radius: 6px; color: #854f0b; background: #faeeda; margin-left: 4px; }
.divisore { height: 1px; background: #f0f0f0; }

.box-ricerca { display: flex; gap: 8px; margin-bottom: 1rem; }
.input-ricerca { flex: 1; padding: 10px 14px; border: 1px solid #ddd; border-radius: 10px; font-size: 14px; outline: none; }
.input-ricerca:focus { border-color: #c8a84b; }
.btn-cerca { padding: 10px 20px; background: #1a1a1a; color: white; border: none; border-radius: 10px; font-size: 14px; cursor: pointer; }
.btn-cerca:disabled { opacity: 0.6; cursor: not-allowed; }
.lista-giocatori { display: flex; flex-direction: column; gap: 6px; margin-bottom: 1rem; }
.elemento-giocatore { background: white; border: 1px solid #eee; border-radius: 10px; padding: 12px 16px; cursor: pointer; transition: border-color 0.15s; }
.elemento-giocatore:hover { border-color: #c8a84b; }
.nome-elemento-giocatore { font-size: 14px; font-weight: 500; color: #1a1a1a; }
.meta-elemento-giocatore { font-size: 12px; color: #999; margin-top: 2px; }
.dettaglio-giocatore { background: white; border: 1px solid #eee; border-radius: 12px; padding: 16px; margin-bottom: 1rem; }
.intestazione-dettaglio { display: flex; justify-content: space-between; align-items: center; }
.nome-dettaglio { font-size: 20px; font-weight: 600; color: #1a1a1a; }
.meta-dettaglio { font-size: 13px; color: #999; margin-top: 4px; }
.classifica-giocatore { display: flex; flex-direction: column; align-items: center; background: #faeeda; border: 1px solid #c8a84b; border-radius: 10px; padding: 10px 16px; }
.numero-classifica { font-size: 24px; font-weight: 700; color: #854f0b; }
.etichetta-classifica { font-size: 10px; color: #854f0b; text-transform: uppercase; letter-spacing: 0.4px; }
</style>