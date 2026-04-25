import { useState, useRef, useEffect } from "react";

const T = {
  bg:       "#17120f",
  surface:  "#211810",
  surface2: "#2a1e16",
  border:   "#3a2820",
  accent:   "#f4845f",
  accentLo: "#2e1a13",
  accentHi: "#f9b49a",
  muted:    "#6b4f42",
  text:     "#f0ddd4",
  textDim:  "#8a6a5e",
  wrong:    "#e05c5c",
  wrongLo:  "#2e1313",
  ok:       "#6BCB77",
  okLo:     "#0e2e14",
};

const RAINBOW = ["#FF5A5A","#FF8C42","#FFD166","#6BCB77","#4D9DE0","#7B5EA7","#C77DFF"];
const BACKEND = "http://localhost:8000";
const MODE_WORD = "word";
const MODE_PHONEME = "phoneme";

// ─── Phoneme knowledge base ───────────────────────────────────────────────────
// Each entry: label, exampleWord (used for Web Speech reference audio),
//             steps (numbered directions), anatomy (what moves), svg key
const PHONEME_INFO = {
  // ── Vowels ──
  "æ": {
    label: "æ", example: "cat",
    steps: ["Drop your jaw — open wide like you're at the dentist","Push your tongue flat and forward, tip nearly touching bottom front teeth","Spread your lips sideways slightly","Say it short and sharp: 'æ'"],
    anatomy: "Tongue: low + front  ·  Jaw: wide open  ·  Lips: spread",
    svg: "front_open",
  },
  "ɑ": {
    label: "ɑ", example: "father",
    steps: ["Open your mouth wide — widest of all vowels","Let your tongue lie flat and pull back","Relax your lips completely, no rounding","Let sound come from deep in the throat"],
    anatomy: "Tongue: low + back  ·  Jaw: very wide  ·  Lips: neutral",
    svg: "back_open",
  },
  "ɪ": {
    label: "ɪ", example: "sit",
    steps: ["Raise your tongue high toward the front of your mouth","Spread lips slightly as if smiling — but relaxed","Keep it short and lax, not tense","Don't hold it — in and out quickly"],
    anatomy: "Tongue: high + front (lax)  ·  Lips: slightly spread",
    svg: "front_high",
  },
  "iː": {
    label: "iː", example: "see",
    steps: ["Pull your tongue as high and forward as possible","Spread lips wide like a big smile","Hold the sound — it's long","Feel the tension in your tongue"],
    anatomy: "Tongue: high + front (tense)  ·  Lips: widely spread",
    svg: "front_high",
  },
  "ʊ": {
    label: "ʊ", example: "book",
    steps: ["Round your lips gently in a loose 'o'","Push tongue high and toward the back","Keep it short and relaxed — not tense","Don't push your lips too far forward"],
    anatomy: "Tongue: high + back (lax)  ·  Lips: loosely rounded",
    svg: "back_high",
  },
  "uː": {
    label: "uː", example: "moon",
    steps: ["Round your lips into a tight circle","Push tongue high and far back","Hold the sound — it's long and tense","Feel your lips making a small tunnel"],
    anatomy: "Tongue: high + back (tense)  ·  Lips: tightly rounded",
    svg: "back_high",
  },
  "ɛ": {
    label: "ɛ", example: "bed",
    steps: ["Open your mouth to about half-width","Tongue mid-height, toward the front","Lips stay neutral — no spread, no rounding","Short sound, don't drag it out"],
    anatomy: "Tongue: mid + front  ·  Jaw: half open  ·  Lips: neutral",
    svg: "front_mid",
  },
  "ə": {
    label: "ə", example: "about",
    steps: ["Relax everything — jaw, tongue, lips","Tongue sits in the middle of your mouth, floating","Mouth barely open","The shortest, laziest sound in English — just a soft 'uh'"],
    anatomy: "Tongue: mid + central (fully relaxed)  ·  Lips: neutral",
    svg: "mid_mid",
  },
  "ʌ": {
    label: "ʌ", example: "cup",
    steps: ["Open mouth to about half-width","Tongue mid-low and in the centre","Lips stay neutral — no rounding","Short sound, like a quick 'uh'"],
    anatomy: "Tongue: mid-low + central  ·  Lips: neutral",
    svg: "mid_low",
  },
  "ɔ": {
    label: "ɔ", example: "law",
    steps: ["Round your lips into a medium 'o' shape","Tongue low and pulled back","Open jaw fairly wide","Hold it — this is a longer vowel"],
    anatomy: "Tongue: low + back  ·  Lips: rounded  ·  Jaw: fairly open",
    svg: "back_low",
  },
  // ── Plosives ──
  "p": {
    label: "p", example: "pop",
    steps: ["Press both lips together firmly — seal completely","Build up air pressure behind the lips","Release suddenly with a small puff of air","No voice — put your hand in front of your mouth to feel the puff"],
    anatomy: "Both lips seal  ·  Voiceless  ·  Air burst on release",
    svg: "bilabial_stop",
  },
  "b": {
    label: "b", example: "ball",
    steps: ["Press both lips together firmly — same position as 'p'","Build up air pressure behind your lips","Release with a pop — but add your voice this time","Put a finger on your throat: you should feel it vibrate"],
    anatomy: "Both lips seal  ·  Voiced  ·  Air burst on release",
    svg: "bilabial_stop",
  },
  "t": {
    label: "t", example: "top",
    steps: ["Place your tongue tip on the hard ridge just behind your top front teeth (the alveolar ridge)","Seal it completely — no air escaping","Build air pressure","Release sharply — no voice"],
    anatomy: "Tongue tip → alveolar ridge  ·  Voiceless  ·  Sharp release",
    svg: "alveolar_stop",
  },
  "d": {
    label: "d", example: "dog",
    steps: ["Same tongue position as 't' — tip on the ridge behind top teeth","Seal the airway completely","Release with voice — feel your throat vibrate","The difference from 't' is only the voicing"],
    anatomy: "Tongue tip → alveolar ridge  ·  Voiced  ·  Sharp release",
    svg: "alveolar_stop",
  },
  "k": {
    label: "k", example: "cat",
    steps: ["Raise the back of your tongue to touch the soft palate (the back of the roof of your mouth)","Seal the airway at the back","Build air pressure behind the closure","Release suddenly — no voice"],
    anatomy: "Back of tongue → soft palate  ·  Voiceless",
    svg: "velar_stop",
  },
  "g": {
    label: "g", example: "go",
    steps: ["Same position as 'k' — back of tongue on soft palate","Seal at the back of the mouth","Release with voice — throat vibrates","The only difference from 'k' is voicing"],
    anatomy: "Back of tongue → soft palate  ·  Voiced",
    svg: "velar_stop",
  },
  // ── Fricatives ──
  "f": {
    label: "f", example: "fish",
    steps: ["Rest your upper front teeth very gently on your lower lip","Don't bite — just a light touch","Blow air steadily through the gap","No voice — it should sound like escaping air"],
    anatomy: "Upper teeth on lower lip  ·  Voiceless fricative",
    svg: "labiodental",
  },
  "v": {
    label: "v", example: "van",
    steps: ["Same position as 'f' — upper teeth lightly on lower lip","Blow air through the gap","Add your voice — feel your throat buzz","Hold it and feel the vibration between teeth and lip"],
    anatomy: "Upper teeth on lower lip  ·  Voiced fricative",
    svg: "labiodental",
  },
  "θ": {
    label: "θ", example: "think",
    steps: ["Stick your tongue tip gently between your front teeth — or just behind them","Blow air over the top of your tongue","No voice — just air flowing over the tongue","Don't press hard — the tongue is relaxed"],
    anatomy: "Tongue tip between/behind teeth  ·  Voiceless",
    svg: "dental",
  },
  "ð": {
    label: "ð", example: "this",
    steps: ["Same position as 'θ' — tongue tip gently between teeth","Blow air over the tongue","Add your voice — throat should buzz","Keep the tongue relaxed, just like 'θ' but voiced"],
    anatomy: "Tongue tip between/behind teeth  ·  Voiced",
    svg: "dental",
  },
  "s": {
    label: "s", example: "sun",
    steps: ["Raise your tongue tip close to the alveolar ridge — but don't touch it","Leave a narrow groove down the middle of the tongue","Force air through that groove — it hisses","No voice, lips slightly spread"],
    anatomy: "Tongue near ridge (not touching)  ·  Groove in tongue  ·  Voiceless",
    svg: "alveolar_fric",
  },
  "z": {
    label: "z", example: "zoo",
    steps: ["Exact same position as 's'","Add your voice — feel the buzz in your throat and on your lips","The hiss becomes a buzz","Hold it and feel the difference from 's'"],
    anatomy: "Tongue near ridge (not touching)  ·  Groove in tongue  ·  Voiced",
    svg: "alveolar_fric",
  },
  "ʃ": {
    label: "ʃ", example: "shoe",
    steps: ["Pull your tongue back slightly from the 's' position","Tongue tip is lower — it points toward the middle of the palate, not the ridge","Push your lips forward into a slight pout","Wider hiss than 's' — fuller sound"],
    anatomy: "Tongue: back from ridge  ·  Lips: rounded forward  ·  Voiceless",
    svg: "postalveolar",
  },
  "ʒ": {
    label: "ʒ", example: "measure",
    steps: ["Same position as 'ʃ' — tongue back, lips forward","Add voice — throat buzzes","Like the middle of the word 'measure' or 'vision'","Rare at the start of words in English"],
    anatomy: "Tongue: back from ridge  ·  Lips: rounded forward  ·  Voiced",
    svg: "postalveolar",
  },
  "h": {
    label: "h", example: "hat",
    steps: ["Open your mouth into the position of the following vowel","Just breathe out — that's it","No tongue or lip work needed for the 'h' itself","The shape comes from what comes after it"],
    anatomy: "Glottal fricative  ·  No oral constriction  ·  Voiceless",
    svg: "glottal",
  },
  // ── Affricates ──
  "tʃ": {
    label: "tʃ", example: "chip",
    steps: ["Start with your tongue tip on the alveolar ridge — like 't'","Build up pressure","Release the air but don't fully open — let it rush through as 'sh'","It's a 't' that slides into 'sh' in one quick movement"],
    anatomy: "Tongue tip → ridge, releases into post-alveolar  ·  Voiceless",
    svg: "postalveolar",
  },
  "dʒ": {
    label: "dʒ", example: "jump",
    steps: ["Start like 'd' — tongue on the ridge","Release into a voiced 'zh' sound (like 'measure')","One flowing movement — 'd' into 'zh'","Feel the voice throughout"],
    anatomy: "Tongue tip → ridge, releases into post-alveolar  ·  Voiced",
    svg: "postalveolar",
  },
  // ── Nasals ──
  "m": {
    label: "m", example: "mum",
    steps: ["Press both lips together firmly — like a 'b'","Let your voice hum through your nose instead of your mouth","The air goes out through the nose only","Put a finger under your nose — feel the airflow"],
    anatomy: "Lips sealed  ·  Air through nose  ·  Voiced nasal",
    svg: "bilabial_nasal",
  },
  "n": {
    label: "n", example: "nose",
    steps: ["Place your tongue tip on the alveolar ridge — same as 't'","Seal the mouth at the ridge","Let voice hum out through your nose","Lips are open — only the tongue blocks the mouth"],
    anatomy: "Tongue tip → alveolar ridge  ·  Air through nose  ·  Voiced nasal",
    svg: "alveolar_nasal",
  },
  "ŋ": {
    label: "ŋ", example: "sing",
    steps: ["Raise the back of your tongue to the soft palate — like 'k' or 'g'","Seal at the back of the mouth","Let voice hum through your nose","No lip or tongue-tip movement — it all happens at the back"],
    anatomy: "Back of tongue → soft palate  ·  Air through nose  ·  Voiced nasal",
    svg: "velar_nasal",
  },
  // ── Liquids + Glides ──
  "l": {
    label: "l", example: "leaf",
    steps: ["Place your tongue tip firmly on the alveolar ridge","Keep it there — don't let the tip move","Drop the sides of your tongue so air flows around the sides","Add voice — it should sound clear, not mushy"],
    anatomy: "Tongue tip → alveolar ridge  ·  Air flows around sides  ·  Voiced lateral",
    svg: "alveolar_lateral",
  },
  "r": {
    label: "r", example: "run",
    steps: ["Curl your tongue tip upward toward the roof — but don't touch it","The sides of the tongue touch the upper back teeth","Round your lips very slightly","Voice flows through — no hissing, no buzzing"],
    anatomy: "Tongue tip curled up (retroflex)  ·  Lips slightly rounded  ·  Voiced",
    svg: "retroflex",
  },
  "w": {
    label: "w", example: "wet",
    steps: ["Round your lips into a tight circle — like the start of 'oo'","Tongue is high and back in the mouth","Quickly glide into the following vowel","Voice throughout — it's a smooth movement, not a held sound"],
    anatomy: "Lips tightly rounded  ·  Tongue: high + back  ·  Voiced glide",
    svg: "back_high",
  },
  "j": {
    label: "j", example: "yes",
    steps: ["Raise your tongue high and forward — nearly touching the palate","Lips spread slightly","Glide quickly into the vowel that follows","Like the 'y' in yes — don't hold it"],
    anatomy: "Tongue: high + front  ·  Lips: spread  ·  Voiced palatal glide",
    svg: "palatal",
  },
};

