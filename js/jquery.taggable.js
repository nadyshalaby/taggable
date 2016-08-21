(function($){
	$.fn.taggable = function (options){
		var opts = $.extend(true, {},{
			autoCompleteSearch : true,
			autoCompleteSmartDisplay : true,
			searchByValue : false,
			allowOtherWords : false,
		},options);
		
		// basic markup for tags
		var markup ={
			tagsList : '<div class="tags-wrapper"><ul class="tags clear"><li class="tag"><input class="tag-editor" type="text" /></li></ul></div>',
			tag : '<li class="tag"><span class="tag-view"><span class="tag-close">&times;</span>{content}</span></li>',
			autoCompleteList : '<ul style="left:{left}; " class="auto-comp-list">{content}</ul>',
			autoCompleteElement : '<li class="auto-comp-elem">{content}</li>',
			selectOptionElement : '<option value="{content}" selected ></option>',
			tagTempEditorElement : '<li class="tag"><input class="tag-temp-editor" type="text" /></li>'
		} ;
		
		// caching the actual select element and options
		var doc = $(document);
		var selectElement = $(this).hide();
		var optionElements = selectElement.find('option');

		// grapping an array with all the options values
		var optionValues = optionElements.map(function(index, elem) {
			return $(this).val().trim();
		});

		// grapping an array with all the options text
		var optionTexts = optionElements.map(function(index, elem) {
			return $(this).text().trim();
		});

		var currentTags = null;

		selectElement.after(markup.tagsList);

		// caching the tags list and other elements 
		var tagsListElement = $('ul.tags');
		var tagElements = tagsListElement.find('li.tag');
		var tagEditorElement = tagsListElement.find('li.tag > input.tag-editor');
		var tagLastEditor = tagEditorElement;
		
		

		// Events for tagEditorElement 
		tagEditorElement.on('keydown',function(evt) {
			var $this = $(this);
			var tagValue = $this.val();
			var currentTag = $this.closest('li.tag');

			if (evt.keyCode == 13 ){
				if (($.inArray(tagValue.trim(), currentTags) === -1) && tagValue.trim() !== '' &&
				    ($.inArray(tagValue.trim(), ((opts.searchByValue)? optionValues : optionTexts)) !== -1 || opts.allowOtherWords)){
					var tagHTML = replaceBy(markup.tag,tagValue.trim());
					currentTag.before(tagHTML);
					$this.val('');
					updateSelectElement();
				}
				evt.preventDefault();
			}else if(evt.keyCode == 8 && tagValue === '') { // check if user want to edit previous tag
				// grap the last tag element
				var lastTag = tagsListElement.find('li.tag').not(currentTag[0]).last();
				$this.val(lastTag.find('span.tag-view').text().trim().replace(/×/,''));
				lastTag.remove();
				// prevent the default to stop removing the last letter
				evt.preventDefault();
			}

			currentTags = getCurrentTags();
		});


		// Events for autoComplete Processing and setting the markup
		tagEditorElement.on('keyup focusin',function(evt) {
			$this = $(this);
			if(opts.autoCompleteSearch){
				$('ul.auto-comp-list').remove();
				var list = replaceBy(markup.autoCompleteList,searchBy($this.val().trim()));
					list = replaceBy(list,$this.position().left + "px",'{left}');
				tagsListElement.after(list);
			}
			tagLastEditor = $this.closest('li.tag');
		});

		//Events for tag close
		doc.on('click', 'ul.tags li.tag span.tag-view span.tag-close', function(event) {
			$(this).closest('li.tag').remove();
			currentTags = getCurrentTags();
			tagsListElement.click();
			updateSelectElement();
		});

		//Events for tag temp editor;
		doc.on('dblclick', 'ul.tags li.tag span.tag-view', function(event) {
			$('ul.auto-comp-list').remove();
			var tempTag = $(markup.tagTempEditorElement);
			var tempEditor = tempTag.find('input.tag-temp-editor');
			tempEditor.val($(this).text().trim().replace(/×/,''));
			$(this).closest('li.tag').replaceWith(tempTag);
			tempEditor.focus();
			tagLastEditor = tempTag;
			tagsListElement.click();
		});

		doc.on('keydown','ul.tags li.tag input.tag-temp-editor',function(evt){
			var $this = $(this);
			var tagValue = $this.val();
			var currentTag = $this.closest('li.tag');

			if (evt.keyCode == 13 ){
				if (($.inArray(tagValue.trim(), currentTags) === -1) && tagValue.trim() !== '' &&
				    ($.inArray(tagValue.trim(), ((opts.searchByValue)? optionValues : optionTexts)) !== -1 || opts.allowOtherWords)){
					var tagHTML = replaceBy(markup.tag,tagValue.trim());
					currentTag.replaceWith($(tagHTML));
					updateSelectElement();
				}
				evt.preventDefault();
			}else if(evt.keyCode == 8 && tagValue === '') { // check if user want to edit previous tag
				currentTag.remove();
				$('ul.auto-comp-list').remove();
			}
			currentTags = getCurrentTags();
		});

		doc.on('keyup focusin','ul.tags li.tag input.tag-temp-editor',function(evt) {
			$this = $(this);
			if(opts.autoCompleteSearch){
				$('ul.auto-comp-list').remove();
				var list = replaceBy(markup.autoCompleteList,searchBy($this.val().trim()));
					list = replaceBy(list,$this.position().left + "px",'{left}');
				tagsListElement.after(list);
			}
			tagLastEditor = $this.closest('li.tag');
		});
		

		//Events for autoCompleteElement
		doc.on('click', 'ul.auto-comp-list li.auto-comp-elem', function(event) {
			$this = $(this);
			var tagHTML = replaceBy(markup.tag,$this.text().trim());
			if(tagLastEditor.find('input.tag-temp-editor').length){
				tagLastEditor.replaceWith($(tagHTML));
			}else{
				var currentTag = tagEditorElement.closest('li.tag');
				currentTag.before(tagHTML);
				tagEditorElement.val('');
			}
			$this.closest('ul.auto-comp-list').remove();
			tagsListElement.click();
			currentTags = getCurrentTags();
			updateSelectElement();
		});

		// Events For Smart Display Mode
		if(opts.autoCompleteSmartDisplay){
			doc.on('click', function(event) {
				if ($(event.target).closest('div.tags-wrapper').length === 0){
					$('ul.auto-comp-list').remove();
					tagLastEditor = tagEditorElement;
				}
			});
		}

		// Events for tagsListElement 
		tagsListElement.on('click', function(event) {
			tagLastEditor.focus();
				if(opts.autoCompleteSearch){
					tagLastEditor.keyup();
				}
		});

		// autoComplete Smart Display Detection
		if(!opts.autoCompleteSmartDisplay){
			tagsListElement.click();
		}

		// Helper functions 
		
		function searchBy(word){
			var searchResults = $(((opts.searchByValue)? optionValues : optionTexts)).not(currentTags).get(); 
			var results = '';
			if(word === ''){
				$.each(searchResults,function(index, el) {
					results += replaceBy(markup.autoCompleteElement,el);
				});
				return results;
			}

			$.each(searchResults,function(index, el) {
				if(el.match(new RegExp(word,"i"))){
					results += replaceBy(markup.autoCompleteElement,el);
				}
			});
			return results;
		}

		function replaceBy(str , replacement, search ){

			if(!search){
				search = "{content}";
			}
			
			return str.replace(new RegExp(search,'ig'),replacement);
		}

		function getCurrentTags() {
			var tags = tagsListElement.find('li.tag span.tag-view').map(function(index, elem) {
				return $(this).text().trim().replace(/×/,'');
			});

			return tags.length ? tags : [];
		}

		function updateSelectElement(){
			var results = '';
			$.each(getCurrentTags(),function(index, el) {
				var ind = $.inArray(el, optionTexts);
				// get the corresponding optionValue if the choise is found
				if(ind !== -1){
					el = optionValues[ind];
				}

				results += replaceBy(markup.selectOptionElement,el);
			});
			selectElement.html(results);
		}

		return $(this);
	};

})(jQuery);