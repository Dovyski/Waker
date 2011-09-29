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
	
	var mCurrentPage 	= 0;
	var mLastViewedPage = 0;	
	var mPages 			= [];

	var buildIndexWindow = function() {
		var i, aToc = $("#toc div");
		
		aToc.empty();
		
		for(i = 0; i < mPages.length; i++) {
			aToc.append('<a class="toc-dossier" href="javascript:void(0)" onclick="Waker.gotoPage('+i+')">' +
							'<div class="toc-dossier-number">'+(i == 0 ? "C" : i)+'</div>'+
							'<img class="toc-thumb" src="'+mPages[i].thumb+'" />'+
							'<h1>'+mPages[i].title+'</h1>'+
							'<p>'+mPages[i].desc+'</p>'+
						'</a>');
		}
	};
	
	var updateNavBar = function() {
		//$('.logo-small').hide();
		
		if(mCurrentPage == mPages.length - 1) {
			$('#nav-next').fadeOut();
		} else {
			$('#nav-next').fadeIn();
		}
		
		if(mCurrentPage == 0) {
			$('#nav-prev').fadeOut();
			$('#nav-cover').fadeOut();
			$('#dossier-number').fadeOut();
		} else {
			$('#nav-prev').fadeIn();
			$('#nav-cover').fadeIn();
			$('#dossier-number').html("<p>"+mCurrentPage+"</p>").fadeIn();
		}
	};
	
	var updateHeadlineImage = function() {
		$('#page-content img.img-headline').each(function(theIndex) {
			$('#headline').css("background-image", "url("+$(this).attr("src")+")");
			$(this).remove();
		});
	};
	
	var pageLoaded = function(theData) {
		$('#headline').empty();
		$('#page-content').html(theData);
		$('#content .dossier-headline-arrow').fadeIn();
		
		updateNavBar();
		updateHeadlineImage();
		
		if(mCurrentPage == 0) {
			// Current page is cover. In this case, load the content into
			// the headline div, overlaying the background image, and do not
			// use the page-content div.
			$('#headline').html($('#page-content').html());
			$('#page-content').empty();
			$('#content .dossier-headline-arrow').fadeOut();
		}
	};
	
	var pageNotLoaded = function(theData) {
		mCurrentPage = mLastViewedPage;
		
		// TODO: show a nice modal telling what happened.
		alert("Page not loaded!");
	};
	
	var loadPage = function(thePage) {
		// TODO: loading anim?
		$('#toc').fadeOut();
		
		$.ajax({
			url: Waker.CONTENT_FOLDER + thePage,
			context: document.getElementById("page-content"),
		}).success(pageLoaded).error(pageNotLoaded);
	};
	
	var indexLoaded = function(theData) {
		mPages.splice(0);
		
		$("body").append('<div id="cindex" style="display: none;">' + theData + '</div>');
		
		$("#cindex a").each(function(theIndex) {
			var aObj = $(this);
			mPages[theIndex] = {
					url: 	aObj.attr("href"),
					title: 	aObj.attr("title"),
					desc: 	aObj.text(),
					thumb: 	aObj.data().thumb
			};
			console.info("Article #"+theIndex+" added "+JSON.stringify(mPages[theIndex]));
		});
		
		buildIndexWindow();
		Waker.coverPage();
	};
	
	var indexNotLoaded = function() {
		// TODO: do something better...
		alert("Index not loaded!");
	};
	
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
	
	this.coverPage = function() {
		mLastViewedPage = mCurrentPage;
		mCurrentPage 	= 0;
		loadPage(mPages[mCurrentPage].url);
	};
	
	this.gotoPage = function(theNumber) {
		var aRet = false;
		
		if(theNumber >= 0 && theNumber <= mPages.length - 1 && theNumber != mCurrentPage) {
			mCurrentPage = theNumber;
			loadPage(mPages[mCurrentPage].url);
			aRet = true;
		}
		
		return aRet;
	}
	
	this.toggleToc = function() {
		$("#toc").fadeToggle();
	};
	
	this.init = function() {
		updateNavBar();
		
		$.ajax({
			url: Waker.CONTENT_FOLDER + "config.html",
			context: document.body,
		}).success(indexLoaded).error(indexNotLoaded);
	};
};

$(function() {
	Waker.init();
});