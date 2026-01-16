/**
 * Application d'ajout de photo - Version SYNC HRONISÉE
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
    
    let currentPhoto = null;
    let echelleActuelle = 1;
    
    /**
     * Ajuste le cadre photo proportionnellement à l'affiche
     */
    function ajusterCadrePhoto() {
        const poster = originalPoster;
        const cadre = photoOverlayZone;
        
        if (!poster || !cadre || poster.naturalWidth === 0) return;
        
        // Calculer l'échelle actuelle
        echelleActuelle = poster.offsetWidth / poster.naturalWidth;
        
        // Calculer la nouvelle position proportionnelle
        const nouveauHaut = CADRE_CONFIG.haut * echelleActuelle;
        const nouveauGauche = CADRE_CONFIG.gauche * echelleActuelle;
        const nouvelleLargeur = CADRE_CONFIG.largeur * echelleActuelle;
        const nouvelleHauteur = CADRE_CONFIG.hauteur * echelleActuelle;
        
        // Appliquer les nouvelles dimensions
        cadre.style.top = `${nouveauHaut}px`;
        cadre.style.left = `${nouveauGauche}px`;
        cadre.style.width = `${nouvelleLargeur}px`;
        cadre.style.height = `${nouvelleHauteur}px`;
        
        console.log('📐 Cadre ajusté (affichage):', {
            échelle: echelleActuelle.toFixed(4),
            position: `(${Math.round(nouveauGauche)}, ${Math.round(nouveauHaut)})`,
            dimensions: `${Math.round(nouvelleLargeur)}x${Math.round(nouvelleHauteur)}`
        });
        
        return {
            top: nouveauHaut,
            left: nouveauGauche,
            width: nouvelleLargeur,
            height: nouvelleHauteur
        };
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
            // 1. Charger l'affiche originale
            const posterImg = await loadImage('assets/images/affiche.png');
            
            console.log('🖼️ Dimensions originales de l\'affiche:', 
                `${posterImg.naturalWidth}x${posterImg.naturalHeight}`);
            
            // 2. Calculer la position EXACTE sur l'original
            const cadrePosition = {
                top: CADRE_CONFIG.haut,
                left: CADRE_CONFIG.gauche,
                width: CADRE_CONFIG.largeur,
                height: CADRE_CONFIG.hauteur
            };
            
            console.log('📍 Position cadre sur original:', cadrePosition);
            
            // 3. Créer le canvas avec les dimensions de l'original
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = posterImg.naturalWidth;
            canvas.height = posterImg.naturalHeight;
            
            // 4. Dessiner l'affiche originale
            ctx.drawImage(posterImg, 0, 0);
            
            // 5. Charger la photo utilisateur
            const userImg = await loadImage(currentPhoto);
            
            console.log('📸 Dimensions photo utilisateur:', 
                `${userImg.width}x${userImg.height}`);
            
            // 6. Calculer object-fit: cover POUR L'ORIGINAL
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
            
            console.log('🎯 Position dessin sur original:', {
                x: Math.round(drawX),
                y: Math.round(drawY),
                width: Math.round(drawWidth),
                height: Math.round(drawHeight)
            });
            
            // 7. Dessiner la photo
            ctx.drawImage(userImg, drawX, drawY, drawWidth, drawHeight);
            
            // 8. Télécharger
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
            console.error('❌ Erreur:', error);
            alert('Erreur lors de la génération. Essayez une autre photo.');
            downloadButton.innerHTML = originalText;
            downloadButton.disabled = false;
        }
    }
    
    /**
     * Test de précision
     */
    function testerPrecision() {
        const poster = originalPoster;
        if (!poster.complete) {
            console.log('🔄 Affiche non chargée, attendez...');
            return;
        }
        
        // Calcul pour l'affichage
        const echelle = poster.offsetWidth / poster.naturalWidth;
        const cadreEcran = {
            top: CADRE_CONFIG.haut * echelle,
            left: CADRE_CONFIG.gauche * echelle,
            width: CADRE_CONFIG.largeur * echelle,
            height: CADRE_CONFIG.hauteur * echelle
        };
        
        console.log('🎯 TEST DE PRÉCISION:');
        console.log('1. Dimensions affiche:', {
            originale: `${poster.naturalWidth}x${poster.naturalHeight}`,
            affichée: `${poster.offsetWidth}x${poster.offsetHeight}`,
            échelle: echelle.toFixed(4)
        });
        
        console.log('2. Position sur original:', {
            top: CADRE_CONFIG.haut,
            left: CADRE_CONFIG.gauche,
            width: CADRE_CONFIG.largeur,
            height: CADRE_CONFIG.hauteur
        });
        
        console.log('3. Position à l\'écran:', {
            top: Math.round(cadreEcran.top),
            left: Math.round(cadreEcran.left),
            width: Math.round(cadreEcran.width),
            height: Math.round(cadreEcran.height)
        });
        
        console.log('4. Cadre CSS actuel:', {
            top: photoOverlayZone.style.top,
            left: photoOverlayZone.style.left,
            width: photoOverlayZone.style.width,
            height: photoOverlayZone.style.height
        });
        
        // Visualiser
        photoOverlayZone.style.border = '3px solid red';
        photoOverlayZone.style.background = 'rgba(255,0,0,0.1)';
        setTimeout(() => {
            photoOverlayZone.style.border = '';
            photoOverlayZone.style.background = '';
        }, 3000);
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
        console.log('🚀 Application initialisée');
        
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
            originalPoster.addEventListener('load', function() {
                ajusterCadrePhoto();
                console.log('✅ Affiche chargée, cadre ajusté');
            });
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
        
        // Fonctions de débogage
        window.testerPrecision = testerPrecision;
        window.voirConfig = function() {
            console.log('⚙️ Configuration:', CADRE_CONFIG);
        };
        
        console.log('📱 Pour tester la précision: tapez testerPrecision() dans la console');
        console.log('🔧 Vérifiez que les 4 valeurs sont correctes:', CADRE_CONFIG);
    }
    
    // Lancer l'application
    init();
});