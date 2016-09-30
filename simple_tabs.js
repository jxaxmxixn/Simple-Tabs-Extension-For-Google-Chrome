/**
* Simple Tabs V1.0
* by Jamin Szczesny 2016
* JxAxMxIxN@gmail.com
*
* Simply displays easily readable tabs when you've got a lot of tabs open in chrome.
*
* Gives you ability focus, reload, duplicate, rearrange, mute, pin, close(one, all, not, some, after, before)
*
* More features coming, maybe... I simply needed to write a baseline I could quickly do anything with in the future...
*
**/

//setTimeout(function(){ //FOR PROFILING... Speed id fine, could be faster but i'm not complaining... yet...

		chrome.extension.onRequest.addListener(function(request) {                    
			if (request.questions) {                                                                  
				alert('yesss!')                                                   ;
			}
		});


$.noConflict();
jQuery(document).ready(function($){

	//Create wrapper for holding all the tabs....
	var tabs_wrapper = create_tabs_wrapper();
	//Perform initial load of the tabs...
	load_tabs();
	//Gets all tabs and updates their data via update_tab() function...
	query_tabs();
	//Fires and returns a single tabs tab data when a change that tab occurs in chrome
	chrome.tabs.onUpdated.addListener(update_tab);
	
	
	function create_tabs_wrapper(){
		return $('<div class="tabs">')
				.sortable({
					placeholder: "drop-placeholder",
					containment: "parent",
					cursor: "move",
					beforeStop: confirm_tab_drop_location
				})
				.on("sortupdate", function(event, ui){
					tab_id = tabID(ui.item[0]);
					new_position = $(ui.item[0]).parent().children().index(ui.item[0]);
					chrome.tabs.move(tab_id, {index:new_position});
					refresh_tabs();
				})
				.selectable({
					autoRefresh: false //speeds up initial load time
				})
				.disableSelection();
				
	}
						
								
	//Initial load\creation of the tabs...
	function load_tabs(){
		chrome.tabs.query({currentWindow:true}, function(tabs){
			//loop through each tab
			for(var tab in tabs){

				var favIconUrl = fix_favIconUrl(tabs[tab].favIconUrl);
				 
				var tab_state = tabs[tab].active ? 'active' : 'inactive';
				
				//create each tab element along with it's children...
				tabs_wrapper.append(
					$('<div class="tab-wrapper ui-state-default" tab_id="'+tabs[tab].id+'">')
						.append([
							$('<div class="tab '+tab_state+'" title="'+tabs[tab].title+'">')
								.attr('tab_index', tabs[tab].index)
								.click(function(){
									$(this).parent().toggleClass('ui-selected');
								})
								.dblclick(function(){
									chrome.tabs.update(tabID($(this).parent()), {active:true});		
								})
								.append([
									$('<img class="icon" src="'+favIconUrl+'" />'),	
									$('<span class="page-title">'+tabs[tab].title+'</span>')
								]),
							$('<div class="close" title="Close Tab">')
								.click(function(){
									chrome.tabs.remove(tabID($(this).parent()));
									$(this).parent().remove();
								})
								.append(
									$('<div class="x">x</div>')
								),
							$('<div class="select-button" title="Select \\ Deselect">')
								.click(function(){
									$(this).parent().toggleClass('ui-selected');
								})
								.append(
									$('<div class="plus">&#43;</div>')
								),								
						])	
				);
			}
			//clear body and append new tab elements...
			$('#content').empty().append(tabs_wrapper);
		});
	};

	//uses data from chrome.tabs.query...
	function update_tab(id, info, tab){
		var wrapper = $('.tab-wrapper[tab_id='+id+']');

		if(typeof info.title != 'undefined' && info.title){
			wrapper.children('.page-title').html(info.title);
			wrapper.children('.tab').attr('title', info.title);
		}
		
		if(typeof info.favIconUrl != 'undefined')
			info.favIconUrl 
				? wrapper.children('.icon').attr('src', fix_favIconUrl(info.favIconUrl)) 
				: icon.attr('src') ;
		
		if(typeof info.audible != 'undefined')
			info.audible === true
				? wrapper.addClass('audible') 
				: wrapper.removeClass('audible');
	
		if(typeof info.muted != 'undefined')
			info.muted === true
				? wrapper.addClass('muted') 
				: wrapper.removeClass('muted');
				
		if(typeof info.mutedInfo != 'undefined')
			info.mutedInfo.muted === true
				? wrapper.addClass('muted') 
				: wrapper.removeClass('muted');
			
		if(typeof info.pinned != 'undefined')
			info.pinned === true
				? wrapper.addClass('pinned') 
				: wrapper.removeClass('pinned');
				
		if(typeof info.status != 'undefined')
			info.status == 'loading' 
				? wrapper.addClass('loading') 
				: wrapper.removeClass('loading');
				
		if(typeof tab != 'undefined')
			tab 
				? wrapper.insertBefore($(wrapper.parent().children()[tab.index])) 
				: null ;		
	}
	
	//gets all the tabs in the window and loops through them to update via update_tab()
	function query_tabs(tab_ids = []){	
		chrome.tabs.query({currentWindow:true}, function(tabs){
			tabs.forEach(function(info){
				update_tab(info.id, info);
			});
			// display tabs in 1 to 4 columns depending on how many tabs there are...	
			cc = Math.round(($(tabs).length + 0.5) / 4);
			cc = ( cc > 4 ) ? 4 : cc || 1;
			$('.tabs').css('column-count', cc);
			
			//so we load super fast first, wait a half second to run this
			setTimeout(function(){$('.tabs').selectable( "refresh" )}, 500);
		});
	}
	
	
	//checks to see if tab can be dropped in current location
	function confirm_tab_drop_location(event, ui){
		php = ui.placeholder.prev().prev();
		phn = ui.placeholder.next();
		can_drop_here = false;
		//can we drop the element in the desired location?
		ui.item.hasClass("pinned")
			? php.hasClass("pinned") || php.length == 0
				? can_drop_here = true //all good to drop
				: event.preventDefault()
			: !phn.hasClass("pinned") || phn.length == 0
				? can_drop_here = true //all good to drop
				: event.preventDefault()
			;
			
		return can_drop_here;
	}
	
	//returns tab id of .twb-wrapper elements... duh!
	function tabID(tab_wrapper){
		return parseInt( $(tab_wrapper).attr('tab_id') );
	}

	//sets any chrome only (they're inaccessible to my knowledge) icon to the default chrome icon...
	function fix_favIconUrl(favIconUrl){
		return (!favIconUrl || favIconUrl.charAt(0) == 'c') 
							? 'chrome://favicon' 
							: favIconUrl;
	}
	

	
	//###############################
	//############## MENU BELOW ####################
	//##############################

	// Handles right clicks...
	$('body').contextmenu(function(event) {
		
		$('body').css({minHeight:$('#menu').height() + 50 ,minWidth:$('#menu').width() + 200 });
		//$('#menu').css({left:'', top:''});
		tab_wrapper = $(event.originalEvent.path).first().parents('.tab-wrapper');
		tab_wrapper.hasClass('ui-selected') 
			? null 
			: tab_wrapper.addClass('ui-selected with-menu');
		
		$('#menu').menu().position({
			my:'left top', of:event, collision:"fit fit", within:"body"
		}).draggable('option', 'containment', 'parent').show().focus().focusout(close_menu);
		
		event.preventDefault(); 
		event.stopPropagation();
		
	});
	
	
	$('#menu')
		.append([
			$('<span class="title x" title="Close Menu">x</span>'),
			$('<li class="title">With Selected...</li>'),
			$('<li><mark>\u27f3</mark> Reload</li>')
				.click(function(){
					$('.tab-wrapper.ui-selected').each(tab_reload);	
				}),
			$('<li><mark>&#x2398;</mark> Duplicate</li>')
				.click(function(){
					$('.tab-wrapper.ui-selected').each(tab_duplicate);	
				}),
			$('<li><mark>&#128204;</mark> Pin\\Unpin</li>')
				.click(function(){
					$('.tab-wrapper.ui-selected').each(tab_pin);	
				}),
			$('<li><mark>&#128266;</mark> Mute\\Unmute</li>')
				.click(function(){
					$('.tab-wrapper.ui-selected').each(tab_mute);	
				}),
			$('<li><mark>\u25c4</mark> Move to front</li>')
				.click(function(){
					$('.tab-wrapper.ui-selected').each(tab_prepend);	
				}),
			$('<li><mark>\u25ba</mark> Move to end </li>')
				.click(function(){
					$('.tab-wrapper.ui-selected').each(tab_append);	
				}),
			$('<li><mark>&#9447;</mark> Close Selected</li>')
				.click(function(){
					$('.tab-wrapper.ui-selected').each(tab_remove);	
				}),
			$('<li><mark>!&#9447;</mark> Close NOT Selected</li>')
				.click(function(){
					$('.tab-wrapper:not(.ui-selected)').each(tab_remove);	
				}),
			$('<li><mark>&#9447;\u25ba</mark> Close all after</li>')
				.click(function(){
					$('.tab-wrapper.ui-selected').last().nextAll().each(tab_remove);	
				}),
			$('<li><mark>\u25c4&#9447;</mark> Close all before</li>')
				.click(function(){
					$('.tab-wrapper.ui-selected').first().prevAll().each(tab_remove);	
				}),
		])
		.draggable()
		.on('click blur', close_menu)
		.focusout(close_menu);
		
		
		
		function close_menu(){
			$('.ui-selected.with-menu').removeClass('ui-selected with-menu');
			$('body').css({minHeight:'',minWidth:''});
			$('#menu').css({left:0,top:0}).hide();	
			refresh_tabs();
		}
		
		function refresh_tabs(){
			setTimeout(function(){$('.tabs').selectable( "refresh" );}, 500);
		}
		
		function tab_reload(){
			chrome.tabs.reload( tabID($(this)) );
		}
		function tab_duplicate(){
			chrome.tabs.duplicate( tabID($(this)) );
		}
		function tab_pin(){
			var pin = $(this).hasClass('pinned');
			pin == true
				? $(this).removeClass('pinned') 
				: $(this).addClass('pinned');
			chrome.tabs.update( tabID($(this)), {pinned:!pin} );
		}
		function tab_mute(){
			var mute = $(this).hasClass('muted');
			mute == true
				? $(this).removeClass('muted') 
				: $(this).addClass('muted');
			chrome.tabs.update( tabID($(this)), {muted:!mute} );
		}
		function tab_prepend(){
			$('.pinned').length > 0
				? $(this).insertAfter($('.pinned').last()).trigger('sortupdate', {item:$(this)})
				: $('.tabs').prepend($(this)).trigger('sortupdate', {item:$(this)});
		}
		function tab_append(){
			$('.tabs').append($(this)).trigger('sortupdate', {item:$(this)});
		}	
		function tab_remove(){
			chrome.tabs.remove( tabID($(this)) );
			$(this).remove();
		}	
		
		
});

//}, 15000);