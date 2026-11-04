(() => {
  'use strict';

  const MAX_SELECTED = 4;
  const STALE_DAYS = 14;
  const ALL_CONDITIONS = ['new', 'renewed', 'refurbished'];
  const ALL_FITS = ['full', 'partial', 'cpu'];
  const ALL_LINUX = ['excellent', 'good', 'fair', 'experimental'];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const state = {
    q: '',
    pmin: 0,
    pmax: 4000,
    vram: 0,
    sort: 'value-desc',
    conditions: new Set(ALL_CONDITIONS),
    fits: new Set(ALL_FITS),
    linux: new Set(ALL_LINUX),
    selected: [],
  };

  let HARDWARE = null;
  let MODELS = null;
  const byId = new Map();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  async function init() {
    try {
      const [hardware, models] = await Promise.all([
        fetchJson('data/hardware.json'),
        fetchJson('data/models.json'),
      ]);
      HARDWARE = hardware;
      MODELS = models;
      HARDWARE.systems.forEach((system) => byId.set(system.id, system));
      readURL();
      bindEvents();
      renderSnapshot();
      renderSystems();
      renderComparison();
      renderRecommendations();
      syncURL();
    } catch (error) {
      showError(error);
    }
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`Could not load ${url} (HTTP ${response.status}).`);
    }
    return response.json();
  }

  function showError(error) {
    const box = $('#load-error');
    box.hidden = false;
    box.textContent = `Could not load the catalog. ${error.message} If you opened index.html directly, run a local server instead: python3 -m http.server 8000`;
    const snapshot = $('#snapshot');
    if (snapshot) snapshot.innerHTML = '<strong>Catalog unavailable</strong>';
  }

  function bindEvents() {
    const filters = $('#filters');

    filters.addEventListener('input', (event) => {
      if (event.target.matches('input[type="search"], input[type="number"]')) {
        updateFromForm();
      }
    });

    filters.addEventListener('change', (event) => {
      if (event.target.matches('select, input[type="checkbox"]')) {
        updateFromForm();
      }
    });

    $('#reset').addEventListener('click', () => {
      filters.reset();
      state.q = '';
      state.pmin = 0;
      state.pmax = 4000;
      state.vram = 0;
      state.sort = 'value-desc';
      state.conditions = new Set(ALL_CONDITIONS);
      state.fits = new Set(ALL_FITS);
      state.linux = new Set(ALL_LINUX);
      renderSystems();
      syncURL();
    });

    $('#systems-body').addEventListener('change', (event) => {
      const checkbox = event.target.closest('input[type="checkbox"][data-id]');
      if (!checkbox) return;
      toggleSelection(checkbox.dataset.id, checkbox.checked);
    });

    $('#compare-table').addEventListener('click', (event) => {
      const button = event.target.closest('button[data-remove]');
      if (!button) return;
      toggleSelection(button.dataset.remove, false);
    });

    $('#compare-btn').addEventListener('click', () => {
      if (state.selected.length < 2) return;
      $('#compare-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    $('#compare-clear').addEventListener('click', clearSelection);
    $('#tray-clear').addEventListener('click', clearSelection);

    const braveSearch = $('#websearch-brave');
    if (braveSearch) {
      braveSearch.addEventListener('click', () => {
        const q = ($('#websearch-q')?.value || '').trim();
        const query = q || 'cheap Linux PC for Qwen3-Coder-30B-A3B Q4 new excellent refurbished walmart amazon insurance';
        const url = `https://search.brave.com/search?q=${encodeURIComponent(query + ' price')}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      });
    }

    const braveAsk = $('#websearch-ask');
    if (braveAsk) {
      braveAsk.addEventListener('click', () => {
        const q = ($('#websearch-q')?.value || '').trim();
        const query = q || 'Find cheap Linux hardware for running Qwen3-Coder-30B-A3B at Q4_K_S, new or excellent refurbished from Walmart/Amazon with warranty/insurance options';
        const url = `https://search.brave.com/ask?q=${encodeURIComponent(query)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      });
    }

    const braveModels = $('#brave-models');
    if (braveModels) {
      braveModels.addEventListener('click', () => {
        const systems = state.selected.map((id) => byId.get(id)).filter(Boolean);
        const hw = systems.length
          ? systems.map((s) => `${s.name} (${s.ram_gb}GB RAM/${s.vram_gb ? s.vram_gb + 'GB VRAM' : 'CPU'}, ${s.fit})`).join('; ')
          : 'generic 16-64GB RAM Linux PC';
        const query = `Recommend best local coding models for programming on ${hw}. Focus on practical models for agentic coding, consider quantization (GGUF), context needs, and fit on this hardware. Prefer models like Qwen3-Coder family, DeepSeek Coder, etc.`;
        const url = `https://search.brave.com/ask?q=${encodeURIComponent(query)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        const res = $('#brave-models-result');
        if (res) {
          res.textContent = 'Opened Brave Ask in a new tab with hardware-specific recommendations.';
        }
      });
    }

    const metricSelect = $('#metric-select');
    if (metricSelect) {
      metricSelect.addEventListener('change', () => {
        renderComparison();
      });
    }
  }

  function updateFromForm() {
    readFilters();
    renderSystems();
    syncURL();
  }

  function readFilters() {
    state.q = $('#q').value.trim();
    state.pmin = Math.max(0, Number($('#pmin').value) || 0);
    const maxPrice = $('#pmax').value.trim();
    state.pmax = maxPrice === '' ? 4000 : Math.max(0, Number(maxPrice) || 0);
    state.vram = Number($('#vram').value) || 0;
    state.sort = $('#sort').value || 'value-desc';
    state.conditions = new Set($$('input[name="condition"]:checked').map((input) => input.value));
    state.fits = new Set($$('input[name="fit"]:checked').map((input) => input.value));
    state.linux = new Set($$('input[name="linux"]:checked').map((input) => input.value));
  }

  function readURL() {
    const params = new URLSearchParams(window.location.search);
    state.q = params.get('q') || '';
    state.pmin = params.has('pmin') ? Math.max(0, Number(params.get('pmin')) || 0) : 0;
    state.pmax = params.has('pmax') ? Math.max(0, Number(params.get('pmax')) || 0) : 4000;
    state.vram = Number(params.get('vram')) || 0;
    state.sort = SORTERS[params.get('sort')] ? params.get('sort') : 'value-desc';

    if (params.has('cond')) {
      state.conditions = new Set(params.get('cond').split(',').filter(Boolean));
    }
    if (params.has('fit')) {
      state.fits = new Set(params.get('fit').split(',').filter(Boolean));
    }
    if (params.has('linux')) {
      state.linux = new Set(params.get('linux').split(',').filter(Boolean));
    }

    state.selected = [...new Set((params.get('s') || '').split(',').filter((id) => byId.has(id)))].slice(
      0,
      MAX_SELECTED,
    );

    applyStateToForm();
  }

  function applyStateToForm() {
    $('#q').value = state.q;
    $('#pmin').value = String(state.pmin);
    $('#pmax').value = String(state.pmax);
    $('#vram').value = String(state.vram);
    $('#sort').value = state.sort;
    $$('input[name="condition"]').forEach((input) => {
      input.checked = state.conditions.has(input.value);
    });
    $$('input[name="fit"]').forEach((input) => {
      input.checked = state.fits.has(input.value);
    });
    $$('input[name="linux"]').forEach((input) => {
      input.checked = state.linux.has(input.value);
    });
  }

  function syncURL() {
    const params = new URLSearchParams();
    if (state.q) params.set('q', state.q);
    if (state.pmin !== 0) params.set('pmin', String(state.pmin));
    if (state.pmax !== 4000) params.set('pmax', String(state.pmax));
    if (state.vram !== 0) params.set('vram', String(state.vram));
    if (state.sort !== 'value-desc') params.set('sort', state.sort);
    if (state.conditions.size !== ALL_CONDITIONS.length) {
      params.set('cond', [...state.conditions].sort().join(','));
    }
    if (state.fits.size !== ALL_FITS.length) {
      params.set('fit', [...state.fits].sort().join(','));
    }
    if (state.linux.size !== ALL_LINUX.length) {
      params.set('linux', [...state.linux].sort().join(','));
    }
    if (state.selected.length) params.set('s', state.selected.join(','));

    const query = params.toString();
    history.replaceState(null, '', query ? `${window.location.pathname}?${query}` : window.location.pathname);
  }

  function renderSnapshot() {
    const snapshot = $('#snapshot');
    const checked = HARDWARE.checked_on;
    const stale = isStale(checked);
    snapshot.innerHTML = `
      <strong>Snapshot ${formatDate(checked)}</strong>
      <span class="muted">${HARDWARE.systems.length} systems · USD · Walmart / Amazon / Web</span>
      <span class="badge ${stale ? 'badge-stale' : 'badge-current'}">
        ${stale ? `Stale · ${daysOld(checked)} days old` : 'Current · 14-day window'}
      </span>
      <div class="sub">Weekly snapshots saved to repo · Verify prices with seller</div>
    `;
  }

  function getFilteredSystems() {
    const query = state.q.toLowerCase();
    return HARDWARE.systems.filter((system) => {
      if (query) {
        const haystack = [system.name, system.cpu, system.gpu, system.retailer, system.condition]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (system.price_usd < state.pmin || system.price_usd > state.pmax) return false;
      if (state.vram && (Number(system.vram_gb) || 0) < state.vram) return false;
      if (!state.conditions.has(system.condition)) return false;
      if (!state.fits.has(system.fit)) return false;
      if (!state.linux.has(system.linux_readiness)) return false;
      return true;
    });
  }

  function renderSystems() {
    const systems = getFilteredSystems().sort(SORTERS[state.sort] || SORTERS['value-desc']);
    const body = $('#systems-body');
    body.innerHTML = systems.map(systemRow).join('');
    $('#systems-table').hidden = systems.length === 0;
    $('#empty').hidden = systems.length > 0;
    updateFilterCount(systems.length);
    updateSelectionUI();
  }

  function updateFilterCount(showing = getFilteredSystems().length) {
    $('#filter-count').textContent =
      `Showing ${showing} of ${HARDWARE.systems.length} systems · ${state.selected.length} of ${MAX_SELECTED} selected`;
  }

  function systemRow(system) {
    const checked = state.selected.includes(system.id);
    const disabled = !checked && state.selected.length >= MAX_SELECTED;
    const stale = isStale(system.checked_on);
    const reply = formatSeconds(500 / system.est_decode_tps);
    const value = valueOf(system).toFixed(1);

    return `
      <tr data-id="${esc(system.id)}">
        <td class="check-col" data-label="Compare">
          <input
            class="select-box"
            type="checkbox"
            data-id="${esc(system.id)}"
            ${checked ? 'checked' : ''}
            ${disabled ? 'disabled' : ''}
            aria-label="Select ${esc(system.name)} for comparison"
          >
        </td>
        <td class="system-cell" data-label="System">
          <div class="sys-name">${esc(system.name)}</div>
          <div class="sub">
            ${esc(capitalize(system.condition))} · ${esc(system.retailer)}
            ${budgetBadge(system)}
            ${stale ? '<span class="badge badge-stale">Stale</span>' : ''}
          </div>
          <div class="sub">${esc(system.price_note || '')}</div>
        </td>
        <td class="num" data-label="Price">
          <strong>${formatPrice(system.price_usd)}</strong>
          <div class="sub">${formatDate(system.checked_on)}</div>
        </td>
        <td class="num" data-label="CPU">${esc(system.cpu)}</td>
        <td class="num" data-label="RAM">${system.ram_gb} GB</td>
        <td class="num" data-label="VRAM">${system.vram_gb ? `${system.vram_gb} GB` : '—'}</td>
        <td class="num" data-label="Est. t/s"><strong>${Math.round(system.est_decode_tps)}</strong></td>
        <td class="num" data-label="500-tok">${reply}</td>
        <td class="num" data-label="Value"><strong>${value}</strong></td>
        <td data-label="Fit">${fitLabel(system)}</td>
        <td data-label="Linux">${esc(capitalize(system.linux_readiness))}</td>
        <td data-label="Source">
          <a class="source-link" href="${esc(system.url)}" target="_blank" rel="noopener noreferrer">View</a>
        </td>
      </tr>
    `;
  }

  function updateSelectionUI() {
    $$('.select-box').forEach((checkbox) => {
      const checked = state.selected.includes(checkbox.dataset.id);
      checkbox.checked = checked;
      checkbox.disabled = !checked && state.selected.length >= MAX_SELECTED;
    });
    updateFilterCount();
    updateTray();
  }

  function updateTray() {
    const count = state.selected.length;
    const tray = $('#tray');
    tray.hidden = count === 0;
    document.body.classList.toggle('has-tray', count > 0);
    if (!count) return;

    const names = state.selected
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((system) => system.name);

    $('#tray-count').textContent = `${count} of ${MAX_SELECTED} selected`;
    $('#tray-names').textContent = names.join(' · ');

    const compareButton = $('#compare-btn');
    compareButton.disabled = count < 2;
    compareButton.textContent = count < 2 ? 'Select 2+ to compare' : `Compare ${count}`;
  }

  function toggleSelection(id, shouldSelect) {
    if (shouldSelect) {
      if (state.selected.includes(id)) return;
      if (state.selected.length >= MAX_SELECTED) {
        flashTray();
        updateSelectionUI();
        return;
      }
      state.selected.push(id);
    } else {
      state.selected = state.selected.filter((selectedId) => selectedId !== id);
    }

    updateSelectionUI();
    renderComparison();
    renderRecommendations();
    syncURL();
  }

  function clearSelection() {
    state.selected = [];
    updateSelectionUI();
    renderComparison();
    renderRecommendations();
    syncURL();
  }

  function flashTray() {
    const count = $('#tray-count');
    const previous = count.textContent;
    count.textContent = `Maximum ${MAX_SELECTED} systems — clear one first`;
    window.setTimeout(() => {
      count.textContent = previous;
    }, 1600);
  }

  function renderComparison() {
    const systems = state.selected.map((id) => byId.get(id)).filter(Boolean);
    const section = $('#compare-section');
    const table = $('#compare-table');
    const metricSel = $('#metric-select');

    if (systems.length < 2) {
      section.hidden = true;
      table.innerHTML = '';
      return;
    }

    section.hidden = false;
    const metric = metricSel ? metricSel.value : 'all';
    const prices = systems.map((system) => system.price_usd);
    const tps = systems.map((system) => system.est_decode_tps);
    const values = systems.map(valueOf);
    const prefills = systems.map((system) => system.est_prefill_tps);
    const replies = systems.map((system) => 500 / system.est_decode_tps);
    const turns = systems.map((system) => 2000 / system.est_decode_tps);
    const waits = systems.map((system) => 20000 / system.est_prefill_tps);

    let rows = [];
    if (metric === 'all' || metric === 'price') {
      rows.push(metricRow('Price', prices, formatPrice, { best: 'min', worst: 'max', align: 'num' }));
    }
    rows.push(textRow('Price checked', systems, (system) => formatDate(system.checked_on)));
    rows.push(textRow('Condition / retailer', systems, (system) => `${capitalize(system.condition)} · ${system.retailer}`));
    rows.push(textRow('CPU', systems, (system) => system.cpu));
    if (metric === 'all' || metric === 'memory') {
      rows.push(metricRow('System RAM', systems.map((system) => system.ram_gb), (value) => `${value} GB`, { best: 'max', worst: 'min', align: 'num' }));
      rows.push(metricRow('VRAM / UMA', systems.map((system) => system.vram_gb || 0), (value) => (value ? `${value} GB` : '—'), { best: 'max', worst: 'min', align: 'num' }));
    }
    rows.push(metricRow('Bandwidth', systems.map((system) => system.bandwidth_gbs), (value) => `${value} GB/s`, { best: 'max', worst: 'min', align: 'num' }));
    if (metric === 'all' || metric === 'decode') {
      rows.push(metricRow('Est. decode (tokens/s)', tps, (value) => `${Math.round(value)} t/s`, { best: 'max', worst: 'min', align: 'num' }));
    }
    if (metric === 'all' || metric === 'reply500') {
      rows.push(metricRow('500-token reply', replies, formatSeconds, { best: 'min', worst: 'max', align: 'num' }));
    }
    if (metric === 'all' || metric === 'turn2000') {
      rows.push(metricRow('2,000-token turn', turns, formatSeconds, { best: 'min', worst: 'max', align: 'num' }));
    }
    if (metric === 'all' || metric === 'prefill') {
      rows.push(metricRow('Est. prefill (tokens/s)', prefills, (value) => `${Math.round(value)} t/s`, { best: 'max', worst: 'min', align: 'num' }));
    }
    if (metric === 'all' || metric === 'ttft') {
      rows.push(metricRow('20k prompt wait (TTFT est.)', waits, formatSeconds, { best: 'min', worst: 'max', align: 'num' }));
    }
    if (metric === 'all' || metric === 'value') {
      rows.push(metricRow('Value (t/s per $1k)', values, (value) => value.toFixed(1), { best: 'max', worst: 'min', align: 'num' }));
    }
    if (metric === 'all' || metric === 'power') {
      rows.push(metricRow('Power (system)', systems.map((system) => system.power_w), (value) => `${value} W`, { best: 'min', worst: 'max', align: 'num' }));
    }
    if (metric === 'all' || metric === 'offload') {
      rows.push(textRow('Fit / Offload', systems, fitLabel));
    }
    rows.push(textRow('Warranty', systems, (system) => system.warranty));
    rows.push(textRow('Linux readiness', systems, (system) => capitalize(system.linux_readiness)));
    rows.push(textRow('Linux notes', systems, (system) => system.linux_notes));
    rows.push(textRow('Recommended quant', systems, (system) => system.recommended_quant));
    rows.push(textRow('Context', systems, (system) => `${system.context_k}k`));
    rows.push(textRow('Recommended model', systems, (system) => system.recommended_model));

    table.innerHTML = `
      <thead>
        <tr>
          <th scope="col">Metric</th>
          ${systems
            .map(
              (system) => `
                <th scope="col" class="compare-head">
                  <strong>${esc(system.name)}</strong>
                  <span class="sub">${formatPrice(system.price_usd)} · ${esc(capitalize(system.condition))}</span>
                  <button class="remove" type="button" data-remove="${esc(system.id)}" aria-label="Remove ${esc(system.name)}">
                    Remove
                  </button>
                </th>
              `,
            )
            .join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.join('')}
        <tr>
          <th scope="row">Source</th>
          ${systems
            .map(
              (system) => `
                <td>
                  <a class="source-link" href="${esc(system.url)}" target="_blank" rel="noopener noreferrer">Open listing</a>
                </td>
              `,
            )
            .join('')}
        </tr>
      </tbody>
    `;
  }

  function metricRow(label, values, formatter, options = {}) {
    const best =
      options.best === 'max' ? Math.max(...values) : options.best === 'min' ? Math.min(...values) : null;
    const worst =
      options.worst === 'max' ? Math.max(...values) : options.worst === 'min' ? Math.min(...values) : null;

    return `
      <tr>
        <th scope="row">${esc(label)}</th>
        ${values
          .map((value) => {
            const classes = [];
            if (options.align === 'num') classes.push('num');
            if (value === best) classes.push('best');
            if (value === worst && value !== best) classes.push('worst');
            return `<td class="${classes.join(' ')}">${formatter(value)}</td>`;
          })
          .join('')}
      </tr>
    `;
  }

  function textRow(label, systems, getValue) {
    return `
      <tr>
        <th scope="row">${esc(label)}</th>
        ${systems.map((system) => `<td>${esc(getValue(system))}</td>`).join('')}
      </tr>
    `;
  }

  function renderRecommendations() {
    const systems = state.selected.map((id) => byId.get(id)).filter(Boolean);
    const section = $('#recommend-section');

    if (!systems.length) {
      section.hidden = true;
      $('#recommend-grid').innerHTML = '';
      $('#overall-pick').innerHTML = '';
      return;
    }

    section.hidden = false;
    $('#overall-pick').innerHTML = overallPick(systems);
    $('#recommend-grid').innerHTML = systems.map(recommendationCard).join('');
  }

  function overallPick(systems) {
    if (systems.length === 1) {
      const system = systems[0];
      return `<strong>${esc(system.name)}</strong> is selected. Add a second system to compare speed per dollar and warranty.`;
    }

    const bestValue = [...systems].sort((a, b) => valueOf(b) - valueOf(a))[0];
    const fastest = [...systems].sort((a, b) => b.est_decode_tps - a.est_decode_tps)[0];
    const cheapest = [...systems].sort((a, b) => a.price_usd - b.price_usd)[0];

    return `
      <strong>Best speed per dollar:</strong> ${esc(bestValue.name)} — ${Math.round(bestValue.est_decode_tps)} t/s at ${formatPrice(bestValue.price_usd)} (value ${valueOf(bestValue).toFixed(1)}).
      <strong>Fastest:</strong> ${esc(fastest.name)} — ${Math.round(fastest.est_decode_tps)} t/s.
      <strong>Cheapest:</strong> ${esc(cheapest.name)} — ${formatPrice(cheapest.price_usd)}.
      Values use the listed base price; RAM and SSD upgrades are called out in the table.
    `;
  }

  function recommendationCard(system) {
    const model = system.recommended_model || MODELS.base_model;
    const quant = system.recommended_quant || MODELS.base_quant;
    const context = system.context_k || 32;
    const tps = Math.round(system.est_decode_tps);
    const reply = formatSeconds(500 / system.est_decode_tps);
    const turn = formatSeconds(2000 / system.est_decode_tps);
    const prefill = formatSeconds(20000 / system.est_prefill_tps);
    const memory =
      system.type === 'unified'
        ? `${system.ram_gb} GB UMA`
        : system.vram_gb
          ? `${system.vram_gb} GB VRAM`
          : `${system.ram_gb} GB RAM`;
    const alternatives = alternativesFor(system);
    const upgrade = upgradeNote(system);

    return `
      <article class="rec-card">
        <h3>${esc(system.name)}</h3>
        <div class="sub">${esc(capitalize(system.condition))} · ${esc(system.retailer)} · ${formatPrice(system.price_usd)}</div>
        <div class="rec-price">${formatPrice(system.price_usd)}</div>

        <div class="rec-model">
          <strong>${esc(model)}</strong>
          ${esc(quant)} · ${context}k context · ${fitLabel(system)}
        </div>

        <div class="rec-stats">
          <div class="rec-stat"><span>Decode</span><strong>${tps} t/s</strong></div>
          <div class="rec-stat"><span>Value</span><strong>${valueOf(system).toFixed(1)} / $1k</strong></div>
          <div class="rec-stat"><span>500-token reply</span><strong>${reply}</strong></div>
          <div class="rec-stat"><span>2,000-token turn</span><strong>${turn}</strong></div>
          <div class="rec-stat"><span>20k prefill</span><strong>${prefill}</strong></div>
          <div class="rec-stat"><span>Memory</span><strong>${memory}</strong></div>
        </div>

        <p class="rec-note">${fitNote(system)}${upgrade ? ` ${upgrade}` : ''}</p>

        ${
          alternatives.length
            ? `
              <p class="alt-title">Also fits this machine</p>
              <ul class="alt-list">
                ${alternatives
                  .map(
                    (alternative) => `
                      <li>
                        <strong>${esc(alternative.name)}</strong>
                        ${esc(alternative.quant)} · ${alternative.size_gb} GB · ${alternative.est_decode_tps_low}–${alternative.est_decode_tps_high} t/s
                        <span class="muted">${esc(alternative.note || '')}</span>
                      </li>
                    `,
                  )
                  .join('')}
              </ul>
              <p class="rec-note">Alternative speed ranges are model-level; actual speed depends on this machine.</p>
            `
            : '<p class="rec-note">No larger alternative fits this memory tier.</p>'
        }

        <a class="source-link" href="${esc(system.url)}" target="_blank" rel="noopener noreferrer">Check current price</a>
      </article>
    `;
  }

  function alternativesFor(system) {
    const memory = system.type === 'cpu' ? system.ram_gb : system.vram_gb;
    const priority = ['qwen3-coder-next-80b-a3b', 'qwen3.6-35b-a3b'];
    let fits = (MODELS.alternatives || []).filter((alternative) => memory >= alternative.min_memory_gb);

    if (system.type === 'cpu') {
      fits = fits.filter((alternative) => alternative.min_memory_gb <= 16);
    }

    return fits
      .sort((a, b) => {
        const aPriority = priority.indexOf(a.id);
        const bPriority = priority.indexOf(b.id);
        if (aPriority !== -1 || bPriority !== -1) {
          return (aPriority === -1 ? 99 : aPriority) - (bPriority === -1 ? 99 : bPriority);
        }
        return b.size_gb - a.size_gb || a.name.localeCompare(b.name);
      })
      .slice(0, 3);
  }

  function upgradeNote(system) {
    if (system.type === 'discrete' && system.vram_gb >= 22.5 && system.recommended_quant === 'Q4_K_S') {
      return 'Headroom: Q4_K_M also fits at 24 GB if you keep context at 32k.';
    }
    return '';
  }

  function fitLabel(system) {
    if (system.fit === 'full') return system.type === 'unified' ? 'Full UMA' : 'Full GPU';
    if (system.fit === 'partial') return 'Partial offload';
    return 'CPU only';
  }

  function fitNote(system) {
    if (system.fit === 'full') {
      return system.type === 'unified'
        ? 'Full unified memory; leave 6–8 GB for the OS and apps.'
        : 'Full GPU fit; no offload.';
    }
    if (system.fit === 'partial') {
      return 'Partial offload; some expert tensors spill to system RAM. Keep attention and KV on the GPU.';
    }
    return 'CPU only. Decode is tolerable, but prefill makes interactive agent loops painful.';
  }

  function budgetBadge(system) {
    if (system.price_usd < HARDWARE.budget_usd.min) {
      return '<span class="badge badge-entry">Entry level</span>';
    }
    if (system.price_usd > HARDWARE.budget_usd.max) {
      return '<span class="badge badge-reference">Reference</span>';
    }
    return '<span class="badge badge-budget">In budget</span>';
  }

  function valueOf(system) {
    return system.est_decode_tps / (system.price_usd / 1000);
  }

  function formatPrice(amount) {
    return `$${Number(amount).toLocaleString('en-US')}`;
  }

  function formatSeconds(seconds) {
    if (!Number.isFinite(seconds)) return '—';
    if (seconds < 1) return '<1 s';
    if (seconds < 60) return `${Math.round(seconds)} s`;
    let minutes = Math.floor(seconds / 60);
    let remainder = Math.round(seconds % 60);
    if (remainder === 60) {
      minutes += 1;
      remainder = 0;
    }
    return `${minutes}m ${remainder}s`;
  }

  function parseDate(isoDate) {
    const [year, month, day] = String(isoDate).split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  function formatDate(isoDate) {
    return parseDate(isoDate).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }

  function daysOld(isoDate) {
    const now = new Date();
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return Math.floor((today - parseDate(isoDate).getTime()) / 86400000);
  }

  function isStale(isoDate) {
    return daysOld(isoDate) > STALE_DAYS;
  }

  function capitalize(value) {
    const text = String(value || '');
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => {
      const entities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };
      return entities[character];
    });
  }

  const SORTERS = {
    'value-desc': (a, b) => valueOf(b) - valueOf(a),
    'price-asc': (a, b) => a.price_usd - b.price_usd,
    'price-desc': (a, b) => b.price_usd - a.price_usd,
    'tps-desc': (a, b) => b.est_decode_tps - a.est_decode_tps,
    'vram-desc': (a, b) => (Number(b.vram_gb) || 0) - (Number(a.vram_gb) || 0),
    'ram-desc': (a, b) => (Number(b.ram_gb) || 0) - (Number(a.ram_gb) || 0),
    'name-asc': (a, b) => a.name.localeCompare(b.name),
  };
})();