function getPhonemeInfo(ph) {
  return PHONEME_INFO[ph] || {
    label: ph, example: ph,
    steps: ["Listen to the reference sound","Watch where the tongue and lips go","Try to copy the position","Record yourself and compare"],
    anatomy: "See diagram",
    svg: "neutral",
  };
}

// ─── Reference audio via Web Speech API ──────────────────────────────────────
function playPhonemeAudio(exampleWord) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(exampleWord);
  utt.rate = 0.7;
  utt.pitch = 1.0;
  utt.lang = "en-US";
  window.speechSynthesis.speak(utt);
}

// ─── SVG Sagittal (side-view) Mouth Diagrams ─────────────────────────────────
// Cross-section view: we see the mouth from the side
// Labels: UP = palate/roof, DOWN = tongue, LEFT = lips/teeth, RIGHT = throat
function MouthDiagram({ svgKey }) {
  // Shared anatomical outline — sagittal cross-section
  const Outline = () => (
    <g>
      {/* Outer head silhouette */}
      <path d="M 20 10 Q 20 160 60 175 Q 100 185 130 175 Q 155 160 155 130 Q 155 80 130 40 Q 110 10 80 8 Q 50 6 20 10 Z"
        fill="#1e1510" stroke="#3a2820" strokeWidth="1.5"/>
      {/* Hard palate (roof of mouth) */}
      <path d="M 42 55 Q 70 48 105 52 Q 120 54 128 62"
        stroke="#6b4f42" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Soft palate */}
      <path d="M 128 62 Q 138 72 135 88 Q 132 98 125 100"
        stroke="#6b4f42" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Upper teeth */}
      <rect x="38" y="58" width="18" height="9" rx="2" fill="#c8b89a" opacity="0.6"/>
      {/* Lower teeth */}
      <rect x="38" y="95" width="18" height="9" rx="2" fill="#c8b89a" opacity="0.6"/>
      {/* Upper lip */}
      <path d="M 22 72 Q 32 64 42 68 Q 38 76 22 72 Z" fill="#8a5a4a" opacity="0.7"/>
      {/* Lower lip */}
      <path d="M 22 92 Q 32 100 42 96 Q 38 88 22 92 Z" fill="#8a5a4a" opacity="0.7"/>
      {/* Throat/pharynx */}
      <path d="M 125 100 Q 140 115 138 145 Q 136 160 128 170"
        stroke="#3a2820" strokeWidth="1.5" fill="none"/>
      {/* Nose */}
      <path d="M 20 10 Q 15 35 20 55 Q 26 58 32 54 Q 28 40 30 20"
        fill="#1e1510" stroke="#3a2820" strokeWidth="1"/>
    </g>
  );

  // Tongue shape variants — tongue is the key moving part
  const tongues = {
    // Tongue low and flat (front open vowels like æ, ɑ)
    low_flat:     <path d="M 40 120 Q 70 118 100 115 Q 120 113 130 118 Q 125 130 100 132 Q 70 133 40 130 Z" fill="#c86060" opacity="0.85"/>,
    // Tongue mid-height neutral (ə, ʌ)
    mid_neutral:  <path d="M 40 115 Q 70 108 100 106 Q 120 105 130 112 Q 125 124 100 126 Q 70 128 40 124 Z" fill="#c86060" opacity="0.85"/>,
    // Tongue high front (ɪ, iː)
    high_front:   <path d="M 40 108 Q 60 96 80 92 Q 90 91 95 96 Q 100 104 110 110 Q 120 114 128 116 Q 124 128 100 128 Q 70 128 40 122 Z" fill="#c86060" opacity="0.85"/>,
    // Tongue high back (ʊ, uː, w)
    high_back:    <path d="M 40 118 Q 70 116 95 112 Q 112 104 125 98 Q 132 106 128 118 Q 120 128 95 130 Q 70 132 40 128 Z" fill="#c86060" opacity="0.85"/>,
    // Tongue mid front (ɛ)
    mid_front:    <path d="M 40 112 Q 60 104 80 100 Q 95 99 105 106 Q 115 112 125 114 Q 122 126 95 128 Q 70 130 40 122 Z" fill="#c86060" opacity="0.85"/>,
    // Tongue mid back (ɔ)
    mid_back:     <path d="M 40 116 Q 70 114 95 110 Q 112 106 122 100 Q 130 108 128 120 Q 124 130 95 132 Q 68 132 40 126 Z" fill="#c86060" opacity="0.85"/>,
    // Tongue tip up to alveolar ridge
    tip_alveolar: <path d="M 40 116 Q 68 112 88 108 Q 96 100 92 88 Q 96 82 100 90 Q 102 100 108 108 Q 120 112 128 114 Q 124 126 95 128 Q 68 130 40 124 Z" fill="#c86060" opacity="0.85"/>,
    // Tongue tip dental (between teeth)
    tip_dental:   <path d="M 40 112 Q 65 106 82 98 Q 88 88 90 82 Q 93 78 95 84 Q 94 94 90 100 Q 100 104 115 110 Q 124 114 128 116 Q 124 128 95 128 Q 68 130 40 122 Z" fill="#c86060" opacity="0.85"/>,
    // Tongue back raised (velar — k, g, ŋ)
    back_raised:  <path d="M 40 118 Q 70 116 95 114 Q 108 110 118 100 Q 126 90 130 94 Q 134 100 130 110 Q 126 122 100 128 Q 70 132 40 126 Z" fill="#c86060" opacity="0.85"/>,
    // Tongue tip raised/retroflex (r)
    retroflex:    <path d="M 40 118 Q 65 114 82 110 Q 88 104 86 92 Q 90 84 96 90 Q 98 98 94 108 Q 108 112 122 114 Q 126 126 95 130 Q 68 132 40 126 Z" fill="#c86060" opacity="0.85"/>,
    // Tongue with lateral channel (l)
    lateral:      <path d="M 40 112 Q 64 106 82 100 Q 90 90 92 84 Q 96 80 99 86 Q 100 96 96 104 Q 108 108 122 112 Q 126 124 95 128 Q 68 130 40 122 Z" fill="#c86060" opacity="0.85"/>,
    // Tongue near ridge but not touching (s, z)
    near_ridge:   <path d="M 40 115 Q 65 108 84 100 Q 92 93 93 90 Q 96 86 99 90 Q 99 96 96 102 Q 108 108 122 112 Q 126 124 95 128 Q 68 130 40 122 Z" fill="#c86060" opacity="0.85"/>,
    // Tongue pulled back from ridge (ʃ, ʒ)
    postalveolar: <path d="M 40 116 Q 65 110 84 104 Q 95 98 100 94 Q 106 90 110 96 Q 110 104 108 110 Q 118 112 126 114 Q 124 126 95 130 Q 68 132 40 124 Z" fill="#c86060" opacity="0.85"/>,
    // High front palatal (j)
    palatal:      <path d="M 40 112 Q 58 102 74 94 Q 86 87 92 90 Q 98 96 100 104 Q 110 110 122 112 Q 124 124 95 128 Q 68 130 40 120 Z" fill="#c86060" opacity="0.85"/>,
  };

  // Lip shapes (viewed from side — left edge of diagram)
  const lipsClosed = <path d="M 14 80 Q 22 76 32 80 Q 22 84 14 80 Z" fill="#b86060" opacity="0.9"/>;
  const lipsOpen   = null; // base outline already shows open lips
  const lipsRound  = (
    <g>
      <ellipse cx="22" cy="80" rx="10" ry="7" fill="none" stroke="#f4845f" strokeWidth="2"/>
    </g>
  );

  // Airflow arrow
  const AirArrow = ({ d, label }) => (
    <g>
      <path d={d} stroke="#4D9DE0" strokeWidth="1.8" fill="none" strokeDasharray="4,2"
        markerEnd="url(#arr)" opacity="0.8"/>
      {label && <text x="18" y="28" fill="#4D9DE0" fontSize="8" opacity="0.8">{label}</text>}
    </g>
  );

  // Contact dot — shows where tongue touches
  const ContactDot = ({ cx, cy }) => (
    <circle cx={cx} cy={cy} r="5" fill="#f4845f" opacity="0.9">
      <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.5s" repeatCount="indefinite"/>
    </circle>
  );

  const configs = {
    // Vowels
    front_open:    { tongue: tongues.low_flat,     lips: lipsOpen,   air: <AirArrow d="M 16 55 Q 12 40 16 25 Q 18 18 22 15" label="air out"/>, dot: null },
    back_open:     { tongue: tongues.low_flat,     lips: lipsOpen,   air: <AirArrow d="M 16 55 Q 12 40 16 25"/>, dot: null },
    front_high:    { tongue: tongues.high_front,   lips: lipsOpen,   air: <AirArrow d="M 16 55 Q 12 38 16 22"/>, dot: null },
    back_high:     { tongue: tongues.high_back,    lips: lipsRound,  air: <AirArrow d="M 16 55 Q 12 38 16 22"/>, dot: null },
    front_mid:     { tongue: tongues.mid_front,    lips: lipsOpen,   air: null, dot: null },
    mid_mid:       { tongue: tongues.mid_neutral,  lips: lipsOpen,   air: null, dot: null },
    mid_low:       { tongue: tongues.mid_neutral,  lips: lipsOpen,   air: null, dot: null },
    back_low:      { tongue: tongues.mid_back,     lips: lipsRound,  air: null, dot: null },
    // Stops
    bilabial_stop: { tongue: tongues.mid_neutral,  lips: lipsClosed, air: null, dot: null },
    alveolar_stop: { tongue: tongues.tip_alveolar, lips: lipsOpen,   air: null, dot: <ContactDot cx={92} cy={86}/> },
    velar_stop:    { tongue: tongues.back_raised,  lips: lipsOpen,   air: null, dot: <ContactDot cx={124} cy={96}/> },
    // Fricatives
    labiodental:   { tongue: tongues.mid_neutral,  lips: lipsOpen,   air: <AirArrow d="M 34 72 Q 28 60 20 48 Q 16 36 16 22"/>, dot: null },
    dental:        { tongue: tongues.tip_dental,   lips: lipsOpen,   air: <AirArrow d="M 36 70 Q 26 52 18 34 Q 16 26 16 20"/>, dot: null },
    alveolar_fric: { tongue: tongues.near_ridge,   lips: lipsOpen,   air: <AirArrow d="M 80 86 Q 60 72 40 58 Q 28 46 18 30"/>, dot: null },
    postalveolar:  { tongue: tongues.postalveolar, lips: lipsRound,  air: <AirArrow d="M 95 90 Q 72 72 50 56 Q 34 44 20 28"/>, dot: null },
    glottal:       { tongue: tongues.mid_neutral,  lips: lipsOpen,   air: <AirArrow d="M 130 130 Q 120 100 80 70 Q 50 50 22 28"/>, dot: null },
    // Nasals
    bilabial_nasal:{ tongue: tongues.mid_neutral,  lips: lipsClosed, air: <AirArrow d="M 22 30 Q 18 22 16 12" label="→ nose"/>, dot: null },
    alveolar_nasal:{ tongue: tongues.tip_alveolar, lips: lipsOpen,   air: <AirArrow d="M 22 30 Q 18 22 16 12"/>, dot: <ContactDot cx={92} cy={86}/> },
    velar_nasal:   { tongue: tongues.back_raised,  lips: lipsOpen,   air: <AirArrow d="M 22 30 Q 18 22 16 12"/>, dot: <ContactDot cx={124} cy={96}/> },
    // Liquids / glides
    alveolar_lateral:{ tongue: tongues.lateral,   lips: lipsOpen,   air: null, dot: <ContactDot cx={92} cy={82}/> },
    retroflex:     { tongue: tongues.retroflex,    lips: lipsRound,  air: null, dot: null },
    palatal:       { tongue: tongues.palatal,      lips: lipsOpen,   air: null, dot: null },
    neutral:       { tongue: tongues.mid_neutral,  lips: lipsOpen,   air: null, dot: null },
  };

  const cfg = configs[svgKey] || configs.neutral;

  return (
    <svg width="175" height="185" viewBox="0 0 175 185" style={{ display: "block" }}>
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M 0 0 L 6 3 L 0 6 Z" fill="#4D9DE0" opacity="0.8"/>
        </marker>
      </defs>
      <Outline />
      {cfg.tongue}
      {cfg.lips}
      {cfg.air}
      {cfg.dot}
      {/* Labels */}
      <text x="88" y="181" textAnchor="middle" fill="#4a3028" fontSize="8" fontFamily="monospace">side view</text>
    </svg>
  );
}

