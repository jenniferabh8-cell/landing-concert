/**
 * Application d'ajout de photo - Version RESPONSIVE
 */

document.addEventListener('DOMContentLoaded', function() {
    // ================= CONFIGURATION =================
// REMPLACEZ CES 6 VALEURS AVEC VOS MESURES :

// 1. DIMENSIONS de votre affiche.png :
const AFFICHE_LARGEUR = 6000;    // ← METTEZ VOTRE LARGEUR ICI
const AFFICHE_HAUTEUR = 6000;    // ← METTEZ VOTRE HAUTEUR ICI

// 2. POSITION du cadre vide sur votre affiche :
const CADRE_HAUT = 1792;          // ← METTEZ VOTRE DISTANCE HAUT ICI
const CADRE_GAUCHE = 4135;        // ← METTEZ VOTRE DISTANCE GAUCHE ICI  
const CADRE_LARGEUR = 1528;       // ← METTEZ VOTRE LARGEUR CADRE ICI
const CADRE_HAUTEUR = 2112;       // ← METTEZ VOTRE HAUTEUR CADRE ICI

// =================================================
// NE TOUCHEZ PAS CE QUI SUIT (calcul automatique) :
const CONFIG = {
    positionPercent: {
        top: (CADRE_HAUT / AFFICHE_HAUTEUR) * 100,
        left: (CADRE_GAUCHE / AFFICHE_LARGEUR) * 100,
        width: (CADRE_LARGEUR / AFFICHE_LARGEUR) * 100,
        height: (CADRE_HAUTEUR / AFFICHE_HAUTEUR) * 100
    },
    originalPosition: null,
    currentPosition: null
};
// =================================================
    // ============================================================
    
    // Éléments DOM
    const photoInput = document.getElementById('photo-input');
    const userPhoto = document.getElementById('user-photo');
    const placeholderText = document.getElementById('placeholder-text');
    const fileInfo = document.getElementById('file-info');
    const removeButton = document.getElementById('remove-photo');
    const downloadButton = document.getElementById('download-poster');
    const photoOverlayZone = document.querySelector('.photo-overlay-zone');
    const originalPoster = document.getElementById('original-poster');
    const posterContainer = document.querySelector('.poster-overlay-container');
    
    let currentPhoto = null;
    
    /**
     * Calcule la position du cadre à l'écran
     */
    function calculateScreenPosition() {
        if (!originalPoster.offsetWidth) return null;
        
        const containerWidth = posterContainer.offsetWidth;
        const posterWidth = originalPoster.offsetWidth;
        const posterHeight = originalPoster.offsetHeight;
        
        // Calcule les marges pour centrer l'image
        const horizontalMargin = (containerWidth - posterWidth) / 2;
        
        // Calcule la position en pixels basée sur les pourcentages
        const pos = {
            top: (CONFIG.positionPercent.top / 100) * posterHeight,
            left: horizontalMargin + (CONFIG.positionPercent.left / 100) * posterWidth,
            width: (CONFIG.positionPercent.width / 100) * posterWidth,
            height: (CONFIG.positionPercent.height / 100) * posterHeight
        };
        
        // Applique des limites minimales
        pos.width = Math.max(pos.width, 100);
        pos.height = Math.max(pos.height, 130);
        
        CONFIG.currentPosition = pos;
        return pos;
    }
    
    /**
     * Met à jour la position du cadre à l'écran
     */
    function updateFramePosition() {
        const pos = calculateScreenPosition();
        if (!pos) return;
        
        photoOverlayZone.style.top = `${pos.top}px`;
        photoOverlayZone.style.left = `${pos.left}px`;
        photoOverlayZone.style.width = `${pos.width}px`;
        photoOverlayZone.style.height = `${pos.height}px`;
        
        console.log('Position écran mise à jour:', {
            top: Math.round(pos.top),
            left: Math.round(pos.left),
            width: Math.round(pos.width),
            height: Math.round(pos.height),
            affiche: `${originalPoster.offsetWidth}x${originalPoster.offsetHeight}`
        });
    }
    
    /**
     * Calcule la position pour l'affiche originale
     */
    function calculateOriginalPosition() {
        if (!originalPoster.complete || !originalPoster.naturalWidth) {
            console.warn('Affiche originale non chargée');
            return null;
        }
        
        const originalWidth = originalPoster.naturalWidth;
        const originalHeight = originalPoster.naturalHeight;
        
        // Utilise les mêmes pourcentages pour l'original
        CONFIG.originalPosition = {
            top: (CONFIG.positionPercent.top / 100) * originalHeight,
            left: (CONFIG.positionPercent.left / 100) * originalWidth,
            width: (CONFIG.positionPercent.width / 100) * originalWidth,
            height: (CONFIG.positionPercent.height / 100) * originalHeight
        };
        
        console.log('Position originale calculée:', {
            top: Math.round(CONFIG.originalPosition.top),
            left: Math.round(CONFIG.originalPosition.left),
            width: Math.round(CONFIG.originalPosition.width),
            height: Math.round(CONFIG.originalPosition.height),
            dimensions: `${originalWidth}x${originalHeight}`
        });
        
        return CONFIG.originalPosition;
    }
    
    /**
     * Gère la sélection de photo
     */
    function handleImageSelect(event) {
        if (!event.target.files || event.target.files.length === 0) return;
        
        const file = event.target.files[0];
        if (!file.type.match('image.*')) {
            alert('Veuillez sélectionner une image valide (JPEG, PNG, etc.)');
            return;
        }
        
        // Limite la taille à 5MB pour mobile
        if (file.size > 5 * 1024 * 1024) {
            alert('L\'image est trop volumineuse. Maximum 5MB.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            currentPhoto = e.target.result;
            
            // Met à jour l'affichage
            userPhoto.src = currentPhoto;
            userPhoto.classList.add('active');
            placeholderText.style.display = 'none';
            
            // Active les boutons
            removeButton.disabled = false;
            downloadButton.disabled = false;
            
            fileInfo.textContent = `Photo ajoutée: ${file.name.substring(0, 20)}...`;
            photoOverlayZone.classList.add('has-photo');
            
            // Calcule les positions si ce n'est pas fait
            if (!CONFIG.originalPosition) {
                calculateOriginalPosition();
            }
            updateFramePosition();
        };
        
        reader.onerror = function() {
            alert('Erreur lors du chargement de la photo');
        };
        
        reader.readAsDataURL(file);
    }
    
    /**
     * Charge une image
     */
    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }
    
    /**
     * Génère et télécharge l'affiche finale
     */
    async function generateAndDownloadPoster() {
        if (!currentPhoto) {
            alert('Veuillez d\'abord ajouter une photo');
            return;
        }
        
        // Vérifie que la position originale est calculée
        if (!CONFIG.originalPosition) {
            if (!calculateOriginalPosition()) {
                alert('Erreur: veuillez recharger la page et réessayer.');
                return;
            }
        }
        
        // État de chargement
        const originalText = downloadButton.innerHTML;
        downloadButton.innerHTML = '<span class="button-icon">⏳</span> Génération...';
        downloadButton.disabled = true;
        
        try {
            // Charge les images
            const posterImg = await loadImage('assets/images/affiche.png');
            const userImg = await loadImage(currentPhoto);
            
            // Crée le canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Dimensions de l'original
            canvas.width = posterImg.naturalWidth;
            canvas.height = posterImg.naturalHeight;
            
            console.log('Génération de l\'affiche:', {
                dimensions: `${canvas.width}x${canvas.height}`,
                cadre: CONFIG.originalPosition
            });
            
            // 1. Dessine l'affiche originale
            ctx.drawImage(posterImg, 0, 0);
            
            // 2. Calcule object-fit: cover
            const photoRatio = userImg.width / userImg.height;
            const frameRatio = CONFIG.originalPosition.width / CONFIG.originalPosition.height;
            
            let drawWidth, drawHeight, drawX, drawY;
            
            if (photoRatio > frameRatio) {
                // Photo plus large que le cadre
                drawHeight = CONFIG.originalPosition.height;
                drawWidth = drawHeight * photoRatio;
                drawX = CONFIG.originalPosition.left - (drawWidth - CONFIG.originalPosition.width) / 2;
                drawY = CONFIG.originalPosition.top;
            } else {
                // Photo plus haute que le cadre
                drawWidth = CONFIG.originalPosition.width;
                drawHeight = drawWidth / photoRatio;
                drawX = CONFIG.originalPosition.left;
                drawY = CONFIG.originalPosition.top - (drawHeight - CONFIG.originalPosition.height) / 2;
            }
            
            // 3. Dessine la photo
            ctx.drawImage(userImg, drawX, drawY, drawWidth, drawHeight);
            
            // 4. Télécharge
            const link = document.createElement('a');
            const now = new Date();
            const timestamp = `${now.getDate().toString().padStart(2, '0')}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getFullYear()}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
            
            link.download = `Affiche_Concert_${timestamp}.png`;
            link.href = canvas.toDataURL('image/png', 0.95); // Légère compression pour mobile
            
            // Pour iOS, il faut ajouter l'élément au DOM
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Succès
            downloadButton.innerHTML = '<span class="button-icon">✅</span> Téléchargé!';
            fileInfo.textContent = 'Affiche téléchargée avec succès';
            
            // Réinitialise après 2 secondes
            setTimeout(() => {
                downloadButton.innerHTML = '<span class="button-icon">💾</span> Télécharger';
                downloadButton.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la génération. Essayez une autre photo.');
            downloadButton.innerHTML = originalText;
            downloadButton.disabled = false;
        }
    }
    
    /**
     * Supprime la photo
     */
    function removeCurrentPhoto() {
        currentPhoto = null;
        userPhoto.src = '';
        userPhoto.classList.remove('active');
        placeholderText.style.display = 'flex';
        removeButton.disabled = true;
        downloadButton.disabled = true;
        photoInput.value = '';
        photoOverlayZone.classList.remove('has-photo');
        fileInfo.textContent = 'Aucune photo sélectionnée';
    }
    
    /**
     * Fonction de débogage responsive
     */
    function debugResponsive() {
        console.log('=== DÉBOGAGE RESPONSIVE ===');
        console.log('Configuration:', CONFIG.positionPercent);
        console.log('Dimensions écran:', {
            conteneur: `${posterContainer.offsetWidth}px`,
            affiche: `${originalPoster.offsetWidth}x${originalPoster.offsetHeight}`,
            cadre: CONFIG.currentPosition
        });
        
        if (originalPoster.complete) {
            console.log('Dimensions originale:', {
                width: originalPoster.naturalWidth,
                height: originalPoster.naturalHeight
            });
            
            // Test visuel
            photoOverlayZone.style.border = '3px solid red';
            photoOverlayZone.style.background = 'rgba(255,0,0,0.2)';
            setTimeout(() => {
                photoOverlayZone.style.border = '';
                photoOverlayZone.style.background = '';
            }, 3000);
        }
    }
    
    /**
     * Initialise l'application
     */
    function init() {
        console.log('Application responsive initialisée');
        
        // Initialise la position
        updateFramePosition();
        
        // Écouteurs d'événements
        photoInput.addEventListener('change', handleImageSelect);
        removeButton.addEventListener('click', removeCurrentPhoto);
        downloadButton.addEventListener('click', generateAndDownloadPoster);
        
        // Désactive les boutons au départ
        removeButton.disabled = true;
        downloadButton.disabled = true;
        
        // Calcule la position originale quand l'affiche est chargée
        if (originalPoster.complete) {
            calculateOriginalPosition();
        } else {
            originalPoster.addEventListener('load', function() {
                calculateOriginalPosition();
                updateFramePosition();
            });
        }
        
        // RE-RESPONSIVE : Recalcule la position quand la fenêtre change
        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function() {
                updateFramePosition();
                if (currentPhoto) {
                    calculateOriginalPosition();
                }
            }, 250); // Délai pour éviter trop de recalculs
        });
        
        // Recalcule aussi quand l'orientation change (mobile)
        window.addEventListener('orientationchange', function() {
            setTimeout(function() {
                updateFramePosition();
                if (currentPhoto) {
                    calculateOriginalPosition();
                }
            }, 500);
        });
        
        // Expose la fonction de débogage
        window.debugResponsive = debugResponsive;
        
        console.log('=== POUR MOBILE ===');
        console.log('La position est maintenant responsive');
        console.log('Le cadre s\'ajuste automatiquement à la taille de l\'écran');
        console.log('Pour déboguer: debugResponsive() dans la console');
    }
    
    // Attendre que le DOM soit complètement prêt
    setTimeout(init, 100);
});