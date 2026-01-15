/**
 * Application d'ajout de photo sur l'affiche
 * Configuration de position dans le code
 */

document.addEventListener('DOMContentLoaded', function() {
    // ================= CONFIGURATION =================
    // AJUSTEZ CES VALEURS selon votre affiche
    const CONFIG = {
        // Position sur l'affiche AFFICHÉE (ce que voit l'utilisateur)
        display: {
            top: 318,     // px depuis le haut de l'affiche affichée
            left: 786,    // px depuis la gauche de l'affiche affichée
            width: 285,   // largeur du cadre affiché
            height: 423   // hauteur du cadre affiché
        },
        
        // Position sur l'affiche ORIGINALE (pour le téléchargement)
        // Ces valeurs seront calculées automatiquement
        original: null
    };
    // =================================================
    
    // Éléments DOM
    const photoInput = document.getElementById('photo-input');
    const userPhoto = document.getElementById('user-photo');
    const placeholderText = document.getElementById('placeholder-text');
    const fileInfo = document.getElementById('file-info');
    const removeButton = document.getElementById('remove-photo');
    const downloadButton = document.getElementById('download-poster');
    const photoOverlayZone = document.querySelector('.photo-overlay-zone');
    const originalPoster = document.getElementById('original-poster');
    
    let currentPhoto = null;
    
    /**
     * Initialise la position du cadre
     */
    function initFramePosition() {
        // Applique la position d'affichage
        photoOverlayZone.style.top = `${CONFIG.display.top}px`;
        photoOverlayZone.style.left = `${CONFIG.display.left}px`;
        photoOverlayZone.style.width = `${CONFIG.display.width}px`;
        photoOverlayZone.style.height = `${CONFIG.display.height}px`;
        
        console.log('Position d\'affichage configurée:', CONFIG.display);
    }
    
    /**
     * Calcule la position pour l'affiche originale
     */
    function calculateOriginalPosition() {
        if (!originalPoster.complete) {
            console.warn('Affiche non chargée, calcul différé');
            return null;
        }
        
        const originalWidth = originalPoster.naturalWidth;
        const originalHeight = originalPoster.naturalHeight;
        const displayedWidth = originalPoster.offsetWidth;
        const displayedHeight = originalPoster.offsetHeight;
        
        // Facteurs d'échelle
        const scaleX = originalWidth / displayedWidth;
        const scaleY = originalHeight / displayedHeight;
        
        // Calcule la position sur l'original
        CONFIG.original = {
            top: Math.round(CONFIG.display.top * scaleY),
            left: Math.round(CONFIG.display.left * scaleX),
            width: Math.round(CONFIG.display.width * scaleX),
            height: Math.round(CONFIG.display.height * scaleY)
        };
        
        console.log('Position originale calculée:', CONFIG.original);
        console.log('Dimensions:', {
            affiche: `${originalWidth}x${originalHeight}`,
            affichage: `${displayedWidth}x${displayedHeight}`,
            echelle: `x:${scaleX.toFixed(2)}, y:${scaleY.toFixed(2)}`
        });
        
        return CONFIG.original;
    }
    
    /**
     * Gère la sélection de photo
     */
    function handleImageSelect(event) {
        if (!event.target.files || event.target.files.length === 0) return;
        
        const file = event.target.files[0];
        if (!file.type.match('image.*')) {
            alert('Veuillez sélectionner une image valide');
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
            
            fileInfo.textContent = `Photo: ${file.name}`;
            photoOverlayZone.classList.add('has-photo');
            
            // Calcule la position originale si ce n'est pas fait
            if (!CONFIG.original) {
                calculateOriginalPosition();
            }
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
        if (!CONFIG.original) {
            if (!calculateOriginalPosition()) {
                alert('Erreur: impossible de calculer la position. Rechargez la page.');
                return;
            }
        }
        
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
            
            console.log('Génération avec:', {
                canvas: `${canvas.width}x${canvas.height}`,
                cadre: CONFIG.original
            });
            
            // 1. Dessine l'affiche originale
            ctx.drawImage(posterImg, 0, 0);
            
            // 2. Calcule object-fit: cover
            const photoRatio = userImg.width / userImg.height;
            const frameRatio = CONFIG.original.width / CONFIG.original.height;
            
            let drawWidth, drawHeight, drawX, drawY;
            
            if (photoRatio > frameRatio) {
                // Photo plus large que le cadre
                drawHeight = CONFIG.original.height;
                drawWidth = drawHeight * photoRatio;
                drawX = CONFIG.original.left - (drawWidth - CONFIG.original.width) / 2;
                drawY = CONFIG.original.top;
            } else {
                // Photo plus haute que le cadre
                drawWidth = CONFIG.original.width;
                drawHeight = drawWidth / photoRatio;
                drawX = CONFIG.original.left;
                drawY = CONFIG.original.top - (drawHeight - CONFIG.original.height) / 2;
            }
            
            // 3. Dessine la photo
            ctx.drawImage(userImg, drawX, drawY, drawWidth, drawHeight);
            
            // 4. Télécharge
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            link.download = `Affiche_Concert_${timestamp}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
            
            downloadButton.innerHTML = '<span class="button-icon">✅</span> Téléchargé!';
            
            setTimeout(() => {
                downloadButton.innerHTML = '<span class="button-icon">💾</span> Télécharger';
                downloadButton.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur: ' + error.message);
            downloadButton.innerHTML = '<span class="button-icon">💾</span> Télécharger';
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
     * Fonction de débogage
     */
    function debugPosition() {
        console.log('=== DÉBOGAGE POSITION ===');
        console.log('Configuration actuelle:', CONFIG);
        
        if (originalPoster.complete) {
            console.log('Dimensions affiche:', {
                original: `${originalPoster.naturalWidth}x${originalPoster.naturalHeight}`,
                affichage: `${originalPoster.offsetWidth}x${originalPoster.offsetHeight}`
            });
            
            // Crée une image de test
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = originalPoster.naturalWidth;
            canvas.height = originalPoster.naturalHeight;
            
            // Fond gris
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Dessine le cadre
            const pos = calculateOriginalPosition();
            if (pos) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                ctx.fillRect(pos.left, pos.top, pos.width, pos.height);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 3;
                ctx.strokeRect(pos.left, pos.top, pos.width, pos.height);
                
                // Texte
                ctx.fillStyle = '#000';
                ctx.font = 'bold 24px Arial';
                ctx.fillText('ZONE PHOTO', pos.left + 10, pos.top + 30);
                ctx.font = '16px Arial';
                ctx.fillText(`${pos.width}x${pos.height}px`, pos.left + 10, pos.top + 60);
                ctx.fillText(`Position: (${pos.left}, ${pos.top})`, pos.left + 10, pos.top + 90);
                
                // Télécharge
                const link = document.createElement('a');
                link.download = 'debug_position.png';
                link.href = canvas.toDataURL();
                link.click();
                
                console.log('Image de débogage téléchargée');
            }
        } else {
            console.log('Affiche non chargée');
        }
    }
    
    /**
     * Initialise l'application
     */
    function init() {
        console.log('Application initialisée');
        
        // Initialise la position
        initFramePosition();
        
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
            originalPoster.addEventListener('load', calculateOriginalPosition);
        }
        
        // Recalcule si la fenêtre est redimensionnée
        window.addEventListener('resize', function() {
            if (currentPhoto) {
                calculateOriginalPosition();
            }
        });
        
        // Expose la fonction de débogage
        window.debugPosition = debugPosition;
        
        console.log('=== INSTRUCTIONS POUR AJUSTER ===');
        console.log('Pour ajuster la position, modifiez les valeurs dans CONFIG.display:');
        console.log('1. Ouvrez le fichier js/app.js');
        console.log('2. Cherchez "const CONFIG = {"');
        console.log('3. Modifiez top, left, width, height');
        console.log('4. Rechargez la page');
        console.log('');
        console.log('Pour vérifier la position, tapez debugPosition() dans la console');
    }
    
    // Lance l'application
    init();
});