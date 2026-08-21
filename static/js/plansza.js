(function(){
  const haslaData = JSON.parse(document.getElementById('dane-hasla').textContent);
  const rozdzialyData = JSON.parse(document.getElementById('dane-rozdzialy').textContent);
  const literyPkt = JSON.parse(document.getElementById('dane-litery').textContent);

  const STORAGE_KEY = 'alfabet_progress_v1';
  function loadRead(){
    try{ return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
    catch(e){ return new Set(); }
  }
  function saveRead(set){
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  }
  const readSet = loadRead();

  const rozdzialyById = {};
  rozdzialyData.forEach(r => rozdzialyById[r.id] = r);

  const haslaByRozdzial = {};
  haslaData.forEach(h => {
    haslaByRozdzial[h.rozdzial] = haslaByRozdzial[h.rozdzial] || [];
    haslaByRozdzial[h.rozdzial].push(h);
  });

  function rozdzialUkonczony(rid){
    const hasla = haslaByRozdzial[rid] || [];
    return hasla.length > 0 && hasla.every(h => readSet.has(h.id));
  }

  function odblokowanaLiczbaWProgu(r){
    const total = r.licznik_z.reduce((sum, zrodloId) => {
      const hasla = haslaByRozdzial[zrodloId] || [];
      return sum + hasla.filter(h => readSet.has(h.id)).length;
    }, 0);
    return Math.floor(total / r.prog_co);
  }

  function hasloDostepne(h){
    if(!h.istnieje) return false;
    const r = rozdzialyById[h.rozdzial];
    if(r.odblokowanie === 'zawsze') return true;
    if(r.typ === 'prog'){
      const odblokowaneLiczba = odblokowanaLiczbaWProgu(r);
      const hasla = haslaByRozdzial[h.rozdzial];
      const idx = hasla.findIndex(x => x.id === h.id);
      return idx < odblokowaneLiczba;
    }
    if(r.wymaga && r.wymaga.length){
      return r.wymaga.every(w => rozdzialUkonczony(w));
    }
    return false;
  }

  function stanLitery(litera){
    const hasla = haslaData.filter(h => h.litera === litera);
    if(hasla.length === 0) return 'locked';
    const readCount = hasla.filter(h => readSet.has(h.id)).length;
    if(readCount === hasla.length) return 'complete';
    if(hasla.some(h => hasloDostepne(h))) return 'unlocked';
    return 'locked';
  }

  const board = document.getElementById('plansza-board');
  const panel = document.getElementById('plansza-panel');
  const literyUnikalne = Object.keys(literyPkt).sort((a,b) => a.localeCompare(b, 'pl'));

  function render(){
    board.innerHTML = '';
    literyUnikalne.forEach(litera => {
      const stan = stanLitery(litera);
      const pkt = literyPkt[litera] || 0;
      const hasla = haslaData.filter(h => h.litera === litera);
      const div = document.createElement('div');
      div.className = 'plansza-tile ' + stan;
      div.innerHTML = `
        ${hasla.length > 1 ? `<span class="plansza-count">${hasla.filter(h=>readSet.has(h.id)).length}/${hasla.length}</span>` : ''}
        <span class="plansza-letter">${litera}</span>
        <span class="plansza-pts">${pkt}</span>
        ${stan==='locked' ? '<span class="plansza-lock">🔒</span>' : ''}
        ${stan==='complete' ? '<span class="plansza-check">✓</span>' : ''}
      `;
      div.addEventListener('click', () => openPanel(litera));
      board.appendChild(div);
    });
  }

  function openPanel(litera){
    const hasla = haslaData.filter(h => h.litera === litera);
    panel.innerHTML = `<h2>Litera ${litera}</h2>`;
    hasla.forEach(h => {
      const read = readSet.has(h.id);
      const dostepne = hasloDostepne(h);
      const rozdzial = rozdzialyById[h.rozdzial];
      const row = document.createElement('div');
      row.className = 'plansza-row ' + (read ? 'read' : (dostepne ? 'avail' : 'disabled'));
      const status = read ? '✓ przeczytane' : (dostepne ? (h.istnieje ? 'dostępne →' : 'wkrótce') : '🔒 ' + rozdzial.tytul);
      row.innerHTML = `<span class="plansza-name">${h.tytul}</span><span class="plansza-status">${status}</span>`;
      if(dostepne && h.istnieje){
        row.addEventListener('click', () => {
          readSet.add(h.id);
          saveRead(readSet);
          window.location.href = h.url;
        });
      }
      panel.appendChild(row);
    });
    panel.classList.add('show');
  }

  render();
})();
