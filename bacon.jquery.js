/*global jQuery */
/*!	
* Bacon.jQuery.js 1.0
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
		// Create an array filled with the text we're about to rock
		var wordArray = $(this).html().split(' ');
		var linesUsed = 0;
		
		// Get rid of the old text
		$(this).empty();
		
		// Create a relatively positioned container to work in
		var $this = $("<div></div>").css('position', 'relative').width('100%').height('100%');
		
		// Append our workspace to the element
		$(this).append($this);
		
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
			if (options.type == 'bezier') {
				var pos = getBezier(i/maxLines, coord(options.c1.x, options.c1.y), coord(options.c2.x, options.c2.y), coord(options.c3.x, options.c3.y), coord(options.c4.x, options.c4.y));
				var thisLine = $("<div></div>").addClass('line').css('top', pos.y + 'px').css('width', ($this.width() - pos.x) + 'px').css('height', lineHeight + 'px');
			} else if (options.type == 'dualbezier') {
				var pos = getBezier(i/maxLines, coord(options.c1.x, options.c1.y), coord(options.c2.x, options.c2.y), coord(options.c3.x, options.c3.y), coord(options.c4.x, options.c4.y));
				// I realize that on pos2 I'm currently using the same set of Y coordinates that I used in pos. This is because I got tired of trying to solve for X given the Y coordinate of pos. If you know how to do this, send it my way or fork me on GitHub.
				var pos2 = getBezier(i/maxLines, coord(options.d1.x, options.c1.y), coord(options.d2.x, options.c2.y), coord(options.d3.x, options.c3.y), coord(options.d4.x, options.c4.y));
				var thisLine = $("<div></div>").addClass('line').css('top', pos.y + 'px').css('width', ($this.width() - pos.x - pos2.x) + 'px').css('height', lineHeight + 'px');
			} else if (options.type == 'line') {
				var pos = { x : i*options.step, y : (i/maxLines)*$this.height() };
				var thisLine = $("<div></div>").addClass('line').css('top', pos.y + 'px').css('width', ($this.width() - pos.x) + 'px').css('height', lineHeight + 'px');
			}
			
			// Now that we have our coordinates, create the line and position it
			thisLine.append($("<div></div>").addClass('line_content'));
			
			if (options.align == 'right') {
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
		
		// Loop through each word and begin adding to each line until it's full
		for (i = 0; i < wordArray.length; i++) {
			var oldText = $(".line_content", currentLine).html();			
			$(".line_content", currentLine).append(' ' + wordArray[i]);

			if ($(".line_content", currentLine).width() >= currentLine.width()) {
				$(".line_content", currentLine).html(oldText);
				currentLine = currentLine.next(".line");
				$(".line_content", currentLine).append(wordArray[i]);
			}
			
			// If we're on the last word, then we're on the last line so we need to drop the justify
			if (wordArray[i] == wordArray[wordArray.length-1]) {
				if (options.align == 'right') {
					$(".line_content", currentLine).css('text-align', 'right');
				} else {
					$(".line_content", currentLine).css('text-align', 'left');
				}
			}
		}
		
		// Now that we're done filling in lines with content, change line content width so that it justify's properly
		$(".line_content").width('100%');
	}
})( jQuery );