// ===== STATE =====
let currentUser = null;
let currentFilter = 'all';
let currentOrderId = null;

const $ = id => document.getElementById(id);

// ===== AUTH =====
$('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const btn = $('loginBtn');
  const errEl = $('loginError');
  errEl.style.display = 'none';
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Вход...';

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: $('username').value,
        password: $('password').value
      })
    });
    const data = await res.json();
    if (data.success) {
      currentUser = data.user;
      $('adminUsername').textContent = currentUser.username;
      $('loginScreen').style.display = 'none';
      $('adminPanel').style.display = 'flex';
      loadStats();
      loadOrders();
    } else {
      errEl.style.display = 'flex';
    }
  } catch {
    errEl.style.display = 'flex';
  }

  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Войти';
});

$('logoutBtn').addEventListener('click', () => {
  currentUser = null;
  $('adminPanel').style.display = 'none';
  $('loginScreen').style.display = 'flex';
  $('password').value = '';
});

// ===== SIDEBAR TOGGLE (mobile) =====
$('burgerAdmin').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('show');
});
$('sidebarOverlay').addEventListener('click', closeSidebar);

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('show');
}

// ===== TABS =====
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    const tab = this.dataset.tab;
    $('pageTitle').textContent = tab === 'orders' ? 'Заявки' : 'Клиенты';

    $('tabOrders').style.display = tab === 'orders' ? 'block' : 'none';
    $('tabCustomers').style.display = tab === 'customers' ? 'block' : 'none';

    if (tab === 'orders') loadOrders();
    if (tab === 'customers') loadCustomers();
    closeSidebar();
  });
});

// ===== REFRESH =====
$('refreshBtn').addEventListener('click', () => {
  const activeTab = document.querySelector('.nav-item.active')?.dataset.tab;
  loadStats();
  if (activeTab === 'orders') loadOrders();
  if (activeTab === 'customers') loadCustomers();
  // Spin icon
  const icon = $('refreshBtn').querySelector('i');
  icon.style.transition = 'transform 0.6s';
  icon.style.transform = 'rotate(360deg)';
  setTimeout(() => { icon.style.transition = ''; icon.style.transform = ''; }, 700);
});

// ===== FILTERS =====
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    currentFilter = this.dataset.status;
    loadOrders();
  });
});

// ===== STATS =====
async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    $('statTotal').textContent = data.total_orders;
    $('statNew').textContent = data.new_orders;
    $('statCustomers').textContent = data.total_customers;
    $('statProcessing').textContent = data.processing || 0;

    // Badge
    const badge = $('navBadge');
    if (data.new_orders > 0) {
      badge.textContent = data.new_orders;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  } catch (e) {
    console.error('Stats error:', e);
  }
}

