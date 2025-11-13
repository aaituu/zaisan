//--------------------------------------------------
console.log("Platonus KUNAEVA js is loaded");
//--------------------------------------------------
function setCookie(name, value, options = {}) {
  	options = {
    	path: '/',
    	...options
  	};
  	if (options.expires instanceof Date) {
    	options.expires = options.expires.toUTCString();
  	}
  	let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);
  	for (let optionKey in options) {
    	updatedCookie += "; " + optionKey;
    	let optionValue = options[optionKey];
    	if (optionValue !== true) {
      		updatedCookie += "=" + optionValue;
    	}
  	}
  	document.cookie = updatedCookie;
}
//--------------------------------------------------
if ('token' in localStorage){
	setCookie("set-my-token", localStorage.token, {});
}
//--------------------------------------------------
(function(){

  function init(){
    var hash = window.location.hash;
    var hashParts = hash.split("#");
    var isTesting = false; var exn = ''; var pre = '';
    for (var i = 0; i < hashParts.length; i++) {
      var part = hashParts[i];
      if (part == '/testing/assigned/testings'){
        isTesting = true;
      }
      if (part.startsWith("exn")){
        exn = decodeURIComponent(part.substr(3));
      }
      if (part.startsWith("pre")){
        pre = decodeURIComponent(part.substr(3));
      }
    }
    console.log("Data", isTesting, exn, pre);
    if (!isTesting) {
      console.log("Not is testing");
      return;
    }
    if (exn == '') {
      console.log('exn empty');
      return;
    }
    if (pre == '') {
      console.log('pre empty');
      return;
    } 
    var els = document.querySelectorAll("app-assigned-testings tbody tr");
    if (els.length == 0) setTimeout(function(){
      init();
    }, 2000);  
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var tds = el.querySelectorAll("td"); 
      // if (tds.length != 5) continue;
      var firstTd = tds[0];
      var secondTd = tds[1];
      var lastTd = tds[4];
      console.log('tds', firstTd.textContent.trim());
      if (firstTd.textContent.trim() != exn.trim())  continue;
      if (secondTd.textContent.trim() != pre.trim())  continue;
      console.log('find el', lastTd);
      var a = lastTd.querySelectorAll("a");
      if (a.length == 0) continue;
      a = a[0];
      console.log("Confirm function replacing ", a);
      window.confirm = function(text, defaultValue){
          return true;
      };
      console.log("Sending click to ", a);
      a.click();
    }
  } 

  var isFinished = false;

  function init2(){
    var els = document.querySelectorAll('*[ng-if="vm.testing.completed"]');
    if (els.length == 0) return;
    if (isFinished) return;
    window.postMessage("start-exit");
    isFinished = true;
  }

  init();
  init2();
  setInterval(function(){
    init();
  },1000);

  /*
  window.addEventListener("hashchange", function(){
    init(); 
  }, false);
  */

  setInterval(function(){
    init2();
  }, 5000);
})();
//--------------------------------------------------
(function(){
  var isLogged = false;
  function checkLogin(){
    console.log('tick');
    var elements = document.querySelectorAll('a.dropdown-item');
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (el.innerText.trim() == 'Параметры авторизации') isLogged = true;
    }
    if (!isLogged) return;
    var data = {};
    data['type'] = 'im-logged';
    //
    var args = {};
    args['type'] = 'send-data-message';
    args['msg'] = data;
    args['packetId'] = -1;
    window.postMessage(JSON.stringify(args), '*');
    //
    console.log("OES: send is logged");
    if (timer2 != null) clearInterval(timer2);
  }

  checkLogin(); var timer2 = null;
  if (!isLogged){
    timer2 = setInterval(checkLogin, 1000);
  }
})();
//--------------------------------------------------
if (!('isInitedOES1' in window)) window.isInitedOES1 = false;
(function(){
  //----------------------
  if (window.isInitedOES1 == true)return;
  window.isInitedOES1 = true;
  //----------------------
  var isInitedOES = false;
  //----------------------
  window.addEventListener('message', function (event) {
    if (typeof event.data !== 'object') return;
    if (!('msg' in event.data)) return;
    if (!('type' in event.data.msg)) return;
    if (event.data.msg.type != 'yes-exam-going') return;
    console.log('yes-exam-going');
    isInitedOES = true;
  });
  //----------------------
  var msg = {};
  msg['type'] = 'is-exam-going';
  var data = {};
  data['type'] = 'send-data-message';
  data['msg'] = msg;
  window.postMessage(JSON.stringify(data), '*');
  //----------------------
  var isEnabledMe = true;

  const xhr = new XMLHttpRequest();
  xhr.open("GET", "https://vuzkunaeva.oes.kz/extension/platonus-status.php");
  xhr.send();
  xhr.responseType = "json";
  xhr.onload = () => {
      if (xhr.readyState == 4 && xhr.status == 200) {
        var otv = xhr.response; 
        console.log("[OES Extension] Got platonus state data", otv);
        isEnabledMe = otv.isEnabled;
        init();
      } else {
        console.log(`Error: ${xhr.status}`);
      }
  };
  //----------------------
  document.addEventListener('mouseup', function(e) {
    console.log('isEnabledMe', isEnabledMe);
    if (!isEnabledMe) return;
    console.log('yes enabled', e.target, e.target.matches('app-assigned-testings tbody td a.link-info'));
    if (!e.target.matches('app-assigned-testings tbody td a.link-info')) return;
    console.log('not matches');
    var el = e.target;
    //--------------------
    if (!confirm("Вы уверены что хотите начать экзамен OES?")) return;
    //--------------------
    var tr = el.parentNode.parentNode;
    var tds = tr.querySelectorAll("td");
    if (tds.length == 0){

      tr = el.parentNode.parentNode.parentNode;
      tds = tr.querySelectorAll("td");
    }
    var firstTd = tds[0];
    var secondTd = tds[1];
    var url = window.location.protocol + "//" + window.location.hostname + "/v7/#/testing/assigned/testings#exn" + encodeURIComponent(firstTd.innerText) + "#pre" + encodeURIComponent(secondTd.innerText);
    var name = firstTd.innerText;
    var backurl = window.location.protocol + "//" + window.location.hostname + "/student_register";

    window.location.href = "https://vuzkunaeva.oes.kz/internal_assignment?system=DEFAULT_PLATONUS&examName=" + encodeURIComponent(name) + "&url=" + encodeURIComponent(url) + "&backurl=" + encodeURIComponent(backurl);
    //--------------------
  });
  document.addEventListener('mouseover', function(e) {
    if (!isEnabledMe) return;
    if (e.target == document) return;
    if (!e.target.matches('app-assigned-testings tbody td a.link-info')) return;
    //--------------------
    if (isInitedOES) return;
    //--------------------
    var el = e.target;
    if (el.matches(".oesInited")) return;
    elClone = el.cloneNode(true);
    elClone.classList.add('oesInited');
    el.parentNode.replaceChild(elClone, el);
    //--------------------
  });
  document.addEventListener('focus', function(e) {
    if (!isEnabledMe) return;
    if (e.target == document) return;
    if (!e.target.matches('app-assigned-testings tbody td a.link-info')) return;
    //--------------------
    if (isInitedOES) return;
    //--------------------
    var el = e.target;
    if (el.matches(".oesInited")) return;
    elClone = el.cloneNode(true);
    elClone.classList.add('oesInited');
    el.parentNode.replaceChild(elClone, el);
    //--------------------
  });
  //----------------------
  function init(){
    if (!isEnabledMe) return;
    if (document.querySelectorAll("app-assigned-testings").length == 0) return;
    
    if (isInitedOES){
      setStatus("Идет сеанс прокторинга OES");
    } else {
      setStatus("Прокторинг OES работает"); 
    }

    var els = document.querySelectorAll("app-assigned-testings tbody td a.link-info");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.matches(".oesInited")) continue;
      elClone = el.cloneNode(true);
      elClone.classList.add('oesInited');
      el.parentNode.replaceChild(elClone, el);
    }
  }
  function setStatus(status){
    var el = document.querySelector(".oes-status");
    if (el != null) document.querySelector(".oes-status").remove();
    var p = document.createElement("p");
    p.innerText = status;
    p.classList.add("oes-status");
    document.querySelector('.main-box-body').after(p);
  }

  setTimeout(init, 1000);
  setTimeout(init, 2000);
  setTimeout(init, 3000);
  setTimeout(init, 4000);
  setTimeout(init, 5000);
  //----------------------
})();
//--------------------------------------------------