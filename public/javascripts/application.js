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
	//cont.scrollTop(64);
	var i = 0;
	var spinner = new Image('/images/ajax-spinner.gif');
	cont.scroll(function (e) {
		var node = $("#journal-pane-container")[0];

		if (!window.loadingNext) {
			// Add 32px padding/warning?
			if (node.scrollTop >= (node.scrollHeight - node.clientHeight - 32)) {
				console.log("Loading more content...");
				i += 1;
				var h = 83 + parseInt(Math.random() * 300);
				var last_child = $("#journal-data div[data-date]").last();
				var date = $(last_child).data('date');
				
				var load = function () {
					$('#journal-data').append('<div id="spinner" style="text-align: center;"><img src="/images/ajax-loader.gif"></div>');
					$.ajax(LoadData+"?before-date="+date);
					window.loadingNext = true;
				};
				if (window.NoMoreData !== true) {
					if (window.LoadData) {
						load();
					} else {
						// Not loaded page yet?
						jQuery(load);
					}
				}
			}
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
