// ================================================================
// auth.js — MARCHÉ MOBORO (avec upload photo)
// ================================================================

let currentSeller = null;

function openRegister()   { showPage('termsPage');    }
function refuseTerms()    { showPage('homePage');     }
function acceptTerms()    { showPage('registerPage'); }
function openSellerLogin(){ showPage('loginPage');    }

// Init prévisualisation photo à l'ouverture de la page
function initRegisterPage() {
  previewImage('regPhotoFile', 'regPhotoPreview');
}

// ================================================================
// INSCRIPTION — Étape 1 : formulaire
// ================================================================
async function registerSeller() {
  const fullName    = document.getElementById('regFullName').value.trim();
  const phone       = document.getElementById('regPhone').value.trim();
  const quartier    = document.getElementById('regQuartier').value.trim();
  const address     = document.getElementById('regAddress').value.trim();
  const ville       = document.getElementById('regVille').value.trim();
  const category    = document.getElementById('regCategory').value;
  const description = document.getElementById('regDescription').value.trim();
  const photoFile   = document.getElementById('regPhotoFile')?.files[0];

  if (!fullName || !phone || !quartier || !address || !ville || !category || !description) {
    showToast('Veuillez remplir tous les champs', 'error');
    return;
  }

  // ✅ CORRECTION 3 : .single() → .maybeSingle() pour éviter erreurs console
  // quand le numéro n'existe pas encore (cas normal)

  // Vérifier numéro bloqué
  const { data: blocked } = await db.from(TABLES.BLOCKED_PHONES)
    .select('id').eq('phone', phone).maybeSingle();
  if (blocked) {
    showToast('Ce numéro est banni de la plateforme.', 'error');
    return;
  }

  // Vérifier doublon téléphone
  const { data: existing } = await db.from(TABLES.SELLERS)
    .select('id').eq('phone', phone).maybeSingle();
  if (existing) {
    showToast('Ce numéro a déjà un compte.', 'error');
    return;
  }

  // Upload photo si fournie
  let photoUrl = '';
  if (photoFile) {
    showToast('Upload photo en cours...', 'info');
    photoUrl = await uploadPhoto(photoFile, 'sellers') || '';
  }

  window._pendingSellerData = {
    fullName, phone, quartier, address,
    ville, category, description, photoUrl
  };
  showPage('pinPage');
}

// ================================================================
// INSCRIPTION — Étape 2 : PIN + création compte
// ================================================================
async function validatePin() {
  const pin        = document.getElementById('pinInput').value.trim();
  const pinConfirm = document.getElementById('pinConfirmInput').value.trim();

  if (pin.length < 4) {
    showToast('PIN trop court (minimum 4 chiffres)', 'error');
    return;
  }
  if (pin !== pinConfirm) {
    showToast('Les PINs ne correspondent pas', 'error');
    return;
  }

  const data = window._pendingSellerData;
  if (!data) { showPage('registerPage'); return; }

  try {
    const { count } = await db.from(TABLES.SELLERS)
      .select('*', { count: 'exact', head: true });
    const sellerCode = generateSellerCode(count || 0);

    const newSeller = {
      code:                sellerCode,
      full_name:           data.fullName,
      phone:               data.phone,
      quartier:            data.quartier,
      address:             data.address,
      ville:               data.ville,
      category:            data.category,
      description:         data.description,
      pin_hash:            hashPin(pin),
      photo:               data.photoUrl,
      is_blocked:          false,
      is_active:           true,
      position:            0,
      dynamisme_score:     0,
      last_published:      null,
      subscription_status: 'en_cours',
      created_at:          new Date().toISOString()
    };

    const { data: created, error } = await db.from(TABLES.SELLERS)
      .insert(newSeller).select().single();

    if (error || !created) {
      console.error('validatePin error:', JSON.stringify(error));
      showToast('Erreur lors de la création du compte', 'error');
      return;
    }

    // ✅ CORRECTION 1 : notifyAdmin désactivée (iframe ne fonctionne pas)
    notifyAdmin(created);

    document.getElementById('notifName').innerText = data.fullName;
    document.getElementById('notifCode').innerText = sellerCode;
    showPage('registerSuccessPage');
    window._pendingSellerData = null;

  } catch (e) {
    console.error('validatePin exception:', e);
    showToast('Erreur lors de la création du compte', 'error');
  }
}

// ================================================================
// NOTIFICATION ADMIN WHATSAPP
// ✅ CORRECTION 1 : fonction vidée — l'iframe ne fonctionne pas
//    Pour réactiver plus tard : window.open(`https://wa.me/${ADMIN_PHONE}?text=${msg}`, '_blank');
// ================================================================
function notifyAdmin(seller) {
  // Notification WhatsApp désactivée
}

// ================================================================
// CONNEXION VENDEUR
// ================================================================
async function sellerLogin() {
  const code = document.getElementById('loginCode').value.trim().toUpperCase();
  const pin  = document.getElementById('loginPin').value.trim();

  if (!code || !pin) {
    showToast('Remplissez tous les champs', 'error');
    return;
  }

  const { data: seller, error } = await db.from(TABLES.SELLERS)
    .select('*').eq('code', code).maybeSingle();

  if (error || !seller) {
    showToast('Code vendeur incorrect', 'error');
    return;
  }

  if (seller.pin_hash !== hashPin(pin)) {
    showToast('PIN incorrect', 'error');
    return;
  }

  if (seller.is_blocked) {
    showToast('Compte bloqué. Contactez l\'admin.', 'error');
    document.getElementById('blockedModal').style.display = 'flex';
    return;
  }

  currentSeller = seller;
  localStorage.setItem('seller_code', code);
  showToast('Bienvenue ' + seller.full_name, 'success');
  openSellerDashboard();
}

// ================================================================
// SESSION
// ================================================================
async function checkSession() {
  const savedCode = localStorage.getItem('seller_code');
  if (!savedCode) return;

  const { data: seller } = await db.from(TABLES.SELLERS)
    .select('*').eq('code', savedCode).maybeSingle();

  if (seller && !seller.is_blocked) {
    currentSeller = seller;
    updateProfileIcon();
  } else {
    localStorage.removeItem('seller_code');
  }
}

function logoutSeller() {
  currentSeller = null;
  localStorage.removeItem('seller_code');
  showPage('homePage');
  showToast('Déconnecté', 'info');
}

// ================================================================
// ICÔNE PROFIL
// ✅ CORRECTION 4 : escapeHtml sur photo et initial du nom
// ================================================================
function updateProfileIcon() {
  const icon = document.getElementById('profileIcon');
  if (!icon) return;
  if (currentSeller) {
    icon.style.display    = 'flex';
    icon.style.background = '#1677FF';
    icon.innerHTML = currentSeller.photo
      ? `<img src="${escapeHtml(currentSeller.photo)}"
             style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`
      : escapeHtml(currentSeller.full_name.charAt(0).toUpperCase());
  } else {
    icon.style.display = 'none';
  }
}
