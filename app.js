// ==================== APP.JS ====================

// ================================================================
// ✅ CORRECTION 1 : showPage et DOMContentLoaded supprimés
//    Ces fonctions sont déjà dans index.html en version complète
//    (avec pageHistory, headerTitles, searchBox)
//    Ce fichier ne contient que initBanner() et openAdmin()
// ================================================================

// ================================================================
// BANNER — Défilement automatique + swipe tactile
// ================================================================
function initBanner() {
  const bannerImages = [
    // === CLIENTS (60%) ===
    {
      url:      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200',
      title:    '🛍️ Mode & Tendances',
      subtitle: 'Les meilleures boutiques de Brazzaville vous attendent'
    },
    {
      url:      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1200',
      title:    '💄 Beauté & Cosmétiques',
      subtitle: 'Les meilleures marques à prix imbattables'
    },
    {
      url:      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200',
      title:    '👟 Chaussures & Basket',
      subtitle: 'Des styles pour toutes les occasions'
    },
    {
      url:      'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1200',
      title:    '🔥 Promos Exclusives',
      subtitle: 'Des réductions exceptionnelles chaque jour !'
    },
    {
      url:      'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=1200',
      title:    '👗 Vêtements Femme',
      subtitle: 'Robes, ensembles tendance — livraison à domicile'
    },
    {
      url:      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1200',
      title:    '🚚 Commandez Facilement',
      subtitle: 'Recevez vos achats directement chez vous à Brazzaville'
    },
    // === VENDEURS (40%) ===
    {
      url:      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=1200',
      title:    '🏪 Ouvrez Votre Boutique Gratuite !',
      subtitle: 'Inscription 100% gratuite — Gardez 100% de vos ventes'
    },
    {
      url:      'https://images.unsplash.com/photo-1573408301185-9519f94816b5?q=80&w=1200',
      title:    '📈 Développez Votre Activité',
      subtitle: 'Touchez des milliers de clients à Brazzaville et au Congo'
    },
    {
      url:      'https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=1200',
      title:    '💰 Zéro Commission !',
      subtitle: 'Vendez plus, gagnez plus — Rejoignez Marché Moboro'
    },
    {
      url:      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1200',
      title:    '🤝 Rejoignez Notre Communauté',
      subtitle: '500 FCFA/sem seulement après la période promo — Inscrivez-vous maintenant !'
    }
  ];

  let currentSlide = 0;
  let autoSlide;

  const bannerImg      = document.getElementById('bannerImg');
  const bannerTitle    = document.getElementById('bannerTitle');
  const bannerSubtitle = document.getElementById('bannerSubtitle');
  const dotsContainer  = document.getElementById('bannerDots');

  if (!bannerImg) return;

  // Précharger les images
  bannerImages.forEach(slide => {
    const img = new Image();
    img.src = slide.url;
  });

  // ✅ CORRECTION 4 : vérifier que dotsContainer existe avant .innerHTML
  if (dotsContainer) {
    dotsContainer.innerHTML = bannerImages.map((_, i) =>
      `<span class="dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></span>`
    ).join('');
  }

  function updateBanner(index) {
    const slide = bannerImages[index];
    bannerImg.style.opacity = '0';
    setTimeout(() => {
      bannerImg.src            = slide.url;
      bannerTitle.innerText    = slide.title;
      bannerSubtitle.innerText = slide.subtitle;
      bannerImg.style.opacity  = '1';
    }, 300);
    document.querySelectorAll('.dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }

  function resetAutoSlide() {
    clearInterval(autoSlide);
    autoSlide = setInterval(nextSlide, 4000);
  }

  window.goToSlide = function(i) {
    currentSlide = i;
    updateBanner(currentSlide);
    resetAutoSlide();
  };

  function nextSlide() {
    currentSlide = (currentSlide + 1) % bannerImages.length;
    updateBanner(currentSlide);
  }

  // Lancer le défilement automatique
  autoSlide = setInterval(nextSlide, 4000);

  // ✅ CORRECTION 3 : swipe gauche et droite reset l'autoSlide dans les deux cas
  let touchStartX = 0;
  bannerImg.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  });
  bannerImg.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) {
      clearInterval(autoSlide);
      if (diff > 0) {
        currentSlide = (currentSlide + 1) % bannerImages.length;
      } else {
        currentSlide = (currentSlide - 1 + bannerImages.length) % bannerImages.length;
      }
      updateBanner(currentSlide);
      autoSlide = setInterval(nextSlide, 4000);
    }
  });
}

// ================================================================
// ADMIN
// ================================================================
function openAdmin() {
  showPage('adminLoginPage');
}
