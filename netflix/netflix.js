let video =
document.getElementById("video");


let source =
document.getElementById("videoSource");


let bar =
document.getElementById("bar");


let time =
document.getElementById("time");


let episode =
1;
let demoBlankScreen=false;


let breakShown=false;



// play pause

let playButton=document.querySelector(".play-btn");
let ambientContext = null;
let ambientMaster = null;
let ambientFilter = null;

let ambientSoundEnabled = true;
try { ambientSoundEnabled = localStorage.getItem("ambientSoundV6") !== "off"; } catch (e) {}
let ambientSceneActive = false;
let ambientNoteTimer = null;
let ambientNoteIndex = 0;

function ensureAmbientAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return false;
  if (!ambientContext) {
    ambientContext = new AudioContextClass();
    ambientMaster = ambientContext.createGain();
    ambientMaster.gain.value = 0.0001;
    ambientFilter = ambientContext.createBiquadFilter();
    ambientFilter.type = "lowpass";
    ambientFilter.frequency.value = 1150;
    ambientFilter.Q.value = 0.35;
    ambientFilter.connect(ambientMaster);
    ambientMaster.connect(ambientContext.destination);

    [130.81, 196.00, 261.63, 329.63].forEach((hz, i) => {
      const osc = ambientContext.createOscillator();
      const level = ambientContext.createGain();
      osc.type = "sine";
      osc.frequency.value = hz;
      level.gain.value = i === 0 ? 0.035 : 0.022;
      osc.connect(level);
      level.connect(ambientFilter);
      osc.start();

    });
  }
  if (ambientContext.state === "suspended") ambientContext.resume().catch(() => {});
  updateAmbientAudio();
  return true;
}

function updateAmbientAudio() {
  const button = document.getElementById("ambientToggle");
  if (button) {
    button.textContent = "Ambient sound · " + (ambientSoundEnabled ? "On" : "Off");
    button.setAttribute("aria-pressed", String(ambientSoundEnabled));
  }
  if (ambientContext && ambientMaster) {
    const now = ambientContext.currentTime;
    ambientMaster.gain.cancelScheduledValues(now);
    ambientMaster.gain.setTargetAtTime(ambientSoundEnabled && ambientSceneActive ? 0.42 : 0.0001, now, 1.1);
  }
}

function playAmbientNote() {
  if (!ambientContext || !ambientSoundEnabled || !ambientSceneActive) return;
  const notes = [392.00, 329.63, 440.00, 349.23, 392.00, 293.66];
  const now = ambientContext.currentTime;
  const osc = ambientContext.createOscillator();
  const level = ambientContext.createGain();
  osc.type = "sine";
  osc.frequency.value = notes[ambientNoteIndex++ % notes.length];
  level.gain.setValueAtTime(0.0001, now);
  level.gain.exponentialRampToValueAtTime(0.030, now + 0.55);
  level.gain.exponentialRampToValueAtTime(0.0001, now + 4.8);
  osc.connect(level);
  level.connect(ambientFilter);
  osc.start(now);
  osc.stop(now + 4.9);
}

function setAmbientScene(active) {
  ambientSceneActive = active;
  if (active) {
    ensureAmbientAudio();
    if (!ambientNoteTimer) {
      playAmbientNote();
      ambientNoteTimer = setInterval(playAmbientNote, 5200);
    }
  } else if (ambientNoteTimer) {
    clearInterval(ambientNoteTimer);
    ambientNoteTimer = null;
  }
  updateAmbientAudio();
}

function toggleAmbientSound() {
  ambientSoundEnabled = !ambientSoundEnabled;
  try { localStorage.setItem("ambientSoundV6", ambientSoundEnabled ? "on" : "off"); } catch (e) {}
  if (ambientSoundEnabled) ensureAmbientAudio();
  updateAmbientAudio();
}

updateAmbientAudio();


function playPause(){
if(demoBlankScreen) return;
ensureAmbientAudio();

if(video.paused){

video.play().catch(()=>{});;

playButton.innerHTML="❚❚";

}

else{

video.pause();

playButton.innerHTML="▶";

}

}



// skip

function skip(seconds){
if(demoBlankScreen || !Number.isFinite(video.duration)) return;
video.currentTime += seconds;

}




// progress bar

video.addEventListener(
"timeupdate",
()=>{


let percent =
(video.currentTime/video.duration)*100;


bar.style.width =
percent+"%";



time.innerHTML =
format(video.currentTime)
+
" / "
+
format(video.duration);



});





function format(seconds){

if(isNaN(seconds))
return "00:00";


let min =
Math.floor(seconds/60);


let sec =
Math.floor(seconds%60);



return (
min<10?"0":""
)
+min
+
":"
+
(
sec<10?"0":""
)
+sec;


}