// ─── Rainbow Arc ──────────────────────────────────────────────────────────────
function RainbowArc({ correctCount, totalCount }) {
  const litStripes = Math.round((correctCount / Math.max(totalCount, 1)) * 7);
  return (
    <div style={{ position: "relative", width: 340, height: 180, margin: "0 auto" }}>
      {RAINBOW.map((color, i) => {
        const r = 162 - i * 18;
        const lit = i < litStripes;
        return (
          <div key={i} style={{
            position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
            width: r * 2, height: r,
            borderRadius: `${r}px ${r}px 0 0`,
            border: `13px solid ${lit ? color : "#241a14"}`,
            borderBottom: "none", boxSizing: "border-box",
            transition: `border-color 0.5s ease ${i * 0.07}s`,
            filter: lit ? `drop-shadow(0 0 5px ${color}88)` : "none",
          }} />
        );
      })}
      {[-60, 0, 60].map((offset, j) => (
        <div key={j} style={{
          position: "absolute", bottom: -5, left: `calc(50% + ${offset}px)`, transform: "translateX(-50%)",
          width: 44, height: 24, borderRadius: "50%", background: "#211810", border: "1px solid #3a2820",
        }} />
      ))}
    </div>
  );
}

// ─── Phoneme Chip ─────────────────────────────────────────────────────────────
function PhonemeChip({ phoneme, status, onClick, highlight }) {
  const s = {
    pending: { bg: T.surface,  border: T.border,  text: T.muted  },
    correct: { bg: T.accentLo, border: T.accent,  text: T.accent },
    wrong:   { bg: T.wrongLo,  border: T.wrong,   text: T.wrong  },
    missing: { bg: T.surface,  border: "#2a1e18", text: "#3a2820"},
  }[status] || { bg: T.surface, border: T.border, text: T.muted };

  return (
    <div onClick={onClick} title="Click to drill this phoneme" style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 50, height: 50, borderRadius: 10,
      background: highlight ? "#3a2010" : s.bg,
      border: `2px solid ${highlight ? T.accentHi : s.border}`,
      color: highlight ? T.accentHi : s.text,
      fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700,
      margin: 4, cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: status === "correct" ? `0 0 10px ${T.accent}44` : highlight ? `0 0 14px ${T.accentHi}55` : "none",
      transform: highlight ? "scale(1.12)" : "scale(1)",
    }}>
      {phoneme || "—"}
    </div>
  );
}

