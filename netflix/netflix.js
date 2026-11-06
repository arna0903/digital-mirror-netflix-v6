let video =
document.getElementById("video");


let source =
document.getElementById("videoSource");


let bar =
document.getElementById("bar");


let time =
document.getElementById("time");


// Current episode number; episode 4 is intentionally a blank-screen demo.
let episode =
1;
let demoBlankScreen=false;
// Simulated clock begins at the viewer's local time and advances only during active playback.
const simulatedClockStart = new Date();
let simulatedElapsedMinutes = 0;

function formatSimulatedClock(date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getSimulatedClockMessage() {
  const simulatedNow = new Date(simulatedClockStart.getTime() + simulatedElapsedMinutes * 60 * 1000);
  const elapsedHours = Math.floor(simulatedElapsedMinutes / 60);
  const elapsedMinutes = simulatedElapsedMinutes % 60;
  const elapsedLabel = elapsedHours
    ? `${elapsedHours} hr${elapsedHours === 1 ? "" : "s"}${elapsedMinutes ? ` ${elapsedMinutes} min` : ""}`
    : `${elapsedMinutes} min`;
  return `Simulated viewing time: ${formatSimulatedClock(simulatedClockStart)} → ${formatSimulatedClock(simulatedNow)} (${elapsedLabel})`;
}


// Prevent multiple 20-minute reminders from opening at the same time.
let breakShown=false;



// The player controls and ambient synth are created from the page elements below.
// Audio starts on a user gesture because browsers restrict automatic audio playback.

let playButton=document.querySelector(".play-btn");
let ambientContext = null;
let ambientMaster = null;
let ambientFilter = null;

let ambientSoundEnabled = true;
try { ambientSoundEnabled = localStorage.getItem("ambientSoundV6") !== "off"; } catch (e) {}
let ambientSceneActive = false;
let ambientNoteTimer = null;
let ambientNoteIndex = 0;

// Create the Web Audio nodes once, then reuse them for the scene ambience and reminder chime.
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

// Fade the generated sound in only while the reflection scene is active and sound is enabled.
function updateAmbientAudio() {
  const button = document.getElementById("ambientToggle");
  if (button) {
    button.textContent = "Ambient sound · " + (ambientSoundEnabled ? "On" : "Off");
    button.setAttribute("aria-pressed", String(ambientSoundEnabled));
  }
  if (ambientContext && ambientMaster) {
    const now = ambientContext.currentTime;
    ambientMaster.gain.cancelScheduledValues(now);
    ambientMaster.gain.setTargetAtTime(ambientSoundEnabled && ambientSceneActive ? 0.65 : 0.0001, now, 1.1);
  }
}

// Play one soft sine note with a slow attack and release to avoid a sharp alert-like sound.
function playAmbientNote() {
  if (!ambientContext || !ambientSoundEnabled || !ambientSceneActive) return;
  const notes = [392.00, 329.63, 440.00, 349.23, 392.00, 293.66];
  const now = ambientContext.currentTime;
  const osc = ambientContext.createOscillator();
  const level = ambientContext.createGain();
  osc.type = "sine";
  osc.frequency.value = notes[ambientNoteIndex++ % notes.length];
  level.gain.setValueAtTime(0.0001, now);
  level.gain.exponentialRampToValueAtTime(0.045, now + 0.55);
  level.gain.exponentialRampToValueAtTime(0.0001, now + 4.8);
  osc.connect(level);
  level.connect(ambientFilter);
  osc.start(now);
  osc.stop(now + 4.9);
}

// The bear bridge calls this when it shows or hides the reflection scene.
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

// Save the viewer's sound preference in this browser.
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



// Skip controls are disabled for the blank-screen demo and before video metadata loads.

function skip(seconds){
if(demoBlankScreen || !Number.isFinite(video.duration)) return;
video.currentTime += seconds;

}




// Refresh the progress bar and elapsed / total time from the video playback clock.

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





// Convert a numeric playback time into the mm:ss label used by the player.
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






// Accelerated reminder clock: each real playback second adds 2 simulated viewing minutes.
// Therefore the 20-minute reminder appears after about 10 seconds of uninterrupted playback.


let watchedMinutes=0;
const reminderMinutes = 20;

setInterval(()=>{
  const reflectionOpen = getComputedStyle(document.getElementById("reflection")).display !== "none";
  if(video.paused || video.ended || reflectionOpen || document.visibilityState === "hidden") return;

  // The demo maps 30 seconds of playback to about one viewing hour.
  watchedMinutes += 2;
  simulatedElapsedMinutes += 2;
  if(watchedMinutes >= reminderMinutes && !breakShown){
    watchedMinutes -= reminderMinutes;
    showBreak();
  }
},1000);

// A short 740 Hz sine tone marks the optional reminder without using an audio library.
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
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);
  osc.connect(gain); gain.connect(ambientContext.destination);
  osc.start(now); osc.stop(now + 0.8);
}

// Show the small optional prompt; if ignored, it disappears after five seconds.
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





// Starting the break pauses the episode and runs the 20-second eye-rest timer.
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

// Resume only after the viewer chooses the button shown when the 20 seconds are complete.
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









// End-of-episode reflection: offer a moment of choice before the next episode starts.

video.onended=function(){
const popup = document.getElementById("breakPopup");
popup.style.display = "none";
breakShown = false;
showReflection();
};





// Choose a progressively more reflective message based on how many episodes have ended.
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

text += `\n\n${getSimulatedClockMessage()}`;



document.getElementById(
"message"
).innerText=text;



document.getElementById(
"reflection"
).style.display="block";


}




// The viewer may continue; after episode 3, continue leads to a blank screen for demonstration.
function continueWatching(){
if(episode>=3){
// End the demo with a clear label instead of implying that a fourth episode exists.
episode=4;
demoBlankScreen=true;
video.pause();
source.removeAttribute("src");
video.removeAttribute("src");
video.load();
bar.style.width="0%";
time.innerHTML="00:00 / 00:00";
playButton.innerHTML="▶";
document.getElementById("episode").innerHTML="This is the end of the simulation";
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
// Stop the current video without closing the application or imposing a session limit.
function stopWatching(){


video.pause();
playButton.innerHTML="▶";


document.getElementById(
"reflection"
).style.display="none";


}
// Clicking the progress track seeks to that position in the current video.
document.querySelector(".progress")
.addEventListener("click",function(e){

if(demoBlankScreen || !Number.isFinite(video.duration)) return;
const rect=this.getBoundingClientRect();

const x=e.clientX-rect.left;

const percent=x/rect.width;

video.currentTime=
video.duration*percent;

});
