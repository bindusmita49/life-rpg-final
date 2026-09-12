/* =========================================================
   Life RPG – Insights Page (Chart.js)
   ========================================================= */
'use strict';

window.PageInsights = {
  charts: {},

  async render() {
    const section = document.getElementById('content-insights');
    section.innerHTML = `
      <div class="page-hero" style="margin-bottom:24px;">
        <p class="greeting">INSIGHTS</p>
        <h2 style="font-family:'Playfair Display',serif;font-size:32px;font-weight:700;">
          Your Progress Story <span style="color:var(--teal);font-weight:400">~</span>
        </h2>
        <p style="color:var(--text-secondary);font-size:13.5px;">Data-driven insights to help you grow faster.</p>
      </div>

      <!-- Summary Stats -->
      <div class="insight-stat-row" style="margin-bottom:20px;">
        <div class="insight-stat"><div class="val" id="ins-total-days">-</div><div class="lbl">Active Days</div></div>
        <div class="insight-stat"><div class="val" id="ins-avg-rate">-</div><div class="lbl">Avg Completion</div></div>
        <div class="insight-stat"><div class="val" id="ins-best-streak">-</div><div class="lbl">Best Streak</div></div>
        <div class="insight-stat"><div class="val" id="ins-total-stars">-</div><div class="lbl">Total Stars</div></div>
        <div class="insight-stat"><div class="val" id="ins-habits">-</div><div class="lbl">Total Habits</div></div>
      </div>

      <!-- Charts grid -->
      <div class="insights-grid">
        <!-- Weekly completion chart -->
        <div class="insight-card wide">
          <h4>Weekly Completion Rate</h4>
          <div class="insight-sub">Last 12 weeks — percentage of habits completed each week</div>
          <div class="chart-wrap" style="height:220px">
            <canvas id="chart-weekly"></canvas>
          </div>
        </div>

        <!-- Daily completion (last 30d) -->
        <div class="insight-card">
          <h4>Daily Completions (Last 30 Days)</h4>
          <div class="insight-sub">How many habits you completed each day</div>
          <div class="chart-wrap" style="height:190px">
            <canvas id="chart-daily"></canvas>
          </div>
        </div>

        <!-- Habit breakdown donut -->
        <div class="insight-card">
          <h4>Habit Completion Breakdown</h4>
          <div class="insight-sub">Overall completion share per habit</div>
          <div class="chart-wrap" style="height:190px">
            <canvas id="chart-donut"></canvas>
          </div>
        </div>

        <!-- Best habits leaderboard -->
        <div class="insight-card">
          <h4>🏆 Top Habits by Streak</h4>
          <div class="insight-sub">Your most consistent habits</div>
          <div id="habit-leaderboard"></div>
        </div>

        <!-- Streak history chart -->
        <div class="insight-card">
          <h4>Streak History</h4>
          <div class="insight-sub">Rolling 30-day habit activity</div>
          <div class="chart-wrap" style="height:190px">
            <canvas id="chart-streak"></canvas>
          </div>
        </div>
      </div>
    `;

    await this.loadData();
  },

  async loadData() {
    const habits  = await DB.habits.getAll();
    const allLogs = JSON.parse(localStorage.getItem('hf_logs') || '[]');
    const today   = new Date();

    // Summary stats
    const uniqueDays  = [...new Set(allLogs.map(l => l.date))].length;
    const totalStars  = allLogs.length;
    const avgRate     = habits.length && uniqueDays
      ? Math.round(allLogs.length / (habits.length * Math.max(uniqueDays,1)) * 100) : 0;

    let bestStreak = 0;
    habits.forEach(h => {
      const s = DB.stats.getLongestStreak(allLogs, h.id);
      if (s > bestStreak) bestStreak = s;
    });

    document.getElementById('ins-total-days').textContent  = uniqueDays;
    document.getElementById('ins-avg-rate').textContent    = avgRate + '%';
    document.getElementById('ins-best-streak').textContent = bestStreak + 'd';
    document.getElementById('ins-total-stars').textContent = totalStars;
    document.getElementById('ins-habits').textContent      = habits.length;

    // Build daily data (last 30 days)
    const days = [], dailyCounts = [], labels = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      days.push(ds);
      dailyCounts.push(allLogs.filter(l => l.date === ds).length);
      labels.push(i === 0 ? 'Today' : i === 1 ? 'Yday' : d.getDate() + '/' + (d.getMonth()+1));
    }

    // Weekly data (last 12 weeks)
    const weekLabels = [], weekRates = [];
    for (let w = 11; w >= 0; w--) {
      const wStart = new Date(today);
      wStart.setDate(today.getDate() - w * 7 - 6);
      const wEnd = new Date(today);
      wEnd.setDate(today.getDate() - w * 7);
      const wDays = [];
      for (let d2 = new Date(wStart); d2 <= wEnd; d2.setDate(d2.getDate()+1)) {
        wDays.push(d2.toISOString().split('T')[0]);
      }
      const possible = wDays.length * (habits.length || 1);
      const done = allLogs.filter(l => wDays.includes(l.date)).length;
      weekRates.push(possible ? Math.round((done/possible)*100) : 0);
      weekLabels.push('W' + (12 - w));
    }

    // Leaderboard
    const ranked = habits.map(h => ({
      ...h,
      streak: DB.stats.getStreak(allLogs, h.id),
      longest: DB.stats.getLongestStreak(allLogs, h.id),
      rate: DB.stats.getCompletionRate(allLogs, h.id, 30),
    })).sort((a,b) => b.streak - a.streak);

    const lb = document.getElementById('habit-leaderboard');
    if (lb) {
      lb.innerHTML = ranked.slice(0,6).map((h,i) => `
        <div class="habit-rank">
          <div class="rank-num ${i===0?'gold-rank':''}">${i+1}</div>
          <div style="font-size:20px">${h.icon}</div>
          <div class="rank-info">
            <strong>${h.name}</strong>
            <span>${h.rate}% in 30d · Best: ${h.longest}d</span>
          </div>
          <div class="rank-streak">🔥 ${h.streak}d</div>
        </div>`).join('') || '<p style="color:var(--text-muted);font-size:13px">No habits yet</p>';
    }

    // Habit donut data
    const habitCounts = habits.map(h => allLogs.filter(l => l.habitId === h.id).length);

    // Streak activity last 30d
    const streakData = dailyCounts.map((c,i) => Math.min(c, habits.length || 1));

    this.drawCharts({ labels, dailyCounts, weekLabels, weekRates, habits, habitCounts, streakData });
  },

  drawCharts({ labels, dailyCounts, weekLabels, weekRates, habits, habitCounts, streakData }) {
    if (typeof Chart === 'undefined') return;

    const defaults = {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: 'rgba(255,255,255,.6)', font: { size: 11 } } } },
    };

    const gridColor = 'rgba(255,255,255,.06)';
    const tickColor = 'rgba(255,255,255,.45)';

    const axes = {
      x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } }, border: { color: 'transparent' } },
      y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } }, border: { color: 'transparent' } },
    };

    // Destroy old charts
    Object.values(this.charts).forEach(c => c?.destroy?.());
    this.charts = {};

    // Weekly line chart
    const cw = document.getElementById('chart-weekly');
    if (cw) {
      this.charts.weekly = new Chart(cw.getContext('2d'), {
        type: 'line',
        data: {
          labels: weekLabels,
          datasets: [{
            label: 'Completion %', data: weekRates,
            borderColor: '#00d4c8', backgroundColor: 'rgba(0,212,200,.1)',
            tension: .4, fill: true, pointBackgroundColor: '#00d4c8',
            pointRadius: 4, pointHoverRadius: 7,
          }],
        },
        options: { ...defaults, scales: { ...axes, y: { ...axes.y, min: 0, max: 100 } } },
      });
    }

    // Daily bar chart
    const cd = document.getElementById('chart-daily');
    if (cd) {
      this.charts.daily = new Chart(cd.getContext('2d'), {
        type: 'bar',
        data: {
          labels: labels.filter((_,i) => i % 3 === 0).map((l,i) => labels[i*3]),
          datasets: [{
            label: 'Habits done',
            data: dailyCounts.filter((_,i) => i % 3 === 0),
            backgroundColor: (ctx) => {
              const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 200);
              g.addColorStop(0, 'rgba(0,212,200,.8)');
              g.addColorStop(1, 'rgba(0,143,135,.2)');
              return g;
            },
            borderRadius: 5, borderSkipped: false,
          }],
        },
        options: { ...defaults, scales: axes, plugins: { ...defaults.plugins, legend: { display: false } } },
      });
    }

    // Donut
    const donut = document.getElementById('chart-donut');
    if (donut && habits.length) {
      const colors = ['#00d4c8','#f4c430','#7c3aed','#dc2626','#16a34a','#1d4ed8','#be185d','#d97706'];
      this.charts.donut = new Chart(donut.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: habits.map(h => h.icon + ' ' + h.name),
          datasets: [{
            data: habitCounts,
            backgroundColor: habits.map((_,i) => colors[i % colors.length] + 'cc'),
            borderColor: habits.map((_,i) => colors[i % colors.length]),
            borderWidth: 2,
            hoverOffset: 8,
          }],
        },
        options: {
          ...defaults, cutout: '60%',
          plugins: {
            legend: { position: 'right', labels: { color: 'rgba(255,255,255,.6)', font: { size: 10 }, boxWidth: 10, padding: 8 } },
          },
        },
      });
    }

    // Streak activity
    const cs = document.getElementById('chart-streak');
    if (cs) {
      this.charts.streak = new Chart(cs.getContext('2d'), {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Activity', data: streakData,
            borderColor: '#f4c430', backgroundColor: 'rgba(244,196,48,.08)',
            tension: .3, fill: true, pointRadius: 0, pointHoverRadius: 5,
            pointHoverBackgroundColor: '#f4c430',
          }],
        },
        options: {
          ...defaults, scales: { ...axes, y: { ...axes.y, min: 0 } },
          plugins: { ...defaults.plugins, legend: { display: false } },
        },
      });
    }
  },
};
