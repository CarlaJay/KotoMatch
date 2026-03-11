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

// =============================================
// VOCABULARY BANKS
// This is the full word database for the game.
// There are 5 themes — each has 35 words.
// Every new game randomly draws from this bank
// based on difficulty:
// Easy = 6 pairs, Medium = 8 pairs, Hard = 10 pairs
// So no two games are ever the same!
//
// Each word object has 4 properties:
// emoji — a visual hint shown on the card
// en    — the English word
// jp    — the Japanese characters
// ro    — the romaji (pronunciation guide)
// =============================================
const VOCAB_BANKS = {

  // ---- 🌿 NATURE THEME ----
  nature: {
    name: 'Nature',
    icon: '🌿',
    bank: [
      { emoji:'🌿', en:'Forest',       jp:'森',         ro:'Mori'          },
      { emoji:'🌸', en:'Flower',       jp:'花',         ro:'Hana'          },
      { emoji:'🌙', en:'Moon',         jp:'月',         ro:'Tsuki'         },
      { emoji:'🌊', en:'Ocean',        jp:'海',         ro:'Umi'           },
      { emoji:'🔥', en:'Fire',         jp:'火',         ro:'Hi'            },
      { emoji:'⭐', en:'Star',         jp:'星',         ro:'Hoshi'         },
      { emoji:'🌾', en:'Field',        jp:'野原',       ro:'Nohara'        },
      { emoji:'🍂', en:'Autumn',       jp:'秋',         ro:'Aki'           },
      { emoji:'❄️', en:'Snow',         jp:'雪',         ro:'Yuki'          },
      { emoji:'🌬️', en:'Wind',         jp:'風',         ro:'Kaze'          },
      { emoji:'⛰️', en:'Mountain',     jp:'山',         ro:'Yama'          },
      { emoji:'🌈', en:'Rainbow',      jp:'虹',         ro:'Niji'          },
      { emoji:'☁️', en:'Cloud',        jp:'雲',         ro:'Kumo'          },
      { emoji:'🌩️', en:'Thunder',      jp:'雷',         ro:'Kaminari'      },
      { emoji:'🍃', en:'Leaf',         jp:'葉',         ro:'Ha'            },
      { emoji:'🌱', en:'Sprout',       jp:'芽',         ro:'Me'            },
      { emoji:'🪨', en:'Rock',         jp:'岩',         ro:'Iwa'           },
      { emoji:'💧', en:'Water',        jp:'水',         ro:'Mizu'          },
      { emoji:'🌞', en:'Sun',          jp:'太陽',       ro:'Taiyou'        },
      { emoji:'🌍', en:'Earth',        jp:'地球',       ro:'Chikyuu'       },
      { emoji:'🌫️', en:'Fog',          jp:'霧',         ro:'Kiri'          },
      { emoji:'🌻', en:'Sunflower',    jp:'ひまわり',   ro:'Himawari'      },
      { emoji:'🍄', en:'Mushroom',     jp:'キノコ',     ro:'Kinoko'        },
      { emoji:'🌴', en:'Palm Tree',    jp:'ヤシ',       ro:'Yashi'         },
      { emoji:'🦋', en:'Butterfly',    jp:'蝶',         ro:'Chou'          },
      { emoji:'🌝', en:'Full Moon',    jp:'満月',       ro:'Mangetsu'      },
      { emoji:'🌊', en:'Wave',         jp:'波',         ro:'Nami'          },
      { emoji:'🌠', en:'Shooting Star',jp:'流れ星',     ro:'Nagareboshi'   },
      { emoji:'🪸', en:'Coral',        jp:'珊瑚',       ro:'Sango'         },
      { emoji:'🌋', en:'Volcano',      jp:'火山',       ro:'Kazan'         },
      { emoji:'🍀', en:'Clover',       jp:'クローバー', ro:'Kuroobaa'      },
      { emoji:'🌺', en:'Hibiscus',     jp:'ハイビスカス',ro:'Haibisukasu'  },
      { emoji:'🏕️', en:'Camping',      jp:'キャンプ',   ro:'Kyanpu'        },
      { emoji:'🌄', en:'Sunrise',      jp:'夜明け',     ro:'Yoake'         },
      { emoji:'🪵', en:'Wood',         jp:'木材',       ro:'Mokuzai'       },
    ]
  },

  // ---- 🐶 ANIMALS THEME ----
  animals: {
    name: 'Animals',
    icon: '🐶',
    bank: [
      { emoji:'🐶', en:'Dog',          jp:'犬',         ro:'Inu'           },
      { emoji:'🐱', en:'Cat',          jp:'猫',         ro:'Neko'          },
      { emoji:'🐟', en:'Fish',         jp:'魚',         ro:'Sakana'        },
      { emoji:'🐦', en:'Bird',         jp:'鳥',         ro:'Tori'          },
      { emoji:'🐘', en:'Elephant',     jp:'象',         ro:'Zou'           },
      { emoji:'🦊', en:'Fox',          jp:'狐',         ro:'Kitsune'       },
      { emoji:'🐇', en:'Rabbit',       jp:'兎',         ro:'Usagi'         },
      { emoji:'🐻', en:'Bear',         jp:'熊',         ro:'Kuma'          },
      { emoji:'🐼', en:'Panda',        jp:'パンダ',     ro:'Panda'         },
      { emoji:'🐯', en:'Tiger',        jp:'虎',         ro:'Tora'          },
      { emoji:'🦁', en:'Lion',         jp:'ライオン',   ro:'Raion'         },
      { emoji:'🐸', en:'Frog',         jp:'蛙',         ro:'Kaeru'         },
      { emoji:'🐢', en:'Turtle',       jp:'亀',         ro:'Kame'          },
      { emoji:'🐍', en:'Snake',        jp:'蛇',         ro:'Hebi'          },
      { emoji:'🦅', en:'Eagle',        jp:'鷹',         ro:'Taka'          },
      { emoji:'🐬', en:'Dolphin',      jp:'イルカ',     ro:'Iruka'         },
      { emoji:'🐋', en:'Whale',        jp:'鯨',         ro:'Kujira'        },
      { emoji:'🦈', en:'Shark',        jp:'鮫',         ro:'Same'          },
      { emoji:'🐙', en:'Octopus',      jp:'蛸',         ro:'Tako'          },
      { emoji:'🦀', en:'Crab',         jp:'蟹',         ro:'Kani'          },
      { emoji:'🐝', en:'Bee',          jp:'蜂',         ro:'Hachi'         },
      { emoji:'🐺', en:'Wolf',         jp:'狼',         ro:'Ookami'        },
      { emoji:'🦌', en:'Deer',         jp:'鹿',         ro:'Shika'         },
      { emoji:'🦔', en:'Hedgehog',     jp:'ハリネズミ', ro:'Harinezumi'    },
      { emoji:'🦜', en:'Parrot',       jp:'オウム',     ro:'Oumu'          },
      { emoji:'🦢', en:'Swan',         jp:'白鳥',       ro:'Hakuchou'      },
      { emoji:'🐓', en:'Rooster',      jp:'鶏',         ro:'Niwatori'      },
      { emoji:'🐨', en:'Koala',        jp:'コアラ',     ro:'Koara'         },
      { emoji:'🦒', en:'Giraffe',      jp:'キリン',     ro:'Kirin'         },
      { emoji:'🦓', en:'Zebra',        jp:'シマウマ',   ro:'Shimauma'      },
      { emoji:'🐆', en:'Leopard',      jp:'豹',         ro:'Hyou'          },
      { emoji:'🦩', en:'Flamingo',     jp:'フラミンゴ', ro:'Furamingo'     },
      { emoji:'🦋', en:'Butterfly',    jp:'蝶',         ro:'Chou'          },
      { emoji:'🐗', en:'Boar',         jp:'猪',         ro:'Inoshishi'     },
      { emoji:'🦏', en:'Rhino',        jp:'サイ',       ro:'Sai'           },
    ]
  },

  // ---- 🍎 FOOD THEME ----
  food: {
    name: 'Food',
    icon: '🍎',
    bank: [
      { emoji:'🍎', en:'Apple',        jp:'りんご',     ro:'Ringo'         },
      { emoji:'🍊', en:'Orange',       jp:'みかん',     ro:'Mikan'         },
      { emoji:'🍋', en:'Lemon',        jp:'レモン',     ro:'Remon'         },
      { emoji:'🍇', en:'Grape',        jp:'ぶどう',     ro:'Budou'         },
      { emoji:'🍓', en:'Strawberry',   jp:'いちご',     ro:'Ichigo'        },
      { emoji:'🍣', en:'Sushi',        jp:'寿司',       ro:'Sushi'         },
      { emoji:'🍜', en:'Ramen',        jp:'ラーメン',   ro:'Raamen'        },
      { emoji:'🍵', en:'Tea',          jp:'お茶',       ro:'Ocha'          },
      { emoji:'🍙', en:'Rice Ball',    jp:'おにぎり',   ro:'Onigiri'       },
      { emoji:'🍰', en:'Cake',         jp:'ケーキ',     ro:'Keeki'         },
      { emoji:'🍩', en:'Donut',        jp:'ドーナツ',   ro:'Doonatsu'      },
      { emoji:'🍦', en:'Ice Cream',    jp:'アイス',     ro:'Aisu'          },
      { emoji:'🍕', en:'Pizza',        jp:'ピザ',       ro:'Piza'          },
      { emoji:'🍔', en:'Burger',       jp:'バーガー',   ro:'Baagaa'        },
      { emoji:'🥗', en:'Salad',        jp:'サラダ',     ro:'Sarada'        },
      { emoji:'🍱', en:'Bento',        jp:'弁当',       ro:'Bentou'        },
      { emoji:'🍛', en:'Curry',        jp:'カレー',     ro:'Karee'         },
      { emoji:'🥟', en:'Dumpling',     jp:'餃子',       ro:'Gyouza'        },
      { emoji:'🍤', en:'Shrimp',       jp:'エビ',       ro:'Ebi'           },
      { emoji:'🥚', en:'Egg',          jp:'卵',         ro:'Tamago'        },
      { emoji:'🧀', en:'Cheese',       jp:'チーズ',     ro:'Chiizu'        },
      { emoji:'🥩', en:'Meat',         jp:'肉',         ro:'Niku'          },
      { emoji:'🥦', en:'Broccoli',     jp:'ブロッコリー',ro:'Burokkorii'   },
      { emoji:'🥕', en:'Carrot',       jp:'にんじん',   ro:'Ninjin'        },
      { emoji:'🧅', en:'Onion',        jp:'玉ねぎ',     ro:'Tamanegi'      },
      { emoji:'🍑', en:'Peach',        jp:'もも',       ro:'Momo'          },
      { emoji:'🍒', en:'Cherry',       jp:'さくらんぼ', ro:'Sakuranbo'     },
      { emoji:'🥭', en:'Mango',        jp:'マンゴー',   ro:'Mangoo'        },
      { emoji:'🍍', en:'Pineapple',    jp:'パイナップル',ro:'Painappuru'   },
      { emoji:'🍌', en:'Banana',       jp:'バナナ',     ro:'Banana'        },
      { emoji:'🥝', en:'Kiwi',         jp:'キウイ',     ro:'Kiui'          },
      { emoji:'🍈', en:'Melon',        jp:'メロン',     ro:'Meron'         },
      { emoji:'🫐', en:'Blueberry',    jp:'ブルーベリー',ro:'Buruuberii'   },
      { emoji:'🍟', en:'Fries',        jp:'フライ',     ro:'Furai'         },
      { emoji:'🧆', en:'Falafel',      jp:'ファラフェル',ro:'Faraferu'     },
    ]
  },

  // ---- 🏠 DAILY LIFE THEME ----
  daily: {
    name: 'Daily Life',
    icon: '🏠',
    bank: [
      { emoji:'🏠', en:'House',        jp:'家',         ro:'Ie'            },
      { emoji:'📚', en:'Book',         jp:'本',         ro:'Hon'           },
      { emoji:'🚗', en:'Car',          jp:'車',         ro:'Kuruma'        },
      { emoji:'✈️', en:'Plane',        jp:'飛行機',     ro:'Hikouki'       },
      { emoji:'📱', en:'Phone',        jp:'電話',       ro:'Denwa'         },
      { emoji:'⏰', en:'Clock',        jp:'時計',       ro:'Tokei'         },
      { emoji:'🎒', en:'Bag',          jp:'鞄',         ro:'Kaban'         },
      { emoji:'💡', en:'Light',        jp:'電気',       ro:'Denki'         },
      { emoji:'🪑', en:'Chair',        jp:'椅子',       ro:'Isu'           },
      { emoji:'🛏️', en:'Bed',          jp:'ベッド',     ro:'Beddo'         },
      { emoji:'🚪', en:'Door',         jp:'ドア',       ro:'Doa'           },
      { emoji:'🪟', en:'Window',       jp:'窓',         ro:'Mado'          },
      { emoji:'🖥️', en:'Computer',     jp:'パソコン',   ro:'Pasokon'       },
      { emoji:'📺', en:'TV',           jp:'テレビ',     ro:'Terebi'        },
      { emoji:'🎵', en:'Music',        jp:'音楽',       ro:'Ongaku'        },
      { emoji:'📷', en:'Camera',       jp:'カメラ',     ro:'Kamera'        },
      { emoji:'✏️', en:'Pencil',       jp:'鉛筆',       ro:'Enpitsu'       },
      { emoji:'📝', en:'Notebook',     jp:'ノート',     ro:'Nooto'         },
      { emoji:'🧹', en:'Broom',        jp:'ほうき',     ro:'Houki'         },
      { emoji:'🪴', en:'Plant',        jp:'植物',       ro:'Shokubutsu'    },
      { emoji:'🛁', en:'Bathtub',      jp:'お風呂',     ro:'Ofuro'         },
      { emoji:'🪥', en:'Toothbrush',   jp:'歯ブラシ',   ro:'Haburashi'     },
      { emoji:'🧺', en:'Laundry',      jp:'洗濯',       ro:'Sentaku'       },
      { emoji:'🔑', en:'Key',          jp:'鍵',         ro:'Kagi'          },
      { emoji:'🪞', en:'Mirror',       jp:'鏡',         ro:'Kagami'        },
      { emoji:'🧸', en:'Teddy Bear',   jp:'ぬいぐるみ', ro:'Nuigurumi'     },
      { emoji:'🎮', en:'Game',         jp:'ゲーム',     ro:'Geemu'         },
      { emoji:'🖊️', en:'Pen',          jp:'ペン',       ro:'Pen'           },
      { emoji:'🔦', en:'Flashlight',   jp:'懐中電灯',   ro:'Kaichuudentou' },
      { emoji:'🧲', en:'Magnet',       jp:'磁石',       ro:'Jishaku'       },
      { emoji:'💼', en:'Briefcase',    jp:'ブリーフケース',ro:'Buriifukeesu'},
      { emoji:'🛒', en:'Cart',         jp:'カート',     ro:'Kaato'         },
      { emoji:'🚿', en:'Shower',       jp:'シャワー',   ro:'Shawaa'        },
      { emoji:'🧴', en:'Lotion',       jp:'ローション', ro:'Rooshon'       },
      { emoji:'🗑️', en:'Trash Can',    jp:'ゴミ箱',     ro:'Gomibako'      },
    ]
  },

  // ---- 🤲 BODY & SELF THEME ----
  body: {
    name: 'Body & Self',
    icon: '🤲',
    bank: [
      { emoji:'👁️', en:'Eye',          jp:'目',         ro:'Me'            },
      { emoji:'👃', en:'Nose',         jp:'鼻',         ro:'Hana'          },
      { emoji:'👄', en:'Mouth',        jp:'口',         ro:'Kuchi'         },
      { emoji:'👂', en:'Ear',          jp:'耳',         ro:'Mimi'          },
      { emoji:'🦷', en:'Tooth',        jp:'歯',         ro:'Ha'            },
      { emoji:'💪', en:'Arm',          jp:'腕',         ro:'Ude'           },
      { emoji:'🦵', en:'Leg',          jp:'足',         ro:'Ashi'          },
      { emoji:'🤲', en:'Hands',        jp:'手',         ro:'Te'            },
      { emoji:'🫀', en:'Heart',        jp:'心臓',       ro:'Shinzou'       },
      { emoji:'🧠', en:'Brain',        jp:'脳',         ro:'Nou'           },
      { emoji:'🦴', en:'Bone',         jp:'骨',         ro:'Hone'          },
      { emoji:'😊', en:'Happy',        jp:'嬉しい',     ro:'Ureshii'       },
      { emoji:'😢', en:'Sad',          jp:'悲しい',     ro:'Kanashii'      },
      { emoji:'😡', en:'Angry',        jp:'怒り',       ro:'Ikari'         },
      { emoji:'😴', en:'Sleepy',       jp:'眠い',       ro:'Nemui'         },
      { emoji:'😰', en:'Nervous',      jp:'緊張',       ro:'Kinchou'       },
      { emoji:'🤒', en:'Sick',         jp:'病気',       ro:'Byouki'        },
      { emoji:'💊', en:'Medicine',     jp:'薬',         ro:'Kusuri'        },
      { emoji:'🏃', en:'Run',          jp:'走る',       ro:'Hashiru'       },
      { emoji:'🧘', en:'Relax',        jp:'リラックス', ro:'Rirakkusu'     },
      { emoji:'😎', en:'Cool',         jp:'かっこいい', ro:'Kakkoii'       },
      { emoji:'🥱', en:'Yawn',         jp:'あくび',     ro:'Akubi'         },
      { emoji:'🤔', en:'Think',        jp:'考える',     ro:'Kangaeru'      },
      { emoji:'😍', en:'Love',         jp:'大好き',     ro:'Daisuki'       },
      { emoji:'🙏', en:'Pray',         jp:'祈る',       ro:'Inoru'         },
      { emoji:'💃', en:'Dance',        jp:'踊る',       ro:'Odoru'         },
      { emoji:'🎤', en:'Sing',         jp:'歌う',       ro:'Utau'          },
      { emoji:'👀', en:'Look',         jp:'見る',       ro:'Miru'          },
      { emoji:'🩸', en:'Blood',        jp:'血',         ro:'Chi'           },
      { emoji:'🤗', en:'Hug',          jp:'抱擁',       ro:'Houyou'        },
      { emoji:'💆', en:'Rest',         jp:'休む',       ro:'Yasumu'        },
      { emoji:'🧖', en:'Refresh',      jp:'リフレッシュ',ro:'Rifuresshu'   },
      { emoji:'🤸', en:'Stretch',      jp:'ストレッチ', ro:'Sutoreccchi'   },
      { emoji:'😤', en:'Proud',        jp:'誇り',       ro:'Hokori'        },
      { emoji:'🥳', en:'Celebrate',    jp:'お祝い',     ro:'Oiwai'         },
    ]
  },

}; // end VOCAB_BANKS

