//-------------------------------------------------------------
var isInited2 = false;
window.addEventListener('message', function (event) {
	if (event.data != 'yes-oes-enabled') return;
	//-----------------------------------------------------
	if (isInited2) return;
	isInited2 = true;
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
	console.log('Moodle KUEF');
	//--------------------------------------------------
	var jqueryLoaded = (function(){
		console.log("Jquery loaded");
		//--------------------------------------------------
		if ($('.quizstartbuttondiv').length >= 1){
			$('.quizstartbuttondiv form').submit();
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

			var form = $("form[action=\"http://uef-astana.kz/mod/quiz/processattempt.php\"");
			form.submit();
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
		    	console.log("Moodle KUEF inited jquery");
		   		jqueryLoaded();
		  	});
		  	document.head.appendChild(script);
		});
		window.postMessage("get-jquery-url");
	})();
	//--------------------------------------------------
});
//--------------------------------------------------
(function(){
	var isLogged = false;
	var elements = document.querySelectorAll('.dropdown-item');
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
})();
//------------------------------------------------------
window.postMessage('is-oes-enabled');
//------------------------------------------------------