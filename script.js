// =============================================
// SETTINGS OBJECT
// This stores all the player's current choices
// from the menu screen. Every time a pill button
// or theme button is clicked, this object updates.
// The game reads from this object when it starts.
// =============================================
let settings = {
  theme:           'nature',   // currently selected vocab theme
  difficulty:      'easy',     // easy / medium / hard
  players:         1,          // 1 or 2
  timerMode:       'countup',  // countup or countdown
  customCountdown: 60          // seconds — only used in countdown mode
};

// =============================================
// PLAYER NAMES
// Stores the names entered on the name screen.
// Index 0 = Player 1, Index 1 = Player 2.
// Default values used for 1-player mode.
// =============================================
let playerNames = ['Player 1', 'Player 2'];

// =============================================
// showScreen(id)
// This function switches between the three screens.
// It hides ALL screens first, then shows only
// the one matching the given id.
// Called whenever we need to navigate between screens.
// =============================================
function showScreen(id) {
  // Get all elements with class "screen"
  const screens = document.querySelectorAll('.screen');

  // Loop through each screen and remove "active" class
  // This hides all screens at once
  screens.forEach(screen => screen.classList.remove('active'));

  // Find the specific screen we want and add "active"
  // This makes only that screen visible
  document.getElementById(id).classList.add('active');
}

// =============================================
// THEME BUTTONS
// This sets up click events for all 5 theme buttons.
// When a theme button is clicked:
// 1. All buttons lose the "active" class
// 2. The clicked button gets "active" class
// 3. The settings object updates with the new theme
// =============================================

// Get all elements with class "theme-btn"
const themeBtns = document.querySelectorAll('.theme-btn');

// Loop through each theme button and attach a click event
themeBtns.forEach(btn => {
  btn.addEventListener('click', () => {

    // Remove "active" from all theme buttons first
    themeBtns.forEach(b => b.classList.remove('active'));

    // Add "active" to the one that was clicked
    btn.classList.add('active');

    // Save the selected theme to settings
    // data-theme is the attribute we put on each button in HTML
    settings.theme = btn.dataset.theme;
  });
});

// =============================================
// PILL BUTTONS (Difficulty, Players, Timer)
// This sets up click events for all pill button groups.
// Each group works independently — clicking a pill
// in one group doesn't affect the other groups.
// =============================================

// Get all three pill groups by their id
const difficultyGroup = document.getElementById('difficulty-group');
const playersGroup    = document.getElementById('players-group');
const timerGroup      = document.getElementById('timer-group');

// This helper function handles any pill group.
// It takes the group element and the setting key to update.
function setupPillGroup(group, settingKey) {

  // Get all pill buttons inside this group
  const pills = group.querySelectorAll('.pill');

  // Attach a click event to each pill
  pills.forEach(pill => {
    pill.addEventListener('click', () => {

      // Remove "active" from all pills in this group
      pills.forEach(p => p.classList.remove('active'));

      // Add "active" to the clicked pill
      pill.classList.add('active');

      // Read the data-value attribute and save to settings
      // We use Number() to convert "1" or "2" to a real number
      // for the players setting, strings work fine for others
      let value = pill.dataset.value;
      if (settingKey === 'players') value = Number(value);
      settings[settingKey] = value;

      // =============================================
      // SPECIAL CASE — Timer setting
      // When the player clicks "Countdown", show the
      // custom time input box below the timer row.
      // When "Count Up" is clicked, hide it again.
      // =============================================
      if (settingKey === 'timerMode') {
        const wrap = document.getElementById('countdown-wrap');
        if (value === 'countdown') {
          wrap.classList.add('show');    // show the input
        } else {
          wrap.classList.remove('show'); // hide the input
        }
      }

    });
  });
}

// Connect each pill group to its setting key
setupPillGroup(difficultyGroup, 'difficulty');
setupPillGroup(playersGroup,    'players');
setupPillGroup(timerGroup,      'timerMode');

// =============================================
// parseTimeInput(raw)
// Converts what the player typed into seconds.
// Accepts two formats:
// - Plain number: "90" → 90 seconds
// - mm:ss format: "1:30" → 90 seconds
// Returns null if the input is invalid.
// Minimum allowed time is 5 seconds.
// =============================================
function parseTimeInput(raw) {

  // If nothing was typed, return null (invalid)
  if (!raw) return null;

  // Check if the input contains a colon — mm:ss format
  if (raw.includes(':')) {
    const parts = raw.split(':');         // split by colon
    if (parts.length !== 2) return null;  // must be exactly 2 parts

    const minutes = parseInt(parts[0]);
    const secs    = parseInt(parts[1]);

    // If either part is not a number, return null
    if (isNaN(minutes) || isNaN(secs)) return null;

    return (minutes * 60) + secs; // convert to total seconds
  }

  // Plain number format — just parse it directly
  const n = parseInt(raw);
  if (isNaN(n)) return null;
  return n;
}

// =============================================
// handleStartBtn()
// Called when the Start Game button is clicked.
// Does three things in order:
// 1. If countdown mode — validates the time input
// 2. If 2 players — goes to the name entry screen
// 3. If 1 player — starts the game directly
// =============================================
function handleStartBtn() {

  // STEP 1 — Validate countdown input if needed
  if (settings.timerMode === 'countdown') {
    const input  = document.getElementById('countdown-input');
    const raw    = input.value.trim();
    const parsed = parseTimeInput(raw);

    // If invalid or less than 5 seconds — show error
    if (!parsed || parsed < 5) {
      // Turn the input border red to signal an error
      input.style.borderColor = 'var(--danger)';
      input.placeholder = 'Enter a valid time!';
      return; // stop here — don't proceed
    }

    // Valid time — reset the input style and save the value
    input.style.borderColor = '';
    settings.customCountdown = parsed;
  }

  // STEP 2 — If 2 players, go to name entry screen
  if (settings.players === 2) {
    showScreen('name-screen');
    // Focus the first input so player can type right away
    document.getElementById('name-p1').focus();
    return;
  }

  // STEP 3 — 1 player, start the game directly
  // Reset names to defaults for single player
  playerNames = ['Player 1', 'Player 2'];
  startGame(); // this function will be built in a later step
}

// =============================================
// Connect the Start Game button to handleStartBtn
// This runs handleStartBtn() every time the
// button is clicked.
// =============================================
document.getElementById('start-btn').addEventListener('click', handleStartBtn);

// =============================================
// confirmNames()
// Called when the Continue button is clicked
// on the name entry screen.
// Validates that both name fields are filled.
// If valid — saves names and starts the game.
// If invalid — shows a warning message.
// =============================================
function confirmNames() {

  // Read what was typed in each input field
  // .trim() removes any accidental spaces
  const n1 = document.getElementById('name-p1').value.trim();
  const n2 = document.getElementById('name-p2').value.trim();

  // Get the warning message element
  const warn = document.getElementById('name-warn');

  // If either field is empty — show warning and stop
  if (!n1 || !n2) {
    warn.classList.add('show'); // makes warning visible
    return;                     // stop here — don't proceed
  }

  // Both fields are filled — hide warning just in case
  warn.classList.remove('show');

  // Save the names to our playerNames array
  // Index 0 = Player 1, Index 1 = Player 2
  playerNames[0] = n1;
  playerNames[1] = n2;

  // Start the game — this function comes in a later step
  startGame();
}

// =============================================
// Connect the Continue button to confirmNames.
// Every time it's clicked, confirmNames() runs.
// =============================================
document.getElementById('continue-btn').addEventListener('click', confirmNames);

