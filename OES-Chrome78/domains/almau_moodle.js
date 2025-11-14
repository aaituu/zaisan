//-------------------------------------------------------------
var isInited2 = false; var isOesEnabled = false;
window.addEventListener('message', function (event) {
	if (typeof event.data !== 'object') return;
	if (!('msg' in event.data)) return;
	if (!('type' in event.data.msg)) return;
	if (event.data.msg.type != 'yes-exam-going') return;
	console.log('yes-exam-going');
	initOes();
});
console.log("OES: ", window.location.hash);
if (window.location.hash == '#isExam'){
	initOes();
}

function initOes(){
	//-----------------------------------------------------
	if (isInited2) return;
	isInited2 = true;
	isOesEnabled = true;
	//--------------------------------------------------
	function stopExam(){
		window.postMessage("start-exit-moodle");
	}
	//--------------------------------------------------
	if (window.location.pathname.endsWith("/mod/quiz/review.php") || window.location.pathname.endsWith("/moodle/course/view.php")){
		console.log('send start-exit');
		window.postMessage("start-exit");
	}
	//--------------------------------------------------
	console.log('Moodle ALMAU');
	//--------------------------------------------------
	var jqueryLoaded = (function(){
		//--------------------------------------------------
		if (window.location.pathname.endsWith("/mod/quiz/attempt.php") || window.location.pathname.endsWith("/moodle/course/attempt.php")){
			var examName = $('#page h1').text().trim();
			if (examName != ''){
				var msg = {};
				msg['type'] = 'on-exam-name';
				msg['name'] = examName;
				var data = {};
				data['type'] = 'send-data-message';
				data['msg'] = msg;
				window.postMessage(JSON.stringify(data), '*');
			}
		}
		//--------------------------------------------------
		if ($('.quizstartbuttondiv form button[type=submit]').length >= 1){
			$('.quizstartbuttondiv form button[type=submit]').click();
		}
		$('#jump-to-activity').css('display', 'none');
		$('#next-activity-link').css('display', 'none');
		$('#prev-activity-link').css('display', 'none');

		/*
		if ($('.mod_quiz-next-nav').attr('value') == 'Закончить попытку...') $('.mod_quiz-next-nav').attr('value', 'Завершить экзамен');
		$('.othernav .endtestlink').text('Завершить экзамен');
		*/

		if ($('.mod_quiz-next-nav').attr('value') == 'Закончить попытку...') $('.mod_quiz-next-nav').attr('value', 'Завершить');
		$('.othernav .endtestlink').text('Завершить');
		//--------------------------------------------------
		if (window.location.pathname.endsWith("/mod/quiz/startattempt.php")){
			$('#id_submitbutton').click();
		}
		if (window.location.pathname.endsWith("/mod/quiz/summary.php")){

			var parent = $('.quizsummaryofattempt').parent();
			var first = parent.find('.btn-secondary').eq(0);
			var second = parent.find('.btn-secondary').eq(1);

			second.click();

			$(document).on('click', '.moodle-dialogue-confirm input[type=button][value="Отмена"]', function(){
				console.log('click canser');
				first.click();
			});
		}
		//--------------------------------------------------
	});	
	//--------------------------------------------------
	(function() {
		var isInitedJquery = false;
		window.addEventListener('message', function (event) { 
			if (typeof event.data != 'string') return;
			if (!event.data.startsWith('jquery-url-')) return;
			if (isInitedJquery) return;
			isInitedJquery = true;
			
			var jqueryUrl = event.data.substr(11);
			const script = document.createElement("script");
		  	script.src = jqueryUrl;
		  	script.type = 'text/javascript';
		  	script.addEventListener('load', () => {
		    console.log(`jQuery ${$.fn.jquery} has been loaded successfully!`);
		    	console.log("Moodle CU inited jquery");
		   		jqueryLoaded();
		  	});
		  	document.head.appendChild(script);
		});
		window.postMessage("get-jquery-url");
	})();
	//--------------------------------------------------
};
//------------------------------------------------------
document.addEventListener('mouseover', function(e) {
	if (e.target == document) return;
    if (!event.target.matches('.quizstartbuttondiv form button[type=submit], .quizstartbuttondiv form button[type=submit] *')) return;
    //--------------------
    if (isOesEnabled) return;
    if (!isEnabledMe) return;
    //--------------------
    var el = e.target;
    if (el.matches(".oesInited")) return;
    elClone = el.cloneNode(true);
    elClone.classList.add('oesInited');
    el.parentNode.replaceChild(elClone, el);
    //--------------------
});
var isEnabledMe = true;

