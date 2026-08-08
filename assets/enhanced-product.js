setupGalleryRow() {
  const galleryRows = document.querySelectorAll('[data-gallery-row]');
  galleryRows.forEach(row => {
    const thumbs = row.querySelectorAll('.gallery-thumb');
    const mainImg = document.querySelector('.product__media-main img');
    const section = row.closest('section');
    const maxWidth = parseInt(section.dataset.maxWidth) || 1000; // Default to 1000px if not set

    // Check if any image exceeds the max width
    let shouldDisable = false;
    thumbs.forEach(thumb => {
      const originalWidth = parseInt(thumb.dataset.originalWidth);
      if (originalWidth > maxWidth) {
        shouldDisable = true;
      }
    });

    if (shouldDisable) {
      section.style.display = 'none'; // Silence the gallery
      return;
    }

    if (thumbs.length && mainImg) {
      thumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
          mainImg.style.opacity = '0';
          setTimeout(() => {
            mainImg.src = thumb.dataset.imageSrc;
            mainImg.alt = thumb.querySelector('img').alt;
            mainImg.style.opacity = '1';
          }, 200);
        });
      });
    }
  });
}

init() {
  this.setupImageGallery();
  this.setupGalleryRow();
  this.setupQuantityControls();
  this.fixImageSizes();
}