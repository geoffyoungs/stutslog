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
	$.ajax(LoadData+url, { 'complete' : callback });
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

function iWantDate(date) {
	if (!scrollToDate(date)) {
		if (window.console)
			window.console.log("Can't find %s", date);
		pushLoad(function () {
			var container = $("#journal-pane-container");
			container.scrollTop(container[0].scrollHeight -
					container[0].clientHeight);

			displaySpinner();
			loadDateRange(oldestDate(), date, function () {
				scrollToDate(date);
			});
		});
		// Load journal & display in popup?
	}
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
	
	function clearStyleFromSelection(klass) {
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

	function wrapSelectionIn(inline_snippet, block_snippet) {
		var ranges = [];
		var sel = window.getSelection();
		for (var i = 0; i < sel.rangeCount; i++) {
			ranges.push(sel.getRangeAt(i));
		}
		$.each(ranges, function (index, range) {
			if (rangeIsBlock(range)) {
				range.surroundContents($(block_snippet)[0]);
			} else {
				range.surroundContents($(inline_snippet)[0]);
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
				document.execCommand('unlink', false, null);
				document.execCommand('removeformat', false, null);
				clearStyleFromSelection('Apple-style-span');
			} else if ("highlight" === id) {
				// Should we distinguish between inline snippets & blocks?
				wrapSelectionIn('<span class="journal-entry-highlight"></span>', '<div class="journal-entry-highlight"></div>');
			} else if ("code" === id) {
				// Should we distinguish between inline snippets & blocks?
				wrapSelectionIn('<span class="journal-entry-code"></span>', '<div class="journal-entry-code"></div>');
			} else {
				document.execCommand(id, false, arg);
			}
		});
	});
});
