/**
 * Copyright (c) 2011 Fernando Bevilacqua, <url>
 * 
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var Waker = new function() {
	this.CONTENT_FOLDER = "./";
	
	this.config = {
		'enableTouchGestures': 	false,	
		'gestureOpenToc': 		'doubletap',  // It can be more than one, such as 'doubletap hold'.
	};
	
	var mCurrentPage 	= 0;
	var mLastViewedPage = 0;	
	var mPages 			= [];
	var mSpinner		= null;

	/**
	 * Builds the toc panel (the one that slides from the left). The index is generated based on the
	 * information loaded from "config.html".
	 */
	var buildTocPanel = function() {
		var i, aToc = $('#toc');
		
		aToc.empty();
		
		for(i = 0; i < mPages.length; i++) {
			aToc.append('<a class="toc-link" href="javascript:void(0)" onclick="Waker.gotoPage('+i+')">' + 
							'<div class="toc-item">' +
								'<div class="toc-number">'+(i == 0 ? "C" : i)+'</div>'+
								'<img class="toc-thumb" src="' + Waker.CONTENT_FOLDER + mPages[i].thumb + '" />'+
								'<h1>'+mPages[i].title+'</h1>'+
								'<p>'+mPages[i].desc+'</p>'+
							'</div>' +
						'</a>');
		}
	};

	/**
	 * Updates de navbar (buttons/infos in the upper left corner of the page) according to the current
	 * page. If the user is reading the last page, for instance, the "next" button is disabled.
	 */
	var updateNavBar = function() {
		//$('.logo-small').hide();
		
		if(mCurrentPage == mPages.length - 1) {
			$('#next-button').fadeOut();
		} else {
			$('#next-button').fadeIn();
		}

		if(mCurrentPage == 0) {
			$('#prev-button').fadeOut();
			//$('#toc-button').fadeOut();
			//$('#dossier-number').fadeOut();
		} else {
			$('#prev-button').fadeIn();
			//$('#toc-button').fadeIn();
			//$('#dossier-number').html("<p>"+mCurrentPage+"</p>").fadeIn();
		}
	};
	
	/**
	 * Updates the headline image of the page according to the meta data collected in the index.
	 * This method must be called every time the user changes the current page, so the old
	 * headline image can be replaced by the new one.
	 * 
	 * This method inspects the "page-content" div looking for <img> tags with class "img-headline".
	 * When the image is found, its src attribute is used to set the headline image in "index.html", then
	 * it *removes* the image from the "page-content" div. If the "page-content" is empty, this
	 * method will perform no action.  
	 */
	var updateHeadlineImage = function() {
		var aHeadlineImgs = $('#page-content img.img-headline');
		
		if(aHeadlineImgs.size() != 0 && mCurrentPage != 0) {
			aHeadlineImgs.each(function(theIndex) {
				$('#headline').css("background-image", "url("+$(this).attr("src")+"?" + Math.random() + ")");
				$(this).remove();
			});
		} else {
			$('#headline').css("background", "none");
		}
	};
	
	/** 
	 * Callback function invoked when a page successfully finish loading.
	 * 
	 * @param theData the content of the page successfully loaded
	 */
	var pageLoaded = function(theData) {
		$('#content').html(theData);
		parseCustomTags();
		
		$('#content').fadeIn("fast");
		showLoading(false, Waker.closeToc);
		updateNavBar();
		
		document.title = mPages[mCurrentPage].title;
	};
	
	/**
	 * TODO: write docs :)
	 */
	var parseCustomTags = function() {
		// <w:end />
		$('#content w\\:end').html('<span class="end-mark">&diams;</span>');
		
		// <w:quote> content </w:quote>
		$("#content w\\:quote").each(function(theIndex, theValue) { 
		    $(this).html('<blockquote><span class="quote-start">&#8220;</span>'+$(this).html()+'<span class="quote-end">&#8221;</span></blockquote>');
		});
		
		// <w:qr> url </w:qr>
		// TODO: use standalone JS lib to generate code.
		$("#content w\\:qr").each(function(theIndex, theValue) {
			$(this).html('<img src="https://chart.googleapis.com/chart?chs='+( $(this).attr('width') || '100')+'x'+( $(this).attr('height') || '100')+'&cht=qr&chl='+encodeURI($(this).html())+'&chld=L|1&choe=UTF-8" title=""/>');
		});
	};
	
	/**
	 * Callback function invoked when a page could not be loaded. It happens
	 * when a wrong entry is placed in the "config.html" file.
	 * 
	 * @param theData erro data provided by jQuery? 
	 */
	var pageNotLoaded = function(theData) {
		mCurrentPage = mLastViewedPage;
		
		// TODO: show a nice modal telling what happened.
		//alert("Page not loaded!");
	};
	
	/**
	 * Loads the content of a page. If the requested page exists, the callback
	 * <code>pageLoaded()</code> is invoked when the loading process is done. In
	 * case of error, <code>pageNotLoaded()</code> is invoked.
	 * 
	 * @param thePage url of the page to be loaded.
	 */
	var loadPage = function(thePage) {
		showLoading(true);
		
		$('#content').fadeOut("fast", function() {
			$.ajax({
				url: Waker.CONTENT_FOLDER + thePage,
				cache: false,
				context: document.getElementById("content"),
			}).success(pageLoaded).error(pageNotLoaded);			
		});
	};
	
	var showLoading = function(theStatus, theCallback) {
		if(mSpinner == null) {
			var aOpts = {
			  lines: 17, // The number of lines to draw
			  length: 7, // The length of each line
			  width: 2, // The line thickness
			  radius: 10, // The radius of the inner circle
			  rotate: 0, // The rotation offset
			  color: '#000', // #rgb or #rrggbb
			  speed: 1, // Rounds per second
			  trail: 60, // Afterglow percentage
			  shadow: false, // Whether to render a shadow
			  hwaccel: false, // Whether to use hardware acceleration
			  className: 'spinner', // The CSS class to assign to the spinner
			  zIndex: 2e9, // The z-index (defaults to 2000000000)
			  top: 'auto', // Top position relative to parent in px
			  left: 'auto' // Left position relative to parent in px
			};
			var aTarget = document.getElementById('loading');
			mSpinner = new Spinner(aOpts).spin(aTarget);	
		}
		
		if(theStatus) {
			$('#loading').fadeIn("fast", theCallback);
		} else {
			$('#loading').fadeOut("fast", theCallback);
		}
	};
	
	/**
	 * Callback invoked when the index finish loading.
	 * 
	 * @param theData index content (a piece of html code contaning several links, one for each content page).
	 */
	var indexLoaded = function(theData) {
		mPages.splice(0);
		
		$("header").append('<div id="toc" style="display: none;">' + theData + '</div>');
		
		$("#toc a").each(function(theIndex) {
			var aObj = $(this);
			mPages[theIndex] = {
					url: 	aObj.attr("href"),
					title: 	aObj.attr("title"),
					desc: 	aObj.text(),
					thumb: 	aObj.data().thumb
			};
			console.info("Article #"+theIndex+" added "+JSON.stringify(mPages[theIndex]));
		});
		
		buildTocPanel();
		Waker.coverPage();
	};
	
	/**
	 * Callback invoked when the index could not be loaded. It will happen only if the "config.html"
	 * file is missing.
	 */
	var indexNotLoaded = function() {
		// TODO: do something better...
		alert("Index not loaded!");
	};
		
	/**
	 * Jumps to the next page in the magazine.
	 * 
	 * @return <code>true</code> if there is a next page, even though it might be an invalid one (wrong url, for instance); <code>false</code> if the is no next page to jump to.
	 */
	this.nextPage = function() {
		var aRet = false;
		
		if(mCurrentPage < mPages.length - 1) {
			mLastViewedPage = mCurrentPage;
			mCurrentPage++;
			loadPage(mPages[mCurrentPage].url);
			aRet = true;
		}
		
		return aRet;
	};
	
	/**
	 * Jumps to the prev page in the magazine. The prev page is the one that is right before the current page
	 * in the index. This prev page *is not* the last visited page.
	 * 
	 * @return <code>true</code> if there is a prev page, even though it might be an invalid one (wrong url, for instance); <code>false</code> if the is no prev page to jump to.
	 */
	this.prevPage = function() {
		var aRet = false;
		
		if(mCurrentPage > 0) {
			mLastViewedPage = mCurrentPage;
			mCurrentPage--;
			loadPage(mPages[mCurrentPage].url);
			aRet = true;
		}
		
		return aRet;
	};
	
	/**
	 * Jumps to the cover page (first page in the index).
	 */
	this.coverPage = function() {
		mLastViewedPage = mCurrentPage;
		mCurrentPage 	= 0;
		loadPage(mPages[mCurrentPage].url);
	};

	/**
	 * Jumps to any page in the index.
	 * 
	 * @param theNumber page number in the index: the first page is 0 (cover), the second one is 1, and so on.
	 * @return <code>true</code> if the informed index number is valid, even though the page in that position might not be valid (wrong url, for instance); <code>false</code> if the informed index number is invalid (out of range).
	 */
	this.gotoPage = function(theNumber) {
		var aRet = false;

		if(theNumber >= 0 && theNumber <= mPages.length - 1 && theNumber != mCurrentPage) {
			mCurrentPage = theNumber;
			loadPage(mPages[mCurrentPage].url);
			aRet = true;
		}
		
		return aRet;
	}
	
	/**
	 * 
	 * 
	 */
	this.openToc = function() {
		$.pageslide({ href: '#toc' });
	};
	
	/**
	 * 
	 * 
	 */
	this.closeToc = function() {
		$.pageslide.close();
	};
	
	var createNavBar = function() {
		$('#next-button').on('click', function() {
			Waker.nextPage();
		});
		
		$('#prev-button').on('click', function() {
			Waker.prevPage();
		});
		
		$('#toc-button').on('click', function() {
			Waker.openToc();
		}).fadeIn();
	};
	
	var enableTouchGestures = function() {
		$('#wrapper').on('swipe dragend ', function (theEvent) {
			theEvent.preventDefault();
			
			if(theEvent.direction == "right") {
				Waker.prevPage();
			} else if(theEvent.direction == "left") {
				Waker.nextPage();
			}
	    });
		
		$('#wrapper').on(Waker.config.gestureOpenToc, function (theEvent) {
			theEvent.preventDefault();
			Waker.openToc();
	    });
	};
	
	/**
	 * Starts Waker, loading the pages meta data and displaying the cover page.
	 */
	this.init = function() {
		createNavBar();
		updateNavBar();
		
		if(Waker.config.enableTouchGestures) {
			enableTouchGestures();
		}
		
		$.ajax({
			url: Waker.CONTENT_FOLDER + "config.html",
			context: document.body
		}).success(indexLoaded).error(indexNotLoaded);
	};
};

$(function() {
	Waker.init();
});