// ===== ORDERS =====
async function loadOrders() {
  const tbody = $('ordersBody');
  tbody.innerHTML = '<tr><td colspan="8" class="loading-row"><i class="fas fa-spinner fa-spin"></i> Загрузка...</td></tr>';
  $('ordersEmpty').style.display = 'none';

  try {
    const url = currentFilter === 'all' ? '/api/orders' : `/api/orders?status=${currentFilter}`;
    const res = await fetch(url);
    const orders = await res.json();

    if (!orders.length) {
      tbody.innerHTML = '';
      $('ordersEmpty').style.display = 'block';
      return;
    }

    tbody.innerHTML = orders.map(o => `
      <tr>
        <td><span style="font-family:monospace;font-size:0.8rem;color:var(--muted)">${o.id}</span></td>
        <td style="font-weight:600">${escHtml(o.customer_name)}</td>
        <td>
          <a href="tel:${cleanPhone(o.customer_phone)}" class="tbl-phone-link">
            <i class="fas fa-phone-alt"></i>${escHtml(o.customer_phone)}
          </a>
        </td>
        <td>
          <a href="mailto:${escHtml(o.customer_email)}" class="tbl-email-link">
            <i class="fas fa-envelope"></i>${escHtml(o.customer_email)}
          </a>
        </td>
        <td>${escHtml(o.service || '—')}</td>
        <td>${statusBadge(o.status)}</td>
        <td style="color:var(--muted);font-size:0.82rem;white-space:nowrap">${formatDate(o.created_at)}</td>
        <td>
          <div class="tbl-actions">
            <button class="tbl-btn" title="Подробнее" onclick="openOrderModal(${JSON.stringify(o).replace(/"/g, '&quot;')})">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="8" class="loading-row" style="color:var(--red)">Ошибка загрузки заявок</td></tr>';
  }
}

// ===== CUSTOMERS =====
async function loadCustomers() {
  const tbody = $('customersBody');
  tbody.innerHTML = '<tr><td colspan="8" class="loading-row"><i class="fas fa-spinner fa-spin"></i> Загрузка...</td></tr>';
  $('customersEmpty').style.display = 'none';

  try {
    const res = await fetch('/api/customers');
    const customers = await res.json();

    if (!customers.length) {
      tbody.innerHTML = '';
      $('customersEmpty').style.display = 'block';
      return;
    }

    tbody.innerHTML = customers.map((c, i) => `
      <tr>
        <td style="color:var(--muted)">${i + 1}</td>
        <td style="font-weight:600">${escHtml(c.name)}</td>
        <td>
          <a href="tel:${cleanPhone(c.phone)}" class="tbl-phone-link">
            <i class="fas fa-phone-alt"></i>${escHtml(c.phone)}
          </a>
        </td>
        <td>
          <a href="mailto:${escHtml(c.email)}" class="tbl-email-link">
            <i class="fas fa-envelope"></i>${escHtml(c.email)}
          </a>
        </td>
        <td style="text-align:center">
          <span style="background:rgba(255,87,34,0.15);color:var(--accent);padding:3px 10px;border-radius:20px;font-weight:700;font-size:0.85rem">
            ${c.orders_count}
          </span>
        </td>
        <td style="color:var(--muted);font-size:0.82rem">${c.first_order ? formatDate(c.first_order) : '—'}</td>
        <td style="color:var(--muted);font-size:0.82rem">${c.last_order ? formatDate(c.last_order) : '—'}</td>
        <td>
          <div class="tbl-actions">
            <a href="tel:${cleanPhone(c.phone)}" class="tbl-btn" title="Позвонить" style="color:var(--green)">
              <i class="fas fa-phone"></i>
            </a>
            <a href="mailto:${escHtml(c.email)}" class="tbl-btn" title="Email" style="color:var(--blue)">
              <i class="fas fa-envelope"></i>
            </a>
            <a href="https://wa.me/${cleanPhone(c.phone).replace(/\D/g,'')}" class="tbl-btn" title="WhatsApp" target="_blank" style="color:#25d366">
              <i class="fab fa-whatsapp"></i>
            </a>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="8" class="loading-row" style="color:var(--red)">Ошибка загрузки клиентов</td></tr>';
  }
}

// ===== ORDER MODAL =====
function openOrderModal(order) {
  currentOrderId = order.id;
  $('modalOrderId').textContent = order.id;
  $('modalName').textContent = order.customer_name;

  const phoneLink = $('modalPhone');
  phoneLink.textContent = order.customer_phone;
  phoneLink.href = 'tel:' + cleanPhone(order.customer_phone);

  const emailLink = $('modalEmail');
  emailLink.textContent = order.customer_email;
  emailLink.href = 'mailto:' + order.customer_email;

  $('modalService').textContent = order.service || '—';
  $('modalDate').textContent = formatDate(order.created_at);
  $('modalMessage').textContent = order.message || 'Нет сообщения';
  $('modalStatus').value = order.status;

  const phone = cleanPhone(order.customer_phone).replace(/\D/g, '');
  $('modalCallBtn').href = 'tel:+' + phone;
  $('modalEmailBtn').href = 'mailto:' + order.customer_email;
  $('modalWaBtn').href = 'https://wa.me/' + phone;

  $('orderModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeOrderModal() {
  $('orderModal').style.display = 'none';
  document.body.style.overflow = '';
  currentOrderId = null;
}

$('modalClose').addEventListener('click', closeOrderModal);
$('modalCancelBtn').addEventListener('click', closeOrderModal);
$('orderModal').addEventListener('click', function(e) {
  if (e.target === this) closeOrderModal();
});

$('modalSaveBtn').addEventListener('click', async function() {
  if (!currentOrderId) return;
  const status = $('modalStatus').value;
  const btn = this;
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';

  try {
    const res = await fetch(`/api/orders/${currentOrderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      closeOrderModal();
      loadOrders();
      loadStats();
    }
  } catch (e) {
    alert('Ошибка сохранения');
  }

  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-save"></i> Сохранить статус';
});

// ===== HELPERS =====
function statusBadge(s) {
  const map = {
    new: ['status-new', '🔴 Новая'],
    processing: ['status-processing', '🟡 В работе'],
    completed: ['status-completed', '🟢 Выполнена'],
    cancelled: ['status-cancelled', '⚫ Отменена']
  };
  const [cls, label] = map[s] || ['status-new', s];
  return `<span class="status-badge ${cls}">${label}</span>`;
}

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function cleanPhone(phone) {
  if (!phone) return '';
  // Если начинается с 8, меняем на +7
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('8') && digits.length === 11) return '+7' + digits.slice(1);
  return phone;
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
