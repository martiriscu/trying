document.addEventListener('DOMContentLoaded', function() {
    const clickwheel = document.getElementById('clickwheel');
    const menuItems = document.querySelectorAll('.menu-item');
    const previewImage = document.getElementById('preview-image');
    const screenEl = document.getElementById('screen'); // Get the main screen element
    
    let currentIndex = 0;
    let startAngle = 0;
    let isDragging = false;
    let inSubMenu = false;
    let gameMode = false; // Flag to indicate if a game is active
    
    const links = {
        "LinkedIn": "https://www.linkedin.com/in/monicagottardi",
        "Behance": "https://www.behance.net/monicagottardi",
        "Mail": "mailto:monicagottardi@outlook.com"
    };
    
    // Initialize active menu item
    menuItems.forEach((item, index) => {
        if (item.classList.contains('active')) {
            currentIndex = index;
        }
    });
    
    // Function to update menu selection
    function updateSelection(newIndex) {
        if (newIndex < 0 || newIndex >= menuItems.length) return;
        menuItems[currentIndex].classList.remove('active');
        currentIndex = newIndex;
        menuItems[currentIndex].classList.add('active');
        menuItems[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const previewSrc = menuItems[currentIndex].dataset.preview;
        if (previewSrc) previewImage.src = previewSrc;
    }
    
    // Handle clickwheel rotation for menu navigation
    function handleRotation(event) {
        if (!isDragging || inSubMenu) return; // Disable rotation if in submenu or game
        const rect = clickwheel.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX);
        const angleDiff = angle - startAngle;
        if (Math.abs(angleDiff) > Math.PI / 8) { // Threshold for movement
            if (angleDiff > 0) updateSelection(currentIndex + 1);
            else updateSelection(currentIndex - 1);
            startAngle = angle;
        }
    }
    
    // Mouse events for clickwheel rotation
    clickwheel.addEventListener('mousedown', function(event) {
        isDragging = true;
        const rect = clickwheel.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        startAngle = Math.atan2(event.clientY - centerY, event.clientX - centerX);
    });
    document.addEventListener('mousemove', handleRotation);
    document.addEventListener('mouseup', () => isDragging = false);
    
    // Main clickwheel button handler
    clickwheel.addEventListener('click', function(event) {
        const action = event.target.closest('[data-action]')?.dataset.action;
        if (!action) return;
    
        // If a game is active, only handle 'menu' button to exit
        if (gameMode) {
            if (action === 'menu') {
                exitGame(); // Exit the current game
            }
            // All other buttons are handled by the game's internal logic
            return; 
        }
    
        // Normal menu navigation
        switch(action) {
            case 'menu':
                if (inSubMenu) {
                    restoreMenu(); // Go back to main menu from a sub-page
                }
                break;
            case 'forward':
                updateSelection(currentIndex + 1);
                break;
            case 'back':
                updateSelection(currentIndex - 1);
                break;
            case 'playpause':
                console.log('Play/Pause button clicked');
                break;
            case 'select':
                const selectedText = menuItems[currentIndex].textContent.trim();
                if (links[selectedText]) {
                    // Open external links
                    if (selectedText === "Mail") {
                        window.location.href = links[selectedText];
                    } else {
                        window.open(links[selectedText], '_blank');
                    }
                } else {
                    // Handle internal sections
                    if (selectedText === "Games") {
                        startBreakoutGame(); // Start the Breakout game
                    } else {
                        // Default placeholder for other non-link menu items
                        screenEl.innerHTML = `
                            <div id="display" style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center;">
                                <div style="text-align:center; width:100%; color:#000;">
                                    <h3 style="font-size:3mm;">${selectedText}</h3>
                                    <p style="font-size:2mm;">Opening...</p>
                                </div>
                            </div>
                        `;
                        inSubMenu = true;
                    }
                }
                break;
        }
    });
    
    // Touch events for clickwheel rotation
    clickwheel.addEventListener('touchstart', function(event) {
        isDragging = true;
        const touch = event.touches[0];
        const rect = clickwheel.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        startAngle = Math.atan2(touch.clientY - centerY, touch.clientX - centerX);
    });
    clickwheel.addEventListener('touchmove', function(event) {
        event.preventDefault();
        const touch = event.touches[0];
        handleRotation(touch);
    });
    clickwheel.addEventListener('touchend', () => isDragging = false);
    
    // Initial state setup
    menuItems[currentIndex].classList.add('active');
    menuItems[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    previewImage.src = menuItems[currentIndex].dataset.preview;
    
    // Function to restore the main menu view
    function restoreMenu() {
        // Reloading the page is the simplest way to reset all game state and re-bind menu listeners
        location.reload(); 
    }
    
    // Function to start the Breakout game
    function startBreakoutGame() {
        // Replace the entire screen content with the game canvas and instructions
        screenEl.innerHTML = `
            <canvas id="breakout-game" style="background:black; display:block; margin:auto; width:100%; height:100%;"></canvas>
            <div style="text-align:center; font-size:2mm; color:white;">Rotate wheel to move, center to start</div>
        `;
        // Use a small delay to ensure canvas is fully rendered before init
        // Get the actual pixel dimensions of the screen element after it's rendered
        const screenRect = screenEl.getBoundingClientRect();
        setTimeout(() => initBreakoutGame(screenRect.width, screenRect.height), 50); 
        gameMode = true; // Set game mode flag
    }
    
    // Function to exit the game
    function exitGame() {
        gameMode = false; // Reset game mode flag
        restoreMenu(); // Go back to the main menu
    }
    
    // Breakout Game Logic
    // Pass canvas dimensions directly to avoid relying on clientWidth/Height which might be fractional
    function initBreakoutGame(canvasDisplayWidth, canvasDisplayHeight) {
        const canvas = document.getElementById('breakout-game');
        const ctx = canvas.getContext('2d');
    
        // Get device pixel ratio for sharp rendering on high-DPI screens
        const dpr = window.devicePixelRatio || 1;
    
        // Set canvas drawing buffer size (internal resolution)
        canvas.width = canvasDisplayWidth * dpr;
        canvas.height = canvasDisplayHeight * dpr;
    
        // Scale the context to match the device pixel ratio
        ctx.scale(dpr, dpr);
    
        // Game variables (sizes relative to canvas's CSS dimensions)
        let paddleWidth = canvasDisplayWidth * 0.25;
        let paddleHeight = canvasDisplayHeight * 0.03;
        let paddleX = (canvasDisplayWidth - paddleWidth) / 2;
        let ballRadius = canvasDisplayWidth * 0.02; // Ball size adjusted (was 0.015)
        let ballX = canvas.width / 2;
        let ballY = canvas.height - paddleHeight - ballRadius - 5; // Start ball above paddle
        let ballSpeed = canvas.width * 0.003; // Ball speed decreased (was 0.004)
        let ballDX = ballSpeed; // Ball speed X (slower)
        let ballDY = -ballSpeed; // Ball speed Y (slower)
        let running = false; // Game running state
        let paused = true; // Game starts paused
        let lastAngle = null; // For clickwheel paddle control
    
        // Brick properties
        const brickRowCount = 3; // 3 rows
        const maxBrickColumnCount = 6; // 6 columns
        const brickHeight = canvasDisplayHeight * 0.05; // Taller bricks (increased from 0.04)
        const brickPadding = canvasDisplayWidth * 0.01; // Smaller padding between bricks (was 0.05)
        const sideMargin = canvasDisplayWidth * 0.05; // Margin from the sides of the display
        const brickOffsetTop = canvasDisplayHeight * 0.1; // Bricks suspended from top
        
        let bricks = []; // Array to hold brick objects
    
        // Define gradient colors for different HP levels (more prominent)
        const brickColors = {
            3: ['#003366', '#001133'], // Darkest blue for 3 HP (top row)
            2: ['#0077b6', '#005588'], // Medium blue for 2 HP (middle row)
            1: ['#00b4d8', '#0099cc']  // Lightest blue for 1 HP (bottom row)
        };
    
        // Initialize bricks with organized HP and pyramid layout
        function initBricks() {
            bricks = []; // Clear existing bricks
            for (let r = 0; r < brickRowCount; r++) {
                bricks[r] = [];
                // Each row has one less brick than the row above, starting from maxBrickColumnCount
                const currentColumnCount = maxBrickColumnCount - r; 
                
                // Calculate brick width for the current row to fit and be centered
                // The total width available for bricks and their internal padding in this row
                const totalInternalPaddingWidth = (currentColumnCount - 1) * brickPadding;
                const availableWidthForBricksInRow = canvasDisplayWidth - (2 * sideMargin) - totalInternalPaddingWidth;
                const currentBrickWidth = availableWidthForBricksInRow / currentColumnCount;
                
                // Centering offset for current row, starting after the sideMargin
                const rowOffsetLeft = sideMargin;
    
                for (let c = 0; c < currentColumnCount; c++) {
                    // Assign HP based on row: top row (r=0) = 3 HP, r=1 = 2 HP, bottom (r=2) = 1 HP
                    const hp = brickRowCount - r; 
                    bricks[r][c] = { 
                        x: rowOffsetLeft + (c * (currentBrickWidth + brickPadding)),
                        y: (r * (brickHeight + brickPadding)) + brickOffsetTop,
                        width: currentBrickWidth, // Use consistent width
                        height: brickHeight, // Store height for this brick
                        status: 1, 
                        hp: hp 
                    }; 
                }
            }
        }
    
        // Draw bricks on canvas
        function drawBricks() {
            for (let r = 0; r < brickRowCount; r++) { // Iterate through rows
                for (let c = 0; c < bricks[r].length; c++) { // Iterate through actual bricks in row
                    let b = bricks[r][c];
                    if (b.status === 1) {
                        // Get colors based on brick's HP
                        const colors = brickColors[b.hp] || brickColors[1]; 
                        
                        // Create a linear gradient for the brick
                        const brickGradient = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.height);
                        brickGradient.addColorStop(0, colors[0]); 
                        brickGradient.addColorStop(1, colors[1]); 
                        
                        ctx.fillStyle = brickGradient; 
                        ctx.fillRect(b.x, b.y, b.width, b.height);
    
                        // --- Add internal shadows/highlights for 3D effect ---
                        // Darker shadow on bottom and right edges
                        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; // Darker shade
                        ctx.lineWidth = 1; // Thin line
                        ctx.beginPath();
                        ctx.moveTo(b.x + b.width, b.y);
                        ctx.lineTo(b.x + b.width, b.y + b.height);
                        ctx.lineTo(b.x, b.y + b.height);
                        ctx.stroke();
    
                        // Lighter highlight on top and left edges
                        ctx.strokeStyle = 'rgba(255,255,255,0.4)'; // Lighter shade
                        ctx.beginPath();
                        ctx.moveTo(b.x, b.y + b.height);
                        ctx.lineTo(b.x, b.y);
                        ctx.lineTo(b.x + b.width, b.y);
                        ctx.stroke();
                        // --- End internal shadows/highlights ---
                    }
                }
            }
        }
    
        // Draw paddle on canvas
        function drawPaddle() {
            ctx.fillStyle = "white"; // Paddle color
            ctx.fillRect(paddleX, canvasDisplayHeight - paddleHeight - 2, paddleWidth, paddleHeight);
        }
    
        // Draw ball on canvas
        function drawBall() {
            ctx.beginPath();
            ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
            ctx.fillStyle = "white"; // Ball color (white)
            ctx.fill();
            ctx.closePath();
        }
    
        // Collision Detection for ball and bricks
        function collisionDetection() {
            for (let r = 0; r < brickRowCount; r++) { // Iterate through rows
                for (let c = 0; c < bricks[r].length; c++) { // Iterate through actual bricks in row
                    let b = bricks[r][c];
                    if (b.status === 1) { // Only check visible bricks
                        if (ballX > b.x && ballX < b.x + b.width &&
                            ballY > b.y && ballY < b.y + b.height) {
                            ballDY = -ballDY; // Reverse ball direction
                            
                            b.hp--; // Decrement brick HP
                            if (b.hp <= 0) {
                                b.status = 0; // Mark brick as hit if HP is 0
                            }
                            
                            let allBricksHit = true;
                            for(let checkR = 0; checkR < brickRowCount; checkR++) { // Check all bricks for win condition
                                for(let checkC = 0; checkC < bricks[checkR].length; checkC++) {
                                    if(bricks[checkR][checkC].status === 1) { 
                                        allBricksHit = false;
                                        break;
                                    }
                                }
                                if(!allBricksHit) break;
                            }
    
                            if (allBricksHit) {
                                running = false;
                                paused = true; // Pause on win
                                // Removed text message
                            }
                        }
                    }
                }
            }
        }
    
        // Main drawing and update loop
        function draw() {
            // Draw light blue gradient background
            const gradient = ctx.createLinearGradient(0, 0, 0, canvasDisplayHeight);
            gradient.addColorStop(0, '#ADD8E6'); // Light blue
            gradient.addColorStop(1, '#87CEEB'); // Sky blue
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvasDisplayWidth, canvasDisplayHeight);
            
            drawBricks();
            drawPaddle();
            drawBall();
            collisionDetection();
    
            if (running && !paused) { // Only update if running and not paused
                ballX += ballDX; // Update ball position
                ballY += ballDY;
    
                // Wall collisions (left/right)
                if (ballX + ballRadius > canvasDisplayWidth || ballX - ballRadius < 0) {
                    ballDX = -ballDX;
                }
                // Wall collisions (top)
                if (ballY - ballRadius < 0) {
                    ballDY = -ballDY;
                }
    
                // Paddle collision
                if (ballY + ballRadius >= canvasDisplayHeight - paddleHeight - 2 && // Ball reaches paddle height
                    ballX > paddleX && ballX < paddleX + paddleWidth) { // Ball is within paddle width
                    ballDY = -ballDY; // Reverse ball direction
                }
    
                // Ball falls off bottom - reset position and pause
                if (ballY + ballRadius > canvasDisplayHeight) {
                    ballX = canvasDisplayWidth / 2;
                    ballY = canvasDisplayHeight - paddleHeight - ballRadius - 5;
                    ballDX = ballSpeed; // Reset speed
                    ballDY = -ballSpeed; // Reset direction
                    paddleX = (canvas.width - paddleWidth) / 2; // Reset paddle position
                    paused = true; // Pause the game
                    // Removed text message
                }
            } else if (paused) { // If paused, display the "Press center to continue" message
                // Removed all text messages
            }
            requestAnimationFrame(draw); // Loop drawing
        }
    
        // Function to start/restart the game
        function startGame() {
            if (!running || paused) { // Only start if not running or if paused
                if (!running) { // If not running at all (first start or after win/lose)
                    initBricks(); // Reset bricks
                    ballX = canvasDisplayWidth / 2;
                    ballY = canvasDisplayHeight - paddleHeight - ballRadius - 5;
                    ballDX = ballSpeed;
                    ballDY = -ballSpeed;
                    paddleX = (canvas.width - paddleWidth) / 2; // Reset paddle position
                }
                running = true; // Set game to running
                paused = false; // Unpause the game
            }
        }
    
        // Assign clickwheel button actions for the game
        document.getElementById('menu-button').onclick = exitGame; // Menu button exits game
        document.getElementById('select-button').onclick = startGame; // Select button starts/restarts game
    
        // Clickwheel rotation for paddle control
        clickwheel.addEventListener('mousemove', function(e) {
            if (!gameMode || !running) return; // Only move paddle if game is active and running
            const rect = clickwheel.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    
            if (lastAngle !== null) {
                let diff = angle - lastAngle;
                if (diff > Math.PI) diff -= 2 * Math.PI;
                if (diff < -Math.PI) diff += 2 * Math.PI;
    
                // Adjust paddleX based on rotation difference, scaled by canvas width
                paddleX += diff * (canvasDisplayWidth * 0.15); // Adjusted sensitivity for slower movement
                // Keep paddle within canvas bounds
                if (paddleX < 0) paddleX = 0;
                if (paddleX + paddleWidth > canvasDisplayWidth) paddleX = canvasDisplayWidth - paddleWidth;
            }
            lastAngle = angle;
        });
    
        // Initialize bricks and start drawing loop
        initBricks();
        draw();
    }
    
    // Mobile proportional scaling (from previous discussions)
    function scaleIpod() {
        const wrapper = document.querySelector('.ipod-wrapper');
        if (window.innerWidth <= 768) {
            const ipod = document.querySelector('.ipod-container');
            const ipodWidth = ipod.offsetWidth;
            const ipodHeight = ipod.offsetHeight;
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            const scale = Math.min(screenWidth / ipodWidth, screenHeight / ipodHeight);
            wrapper.style.setProperty('--ipod-scale', scale);
        } else {
            wrapper.style.removeProperty('--ipod-scale');
        }
    }
    
    window.addEventListener('load', scaleIpod);
    window.addEventListener('resize', scaleIpod);
    });