// =============================================
// DIFFICULTY CONFIG
// Defines the number of columns, pairs, and
// hints available for each difficulty level.
// The game reads from this when building the board.
// =============================================
const DIFF = {
  easy:   { cols: 4, pairs: 6,  hints: 3 },
  medium: { cols: 4, pairs: 8,  hints: 2 },
  hard:   { cols: 5, pairs: 10, hints: 1 },
};

// =============================================
// shuffle(arr)
// Takes any array and returns a NEW shuffled copy.
// Uses the Fisher-Yates algorithm — the most
// reliable and unbiased shuffle method.
// The original array is NOT changed.
// =============================================
function shuffle(arr) {
  // Make a copy so we don't modify the original
  let a = [...arr];

  // Loop from the end of the array backwards
  for (let i = a.length - 1; i > 0; i--) {

    // Pick a random index from 0 to i
    const j = Math.floor(Math.random() * (i + 1));

    // Swap the current element with the random one
    [a[i], a[j]] = [a[j], a[i]];
  }

  return a; // return the shuffled copy
}

// =============================================
// GAME STATE VARIABLES
// These track everything that happens during
// a game session. They reset every new game.
// =============================================
let flipped      = [];    // cards currently flipped (max 2 at a time)
let matched      = 0;     // how many pairs have been matched
let moves        = 0;     // total card flips made
let locked       = false; // when true, clicks are ignored
let seconds      = 0;     // timer counter
let score        = 0;     // current total score
let combo        = 0;     // consecutive match streak
let hintsLeft    = 3;     // hints remaining this game
let hintCooldown = false; // true when hint is on cooldown
let mistakeCount = 0;     // total wrong matches made
let totalPairs   = 0;     // total pairs to match this game
let currentPlayer= 1;     // whose turn it is (1 or 2)
let p1Score      = 0;     // player 1 total score
let p2Score      = 0;     // player 2 total score
let p1Combo      = 0;     // player 1 combo streak
let p2Combo      = 0;     // player 2 combo streak
let timerInterval= null;  // stores the setInterval so we can stop it
let sessionScores= [];    // top 5 scores this session
let activeVocab  = [];    // words drawn for the current game

