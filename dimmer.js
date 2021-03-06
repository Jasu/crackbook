var BODY_POLL_MS = 30;
var DIMMER_DIV_ID = '_crackbook_dimmer_';
var DIMMER_TEXT = "Wait %d seconds for the content to appear.";
var DIMMER_SWITCH_TEXT = "The timer restarts if you switch away from this tab.";

var timeoutFn = function() {
  var dimmer = document.getElementById(DIMMER_DIV_ID);
  dimmer.style.display = "none";
  // Disable the dimmer, and do not dim this page again.
}

function clearTimer(dimmer) {
  // Clear old timer.
  var timerIdInput = document.getElementById(DIMMER_DIV_ID + "timerId");
  if (timerIdInput) {
    timerId = parseInt(timerIdInput.value);
    clearTimeout(timerId);
    dimmer.removeChild(timerIdInput);
  }
}

function setTimer(dimmer, delay) {
  // Clear old timer.
  var timerIdInput = document.getElementById(DIMMER_DIV_ID + "timerId");
  if (timerIdInput) {
    timerId = parseInt(timerIdInput.value);
    clearTimeout(timerId);
  }

  // Set timer.
  var timerId = setTimeout(timeoutFn, Math.round(delay * 1000));

  // Store timer ID.
  if (!timerIdInput) {
    var timerIdInput = document.createElement("input");
    timerIdInput.id = DIMMER_DIV_ID + "timerId";
    timerIdInput.type = "hidden";
    dimmer.appendChild(timerIdInput);
  }
  timerIdInput.value = timerId;
}

function addDimmer(delay, appearance) {
  var dimmer = document.createElement('div');
  dimmer.id = DIMMER_DIV_ID;

  // TODO: add a picture

  // Message
  dimmer.style.color = "#ffffff";
  dimmer.style.paddingTop = window.innerHeight / 2 - 30 + "px";
  dimmer.style.fontSize = '36px';
  dimmer.style.fontFamily = 'Georgia';
  dimmer.style.fontVariant = 'normal';

  var text = document.createElement("div");
  text.innerHTML = DIMMER_TEXT.replace('%d', Math.round(delay));
  text.style.textAlign = "center";
  text.style.paddingTop = "50px";
  text.style.fontSize = "20px";
  dimmer.appendChild(text);

  var switch_text = document.createElement("div");
  switch_text.innerHTML = DIMMER_SWITCH_TEXT;
  switch_text.id = DIMMER_DIV_ID + 'stayput';
  switch_text.style.display = "none";
  switch_text.style.textAlign = "center";
  switch_text.style.paddingTop = "10px";
  switch_text.style.fontSize = "14px";
  switch_text.style.color = "#aaaaaa";
  dimmer.appendChild(switch_text);

  // Positioning.
  dimmer.style.position = "fixed";
  dimmer.style.top = "0px";
  dimmer.style.left = "0px";
  dimmer.style.width = "100%";
  dimmer.style.height = "100%";

  // Background.
  dimmer.style.background = "#001000";
  if (appearance && appearance.transparent) {
    dimmer.style.opacity = "0.95";
  }
  dimmer.style.zIndex = "99999";

  document.body.insertBefore(dimmer, document.body.firstChild);

  return dimmer;
}

// Actions

function create(dimmer_el, delay, appearance) {
  if (!dimmer_el) {
    var dimmer = addDimmer(delay, appearance);
    setTimer(dimmer, delay);
  }
}

function create_suspended(dimmer_el, delay, appearance) {
  if (!dimmer_el) {
    var dimmer = addDimmer(delay, appearance);
  }
}

function suspend(dimmer_el, delay) {
  if (dimmer_el) {
    clearTimer(dimmer_el);
  }
}

function resume(dimmer_el, delay) {
  if (dimmer_el && dimmer_el.style.display != "none") {
    setTimer(dimmer_el, delay);

    var switch_text = document.getElementById(DIMMER_DIV_ID + 'stayput');
    switch_text.style.display = "block";
  }
}

/* Dims the current page for a given time in seconds

   'action' is one of the following:
     - "create": a dimmer is created on the page if it is not already there and a timer is started
     - "create_suspended": a dimmer is created on the page if it is not already there, no timer is started
     - "suspend": the countdown is suspended if there is a dimmer on the page, no-op otherwise
     - "resume": the countdown is resumed if there is a dimmer on the page, no-op otherwise
   
   'delay' is delay time in seconds.
 */
function dim(action, delay, appearance) {
  // Dispatch by action name.
  var action_fns = {
    create: create,
    suspend: suspend,
    resume: resume,
    create_suspended: create_suspended
  };

  var action_fn = action_fns[action];

  var dimmer_el = document.getElementById(DIMMER_DIV_ID);
  action_fn(dimmer_el, delay, appearance);
}

/* Forwarder function for calls using executeScript() */
function invoke_dimmer(args) {
  dim(args.dimmerAction, args.delay, args.appearance);
}

// On initial load, check with the extension whether action needs to be taken.
chrome.extension.sendRequest({}, function(response) {
  if (response.redirectUrl) {
    window.location.href = response.redirectUrl;
  } else if (response.dimmerAction) {
    function delayedDimmerFn() {
      if (document.body != null) {
        // The body of the document has started loading, the dimmer can be shown.
        invoke_dimmer(response);
      } else {
        // The body is not yet available.
        setTimeout(delayedDimmerFn, BODY_POLL_MS);
      }
    }
    // Start polling.
    delayedDimmerFn();
  }
});