// 20-20-20 timer simulation


let watchedMinutes=0;
const reminderMinutes = 20;

setInterval(()=>{
  const reflectionOpen = getComputedStyle(document.getElementById("reflection")).display !== "none";
  if(video.paused || video.ended || reflectionOpen || document.visibilityState === "hidden") return;

  // The demo maps 30 seconds of playback to about one viewing hour.
  watchedMinutes += 2;
  if(watchedMinutes >= reminderMinutes && !breakShown){
    watchedMinutes -= reminderMinutes;
    showBreak();
  }
},1000);

function playBreakChime(){
  if (!ambientSoundEnabled) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  if (!ambientContext) ensureAmbientAudio();
  if (!ambientContext) return;
  if (ambientContext.state === "suspended") ambientContext.resume().catch(()=>{});
  const now = ambientContext.currentTime;
  const osc = ambientContext.createOscillator();
  const gain = ambientContext.createGain();
  osc.type = "sine"; osc.frequency.setValueAtTime(740, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.045, now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);
  osc.connect(gain); gain.connect(ambientContext.destination);
  osc.start(now); osc.stop(now + 0.8);
}

function showBreak(){
  breakShown=true;
  playBreakChime();

let popup=document.getElementById("breakPopup");


popup.style.display="block";

setTimeout(()=>{

if(popup.style.display === "block"){

popup.style.display="none";

breakShown=false;

}

},5000);

}





function startBreak(){
document.getElementById("breakPopup").style.display="none";
breakShown=true;
video.pause();
playButton.innerHTML="▶";

const overlay=document.getElementById("breakOverlay");
const countdown=document.getElementById("countdown");
const prompt=document.getElementById("breakPromptText");
const resume=document.getElementById("resumeAfterBreak");
resume.hidden=true;
prompt.textContent="Let your eyes rest. The episode will wait.";
overlay.style.display="flex";
countdown.focus();

let seconds=20;
countdown.textContent=seconds;
const timer=setInterval(()=>{
  seconds--;
  if(seconds>0){
    countdown.textContent=seconds;
    return;
  }
  clearInterval(timer);
  countdown.textContent="✓";
  prompt.textContent="The timer is complete. Take more time if you need it.";
  resume.hidden=false;
  resume.focus();
},1000);
}

function finishBreak(){
document.getElementById("breakOverlay").style.display="none";
document.getElementById("resumeAfterBreak").hidden=true;
document.getElementById("countdown").textContent="20";
document.getElementById("breakPromptText").textContent="Let your eyes rest. The episode will wait.";
breakShown=false;
playButton.focus();
video.play().then(()=>{playButton.innerHTML="❚❚";}).catch(()=>{});
}
function closeBreak(){

document.getElementById("breakPopup").style.display="none";

breakShown=false;

}









// REAL autoplay friction

video.onended=function(){
const popup = document.getElementById("breakPopup");
popup.style.display = "none";
breakShown = false;
showReflection();
};





function showReflection(){
let text="";

if(episode==1){

text=`
Its been an interesting watch. 
Hope you have relaxed!
Do you happen to have any external commitments today? 
`;

}


if(episode==2){

text=`
Your viewing session is becoming longer.

Your friend has started ignoring the surroundings.

Would you still like to continue?
`;

}


if(episode>=3){

text=`
Your session has continued far beyond the initial intention.

Notice how your friend has changed.

Perhaps you need a moment away from the screen.
`;

}



document.getElementById(
"message"
).innerText=text;



document.getElementById(
"reflection"
).style.display="block";


}




function continueWatching(){
if(episode>=3){
episode=4;
demoBlankScreen=true;
video.pause();
source.removeAttribute("src");
video.removeAttribute("src");
video.load();
bar.style.width="0%";
time.innerHTML="00:00 / 00:00";
playButton.innerHTML="▶";
document.getElementById("episode").innerHTML="Episode 4";
document.getElementById("reflection").style.display="none";
return;
}

episode++;
source.src="assets/episode"+episode+".mp4";
video.load();
video.play().catch(()=>{});
playButton.innerHTML="❚❚";
document.getElementById("episode").innerHTML="Episode "+episode;
document.getElementById("reflection").style.display="none";
}
function stopWatching(){


video.pause();
playButton.innerHTML="▶";


document.getElementById(
"reflection"
).style.display="none";


}
document.querySelector(".progress")
.addEventListener("click",function(e){

if(demoBlankScreen || !Number.isFinite(video.duration)) return;
const rect=this.getBoundingClientRect();

const x=e.clientX-rect.left;

const percent=x/rect.width;

video.currentTime=
video.duration*percent;

});