// =============================================
// startGame()
// The main function that kicks off a new game.
// Resets all state, sets up the screen,
// builds the board, and shows the preview.
// Called by handleStartBtn() and confirmNames().
// =============================================
function startGame() {

  // -- RESET ALL STATE VARIABLES --
  flipped       = [];
  matched       = 0;
  moves         = 0;
  locked        = false;
  seconds       = 0;
  score         = 0;
  combo         = 0;
  mistakeCount  = 0;
  currentPlayer = 1;
  p1Score       = 0;
  p2Score       = 0;
  p1Combo       = 0;
  p2Combo       = 0;

  // Set hints and pairs from difficulty config
  hintsLeft  = DIFF[settings.difficulty].hints;
  totalPairs = DIFF[settings.difficulty].pairs;

  // Reset hint cooldown flag
  hintCooldown = false;

  // Stop any timer that might still be running
  clearInterval(timerInterval);

  // Reset the timer display to 0s
  const timerEl = document.getElementById('timer-value');
  timerEl.textContent = '0s';
  timerEl.classList.remove('urgent');

  // -- SETUP SCREENS AND UI --
  showScreen('game-screen');  // switch to game screen
  updateStats();              // reset all stat boxes to 0
  setupPlayers();             // show/hide player panels
  resetVocabLog();            // clear the vocabulary log
  buildBoard();               // create and place all cards
  showPreview();              // show 3-second card preview
}

