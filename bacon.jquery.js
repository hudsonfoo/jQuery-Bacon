/*global jQuery */
/*!	
* Bacon.jQuery.js 1.5
*
* Copyright 2011, David Hudson http://davidhudson.me
*/

(function( $ ){
	coord = function (x,y) {
		if (!x) var x=0;
		if (!y) var y=0;

		return {x: x, y: y};
	}

	function B1(t) { return t*t*t }
	function B2(t) { return 3*t*t*(1-t) }
	function B3(t) { return 3*t*(1-t)*(1-t) }
	function B4(t) { return (1-t)*(1-t)*(1-t) }

	function getBezier(percent,C1,C2,C3,C4) {
		var pos = new coord();
		pos.x = C4.x*B1(percent) + C3.x*B2(percent) + C2.x*B3(percent) + C1.x*B4(percent);
		pos.y = C4.y*B1(percent) + C3.y*B2(percent) + C2.y*B3(percent) + C1.y*B4(percent);
		return pos;
	}
	
	$.fn.bacon = function( options ) { 
		var settings = $.extend( {
		  'text-align'	: 'justify'
		}, options);
		
		var textNodes, // all textNodes (as opposed to elements)
			copy = null, // jQuery object for copy of the current element
			el = $(this), // just so we know what we're working with
			recurseThroughNodes, // function to do the spitting/moving
			insertedBreaks, // jQuery collection of inserted line breaks
			linesUsed = 0, // Number of lines actually used after splitting everything up
			styleAttr; // Backup of the element's style attribute
		
		// Create a relatively positioned container to work in
		var $this = $("<div></div>").css('position', 'relative').width('100%').height('100%');
		
		// Clone the element and empty the original
		copy = el.clone().removeClass('demo_bacontext');
		//console.log(copy);
		//console.log(el);
		el.empty();
		
		// Append our workspace to the element
		el.append($this);
		
		// Figure out how many lines can we fit
		// Start by creating an invisible test line
		var testLine = $("<div></div>").css('visibility', 'hidden').text('test');
		
		$this.append(testLine);
		
		// Check the height
		var lineHeight = testLine.height();
		
		// Remove the test line, we're done with it
		testLine.remove();
		
		// Get the max number of lines that will fit given the height of the test line
		var maxLines = Math.floor($this.height() / lineHeight);
		
		// Create our empty lines
		for (i = 0; i < maxLines; i++) {
			// Find our lines coordinates based on type choosen
			if (settings.type == 'bezier') {
				var pos = getBezier(i/maxLines, coord(settings.c1.x, settings.c1.y), coord(settings.c2.x, settings.c2.y), coord(settings.c3.x, settings.c3.y), coord(settings.c4.x, settings.c4.y));
				var thisLine = $("<div></div>").addClass('line').css('top', pos.y + 'px').css('width', ($this.width() - pos.x) + 'px').css('height', 'auto');
			} else if (settings.type == 'dualbezier') {
				var pos = getBezier(i/maxLines, coord(settings.c1.x, settings.c1.y), coord(settings.c2.x, settings.c2.y), coord(settings.c3.x, settings.c3.y), coord(settings.c4.x, settings.c4.y));
				// I realize that on pos2 I'm currently using the same set of Y coordinates that I used in pos. This is because I got tired of trying to solve for X given the Y coordinate of pos. If you know how to do this, send it my way or fork me on GitHub.
				var pos2 = getBezier(i/maxLines, coord(settings.d1.x, settings.c1.y), coord(settings.d2.x, settings.c2.y), coord(settings.d3.x, settings.c3.y), coord(settings.d4.x, settings.c4.y));
				var thisLine = $("<div></div>").addClass('line').css('top', pos.y + 'px').css('width', ($this.width() - pos.x - pos2.x) + 'px').css('height', 'auto');
			} else if (settings.type == 'line') {
				var pos = { x : i*settings.step, y : (i/maxLines)*$this.height() };
				var thisLine = $("<div></div>").addClass('line').css('top', pos.y + 'px').css('width', ($this.width() - pos.x) + 'px').css('height', 'auto');
			}
			
			// Now that we have our coordinates, create the line and position it
			thisLine.append($("<div></div>").addClass('line_content').css('text-align', settings['text-align']));
			
			if (settings.align == 'right') {
				thisLine.css('right', pos.x + 'px');
			} else {
				thisLine.css('left', pos.x + 'px');
			}
			
			$this.append(thisLine);
			linesUsed++;
		}
		
		// We've created our empty lines, now we need to fill them.		
		// Set the starting line
		currentLine = $(".line:first", $this);	
		
		recurseThroughNodes = function (currentNode, copyNode) {
			$(copyNode).contents().each(function () {
				var nextCopy;

				// If this is a text node
				if (this.nodeType == 3) {
					if ($(currentNode).hasClass('line_content')) currentNode = $(".line_content", currentLine);
					var currentLineHeight = $(".line_content", currentLine).height();
					// move it to the original element
					$(this).appendTo(currentNode);
				} else {
					// Make an empty copy and put it in the original,
					// so we can copy text into it
					nextCopy = $(this).clone().empty()
							.appendTo(currentNode);
					recurseThroughNodes(nextCopy, this);
				}				
				
				// If the width is too great for the current line to hold it, put the current line back the way it was, switch to the next line and apply text node to new line
				if ($(".line_content", currentLine).width() >= currentLine.width() || $(".line_content", currentLine).height() > currentLineHeight) {
					// If we're in the middle of a non line node and there's not enough room for it to fit, 
					if (!$(currentNode).hasClass('line_content')) {
						// Remove the text node from the line so we're not going overboard
						$(this, currentNode).remove();
						currentLine = currentLine.next(".line");

						currentNode = $(copyNode).clone().empty()
							.appendTo($(".line_content", currentLine));
						currentNode.append(this);
					} else {
						$(this, currentNode).remove();
						currentLine = currentLine.next(".line");
						currentNode = $(".line_content", currentLine);
						$(".line_content", currentLine).append(this);
					}
				}
			});
		};
		
		// Get text nodes: .find gets all non-textNode elements, contents
		// gets all child nodes (inc textNodes) and the not() part removes
		// all non-textNodes.
		textNodes = copy.find('*').add(copy).contents()
			.not(copy.find('*'));

		// Split each textNode into individual textNodes, one for each
		// word
		textNodes.each(function (index, lastNode) {
			var startOfWord = /\W\b/,
				result;
			while (startOfWord.exec(lastNode.nodeValue) !== null) {
				result = startOfWord.exec(lastNode.nodeValue);
				// startOfWord matches the character before the start of a
				// word, so need to add 1.
				lastNode = lastNode.splitText(result.index + 1);
			}
		});

		// Go through all the nodes, going recursively deeper, until we've
		// inserted line breaks in all the text nodes
		recurseThroughNodes($(".line_content", currentLine), copy);

		// Now that we're done filling in lines with content, change line content width so that it justify's properly
		$(".line_content").width('100%');
		
		// Clean up line spacing as well
		var totalLinesHeight = 0;
		$(".line", $this).each(function() {
			$(this).css('top', totalLinesHeight + 'px');
			totalLinesHeight += $('.line_content', this).height();
			$('.line_content', this).append(' &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
		});
	}
})( jQuery );