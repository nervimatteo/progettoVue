import HelloWorld from '@/components/HelloWorld.vue'

const HEADERS = { Accept: 'application/json' }

const FASI = {
  'Final': 'Finale',
  'Semifinal': 'Semifinale',
  'Quarterfinal': 'Quarti',
  'Round of 16': 'Ottavi',
  'Round of 32': 'Trentaduesimi',
  'Round of 64': 'Sessantaquattresimi',
  'Round of 128': 'Primo turno',
  'Round 1': 'Primo turno',
  'Round 2': 'Secondo turno',
  'Round 3': 'Terzo turno',
  'Round 4': 'Quarto turno',
  'Qualifying': 'Qualificazioni',
  'Qualification': 'Qualificazioni',
}

const PUNTI = { 0: '0', 1: '15', 2: '30', 3: '40', 4: 'AD' }

function traduciFase(roundInfo) {
  if (!roundInfo) return null
  const nome = roundInfo.name || roundInfo.nameCode || ''
  return FASI[nome] || nome || null
}

function formattaPunti(valore) {
  if (valore === null || valore === undefined) return '-'
  if (typeof valore === 'string') return valore
  return PUNTI[valore] ?? String(valore)
}

function bandiera(alpha2) {
  if (!alpha2) return null
  return `https://flagcdn.com/24x18/${alpha2.toLowerCase()}.png`
}