// =============================================
// restartGame()
// Called when Restart button or Play Again
// is clicked. Cleans up then starts fresh.
// =============================================
function restartGame() {
  hideOverlays();              // close any open overlay
  clearInterval(timerInterval);// stop the timer
  stopConfetti();              // stop confetti if running
  startGame();                 // start a brand new game
}

// =============================================
// setupPlayers()
// Shows or hides the 2-player panels based
// on settings. Updates player name labels.
// =============================================
function setupPlayers() {
  const wrapper = document.getElementById('players-wrapper');

  // Update both player name labels with actual names
  document.getElementById('p1-name-label').textContent = playerNames[0];
  document.getElementById('p2-name-label').textContent = playerNames[1];

  if (settings.players === 2) {
    // Show the player panels for 2-player mode
    wrapper.style.display = 'flex';

    // Reset score and combo displays
    document.getElementById('p1-score').textContent = '0';
    document.getElementById('p2-score').textContent = '0';
    document.getElementById('p1-info').textContent  = '';
    document.getElementById('p2-info').textContent  = '';

    // Set Player 1 as the starting active turn
    setTurn(1);

  } else {
    // Hide player panels for 1-player mode
    wrapper.style.display = 'none';
  }
}

// =============================================
// setTurn(p)
// Switches the active turn to player p (1 or 2).
// Adds the active-turn class to the correct panel
// and removes it from the other.
// =============================================
function setTurn(p) {
  currentPlayer = p;

  // Get both panels
  const p1Panel = document.getElementById('p1-panel');
  const p2Panel = document.getElementById('p2-panel');

  // Toggle active-turn class based on whose turn it is
  if (p === 1) {
    p1Panel.classList.add('active-turn');
    p2Panel.classList.remove('active-turn');
  } else {
    p2Panel.classList.add('active-turn');
    p1Panel.classList.remove('active-turn');
  }
}

