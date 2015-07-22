var metronomik = window.metronomik || {};

metronomik.search = function (containerId, types, callback) {

	var $container = $("#" + containerId).empty(),
		$search,
		$input,
		$results,
		searchTimer,
		currentRequest;

	function search(query) {

		showLoading();

		if (searchTimer) {
			clearTimeout(searchTimer);
		}

		if (currentRequest) {
			currentRequest.abort();
		}

		if (!!query) {

			$search.addClass('active');

		} else {

			$search.removeClass('active');
			clearResults();
			return;
		}

		if (query.length < 3) {
			return;
		}

		searchTimer = setTimeout(function () {

			// http://www.rdio.com/developers/docs/web-service/methods/catalog/ref-searchsuggestions/
			currentRequest = R.request({
				method: "searchSuggestions",
				content: {
					query: query,
					types: types || "Artist,Album,Track,User"
				},
				success: function (response) {
					showResults(response.result);
				},
				error: function (response) {
					console.log("error: " + response.message);
				},
				complete: function() {
					currentRequest = null;
					hideLoading();
				}
			});

		}, 500);

	}

	function showLoading() {

	}

	function hideLoading() {

	}

	function makeResultSection(name, items) {

		var $result = jQuery(document.createElement('section'))
			.attr({ 'class': 'media m-search-results-' + name.toLowerCase() })
			.appendTo($results);

		jQuery(document.createElement('h3'))
			.text(name)
			.appendTo($result);

		var $list = jQuery(document.createElement('ul'))
			.attr({ 'class': 'list-group'})
			.appendTo($result);


		$.each(items, function (i, item) {

			var $listItem = jQuery(document.createElement('li'))
                    .attr({'class': 'list-group-item'})
					.appendTo($list),

                $listItemMediaImageBlock = jQuery(document.createElement('div'))
                    .attr({'class': 'media-left'})
                    .appendTo($listItem),

				$listItemImage = jQuery(document.createElement('img'))
					.attr({
                        'class': 'media-object',
						src: item.icon,
						width: 64
					})
					.appendTo($listItemMediaImageBlock),

                $listItemMediaTextBlock = jQuery(document.createElement('div'))
                    .attr({'class': 'media-body media-middle'})
                    .appendTo($listItem),

                $listItemTextTrackTitle = jQuery(document.createElement('h4'))
                    .attr({'class': 'media-heading'})
					.text(item.name)
					.appendTo($listItemMediaTextBlock),

                $listItemTextTrackArtist = jQuery(document.createElement('p'))
                    .text(item.artist)
                    .appendTo($listItemMediaTextBlock);
		});

	}

	function showResults(results) {

		clearResults();

		var albums		= [], // a http://www.rdio.com/developers/docs/web-service/types/album/
			artists		= [], // r http://www.rdio.com/developers/docs/web-service/types/artist/
			labels		= [], // l http://www.rdio.com/developers/docs/web-service/types/label/
			playlists	= [], // p http://www.rdio.com/developers/docs/web-service/types/playlist/
			tracks		= [], // t http://www.rdio.com/developers/docs/web-service/types/track/
			users		= []; // s http://www.rdio.com/developers/docs/web-service/types/user/

		for(var i = 0; i < results.length, result = results[i]; i++) {

			switch(result.type) {

				case 'a':
					albums.push(result);
					break;
				case 'r':
					artists.push(result);
					break;
				case 'l':
					labels.push(result);
					break;
				case 'p':
					playlists.push(result);
					break;
				case 't':
					tracks.push(result);
					break;
				case 'u':
					users.push(result);
					break;
			}

		}

		if(artists.length > 0)
			makeResultSection('Artists', artists);

		if (albums.length > 0)
			makeResultSection('Albums', albums);

		if (labels.length > 0)
			makeResultSection('Labels', labels);

		if (playlists.length > 0)
			makeResultSection('Playlists', playlists);

		if (tracks.length > 0)
			makeResultSection('Tracks', tracks);

		if (users.length > 0)
			makeResultSection('Users', users);

	}

	function clearResults() {
		$results.empty();
	}

	function reset() {

		$input.val("");
		search("");

	}

	//----------------------------------------------------
	// Search
	//----------------------------------------------------

	$search = jQuery(document.createElement('div'))
		.attr({ 'class': 'm-search' })
		.appendTo($container);

	//----------------------------------------------------
	// Input
	//----------------------------------------------------

	$input = jQuery(document.createElement('input'))
		.attr({
			'class': 'form-control',
			'type': 'text',
			'placeholder': 'Search...'
		})
		.appendTo($search);

	//----------------------------------------------------
	// Results
	//----------------------------------------------------

	$results = jQuery(document.createElement('div'))
		.attr({ 'class': 'm-search-results' })
		.on("mouseenter", "li", function () {

			$("li", $results).removeClass("active");
			$(this).addClass("active");

		}).on("mouseleave", "li", function () {

			$(this).removeClass("active");

		})
		.appendTo($search);

	//----------------------------------------------------
	// Input interactions
	//----------------------------------------------------

	$input.on("keyup", function (evt) {

		var $this = $(this);

		if (evt.keyCode === 27)
            $this.val("");

		var query = $(this).val();

		search(query);

	});

}