//--------------------
window.OesCounter = function(externalCSS, maxCount, oesSite){
	console.log("[OES Extension] Is enabled counter", externalCSS, maxCount, oesSite);
	var isOesEnabled = false;

	var counterManager = (function(){
		//----------------
		var isInited = false;
		function init(){
			console.log('Init 1', 'isOesEnabled');
			if (document.querySelectorAll('.oes-content').length != 0) return; 
			console.log('Init 2', 'isOesEnabled');
			var myDiv = document.createElement("div");
			myDiv.innerHTML = "<div class='oes-wrapper'>\
				<div class='oes-bottom'>\
					<img src=\"https://"+oesSite+"/logos/logo-white-without-label.svg\" alt=\"OES Proctoring\" height=\"20\"> \
					<span class='oes-counter'>Нарушения</span>\
					<i class='mdi mdi-chevron-down'></i>\
				</div>\
				<div class='oes-content'>\
					\
				</div>\
			</div>";
			//------------ 
			console.log("inited", myDiv);
			//------------
			myDiv.innerHTML += '<link rel="stylesheet" type="text/css" href="' + externalCSS + '">';
			myDiv.innerHTML += '<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap" rel="stylesheet">';
			myDiv.innerHTML += '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/MaterialDesign-Webfont/6.5.95/css/materialdesignicons.min.css" integrity="sha512-Zw6ER2h5+Zjtrej6afEKgS8G5kehmDAHYp9M2xf38MPmpUWX39VrYmdGtCrDQbdLQrTnBVT8/gcNhgS4XPgvEg==" crossorigin="anonymous" referrerpolicy="no-referrer" />';
			//------------
			document.body.appendChild(myDiv); 
			//------------
		}
		
		
		//----------------
		//<div>Нарушение: Переключение вкладки<div class='oes-time'>19:10</div></div>\
		//----------------
		document.addEventListener('click', function(event) {
	  		if (!event.target.matches('.oes-bottom, .oes-bottom *')) return;
	  		if (isCancelableWidget) return;
	    	event.preventDefault();
	    	document.querySelector('.oes-wrapper').classList.toggle("opened");
		}, false);

		//----------------
		function toast(text){
			console.log("[Oes Extension] Got toast cheat", text);
			var timer = null; var isDeleting = false;

			var toastDiv = document.createElement("div");
			toastDiv.classList.add("oes-toast");
			toastDiv.innerHTML = "<div class='oes-toast-icon'><i class='mdi mdi-alert'></i></div><div class='oes-toast-text'>"+text+"</div>";
			document.body.appendChild(toastDiv); 
			setToastTops();

			toastDiv.onmouseover = function(event) {
				clearTimeout(timer);
			};

			toastDiv.onmouseout = function(event) {
				if (isDeleting) return;
				clearTimeout(timer);
				timer = setTimeout(clear, 5000);
			};

			timer = setTimeout(clear, 5000);
			function clear(){
				isDeleting = true;
				toastDiv.classList.add("oes-deleting");
				timer = setTimeout(function(){
					toastDiv.remove();
					setToastTops();
				}, 500);			
			}

			setTimeout(function(){
				toastDiv.classList.add("oes-ready");
			}, 10);
		}
		function setToastTops(){
			var toasts = document.querySelectorAll('.oes-toast');
			var top = toasts.length * 60 - 60;
			toasts.forEach(function(el){
				el.style.marginTop = top + 'px';
				top = top - 60;
			});
		} 
		//----------------
		if (!isOesEnabled){
			window.addEventListener('message', function (event) {
				if (event.data != 'yes-oes-enabled') return;
				init();
			});
		} else {
			init();
		}
		console.log('isOesEnabled', isOesEnabled);
		//----------------
		function jqueryLoadedCounter(){
			console.log("initing jquery part");
			initFloatingWidget();
			initWindowMove();
			//initWindowResize();
			initWindowButtons();

			var isInitedWindow = false;
			$(document).on('click', '.oes-top', function(event) {
				if (!isInitedWindow){
					$('.oesWindow iframe').attr('src', 'https://www.desmos.com/testing/virginia/scientific');
					isInitedWindow = true;
				}
				$('.oesWindow').css('display', 'flex');
			});
		}
		//----------------
		var isCancelableWidget = false;
		function initFloatingWidget(){
			var doc = $(document); var latestElement = null; var body = $('body');
			var sX, sY; var win = $(window);
			var desktop = $(window);

			var timeout = null; var latestElementCandidate = null;
			//-----------------------------------------------------------
			doc.on('mousedown', '.oes-wrapper .oes-bottom, .oes-wrapper .oes-top', function(e){
				if (e.which != 1)  return;
				if ($(e.target).hasClass('noDraggable')) return;
				if ($(e.target).parents('.noDraggable').length != 0) return;

				latestElementCandidate = $(this);
				e.preventDefault();
				sX = e.pageX - latestElementCandidate.offset().left + 4;
				sY = e.pageY - latestElementCandidate.offset().top + 4;
			//-----------------------------------------------------------
			}).on('mouseup', function(e){
				if (latestElementCandidate != null) latestElementCandidate = null;

				if (latestElement == null) return;
				isCancelableWidget = true;
				latestElement = null;
				clearTimeout(timeout);
				timeout = setTimeout(function(){
					isCancelableWidget = false;
				}, 100);
				return false;
			//-----------------------------------------------------------
			}).on('mousemove', function(e){
				if (latestElementCandidate != null) {
					latestElement = latestElementCandidate;
					latestElementCandidate = null;
				}
				if (latestElement == null) return;

				var x = e.pageX - sX; var y = e.pageY - sY;
				var w = latestElement.parent().outerWidth(true); var h = latestElement.parent().outerHeight(true);
				//-------------------------------------------------------
				if (x < -4) x = -4; if (y < -4) y = -4;
				/*
				if (y + h > desktop.offset().top + desktop.outerHeight(true)) 
					y = desktop.offset().top + desktop.outerHeight(true) - h;
				if (x + w > desktop.offset().left + desktop.outerWidth(true)) 
					x = desktop.offset().left + desktop.outerWidth(true) - w;
				*/
				//-------------------------------------------------------
				if (x + latestElement.outerWidth(true) >= win.width()){
					x = win.width() - latestElement.outerWidth(true);
				}
				//-------------------------------------------------------
				latestElement.parent().css('left', x);
				//latestElement.parent().css('top', y);
				//-------------------------------------------------------
			});
			window.offResize2 = function(){
				latestElement = null;
				if (latestElementCandidate != null) latestElementCandidate = null;
			}
			//-----------------------------------------------------------
		}
		//----------------
		var initWindowMove = (function(){
			var doc = $(document); var latestElement = null; var body = $('body');
			var sX, sY; 
			var win = $(window);
			//-----------------------------------------------------------
			doc.on('mousedown', '.oesWindow:not(.full) > .content > .header', function(e){
				if (e.which != 1)  return;
				if ($(e.target).hasClass('noDraggable')) return;
				if ($(e.target).parents('.noDraggable').length != 0) return;

				latestElement = $(this);
				e.preventDefault();
				sX = e.pageX - latestElement.offset().left + 4;
				sY = e.pageY - latestElement.offset().top + 4;
			//-----------------------------------------------------------
			}).on('mouseup', function(e){
				if (latestElement == null) return;
				latestElement = null;
			//-----------------------------------------------------------
			}).on('mousemove', function(e){
				if (latestElement == null) return;
				var x = e.pageX - sX; var y = e.pageY - sY;
				var w = latestElement.parent().outerWidth(true); var h = latestElement.parent().outerHeight(true);
				//-------------------------------------------------------
				if (x < -4) x = -4; if (y < -4) y = -4;
				if (y + h > win.height()) 
					y = win.height() - h;
				if (x + w > win.width()) 
					x = win.width() - w;
				//-------------------------------------------------------
				latestElement.parent().parent().css('left', x);
				latestElement.parent().parent().css('top', y);
				//-------------------------------------------------------
			});
			window.offResize = function(){
				latestElement = null;
			}
			//-----------------------------------------------------------
		});
		var initWindowResize = (function(){
		 	var doc = $(document); var latestElement = null; var body = $('body');
		 	var sX, sY, sW, sH, oX, oY; var padding = 8;
			var win = $(window); var nX = 0; var nY = 0;
			window.resisingIcon = false;
			//-----------------------------------------------------------
			var minWidth = 500; var minHeight = 400;
			//-----------------------------------------------------------
			doc.on('mousemove', '.oesWindow:not(.full)', function(e){

				//--------------------------------------------------------
				var t = $(this);
				var iX = e.pageX - t.offset().left;
				var iY = e.pageY - t.offset().top;
				var iW = t.width();
				var iH = t.height();
				var c = false;
				//--------------------------------------------------------
				var jX = 0;
				var jY = 0;
				//--------------------------------------------------------
				if (0+padding >= iX) jX = 1; else
				if (iW-padding <= iX)jX = -1; 
				if (0+padding >= iY) jY = 1; else
				if (iH-padding <= iY)jY = -1;
				//--------------------------------------------------------
				//if (jX == 0 && jY == -1) if (iW-padding*2 <= iX) jX = -1;
				//--------------------------------------------------------
				if ($(e.target).hasClass('noDraggable')) {jX = 0; jY = 0;}
				if ($(e.target).parents('.noDraggable').length != 0) {jX = 0; jY = 0;}
				//--------------------------------------------------------
				if (jX == 1 && jY == 1){
					t.css('cursor', 'nw-resize');
				} else if (jX == 1 && jY == -1){
					t.css('cursor', 'sw-resize');
				} else if (jX == -1 && jY == 1){
					t.css('cursor', 'ne-resize');
				} else if (jX == -1 && jY == -1){
					t.css('cursor', 'se-resize');
				} else if (jX == 1){
					t.css('cursor', 'w-resize');
				} else if (jX == -1){
					t.css('cursor', 'e-resize');
				} else if (jY == 1){
					t.css('cursor', 'n-resize');
				} else if (jY == -1){
					t.css('cursor', 's-resize');
				}
				if (jY != 0) c = true; if (jX != 0) c = true;
				window.resisingIcon = c;
				//--------------------------------------------------------
				if (t.data('cursor') == true && c == false) t.css('cursor', 'default');
				if (t.data('cursor') == true && c == false) t.data('cursor', false);
				if (t.data('cursor') != true && c == true) t.data('cursor', true);
				//--------------------------------------------------------
			}).on("mouseleave", ".oesWindow:not(.full)", function(){
				 window.resisingIcon = false;
			}).on('mousedown', '.oesWindow:not(.full)', function(e){
				if (e.which != 1)  return;

				var t = $(this);
				sX = e.pageX - t.offset().left;
				sY = e.pageY - t.offset().top;
				oX = e.pageX;
				oY = e.pageY;
				sW = t.width();
				sH = t.height();
				var c = false;
				//--------------------------------------------------------
				nX = 0; nY = 0;
				if (0+padding >= sX) nX = 1; else
				if (sW-padding <= sX)nX = -1; 
				if (0+padding >= sY) nY = 1; else
				if (sH-padding <= sY)nY = -1;
				//--------------------------------------------------------
				if ($(e.target).hasClass('noDraggable')) {nX = 0; nY = 0;}
				if ($(e.target).parents('.noDraggable').length != 0) {nX = 0; nY = 0;}
				//--------------------------------------------------------
				if (nY != 0) c = true; if (nX != 0) c = true;
				if (c != true) return;
				latestElement = $(this);
				window.offResize();
				//--------------------------------------------------------
			}).on('mouseup', function(e){
				if (latestElement == null) return;
				latestElement = null;
			}).on('mousemove', function(e){
				if (latestElement == null) return;
		 		window.offResize();
		 		e.preventDefault();
				//--------------------------------------------------------
				if (nX == 1){
					var left = e.pageX - sX;
					var right = oX + sW - sX;
					if (left < 0) left = 0;
					if (right - left >= minWidth){
						latestElement.css('left', left);
						latestElement.css('width', right - left  );
					}
				}  else if (nX == -1){
					var left = latestElement.offset().left;
					var right = e.pageX - sX + sW;
					if (right >= win.width) 
						right = win.width;
					if (right - left >= minWidth){
						latestElement.css('width', right - left  );
					}
				}

				if (nY == 1){
					var top = e.pageY - sY;
					if (top < 0) top = 0;
					var bottom = oY + sH - sY;
					if (bottom - top >= minHeight){
						latestElement.css('top', top);
						latestElement.css('height', bottom - top);
					}
				} else if (nY == -1){
					var top = latestElement.offset().top;
					var bottom = e.pageY - sY + sH;
					if (bottom >= win.height()) 
						bottom = win.height();
					if (bottom - top >= minHeight){
						latestElement.css('height', bottom - top);
					}
				}
				//--------------------------------------------------------

			});
			//-----------------------------------------------------------
		});
		//--------------------------------------------------------------

		//--------------------------------------------------------------
		var initWindowButtons = (function(){
			$(document).on('click', '.oesWindow  .icons > .min', function(event) {
				if (event.which != 1)  return;
				if (window.resisingIcon) return;
				var win = $(this).parents('.oesWindow');
				win.css('display', 'none');
			}).on('click', '.oesWindow  .icons > .up', function(event) {
				if (event.which != 1)  return;
				if (window.resisingIcon) return;
				var win = $(this).parents('.oesWindow');
				if (win.hasClass('full')){
					win.removeClass('full');
					$(this).addClass('mdi-chevron-up').removeClass('mdi-chevron-down');
				} else {
					win.addClass('full');
					$(this).removeClass('mdi-chevron-up').addClass('mdi-chevron-down');
				}
			}).on('click', '.oesWindow .icons > .close', function(event){
				if (event.which != 1)  return;
				if (window.resisingIcon) return;
				var win = $(this).parents('.oesWindow');
				win.css('display', 'none');
			}).on('dblclick', '.oesWindow .header', function(e){
				if ($(e.target).hasClass('noDraggable')) return;
				if ($(e.target).parents('.noDraggable').length != 0) return;
				var win = $(this).parents('.oesWindow');
				if (win.hasClass('full')){
					win.removeClass('full');
					win.find('.up').addClass('mdi-chevron-up').removeClass('mdi-chevron-down');
				} else {
					win.addClass('full');
					win.find('.up').removeClass('mdi-chevron-up').addClass('mdi-chevron-down');
				}
			});
		});
		
		//----------------
		(function() {
			if (window.jQuery != undefined){
				jqueryLoadedCounter();
				return;
			}
			window.addEventListener('message', function (event) { 
				if (typeof event.data != 'string') return;
				if (!event.data.startsWith('jquery-url-')) return;
				var jqueryUrl = event.data.substr(11);
				const script = document.createElement("script");
			  	script.src = jqueryUrl;
			  	script.type = 'text/javascript';
			  	script.addEventListener('load', () => {
			    console.log(`jQuery ${$.fn.jquery} has been loaded successfully!`);
			   		jqueryLoadedCounter();
			  	});
			  	document.head.appendChild(script);
			});
			window.postMessage("get-jquery-url");
		})();
		//----------------
		return {
			onBringData: onBringData,
			init: init
		}
		//----------------
	})();
	window.counterManager = counterManager;
	//--------------------
	window.addEventListener('message', function (event) { 
		if (event.data != 'yes-oes-enabled' && event.data != 'yes-oes-enabled-exam') return;
		console.log("Set oes enabled", 'isOesEnabled');
		isOesEnabled = true;
		counterManager.init();
	});
	//--------------------
	window.postMessage('is-oes-enabled-exam');
	setInterval(function(){
		if (isOesEnabled) return;
		window.postMessage('is-oes-enabled-exam');
	}, 5000);
	//--------------------
}