const xhr = new XMLHttpRequest();
xhr.open("GET", "https://almau.oes.kz/extension/moodle-status.php");
xhr.send();
xhr.responseType = "json";
xhr.onload = () => {
  if (xhr.readyState == 4 && xhr.status == 200) {
    var otv = xhr.response; 
    isEnabledMe = otv.isEnabled;
    console.log("[OES Extension] Got moodle state data", otv, isEnabledMe);
  } else {
    console.log(`Error: ${xhr.status}`);
  }
};
document.addEventListener('click', function(e) {
	//--------------------
	function getCookie(cookieName) {
	  	var cookie = {};
	  	document.cookie.split(';').forEach(function(el) {
	    	var [key,value] = el.split('=');
	    	cookie[key.trim()] = value;
	  	});
	  	return cookie[cookieName];
	}
	//--------------------
  	if (!event.target.matches('.quizstartbuttondiv form button[type=submit], .quizstartbuttondiv form button[type=submit] *')) return;
  	if (isOesEnabled) return;
	//--------------------
  	if (!isEnabledMe) return;
  	console.log("Click submit");
  	e.preventDefault();
	//--------------------
  	var examName = document.querySelector(".page-header-headings h1").innerText;
  	if (examName.trim() == '') {
  		alert("OES: Не могу получить название экзамена");
  		return;
  	}
	//--------------------
	var cookieData = {};
	cookieData['MoodleSession'] = getCookie('MoodleSession');
	//--------------------
  	window.location.href = "https://almau.oes.kz/internal_assignment?system=DEFAULT_MOODLE&examName=" + encodeURIComponent(examName) + "&url=" + encodeURIComponent(window.location.href) + "&backurl=" + encodeURIComponent(window.location.href) + "&cookies=" + encodeURIComponent(JSON.stringify(cookieData));
  	return false;
}); 
//------------------------------------------------------
(function(){
	var isLogged = false;
	var elements = document.querySelectorAll('.menu-action-text');
	for (var i = 0; i < elements.length; i++) {
		var el = elements[i];
		if (el.innerText.trim() == 'Личный кабинет') isLogged = true;
		if (el.innerText.trim() == 'О пользователе') isLogged = true;
		if (el.innerText.trim() == 'Выход') isLogged = true;
	}
	if (isLogged){
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
	}
	//--------------------------------------------------
	if (window.location.pathname.endsWith("/mod/quiz/review.php") || window.location.pathname.endsWith("/moodle/course/view.php") || window.location.pathname.endsWith("/moodle/quiz/view.php")){
		window.postMessage("start-exit");
		try{
			parent.postMessage("do-exit", "*");
			console.log("do-exit");
		} catch (e){
			console.log("do-exit", e);
		}
	}

	if (window.location.pathname.endsWith("/mod/quiz/attempt.php") || window.location.pathname.endsWith("/moodle/course/attempt.php")){
		var examName = $('#page h1').text().trim();
		if (examName != ''){
			var msg = {};
			msg['type'] = 'on-exam-name';
			msg['name'] = examName;
			var data = {};
			data['type'] = 'oes-data-message';
			data['msg'] = msg;
			try{
				parent.postMessage(JSON.stringify(data), '*');
			} catch (e){

			}
		}
	}
	//--------------------------------------------------
})();
//------------------------------------------------------
var msg = {};
msg['type'] = 'is-exam-going';
var data = {};
data['type'] = 'send-data-message';
data['msg'] = msg;
window.postMessage(JSON.stringify(data), '*');
//------------------------------------------------------