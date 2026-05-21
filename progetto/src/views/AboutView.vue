<template>
  <div class="app">
    <header class="intestazione">
      <div class="logo">
        <span class="logo-pallina"></span>
        <span class="logo-testo">TennisLive</span>
      </div>
    </header>

    <div v-if="!torneoSelezionato">
      <div class="box-ricerca">
        <input
          v-model="testoRicerca"
          type="text"
          placeholder="Cerca un torneo (es. Roland Garros...)"
          class="input-ricerca"
        />
      </div>

      <div v-if="caricamentoTornei" class="msg-stato">Caricamento tornei...</div>
      <div v-if="erroreTornei" class="msg-stato errore">{{ erroreTornei }}</div>

      <p class="etichetta-sezione">{{ testoRicerca ? 'Risultati' : 'Tornei di oggi' }}</p>
      <div class="lista-tornei">
        <div
          v-for="torneo in torneiFiltrati"
          :key="torneo.id"
          class="scheda-torneo"
          @click="selezionaTorneo(torneo)"
        >
          <div class="torneo-info">
            <span class="torneo-nome">{{ torneo.nome }}</span>
            <span class="torneo-categoria">{{ torneo.categoria }}</span>
          </div>
          <span class="torneo-freccia">›</span>
        </div>
        <div v-if="!caricamentoTornei && torneiFiltrati.length === 0" class="msg-stato">
          Nessun torneo trovato.
        </div>
      </div>
    </div>

    <div v-if="torneoSelezionato">
      <button class="btn-indietro" @click="torneoSelezionato = null">← Tutti i tornei</button>
      <h2 class="titolo-torneo">{{ torneoSelezionato.nome }}</h2>
      <p class="etichetta-sezione">Partite di oggi</p>

      <div v-if="!caricamentoPartiteTorneo && partiteTorneo.length === 0" class="msg-stato">
        Nessuna partita oggi per questo torneo.
      </div>

      <div class="griglia-partite">
        <div
          v-for="partita in partiteTorneo"
          :key="partita.id"
          :class="['scheda-partita', { selezionata: partitaSelezionata && partitaSelezionata.id === partita.id }]"
          @click="selezionaPartita(partita)"
        >
          <div class="meta-partita">
            <div class="meta-sinistra">
              <span class="orario">{{ formattaOrario(partita.inizio) }}</span>
              <span v-if="partita.fase" class="fase-partita">{{ partita.fase }}</span>
            </div>
            <span :class="['stato-partita', partita.tipoStato]">{{ partita.stato }}</span>
          </div>

          <div class="giocatori">
            <div class="riga-giocatore">
              <span class="nome-giocatore" :class="{ vincitore: partita.vincitore === 1 }">
                <span class="pallino-servizio" :class="{ visibile: partita.tipoStato === 'inprogress' && partita.serving === 1 }">●</span>
                <img v-if="partita.bandiera1" :src="partita.bandiera1" class="bandiera-inline" />
                {{ partita.giocatore1 }}
                <span v-if="partita.vincitore === 1" class="check-vincitore">✓</span>
              </span>
              <div class="punteggi">
                <span v-for="(set, i) in partita.sets1" :key="'s1-' + i" :class="['punteggio-set', set.vinto ? 'vinto' : '']">{{ set.valore }}</span>
                <span v-if="partita.tipoStato === 'inprogress'" class="punteggio-game">{{ partita.punti1 ?? '-' }}</span>
              </div>
            </div>
            <div class="divisore"></div>
            <div class="riga-giocatore">
              <span class="nome-giocatore" :class="{ vincitore: partita.vincitore === 2 }">
                <span class="pallino-servizio" :class="{ visibile: partita.tipoStato === 'inprogress' && partita.serving === 2 }">●</span>
                <img v-if="partita.bandiera2" :src="partita.bandiera2" class="bandiera-inline" />
                {{ partita.giocatore2 }}
                <span v-if="partita.vincitore === 2" class="check-vincitore">✓</span>
              </span>
              <div class="punteggi">
                <span v-for="(set, i) in partita.sets2" :key="'s2-' + i" :class="['punteggio-set', set.vinto ? 'vinto' : '']">{{ set.valore }}</span>
                <span v-if="partita.tipoStato === 'inprogress'" class="punteggio-game">{{ partita.punti2 ?? '-' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <HelloWorld
      v-if="partitaSelezionata"
      :match="partitaSelezionata"
      @close="partitaSelezionata = null"
    />
  </div>
</template>

<script src="./AboutView.js"></script>
<style src="./AboutView.css"></style>