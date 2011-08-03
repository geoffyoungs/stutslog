function oldestDate() {
	var last_child = $("#journal-data div[data-date]").last();
	var date = $(last_child).data('date');
	return date;
}

function displaySpinner() {
	$('#journal-data').append('<div id="spinner" style="text-align: center;"><img src="/images/ajax-loader.gif"></div>');
	window.loadingNext = true;
}

function loadRaw(url, callback) {
	$.ajax(LoadData+url).always(function () {
		if (callback)
			callback();
	});
}

function loadBeforeDate(date, limit, callback) {
	loadRaw("?before-date="+date+"&limit="+limit, callback);
}

function loadDateRange(from, to, callback) {
	loadRaw("?date-range="+from+":"+to, callback);
}

function pushLoad(callback, afterLoad) {
	if (!window.loadingNext) {
		if (window.NoMoreData !== true) {
			callback();
		}
	}
}

function iWantMore(limit) {
	var date = oldestDate();
	pushLoad(function () {
		displaySpinner();
		if (window.LoadData) {
			loadBeforeDate(date, limit)
		} else {
			// Not loaded page yet?
			jQuery(function () { loadBeforeDate(date, limit) });
		}
	});
}

function scrollToDate(date) {
	var journal = $(".journal-item[data-date=\""+date+"\"]");

	if (journal.size() > 0) {
		$("#journal-pane-container").scrollTop(journal[0].offsetTop - 4);
		journal.find(".journal-entry").focus();
		return true;
	}

	return false;
}

function parseDateString(dateStr) {
   var regex = /^(\d{4})-(\d{2})-(\d{2})$/;
   var result = dateStr.match(regex);
   if (result) {
       var y, m, d;
       y = parseInt(result[1], 10);
       m = parseInt(result[2], 10);
       d = parseInt(result[3], 10);
       return new Date(y, m, d);
   } else {
       return null;
   }
}

function dateInTheFuture(date) {
	var now = new Date();
	var date = parseDateString(date);

	if (date.year == now.year) {
		if (date.month == now.month) {
			return (date.day > now.day);
		} else {
			return (date.month > now.month);
		}
	} else {
		return (date.year > now.year);
	}
}

function dateInThePast(date) {
	return ! (parseDateString(date) > new Date());
}

function iWantDate(date) {
	if (!scrollToDate(date)) {
		if (dateInTheFuture(date)) {
			// Future date;
			if (window.console)
			window.console.log("Can't find %s - it's in the future", date);

			return;
		}
		var container = $("#journal-pane-container");
		container.scrollTop(container[0].scrollHeight -
					container[0].clientHeight - 34);
		pushLoad(function () {
			displaySpinner();
			loadDateRange(oldestDate(), date, function () {
				scrollToDate(date);
			});
		});
		// Load journal & display in popup if it's too old?
	}
}

function setupChangeEvents() {
	$('[contenteditable]').live('focus', function() {
		var $this = $(this);
		$this.data('before', $this.html());
		return $this;
	}).live('blur keyup paste', function() {
		var $this = $(this);
		if ($this.data('before') !== $this.html()) {
			$this.data('before', $this.html());
			$this.trigger('change');
		}
		return $this;
	});
}

function nodeToText() {
}

jQuery(function ($) {
	var resize = function () {
		$('#journal-pane-container, #sidebar').css('height', ($(window).height()-32)+"px");
		$('#journal-pane').css('min-height', '100%');
		$('#today').css('width', ($('#journal-data').width())+"px");
		var res = $("#search-results");
		res.css('overflow-y','auto');
		res.css('height', ($(window).height() - 32 - res[0].offsetTop)+"px");
	};
	resize();
	$(window).resize(resize);

	setupChangeEvents();

	$('[contenteditable]').live('change', function () {
		// Update ...?
	});

	$('[contenteditable]').live('keyup', function () {
		// What is being typed?
		var sel = window.getSelection()
	});
	
	// Auto-scroll
	var cont = $('#journal-pane-container');
	var spinner = new Image('/images/ajax-spinner.gif');
	cont.scroll(function (e) {
		var node = $("#journal-pane-container")[0];
		// Add 32px padding/warning?
		if (node.scrollTop >= (node.scrollHeight - node.clientHeight - 32)) {
			console.log("Loading more content...");
			iWantMore(1);
		}
	});


	function eachNodeInRange(range, callback) {
		for (var node = range.startContainer;
				node && node !== range.endContainer;
				node = node.nextSibling) {
			if (1 === node.nodeType) {
				callback(node);
			}
		}
	}

	function eachSelectedRange(callback) {
		var sel = window.getSelection();
		for (var i = 0; i < sel.rangeCount; i++) {
			var range = sel.getRangeAt(i);
			callback(range);
		}
	}
	
	function clearClassFromSelection(klass) {
		var blat = [], postscan = [];
		eachSelectedRange(function (range) {
			eachNodeInRange(range, function (node) {
				if ('SPAN' === node.nodeName.toUpperCase()) {
					if ($(node).hasClass(klass)) {
						blat.push(node);
					}
				} else {
					postscan.push(node);
				}
			});
		});
		var eliminate = function(index, node) {
			$(node).replaceWith($(node).html());
		}
		$.each(postscan, function (index, node) {
			$(node).find('SPAN.'+klass).each(eliminate);
			$(node).find('.'+klass).removeClass(klass);
			$(node).removeClass(klass);
		});
		$.each(blat, eliminate);
	}

	function rangeIsBlock(range) {
		var looksLikeBlock = false;

		eachNodeInRange(range, function(node) {
				switch(node.nodeName) {
				case 'BR': case 'DIV': case 'P': case 'LI': case 'H1': case 'H2': case 'H3': case 'H4': case 'H5': case 'H6':
				case 'TABLE': case 'TR': case 'TD': case 'TH': case 'OL': case 'UL': case 'DT': case 'DD': case 'DL':
					looksLikeBlock = true;
					break;
				default:
					// do nothing
				}
		});

		return looksLikeBlock;
	}

	function putRangeContentsIn(range, snippet, klass) {
		var frag = range.extractContents();
		console.log(frag);
		var s = $(snippet);
		s.append(frag);
		range.insertNode(s[0]);
		if (klass)
			s.find('*').addClass(klass);
	}

	function wrapSelectionInClass(klass) {
		var inline_snippet = '<span class="'+klass+'"></span>';
		var block_snippet = '<div class="'+klass+'"></div>';
		eachSelectedRange(function (range) {
			if (rangeIsBlock(range)) {
				putRangeContentsIn(range, $(block_snippet)[0], klass);
			} else {
				putRangeContentsIn(range, $(inline_snippet)[0], klass);
			}
		});
	}

	document.execCommand('styleWithCSS', false, true);
	$("#tools button").each(function () {
		var id = $(this).attr('id');
		var arg = null;
		arg = $(this).data("arg");

		$(this).click(function () {
			console.log("execCommand %s", id);
			if ("removeformat" === id) {
				clearClassFromSelection('Apple-style-span');
				clearClassFromSelection('journal-entry-highlight');
				clearClassFromSelection('journal-entry-code');
				document.execCommand('unlink', false, null);
				document.execCommand('removeformat', false, null);
			} else if ("highlight" === id) {
				// Should we distinguish between inline snippets & blocks?
				wrapSelectionInClass('journal-entry-highlight');
			} else if ("code" === id) {
				// Should we distinguish between inline snippets & blocks?
				wrapSelectionInClass('journal-entry-code');
			} else {
				document.execCommand(id, false, arg);
			}
		});
	});
});
