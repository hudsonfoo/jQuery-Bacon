/*global jQuery */
/*!
* Bacon.jQuery.js 1.0
*
* Copyright 2011, David Hudson http://davidhudson.me
*/

(function( $ ){
	function coord(x,y) {
		// allow passing a {x:1, y:2} as first & only argument to this function
		if( x.x || x.y ) {
			x = x.x;
			y = x.y;
		}

		// default values
		x = x || 0;
		y = y || 0;

		return {x: x, y: y};
	}

	function B1(t) { return t*t*t; }
	function B2(t) { return 3*t*t*(1-t); }
	function B3(t) { return 3*t*(1-t)*(1-t); }
	function B4(t) { return (1-t)*(1-t)*(1-t); }

	function getBezier(percent,C1,C2,C3,C4) {
		var pos = new coord();
		pos.x = C4.x*B1(percent) + C3.x*B2(percent) + C2.x*B3(percent) + C1.x*B4(percent);
		pos.y = C4.y*B1(percent) + C3.y*B2(percent) + C2.y*B3(percent) + C1.y*B4(percent);
		return pos;
	}

	$.fn.bacon = function( options ) {
		var $this, $currentLine, $lineContent,
			wordArray, testLine, lineHeight, pos, pos2, thisLine, oldText,
			maxLines, i, wordLength, offset;


		// default options values
		if (options.align !== 'right') {
			options.align = 'left';
		}


		// Create an array filled with the text we're about to rock
		wordArray = this.html().split(' ');

		// Get rid of the old text
		this.empty();

		// Create a relatively positioned container to work in
		$this = $("<div></div>").css('position', 'relative').width('100%').height('100%');

		// Append our workspace to the element
		this.append($this);

		// Figure out how many lines can we fit
		// Start by creating an invisible test line
		testLine = $("<div></div>").css('visibility', 'hidden').text('test');

		$this.append(testLine);

		// Check the height
		lineHeight = testLine.height();

		// Remove the test line, we're done with it
		testLine.remove();

		// Get the max number of lines that will fit given the height of the test line
		maxLines = Math.floor($this.height() / lineHeight);

		// Create our empty lines
		for (i = 0; i < maxLines; i++) {

			// reset on each loop
			pos = null;
			offset = 0;

			// Find our lines coordinates based on type choosen
			if (options.type === 'bezier' || options.type === 'dualbezier') {
				pos = getBezier(i/maxLines, coord(options.c1), coord(options.c2), coord(options.c3), coord(options.c4));
			} else if (options.type === 'line') {
				pos = { x : i*options.step, y : (i/maxLines)*$this.height() };
			}

			if (options.type === 'dualbezier') {
				// I realize that on pos2 I'm currently using the same set of Y coordinates that I used in pos. This is because I got tired of trying to solve for X given the Y coordinate of pos. If you know how to do this, send it my way or fork me on GitHub.
				pos2 = getBezier(i/maxLines, coord(options.d1), coord(options.d2), coord(options.d3), coord(options.d4));
				offset = pos2.x;
			}

			if (pos) {
				thisLine = $("<div></div>").addClass('line').css('top', pos.y + 'px').css('width', ($this.width() - pos.x - offset) + 'px').css('height', lineHeight + 'px');
			}

			// Now that we have our coordinates, create the line and position it
			thisLine.append($("<div></div>").addClass('line_content'));

			thisLine.css(options.align, pos.x + 'px');

			$this.append(thisLine);
		}

		// We've created our empty lines, now we need to fill them.
		// Set the starting line
		$currentLine = $this.find(".line:first");

		// Loop through each word and begin adding to each line until it's full
		for (i = 0, wordLength = wordArray.length; i < wordLength; i++) {
			$lineContent = $currentLine.find(".line_content");

			oldText = $lineContent.html();
			$lineContent.append(' ' + wordArray[i]);

			if ($lineContent.width() >= $currentLine.width()) {
				$lineContent.html(oldText);
				$currentLine = $currentLine.next(".line");
				$lineContent.append(wordArray[i]);
			}

			// If we're on the last word, then we're on the last line so we need to drop the justify
			if (wordArray[i] === wordArray[wordLength-1]) {
				$lineContent.css('text-align', options.align);
			}
		}

		// Now that we're done filling in lines with content, change line content width so that it justify's properly
		$(".line_content").width('100%');
	};
})( jQuery );