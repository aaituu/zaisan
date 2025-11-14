console.log('general indigo');


//--------------------------------------------------
(function(){
  var isLogged = false;
  function checkLogin(){
	var elements = document.querySelectorAll('.ui-state-default');
	for (var i = 0; i < elements.length; i++) {
		var el = elements[i];
		if (el.innerText.trim() == 'Выход') isLogged = true;
		if (el.innerText.trim() == 'Профиль') isLogged = true;
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
(function(){
	var isLogged = false;
	var elements = document.querySelectorAll('.ui-state-default');
	for (var i = 0; i < elements.length; i++) {
		var el = elements[i];
		if (el.innerText.trim() == 'Выход') isLogged = true;
		if (el.innerText.trim() == 'Профиль') isLogged = true;
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
(function(){
	if (window.location.hash == '') return;
	if (window.location.hash == '#') return;
	if (!window.location.hash.startsWith('#startExam=')) return;
	var id = window.location.hash.substr( '#startExam='.length );
	id = id.trim();
	id = parseInt(id);
	if (!Number.isInteger(id)) return;
	if (id == NaN) return;
	window.location.hash = '#';

	$.ajax({
        type: "POST",
        url: "modules/testing/start.php",
        data: {
            test_id: id
        },
        dataType: "text",
        timeout: 12E4,
        cache: !1,
        success: function(a) {
            Testing.StartTesting();
        },
        error: function() {
            UI.DialogAlert(_("error_no_connection"));
            b(!0)
        },
        complete: function() {
            $("#ProcessingIndicator").remove()
        }
    });

})();
//--------------------------------------------------
(function(){
	var isGone = false;
	setTimeout(function(){
		setInterval(function(){
			if (isGone) return;
			if ($('#close_results_button').length <= 0) return;
			if ($('#show_protocol_button').length <= 0) return;

			Testing.CloseTestingSession(0)
			isGone = true;

			console.log('send start-exit');
			window.postMessage("start-exit");
		}, 5000);
	}, 10000);	
})();
//--------------------------------------------------
var isEnabledMe = true;

const xhr = new XMLHttpRequest();
xhr.open("GET", "https://dku.oes.kz/extension/indigo-status.php");
xhr.send();
xhr.responseType = "json";
xhr.onload = () => {
	if (xhr.readyState == 4 && xhr.status == 200) {
        var otv = xhr.response; 
        isEnabledMe = otv.isEnabled;
        console.log("[OES Extension] Got indigo state data", otv, isEnabledMe);
	} else {
        console.log(`Error: ${xhr.status}`);
	}
};
//--------------------------------------------------