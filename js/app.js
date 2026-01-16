/**
 * Application d'ajout de photo - Version FIXE et RESPONSIVE
 */

document.addEventListener('DOMContentLoaded', function() {
    // ================= CONFIGURATION =================
    // REMPLACEZ CES 4 VALEURS PAR VOS MESURES EXACTES :
    const CADRE_CONFIG = {
        haut: 1792,     // ← VOTRE distance HAUT (mesurée dans Paint)
        gauche: 4135,   // ← VOTRE distance GAUCHE (mesurée dans Paint)
        largeur: 1528,  // ← VOTRE LARGEUR CADRE (mesurée dans Paint)
        hauteur: 2112   // ← VOTRE HAUTEUR CADRE (mesurée dans Paint)
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
    const posterContainer = document.querySelector('.poster-overlay-container');
    
    let currentPhoto = null;
    let originalPosterSize = null;
    
    /**
     * Ajuste le cadre photo proportionnellement à l'affiche
     */
    function ajusterCadrePhoto() {
        const poster = originalPoster;
        const cadre = photoOverlayZone;
        
        if (!poster || !cadre) return;
        
        // Attendre que l'image soit complètement chargée
        if (poster.naturalWidth === 0) {
            poster.addEventListener('load', ajusterCadrePhoto);
            return;
        }
        
        // Stocker les dimensions originales (une seule fois)
        if (!originalPosterSize) {
            originalPosterSize = {
                width: poster.naturalWidth,
                height: poster.naturalHeight
            };
            console.log('📏 Dimensions originales de l\'affiche:', 
                `${originalPosterSize.width}x${originalPosterSize.height}px`);
        }
        
        // Calculer l'échelle actuelle (comment l'affiche est redimensionnée)
        const echelle = poster.offsetWidth / originalPosterSize.width;
        
        // Calculer la nouvelle position proportionnelle
        const nouveauHaut = CADRE_CONFIG.haut * echelle;
        const nouveauGauche = CADRE_CONFIG.gauche * echelle;
        const nouvelleLargeur = CADRE_CONFIG.largeur * echelle;
        const nouvelleHauteur = CADRE_CONFIG.hauteur * echelle;
        
        // Appliquer les nouvelles dimensions
        cadre.style.top = `${nouveauHaut}px`;
        cadre.style.left = `${nouveauGauche}px`;
        cadre.style.width = `${nouvelleLargeur}px`;
        cadre.style.height = `${nouvelleHauteur}px`;
        
        console.log('✅ Cadre ajusté:', {
            échelle: echelle.toFixed(4),
            position: `${Math.round(nouveauGauche)}x${Math.round(nouveauHaut)}`,
            dimensions: `${Math.round(nouvelleLargeur)}x${Math.round(nouvelleHauteur)}`,
            affiche: `${poster.offsetWidth}x${poster.offsetHeight}`
        });
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
        
        const reader = new FileReader();
        reader.onload = function(e) {
            currentPhoto = e.target.result;
            
            // Mettre à jour l'affichage
            userPhoto.src = currentPhoto;
            userPhoto.classList.add('active');
            placeholderText.style.display = 'none';
            
            // Activer les boutons
            removeButton.disabled = false;
            downloadButton.disabled = false;
            
            fileInfo.textContent = `Photo: ${file.name.substring(0, 20)}...`;
            photoOverlayZone.classList.add('has-photo');
            
            // Re-ajuster le cadre au cas où
            ajusterCadrePhoto();
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
     * Calcule la position pour le téléchargement
     */
    function calculerPositionPourTelechargement() {
        if (!originalPosterSize) return null;
        
        return {
            top: CADRE_CONFIG.haut,
            left: CADRE_CONFIG.gauche,
            width: CADRE_CONFIG.largeur,
            height: CADRE_CONFIG.hauteur
        };
    }
    
    /**
     * Génère et télécharge l'affiche finale
     */
    async function generateAndDownloadPoster() {
        if (!currentPhoto) {
            alert('Veuillez d\'abord ajouter une photo');
            return;
        }
        
        // État de chargement
        const originalText = downloadButton.innerHTML;
        downloadButton.innerHTML = '<span class="button-icon">⏳</span> Génération...';
        downloadButton.disabled = true;
        
        try {
            // Charger l'affiche originale
            const posterImg = await loadImage('assets/images/affiche.png');
            
            // Calculer la position du cadre sur l'original
            const cadrePosition = {
                top: CADRE_CONFIG.haut,
                left: CADRE_CONFIG.gauche,
                width: CADRE_CONFIG.largeur,
                height: CADRE_CONFIG.hauteur
            };
            
            // Créer le canvas avec les dimensions de l'original
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = posterImg.naturalWidth;
            canvas.height = posterImg.naturalHeight;
            
            // 1. Dessiner l'affiche originale
            ctx.drawImage(posterImg, 0, 0);
            
            // 2. Charger la photo utilisateur
            const userImg = await loadImage(currentPhoto);
            
            // 3. Calculer object-fit: cover
            const photoRatio = userImg.width / userImg.height;
            const cadreRatio = cadrePosition.width / cadrePosition.height;
            
            let drawWidth, drawHeight, drawX, drawY;
            
            if (photoRatio > cadreRatio) {
                // Photo plus large que le cadre
                drawHeight = cadrePosition.height;
                drawWidth = drawHeight * photoRatio;
                drawX = cadrePosition.left - (drawWidth - cadrePosition.width) / 2;
                drawY = cadrePosition.top;
            } else {
                // Photo plus haute que le cadre
                drawWidth = cadrePosition.width;
                drawHeight = drawWidth / photoRatio;
                drawX = cadrePosition.left;
                drawY = cadrePosition.top - (drawHeight - cadrePosition.height) / 2;
            }
            
            // 4. Dessiner la photo
            ctx.drawImage(userImg, drawX, drawY, drawWidth, drawHeight);
            
            // 5. Télécharger
            const link = document.createElement('a');
            const now = new Date();
            const timestamp = `${now.getDate().toString().padStart(2, '0')}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getFullYear().toString().slice(-2)}`;
            
            link.download = `Affiche_Personnalisee_${timestamp}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Succès
            downloadButton.innerHTML = '<span class="button-icon">✅</span> Téléchargé!';
            fileInfo.textContent = 'Affiche téléchargée avec succès';
            
            // Réinitialiser après 2 secondes
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
     * Initialise l'application
     */
    function init() {
        console.log('🎯 Application initialisée avec position FIXE');
        
        // Désactiver les boutons au départ
        removeButton.disabled = true;
        downloadButton.disabled = true;
        
        // Écouteurs d'événements
        photoInput.addEventListener('change', handleImageSelect);
        removeButton.addEventListener('click', removeCurrentPhoto);
        downloadButton.addEventListener('click', generateAndDownloadPoster);
        
        // Ajuster le cadre initial
        if (originalPoster.complete) {
            ajusterCadrePhoto();
        } else {
            originalPoster.addEventListener('load', ajusterCadrePhoto);
        }
        
        // Re-ajuster quand la fenêtre change de taille
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(ajusterCadrePhoto, 100);
        });
        
        // Re-ajuster quand l'orientation change (mobile)
        window.addEventListener('orientationchange', function() {
            setTimeout(ajusterCadrePhoto, 300);
        });
        
        // Fonction de débogage
        window.debugCadre = function() {
            console.log('=== DÉBOGAGE ===');
            console.log('Configuration:', CADRE_CONFIG);
            console.log('Dimensions affiche originale:', originalPosterSize);
            console.log('Dimensions affiche affichée:', 
                `${originalPoster.offsetWidth}x${originalPoster.offsetHeight}`);
            
            // Afficher un cadre rouge pour visualiser
            photoOverlayZone.style.border = '3px solid red';
            photoOverlayZone.style.background = 'rgba(255,0,0,0.2)';
            setTimeout(() => {
                photoOverlayZone.style.border = '';
                photoOverlayZone.style.background = '';
            }, 3000);
        };
        
        console.log('📱 Pour tester: redimensionnez la fenêtre - le cadre suivra proportionnellement');
        console.log('🔧 Pour déboguer: tapez debugCadre() dans la console');
    }
    
    // Lancer l'application
    init();
});