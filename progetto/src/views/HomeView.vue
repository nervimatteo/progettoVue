<template>
  <div class="app">
    <header class="intestazione">
      <div class="logo">
        <span class="logo-pallina"></span>
        <span class="logo-testo">TennisLive</span>
      </div>
      <div class="badge-live">
        <span class="punto-live"></span>
        <span class="testo-live">{{ elencoPartite.length }} partite in diretta</span>
      </div>
    </header>

    <div class="filtro-ricerca">
      <input
        v-model="testoFiltroTorneo"
        type="text"
        placeholder="Filtra per torneo (es. Roland Garros...)"
        class="input-filtro"
      />
    </div>

    <div v-if="inCaricamento" class="msg-stato">Caricamento partite...</div>
    <div v-if="messaggioErrore" class="msg-stato errore">{{ messaggioErrore }}</div>

    <p class="etichetta-sezione">Partite in diretta</p>

    <div class="griglia-partite">
      <div
        v-for="partita in partiteFiltrate"
        :key="partita.id"
        :class="['scheda-partita', { selezionata: partitaSelezionata && partitaSelezionata.id === partita.id }]"
        @click="selezionaPartita(partita)"
      >
        <div class="meta-partita">
          <span class="torneo">{{ partita.nomeTorneo }}</span>
          <span class="stato-partita live">{{ partita.stato }}</span>
        </div>

        <div class="giocatori">
          <div class="riga-giocatore">
            <span class="nome-giocatore">
              <span class="pallino-servizio" :class="{ visibile: partita.serving === 1 }">●</span>
              <img v-if="partita.bandiera1" :src="partita.bandiera1" class="bandiera-inline" />
              {{ partita.giocatore1 }}
            </span>
            <div class="punteggi">
              <span
                v-for="(set, i) in partita.sets"
                :key="'g1-' + i"
                :class="['punteggio-set', parseInt(set.g1) > parseInt(set.g2) ? 'vinto' : '']"
              >{{ set.g1 }}</span>
              <span class="punteggio-game">{{ partita.punti1 ?? '-' }}</span>
            </div>
          </div>

          <div class="divisore"></div>

          <div class="riga-giocatore">
            <span class="nome-giocatore">
              <span class="pallino-servizio" :class="{ visibile: partita.serving === 2 }">●</span>
              <img v-if="partita.bandiera2" :src="partita.bandiera2" class="bandiera-inline" />
              {{ partita.giocatore2 }}
            </span>
            <div class="punteggi">
              <span
                v-for="(set, i) in partita.sets"
                :key="'g2-' + i"
                :class="['punteggio-set', parseInt(set.g2) > parseInt(set.g1) ? 'vinto' : '']"
              >{{ set.g2 }}</span>
              <span class="punteggio-game">{{ partita.punti2 ?? '-' }}</span>
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

<script src="./HomeView.js"></script>
<style src="./HomeView.css"></style>