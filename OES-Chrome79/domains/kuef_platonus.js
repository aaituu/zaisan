//--------------------------------------------------
console.log("Platonus kuef is loaded");
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
    if (!isTesting) return;
    if (exn == '') return;
    if (pre == '') return;
    var els = document.querySelectorAll("table tr");
    if (els.length == 0) setTimeout(function(){
      init();
    }, 2000);
    console.log('els', els);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var tds = el.querySelectorAll("td");
      console.log('tds', tds);
      if (tds.length != 5) continue;
      var firstTd = tds[0];
      var secondTd = tds[1];
      var lastTd = tds[4];
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
    var elements = document.querySelectorAll('a[ng-show="showAuthParams"], a[href="#/authorization/parameters"]');
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