// =============================================
// buildBoard()
// Creates all the cards and places them
// on the game board.
// 1. Gets the vocab bank for the selected theme
// 2. Randomly draws the right number of words
// 3. Creates one English + one Japanese card per word
// 4. Shuffles the full deck
// 5. Renders cards into the board grid
// =============================================
function buildBoard() {
  const board = document.getElementById('board');
  board.innerHTML = ''; // clear any previous cards

  const diff = DIFF[settings.difficulty];
  const bank = VOCAB_BANKS[settings.theme].bank;

  // Randomly draw the required number of words
  // shuffle the bank first then take the first N words
  activeVocab = shuffle([...bank])
    .slice(0, diff.pairs)
    .map((v, i) => ({ ...v, id: i + 1 })); // add an id to each word

  // Create two cards for each word — English and Japanese
  let deck = [];
  activeVocab.forEach(vocab => {
    deck.push({ ...vocab, cardType: 'english'  });
    deck.push({ ...vocab, cardType: 'japanese' });
  });

  // Shuffle the full deck so cards are in random positions
  deck = shuffle(deck);

  // Set the grid columns based on difficulty
  const cardW = 'clamp(95px, 13vw, 130px)';
  const cardH = 'clamp(72px, 9vw, 100px)';
  board.style.gridTemplateColumns =
    `repeat(${diff.cols}, ${cardW})`;

  // Create and append each card element
  deck.forEach((item, index) => {
    const card = document.createElement('div');
    card.classList.add('card', 'deal-in');

    // Set card size
    card.style.width  = cardW;
    card.style.height = cardH;

    // Staggered deal-in animation — each card
    // appears slightly after the previous one
    card.style.animationDelay = `${index * 0.045}s`;

    // Store the vocab id and card type on the element
    // so we can read them when checking for a match
    card.dataset.id       = item.id;
    card.dataset.cardType = item.cardType;

    // Build the card's inner HTML based on card type
    const frontClass = item.cardType === 'english'
      ? 'eng-card' : 'jp-card';

    // English card shows: emoji + English word + "English" label
    // Japanese card shows: emoji + Japanese + romaji + "日本語" label
    const frontContent = item.cardType === 'english'
      ? `<span class="cemoji">${item.emoji}</span>
         <span class="cword">${item.en}</span>
         <span class="clang">English</span>`
      : `<span class="cemoji">${item.emoji}</span>
         <span class="cword">${item.jp}</span>
         <span class="cromaji">${item.ro}</span>
         <span class="clang">日本語</span>`;

    // Put it all together — back face + front face
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-back">♦</div>
        <div class="card-front ${frontClass}">
          ${frontContent}
        </div>
      </div>`;

    // Attach click event — calls onCardClick when clicked
    card.addEventListener('click', () => onCardClick(card));

    board.appendChild(card);
  });

  // Update pairs display e.g. "0/6"
  document.getElementById('pairs-value').textContent =
    `0/${totalPairs}`;

  // Reset hint button label and state
  const hintBtn = document.getElementById('hint-btn');
  hintBtn.disabled = false;
  hintBtn.classList.remove('cooling');
  hintBtn.textContent = `💡 Hint (${hintsLeft})`;
}

// =============================================
// showPreview()
// Shows all cards face-up for 3 seconds before
// the game starts so the player can memorize them.
// Board is locked during this time.
// =============================================
function showPreview() {
  const overlay = document.getElementById('preview-overlay');
  const numEl   = document.getElementById('preview-num');

  // Show the overlay and lock the board
  overlay.classList.add('show');
  locked = true;

  // Flip all cards face-up using the preview class
  document.querySelectorAll('.card').forEach(c =>
    c.classList.add('preview')
  );

  // Countdown from 3 to 1
  let count = 3;
  numEl.textContent = count;

  const interval = setInterval(() => {
    count--;

    if (count <= 0) {
      // Countdown finished — hide overlay and unlock
      clearInterval(interval);
      document.querySelectorAll('.card').forEach(c =>
        c.classList.remove('preview')
      );
      overlay.classList.remove('show');
      locked = false;

    } else {
      // Update the number with a pop animation
      numEl.textContent = count;
      numEl.style.animation = 'none';
      numEl.offsetHeight; // forces browser to reset animation
      numEl.style.animation =
        'pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }
  }, 1000);
}

// =============================================
// onCardClick(card)
// Called every time a card is clicked.
// Handles flipping logic and triggers match check.
// =============================================
function onCardClick(card) {

  // Ignore click if board is locked
  if (locked) return;

  // Ignore if card is already flipped or matched
  if (card.classList.contains('flipped')) return;
  if (card.classList.contains('matched')) return;

  // Start the timer on the very first card flip
  if (moves === 0 && flipped.length === 0) startTimer();

  // Flip the card face-up
  card.classList.add('flipped');

  // Add to flipped array
  flipped.push(card);

  // If two cards are now flipped — check for a match
  if (flipped.length === 2) {
    moves++;           // count this as a move
    updateStats();     // update the moves display
    checkMatch();      // check if they match
  }
}

// =============================================
// checkMatch()
// Checks if the two flipped cards are a valid match.
// A match requires: same vocab id AND one English
// card + one Japanese card.
// =============================================
function checkMatch() {
  const cardA = flipped[0];
  const cardB = flipped[1];

  // Check if both cards share the same vocab id
  const sameId = cardA.dataset.id === cardB.dataset.id;

  // Check if they are different card types
  // (one English and one Japanese)
  const diffType =
    cardA.dataset.cardType !== cardB.dataset.cardType;

  const isMatch = sameId && diffType;

  if (isMatch) {
    // ── MATCH! ──

    // Mark both cards as matched — they stay face-up
    cardA.classList.add('matched');
    cardB.classList.add('matched');

    // Increase matched count and combo streak
    matched++;
    combo++;

    // Calculate score — base 100 + combo bonus
    const points = 100 + (combo > 1 ? (combo - 1) * 50 : 0);
    score += points;

    // In 2-player mode — add to the active player's score
    if (settings.players === 2) {
      if (currentPlayer === 1) {
        p1Score += points;
        p1Combo  = combo;
      } else {
        p2Score += points;
        p2Combo  = combo;
      }
      updatePlayerPanels(); // update the player score displays
    }

    // Find the matched vocab and add it to the log
    const vocab = activeVocab.find(v => v.id == cardA.dataset.id);
    if (vocab) addVocabLog(vocab);

    // Play match sound
    playSound('match');

    // Clear flipped array — ready for next two cards
    flipped = [];
    updateStats();

    // Check if all pairs are matched — trigger win!
    if (matched === totalPairs) {
      setTimeout(onWin, 400);
    }

  } else {
    // ── MISMATCH! ──

    // Lock the board so no more clicks during shake
    locked = true;

    // Increase mistake count and reset combo
    mistakeCount++;
    combo = 0;

    // Reset active player's combo in 2-player mode
    if (settings.players === 2) {
      if (currentPlayer === 1) p1Combo = 0;
      else p2Combo = 0;
      updatePlayerPanels();
    }

    // Add shake animation to both cards
    cardA.classList.add('shake');
    cardB.classList.add('shake');

    // Play mismatch sound
    playSound('miss');

    // After 950ms — flip cards back and unlock board
    setTimeout(() => {
      cardA.classList.remove('flipped', 'shake');
      cardB.classList.remove('flipped', 'shake');
      flipped = [];
      locked  = false;

      // In 2-player mode — switch turns on mismatch
      if (settings.players === 2) {
        setTurn(currentPlayer === 1 ? 2 : 1);
      }
    }, 950);
  }
}

// =============================================
// useHint()
// Flashes all unmatched cards face-up briefly.
// Has a per-difficulty limit and 10s cooldown.
// =============================================
function useHint() {

  // Do nothing if no hints left, board locked, or on cooldown
  if (hintsLeft <= 0 || locked || hintCooldown) return;

  // Use one hint
  hintsLeft--;
  hintCooldown = true;
  locked = true;

  const btn = document.getElementById('hint-btn');

  // Flash all unmatched, unflipped cards face-up
  const unmatched = document.querySelectorAll(
    '.card:not(.matched):not(.flipped)'
  );
  unmatched.forEach(c => c.classList.add('preview'));

  // After 1.2 seconds — flip them back
  setTimeout(() => {
    unmatched.forEach(c => c.classList.remove('preview'));
    locked = false;
  }, 1200);

  // If no hints remaining — disable button and stop
  if (hintsLeft <= 0) {
    btn.disabled    = true;
    btn.textContent = '💡 No Hints Left';
    return;
  }

  // Start 10-second cooldown countdown
  btn.disabled = true;
  btn.classList.add('cooling');

  let cd = 10; // cooldown seconds
  btn.textContent = `💡 Hint (${hintsLeft}) — ${cd}s`;

  const cooldownInterval = setInterval(() => {
    cd--;

    if (cd <= 0) {
      // Cooldown finished — re-enable the button
      clearInterval(cooldownInterval);
      hintCooldown        = false;
      btn.disabled        = false;
      btn.classList.remove('cooling');
      btn.textContent     = `💡 Hint (${hintsLeft})`;
    } else {
      // Update the countdown in the button label
      btn.textContent = `💡 Hint (${hintsLeft}) — ${cd}s`;
    }
  }, 1000);
}

// =============================================
// TIMER FUNCTIONS
// startTimer() begins counting when first card
// is flipped. Supports count-up and countdown.
// =============================================
function startTimer() {
  clearInterval(timerInterval); // clear any existing timer

  const timerEl = document.getElementById('timer-value');

  if (settings.timerMode === 'countdown') {
    // -- COUNTDOWN MODE --
    // Starts at the player's custom time and counts down
    seconds = settings.customCountdown;
    timerEl.textContent = fmtTime(seconds);

    timerInterval = setInterval(() => {
      seconds--;
      timerEl.textContent = fmtTime(seconds);

      // Add urgent styling when 10 seconds or less remain
      if (seconds <= 10) timerEl.classList.add('urgent');

      // Time's up — trigger game over
      if (seconds <= 0) {
        clearInterval(timerInterval);
        onGameOver();
      }
    }, 1000);

  } else {
    // -- COUNT UP MODE --
    // Starts at 0 and counts up every second
    seconds = 0;
    timerEl.textContent = fmtTime(seconds);

    timerInterval = setInterval(() => {
      seconds++;
      timerEl.textContent = fmtTime(seconds);
    }, 1000);
  }
}

// Stops the timer — called on win and game over
function stopTimer() {
  clearInterval(timerInterval);
}

// Formats seconds into a readable string
// Under 60s: "45s" — 60s or more: "1:05"
function fmtTime(s) {
  if (s < 60) return `${s}s`;
  const mins = Math.floor(s / 60);
  const secs = (s % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

// =============================================
// updateStats()
// Updates all six stat boxes with current values.
// Called after every move and match.
// =============================================
function updateStats() {
  document.getElementById('score-value').textContent = score;
  document.getElementById('moves-value').textContent = moves;
  document.getElementById('pairs-value').textContent =
    `${matched}/${totalPairs}`;
  document.getElementById('combo-value').textContent =
    `×${combo || 1}`;
  document.getElementById('hints-value').textContent = hintsLeft;
}

// =============================================
// updatePlayerPanels()
// Updates the score and combo info displayed
// in each player panel during 2-player mode.
// =============================================
function updatePlayerPanels() {
  document.getElementById('p1-score').textContent = p1Score;
  document.getElementById('p2-score').textContent = p2Score;

  // Show combo info if combo is greater than 1
  document.getElementById('p1-info').textContent =
    p1Combo > 1 ? `🔥 ×${p1Combo} combo!` : '';
  document.getElementById('p2-info').textContent =
    p2Combo > 1 ? `🔥 ×${p2Combo} combo!` : '';
}

// =============================================
// VOCAB LOG FUNCTIONS
// resetVocabLog() clears the log at game start.
// addVocabLog() adds a new row when a pair is matched.
// =============================================
function resetVocabLog() {
  // Reset the log container back to the placeholder
  document.getElementById('vocab-log-entries').innerHTML =
    '<div id="vocab-ph" class="vocab-ph">' +
    'Match a pair to see vocabulary here!</div>';
}

function addVocabLog(vocab) {
  const container = document.getElementById('vocab-log-entries');

  // Remove placeholder text on first match
  const ph = document.getElementById('vocab-ph');
  if (ph) ph.remove();

  // Create a new row for this matched word
  const row = document.createElement('div');
  row.classList.add('vocab-row');
  row.innerHTML =
    `<span class="ve">${vocab.emoji}</span>
     <span class="ven">${vocab.en}</span>
     <span class="vjp">${vocab.jp}</span>
     <span class="vro">(${vocab.ro})</span>`;

  container.appendChild(row);

  // Fade the row in after a tiny delay
  // so the transition actually plays
  setTimeout(() => row.classList.add('show'), 50);
}

// =============================================
// renderLB()
// Updates the session leaderboard panel.
// Shows top 5 scores — session only, no saving.
// =============================================
function renderLB() {
  const el = document.getElementById('lb-entries');

  if (sessionScores.length === 0) {
    el.innerHTML =
      '<div class="lb-empty">No scores yet this session!</div>';
    return;
  }

  // Build a row for each score entry
  el.innerHTML = sessionScores.map((entry, i) => `
    <div class="lb-row">
      <span class="lb-rank">#${i + 1}</span>
      <span class="lb-score">${entry.score} pts</span>
      <span class="lb-meta">
        ${entry.moves} moves · ${entry.time}
      </span>
    </div>
  `).join('');
}

// =============================================
// hideOverlays()
// Hides all overlays at once.
// Called when restarting or going back to menu.
// =============================================
function hideOverlays() {
  document.querySelectorAll('.overlay').forEach(o =>
    o.classList.remove('show')
  );
}

// =============================================
// Connect action buttons to their functions
// =============================================

// Hint button
document.getElementById('hint-btn')
  .addEventListener('click', useHint);

// Restart button
document.getElementById('restart-btn')
  .addEventListener('click', restartGame);

// Back to menu button
document.getElementById('back-btn')
  .addEventListener('click', () => {
    clearInterval(timerInterval); // stop timer
    hideOverlays();               // close any overlays
    stopConfetti();               // stop confetti
    showScreen('menu-screen');    // go back to menu
  });

// =============================================
// onWin()
// Called when all pairs are matched.
// Stops timer, calculates results, shows
// the win overlay with all stats and vocab.
// =============================================
function onWin() {
  stopTimer();      // stop the timer
  playSound('win'); // play win sound
  launchConfetti(); // launch confetti

  // Calculate elapsed time
  // Count up: use seconds directly
  // Countdown: subtract remaining from total
  const elapsed = settings.timerMode === 'countdown'
    ? settings.customCountdown - seconds
    : seconds;
  const timeStr = fmtTime(elapsed);

  // Add this round to the session leaderboard
  sessionScores.push({ score, moves, time: timeStr });

  // Sort by highest score and keep top 5
  sessionScores.sort((a, b) => b.score - a.score);
  sessionScores = sessionScores.slice(0, 5);
  renderLB(); // update the leaderboard panel

  // Calculate star rating based on mistakes
  let stars;
  if      (mistakeCount === 0) stars = '⭐⭐⭐';
  else if (mistakeCount <= 3)  stars = '⭐⭐';
  else                         stars = '⭐';

  // Determine winner name and sub message
  let winnerName, subMsg;

  if (settings.players === 2) {
    // 2-player mode — compare scores
    if (p1Score > p2Score) {
      winnerName = playerNames[0];
      subMsg     = `${playerNames[0]} wins! 🎉`;
    } else if (p2Score > p1Score) {
      winnerName = playerNames[1];
      subMsg     = `${playerNames[1]} wins! 🎉`;
    } else {
      winnerName = 'Both of you';
      subMsg     = "It's a tie! 🤝";
    }
  } else {
    // 1-player mode
    winnerName = playerNames[0];
    subMsg     = 'All pairs matched!';
  }

  // Update all win overlay elements
  document.getElementById('win-name').textContent  = winnerName;
  document.getElementById('win-score').textContent = score;
  document.getElementById('win-moves').textContent = moves;
  document.getElementById('win-time').textContent  = timeStr;
  document.getElementById('win-stars').textContent = stars;
  document.getElementById('win-sub').textContent   = subMsg;

  // Show or hide perfect badge
  const badge = document.getElementById('perfect-badge');
  if (mistakeCount === 0) {
    badge.classList.add('show');
  } else {
    badge.classList.remove('show');
  }

  // Build vocabulary review chips
  // One chip per matched word showing:
  // emoji English → Japanese (romaji)
  const chipsContainer = document.getElementById('win-vocab-chips');
  chipsContainer.innerHTML = '';
  activeVocab.forEach(vocab => {
    const chip = document.createElement('div');
    chip.classList.add('vocab-chip');
    chip.innerHTML =
      `${vocab.emoji} ${vocab.en} → ` +
      `<span>${vocab.jp}</span> (${vocab.ro})`;
    chipsContainer.appendChild(chip);
  });

  // Show the win overlay
  document.getElementById('win-overlay').classList.add('show');
}

// =============================================
// onGameOver()
// Called when countdown timer hits zero.
// Shows the game over overlay.
// =============================================
function onGameOver() {
  stopTimer();
  playSound('gameover');
  document.getElementById('go-msg').textContent =
    `Better luck next time, ${playerNames[0]}!`;
  document.getElementById('gameover-overlay').classList.add('show');
}

// =============================================
// goMenu()
// Goes back to the menu screen.
// Cleans up timer, overlays, and confetti.
// =============================================
function goMenu() {
  clearInterval(timerInterval);
  hideOverlays();
  stopConfetti();
  showScreen('menu-screen');
}

// =============================================
// SOUND EFFECTS
// Uses Web Audio API to generate sounds
// programmatically — no audio files needed.
// Each sound is made by creating an oscillator
// and shaping its frequency and volume.
// =============================================
let audioCtx = null;

// Gets or creates the audio context
// We reuse one context for the whole game
function getAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext ||
                    window.webkitAudioContext)();
  }
  return audioCtx;
}

function playSound(type) {
  try {
    const ctx = getAudio();
    const o   = ctx.createOscillator(); // creates the tone
    const g   = ctx.createGain();       // controls the volume
    o.connect(g);
    g.connect(ctx.destination); // connects to speakers
    const t = ctx.currentTime;

    if (type === 'match') {
      // Two short ascending tones — positive feeling
      o.frequency.setValueAtTime(523, t);
      o.frequency.setValueAtTime(659, t + 0.1);
      g.gain.setValueAtTime(0.1, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    }

    if (type === 'miss') {
      // Short low buzzer — negative feedback
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(200, t);
      g.gain.setValueAtTime(0.06, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    }

    if (type === 'win') {
      // Three ascending tones — celebration
      o.frequency.setValueAtTime(523, t);
      o.frequency.setValueAtTime(659, t + 0.15);
      o.frequency.setValueAtTime(784, t + 0.3);
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    }

    if (type === 'gameover') {
      // Two descending tones — defeated feeling
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(300, t);
      o.frequency.setValueAtTime(200, t + 0.2);
      g.gain.setValueAtTime(0.1, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    }

    o.start(t);
    o.stop(t + 0.6);

  } catch(e) {
    // If audio fails silently — game still works
  }
}

// =============================================
// CONFETTI
// Canvas-based confetti animation on win.
// Uses colored rectangles in palette colors.
// No libraries needed.
// =============================================
let confettiId = null; // stores animation frame id

function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  canvas.style.display = 'block';
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');

  // Palette colors for the confetti pieces
  const colors = [
    '#FDB5CE', // pink
    '#3B9797', // teal
    '#a8dede', // light teal
    '#f5eef2', // near white
    '#16476A', // ocean
  ];

  // Create 130 confetti particles with random properties
  const particles = Array.from({ length: 130 }, () => ({
    x:   Math.random() * canvas.width,
    y:   Math.random() * -canvas.height, // start above screen
    r:   Math.random() * 8 + 4,          // size 4–12px
    c:   colors[Math.floor(Math.random() * colors.length)],
    vx:  (Math.random() - 0.5) * 3,      // horizontal drift
    vy:  Math.random() * 4 + 2,          // fall speed
    rot: Math.random() * 360,            // starting rotation
    rv:  (Math.random() - 0.5) * 6,      // spin speed
  }));

  let frame = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each particle as a rotated rectangle
    particles.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.5);
      ctx.restore();

      // Update position and rotation each frame
      p.x   += p.vx;
      p.y   += p.vy;
      p.rot += p.rv;

      // Reset particle to top when it falls off screen
      if (p.y > canvas.height) {
        p.y = -20;
        p.x = Math.random() * canvas.width;
      }
    });

    // Run for 300 frames then stop
    frame++;
    if (frame < 300) {
      confettiId = requestAnimationFrame(draw);
    } else {
      stopConfetti();
    }
  }

  draw();
}

function stopConfetti() {
  if (confettiId) {
    cancelAnimationFrame(confettiId);
    confettiId = null;
  }
  const canvas = document.getElementById('confetti-canvas');
  canvas.style.display = 'none';
}