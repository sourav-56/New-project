const textel = document.getElementById('text');
const voiceselect = document.getElementById('voiceSelect');
const rateel = document.getElementById('rate');
const pitchel = document.getElementById('pitch');
const volumeel = document.getElementById('volume');
const rateval = document.getElementById('rateVal');
const pitchval = document.getElementById('pitchVal');
const volval = document.getElementById('volVal');
const playbtn = document.getElementById('playBtn');
const pausebtn = document.getElementById('pauseBtn');
const resumebtn = document.getElementById('resumeBtn');
const stopbtn = document.getElementById('stopBtn');
const clearbtn = document.getElementById('clearBtn');
const examplebtn = document.getElementById('exampleBtn');
const charcount = document.getElementById('charCount');
const statusel = document.getElementById('status');
const max_length = 5000;

let synth = window.speechSynthesis || null;
let voices = [];
let utter = null;

function setstatus(msg, iserror = false){
  statusel.textContent = msg;
  statusel.style.color = iserror ? '#ffbaba' : '';
}

function updatecharcount(){
  const length = textel.value.length;

  charcount.textContent = `${length} / ${max_length} characters`;

  if (length >= max_length) {
    charcount.classList.add('limit-reached');
  } else {
    charcount.classList.remove('limit-reached');
  }
}

updatecharcount();

textel.addEventListener('input', () => {
  updatecharcount();

  if (synth && synth.speaking){
    if (window._ttsTimer) clearTimeout(window._ttsTimer);

    window._ttsTimer = setTimeout(() => {
      if (synth.speaking) {
        synth.cancel();

        const u = createutterance();

        if (u) {
          utter = u;
          synth.speak(utter);
        }
      }
    }, 500);
  }
});

clearbtn.addEventListener('click', () =>{
  textel.value = '';

  updatecharcount();

  if (synth && synth.speaking) {
    synth.cancel();
    utter = null;
  }

  playbtn.disabled = false;
  pausebtn.disabled = true;
  resumebtn.disabled = true;
  stopbtn.disabled = true;

  setstatus('Text cleared. Enter some text to speak.');
  textel.focus();
});

examplebtn.addEventListener('click', () =>{
  const exampletext = "Hello! Welcome to the Text-to-Speech Converter. This application converts written text into spoken words using the Web Speech API. You can select different voices and adjust the speed, pitch, and volume to customize your listening experience.";

  textel.value = exampletext;

  updatecharcount();

  if (synth && synth.speaking){
    synth.cancel();
    utter = null;
  }

  playbtn.disabled = false;
  pausebtn.disabled = true;
  resumebtn.disabled = true;
  stopbtn.disabled = true;

  setstatus('Example text loaded. Click Play to listen.');
  textel.focus();
});

if (!synth) {
  setstatus('Speech Synthesis API not supported in this browser.', true);

  [playbtn, pausebtn, resumebtn, stopbtn].forEach(b =>{
    b.disabled = true;
  });

  voiceselect.disabled = true;

} else {
  function loadvoices(){
    voices = synth.getVoices().sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    voiceselect.innerHTML = '';

    voices.forEach((v, i) =>{
      const opt = document.createElement('option');

      opt.value = i;
      opt.textContent = `${v.name} ${v.lang ? ' — ' + v.lang : ''}${v.default ? ' (default)' : ''}`;

      voiceselect.appendChild(opt);
    });

    const userlang = navigator.language || navigator.userLanguage || '';

    const preferredindex = voices.findIndex(v =>
      v.lang && v.lang.startsWith(userlang.split('-')[0])
    );

    if (voices.length > 0) {
      voiceselect.value = preferredindex >= 0 ? preferredindex : 0;
    }

    setstatus('Voices loaded. Ready.');
  }

  loadvoices();

  synth.onvoiceschanged = loadvoices;
}

rateel.addEventListener('input', () =>{
  rateval.textContent = rateel.value;
});

pitchel.addEventListener('input', () => {
  pitchval.textContent = pitchel.value;
});

volumeel.addEventListener('input', () => {
  volval.textContent = volumeel.value;
});

function createutterance() {
  if (!synth) return null;

  const text = textel.value.trim();

  if (!text) return null;

  const u = new SpeechSynthesisUtterance(text);

  const voiceindex = parseInt(voiceselect.value, 10);

  if (!isNaN(voiceindex) && voices[voiceindex]) {
    u.voice = voices[voiceindex];
  }

  u.rate = Number(rateel.value) || 1;
  u.pitch = Number(pitchel.value) || 1;
  u.volume = Number(volumeel.value);

  u.onstart = () => {
    setstatus('Speaking...');

    playbtn.disabled = true;
    pausebtn.disabled = false;
    stopbtn.disabled = false;
    resumebtn.disabled = true;
  };

  u.onend = () => {
    setstatus('Finished speaking.');

    playbtn.disabled = false;
    pausebtn.disabled = true;
    resumebtn.disabled = true;
    stopbtn.disabled = true;

    utter = null;
  };

  u.onerror = (e) => {
    if (e.error === 'canceled' || e.error === 'interrupted') {
      return;
    }

    console.error('Speech error', e);

    setstatus('Speech error occurred.', true);

    playbtn.disabled = false;
    pausebtn.disabled = true;
    resumebtn.disabled = true;
    stopbtn.disabled = true;

    utter = null;
  };

  u.onpause = () => {
    setstatus('Paused.');

    pausebtn.disabled = true;
    resumebtn.disabled = false;
  };

  u.onresume = () => {
    setstatus('Resumed.');

    pausebtn.disabled = false;
    resumebtn.disabled = true;
  };

  return u;
}

playbtn.addEventListener('click', () => {
  if (!synth) return;

  if (synth.speaking) {
    synth.cancel();
    utter = null;
  }

  const u = createutterance();

  if (!u) {
    setstatus('Please enter some text to speak.', true);
    textel.focus();
    return;
  }

  utter = u;

  synth.speak(utter);
});

pausebtn.addEventListener('click', () => {
  if (!synth) return;

  if (synth.speaking && !synth.paused) {
    synth.pause();
  }
});

resumebtn.addEventListener('click', () => {
  if (!synth) return;

  if (synth.paused) {
    synth.resume();
  }
});

stopbtn.addEventListener('click', () => {
  if (!synth) return;

  if (synth.speaking) {
    synth.cancel();

    setstatus('Stopped.');

    playbtn.disabled = false;
    pausebtn.disabled = true;
    resumebtn.disabled = true;
    stopbtn.disabled = true;

    utter = null;
  }
});

voiceselect.addEventListener('change', () => {
  if (!synth) return;

  if (synth.speaking) {
    synth.cancel();

    const u = createutterance();

    if (u) {
      utter = u;
      synth.speak(utter);
    }
  }
});

(function initcontrols() {
  playbtn.disabled = false;
  pausebtn.disabled = true;
  resumebtn.disabled = true;
  stopbtn.disabled = true;
})();