export default {
  name: 'VistaCercaTornei',
  components: { HelloWorld },

  data() {
    return {
      tornei: [],
      testoRicerca: '',
      caricamentoTornei: false,
      erroreTornei: null,
      torneoSelezionato: null,
      partiteTorneo: [],
      caricamentoPartiteTorneo: false,
      partitaSelezionata: null,
      intervalloAggiornamento: null,
    }
  },

  computed: {
    torneiFiltrati() {
      const testo = this.testoRicerca.trim().toLowerCase()
      if (!testo) return this.tornei
      return this.tornei.filter(t => t.nome.toLowerCase().includes(testo))
    }
  },

  methods: {
    formattaPunti(valore) {
      if (valore === null || valore === undefined) return '-'
      if (typeof valore === 'string') return valore
      const PUNTI = { 0: '0', 1: '15', 2: '30', 3: '40', 4: 'AD' }
      return PUNTI[valore] ?? String(valore)
    },

    formattaOrario(timestamp) {
      if (!timestamp) return ''
      return new Date(timestamp * 1000).toLocaleTimeString('it-IT', {
        hour: '2-digit', minute: '2-digit'
      })
    },

    dataOggi() {
      const d = new Date()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const gg = String(d.getDate()).padStart(2, '0')
      return `${d.getFullYear()}-${mm}-${gg}`
    },

    mappaSets(homeScore, awayScore) {
      const sets1 = []
      const sets2 = []
      for (let i = 1; i <= 5; i++) {
        const v1 = homeScore?.[`period${i}`]
        const v2 = awayScore?.[`period${i}`]
        if (v1 === undefined || v2 === undefined) break
        sets1.push({ valore: v1, vinto: v1 > v2 })
        sets2.push({ valore: v2, vinto: v2 > v1 })
      }
      return { sets1, sets2 }
    },

    mappaEvento(e) {
      const { sets1, sets2 } = this.mappaSets(e.homeScore, e.awayScore)

      const sets = []
      for (let i = 1; i <= 5; i++) {
        const g1 = e.homeScore?.[`period${i}`]
        const g2 = e.awayScore?.[`period${i}`]
        if (g1 === undefined || g2 === undefined) break
        sets.push({ g1, g2 })
      }

      const serving = e.homeScore?.serving ? 1 : e.awayScore?.serving ? 2 : null

      return {
        id: e.id,
        inizio: e.startTimestamp,
        stato: e.status?.description || 'Programmata',
        tipoStato: e.status?.type || 'scheduled',
        vincitore: e.winnerCode || null,
        giocatore1: e.homeTeam?.name || 'Giocatore 1',
        giocatore2: e.awayTeam?.name || 'Giocatore 2',
        bandiera1: bandiera(e.homeTeam?.country?.alpha2),
        bandiera2: bandiera(e.awayTeam?.country?.alpha2),
        punti1: formattaPunti(e.homeScore?.point),
        punti2: formattaPunti(e.awayScore?.point),
        serving,
        game1: e.homeScore?.current ?? null,
        game2: e.awayScore?.current ?? null,
        gameCorrente: e.homeScore?.current != null && e.awayScore?.current != null
          ? `${e.homeScore.current} - ${e.awayScore.current}`
          : '-',
        fase: traduciFase(e.roundInfo),
        nomeTorneo: e.tournament?.name || '',
        superficie: e.tournament?.groundType || null,
        sets,
        sets1,
        sets2,
        statistiche: {},
        inCaricamentoDettagli: false,
      }
    },

    async caricaTornei() {
      this.caricamentoTornei = true
      this.erroreTornei = null

      try {
        const risposta = await fetch(
          `https://api.sofascore.com/api/v1/sport/tennis/scheduled-events/${this.dataOggi()}`,
          { headers: HEADERS }
        )
        const dati = await risposta.json()
        const mappa = new Map()

        for (const e of dati.events || []) {
          const t = e.tournament
          if (!t) continue
          if (!mappa.has(t.id)) {
            mappa.set(t.id, { id: t.id, nome: t.name, categoria: t.category?.name || '', eventi: [] })
          }
          mappa.get(t.id).eventi.push(e)
        }

        this.tornei = Array.from(mappa.values())
        if (this.tornei.length === 0) this.erroreTornei = 'Nessun torneo in programma oggi.'
      } catch {
        this.erroreTornei = 'Errore nel caricamento dei tornei.'
      } finally {
        this.caricamentoTornei = false
      }
    },

    selezionaTorneo(torneo) {
      this.torneoSelezionato = torneo
      this.partitaSelezionata = null
      this.partiteTorneo = torneo.eventi.map(e => this.mappaEvento(e))

      // Aggiorna le partite live ogni 10 secondi finché il torneo è aperto
      if (this.intervalloAggiornamento) clearInterval(this.intervalloAggiornamento)
      this.intervalloAggiornamento = setInterval(() => this.aggiornaTorneoSelezionato(), 5000)
    },

    async aggiornaTorneoSelezionato() {
      if (!this.torneoSelezionato) return
      try {
        const risposta = await fetch(
          `https://api.sofascore.com/api/v1/sport/tennis/scheduled-events/${this.dataOggi()}`,
          { headers: HEADERS }
        )
        const dati = await risposta.json()
        const eventiTorneo = (dati.events || []).filter(e => e.tournament?.id === this.torneoSelezionato.id)

        const mappaEsistenti = new Map(this.partiteTorneo.map(p => [p.id, p]))
        const partiteMappate = eventiTorneo.map(e => {
          const nuova = this.mappaEvento(e)
          const esistente = mappaEsistenti.get(nuova.id)
          if (esistente?.statistiche && Object.keys(esistente.statistiche).length) {
            nuova.statistiche = esistente.statistiche
          }
          return nuova
        })

        // Fetch serving e punti per le partite live
        await Promise.allSettled(partiteMappate
          .filter(p => p.tipoStato === 'inprogress')
          .map(async p => {
            try {
              const res = await fetch(
                `https://api.sofascore.com/api/v1/event/${p.id}/details`,
                { headers: HEADERS }
              )
              const det = await res.json()
              if (det.event?.servingTeam != null) p.serving = det.event.servingTeam
              if (det.event?.homeScore?.point != null) {
                p.punti1 = this.formattaPunti(det.event.homeScore.point)
                p.punti2 = this.formattaPunti(det.event.awayScore.point)
              }
            } catch (err) { /* dettagli non disponibili */ }
          })
        )

        this.partiteTorneo = partiteMappate

        if (this.partitaSelezionata) {
          const aggiornata = this.partiteTorneo.find(p => p.id === this.partitaSelezionata.id)
          if (aggiornata) {
            this.partitaSelezionata = {
              ...aggiornata,
              statistiche: this.partitaSelezionata.statistiche,
              inCaricamentoDettagli: this.partitaSelezionata.inCaricamentoDettagli,
            }
          }
        }
      } catch (e) { /* aggiornamento silenzioso */ }
    },

    async selezionaPartita(partita) {
      if (this.partitaSelezionata?.id === partita.id) {
        this.partitaSelezionata = null
        return
      }

      this.partitaSelezionata = { ...partita, inCaricamentoDettagli: true }

      try {
        const risposta = await fetch(
          `https://api.sofascore.com/api/v1/event/${partita.id}/statistics`,
          { headers: HEADERS }
        )
        const dati = await risposta.json()
        const stats = {}

        const gruppi = dati.statistics?.[0]?.groups || []
        gruppi.forEach(g => {
          g.statisticsItems?.forEach(item => {
            if (item.name && item.homeValue != null) {
              stats[item.name] = `${item.homeValue} – ${item.awayValue}`
            }
          })
        })

        this.partitaSelezionata = {
          ...this.partitaSelezionata,
          statistiche: stats,
          inCaricamentoDettagli: false,
        }
      } catch {
        this.partitaSelezionata = {
          ...this.partitaSelezionata,
          statistiche: {},
          inCaricamentoDettagli: false,
        }
      }
    },
  },

  mounted() {
    this.caricaTornei()
  },

  beforeUnmount() {
    if (this.intervalloAggiornamento) clearInterval(this.intervalloAggiornamento)
  },
}