<template>
  <div v-if="match">
    <div class="overlay-pannello" @click="$emit('close')"></div>

    <div class="pannello-dettaglio">

      <div class="intestazione-dettaglio">
        <span class="titolo-dettaglio">
          <img v-if="match.bandiera1" :src="match.bandiera1" class="bandiera" />
          {{ match.giocatore1 }}
          <span style="color:#999; font-weight:400"> vs </span>
          {{ match.giocatore2 }}
          <img v-if="match.bandiera2" :src="match.bandiera2" class="bandiera" />
        </span>
        <button class="btn-chiudi" @click="$emit('close')">✕</button>
      </div>

      <div class="contenuto-pannello">

        <div v-if="match.inCaricamentoDettagli" class="msg-caricamento">
          Caricamento dettagli...
        </div>

        <div class="info-partita">
          <div class="info-riga">
            <span class="etichetta">Torneo</span>
            <span class="valore">{{ match.nomeTorneo || 'N/D' }}</span>
          </div>
          <div class="info-riga">
            <span class="etichetta">Superficie</span>
            <span class="valore">{{ match.superficie || 'N/D' }}</span>
          </div>
          <div class="info-riga">
            <span class="etichetta">Stato</span>
            <span class="valore">{{ match.stato || 'N/D' }}</span>
          </div>
          <div class="info-riga">
            <span class="etichetta">Game</span>
            <span class="valore">{{ match.gameCorrente || '-' }}</span>
          </div>
        </div>

        <div class="tabella-set" v-if="match.sets && match.sets.length">
          <table>
            <thead>
              <tr>
                <th>Giocatore</th>
                <th v-for="(s, i) in match.sets" :key="i">Set {{ i + 1 }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ match.giocatore1 }}</td>
                <td
                  v-for="(s, i) in match.sets"
                  :key="'a' + i"
                  :class="{ evidenziato: parseInt(s.g1) > parseInt(s.g2) }"
                >{{ s.g1 }}</td>
              </tr>
              <tr>
                <td>{{ match.giocatore2 }}</td>
                <td
                  v-for="(s, i) in match.sets"
                  :key="'b' + i"
                  :class="{ evidenziato: parseInt(s.g2) > parseInt(s.g1) }"
                >{{ s.g2 }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="statistiche" v-if="!match.inCaricamentoDettagli">
          <p class="titolo-statistiche">Statistiche</p>
          <div v-if="match.statistiche && Object.keys(match.statistiche).length">
            <div
              class="stat-riga"
              v-for="(valore, nome) in match.statistiche"
              :key="nome"
            >
              <span class="stat-nome">{{ nome }}</span>
              <span class="stat-val">{{ valore }}</span>
            </div>
          </div>
          <p v-else class="nessuna-statistica">Nessuna statistica disponibile</p>
        </div>

      </div>
    </div>
  </div>
</template>

<script src="./HelloWorld.js"></script>
<style src="./HelloWorld.css"></style>