// ─── Particle ─────────────────────────────────────────────────────────────────
function Particle({ x, y, color }) {
  return <div style={{
    position: "fixed", left: x, top: y, width: 8, height: 8, borderRadius: "50%",
    background: color, pointerEvents: "none", animation: "burst 1.4s ease-out forwards", zIndex: 999,
  }} />;
}

// ─── Audio: PCM capture → normalise → WAV ────────────────────────────────────
function normalizeAudio(samples) {
  // RMS-based normalisation with peak limiting
  let sumSq = 0, peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    sumSq += samples[i] * samples[i];
    if (abs > peak) peak = abs;
  }
  const rms = Math.sqrt(sumSq / samples.length);
  if (rms < 0.0001) return samples;
  // Target RMS 0.18, but never let peak exceed 0.95
  const gainRms  = 0.18 / rms;
  const gainPeak = peak > 0 ? 0.95 / peak : 1;
  const gain = Math.min(gainRms, gainPeak, 8);
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) out[i] = Math.max(-1, Math.min(1, samples[i] * gain));
  return out;
}

function encodeWav(samples, sr = 16000) {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0,"RIFF"); v.setUint32(4,36+samples.length*2,true); w(8,"WAVE"); w(12,"fmt ");
  v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true);
  v.setUint32(24,sr,true); v.setUint32(28,sr*2,true); v.setUint16(32,2,true); v.setUint16(34,16,true);
  w(36,"data"); v.setUint32(40,samples.length*2,true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1,Math.min(1,samples[i]));
    v.setInt16(44+i*2, s < 0 ? s*0x8000 : s*0x7FFF, true);
  }
  return new Blob([buf],{type:"audio/wav"});
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode] = useState(MODE_WORD);
  const [word, setWord] = useState("");
  const [language, setLanguage] = useState("english");
  const [genPhonemes, setGenPhonemes] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [focusPhoneme, setFocusPhoneme] = useState(null);
  const [phonemeResult, setPhonemeResult] = useState(null);
  const [wordResult, setWordResult] = useState(null);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [particles, setParticles] = useState([]);
  const [celebration, setCelebration] = useState(false);
  const mediaRef = useRef(null);
  const pcmRef = useRef([]);
  const genTimer = useRef(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Nunito:wght@600;800;900&display=swap";
    document.head.appendChild(link);
    const style = document.createElement("style");
    style.textContent = `
      *{box-sizing:border-box} body{margin:0;background:#17120f}
      @keyframes burst{0%{transform:scale(1);opacity:1}100%{transform:scale(0) translateY(-60px);opacity:0}}
      @keyframes pulse-ring{0%,100%{box-shadow:0 0 0 0 #f4845f44}50%{box-shadow:0 0 0 8px #f4845f00}}
      @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
      @keyframes shimmer{0%,100%{opacity:0.5}50%{opacity:1}}
      @keyframes slide-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      @keyframes fade-in{from{opacity:0}to{opacity:1}}
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    if (!word.trim()) { setGenPhonemes([]); return; }
    clearTimeout(genTimer.current);
    genTimer.current = setTimeout(() => fetchPhonemes(word.trim()), 480);
  }, [word, language]);

  async function fetchPhonemes(w) {
    setGenerating(true);
    try {
      const fd = new FormData(); fd.append("word", w); fd.append("language", language);
      const res = await fetch(`${BACKEND}/phonemes`, { method: "POST", body: fd });
      const data = await res.json();
      setGenPhonemes(data.phonemes || []);
    } catch { setGenPhonemes([]); }
    finally { setGenerating(false); }
  }

  async function startRecording() {
    setWordResult(null); setPhonemeResult(null); setCelebration(false); setParticles([]);
    pcmRef.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1, sampleRate: 16000 },
    });
    const ctx = new AudioContext({ sampleRate: 16000 });
    const source = ctx.createMediaStreamSource(stream);
    const proc = ctx.createScriptProcessor(4096, 1, 1);
    proc.onaudioprocess = (e) => pcmRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    source.connect(proc); proc.connect(ctx.destination);
    mediaRef.current = { stream, ctx, proc, source };
    setRecording(true);
  }

  function stopRecording() {
    const { stream, ctx, proc, source } = mediaRef.current || {};
    source?.disconnect(); proc?.disconnect();
    stream?.getTracks().forEach(t => t.stop());
    const total = pcmRef.current.reduce((s, c) => s + c.length, 0);
    const merged = new Float32Array(total);
    let off = 0;
    for (const c of pcmRef.current) { merged.set(c, off); off += c.length; }
    const blob = encodeWav(normalizeAudio(merged), 16000);
    ctx?.close();
    setRecording(false); setLoading(true);
    if (mode === MODE_WORD) sendWord(blob); else sendPhoneme(blob);
  }

  async function sendWord(blob) {
    const fd = new FormData();
    fd.append("audio", blob, "recording.wav");
    fd.append("target_word", word.trim());
    fd.append("language", language);
    try {
      const res = await fetch(`${BACKEND}/compare`, { method: "POST", body: fd });
      const data = await res.json();
      setWordResult(data);
      if (data.accuracy >= 85) triggerCelebration();
    } catch { setWordResult({ error: "Backend not reachable." }); }
    finally { setLoading(false); }
  }

  async function sendPhoneme(blob) {
    const fd = new FormData();
    fd.append("audio", blob, "recording.wav");
    fd.append("target_phoneme", focusPhoneme);
    fd.append("language", language);
    try {
      const res = await fetch(`${BACKEND}/compare_phoneme`, { method: "POST", body: fd });
      const data = await res.json();
      setPhonemeResult(data);
      if (data.correct) triggerCelebration();
    } catch { setPhonemeResult({ error: "Backend not reachable." }); }
    finally { setLoading(false); }
  }

  function triggerCelebration() {
    setCelebration(true);
    setParticles(Array.from({ length: 32 }, (_, i) => ({
      id: i, x: `${Math.random()*88+6}vw`, y: `${Math.random()*55+10}vh`, color: RAINBOW[i%7],
    })));
    setTimeout(() => { setParticles([]); setCelebration(false); }, 2200);
  }

  function drillPhoneme(ph) {
    setFocusPhoneme(ph); setPhonemeResult(null); setMode(MODE_PHONEME);
  }

  const expectedList = wordResult?.expected_phonemes || [];
  const matches = wordResult?.matches || [];
  const chipStatuses = expectedList.map((_, i) => {
    const m = matches[i]; if (!m) return "missing";
    return m.correct ? "correct" : "wrong";
  });
  const correctCount = chipStatuses.filter(s => s === "correct").length;
  const canRecord = mode === MODE_WORD
    ? (genPhonemes.length > 0 && !loading && !generating)
    : (focusPhoneme !== null && !loading);
  const info = focusPhoneme ? getPhonemeInfo(focusPhoneme) : null;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'Nunito', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 16px 64px" }}>
      {particles.map(p => <Particle key={p.id} x={p.x} y={p.y} color={p.color} />)}

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: "clamp(22px,5vw,34px)", fontWeight: 900, color: T.accent, letterSpacing: 2, margin: 0, textShadow: `0 0 22px ${T.accent}44`, animation: celebration ? "float 0.5s ease infinite" : "none" }}>VaakSiddhi</h1>
        <p style={{ color: T.muted, fontSize: 11, letterSpacing: 4, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>RAINBOW PAINTER · PHONEME THERAPY</p>
      </div>

      {/* Mode tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, width: "100%", maxWidth: 460 }}>
        {[MODE_WORD, MODE_PHONEME].map(m => (
          <button key={m} onClick={() => { setMode(m); setWordResult(null); setPhonemeResult(null); }} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1.5px solid ${mode===m ? T.accent : T.border}`, background: mode===m ? T.accentLo : "transparent", color: mode===m ? T.accent : T.muted, fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}>
            {m === MODE_WORD ? "🗣  Word" : "🔤  Phoneme"}
          </button>
        ))}
      </div>

      {/* ══ WORD MODE ══ */}
      {mode === MODE_WORD && (
        <>
          <div style={{ animation: celebration ? "float 0.5s ease infinite" : "none" }}>
            <RainbowArc correctCount={wordResult ? correctCount : 0} totalCount={wordResult ? expectedList.length : 7} />
          </div>

          {wordResult && !wordResult.error && (
            <div style={{ marginTop: 10, fontSize: "clamp(28px,6vw,50px)", fontWeight: 900, color: wordResult.accuracy >= 80 ? T.accent : wordResult.accuracy >= 50 ? "#FFCC70" : T.wrong, textShadow: "0 0 20px currentColor", animation: "slide-up 0.4s ease" }}>
              {wordResult.accuracy}%
            </div>
          )}

          {expectedList.length > 0 && (
            <>
              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", justifyContent: "center", maxWidth: 480, animation: "slide-up 0.4s ease" }}>
                {expectedList.map((ph, i) => (
                  <PhonemeChip key={i} phoneme={ph} status={chipStatuses[i]} onClick={() => drillPhoneme(ph)} />
                ))}
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: T.textDim, fontFamily: "'JetBrains Mono', monospace" }}>tap any chip to drill that phoneme</div>
            </>
          )}

          {wordResult && !wordResult.error && (
            <div style={{ marginTop: 12, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "14px 20px", maxWidth: 460, width: "100%", textAlign: "center", animation: "slide-up 0.5s ease" }}>
              <div style={{ fontSize: 11, color: T.textDim, letterSpacing: 3, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>HEARD</div>
              <div style={{ color: T.textDim, fontSize: 15, marginBottom: 12 }}>"{wordResult.transcript || "—"}"</div>
              <div style={{ fontSize: 11, color: T.textDim, letterSpacing: 3, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>FEEDBACK</div>
              <div style={{ color: T.accentHi, fontSize: 14, lineHeight: 1.6 }}>{wordResult.feedback}</div>
            </div>
          )}
          {wordResult?.error && <div style={{ marginTop: 12, color: T.wrong, fontSize: 13 }}>⚠ {wordResult.error}</div>}

          <div style={{ marginTop: 20, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18, padding: "20px 20px 16px", width: "100%", maxWidth: 460 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {["english", "hindi"].map(lang => (
                <button key={lang} onClick={() => { setLanguage(lang); setWordResult(null); setGenPhonemes([]); }} style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: `1.5px solid ${language===lang ? T.accent : T.border}`, background: language===lang ? T.accentLo : "transparent", color: language===lang ? T.accent : T.muted, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 2, cursor: "pointer", textTransform: "uppercase", transition: "all 0.2s" }}>{lang}</button>
              ))}
            </div>
            <label style={{ display: "block", fontSize: 11, color: T.textDim, letterSpacing: 2, marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>TARGET WORD</label>
            <input value={word} onChange={e => { setWord(e.target.value); setWordResult(null); }} placeholder={language === "english" ? "e.g.  rabbit" : "e.g.  बाल"} style={{ width: "100%", background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", color: T.text, fontFamily: "'Nunito', sans-serif", fontSize: 18, fontWeight: 700, outline: "none", marginBottom: 6, transition: "border-color 0.2s" }} onFocus={e => (e.target.style.borderColor = T.accent)} onBlur={e => (e.target.style.borderColor = T.border)} />
            {generating && <div style={{ fontSize: 12, color: T.muted, fontFamily: "'JetBrains Mono', monospace", animation: "shimmer 1s infinite", marginBottom: 6 }}>generating phonemes…</div>}
            {!generating && genPhonemes.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                {genPhonemes.map((p, i) => <span key={i} style={{ padding: "3px 9px", borderRadius: 6, background: T.accentLo, border: `1px solid ${T.border}`, color: T.accentHi, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{p}</span>)}
              </div>
            )}
            <RecordButton recording={recording} loading={loading} disabled={!canRecord} onStart={startRecording} onStop={stopRecording} />
          </div>
        </>
      )}

      {/* ══ PHONEME MODE ══ */}
      {mode === MODE_PHONEME && (
        <div style={{ width: "100%", maxWidth: 480, animation: "fade-in 0.4s ease" }}>
          {!focusPhoneme && (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "18px 20px" }}>
              <div style={{ fontSize: 11, color: T.textDim, letterSpacing: 3, marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>SELECT A PHONEME TO PRACTISE</div>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {Object.keys(PHONEME_INFO).map(ph => <PhonemeChip key={ph} phoneme={ph} status="pending" onClick={() => drillPhoneme(ph)} />)}
              </div>
            </div>
          )}

          {focusPhoneme && info && (
            <>
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <button onClick={() => { setFocusPhoneme(null); setPhonemeResult(null); }} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, color: T.muted, padding: "6px 12px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>← back</button>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: T.accent }}>{focusPhoneme}</div>
                <div style={{ flex: 1 }} />
                {/* Reference audio button */}
                <button onClick={() => playPhonemeAudio(info.example)} title={`Hear /${focusPhoneme}/ as in '${info.example}'`} style={{ background: T.accentLo, border: `1.5px solid ${T.accent}`, borderRadius: 10, color: T.accent, padding: "8px 14px", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}>
                  🔊 <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>"{info.example}"</span>
                </button>
              </div>

              {/* Instruction card */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "18px", marginBottom: 14 }}>
                <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-start" }}>
                  {/* Diagram */}
                  <div style={{ flexShrink: 0, background: "#1a1008", borderRadius: 12, padding: 8, border: `1px solid ${T.border}` }}>
                    <MouthDiagram svgKey={info.svg} />
                    <div style={{ textAlign: "center", marginTop: 4, fontSize: 10, color: T.textDim, fontFamily: "'JetBrains Mono', monospace" }}>cross-section</div>
                  </div>
                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontSize: 11, color: T.textDim, letterSpacing: 2, marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>ANATOMY</div>
                    <div style={{ fontSize: 12, color: T.muted, marginBottom: 14, lineHeight: 1.5 }}>{info.anatomy}</div>
                    <div style={{ fontSize: 11, color: T.textDim, letterSpacing: 2, marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>HOW TO DO IT</div>
                    <ol style={{ margin: 0, padding: "0 0 0 18px", listStyle: "decimal" }}>
                      {info.steps.map((step, i) => (
                        <li key={i} style={{ fontSize: 13, color: T.text, lineHeight: 1.7, marginBottom: 4 }}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>

              {/* Result card */}
              {phonemeResult && !phonemeResult.error && (
                <div style={{ background: phonemeResult.correct ? T.okLo : T.wrongLo, border: `1px solid ${phonemeResult.correct ? T.ok : T.wrong}`, borderRadius: 14, padding: "14px 20px", marginBottom: 14, textAlign: "center", animation: "slide-up 0.4s ease" }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{phonemeResult.correct ? "🎉" : "🔁"}</div>
                  <div style={{ color: phonemeResult.correct ? T.ok : T.wrong, fontWeight: 800, fontSize: 15, marginBottom: 6 }}>{phonemeResult.correct ? "Got it!" : "Not quite — try again"}</div>
                  <div style={{ color: T.textDim, fontSize: 13, marginBottom: 6 }}>Heard: "{phonemeResult.transcript || "—"}"</div>
                  {!phonemeResult.correct && <div style={{ color: T.accentHi, fontSize: 13, lineHeight: 1.6 }}>{phonemeResult.feedback}</div>}
                </div>
              )}
              {phonemeResult?.error && <div style={{ color: T.wrong, fontSize: 13, marginBottom: 12 }}>⚠ {phonemeResult.error}</div>}

              <RecordButton recording={recording} loading={loading} disabled={!canRecord} onStart={startRecording} onStop={stopRecording} />
            </>
          )}
        </div>
      )}

      <p style={{ marginTop: 32, color: "#2e1e18", fontSize: 11, letterSpacing: 2, fontFamily: "'JetBrains Mono', monospace" }}>VAAKSIDDHI POC · ALL PROCESSING LOCAL</p>
    </div>
  );
}

function RecordButton({ recording, loading, disabled, onStart, onStop }) {
  return (
    <>
      <button onClick={recording ? onStop : onStart} disabled={disabled} style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: `2px solid ${recording ? T.wrong : T.accent}`, background: recording ? T.wrongLo : T.accentLo, color: recording ? T.wrong : T.accent, fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 800, letterSpacing: 2, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, animation: recording ? "pulse-ring 1s ease infinite" : "none", transition: "all 0.2s" }}>
        {loading ? "Analysing…" : recording ? "◼  Stop" : "⏺  Record"}
      </button>
      {recording && <div style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: T.wrong, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2 }}>listening… speak now</div>}
    </>
  );
}
