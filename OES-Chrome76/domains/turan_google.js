//--------------------------------------------------
function stopExam(){
	window.postMessage("start-exit-moodle");
}
//--------------------------------------------------
var isOesEnabled = false;
window.addEventListener('message', function (event) {
	if (event.data != 'yes-oes-enabled') return;
	isOesEnabled = true;
});
//--------------------------------------------------
var jqueryLoaded = (function(){
	//--------------------------------------------------
	if (!isOesEnabled){
		window.addEventListener('message', function (event) {
			if (event.data != 'yes-oes-enabled') return;
			init();
		});
	} else {
		init();
	}
	//-------------------------------------------------- 
	var parts = window.location.pathname.split('/');
	if (parts[1] == 'courses' && parts[3] == 'quizzes' && parts[5] == 'take'){
		$.get('https://canvas.turan-edu.kz/api/v1/courses/' + parts[2], function(data) {
			var examName = data.name;
			if (examName == null && examName == undefined) return;
			var secondName = $('.quiz-header h1').text();
			var fullname = examName + ', ' + secondName; 
			console.log('examName', fullname);

			var msg = {};
			msg['type'] = 'on-exam-name';
			msg['name'] = fullname;
			var data = {};
			data['type'] = 'send-data-message';
			data['msg'] = msg;
			window.postMessage(JSON.stringify(data), '*');

			sessionStorage['startedOes'] = 1;

		});	
	}
	if ($('.quiz_score').length >= 1 && $('.assessment_results').length >= 1 && $(".quiz-submission").length >= 1 && sessionStorage['startedOes'] == 1) {
		console.log('send start-exit');
		sessionStorage['startedOes']  = 0;
		window.postMessage("start-exit");
	}
	//--------------------------------------------------
	function init(){

		if ($('#take_quiz_link').length >= 1) {
			if (sessionStorage['startedOes'] == 1){
				sessionStorage['startedOes'] = 0;
				$('#take_quiz_link').remove();
				return;
			}
			$('#take_quiz_link').click();
			sessionStorage['startedOes'] = 0;
			return;
		}
		var isVozobnovit = false;
		$('.btn-primary').each(function(index, el) {
			if (isVozobnovit){
				$(this).remove();
				return;
			}
			var text = $(this).text().trim();
			if (text != 'Возобновить контрольную работу') return;
			if (sessionStorage['startedOes'] == 1){
				sessionStorage['startedOes'] = 0;
				isVozobnovit = true;
				$(this).remove();
				return;
			}
			sessionStorage['startedOes'] = 0;
			$(this).click();
			isVozobnovit = true;
			return;
		});
		if (isVozobnovit) return;

		if ($("#questions").length >= 1){
			sessionStorage['startedOes'] = 1;
		}
	}
	//--------------------------------------------------
});
//--------------------------------------------------
(function() {
	if (window.jQuery != undefined){
		jqueryLoaded();
	} else {
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
		    	console.log("Turan Google inited jquery");
		   		jqueryLoaded();
		  	});
		  	document.head.appendChild(script);
		});
		window.postMessage("get-jquery-url");
	}
})();
//--------------------------------------------------
(function(){
	var isLogged = false;
	var elements = document.querySelectorAll('.menu-item__text');
	for (var i = 0; i < elements.length; i++) {
		var el = elements[i];
		if (el.innerText.trim() == 'Аккаунт') isLogged = true;
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
})();
//--------------------------------------------------
console.log("Turan JS");
//--------------------------------------------------