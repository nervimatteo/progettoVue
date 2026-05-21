import HelloWorld from '@/components/HelloWorld.vue'

const HEADERS = { Accept: 'application/json' }

// Sofascore usa valori numerici per i punti del game
const PUNTI = { 0: '0', 1: '15', 2: '30', 3: '40', 4: 'AD' }

function formattaPunti(valore) {
  if (valore === null || valore === undefined) return '-'
  if (typeof valore === 'string') return valore
  return PUNTI[valore] ?? String(valore)
}

export default {
  name: 'HomeView',
  components: { HelloWorld },

  data() {
    return {
      elencoPartite: [],
      testoFiltroTorneo: '',
      inCaricamento: false,
      messaggioErrore: null,
      partitaSelezionata: null,
      intervalloAggiornamento: null,
    }
  },

  computed: {
    partiteFiltrate() {
      const filtro = this.testoFiltroTorneo.trim().toLowerCase()
      if (!filtro) return this.elencoPartite
      return this.elencoPartite.filter(p =>
        p.nomeTorneo.toLowerCase().includes(filtro)
      )
    }
  },

  methods: {
    formattaPunti(valore) {
      if (valore === null || valore === undefined) return '-'
      if (typeof valore === 'string') return valore
      const PUNTI = { 0: '0', 1: '15', 2: '30', 3: '40', 4: 'AD' }
      return PUNTI[valore] ?? String(valore)
    },

    dataOggi() {
      const d = new Date()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const gg = String(d.getDate()).padStart(2, '0')
      return `${d.getFullYear()}-${mm}-${gg}`
    },

    mappaEvento(e) {
      const sets = []
      for (let i = 1; i <= 5; i++) {
        const g1 = e.homeScore?.[`period${i}`]
        const g2 = e.awayScore?.[`period${i}`]
        if (g1 === undefined || g2 === undefined) break
        sets.push({ g1, g2 })
      }

      // serving: 1 = home, 2 = away
      // homeScore.point / awayScore.point contengono i punti del game corrente (0,1,2,3,4)
      const serving = e.lastPeriod === 'home' ? 1 : e.lastPeriod === 'away' ? 2 : (e.homeScore?.serving ? 1 : e.awayScore?.serving ? 2 : null)

      return {
        id: e.id,
        nomeTorneo: e.tournament?.name || 'Torneo',
        superficie: e.tournament?.groundType || null,
        stato: e.status?.description || 'In corso',
        tipoStato: e.status?.type || 'inprogress',
        giocatore1: e.homeTeam?.name || 'Giocatore 1',
        giocatore2: e.awayTeam?.name || 'Giocatore 2',
        bandiera1: e.homeTeam?.country?.alpha2
          ? `https://flagcdn.com/24x18/${e.homeTeam.country.alpha2.toLowerCase()}.png`
          : null,
        bandiera2: e.awayTeam?.country?.alpha2
          ? `https://flagcdn.com/24x18/${e.awayTeam.country.alpha2.toLowerCase()}.png`
          : null,
        punti1: formattaPunti(e.homeScore?.point),
        punti2: formattaPunti(e.awayScore?.point),
        serving,
        game1: e.homeScore?.current ?? null,
        game2: e.awayScore?.current ?? null,
        gameCorrente: e.homeScore?.current != null && e.awayScore?.current != null
          ? `${e.homeScore.current} - ${e.awayScore.current}`
          : '-',
        sets,
        statistiche: {},
        inCaricamentoDettagli: false,
      }
    },

    async caricaPartite() {
      this.inCaricamento = true
      this.messaggioErrore = null

      try {
        const oggi = this.dataOggi()
        const risposta = await fetch(
          `https://api.sofascore.com/api/v1/sport/tennis/scheduled-events/${oggi}`,
          { headers: HEADERS }
        )
        const dati = await risposta.json()
        const eventi = (dati.events || []).filter(e => e.status?.type === 'inprogress')

        const mappaEsistenti = new Map(this.elencoPartite.map(p => [p.id, p]))
        const partiteMappate = eventi.map(e => {
          const nuova = this.mappaEvento(e)
          const esistente = mappaEsistenti.get(nuova.id)
          if (esistente?.statistiche && Object.keys(esistente.statistiche).length) {
            nuova.statistiche = esistente.statistiche
          }
          return nuova
        })

        // Fetch dettagli live (serving + punti) per ogni partita in parallelo
        await Promise.allSettled(partiteMappate.map(async p => {
          try {
            const res = await fetch(
              `https://api.sofascore.com/api/v1/event/${p.id}/details`,
              { headers: HEADERS }
            )
            const det = await res.json()
            console.log('[serving debug]', p.id, JSON.stringify(det).slice(0, 400))
            if (det.event?.servingTeam != null) {
              p.serving = det.event.servingTeam
            }
            if (det.event?.homeScore?.point != null) {
              p.punti1 = this.formattaPunti(det.event.homeScore.point)
              p.punti2 = this.formattaPunti(det.event.awayScore.point)
            }
          } catch (e) { /* dettagli non disponibili */ }
        }))

        this.elencoPartite = partiteMappate

        if (this.partitaSelezionata) {
          const aggiornata = this.elencoPartite.find(p => p.id === this.partitaSelezionata.id)
          if (aggiornata) {
            this.partitaSelezionata = {
              ...aggiornata,
              statistiche: this.partitaSelezionata.statistiche,
              inCaricamentoDettagli: this.partitaSelezionata.inCaricamentoDettagli,
            }
          }
        }

        if (this.elencoPartite.length === 0) {
          this.messaggioErrore = 'Nessuna partita in diretta al momento.'
        } else {
          this.messaggioErrore = null
        }
      } catch {
        this.messaggioErrore = 'Errore nel caricamento delle partite.'
      } finally {
        this.inCaricamento = false
      }
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
    this.caricaPartite()
    this.intervalloAggiornamento = setInterval(this.caricaPartite, 10000)
  },

  beforeUnmount() {
    clearInterval(this.intervalloAggiornamento)
  },
}