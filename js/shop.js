/* =========================================================
   Life RPG – Shop Page
   ========================================================= */
'use strict';

window.PageShop = {
  async render() {
    const section = document.getElementById('content-shop');
    if (!section) return;
    section.innerHTML = `<div class="page-loader"><div class="loader-ring"></div></div>`;

    try {
      const [items, owned, profile, user] = await Promise.all([
        DB.shop.list(),
        DB.shop.owned(),
        DB.profile.get().catch(() => null),
        DB.auth.getUser().catch(() => null),
      ]);

      const currentGold = profile?.gold ?? user?.gold ?? 0;
      const ownedList = owned || [];
      const ownedSet = new Set(ownedList.map(o => (typeof o === 'string' ? o : (o.item_id || o.id))));

      section.innerHTML = `
        <!-- Page Hero -->
        <div class="page-hero" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;margin-bottom:24px;">
          <div>
            <p class="greeting">MARKETPLACE</p>
            <h2 style="font-family:'Playfair Display',serif;font-size:32px;font-weight:700;">
              Deep Sea Shop <span style="color:var(--teal);font-weight:400">~</span>
            </h2>
            <p style="color:var(--text-secondary);font-size:13.5px;">Spend your hard-earned gold on exclusive items, badges, and titles.</p>
          </div>
          <div class="card card-sm" style="display:flex;align-items:center;gap:12px;padding:12px 20px;border-color:rgba(244,196,48,.25);">
            <div style="font-size:24px;">🪙</div>
            <div>
              <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;font-weight:600;letter-spacing:.5px;">Available Gold</div>
              <div id="shop-gold-display" style="font-size:22px;font-weight:700;color:var(--gold);font-family:var(--font-heading);">${currentGold} Gold</div>
            </div>
          </div>
        </div>

        <!-- Shop Items Grid -->
        <div class="shop-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(260px, 1fr));gap:20px;">
          ${(items || []).map(item => {
            const isOwned = ownedSet.has(item.id) || ownedSet.has(String(item.id));
            const typeLabel = item.type ? `<span style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;padding:3px 8px;border-radius:12px;background:rgba(0,212,200,.12);color:var(--teal-light);font-weight:600;">${item.type}</span>` : '';
            return `
              <div class="card shop-card" style="display:flex;flex-direction:column;justify-content:space-between;gap:16px;">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <div style="font-size:34px;">${item.icon || '🎁'}</div>
                    ${typeLabel}
                  </div>
                  <h3 style="font-size:18px;font-weight:700;margin-bottom:6px;color:var(--text-primary);font-family:var(--font-heading);">${item.name}</h3>
                  <p style="font-size:13px;color:var(--text-secondary);line-height:1.4;">${item.description || item.name}</p>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding-top:14px;border-top:1px solid var(--card-border);">
                  <div style="font-weight:700;color:var(--gold);font-size:16px;display:flex;align-items:center;gap:6px;">
                    <span>🪙</span> ${item.cost} <span style="font-size:12px;color:var(--text-muted);font-weight:400;">Gold</span>
                  </div>
                  <div id="shop-btn-wrap-${item.id}">
                    ${isOwned 
                      ? `<button class="btn btn-ghost btn-sm" disabled style="opacity:.6;cursor:default;"><i class="fa-solid fa-check"></i> Owned</button>`
                      : `<button class="btn btn-primary btn-sm" onclick="PageShop.buy('${item.id}', this)"><i class="fa-solid fa-bag-shopping"></i> Buy</button>`
                    }
                  </div>
                </div>
              </div>`;
          }).join('')}
        </div>
      `;
    } catch (err) {
      section.innerHTML = `
        <div class="card" style="text-align:center;padding:40px;">
          <div style="font-size:36px;margin-bottom:12px;">⚠️</div>
          <h3>Could not load shop</h3>
          <p style="color:var(--text-muted);font-size:13px;margin-top:6px;">${err.message || err}</p>
          <button class="btn btn-primary" onclick="PageShop.render()" style="margin-top:16px;">Retry</button>
        </div>`;
    }
  },

  async buy(itemId, btn) {
    const origHtml = btn ? btn.innerHTML : 'Buy';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Buying...`;
    }

    try {
      await DB.shop.purchase(itemId);
      App.toast('Item purchased successfully! ✨', 'success');

      // Update button to owned state
      const btnWrap = document.getElementById(`shop-btn-wrap-${itemId}`);
      if (btnWrap) {
        btnWrap.innerHTML = `<button class="btn btn-ghost btn-sm" disabled style="opacity:.6;cursor:default;"><i class="fa-solid fa-check"></i> Owned</button>`;
      }

      // Refresh page data & gold counter
      await this.render();
    } catch (err) {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origHtml;
      }
      App.toast(err.message || 'Purchase failed', 'error');
    }
  },
};
