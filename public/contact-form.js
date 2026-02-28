// Reusable contact form component
// Usage: <div id="contact-form" data-category="advertising" data-subject="Advertising Inquiry"></div>
// Then: <script src="/contact-form.js"></script>

document.querySelectorAll('[id^="contact-form"]').forEach(container => {
  const category = container.dataset.category || '';
  const preSubject = container.dataset.subject || '';
  const showCategory = !category;

  const categoryOptions = showCategory ? `
    <div class="cf-group">
      <label>Category *</label>
      <select name="category" required>
        <option value="">Select a category...</option>
        <option value="general">General Inquiry</option>
        <option value="advertising">Advertising</option>
        <option value="sponsorship">Sponsorship</option>
        <option value="press">Press / Media</option>
        <option value="licensing">Data Licensing</option>
        <option value="privacy">Privacy</option>
        <option value="data-correction">Data Correction</option>
      </select>
    </div>` : '';

  container.innerHTML = `
    <form class="cf-form">
      <div class="cf-grid">
        <div class="cf-group"><label>Name *</label><input type="text" name="name" required maxlength="255" placeholder="Your name"></div>
        <div class="cf-group"><label>Email *</label><input type="email" name="email" required maxlength="254" placeholder="you@example.com"></div>
      </div>
      ${categoryOptions}
      <div class="cf-group"><label>Subject *</label><input type="text" name="subject" required maxlength="500" placeholder="How can we help?" value="${preSubject}"></div>
      <div class="cf-group"><label>Message *</label><textarea name="message" required maxlength="5000" rows="5" placeholder="Your message..."></textarea></div>
      ${category ? `<input type="hidden" name="category" value="${category}">` : ''}
      <button type="submit" class="cf-btn">Send Message</button>
      <div class="cf-status"></div>
    </form>`;

  const form = container.querySelector('form');
  const status = container.querySelector('.cf-status');
  const btn = container.querySelector('.cf-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    btn.disabled = true; btn.textContent = 'Sending...';
    status.textContent = ''; status.className = 'cf-status';
    const fd = new FormData(form);
    const body = Object.fromEntries(fd.entries());
    try {
      const r = await fetch('/api/contact', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      const d = await r.json();
      if (d.ok) {
        status.textContent = '✓ ' + d.msg; status.classList.add('cf-ok');
        form.reset();
        if (preSubject) form.querySelector('[name="subject"]').value = preSubject;
      } else {
        status.textContent = '✗ ' + (d.error || 'Something went wrong'); status.classList.add('cf-err');
      }
    } catch { status.textContent = '✗ Network error. Please try again.'; status.classList.add('cf-err'); }
    btn.disabled = false; btn.textContent = 'Send Message';
  });
});
